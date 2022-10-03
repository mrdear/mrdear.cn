---
title: Dubbo -- 扩展机制实现原理
subtitle: Dubbo是一款支持高度自定义的框架,其设计就利用了SPI进行扩展,本文分析其上层实现原理.
cover: http://res.mrdear.cn/dubbo.png
author: 
  nick: 屈定
tags:
  - Dubbo
categories: 框架与中间件
urlname: framework-double-extension
date: 2018-06-01 10:06:14
updated: 2018-12-17 08:10:56
---
## 前言
Dubbo是一款设计非常棒的框架,最近开始看其源码,并且在这个过程中写一款RPC框架,可以当成tiny-dubbo,主要目的是写的过程学习设计思想.前段时间和一些朋友也聊到源码分析文章的意义在哪里,最后得出的结果是没有意义,没有解决实质问题的源码分析是没有必要的,如果要分析应该站在**上帝视角**,说出他的设计,并且这样设计的好处与坏处,而不是单纯的看每一行代码干什么,聊到最后有一种醒悟的感觉,之前看Spring MVC与Mybatis的源码就是犯了这种错误,因此该篇开始调整阅读姿势.
- - - - -

## Java SPI
聊Dubbo之前先聊一聊Java的SPI机制.关于SPI之前文章可以参考Java基础专题的相关文章,这里再提两个问题:
**1.SPI解决的问题是什么?**
在开发中经常有面向接口编程这一说法,接口就是协议,由调用方与实现方共同制定的契约,接口负责把调用方与实现方解耦.这其中会有一个问题实现方实现接口后怎么告知调用方?一般来说调用方维护一个Map（bean容器）,然后实现方把实现类注入进去,这种做法导致实现方每次新增一个实现类都要手动注入到调用方,这种当然是不符合开闭原则的做法,比较优雅的做法是Spring IOC,利用注解把所有实现类交给IOC管理,然后注入时根据接口就能拿到所有的实现,在运行时再根据配置自动选择,但是缺点是依赖Spring.那么SPI的做法就是类似Spring,但是其没有IOC容器,因此采用在classpath下配置方式来获取扩展点的实现类,SPI会扫描classpath下`META-INF/services`下所有实现类,然后在需要使用的时候自动实例化.
![](http://res.mrdear.cn/1524974589.png)
**2.SPI的核心思想是什么?**
我目前理解的是`Open Close Principle(OCP)`也就是开放关闭原则的实现策略,对扩展开放对修改关闭.使用起来的直观就是只需要引入相关架包,然后`ServiceLoader`会自动加载该实例,在使用的时候会自动创建实例提供给用户.整个过程如果用户是面向接口编程则不用修改任何代码便新增了一种该接口的实现,接着只要配置上所使用的实现即可.
对于Dubbo框架来说,其Service上有着许许多多的配置,比如下方的客户端服务配置动态代理方式选用`javaassist`,通信方式选用`netty`,这些在运行时都需要获取到具体的实现类来应用这些策略,并且用户可以自定义自己的策略,那么SPI的方式就是一种很好的插件式扩展实现.
```xml
<dubbo:reference id="demoService" interface="com.alibaba.dubbo.demo.DemoService" proxy="javassist" client="netty"/>
```

## Dubbo的扩展点设计
对于Dubbo来说一个SPI接口的Impl来源有两处`Spring IOC`与`SPI Loader`,所经历的过程是`类加载-> 实例化(实际上是在获取时的懒加载机制) -> 根据配置名称获取实例 -> 应用实例`,下面对这个流程分析,最后有一个总的关系图理清思路.

### 加载类
**1. Spring IOC**
对于`Spring IOC`类加载以及实例化都是由其本身来控制,Dubbo本身的设计对Spring并不是一个强依赖,获取实例都是通过`SpringExtensionFactory`这一适配器与`ApplicationContext`建立关联,从中取出所需要的实例.因此这里不多分析.
**2. SPI Loader**
Dubbo的SPI加载核心类为`ExtensionLoader`,以获取适配类为例,初次加载的大概流程如下:
![](http://res.mrdear.cn/1524981360.png)

**步骤1: **要获取`ProxyFactory`的适配类(关于适配类是什么后面会详细说),对于Dubbo来说有`JavassistProxyFactory`与`JdkProxyFactory`以及`StubProxyFactoryWrapper`三种实现类,获取的代码如下:
```java
    final ProxyFactory adaptiveExtension = ExtensionLoader.getExtensionLoader(ProxyFactory.class).getAdaptiveExtension();
```

**步骤2: ** `ExtensionLoader`的实例并不是所有SPI接口共享,每一个SPI接口都有其自己唯一的一个`ExtensionLoader`,因此在该方法中使用了缓存设计,这种设计一般私有化构造器,然后利用懒汉式单例实例化,存入一个所有类共享的Map中,对于`ExtensionLoader`其实例化之后所存入的Map为`ConcurrentMap<Class<?>, ExtensionLoader<?>>`.到这里只是实例化了`ExtensionLoader`实例,并没有触发加载行为,加载行为会在获取时触发,这是一种延迟加载设计,避免加载过多不需要用到的资源.

** 步骤3: ** `getAdaptiveExtension` 是获取适配类的入口,适配类与SPI也是一对一结构,因此这里使用了 **双重检查锁单例** 方式来创建该实例,双重检查需要`volatile`修饰提供可见性有序性的保证,这里的做法是使用`Holder`这一包装类来提供`volatile`修饰.

```java
public T getAdaptiveExtension() {
  Object instance = cachedAdaptiveInstance.get();
  if (instance == null) {
    // 由于加载时会出现异常,如果避免出现异常还一直加载,因此这里会先预判,只要出现过异常那么之后会一直加载失败
      if (createAdaptiveInstanceError == null) {
          synchronized (cachedAdaptiveInstance) {
            // 双重检查的核心,到同步块内部还需要再判断一次
              instance = cachedAdaptiveInstance.get();
              if (instance == null) {
                  try {
                      instance = createAdaptiveExtension();
                      cachedAdaptiveInstance.set(instance);
                  } catch (Throwable t) {
                    ...
                  }
              }
          }
      }
  }
  return (T) instance;
}
```
**步骤4: ** 步骤4 = 步骤5 + 步骤6,因此直接看步骤5

**步骤5: ** 步骤5是SPI加载流程,对于Dubbo来说加载会去`META-INF/services/`,`META-INF/dubbo/`,`META-INF/dubbo/internal/`三个路径中取获取对应实例,以`ProxyFactory`为例,dubbo的配置形式为`name -> impl`,如下形式:

```txt
stub=com.alibaba.dubbo.rpc.proxy.wrapper.StubProxyFactoryWrapper
jdk=com.alibaba.dubbo.rpc.proxy.jdk.JdkProxyFactory
javassist=com.alibaba.dubbo.rpc.proxy.javassist.JavassistProxyFactory
```

该加载会放入到`Holder<Map<String, Class<?>>>`中,key为名称,value是对应的class实现类,这里也用到了单例,主要原因是Dubbo的一个`ExtensionLoader`实例有太多的触发加载入口因此需要避免多次加载带来性能影响,执行到此时已经完成类类加载以及静态字段,静态块的初始化流程,但是具体能使用的类还没有被实例化出来.

**步骤6: ** 步骤6则是创建适配类,适配类给我一种黑科技的感觉.首先说下什么是适配类?适配类是一种 **组合设计模式的思想**（关于组合设计模式可以参考我博客设计模式专题）,前面说过对于Dubbo来说一个SPI接口的Impl来源有两处`Spring IOC`与`SPI Loader`,但是对于调用方来说这些都是无关紧要的,他只关心能不能获取到实例,因此需要提供一个统一的调用入口,也就是组合适配类.

`ExtensionFactory`是Dubbo中获取扩展实例的入口,其主要实现类有`SpiExtensionFactory`从SPI中获取,`SpringExtensionFactory`从Spring IOC中获取.然后提供了一个适配类来组合这两个容器,如下代码所示,Dubbo中适配类的标志是标注了`@Adaptive`注解,这样在`ExtensionLoader`加载中会自动将其标注为唯一的适配类.(**注意: Dubbo中一种SPI Class只允许有一个适配类**)
![](http://res.mrdear.cn/1524983875.png)
```java
@Adaptive
public class AdaptiveExtensionFactory implements ExtensionFactory {
    // 叶子节点
    private final List<ExtensionFactory> factories;

    public AdaptiveExtensionFactory() {
        ExtensionLoader<ExtensionFactory> loader = ExtensionLoader.getExtensionLoader(ExtensionFactory.class);
        List<ExtensionFactory> list = new ArrayList<ExtensionFactory>();
        for (String name : loader.getSupportedExtensions()) {
            list.add(loader.getExtension(name));
        }
        factories = Collections.unmodifiableList(list);
    }

    public <T> T getExtension(Class<T> type, String name) {
      // 从叶子节点中找到对应的实例
        for (ExtensionFactory factory : factories) {
            T extension = factory.getExtension(type, name);
            if (extension != null) {
                return extension;
            }
        }
        return null;
    }

}
```
组合适配类在Dubbo中有两种实现,一种是上面`AdaptiveExtensionFactory`手动实现的适配类,另一种则是代码生成的类,对于`ProxyFactory`这个SPI来说其适配类就是自动生成的,其实现也很简单,主要是从RPC的URL配置中获取到对应的配置,然后再去`ExtensionLoader`中获取相应的实例.
```java
public class ProxyFactory$Adaptive implements com.alibaba.dubbo.rpc.ProxyFactory {

  public java.lang.Object getProxy(com.alibaba.dubbo.rpc.Invoker arg0) throws com.alibaba.dubbo.rpc.RpcException {
    if (arg0 == null) throw new IllegalArgumentException("com.alibaba.dubbo.rpc.Invoker argument == null");
    if (arg0.getUrl() == null) throw new IllegalArgumentException("com.alibaba.dubbo.rpc.Invoker argument getUrl() == null");
    com.alibaba.dubbo.common.URL url = arg0.getUrl();
    String extName = url.getParameter("proxy", "javassist");
    if (extName == null) throw new IllegalStateException("Fail to get extension(com.alibaba.dubbo.rpc.ProxyFactory) name from url(" + url.toString() + ") use keys([proxy])");
    com.alibaba.dubbo.rpc.ProxyFactory extension = (com.alibaba.dubbo.rpc.ProxyFactory) ExtensionLoader.getExtensionLoader(com.alibaba.dubbo.rpc.ProxyFactory.class).getExtension(extName);
    return extension.getProxy(arg0);
  }

  public com.alibaba.dubbo.rpc.Invoker getInvoker(java.lang.Object arg0, java.lang.Class arg1, com.alibaba.dubbo.common.URL arg2) throws com.alibaba.dubbo.rpc.RpcException {
    if (arg2 == null) throw new IllegalArgumentException("url == null");
    com.alibaba.dubbo.common.URL url = arg2;
    String extName = url.getParameter("proxy", "javassist");
    if (extName == null) throw new IllegalStateException("Fail to get extension(com.alibaba.dubbo.rpc.ProxyFactory) name from url(" + url.toString() + ") use keys([proxy])");
    com.alibaba.dubbo.rpc.ProxyFactory extension = ExtensionLoader.getExtensionLoader(com.alibaba.dubbo.rpc.ProxyFactory.class).getExtension(extName);
    return extension.getInvoker(arg0, arg1, arg2);
  }
}
```
### 根据配置拿到实例
获取指定名称实例的方法为`com.alibaba.dubbo.common.extension.ExtensionLoader#getExtension`方法,`ExtensionLoader`在加载时会缓存所有的Class,那么获取实际上是会从`ConcurrentMap<String, Holder<Object>> cachedInstances`Map中获取,利用双重检查锁方式判断存在实例则直接返回,不存在则实例化然后再保存.上述动态生成的适配类获取方式就是如此:
```java
ProxyFactory extension = ExtensionLoader.getExtensionLoader(ProxyFactory.class).getExtension(extName);
```
另外Dubbo这里实际上有两层缓存,在创建时还会存入一个全局的`ConcurrentMap<Class<?>, Object> EXTENSION_INSTANCES`中,有点**不明白为什么这样做**,感兴趣的可以详细去看看源码,如有思路还请告知.

### 内存中示意图
![](http://res.mrdear.cn/1524985704.png)

## 总结
Dubbo利用SPI机制实现了高度的灵活性设计,模块之间相互解耦,可以根据配置动态修改,提供了最大的灵活性,其核心里面微核+扩展，微核定义了主要的功能，扩展上定义了不同的实现策略，启动时按需加载不同的策略，文章笔者的理解如果有偏差还请告知,以免误人子弟.
