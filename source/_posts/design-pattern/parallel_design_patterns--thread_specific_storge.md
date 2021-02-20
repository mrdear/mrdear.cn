---
title: 并行设计模式--Thread Specific Storge模式
subtitle: 关于Thread Specific Storge模式的一点探讨，涉及ThreadLocal与ObjectPool
cover: http://imgblog.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-thread-specific-storge
date: 2018-05-20 08:05:34
updated: 2018-07-30 08:07:07
---
多线程的不安全在于共享了变量实例，因此`Thread Specific Storge`模式的思路是把变量与单一线程绑定，那么就不存在共享，自然就避免了加锁消耗以及其他高并发所需要的策略。
`Thread Specific Storge`一般有两种策略：1. ThreadLocal策略，也就是与当前线程实例绑定。 2. 借用模式对象池策略，由对象池进行管理，控制对象只能同一时间被一个单线程使用。

## ThreadLocal设计与应用

### ThreadLocal策略
ThreadLocal策略比较简单，其原理是在`Thread`类中私有化一个属性变量`java.lang.ThreadLocal.ThreadLocalMap`，该Map存储着与当前线程绑定的相关变量。一个`ThreadLocal`的基本使用如下：
```java
  private static ThreadLocal<String> threadLocal1 = new ThreadLocal<>();
  private static ThreadLocal<String> threadLocal2 = ThreadLocal.withInitial(() -> {
    System.out.println("t2触发初始化");
    return "threadLocal2";
  });

  public static void main(String[] args) {
    threadLocal1.set("threadLocal1");
    // 触发t2的初始化操作,并返回t2的值
    System.out.println(threadLocal2.get());
    // 得到t1的值
    System.out.println(threadLocal1.get());
  }
```
上述代码在内存中的结构如下，其对象本身`ThreadLocal`会作为`ThreadLocalMap`的key存储。
![](http://imgblog.mrdear.cn/1526516764.png?imageMogr2/thumbnail/!100p)
既然是Map结构，那么会有几个问题：
**ThreadLocalMap是如何解决hash冲突的？**
`ThreadLocalMap`是一个简单的Map实现，其没有构造对应的冲突链，而是当遇到冲突时**顺延到下一个槽位**，也就是常说的开放地址法，具体逻辑可以在`java.lang.ThreadLocal.ThreadLocalMap#set`中看到。

**ThreadLocalMap的扩容机制是什么？**
扩容要提到负载因子,其负载因子计算为`threshold = len * 2 / 3`，当元素个数大于该值时会触发扩容，扩容操作把之前元素拷贝进来后替换掉之前的数组。

### 使用ThreadLocal复用对象
在Java中有一些线程不安全的对象需要被频繁创建，比如`StringBuilder`，那么就可以利用`ThreadLocal`复用这些对象。
在`BigDecimal`中有如下类，其本身是包装了`StringBuilder`，并提供重置方法。
```java
  static class StringBuilderHelper {
        final StringBuilder sb;    // Placeholder for BigDecimal string

        StringBuilderHelper() {
            sb = new StringBuilder();
        }

        // Accessors.
        StringBuilder getStringBuilder() {
            sb.setLength(0);
            return sb;
        }
  }
```
在使用前需要把该类使用`ThreadLocal`包裹
```java
    private static final ThreadLocal<StringBuilderHelper>
        threadLocalStringBuilderHelper = new ThreadLocal<StringBuilderHelper>() {
        @Override
        protected StringBuilderHelper initialValue() {
            return new StringBuilderHelper();
        }
    };
```
利用`ThreadLocal`这样设计解决了线程不安全的问题，然后提高对象复用性，尤其是大字符串的拼接会让`StringBuilder`不停的扩容，频繁创建对性能影响还是挺大的。

## 对象池策略
借还策略下的对象池模式也经常被用来解决非线程安全的类在多线程环境下的使用，所谓的借还模式如下所示
```java
  public static void main(String[] args) throws Exception {
    GenericObjectPool<SimpleDateFormat> pool = new GenericObjectPool<>(new SimplePoolObjectFactory());
    // 借对象，如果池中没有对象则主动去创建然后再返回
    SimpleDateFormat dateFormat = pool.borrowObject();
    try {
      System.out.println(dateFormat.format(new Date()));
    } finally {
      // 用完释放，返回池中
      pool.returnObject(dateFormat);
    }
  }
```
上述代码中`pool`是一个多线程可以共享的实例，其必须保证对象的借出与归还的原子性，当对象被借出时那么对象就与当前线程绑定了起来，对象池保证了其他线程操作时不会再次获取到该实例，因此对象不存在共享，也就不存在多线程并发问题。

### 对象池的控制原理
以`apache common pool2`为例，其`GenericObjectPool`的实现原理主要是`ConcurrentMap`与`LinkedBlockingDeque（非JDK版本）`，如下图所示：
![](http://imgblog.mrdear.cn/1526557246.png?imageMogr2/thumbnail/!100p)
对象池本质上是一个**集生产与消费，且支持可回收的工厂**。生产则对应着用户获取对象时，如果当前`idleObjects`中不存在则主动去创建对象，消费则对应着Client的`borrowObject`操作，可回收则是`returnObject`还回池中操作。作为工厂其由责任对生产出的产品个数与消费能力的变化进行调整，因此还需要有一个后台线程做这件事，对应着是`org.apache.commons.pool2.impl.BaseGenericObjectPool.Evictor`类定时清理策略。

对应的核心操作解析：
**borrowObject操作**
`borrowObject`操作主要是从对象池也就是上述的`LinkedBlockingDeque<PooledObject<T>> idleObjects`中取出实体，当实体不存在的时候要主动去创建，
```java
// 取出队首元素，该方法并不会产生阻塞
p = idleObjects.pollFirst();
if (p == null) {
    // 没有获取到对应元素则主动创建
    p = create();
    if (p != null) {
        create = true;
    }
}
```
如果上述过程中仍然没有获取到对象，则根据配置选择是否阻塞当前调用，阻塞则使用`BlockingDeque`的take操作或者poll(time)操作
```java
if (p == null) {
    // 根据最大等待获取时间采取不同的等待策略
    if (borrowMaxWaitMillis < 0) {
        // take操作无限等待
        p = idleObjects.takeFirst(); 
    } else {
        // 有限时间的等待
        p = idleObjects.pollFirst(borrowMaxWaitMillis, 
                TimeUnit.MILLISECONDS);
    }
}
```

**returnObject操作**
`returnObject`操作主要是把使用过的对象还回池中，反映到操作上就是把一个对象放入`LinkedBlockingDeque<PooledObject<T>> idleObjects`的队首或者队尾，当可用对象过多，则是使用直接销毁对象的策略。
```java
// 最大可用对象数量
final int maxIdleSave = getMaxIdle();
// 池关闭或者池已经满了则主动销毁掉释放过来的对象
if (isClosed() || maxIdleSave > -1 && maxIdleSave <= idleObjects.size()) {
    try {
        destroy(p);
    } catch (final Exception e) {
        swallowException(e);
    }
} else {
    // 根据队列配置选择头插法或者尾插法
    if (getLifo()) {
        idleObjects.addFirst(p);
    } else {
        idleObjects.addLast(p);
    }
    // 关闭则清理池
    if (isClosed()) {
        clear();
    }
}
```

**removeAbandoned操作**
`removeAbandoned`主要应对内存中对象实例进行清理，当Client使用完对象却没有还回,此时该对象就应该被清理掉。
清理策略主要针对被借出的对象，对象被借出时该对象上有对应的时间标记，因此遍历池中所有对象，清除状态为被借出，并且借出时间大于指定时间的对象即可。
```java
// 获取全部对象的迭代器
final Iterator<PooledObject<T>> it = allObjects.values().iterator();
// 遍历池中产生的所有对象
while (it.hasNext()) {
    final PooledObject<T> pooledObject = it.next();
    synchronized (pooledObject) {
        // 遍历池中已被借出,并且借出时间大于指定时间的对象
        if (pooledObject.getState() == PooledObjectState.ALLOCATED &&
                pooledObject.getLastUsedTime() <= timeout) {
            // 标记为待清理
            pooledObject.markAbandoned();
            // 清理对象列表
            remove.add(pooledObject);
        }
    }
}
```

**Evictor驱逐线程**
`Evictor`是一个`TimerTask`的定时任务，其主要功能是清理可用对象数量，保证`idleObjects`中的数量最小可用。
`Evictor`对应的操作在`org.apache.commons.pool2.impl.GenericObjectPool#evict`方法中，其逻辑是遍历`idleObjects`中可用对象，使用策略接口`EvictionPolicy`判断是否符合销毁条件，符合则销毁，逻辑比较简单。

而`EvictionPolicy`的默认策略为对象在`idleObjects`的存活时间大于配置的清理时间，并且当前`idleObjects`的数量对象大于最小可用对象配置的情况下进行回收。
```java
@Override
public boolean evict(final EvictionConfig config, final PooledObject<T> underTest,
        final int idleCount) {
    // 清理策略是根据当前对象的空闲时间与配置空闲时间比较
    if ((config.getIdleSoftEvictTime() < underTest.getIdleTimeMillis() &&
            config.getMinIdle() < idleCount) ||
            config.getIdleEvictTime() < underTest.getIdleTimeMillis()) {
        return true;
    }
    return false;
}
```

## 总结
`Thread Specific Storge`模式的本质是不共享数据，从而解决了多线程下竞争的问题，一般情况下对于构造成本比较小的数据直接使用`ThreadLocal`，需要时则直接创建一个与当前线程所绑定。构造成本比较大的对象比如各种连接池则使用对象池方式。

## 参考
[Java多线程编程实战指南](https://item.jd.com/11785190.html)