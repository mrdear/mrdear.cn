---
title: Java -- ThreadLocal问题分析
subtitle: 关于ThreadLocal内存泄漏以及用错值等问题分析，并提出了一些标准用法
cover: http://imgblog.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - Java
categories: 夯实Java基础
urlname: java_threadlocal
date: 2020-11-28 00:02:46
updated: 2020-11-28 00:02:42
---

关于ThreadLocal内存泄漏的问题，网上有很多讨论，比较一致认同的方案是每次使用完ThreadLocal对象后，调用remove方法释放掉该对象，用来防止内存泄漏。乍一听感觉挺有道理，然而使用ThreadLocal除了解决线程不安全问题之外，其另一个目地是复用对象，如果每次都remove，则只应该在线程入口以及出口操作，而不是在任意调用处操作，不然则失去对象复用的意义。然而没有更好的方式了吗？ThreadLocal这种优秀的理念就这么憋屈的使用？本文将探讨下这些，并希望总结出一套合理的ThreadLocal使用方式。

## 问题一：内存泄漏

### 为什么会内存泄漏

在讨论之前，需要了解下Java中`WeakReference`作用，感兴趣的可以参考[Java中的四种引用](https://mrdear.cn/posts/java_reference.html)。简单点来说在GC工作时，如果`WeakReference`对象没有被强引用所关联，那么就会被GC回收，这个回收是ThreadLocal泄漏原因的根源。
ThreadLocal主要实现依赖`ThreadLocalMap`类，该类使用开放地址法解决hash冲突，当put数据时，`ThreadLocalMap`会将对应的数据封装为`java.lang.ThreadLocal.ThreadLocalMap.Entry`对象，填充hash槽，该对象是一个`WeakReference`子类，被跟踪对象则是ThreadLocal本身，如下图所示，其中`ThreadLocal`标红代表被弱引用所跟踪。

![](http://imgblog.mrdear.cn/1588561192.png?imageMogr2/thumbnail/!100p)

**清单一：Entry对象**

``` java
     static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```

当对应的Entry中ThreadLocal被回收后，Entry中value又是强引用，导致此时Entry无法被释放，就会出现内存泄漏，如下图所示。此时Entry对象永远无法被访问到，也无法被回收，但仍然占用着内存。本质问题是生命周期短的对象引用了生命周期长的对象，导致自身无法释放。
![](http://imgblog.mrdear.cn/1588561933.png?imageMogr2/thumbnail/!100p)

### 什么情况下泄漏

以下内容只考虑日常开发中使用习惯，不过多考虑极端情况。

泄漏的本质是弱引用被回收，换句话说不让弱引用被回收即可以解决泄漏，这也是日常开发下建议ThreadLocal对象声明为`static final`全局变量的好处，当这样声明后，关系图如下所示，此时ThreadLocal由于存在强引用，除非对应的ClassLoader被回收，否则不会被GC回收。
![](http://imgblog.mrdear.cn/1588578060.png?imageMogr2/thumbnail/!100p)

那么声明为`static final`可以高枕无忧吗？当然不行，此时虽然不会因为弱引用问题导致内存泄漏，但是会出现一些线程池中线程分配了部分ThreadLocal对象，但却一直没有使用该对象，那么这些分配未使用过的对象则无法回收，一直处于占坑状态，需要等线程生命周期结束后才能释放，这种也算一种内存泄漏。这种没有比较好的解决方案，常见的是调整线程生命周期，避免线程持续时间太长，二是养成开发意识，在对应行为处使用ThreadLocal需要回收对应内存，对于大部分业务中ThreadLocal的使用来说，所幸的是一般不会造成大问题，顶多是耗费多一点内存。

再者就是合并部署下可能出现内存泄漏，比如Tomcat服务器可以部署多个web应用，这些web应用是共用一套Tomcat的线程池服务，这种情况比较复杂，比如ThreadLocal中引用了webA的类，webA服务下线时，由于强引用存在，导致ClassLoader无法被回收，此时可能造成内存泄漏。在JDK7时代，Tomcat热部署机制就很容易造成 OOM。如今大多数项目都使用Spring Boot单体部署方式，这种内存泄漏越来越少了。

### ThreadLocal怎么解决泄漏

由于Entry对key是弱引用，当key也就是ThreadLocal本身被回收后，无法通过key访问该hash槽，造成内存泄漏。ThreadLocalMap在`java.lang.ThreadLocal.ThreadLocalMap#expungeStaleEntry`方法中实现类对该类数据的回收，该方法遍历对应的hash槽，当发现key为null的数据后，回收对应的槽，如清单二所示，然后ThreadLocalMap类在get以及remove等方法中直接或者间接调用了`expungeStaleEntry`，因此当出现内存泄漏后，大多数情况能够主动回收该部分泄漏内存。

**清单二：ThreadLocal回收key**

```java
    private int expungeStaleEntry(int staleSlot) {
            Entry[] tab = table;
            int len = tab.length;

            // 回收当前槽
            tab[staleSlot].value = null;
            tab[staleSlot] = null;
            size--;

            // Rehash until we encounter null
            Entry e;
            int i;
            // 遍历,回收key为null的槽
            for (i = nextIndex(staleSlot, len);(e = tab[i]) != null;i = nextIndex(i, len)) {
                ThreadLocal<?> k = e.get();
                if (k == null) {
                    e.value = null;
                    tab[i] = null;
                    size--;
                } else {
                    int h = k.threadLocalHashCode & (len - 1);
                    if (h != i) {
                        tab[i] = null;
                        while (tab[h] != null)
                            h = nextIndex(h, len);
                        tab[h] = e;
                    }
                }
            }
            return i;
        }
```

## 问题二：使用上次值

问题二就比较常见了，使用了ThreadLocal，却没有清理，导致第二次重用了旧数据。这种错误是ThreadLocal犯的最多，且最致命的问题，举个博主之前写过的bug，场景如下：

后端提供了一个查询系统所拥有数据的API，由于系统拥有很多不同类型数据，不如枚举信息、用户权限信息、系统状态等，数据都分布在不同的表，因此该接口会并发查询，简略示意图如下，后台使用了策略模式，每一种信息的查询是一个单独的策略接口，前端传入要获取的信息类型，后端根据类型进行`parallelStream`并发获取。

博主当时想也没想，就直接把用户权限的获取写成了一个策略实现类，踩了坑。本质问题是获取用户信息的`RequestUserHolder`本质上是从ThreadLocal中获取，而`parallelStream`底层实现为forkjoin，会根据当前负载情况拆分任务到CommonPool线程池中执行。由于存在线程复用，因此用户信息在请求线程ThreadLocal，调用到parallelStream后，第一次创建CommonPool线程池时，是能够传递ThreadLocal到子线程，之后线程复用，无法传递ThreadLocal，造成数据混乱使用。

![image-20201127232939603](http://imgblog.mrdear.cn/uPic/image-20201127232939603_1606492904.png-default)

## 如何更好的使用ThreadLocal？

讲了那么多，根据上述缺陷，博主总结了以下使用点：

- 使用static final进行修饰，避免因为弱引用回收带来的内存泄漏
- 优先使用ThreadLocal对JDK自带的类进行引用，避免多应用部署时，阻塞ClassLoader回收
- 对于业务类型的对象，比如用户信息，使用完成后一定要主动清理
- 对于容器性质的对象，包装一层重置对象后再提供给其他代码访问，如下StringBuilder复用所示

```java
private static final ThreadLocal<StringBuilder> LOCAL = ThreadLocal.withInitial(StringBuilder::new);

public static StringBuilder getBuilder() {
    StringBuilder builder = LOCAL.get();
    if (builder.capacity() > 1000) {
        builder.setLength(200);
        builder.trimToSize();
    }
    builder.setLength(0);
    return builder;
}
```
