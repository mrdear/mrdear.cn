---
title: 设计模式--适配器模式的思考
subtitle: 关于适配器模式的一些思考,不仅仅是会写出设计模式的代码,更重要的是理解其背后的设计之道.
cover: http://res.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-adapter
date: 2018-03-14 10:03:51
updated: 2018-03-14 10:03:54
---
<!-- toc -->
- - - - -

个人认为适配器模式是一种加中间层来解决问题的思想,为的是减少开发工作量,提高代码复用率.另外在对于第三方的服务中使用适配器层则可以很好的把自己系统与第三方依赖解耦,降低依赖.

## 什么是适配器模式
适配器模式: 将一个类的接口转换为客户所期望的另一个接口.适配器让原本接口不兼容的类可以合作无间.类图如下:
![](http://res.mrdear.cn/1520949114.png?imageMogr2/thumbnail/!100p)

Client: 调用方
Target: 需要提供的新功能
AdaptedObject: 系统中原本存在的类似本次需要提供的新功能的类
Adapter: Target的实现类,主要负责该功能的实现,其内部持有`AdaptedObject`的对象,利用其对象完成本次需要提供的新功能.

整个流程大概如下:
1.客户通过目标接口调用适配器的方法发出请求.
2.适配器(Adapter)使用被适配器(AdaptedObject)已有的功能完成客户所期望的新功能
3.客户收到调用结果,但是并不知道是适配器起到的转换作用.
那么`Adapter`利用已经完成的`AdaptedObject`类实现本次提供的新功能,这一过程就是**适配**.

## Java I/O中的适配器
在Java I/O中有把字节流转换为字符流的类`java.io.InputStreamReader`以及`java.io.OutputStreamWriter`.那么这两个类实际上使用的就是适配器模式
以`InputStreamReader`为例,其继承了`Reader`类,所提供的功能是把字节流转换为字符流,其内部拥有`StreamDecoder`这一实例,所有的转换工作是由该实例完成.
```java
    public int read(char cbuf[], int offset, int length) throws IOException {
        // 使用被适配器的功能
        return sd.read(cbuf, offset, length);
    }
```
那么在这个例子中
Client是调用方,也就是我们开发人员
Target是`Reader`这个抽象类.
AdaptedObject是`StreamDecoder`,利用的是其功能.
Adapter是`InputStreamReader`

## Java Set集合中的适配器
Java中的Set集合有者无序,唯一元素,查找复杂度O(1)等特性.这些特性Map数据结构的key是完全符合的,那么就可以利用适配器模式来完成Set的功能.
以`HashSet`为例,其内部持有的是一个值为固定Object的Map,如下图
![](http://res.mrdear.cn/1520951534.png?imageMogr2/thumbnail/!100p)

其所有的操作会通过`HashSet`这个适配器来操作`HashMap`这个被适配器.比如:
```java    
public Iterator<E> iterator() {
        return map.keySet().iterator();
}
 public boolean add(E e) {
        return map.put(e, PRESENT)==null;
}
```
Client是调用方,也就是我们开发人员
Target是`Set`这个接口.
AdaptedObject是`HashMap`,利用的是其功能.
Adapter是`HashSet`

## Mybatis中的适配器模式
Mybatis作为一款通用框架,对于日志处理必然需要适配到各种日志框架,比如`slf4j`,`log4j`,`logback`等,每个日志的API多多少少有点不同,这种情况下适配器模式就起到了转换的作用.
以下图由于实现类太多,只列取了几个.
![](http://res.mrdear.cn/1520995813.png?imageMogr2/thumbnail/!100p)
Mybatis有自己的`org.apache.ibatis.logging.Log`接口,框架内部使用的都是自己的Log,具体使用哪一个Log是由配置中的适配器决定的.
以`org.apache.ibatis.logging.log4j2.Log4j2LoggerImpl`适配器为例,`org.apache.logging.log4j.Logger`为被适配者.`Log4j2LoggerImpl`是适配器,起到了转换的作用.
```java
public class Log4j2LoggerImpl implements Log {
  
  private static final Marker MARKER = MarkerManager.getMarker(LogFactory.MARKER);
  //被适配者
  private final org.apache.logging.log4j.Logger log;

  public Log4j2LoggerImpl(Logger logger) {
    log = logger;
  }

  @Override
  public boolean isDebugEnabled() {
    return log.isDebugEnabled();
  }
  .....
}
```

## 与装饰者模式的区别
个人认为这两种设计模式是完全不同的思想:
**装饰者模式**本意是增强功能,其装饰者与被装饰者对于调用方是很清晰的,比如`ContreteDecoratorA decoratorA = new ContreteDecoratorA(new ComponentInterfaceImpl());`就很清晰的知道使用`ContreteDecoratorA`装饰了`ComponentInterfaceImpl`.另外`ContreteDecoratorA`并没有改变`ComponentInterfaceImpl`的功能提供出去,而是为其进行了增强处理.
**适配器模式**本意是复用已有的代码,对已经存在的功能进行包装转换,以另一种形式提供出去.比如`HashSet`,对于调用方来说其内部使用的`HashMap`是不可见的,调用方不关心内部被适配者是谁,只是关注该功能本身也就是`Set`接口.
要说相同点的话那就是都是组合复用思想对一个对象进行包装,但其目的有着本质的区别.还望好好理解.

## 与外观模式的区别
**外观模式**本意是把一组复杂的关联行为进行包装,提供一个面向开发人员更为简单的使用方式.举个例子,你觉得JDBC方式不太好用,因此写了个DBUtils这种封装类,实际上就是一种外观模式,与适配器还是有着很大的区别.

## 备注
一家之言,个人主观理解还是有很多的,如果有错误还请指出.

