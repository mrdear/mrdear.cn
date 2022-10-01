---
title: Java -- 线程池使用不当引发的死锁
subtitle: 由于CompletableFuture与线程池混合使用不当,造成了线程池的死锁现象
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  -  Java
categories: 夯实Java基础
urlname: java_threadpool_completablefuture
date: 2021-02-20 22:54:00
updated: 2021-02-20 22:54:04
---

前段时间线上写了一个DAG调度框架，整个DAG依赖关系以及执行依赖JDK8提供的CompletableFuture，运行一段时间后，生产出现了业务死锁问题，经过一番排查后，发现是使用不当造成，遂记录该篇文章希望对你有帮助。

## 问题场景回顾

主要业务是发起DAG图的执行，如下图所示，用户发起一个DAG任务请求，该请求到达Planner后，异步去启动一个DAG任务，当执行到DAG时，该DAG会异步遍历整个图，然后阻塞的获取最后结果。

![image-20210217160324691](http://res.mrdear.cn/uPic/image-20210217160324691_1613832332.png-default)

原有业务系统太过于复杂，因此我将相关逻辑提取了出来，简述为以下代码表示，其中关键链路如下：

- 用户对一个同步操作发起异步调用
- 该同步操作本质上是异步调用，同步等待
- 两者使用了同一个线程池

```java
public class Test {

    private static ThreadPoolExecutor executor = new ThreadPoolExecutor(10, 10, 30L, TimeUnit.SECONDS, new ArrayBlockingQueue<>(20));

    public static void main(String[] args) throws ExecutionException, InterruptedException {


        for (int i = 0; i < 20; i++) {
          // 模拟用户想要异步执行一个任务
            CompletableFuture.supplyAsync(Test::work, executor);
        }
		// 检查状态，会发现queue一段时间后，一直稳定在一个值，即线程池不再执行新任务
        while (executor.getQueue().size() > 0) {
            System.out.printf("executor queue=%s%n", executor.getQueue().size());
            Thread.sleep(1000);
        }
    }
	
  // 模拟一个异步调用，但同步返回的任务
    public static int work() {
        try {
            Integer result = CompletableFuture.supplyAsync(Test::workInnerTask, executor).get();
            System.err.println(String.format("%s thread result=%s", Thread.currentThread().getName(), result));
            return result;
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }
        return -1;
    }

    private static int workInnerTask() {
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return ThreadLocalRandom.current().nextInt();
    }

}

```

该代码在运行一段时间后，发生了死锁，具体现象为：ThreadPool中queue在不停的累计，但所有的core thread全部处于WAITING状态。也就是说线程池中的每一个线程都在等待某一个信号，从而导致queue中的任务无法消费。

![image-20210220171444574](http://res.mrdear.cn/uPic/image-20210220171444574_1613832332.png-default)

## 问题原因

从现象来看，问题的原因是线程池中core线程执行的任务被阻塞了，一直无法完成，所以新的任务不停的往queue中累积。那为什么线程池中的core线程会被阻塞？

首先找出与线程池相关的代码，确定线程池中执行了哪些任务：

```java
// 线程池执行了Test::work这个任务
CompletableFuture.supplyAsync(Test::work, executor);

// 线程池执行了Test::workInnerTask这个任务
Integer result = CompletableFuture.supplyAsync(Test::workInnerTask, executor).get();
```

比较特殊的是 **Test::work** 这个任务的完成依赖于**Test::workInnerTask**，那么需要**Test::workInnerTask**执行完毕**Test::work**才能完成，然而线程池是先将**Test::work**放入到queue，再将**Test::workInnerTask**放入到queue，那么只要前者足够多到将core线程池全部占满，就会导致后者一直无法完成，前者由于等待后者也无法完成，造成死锁。

## 解决问题

原因定位到后，解决思路就很清晰了。

第一种方式，将**Test::work**放入到另一个独立的线程池中执行。两边线程池互不影响，那么在一个queue上就不会产生阻塞。

第二种方式，去除**Test::work**中的get()阻塞，让其返回CompletableFuture，也就是异步调用就全链路执行异步，没必要中间出现同步代码。

## 总结

这个简化版案例代码，可以很容易找到具体原因，但是在复杂业务系统中，调用链路错综复杂，由于线程池的复用很容易引发类似问题，如何才能避免这种问题呢？

博主想了许久，没有找到靠谱的结论，不过有两点准则在日常开发中可以参考：

1.业务系统尽量不要使用公共线程池，不同的业务使用不同的线程池隔离

2.阻塞操作想要变异步时，使用单独线程池，而不是公共线程池

如果您有更好的建议，欢迎分享。