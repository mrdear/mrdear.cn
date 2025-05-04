---
title: 实践 -- 响应式编程改造DAG
subtitle: LLM这里按照传统DAG思路，写了一个编排框架，但是在推理模型问世后，单个推理模型耗时能达到120s以上，按照以往阻塞式编程的方式，线程池很快被占满，导致服务不可用，因此需要改造为响应式链路。
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - 实战    
categories: 实战总结
urlname: work-reactive-dag
date: 2025-05-03 11:37:36
updated: 2025-05-04 08:46:00
---
## 前言

LLM这里按照传统DAG思路，写了一个编排框架，但是在推理模型问世后，单个推理模型耗时能达到120s以上，按照以往阻塞式编程的方式，线程池很快被占满，导致服务不可用，因此需要改造为响应式链路。

## 概念

首先先理清楚几个最核心的问题：

> 1\. 无论怎么改，链路耗时问题始终摆在哪里，模型该120s返回还是120s返回，为什么改成响应式会有效果？

这个问题需要明确，这120s无法通过编程来消除，响应式的改造是为了提高系统吞吐率。举个例子：客服小二在一对一语音服务的时候，同一时间只能服务一个客户。客服小二在面对消息聊天窗口时，却可以一对多进行服务，这里就是资源利用率在不同形式下的不同表现。那么响应式改造要做的就是将一对一变成后者一对多异步形式。

原本线程需要阻塞等待模型120s返回后才能继续下一步。响应式改造后，模型请求任务提交后，线程就可以释放，等数据返回后再主动通知接下来的流程可以继续。

> 2\. 那么这120s的时间跑哪里去了？

这部分时间被操作系统的I/O多路复用给“消耗”掉了。 操作系统的I/O多路复用（如Linux的epoll、macOS的kqueue、Windows的IOCP）是响应式编程的核心基础之一，应用程序通过`select`/`poll`/`epoll`等机制告诉操作系统："我对这些网络连接的变化感兴趣，有变化时通知我"，然后一个线程可以监控成千上万个连接，只有当某个连接有事件发生时才被唤醒处理，也就是callback机制。

> 3\. callback和future，promise还有协程又有什么区别？

&#x20;callback是基础，future和promise是抽象，协程是语言级别对异步编程的简化。由于使用回调或复杂的Future/Promise链进行异步编程可能导致代码复杂、难以理解和调试（即所谓的‘回调地狱’），协程应运而生，它提供了一种更简洁、更符合人类直觉的方式来编写异步代码。



## 改造核心点

### **任务节点返回Future**

之前的任务是直接返回结果，本次改造为返回future，让任务有充分自主能力选择同步或者异步。

```java
public interface FlowTaskInstance {

    /**
     * 执行当前的任务
     * @param taskNode 对应的节点
     * @param context 调度上下文
     * @return 执行结果
     */
    CompletableFuture<TaskOutputResult> execute(TaskNode taskNode, FlowContext context);

}

```

针对必须同步的任务，需要用线程池控制并发度，或者说隔离。避免调度链路出现同步等待情况。

```java
public abstract class AbstractFlowTaskSyncInstance extends AbstractTaskInstance {

    protected ExecutorService executorService;

    public AbstractFlowTaskSyncInstance(FlowEventBus eventBus, ExecutorService executorService) {
        super(eventBus);
        this.executorService = executorService;
    }

    @Override
    protected CompletableFuture<TaskOutputResult> internalExecute(TaskNode taskNode, FlowContext context, TaskOutputResult result) {
        // 需要异步化,杜绝同步等待
        return CompletableFuture.supplyAsync(() -> {
            executeSync(taskNode, context, result);
            return result;
        }, executorService);
    }

    /**
     * 同步执行的逻辑
     * @param taskNode 对应的节点
     * @param context 对应的上下文
     */
    abstract void executeSync(TaskNode taskNode, FlowContext context, TaskOutputResult result);

}
```

### 调度逻辑变更

使用递归式遍历节点，而非阻塞队列等待式。需要三个队列管控。核心逻辑参考：`fun.libx.flow.FlowFutureExecuteGraph#processQueue`

```java
    /**
     * 存储已完成的节点
     */
    private Set<String> completedNodes = ConcurrentHashMap.newKeySet();

    /**
     * 存储已添加到队列的节点ID，防止重复添加
     */
    private Set<String> queuedNodes = ConcurrentHashMap.newKeySet();

    /**
     * 使用队列进行BFS遍历
     * 使用ConcurrentLinkedQueue确保线程安全
     */
    private Queue<TaskNode> runningQueue = new ConcurrentLinkedQueue<>();
```

节点执行合并错误和超时逻辑处理。超时主要依赖一个Schedule线程池进行监控，到达时间后强制结束任务。节点处理逻辑则参考：`fun.libx.flow.FlowFutureExecuteGraph#executeNode`。

```java
    /**
     * 节点超时逻辑控制
     */
    private static void timeoutSchedule(TaskNode node, CompletableFuture<TaskOutputResult> executeFuture) {
        Long timeout = FlowDataKeys.NODE_TIMEOUT_SECOND.getDataOr(node, 20L);

        delayer.schedule(() -> {
            if (executeFuture.isDone()) {
                return;
            }
            executeFuture.completeExceptionally(new TimeoutException("task timeout"));
        }, timeout, TimeUnit.SECONDS);
    }
```

### MVC采取异步
MVC返回这里也需要异步化，否则就是同步等待，导致MVC的线程池反而成为了卡点。Spring MVC很好的支持了异步，只需要返回CompletableFuture，整个链路即为响应式链路。
```java
    @GetMapping("/execute-simple")
    public CompletableFuture<JSONObject> executeSimpleFlow() {
        // Create a flow context
        ExtendedFlowContext context = new ExtendedFlowContext();
        context.setFlowId(UUID.randomUUID().toString());

        // Create and execute the flow
        FlowFutureExecuteGraph graph = new FlowFutureExecuteGraph(
                DAG, context, executorService, router);

        // Return the future directly
        return graph.bfsExecute()
                .thenCompose(r -> {
                    JSONObject response = new JSONObject();
                    response.put("flowId", context.getFlowId());
                    response.put("status", "completed");
                    response.put("message", "Flow execution completed successfully");
                    return CompletableFuture.completedFuture(response);
                });
    }
```

## 改造成果

首先DAG如下图所示，Dealy节点是一个发起HTTP，5S之后才返回的节点。由于是并发逻辑，那么整个DAG耗时至少是5s。

![](https://resource.libx.fun/pic/2025/05/20250504192638093.png)



**线程池设置**：

Tomcat线程池：10个Thread

HTTP Client：默认大小，设置每个地址允许200个连接(ConnPreRoute)，避免连接数限制。

调度线程池：1个Thread

超时控制线程池：1个Thread



**压测**：

Postman免费版本最多设置100个user，那就按照100个user不断请求，压测3min。可以看到QPS达到14，平均响应耗时在5773ms，在调度初期由于链接建立，系统初始化，线程分配，存在一定的波动，后面就趋近于稳定状态。

![](https://resource.libx.fun/pic/2025/05/20250504192659792.png)

使用Visual监控进程状况，线程使用率还是很低，一直处于park状态(采样是按照1s一次)，证明系统还有很大的容量上线。

![](https://resource.libx.fun/pic/2025/05/20250504192715624.png)

## 项目代码
[https://github.com/mrdear/reactor-flow](https://github.com/mrdear/reactor-flow)

