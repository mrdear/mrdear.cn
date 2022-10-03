---
title: Java--CAS操作分析
subtitle: Java中有关CAS操作的理解与分析
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - Java
  - JUC
categories: 夯实Java基础
urlname: java_cas
date: 2018-04-06 12:04:52
updated: 2018-04-06 12:04:55
---
<!-- toc -->
- - - - -
CAS操作在Java中的应用很广泛,比如`ConcurrentHashMap`,`ReentrantLock`等,其常被用来解决独占锁对线程阻塞而导致的性能低下问题,是高效并发必备的一种优化方法.

## JMM
一般的理解Java内存模型为主内存与工作内存,如下图所示:
![Java内存模型](http://res.mrdear.cn/1522837030.png)
工作内存是为了提高效率,在内部缓存了主内存中的变量,避免每次都要去主内存拿,但是变量被修改之后写回主内存的时机是不可控的,因此就会带来并发下变量一致性问题.对此Java提供了以下关键字:
>  volatile: 保证多线程之间的可见性,可以理解为其操作都是直接操作主内存的变量,每次读直接从主内存读,每次修改完立即写回主内存.
>  synchronized: 提供的锁机制在进入同步块时从主内存读取变量,同步块结束时写回变量到主内存.


## synchronized所带来的新问题.
**这里的分析是不考虑JVM一系列的优化措施,比如锁消除,锁粗化,自旋之类的处理优化.**
排除优化措施的话synchronized本质上可以理解为悲观锁思想的实现,所谓的悲观锁认为每次访问临界区都会冲突,因此每次都需要加锁,而当没有拿到锁时线程是处于阻塞状态的.从Runnable到Blocked,然后被唤醒后再从Blocked到Runnable,这些操作耗费了不少计算机资源,因此这种悲观锁机制是并发的一种实现,但不是高效并发的实现.

## CAS实现原子性操作
CAS操作大概有如下几步:
1. 读取旧值为一个临时变量
2. 对旧值的临时变量进行操作或者依赖旧值临时变量进行一些操作
3. 判断旧值临时变量是不是等于旧值,等于则没被修改,那么新值写入.不等于则被修改,此时放弃或者从步骤1重试.

那么步骤三实际上就是比较并替换,这个操作需要是原子性的,不然无法保证比较操作之后还没写入之前有其他线程操作修改了旧值.那么这一步实际上就是CAS(**CompareAndSwap**),其是需要操作系统底层支持,对于操作系统会转换为一条指令,也就是自带原子性属性,对于Java中则是`sun.misc.Unsafe#compareAndSwapObject`这种类型的操作.另外在Java中CAS的实现需要**可见性的支持**,也就是修改值后必须立即同步到主内存,否则这个修改没有意义,其他线程读取到的仍然是旧值.
CAS相比无优化下的synchronized,最大的优势就是**无阻塞**,也就是没了线程阻塞与唤醒的消耗,性能自然是很高.

### AtomicXXX与CAS
Java中提供了`AtomicXXX`一系列原子类,这里以`AtomicInteger`为例,大概结构如下:
```java
public class AtomicInteger extends Number implements java.io.Serializable {
    private static final Unsafe unsafe = Unsafe.getUnsafe();
    private static final long valueOffset;
    // 使用volatile修饰,解决可见性问题
    private volatile int value;
}
```
这些类一般内部包裹一个用`volatile`修饰的真实值,其解决的是内存可见性与指令重排序的问题.而原子性操作则是由`unsafe`提供的一系列指令来完成.以`java.util.concurrent.atomic.AtomicInteger#getAndIncrement`为例,其解决的是i++的问题,在`AtomicInteger`中对于此类操作都转到了unsafe的操作.
```java
    public final int getAndIncrement() {
        return unsafe.getAndAddInt(this, valueOffset, 1);
    }
```
Unsafe中实现的策略,为了更好的理解笔者调整了一些代码顺序.正好对应上述CAS的三个步骤.
```java
 public final int getAndAddInt(Object var1, long valueOffset, int addValue) {
    int expect;
    do {
      // 操作1 得到旧值
      expect = this.getIntVolatile(var1, valueOffset);
      // 操作1 计算新值
      int newValue = expect + addValue;
      // 操作3,比较,如果旧值没改变则更新其为新值,否则重试.这种实现也被成为自旋CAS
    } while(!this.compareAndSwapInt(var1, valueOffset, expect, newValue));
    return expect;
  }
```

### ReentrantLock与CAS
`ReentrantLock`是Java应用层面实现的一种独占锁机制,因此比起JDK1.5之前的`synchronized`有很明显的性能提升.其加锁的代码利用的就是CAS算法.其内部利用了一个`state`字段,该字段为0时代表锁没有被获取,为1时则代表有线程已经获取到了锁,为n时则代表该锁被当前线程重入了n次.
```java
      final void lock() {
            // 判断当前对象所处的状态,为0则锁没被获取,因此当前线程独占,并修改state为1.那么进来的其他线程加入到等待队列中.
            if (compareAndSetState(0, 1))
                // 当前线程独占
                setExclusiveOwnerThread(Thread.currentThread());
            else
                // 其他线程排队
                acquire(1);
        }
```
那么可重入机制是怎么实现的呢?
在`acquire(1)`方法中会调用`tryAcquire(1)`方法再次尝试获得锁,其又会转到`java.util.concurrent.locks.ReentrantLock.Sync#nonfairTryAcquire`方法,在这个方法中重入的关键就是对**state自增**,state为n就代表重入了n次.
```java
        final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            // c == 0 则代表锁已经被释放,因此直接获取并独占即可
            if (c == 0) {
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            // 重入实现的关键点,当前线程等于已获得独占锁的线程
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                // 设置新的state,假设state为2就代表被当前线程重入了两次.
                setState(nextc);
                return true;
            }
            return false;
        }
```
那么锁的释放实际上就是对`state`字段的递减,并且当减到0时对等待队列中的线程进行唤醒.
```java
    public final boolean release(int arg) {
        // tryRelease会对state字段进行操作
        if (tryRelease(arg)) {
            Node h = head;
            if (h != null && h.waitStatus != 0)
                // 唤醒其他线程
                unparkSuccessor(h);
            return true;
        }
        return false;
    }
```
`tryRelease`是对state字段的递减过程.
```java
        protected final boolean tryRelease(int releases) {
            int c = getState() - releases;
            if (Thread.currentThread() != getExclusiveOwnerThread())
                throw new IllegalMonitorStateException();
            boolean free = false;
            // 当减为0,代表锁已经空闲,因此要释放独占线程.
            if (c == 0) {
                free = true;
                setExclusiveOwnerThread(null);
            }
            // 更新新的state
            setState(c);
            return free;
        }
```
简单总结来说`ReentrantLock`实现独占的重入锁是通过CAS对`state`变量的改变来代表不同的状态来实现的,从而实现了获取锁与释放锁的高性能.


## CAS总结

### CAS在多线程问题中起到了什么作用?
多线程问题归根结底要解决的是`可见性`,`有序性`,`原子性`三大问题,大家都知道JVM提供的`volatile`可以保证可见性与有序性,但是无法保证原子性,换句话说 `volatile + CAS实现原子性操作 = 线程安全 = 高效并发`,那么CAS就是用来实现这个操作的原子性.

### CAS与乐观锁是什么关系?
乐观锁是一种思想,其认为冲突很少发生,因此只在最后写操作的时候`加锁`,这里的加锁不一定是真的锁上,比如CAS一般就用来实现这一层加锁.

### ABA问题
ABA问题指的是多个线程同时执行,那么开始时其获得的值都是A,当一个线程修改了A为B,第二个线程修改了B为A,那么第三个线程修改时判断A仍然是A,认为其没有修改过,因此会CAS成功.
ABA问题产生的影响取决于你的业务是否会因此受到影响.如果有影响那么解决思路一般是使用版本号。在变量前面追加上版本号，每次变量更新的时候把版本号加一，那么A－B－A 就会变成1A-2B－3A。
在JDK1.5之后提供了`AtomicStampedReference`类来解决ABA问题,解决思路是保存元素的引用,引用相当于版本号,是每一个变量的标识,因此在CAS前判断下是否是同一个引用即可.
```java
    public boolean compareAndSet(V   expectedReference,
                                 V   newReference,
                                 int expectedStamp,
                                 int newStamp) {
        Pair<V> current = pair;
        return
            expectedReference == current.reference &&
            expectedStamp == current.stamp &&
            ((newReference == current.reference &&
              newStamp == current.stamp) ||
             casPair(current, Pair.of(newReference, newStamp)));
    }
```

- - - - -

如有错误,还请指出,以免误人子弟.