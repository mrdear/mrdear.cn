---
title: 设计模式 -- 享元模式的思考
subtitle: 关于享元模式的一些案例
cover: http://res.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-flyweight
date: 2020-05-10 09:08:14
updated: 2020-05-10 09:08:17
---


享元意思为共享的单元，享元模式的目地是针对不可变对象可以复用，以达到节省内存的目地。在一些特殊的业务场景上能发挥出巨大的威力，本文将分析享元模式以及举出一些应用案例。

## 享元模式
享元模式很好理解，即针对**不可变对象**的**复用**。

对象不可变指的是对象构建成功后，不能通过访问方法改变对象属性，因为享元模式下，对象会被多处使用，如果可变则造成不一致现象，这一点很好理解。另外怎么复用呢？常见的手段是使用一个Map存下来已经产生的对象，当新建对象时，如果Map中已经存在需要的对象，则直接返回已存在对象地址，达到复用目地。

享元模式本身很简单，个人认为需要掌握的是这种**对象复用思想**，在实现对应业务时，能敏感的发现可复用场景，下面从几个案例中来感受下其威力。

## JDK中享元模式应用
熟悉Java的同学，或多或少都遇到过下面问题，按理来说，`Integer`属于对象，每一次创建都会开辟新的内存，所以即使相同的大小，其内存地址不一致，会被`==`判定为两个对象，但实际情况中[-128，127]之间的数字，JDK使用了享元模式，复用了这部分的对象，JDK实现者认为[-128，127]之间的数字一般为编程中高频数字，如果每次都new产生新对象，比较浪费内存，如果是复用情况下，即使多次声明，内存中只会有一份对象存在，能够节省大量无谓的内存消耗。
```java
        Integer var1 = 1;
        Integer var2 = 1;
        Integer var3 = 128;
        Integer var4 = 128;

        System.out.println(var1 == var2); // true
        System.out.println(var3 == var4); // false
```


## 字符串常量池与享元模式
JDK中提供了字符串常量池，也就是字符串缓存，在Java中动态创建的字符串可以使用`intern()`方法让其进入常量池，关于更多常量池分析可以参考我另一篇文章[Java -- 字符串常量池介绍](https://mrdear.cn/posts/java-string-pool.html)。那么常量池机制本身就是享元模式思想，针对重复字符串对象达到复用目地，从而节省内存消耗。

Twitter曾分享过利用字符串常量池享元方式优化内存案例，该案例中Twitter用户登录后需要在session中保存用户地理位置信息，有国家，省份，城市等，当网站日活上去后，session中的地理位置字符串信息将占据大量内存。简单分析下，地理位置信息为字符串格式，具备不可变属性，且在该业务中重复度很高，因此可以利用字符串常量池复用相应的字符串，这本质上也是享元模式的一种运用。

## 数据库表结构设计与享元模式
享元模式虽然为应用代码设计的产物，但在数据库表结构设计上也经常有类似思想运用。比如要设计一款RSS阅读器，用户可以自定义订阅列表，那么怎么做？

**做法一**
做法一是记录每一个用户的地址，然后后台定时任务为每一个用户更新对应的RSS信息，订阅表如下树形结构所示。这样做有什么坏处？考虑到2-8原则，即80%用户都会订阅常见的一些RSS，那么这张表中RSS地址重复度就很高，针对每一个用户更新对应RSS信息则相当于做了很多重复的订阅拉取动作。
- 用户订阅表
    - 用户id
    - RSS地址

**做法二：使用享元思想**
做法二是针对RSS地址，单独维护一张表，用户订阅时只需要关联到RSS id，RSS订阅则不需要考虑用户维度，定时去更新RSS源地址中所有地址，两者完全解耦开来。此时`RSS源地址表`相当于享元思想中**被共享的单元**，之所以可以这样设计，因为无论用户订阅怎么变化，RSS地址不会变化，因此具备不可变性，且用户订阅中RSS地址重复度很高，具备高重复度这一特点。
- 用户订阅表
    - 用户id
    - RSS id
- RSS源地址表
    - RSS id
    - RSS 地址

## 总结
享元模式很简单，很好理解，关键时刻能发挥出巨大作用，但什么时候使用享元模式或者说需要考虑享元模式呢？根据上面案例，我觉得可以总结为以下两点

- 对象能做到不可变
- 对应业务中，对象重复度很高

这两点情况下，大多数情况都能够使用享元模式进行优化。

## 参考
[极客时间 -- 设计模式之美专栏](https://time.geekbang.org/column/intro/250)