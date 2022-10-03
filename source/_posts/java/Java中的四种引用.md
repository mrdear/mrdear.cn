---
title: Java--Java中的四种引用
subtitle: 学习Java中四种引用的异同.
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - Java    
categories: 夯实Java基础
urlname: java_reference
date: 2017-10-30 22:51:00
updated: 2020-05-04 09:58:00 
---

Java中存在四种引用,StrongReference(强引用) 、SoftReferenc(软引用) 、WeakReferenc(弱引用)、PhantomReference(虚引用).虽然不常用,但是对于理解Java的回收等级还是很有帮助的,一句话来说这些引用只是不同回收等级的一种表现形式.
![](http://res.mrdear.cn/1509454563.png)

- - - - -
### StrongReference(强引用)
强引用是最经常使用的一种引用,如new操作创建的对象就属于强引用.如下代码,对于强引用要记住**无论如何JVM都不会去回收其内存**.
**清单1：强引用示例**
```java
Object obj = new Object();
```
### SoftReferenc(软引用)
软引用是由`java.lang.ref.SoftReference`所提供的功能,被其所关联的对象不存在强引用并且此时JVM内存不足才会去回收该对象.
个人不知道其用处,做缓存的话,现在的企业项目基本不是单体架构所以用处不大,倒是可以做内存警告,当对象被回收时则说明系统所需要的内存不足,那么就可以发邮件通知相关人员.

### WeakReferenc(弱引用)
弱引用是java.lang.ref包下的WeakReference类所提供的包装功能，对于弱引用**JVM会在GC时回收弱引用所关联的对象**。也就是说弱引用对象在不存在强引用关系下，会在一次gc之后被回收，如下代码，其中`obj1`没被回收，因为其的引用是强引用，但是`weakObj1`与其关联是弱引用,因此不属于被收回对象。`weakObj2`所关联的`new Object()`只有一个弱引用关联,因此会被回收。

**清单2：弱引用示例**
```java
    Object obj1 = new Object();
    WeakReference<Object> weakObj1 = new WeakReference<Object>(obj1);
    WeakReference<Object> weakObj2 = new WeakReference<Object>(new Object());
    //主动回收
    System.gc();

    System.out.println(weakObj1.get()); // 非null
    System.out.println(weakObj2.get()); // null
```

#### WeakHashMap应用实例
Java中提供了一个很棒的工具类`WeakHashMap`,按照注释所说,该类是一个键为弱引用类型的Map,与传统Map不同的是其键会自动删除释放掉,因为gc()时会自动释放,因此很适合做缓存这一类的需求,下面代码是Tomcat所实现的LRU(最少使用策略)缓存算法的实现,关键点在注释中给出.
**清单3：弱引用实现LRU**
```java
import java.util.Map;
import java.util.WeakHashMap;
import java.util.concurrent.ConcurrentHashMap;

public final class ConcurrentCache<K,V> {
    //LRU所允许的最大缓存量    
    private final int size;
    private final Map<K,V> eden;
    private final Map<K,V> longterm;
    
    public ConcurrentCache(int size) {
        this.size = size;
        //eden是主要缓存
        this.eden = new ConcurrentHashMap<>(size);
        //longterm是实现LRU算法的关键点.
        this.longterm = new WeakHashMap<>(size);
    }
    
    //get是先从eden中取出缓存,当不存在时则去longterm中获取缓存,并且此时获取到的缓存说明还在使用,因此会put到eden中(LRU算法)
    public V get(K k) {
        V v = this.eden.get(k);
        if (v == null) {
            synchronized (longterm) {
                v = this.longterm.get(k);
            }
            if (v != null) {
                this.eden.put(k, v);
            }
        }
        return v;
    }
    //put操作当size大于LRU最大容量时,则把缓存都放入到longterm,当this.eden.clear()后使其成为弱引用,那么LRU的实现则在get方法中体现了出来.
    public void put(K k, V v) {
        if (this.eden.size() >= size) {
            synchronized (longterm) {
                this.longterm.putAll(this.eden);
            }
            this.eden.clear();
        }
        this.eden.put(k, v);
    }
}
```
此方法本质是借助GC来判断哪些对象还在被强引用，因为被强引用的对象不会被回收，因此`WeakHashMap`中key不为null的便认为是仍有效的，放入到eden区中。

### PhantomReference(虚引用)
虚引用是由`java.lang.ref.PhantomReference`所提供的关联功能，**虚引用只是一个通知标记，对其原对象的生命周期毫无影响**，当其所引用对象被回收时其会自动加入到引用队列中。也就是说你可以通过虚引用得到哪些对象已被回收。具体用法可以分析`common.io`中的`org.apache.commons.io.FileCleaningTracker`，该类使用需引用标记对象，当对象被回收后，可以删除对应的文件信息。该类中有一内部类`class Tracker extends PhantomReference<Object>`,也就是其包裹着虚引用对象，分析其构造函数，`marker`参数是该具体的虚引用,当marker被回收时,该对应的Track会被加入到引用队列`queue`中。

**清单4：虚引用示例**
```java
        Tracker(String path, FileDeleteStrategy deleteStrategy, Object marker, ReferenceQueue<? super Object> queue) {
            //marker是具体的虚引用对象
            super(marker, queue);
            this.path = path;
            this.deleteStrategy = deleteStrategy == null ? FileDeleteStrategy.NORMAL : deleteStrategy;
        }
```

文件删除则是该类维护的一个线程来进行的操作,既然对象回收后会加入到引用队列`queue`，那么该线程要做的功能自然是从引用队列中获取到对应的`Track`，然后执行其删除策略。在这个流程中虚引用起到的是跟踪所包裹对象作用，当包裹的的对象被回收时，这边会得到一个通知(将其加入到引用队列)。
**清单5：虚引用回调**
```java
@Override
        public void run() {
            // thread exits when exitWhenFinished is true and there are no more tracked objects
            while (exitWhenFinished == false || trackers.size() > 0) {
                try {
                    // Wait for a tracker to remove.
                    Tracker tracker = (Tracker) q.remove(); // cannot return null
                    trackers.remove(tracker);
                    if (!tracker.delete()) {
                        deleteFailures.add(tracker.getPath());
                    }
                    tracker.clear();
                } catch (InterruptedException e) {
                    continue;
                }
            }
        }
```

### ReferenceQueue
无论是弱引用还是虚引用，其一个目地是在于即使拥有对象引用，也能被GC，另一个目地则是应用中可以得到对象被GC的通知，`ReferenceQueue`则是用来实现该通知的媒介，`ReferenceQueue`是单链表引用队列，是**GC和应用系统交互**的一种方式，`Reference`对象是单链表中的节点类，当对象被回收时GC会将回收信息加入到`ReferenceQueue`中，应用系统能够拿到回收信息，近而做资源释放等处理，比如`WeakHashMap`，那具体是怎么实现的呢？

在`WeakHashMap`构造过程中每一个K-V会被封装成`java.util.WeakHashMap.Entry`对象，该对象继承了`WeakReference`，从构造函数来看每一个Key实际上为`WeakReference`包裹的对象。

**清单6：WeakHashMap的Entry构造函数**
```java
     Entry(Object key, V value,
              ReferenceQueue<Object> queue,
              int hash, Entry<K,V> next) {
            super(key, queue); // 把Key传入WeakReference的构造函数中
            this.value = value;
            this.hash  = hash;
            this.next  = next;
        }
```
从构造函数可以得出Key是弱引用，而Value仍然是强引用，因此当Key被回收时，`WeakHashMap`要做对应的Value清理工作，否则由于value无法回收，则可能出现内存泄漏现象。此时问题可以简化为两个，一是对象被回收时，`WeakHashMap`是如何得到通知的，二则是`WeakHashMap`是如何做清理的。

先看问题一，如何感知对象被GC？由于`Entry`的结构，因此每一个Key是弱引用，当被回收后，GC会将对应Entry加入到引用队列中，其作为引用对象时数据结构如下所示，为单链表节点。

**清单7：Reference数据结构**
```java
public abstract class Reference<T> {

    private T referent;         /* Treated specially by GC */

    // 引用所关联的引用队列，构造函数传入
    volatile ReferenceQueue<? super T> queue;

    // 单链表
    @SuppressWarnings("rawtypes")
    volatile Reference next;

    transient private Reference<T> discovered;  /* used by VM */

    // 被回收的对象列表，注意是static，全局共享
    private static Reference<Object> pending = null;
}
```
`Reference`有个内部类`java.lang.ref.Reference.ReferenceHandler`，其继承了Thread类，会在类加载阶段创建一个高优先级守护线程，如下图所示，通过Debug可以很容易发现该线程。GC在完成回收时，会把被回收对象加入到`ReferenceQueue`中，然后该线程会去扫描`ReferenceQueue`队列，获取被回收对象后，执行自定义清理方法，这样完成了整个通知流程。
![](http://res.mrdear.cn/1550536750.png)


第二个问题，`WeakHashMap`是如何清理的？`WeakHashMap`主要在所有public方法中都调用了`expungeStaleEntries`进行主动清理，该方法会扫描引用队列，发现对象后，则将对应的value置为null，从而协助GC。从这里来看，如果声明WeakHashMap后不再访问，实际上还是会有内存泄漏风险，而并不是自动回收不会出现泄漏。
**清单7：WeakHashMap对象清理**
```java
private void expungeStaleEntries() {
        for (Object x; (x = queue.poll()) != null; ) {
            synchronized (queue) { // 每一次回收都会加锁
                @SuppressWarnings("unchecked")
                    Entry<K,V> e = (Entry<K,V>) x; //被回收的key
                int i = indexFor(e.hash, table.length); // 找到对应的hash槽

                Entry<K,V> prev = table[i];
                Entry<K,V> p = prev;
                while (p != null) { // 遍历hash槽对应的链，找到该entry之后修改链表
                    Entry<K,V> next = p.next;
                    if (p == e) { 
                        if (prev == e)
                            table[i] = next;
                        else
                            prev.next = next;
                        // Must not null out e.next;
                        // stale entries may be in use by a HashIterator
                        e.value = null; // Help GC
                        size--;
                        break;
                    }
                    prev = p;
                    p = next;
                }
            }
        }
    }
```


### 参考文章
[理解Java中的弱引用](http://droidyue.com/blog/2014/10/12/understanding-weakreference-in-java/index.html)
[Java Reference核心原理分析](http://ifeve.com/java-reference%E6%A0%B8%E5%BF%83%E5%8E%9F%E7%90%86%E5%88%86%E6%9E%90/)