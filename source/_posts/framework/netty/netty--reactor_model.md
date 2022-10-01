---
title: Netty -- Reactor模型的应用
subtitle: 关于Netty如何使用Reactor模型应对大量连接的原理
cover: http://res.mrdear.cn/blog-netty.png
author: 
  nick: 屈定
tags:
  - Netty
categories: 框架与中间件
urlname: framework-netty-reactor-model
date: 2018-08-07 05:08:49
updated: 2020-12-12 13:24:57
---
本文会详细分析该模式的使用场景以及在Netty中的使用形式也就是Netty的线程模型，另外本文着重于原理，需要对Netty相关组件有一定了解。

## 什么是Reactor模式？

Reactor是什么？这个概念博主认为很重要，Reactor是一种编程模式，该模式主要有多路复用器+事件驱动所构成，并不是某一框架或者应用独有。

Reactor使用一个多路复用器管理所有的事件，当事件被触发时,多路复用器会发出通知，Reactor线程则自动的执行对应的逻辑，这种模式就是Reactor模式。相较于传统的BIO模式，一个连接请求对应一条线程处理，虽然使用池化技术复用线程，但是应对大量请求仍然需要大量的线程来做支持，在Reactor模式下大量的请求会被多路复用器所管理，当请求可以被处理时，由事件通知才会转到对应的线程去处理，这种事件驱动极大的提高了CPU的利用率。

Reactor模式有着众多不同的形式，理解不同的形式要理解后端是如何处理请求的：当后端接收到一个请求，简化下会做以下四个操作，所谓的不同形式是这些操作具体在哪个线程中处理，下面详细分析：

1. 建立连接
2. 读取数据 
3. 业务操作 
4. 写回数据 

### 单线程Reactor模式
![](http://res.mrdear.cn/1533135180.png?imageMogr2/thumbnail/!100p)
单线程Reactor模式意思是以上`1，2，3，4`操作都在一个Reactor线程中执行，虽然Reactor的读取写回不会造成阻塞，但是业务操作就很可能造成阻塞，并且单线程对CPU的利用顶多到100%，因此处理能力是有限的，对于小量连接情况下问题不大，对于大量链接情况下，单个NIO线程因处理能力优先会导致连接大量超时，由于超时重试机制，导致系统负载越来越重。
因此演变出多线程Reactor模式。
另外值得一提的是Redis使用的就是单线程Reactor模式，因此当某一个命令执行时间过长比如keys操作，就会使得Redis阻塞，不过大多数命令都是非常迅速的，单线程Reactor模式也使得Redis的结构变得简单，这也符合官方所提倡的小巧、精炼。

### 多线程Reactor模式
![](http://res.mrdear.cn/1533219452.png?imageMogr2/thumbnail/!100p)
从图可以看出多线程Reactor模式在单线程模式下把`3`业务操作（decode，compute，encode）等放到单独的线程池中处理，保证Reactor线程不会阻塞，而Reactor线程仍然要处理` 1，2，4`三个操作，因此处理能力受限于Reactor线程的处理，Reactor虽然是事件机制的异步处理，但是其承担连接负载量上来时仍然承受很大压力，因此主从Reactor模式被提了出来。

### 主从Reactor模式
![](http://res.mrdear.cn/1533220953.png?imageMogr2/thumbnail/!100p)
相比多线程Reactor模式，主从Reactor模式下把步骤`2 读取，4 写回`两个操作放在**从Reactor线程池**中执行，那么**主Reactor线程**，也就是Acceptor只负责获取连接，建立之后将其注册到**从Reactor线程**中，因此大大提高了负载能力。这种模式的核心是**使用多个Reactor线程来分担连接**，同时为了避免并发问题还要保证一个Reactor线程可以处理多个连接，一个连接只能注册一个Reactor线程上。在Netty中一般推荐使用这种模式，主Reactor线程为Netty中的Boss线程，从Reactor线程为Worker线程，另外使用业务线程池处理对应的业务逻辑，这三者构成了Netty的线程模型。

到这里可以简单总结一下，无论是单线程Reactor还是多线程以及主从Reactor，本质上Reactor做的都是同一个事情，多线程是因为事情比较多，单个忙不过来，分发给多个Reactor做，主从则是将事情进行分类，轻量级的事情单独使用一个完成，复杂级别的使用多个完成，以保证最优先响应，套用极客时间的一张图，可以很清晰的描述Netty中主从Reactor下，每个Reactor所承担的职责。

![image-20201212133453587](http://res.mrdear.cn/uPic/image-20201212133453587_1607751293.png-default)

## Netty线程模型中的角色

从上面对于Reactor模式的分析，近而理解Netty线程模型的设计，在Netty中为了实现Reactor模式抽象出几个角色：
- Channel：表示客户端与服务端建立起的连 接通道
- EventLoop：不断的循环多路复用器中事件的一个Reactor线程，对于NIO多路复用器则为`java.nio.channels.Selector`
- ChannelPipeline：业务逻辑执行链封装，比如对消息的decode，compute，encode等
这三个实现也是Netty线程模型的核心，接下来逐一分析。

### Channel
`Channel`的本质是对操作系统产生的Socket的映射，并且提供绑定到Selector多路复用器上的能力。
在这里可以顺便复习下基础知识，当一个请求传递过来时，到达的是数据链路层，然后IP层，再接着是传输层，在传输层这里被转换为对应的TCP/UDP协议，操作系统为了给应用提供统一的不同协议的封装操作，所以产生了Socket，换句话说Socket接口是TCP/IP网络的API接口函数。
Socket属于内核对象，因此应用层要使用时必须通过操作系统提供的接口访问，具体流程当建立socket连接时，操作系统会产生一个文件操作符给应用，应用拿到文件操作符之后相当于拿到了对应的socket，然后每次调用相应的函数，比如read，close等都需要把对应的文件描述符传递给操作系统，操作系统再定位到具体的socket完成调用。
而`Channel`实际上就是应用层对文件描述符的一个封装，然后利用其它机制做了更高一层的封装比如异步，多路复用等等。

### EventLoop
`EventLoop`字面意思是事件循环，对应图中的Reactor线程，以`NioEventLoop`为例，实现原理是**使用一个单线程，一个任务队列，一个多路复用器Selector，该线程不断地执行任务，并且监控多路复用器所产生的事件**，由于`EventLoop`是单线程，因此在使用时往往要注意耗时操作，阻塞操作都不要放到`EventLoop`中，其适合处理耗时短并且简单的任务。

在Netty中推荐使用`主从Reactor模式`，因此最佳实践是Boss配置1个Reactor线程，因为服务端Socket监听端口只能被一个Socket所占有，并且连接的建立是十分迅速的，因此Boss这里不会有性能问题。Worker根据自己的业务配置多个Reactor线程，当Boss建立起连接之后，也就是得到了对应的`SocketChannel`，会把该Channel交给Worker线程处理，这里的原因是读取与写入往往是耗时操作，虽然Selector多路复用器是线程安全的设计，但是如果一个Selector管理大量的Channel，会造成自身任务繁重，一些处理不过来的Channel会超时断开或者重试，因此众多Worker的目的就是为了平衡Selector的压力。
由于`EventLoop`不能被阻塞，但是业务操作具有太多的不可控性，因此往往还会引入`ThreadPool`业务线程池来分担Worker的压力，`ThreadPool`主要是处理用户的业务，此时Worker只负责处理读取，解码，编码，写回等简单高效的任务，进一步提高系统的负载能力，这也是主从Reactor模式的设计目的。

**清单1：netty中主从Reactor模式（不包含业务线程池）**
```java
  ServerBootstrap bootstrap = new ServerBootstrap();

    // 初始化处理线程
    EventLoopGroup boss = new NioEventLoopGroup(1);
    EventLoopGroup worker = new NioEventLoopGroup(16);
    // 设置服务
    bootstrap.group(boss, worker);
    // ...
```

### ChannelPipeline
`ChannelPipeline`是聚合了`ChannelHandler`的管道，本质上是一个职责链路，在Worker线程中会对每一个Channel执行其所对应的pipeline链，完成整个生命周期。
我画了一个不太好看的图描述整个结构，其中蓝色表示`ChannelInboundHandler`，红色表示`ChannelOutboundHandler`，绿色则承担两个角色，而每个Handler又会使用`ChannelHandlerContext`封装起来，在`ChannelPipeline`中组装成双向链表。
![](http://res.mrdear.cn/1533604786.png?imageMogr2/thumbnail/!100p)

一个请求被Accept之后要从Head开始流转所有的`ChannelInboundHandler`，然后再从Tail开始流转所有的`ChannelOutboundHandler`。


### 如何引入业务线程池？
上述Netty关于主从Reactor模式的实现并没有包含业务线程池，在开发中由于业务的复杂性，往往要针对项目的业务维护一套业务线程池，好处是做业务隔离，不会由于单条业务出错而阻塞对应的Reactor线程，那么这个业务线程池该怎么做？
业务处理一般使用的是`ChannelInboundHandler`封装的一个处理逻辑，也就是上述Pipeline链中的`BizHandler`，以Dubbo的做法为例，Dubbo使用了一个`com.alibaba.dubbo.remoting.transport.dispatcher.all.AllChannelHandler`，该类会把对应的Worker产生的事件放入到业务线程池中处理，这样就完成了`Reactor`线程到`ThreadPool`业务线程池的转换。

**清单2：Reactor线程到业务线程**
```java
  public void disconnected(Channel channel) throws RemotingException {
        ExecutorService cexecutor = getExecutorService();
        try {
            cexecutor.execute(new ChannelEventRunnable(channel, handler, ChannelState.DISCONNECTED));
        } catch (Throwable t) {
            throw new ExecutionException("disconnect event", channel, getClass() + " error when process disconnected event .", t);
        }
    }

    public void received(Channel channel, Object message) throws RemotingException {
        ExecutorService cexecutor = getExecutorService();
        try {
            cexecutor.execute(new ChannelEventRunnable(channel, handler, ChannelState.RECEIVED, message));
        } catch (Throwable t) {
          .....
        }
    }
```
业务处理完成之后写回数据是在`com.alibaba.dubbo.remoting.transport.netty.NettyChannel`中进行，该写回实际上是委托Netty的`NioAcceptedSocketChannel`，然后封装一个任务放入到Worker中执行，此时就完成了从`ThreadPool`业务线程回到`Reactor`线程的切换。

**清单3：业务线程到Reactor线程**
```java
public void send(Object message, boolean sent) throws RemotingException {
        super.send(message, sent);

        boolean success = true;
        int timeout = 0;
        try {
            // 这里委托给Netty的NioAcceptedSocketChannel执行写回
            ChannelFuture future = channel.write(message);
            if (sent) {
                timeout = getUrl().getPositiveParameter(Constants.TIMEOUT_KEY, Constants.DEFAULT_TIMEOUT);
                success = future.await(timeout);
            }
            Throwable cause = future.getCause();
            if (cause != null) {
                throw cause;
            }
        } catch (Throwable e) {
            throw new RemotingException(this, "Failed to send message " + message + " to " + getRemoteAddress() + ", cause: " + e.getMessage(), e);
        }
        .....
    }
```

## 参考
[蚂蚁通信框架实践](https://mp.weixin.qq.com/s/JRsbK1Un2av9GKmJ8DK7IQ)
[netty源码分析之pipeline](https://www.jianshu.com/p/6efa9c5fa702)
