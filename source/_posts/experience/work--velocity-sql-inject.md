---
title: 实践 -- Velocity渲染SQL如何避免注入？
subtitle: 使用Velocity提高SQL的灵活性，但是需要确保不会发生SQL注入
cover: http://res.mrdear.cn/blog_mrdear_work.png
author: 
  nick: 屈定
tags:
  - 实战
categories: 实战总结
urlname: work-design-velocity-sql-inject
date: 2020-01-11 10:53:06
updated: 2020-01-11 10:53:10
---

业务开发中，会出现一些数据服务系统，既然是数据服务，那么快速提供一个业务查询配置，是必须的能力。在这个方案中，我采取了Velocity渲染SQL Template，渲染后的SQL交由JDBC驱动去执行，那么在这个过程中很有可能出现SQL注入，本文将讨论SQL注入的原理以及在Velocity场景下怎么解决这个问题。

## 什么是SQL注入？

假设后台系统有一条SQL，`select * from user where email=${email} and passwd=${pwd} `，恰巧后台又使用了字符串模板替换，当传入值为 `email=101@qq.com , pwd= xxx' or 1=1# `，那么渲染出来的结果为`select * from user where email=‘101@.com’ and passwd='xxx' or 1=1#'`，此时该SQL相当于跳过密码校验，这种现象就是SQL注入。
现象有了，那么注入的本质原因是什么呢？
一条SQL语句我们把需要语法解析的称为SQL逻辑部分，外部传入进来的称为参数部分，举个例子，针对`select * from user where email=${email} and passwd=${pwd}`，其SQL部分可以为 `select * from user where email=？ and passwd=？`，其参数部分为`email=101@qq.com， pwd=xxx`，正常情况下，参数部分不参与SQL语句的解析，只是填充值，当出现注入时，参数部分必然会参与SQL语句的解析，简单说就是逻辑部分与参数部分没有很好的隔离，导致了注入的产生。

## 如何避免注入？

上述内容分析出本质原因是**SQL逻辑部分**与**参数部分**没有隔离，那么解决方案即隔离，这也是SQL预编译的实现原理。在Java中JDBC提供了`PreparedStatement`来实现预编译SQL，其由底层数据库提供支持，相当于应用提交给MySQL服务器一个SQL逻辑，MySQL会先编译好该SQL，然后应用再提供参数，MySQL填充这些参数，这样即使参数中存在`or 1=1`类似的语句，也不会去执行，因此解决了注入的问题，这也是最根本的一种解决方式。

## Velocity渲染SQL该怎么避免注入？
Velocity本质上是字符串拼接，给定什么就拼接什么，实际上是逻辑与数据没有分离开来，最后生成的是plain sql，提交给DB执行，因此非常容易发生注入，那么解决思路如下图所示，经过velocity模板渲染后生成两部分的内容，1是预编译SQL，2是对应的参数集合，这样就做到了逻辑与数据的分离，DB层面使用`PreparedStatement`进行预编译执行，彻底解决SQL注入的风险。
![](http://res.mrdear.cn/1578410687.png)

### 实现逻辑

实现逻辑也不复杂，Velocity在进行**变量替换输出**时，会调用对应的钩子函数`ReferenceInsertionEventHandler`修改对应的输出，那么实现策略就相当简单了，只需要如下图所示，在Velocity与输出时间增加该钩子函数，替换输出字符串为占位符，然后将参数放入List集合中存储。
![](http://res.mrdear.cn/1578581443.png)

## 参考

[Velocity Developer Guide](http://velocity.apache.org/engine/2.1/developer-guide.html#orgapachevelocityappeventreferenceinsertioneventhandler)