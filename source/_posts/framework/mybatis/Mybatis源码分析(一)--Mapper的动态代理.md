---
title: Mybatis源码分析(一)--Mapper的动态代理
subtitle: 分析Mapper接口是如何自动生成对应Java类,并与mapper.xml所关联起来的.
cover: http://imgblog.mrdear.cn/mybatis.png
author: 
  nick: 屈定
tags:
  - Mybatis    
  - 设计模式
categories: 框架与中间件
urlname: framework-mybatis-mapper-proxy
date: 2017-09-07 22:04:05
updated: 2017-09-07 22:04:05
---
工作中用的最多的就是Mybatis这款半自动ORM框架,用的久却对其了解不是很深,因此打算开一系列文章对其进行解析,顺便对知识进行查漏补缺.本篇是对Mapper动态代理原理的详解.
- - - - -
### 代理模式定义
为另一个对象提供一个替身或者占位符以控制对这个对象的访问.也就是说目的是控制对象形式其职责.当然也可以增强其职责,比如Spring AOP.
### 代理模式类图
由下图分析,代理模式所需要的角色为:
1. 对外的行为接口Subject,对于调用方Client可见
2. RealSubject真实的Subject,其包含具体的接口行为,对于Client不可见
3. 代理类Proxy,其是RealSubject的替身,也可以当成对RealSubject的一层包装,对于Client不可见.
![](http://imgblog.mrdear.cn/1504793889.png?imageMogr2/thumbnail/!150p)

### JDK动态代理Example
案例采取Java的动态代理形式开发,按照上述类图定义角色
**Subject**
```java
public interface Subject {
  /**
   * 反转输入的input字符串
   * @param input 要反转的串
   * @return 反转后的串
   */
  String reversalInput(String input);
}
```
**RealSubject**
```java
public class RealSubject implements Subject {

  public String reversalInput(String input) {
    System.out.println("我是RealSubject: "+input);
    return new StringBuilder(input).reverse().toString();
  }
}
```
**SubjectProxy**
该类实现了InvocationHandler,实际上是对调用的拦截,拦截后转向真实对象的调用,从而拿到正确的结果.是不是很像装饰者模式?其实也可以这样理解,设计模式之前本身就有很多关联性,不需要认定某一个行为就是单一的某个模式,从产生效果来看这里的SubjectProxy实际上就是对RealSubject的装饰,只不过这个装饰并没有添加新功能.

```java
public class SubjectProxy implements InvocationHandler {

  private Object target;

  public SubjectProxy(Object target) {
    this.target = target;
  }

  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    System.out.println("proxy subject is "+proxy.getClass());
    System.out.println("real subject : "+ToStringBuilder.reflectionToString(target));
    System.out.println("method: "+method);
    System.out.println("args: "+ ToStringBuilder.reflectionToString(args));
    return method.invoke(target, args);
  }
}
```
**Client**
```java
public class Client {

  public static void main(String[] args) {
    RealSubject subject = new RealSubject();

    Subject proxyInstance = (Subject) Proxy.newProxyInstance(
        Subject.class.getClassLoader(),
        new Class[]{Subject.class},
        new SubjectProxy(subject));

    System.out.println(proxyInstance.reversalInput("hello world"));
  }
}
```
**输出**
```conf
proxy is class com.sun.proxy.$Proxy0
target proxy: cn.mrdear.proxy.RealSubject@51016012[]
method: public abstract java.lang.String cn.mrdear.proxy.Subject.reversalInput(java.lang.String)
args: [Ljava.lang.Object;@29444d75[{hello world}]
我是RealSubject: hello world
dlrow olleh
```
**分析**
1.动态代理哪里体现了动态?
> 对于常规Java类变量创建要求有.java文件,然后编译成.class文件,然后虚拟机加载该.class文件,最后才能生成对象.但是对于`Subject proxyInstance`该代理类其是不存在.java文件的,也就是该对象的.class文件是动态生成的,然后虚拟机加载该class文件,创建对象.在Proxy.java中有如下代码动态生成class文件,感兴趣的话可以研究研究,这里不多深入.
```java
            /*
             * Generate the specified proxy class.
             */
            byte[] proxyClassFile = ProxyGenerator.generateProxyClass(proxyName, interfaces, accessFlags);
```

2.JDK动态代理的要求
>JDK动态代理只能针对接口,如果要针对普通类则可以考虑CGLib的实现,这里不多分析.其次动态代理的要求有接口类`Subject`,`InvocationHandler`代理方法类存在,才能创建出代理对象,代理对象的执行方法都被`InvocationHandler`接口所拦截,转向真实类的执行或者你想要的操作.

### Mybatis的动态Mapper
由上面内容可以看出JDK动态代理需要接口,真实实现类,Clinet调用方,在常规的Mybatis的Mapper代理中接口就是Mapper,Client是service,那么真实的实现类是什么?显而易见这里就是Mapper代理的关键点.

### MapperProxyFactory
顾名思义该类是产生Mapper接口的工厂类,其内部有如下方法,由此可以看出`MapperProxy`是方法拦截的地方,那么到此动态代理所需要的必须角色都以凑齐,那么接下来分析最重要的`MapperProxy`方法拦截.
```java
 protected T newInstance(MapperProxy<T> mapperProxy) {
    return (T) Proxy.newProxyInstance(mapperInterface.getClassLoader(), new Class[] { mapperInterface }, mapperProxy);
  }
```
### MapperProxy
该类是Mapper接口的Proxy角色,继承了`InvocationHandler`,所以具有方法拦截功能,看代码注释.
```java
  @Override
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    try {
      if (Object.class.equals(method.getDeclaringClass())) { //判断是否为Object,是的话则不是mapper接口代理方式
        return method.invoke(this, args);
      } else if (isDefaultMethod(method)) { //判断是否为接口中的默认方法,jdk8允许接口中声明默认方法.
        return invokeDefaultMethod(proxy, method, args);
      }
    } catch (Throwable t) {
      throw ExceptionUtil.unwrapThrowable(t);
    }
    //对正常Mapper请求的处理
    final MapperMethod mapperMethod = cachedMapperMethod(method);
    return mapperMethod.execute(sqlSession, args);
  }
```
对于正常的Mapper接口中的方法调用,mybatis都会转向到`MapperMethod`的execute方法中执行,拿到结果返回给调用方Client,整个代理过程结束.对于正常调用是有缓存的,并且该代理类是项目启动时就生成好的,对于性能影响并不是很大实用性还是很高的.

这里要注意下对于默认接口方法的处理`invokeDefaultMethod(proxy, method, args)`,该方法中每次都直接生成代理类,对性能是一种损耗应该不小,所以**不建议在Mapper接口中写默认方法**.
```java
  @UsesJava7
  private Object invokeDefaultMethod(Object proxy, Method method, Object[] args)
      throws Throwable {
    final Constructor<MethodHandles.Lookup> constructor = MethodHandles.Lookup.class
        .getDeclaredConstructor(Class.class, int.class);
    if (!constructor.isAccessible()) {
      constructor.setAccessible(true);
    }
    final Class<?> declaringClass = method.getDeclaringClass();
    return constructor
        .newInstance(declaringClass,
            MethodHandles.Lookup.PRIVATE | MethodHandles.Lookup.PROTECTED
                | MethodHandles.Lookup.PACKAGE | MethodHandles.Lookup.PUBLIC)
        .unreflectSpecial(method, declaringClass).bindTo(proxy).invokeWithArguments(args);
  }
```

### 总结
从上面来看动态代理的最大的好处就是接口(不单指Java的interface,也包括CGLib的动态代理实现)与其实现类的解耦,原本接口和动态类之间是强关联状态,接口不能实例化,实现类必须实现接口的所有方法,有了动态代理之后,接口与实现类的关系并不是很大,甚至不需要实现类就可以完成调用,比如Mybatis这种形式,其并没有创建该接口的实现类,而是用一个方法拦截器转向到自己的通用处理逻辑.
另外就是Spring AOP的动态代理,解耦后自然可以实现对原有方法增强的同时又对其代码的零侵入性.
最后Mybatis的Mapper动态代理实现原理还是很清晰的,下一篇具体分析`MapperMethod`,顺便学习Mybatis的各种设计模式.







