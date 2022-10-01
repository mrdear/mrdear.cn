---
title: Java -- MetaSpace线上问题排查
subtitle: MetaSpace相关线上问题排查分享
cover: http://res.mrdear.cn/uPic/1602989829261_UyHM4i.png-default
author: 
  nick: 屈定
tags:
  - Java   
  - 实战 
categories: 夯实Java基础
urlname: java_metaspace
date: 2020-10-18 10:51:55
updated: 2020-10-18 10:51:58
---

最近遇到了两起metaspace问题，借此机会对metaspace进行一个回顾梳理，希望能帮到其他人。

## 问题

现象一：MetaSpace频繁引起full gc？

应用A，线上机器运行一段时间后频繁触发full gc，根据监控发现是MetaSpace达到设定的-XX:MaxMetaspaceSize=512m，每次full gc后还会占用450M+，之后很快达到512M，再次触发full gc，如此反复。

现象二：MetaSpace无限增大，最终导致OS kill掉应用

应用B是一个新申请的应用，运行一段时间后，个别机器内存会被java进程占据90%以上，最终由于内存占用过高，被OS kill掉。



两者系统的共同点是都用了[https://github.com/killme2008/aviatorscript](https://github.com/killme2008/aviatorscript)，以及大量groovy脚本，想必大概原因是出在这里，为了搞清楚上述两个现象背后的原因，需要对MetaSpace的原理有一定了解，博主带着一堆问题开始了google。。。

## MetaSpace的由来

MetaSpace被称为元数据空间，在JDK8版本中退出代替JDK7的perm(永久代)。关于为什么会替代，说法众说纷纭，博主觉得比较合理的解释是为了解决OOM问题。

在JDK7时代，不少人经历过`Exception in thread "main" java.lang.OutOfMemoryError: PermGen space`，比如Tomcat7的热部署，频繁触发的话，很快就导致系统挂掉，究其原因是PermGen利用了堆内存，而生产环境堆内存一般会设置最大值，那么就带来该给PermGen分配多少的问题，分配多了有点浪费，分配少了则频繁Full gc。相比PermGen，MetaSpace最大的变化就是使用直接内存，因此最大占用不受堆内存限定，而取决于操作系统，其次是JDK8下lambdas新增表达式，大量的运用会为该区域带来不确定性。但从上述两个问题来看，该有的问题还是一个都不少。。。

## MetaSpace里面存的是什么

MetaSpace主要存放class metadata，class metadata可以理解为记录了Java类在JVM中的静态信息，主要包含：

- KLass结构，Class文件在JVM里面运行时的数据结构
- NoKlass
  - method metadata，包括方法的字节码，局部变量表，异常表，参数信息等
  - 常量池：Class中的符号常量
  - 注解
  - 方法计数器：记录方法执行次数，辅助JIT决策

## MetaSpace常用参数以及如何扩容

常用参数主要有以下三个：

- MetaSpaceSize

  默认20.8M大小，主要控制metaspaceGC发生的初始阈值，也是最小阈值。

- MaxMetaSpaceSize

  默认无穷大，一旦到达这个值就会触发full gc，该值设定后，不会在JVM一开始就分配该部分内存，而是随着使用不断申请，直到达到这个值。

- CompressedClassSpaceSize

  默认1G，设置Klass MetaSpace的大小，该参数生效前提是开启压缩指针，达到该参数大小后也会触发full gc



那么MetaSpace是如何扩容的呢？

以参数 -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m为例，当JVM启动时，会经历以下步骤：

1. 按照JVM需要申请MetaSpaceSize内存，该部分是按需申请
2. 随着系统运行当MetaSpace不断增加，第一次达到-XX:MetaSpaceSize=256m时，触发full gc，这个是初始GC阈值
3. 第一次GC释放掉一些后，系统随着运行还在不断增加，当达到-XX:MaxMetaspaceSize=512m时，再次触发full gc，如此反复
4. 这其中还有个参数-XX:CompressedClassSpaceSize=1G，该参数一般难以达到，当达到后也会触发full gc。



到这一步，上述问题就很好解释了。

## 问题解析

无论是aviator还是groovy其都是JVM上的动态语言，动态语言的特点是动态Classloader以及随时随地新建类，那么metaspace内存一直增长就是由这些带来的。博主所在公司提供了JDK的metaspace dump功能，导出后由分析工具也能看到一堆的aviatorClassLoader以及groovyClassLoader，也可以使用`jmap -clstats PID`定位。

问题一：问题一设置了XX:MaxMetaSpaceSize=512m参数，所以最大值不会突破512M，由于使用了动态脚本引擎，因此会不断的加载新的类以及新建ClassLoader，因此导致MetaSpace不断的达到阈值，触发full gc，解决方案是增加缓存，对相同的表达式不再触发编译操作。

问题二：问题二由于是一个新应用，配套的JVM参数在走应用上线流程时并没有生效，因此其MetaSpace会不断的增加，直到达到系统最大值，被操作系统kill。解决方案增加上述参数即可。

## 备注

感谢网友[Rain-Chen](https://github.com/mrdear/blog-comment/issues/70)的建议，上述方案虽然也能够解决当前问题，但治标不治本，该业务的表达式随时间变化，而不是一个静态表达式，因此缓存也只能有一段时间效果，从而降低full gc频率，根本的解决方案是替换表达式引擎，这种频繁场景下使用更加轻量级的解决方案，不过这是另一个话题了，本文不多讨论。

## 参考

对JVM了解不多，如有错误还请指出。

[JVM源码分析之MetaSpace解密](http://lovestblog.cn/blog/2016/10/29/metaspace/)

[深入理解堆外内存 MetaSpace](https://www.javadoop.com/post/metaspace)

[JVM参数MetaSpaceSize的误解](https://www.jianshu.com/p/b448c21d2e71)