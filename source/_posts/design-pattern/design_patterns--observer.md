---
title: 设计模式--观察者模式的思考
subtitle: 关于观察者模式的一些理解,以及在工作中观察者模式的应用
cover: http://imgblog.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-observer
date: 2018-04-20 11:04:09
updated: 2019-06-07 23:13:08
---
观察者模式在业务开发中相当有用的模式,本身挺简单的,理解了一番后就立即对目前手上的项目做了一些优化,该文记录一些自己的理解与应用,希望对你有启发.

## 观察者模式
观察者模式描述的是一种一对多的关系,这里的一可能是某个状态发生变化,也可能是某一个事件产生.举个例子,针对订单付款,这一事件产生后可能需要经过很多个处理步骤,比如积分,入库,消费排行榜之类的操作,这些操作之间并没有任何关联性甚至可以并行处理,那么就可以理解为订单付款与处理步骤之间的一对多关系.
还有一个特点就是单向依赖,处理步骤对于订单付款是单向依赖的,比如有订单付款,才能有处理步骤.但是反之就不依赖,订单付款对于有没有处理步骤是不关心的,这一点在下文实战中会详细讲解.

### 观察者模式结构
观察者模式主要结构如下:
![](http://imgblog.mrdear.cn/1524063218.png?imageMogr2/thumbnail/!100p)
- Subject: 负责事件产生后通知到具体观察者的角色,所谓的通知实际上是循环调用其所持有的观察者接口
- Observer: 负责对事件的处理,该接口可以很好的做到任务分离,每一个不同的任务都是其一个实现子类,互相不关心对方,很好的描述了业务上的关系.

那么本质什么?用一个`Subject`来聚合所有的`Observer`,那么调用者只需要关心对应的`Subject`就可以.
为什么可以这样? 因为`Observer`之间没有任何关系,只是单纯的做自己要做的事情,也并不需要返回值之类的东西.

## 观察者模式的实战案例
如笔者一开始描述的需求,再订单付款完成之后执行一些处理步骤,具体如下:
1. 如果是虚拟产品订单,那么就发放虚拟产品
2. 如果是会员订单那么就开通会员
3. 根据付款金额增加积分
4. 如果有消费排行榜活动则更新用户金额.
5. .....

这种是开发中很常见的付款后一些对应的操作需求,并且随着活动之类的增加后续还很容易增加其他的处理步骤需求,对于观察者模式其符合以下两点特征:
1. 订单付款完成这一事件对应对个处理步骤,典型一对多关系
2. 处理步骤之间并无关联性,每一个都是独立的处理

### 观察者模式设计
上述用观察模式可以设计出如下结构:
![](http://imgblog.mrdear.cn/1524065151.png?imageMogr2/thumbnail/!120p)

**OrderPaidHandlerObserver**
其是观察者需要实现的接口,主要功能是判断是不是自己可以处理,可以处理的话就处理,其子类各司其职,比如`IntegralOrderService`是处理积分相关的观察者,`VipOrderService`则是处理会员相关的Service.
```java
public interface OrderPaidHandlerObserver {
  /**
   * 是否支持处理该消息
   * @param paidMsg 消息体
   * @return true 支持
   */
  boolean supportHandler(OrderPaidMsgDTO paidMsg);
  /**
   * 处理方法
   * @param paidMsg 消息体
   */
  void handler(OrderPaidMsgDTO paidMsg);
}
```
**OrderPaidHandlerSubject**
其是负责通知所有观察者的接口,实现了该接口就有了通知观察者的义务.
```java
public interface OrderPaidHandlerSubject {
  /**
   * 提醒所有的观察者
   * @param paidMsg 付款消息
   */
  void notifyObservers(OrderPaidMsgDTO paidMsg);
}
```
**OrderCompositeService**
其是`OrderPaidHandlerSubject`的实现类,主要实现负责通知所有观察者的逻辑,所谓的通知本质上就是调用自己所持有的观察者对象,那么当订单付款事件产生后`OrderCompositeService`只需要调用下`notifyObservers()`方法就可以完成通知,完成所有的处理步骤.
```java
public class OrderCompositeService implements OrderPaidHandlerSubject {

  private List<OrderPaidHandlerObserver> observers;

  @Override
  public void notifyObservers(OrderPaidMsgDTO paidMsg) {
    // 所谓的通知本质上就是调用对应观察者的方法
    for (OrderPaidHandlerObserver observer : observers) {
      try {
        if (observer.supportHandler(paidMsg)) {
          observer.handler(paidMsg);
        }
      } catch (Exception e) {
        log.error("OrderPaidHandlerObserver fail", e);
      }
    }
  }
...
}
```

### 使用Spring管理观察者
`OrderCompositeService`作为Subject来说,其持有了全部的`Observer`,那么如果利用IOC把`Observer`全部注入进该类中,那么当下次新增加一个`Observer`实现类时就不需要改这边的任何代码,完完全全的解耦.
思路是利用IOC管理所有的观察者,当Spring容器启动完毕后获取所有的观察者,添加到对应的`observers`集合中,具体做法就是让`OrderCompositeService`实现`ApplicationListener<ContextRefreshedEvent>`接口,Spring在启动完毕后会发出通知,在该接口中利用`BeanFactoryUtils`初始化所需要的观察者集合.
```java
/**
   * 容器初始化完毕后所执行的事件
   */
  @Override
  public void onApplicationEvent(ContextRefreshedEvent event) {
    initPaidObserver(event);
  }
  /**
   * 初始化订单付款所要执行的事件
   */
  private void initPaidObserver(ContextRefreshedEvent event) {
    // 从Spring容器中取出所有的观察者
    Map<String, OrderPaidHandlerObserver> matchingBeans =
        BeanFactoryUtils.beansOfTypeIncludingAncestors(event.getApplicationContext(), OrderPaidHandlerObserver.class, true, false);
    // 实例化观察者集合
    this.observers = Collections.unmodifiableList(Lists.newArrayList(matchingBeans.values()));
    if (this.observers.size() <= 0) {
      throw new IllegalStateException("OrderPaidHandlerObserver not found");
    } else {
      log.info("initPaidObserver finish, observer is {}", matchingBeans.keySet());
    }
  }
```

这样做的好处就是把观察者的实例化与Subject解耦,对于观察者只需要知道自己一旦实现了观察者接口,那么就一定会有相应的Subject通知自己就足够了.

## 观察者的 "感兴趣" 粒度
在观察者模式中`Observer`会向`Subject`注册自己,那么当Subject对应多个事件时怎么处理呢?
**1.Subject管理多组Observer**
在`Subject`中存放着多组`Observer`,当一个事件触发时只会通知其中一组.这样做法个人感觉是比较合理的.缺点是管理不方便,对于`Subject`来说要管理多组,对应的removeOvserver或者addObserver就会比较麻烦了,此时可以依赖IOC等工具完成这个过程.
**2.Observer多角色**
这种方案下,对于一个`Subject`他管理的只有一组`Observer`,但是`Observer`本身要承担多个责任,并且对自己不感兴趣的责任要留空方法处理.`Observer`可能只对一件事情感兴趣却不得不实现一堆空方法,不符合最少知道原则.Java的`AWT`就是这种设计.
**3.使用弱类型参数**
JDK自带的`Observer`就是类似的形式,其使用`Object`作为观察者参数,当接收到消息时需要用`instance`判断是否是自己感兴趣的事件,然后才执行逻辑,当事件很少的话这种方式是比较合适的,事件多的话则对一堆事件要分开处理,依然很麻烦.Eclipse的SWT是这种设/计.

## EventBus设计
观察者模式本质上来说是一种事件驱动编程范式，Subject调用Observer时传递参数过程即为一次事件发布，在这个过程中Subject与Observer是一种强耦合状态，Subject必须要拿到所有的Observer才能进行事件发布，为了解决这种强耦合，EventBus设计方式就出现了，本质上思想是加中间层去除耦合性，如下图所示，

![](http://imgblog.mrdear.cn/1559919617.png?imageMogr2/thumbnail/!100p)

EventBus其主要目地是管理所有的Observer，管理维度一般以事件为维度，当Subject发布到EventBus一个Event时，EventBus根据事件类型(一般为该类的Class对象)遍历出所有的Observer，然后执行，这里也可以根据需求做异步执行。


## 参考
[观察者模式“感兴趣”的粒度控制](http://javatar.iteye.com/blog/38775)