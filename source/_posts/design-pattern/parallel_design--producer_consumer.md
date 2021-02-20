---
title: 并行设计模式--生产者消费者
subtitle: 关于生产者消费者模式以及Java中的阻塞队列学习。
cover: http://imgblog.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-producer-consumer
date: 2018-06-09 01:06:01
updated: 2018-06-09 01:06:03
---
`Producer-Consumer`与其说是模式，更不如说是一种思想，这种思想在很多模式中都有相应的体现，比如线程池，对象池，MQ等等。
`Producer-Consumer`的本质是在生产者与消费者之间引入一个通道（Channel暂且理解为一个队列）,该通道主要用于**控制生产者与消费者的相对速率**，尽可能的保证生产的Product尽快被消费，另一方面对**二者进行解耦**：生产者将生产的数据放入通道，消费者从相应的通道取出数据进行消费，生产者与消费者在各自的线程中，从而使双方的处理互相不影响。

## Producer-Consumer中的角色

1. Product：即生产者线程锁需要提供的产品。
2. Producer：生产者，负责产生对应的产品，其把产生的产品放入到队列Channel中
3. Consumer：从队列Channel中获取对应的产品，获取之后对其进行业务处理。
4. Channel：在`Producer-Consumer`中最重要的就是这个Channel，Channel是两者共享的区域，Channel有着调控生产者与消费者相对速率的功能，比如**当生产者速度大于消费者**，就会造成Channel中任务积压，那么此时生产者就要放缓速度，反映到代码就是Channel让Producer线程休眠。反之**当消费者速度大于生产者**，就会造成Channel为空，此时消费者就要暂时停下来，反映到代码就是Channel让Consumer线程休眠。那么可以看出在设计模式中`Channel`的作用就是**解耦生产者与消费者，并调节相关的速率**，利用`Channel`的堆积能力进而提高系统的吞吐量。

## Channel的实现方案

### BlockingQueue
阻塞队列`BlockingQueue`是一种常见的Channel实现方案，在JDK中提供了多种`BlockingQueue`的数据结构，本文将着重对这些数据结构分析。

**BlockingQueue接口总览**

| 方法 | 抛出异常 | 返回特殊值 | 一直阻塞 | 超时退出 |
| --------   | :----:  | :----: |  :----: |  :----: |
| 入队方法 | add(e) | offer(e) | put(e) | offer(e,time,unit) |
| 出队方法 | remove() | poll() | take() | poll(time,unit) |
| 检查方法 | element() | peek() | 不可用 | 不可用 |

下面对其实现类进行分析。

#### ArrayBlockingQueue
`ArrayBlockingQueue`是使用数组实现的队列，提供头指针与尾指针用于控制对应的入队出队操作，并且使用单个重入锁与两个`Condition`进行并发控制。
```java
// 队列本身
final Object[] items;
// 头指针
int takeIndex;
// 位指针
int putIndex;
// 队列内元素数量,也因此此队列有界,虽然int最大有21亿多.
int count;

// 重入锁
final ReentrantLock lock;
// 用于控制消费者线程的条件
private final Condition notEmpty;
// 用于控制生产者线程的条件
private final Condition notFull;
```

**take操作**
take是属于消费者的操作，那么对于消费者来说要有以下几个步骤：
1. 获取到独占锁
2. 队列如果为空，为空则主动await。
3. 队列不为空，则出队，出队后队列中一定有空位（该数据结构为数组，因此一定会有一个格子是空的），因此唤醒生产者生产。

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    // 操作1： 获取独占锁
    lock.lockInterruptibly();
    try {
        // 操作2：队列为空则主动await
        while (count == 0)
            notEmpty.await();
        // 操作3：出队，见下面的代码详情
        return dequeue();
    } finally {
        lock.unlock();
    }
}
```
对应的出队操作之后则需要唤醒对应的生产者线程
```java
private E dequeue() {
    // 操作3：出队操作实际上是把数组中对应元素返回，然后数组置为NULL
    final Object[] items = this.items;
    @SuppressWarnings("unchecked")
    E x = (E) items[takeIndex];
    items[takeIndex] = null;
    if (++takeIndex == items.length)
        takeIndex = 0;
    count--;
    if (itrs != null)
        itrs.elementDequeued();
    // 操作3：唤醒生产者线程
    notFull.signal();
    return x;
}
```
**put操作**
put是属于生产者的操作，那么对于生产者来说要有以下几个步骤：
1. 获取独占锁，拿到操作队列的权限
2. 如果队列已满（ArrayBlockingQueue为有界队列），则主动await。
3. 如果队列未满，则入队操作，入队后队列肯定有元素，所以还需要唤醒消费者来消费。

```java
public void put(E e) throws InterruptedException {
    checkNotNull(e);
    final ReentrantLock lock = this.lock;
    // 操作1：获取独占锁
    lock.lockInterruptibly();
    try {
        //操作2：队列已满主动休眠
        while (count == items.length)
            notFull.await();
        // 操作3：入队操作，见下方详细分析
        enqueue(e);
    } finally {
        lock.unlock();
    }
}
```
对应的入队操作之后则需要主动唤醒消费者线程。
```java
private void enqueue(E x) {
    // 操作3：入队实际上是往数组中添加一个元素，因为是固定容量数组，扩容之类的都不需要考虑
    final Object[] items = this.items;
    items[putIndex] = x;
    if (++putIndex == items.length)
        putIndex = 0;
    count++;
    // 操作3：唤醒消费者线程
    notEmpty.signal();
}
```

`ArrayBlockingQueue`的实现比较简单，其本质是依赖独占锁`ReentrantLock`保证出入队的线程安全，然后把独占锁上等待的线程利用`Condition`分为生产者线程与消费者线程，入队生产操作则唤醒消费者来消费，出队消费操作则唤醒生产者来生产，构成一个环形链路。

#### LinkedBlockingQueue
`LinkedBlockingQueue`的队列实现是基于**单链表**，其容量默认为`Integer.MAX_VALUE`，一般认为其是无界队列，其多线程并发控制使用了两把重入锁，读操作与写操作使用不同的重入锁管理。
```java
     // 该单链表最大长度
     private final int capacity;
     // 该单链表实际长度,不同于数组可以根据下标计算,因此这里需要额外记录
     private final AtomicInteger count = new AtomicInteger();
     // 头指针,其item为null
    transient Node<E> head;
     // 尾指针，其next为null
    private transient Node<E> last;
     // 读操作锁
    private final ReentrantLock takeLock = new ReentrantLock();
     // 用于消费者线程操作
    private final Condition notEmpty = takeLock.newCondition();
     // 写操作锁
    private final ReentrantLock putLock = new ReentrantLock();
     // 用于生产者线程操作
    private final Condition notFull = putLock.newCondition();
```
**take操作**
相比`ArrayBlockingQueue`，其唤醒策略更加复杂，笔者将其简化为以下几个步骤：
1. 获取到独占锁
2. 队列中无元素，则主动await
3. 队列中有元素，则出队操作
4. 出队后队列中还有剩余元素，则唤醒其他**消费者线程**进行消费。
5. 附加操作：当队列满时所有生产者线程可能都已await，因此需要对这种情况下出队之后唤醒生产者线程

```java
public E take() throws InterruptedException {
    E x;
    int c = -1; // 本次操作标识
    final AtomicInteger count = this.count;
    final ReentrantLock takeLock = this.takeLock;
    // 操作1：获取独占锁
    takeLock.lockInterruptibly();
    try {
        // 操作2：队列中无元素，主动休眠
        while (count.get() == 0) {
            notEmpty.await();
        }
        // 操作3：出队，出队是链表节点的指针引用切换，就不贴代码了
        x = dequeue();
        
        c = count.getAndDecrement();
        // 操作4：队列中还有元素则唤醒其他消费者再次消费
        if (c > 1)
            notEmpty.signal();
    } finally {
        takeLock.unlock();
    }
    // 附加操作：c为出队前的队列长度，当c等于队列容量说明之前队列是满的状态，那么所有的生产者都可能休眠中，因此这里需要唤醒。
    if (c == capacity)
        signalNotFull();
    return x;
}
```
**put操作**
put操作可以简化为以下几个步骤：
1. 获取独占锁
2. 当队列已满则当前线程需要主动await
3. 队列未满则执行入队操作
4. 入队后如果队列还有容量，则继续唤醒生产者生产
5. 附加操作：当c为0时，也就是入队之前队列为0，此时消费者有可能都在await状态，因此入队之后需要唤醒对应的消费者进行消费。

```java
public void put(E e) throws InterruptedException {
    if (e == null) throw new NullPointerException();
    int c = -1;
    Node<E> node = new Node<E>(e);
    final ReentrantLock putLock = this.putLock;
    final AtomicInteger count = this.count;
    // 操作1： 获取独占锁
    putLock.lockInterruptibly();
    try {
        // 操作2：当队列已满，则生产者主动await
        while (count.get() == capacity) {
            notFull.await();
        }
        // 操作3：出队操作
        enqueue(node);

        c = count.getAndIncrement();
        // 操作4：出队后队列仍有容量，则唤醒其他生产者进行生产
        if (c + 1 < capacity)
            notFull.signal();
    } finally {
        putLock.unlock();
    }
    // 附加操作：当c为0时，也就是入队之前队列为0，此时消费者有可能都在await状态，因此入队之后需要唤醒对应的消费者进行消费。
    if (c == 0)
        signalNotEmpty();
}
```

在`ArrayBlockingQueue`中，速率的调控是通过生产者唤醒消费者，消费者唤醒生产者互相作用来实现的调控。
在`LinkedBlockingQueue`中，则是生产者在队列未满的情况下唤醒生产者，也就是finally之前的` if (c + 1 < capacity) notFull.signal();`，消费者在队列不为空的时候唤醒消费者，对应的是`if (c > 1) notEmpty.signal();` 
但是存在两种特殊情况： 
1. 假设队列满了，生产者可能全部处于await状态，那么此时就需要消费者出队后唤醒生产者。也就是take操作return之前的`signalNotFull()`
2. 假设队列为空，消费者可能全部处于await状态，那么此时就需要生产者生产之后唤醒消费者，也就是put操作return之前的`signalNotEmpty()`

#### SynchronousQueue
`SynchronousQueue`是同步队列，意思是其**生产者与消费者之间直接传递数据**，取消掉了Channel这一共享缓冲区，这是一种同步的直接交付方式，为了更容易的理解，读者可以认为其是一个内部队列固定长度为1的阻塞队列实现，也因此在put操作之后该队列就已经满，因此必须有对应的take操作，否则该队列无法继续生产元素,则对应的生产线程会被休眠进入WAITING状态。在消费者执行take操作时，当队列为空则对应的消费者线程会被休眠，直到有数据时才唤醒对应的消费者线程。
![](http://imgblog.mrdear.cn/1528517858.png?imageMogr2/thumbnail/!100p)


更详细的文章 [Java并发包中的同步队列SynchronousQueue实现原理](http://ifeve.com/java-synchronousqueue/)

## Producer-Consumer的应用实例
生产者消费者模型属于基础模式，其之上的应用非常多，这里举几个常见的例子，方便读者理解。

### 线程池
对于JDK所提供的线程池，本质是**管理消费者的工厂**，其角色对应关系如下：
Product：Runnable任务
Producer：使用线程池的客户端
Consumer：ThreadPool中维护的线程
Channel：基于`BlockingQueue`实现的队列。
这样来看的话，线程池就很好理解了吧，至于Java中多种线程池，本质上只是`BlockingQueue`的不同而产生消费效果不同。

### 连接池（对象池）
关于对象池在之前的文章有过详细的介绍[并行设计模式--Thread Specific Storge模式](https://mrdear.cn/2018/05/20/experience/parallel_design_patterns--thread_specific_storge/)。
对象池本质是**管理生产者，并支持可回收的工厂**，其角色对应关系如下：
Product：池中的对象
Producer：该对象池中创建对象的工厂
Consumer：向该对象池借对象的客户端
Channel：基于`BlockingQueue`实现的队列。

针对的主体不同，是线程池与对象池根本的区别。

## 参考
关于生产者消费者模式一个实战的案例
[聊聊并发——生产者消费者模式](http://www.infoq.com/cn/articles/producers-and-consumers-mode)