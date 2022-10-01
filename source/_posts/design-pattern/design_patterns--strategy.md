---
title: 设计模式--策略模式的思考
subtitle: 关于策略模式的一些思考,不仅仅是会写出设计模式的代码,更重要的是理解其背后的设计之道.
cover: http://res.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-strategy
date: 2018-03-18 09:03:13
updated: 2018-05-03 11:05:31
---
<!-- toc -->
- - - - -
策略模式是一种简单的设计模式,但是其在业务开发中是一种非常有用的设计模式.举个例子,当你的业务需要针对不同的场景(可以简单理解为枚举类),执行不同的策略时那么使用策略模式可以帮助你更好的写出低耦合与高可扩展的代码.
- - - - -
## 标准策略模式
策略模式: 把具体的算法从业务逻辑中分离出来,使得业务类不必膨胀,并且业务与具体算法分离,便于扩展新算法.类图如下:
![](http://res.mrdear.cn/1521374929.png?imageMogr2/thumbnail/!100p)
使用策略模式往往策略上有着相似的输入参数以及输出结果,或者有一个公共的上下文,便于抽象出策略接口`Strategy`,然后对应的业务Service只需要引用`StrategyContext`填充具体的策略完成自己的需求.
```java
new StrategyContext(new CouponStrategy()).sendPrize(uid, prize)
```
这是标准的策略模式,这种模式在如今的IOC下应用场景并不是很多,该模式有不少缺点
1. 客户端必须知道所有的策略,然后手动选择具体的策略放入到Context中执行.
2. 仍旧无法避免if/else逻辑,针对大多数场景下都是根据条件分支判断来选择具体的策略,那么在客户端耦合具体策略的情况下这个是没法避免的

## 策略枚举模式
Java的枚举类可以实现接口,而且枚举常量天然的可以与具体行为绑定,那么两者结合起来就是一种很棒的策略枚举模式(笔者自己起的名字).
```java
public enum StrategyEnum implements Strategy{
  COUPON(1) {
    @Override
    public boolean sendPrize(Long uid, String prize) {
      //发放优惠券
      return true;
    }
  },
  RMB(2) {
    @Override
    public boolean sendPrize(Long uid, String prize) {
      //发放RMB
      return true;
    }
  }
  ;
  private int code;
  StrategyEnum(int code) {
    this.code = code;
  }
}
```
相比标准的模式,该模式省掉了Context类,而且符合大多数场景,比如用户获得礼品,该礼品对应的是Mysql的一条记录,该记录有type标识是优惠券(Coupon)还是RMB,当DAO从DB查询出来后根据typeCode,定位到具体的枚举类,然后执行其`sendPrize(Long uid, String prize)`完成逻辑.这个流程很清晰.
基于枚举的策略模式也有一些问题:
1. 枚举类无法外部实例化,因此无法被IOC管理,往往策略实现都是复杂的依赖众多其他服务,那么这种时候枚举类就无从下手

## IOC配合下的策略模式
实践中,客户端往往不关心具体的实现类是如何实现的,他只需要知道有这个实现类的存在,其能帮我完成任务,得到我要的结果,所以在标准的策略模式基础上,扩展Context类,让其担任选择策略的能力,而不是客户端手动选择具体的策略,也就是具体策略实现与客户端解耦,转用枚举常量来代表其所希望的策略.改进后的Context(依赖Spring IOC)如下:
```java
@Component
public class StrategyContext implements InitializingBean {

  @Resource
  private Strategy couponStrategy;

  @Resource
  private Strategy RMBStrategy;
  /**
   * 保存策略与具体实现的Map
   */
  private static Map<StrategyEnum, Strategy> strategyMap = new HashMap<>(2);

  public Strategy getStrategy(StrategyEnum strategyEnum) {
    return strategyMap.get(strategyEnum);
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    strategyMap.put(StrategyEnum.COUPON, couponStrategy);
    strategyMap.put(StrategyEnum.RMB, RMBStrategy);
  }
}
```
客户端调用时使用
```java
strategyContext.getStrategy(StrategyEnum.COUPON).sendPrize(uid,prize)
```
这里的Context相当于中间层,提供的是外观模式的功能,当新增策略时只需要新增对应的枚举类,以及具体的实现策略,在Context中添加一个新的枚举与实现类关系.客户端代码基本不要任何改变.
**补充: **更加优雅的做法是利用Spring的事件机制,在Spring初始化完毕后再构建整个策略Map,可以参考我在观察者模式中所使用到的方法.
[设计模式--观察者模式的思考](https://mrdear.cn/2018/04/20/experience/design_patterns--observer/)

## 策略模式的本质
策略模式的本质是把复杂的算法从一个类中提取出来,用一种合理的方式管理起来,避免业务类的膨胀.
对于扩展只需要新增策略,而不需要怎么动业务代码.对于修改也只需要修改具体的策略类.业务类与策略成功的实现了低耦合.
与IOC的配合下可以更加彻底的与业务类解耦,其间只需要枚举类与策略接口进行联系,对于代码的扩展性更加有力.

## 与状态模式的关系
**状态设计模式**的类图结构与策略模式几乎是一致的.从逻辑上状态是平行的无法互相替换,但是策略与策略之间是可以完全替换的,只是实现方式的不同.在选择设计模式的时候是根据这一点来区分,代码上的体现是对于**状态设计模式以State结尾**,对于**策略设计模式以Strategy**结尾,让开发人员第一眼看过去就能明白整个设计的思路最佳.