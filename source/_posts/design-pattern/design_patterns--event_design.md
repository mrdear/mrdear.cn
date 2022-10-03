---
title: 设计模式 -- 进程内事件机制设计
subtitle: 关于进程内事件机制设计案例
cover: http://res.mrdear.cn/1592127121.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-event_design
date: 2020-06-14 17:31:01
updated: 2020-06-14 17:31:05
---

在如今动不动分布式环境下，进程内事件机制有点被遗忘，以至于很少使用这一设计。最近在实现一个事件中心机制模型，将应用内一些外部驱动事件都统一入口以及执行，本文则对一些常见进程内事件机制设计做一次梳理，供设计时提供参考。

## 事件机制模型以及优势
事件机制很好理解，发布者发布了一个事件，经过一些操作，投递到了订阅者，订阅者根据接收到相应的事件，执行对应业务逻辑，在这个流程中，可以分析出事件模型的三个必要条件
- 发布者：产生事件
- 订阅者：消费事件
- 连接：发布者与订阅者沟通的方式，进程内由于共享内存，内存即是连接，因此该点可以不考虑。

也因此事件机制主流实现方式是发布订阅模式，MQ可以理解为是分布式下的事件机制设计实现，[观察者模式](https://mrdear.cn/posts/design-patterns-observer.html)可以理解为进程内的事件机制设计实现，那么使用事件机制的优势是什么？我总结了以下几点：

- 事件机制设计是一种完全解耦的设计模式，发布者与订阅者之间并不是强耦合状态，有人可能说观察者模式中，Subject持有全部的Observer，这里虽然代码上有耦合，但是从设计上来说，Subject获取Observer的目地只是为了能够调用对应方法，这一过程完全可以利用IOC做到全自动化，即添加一个Observer，对应的Subject就能自动发现新的Observer。
- 事件机制可以解决低层级无法访问高层级，分层架构中，层级之间不允许循环依赖，那么低层级无法访问高层级，事件机制则可以穿透层级，提供跨层访问能力
- 事件机制扩展性很强，事件机制相当于在事件以及订阅者之间加了一个中间层，因此可以做很多扩展，比如利用队列削峰，利用订阅者嵌套实现冒泡。
- 等等

接下来会分析Spring ApplicationListener以及Guava EventBus设计。

## Spring ApplicationListener
Spring ApplicationListener的使用很方便，对应的Spring Bean只需要实现`ApplicationListener`接口，并指定对应的事件类型即可，Spring在启动中会通过IOC容器将该订阅任务添加到`ApplicationEventMulticaster`中，如下代码所示
```java
@Component
public class UserNotifyEventTask implements ApplicationListener<UserNotifyEvent> {
    @Resource
    private NotifyRepo notifyRepo;

    @Override
    public void onApplicationEvent(UserNotifyEvent event) {
        NotifyDO notifyDO = new NotifyDO();
        notifyDO.setTitle(event.getTitle());
        notifyDO.setCnt(event.getCnt());
        notifyRepo.insert(notifyDO);
    }

}
```
背后原理是什么样子呢？Spring的事件机制是典型的观察者模式，其主要目地是在Spring框架初始化生命周期过程中提供各阶段的通知能力，当然也支持自定义事件，用于业务系统。参考发布订阅模式，其中发布者为`ApplicationEventMulticaster`，订阅者为`ApplicationListener`，事件模型`ApplicationEvent`，进程内通知，因此发布者直接持有了全部的订阅者，基本流程如下：
![](http://res.mrdear.cn/spring-eventlistener.png)

其中`ApplicationEventMulticaster`在Spring容器ApplicationContext创建时会一并创建，`ApplicationEventMulticaster`唯一实现类为`SimpleApplicationEventMulticaster`，如名称所示，就是一个简单的执行Listener的类，虽然提供了`taskExecutor`变量，但默认情况下为同步调用。Spring这一套事件机制设计的目地更多的考虑是内部事件分发，比如你的类感兴趣Spring容器刷新事件，则可以订阅`ContextRefreshedEvent`事件，较少的考虑到业务中事件处理，因此不建议业务中直接使用该模块作为进程内通信方式。

## Guava EventBus
Guava的EventBus使用也很简单，以下面单测为例，使用`@Subscribe`注解声明一个订阅者，然后创建对应的EventBus，并注册订阅者，接着发布事件，即可完成投递动作。
```java
public class EventBusTest {
    @Test
    public void testPostEvent() {
        EventBus eventBus = new EventBus("unit-test");
        eventBus.register(new EventBusTest());
        eventBus.post((new UserNotifyEvent("quding log out")));
    }

    @com.google.common.eventbus.Subscribe
    public void subscribe(UserNotifyEvent event) {
        System.out.println("subscribe event " + event);
    }
}
```

相比Spring事件设计，Guava将进程内的事件驱动机制该有的组件更加细分模块，如下所示：
- EventBus：事件发布者(事件总线)
- SubscriberRegistry：事件订阅者管理
- Dispatcher：事件分发

![](http://res.mrdear.cn/guava-event-bus.png)

总体实现比较简单，`EventBus`作为入口提供事件注册以及发布能力，这里也可以使用`AsyncEventBus`提供的异步能力进行事件处理。当注册一个事件时，`EventBus`会将其转交到`SubscriberRegistry`，`SubscriberRegistry`根据定义逻辑解析出来事件处理方法，比如guava会解析提交类中被`@Subscribe`标注的方法作为事件订阅者，其第一个入参为其感兴趣的事件。当产生一个事件后，`EventBus`会将从`SubscriberRegistry`中获取到对应的订阅者，然后一并转交给`Dispatcher`进行处理，guava中`Dispatcher`的实现主要是依赖队列，当直接同步执行时，为直接调用，当异步执行时，则需要一个共享队列进行排队，当需要顺序执行时，则需要队列绑定到当前ThreadLocal，对类似场景Guava有着不同的封装实现。
Guava的这一套API一直标准为BETA状态，但代码逻辑比简单，业务中直接使用也是很推荐的。

## 总结
理解了观察者模式后，事件机制实现原理也很容易理解，事件机制最大的优势是彻底解耦，合理使用会让代码设计上更加高内聚低耦合。
