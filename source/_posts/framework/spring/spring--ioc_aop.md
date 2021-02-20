---
title: 关于IoC与AOP的一些理解
subtitle: IoC与AOP要解决的关键问题是什么?怎么解决?
cover: http://imgblog.mrdear.cn/ioc_aop.png
author: 
  nick: 屈定
tags:
  - Spring
categories: Spring系列专题
urlname: framework-spring-apo-ioc
date: 2018-04-14 12:04:08
updated: 2020-05-05 21:43:23
---


最近在复习一些旧的知识，随着工作经验的增加，看待问题的眼光也在发生变化，重新谈谈对IoC与AOP新的理解。
- - - - -

## IoC（Inversion of Control）
IoC叫做控制反转，IoC提出的目的是解决项目中复杂的依赖关系，使用非硬编码的方式来扩展这些关系，简单来说就是为了解耦，在你需要的地方IoC容器会自动帮你注入对应的服务实例。

### 控制反转，反转的是什么？
控制反转是一种笼统的设计参考思想，简单点来说，在你为应用增加或者修改一个实现逻辑后，其他层对这部分的依赖都不需要变动，仍然可以正常工作，那么这就是一种控制反转，反转了程序对人的依赖，变为框架自动完成。举个例子在没有IOC的时代，A依赖B接口，但是接口又不能实例化，因此A需要知道B的子类，然后实例化B的子类，这种依赖实际上是依赖具体实现，而不是依赖接口，当实现变更为另一个时，就需要改动之前依赖的代码，显然不符合面向对象设计原则依赖倒置原则。那么IOC的出现就是为了反转这个依赖，这也是控制反转的意义。有了IOC，A只需要依赖B的接口，运行时需要B的实现子类会自动注入进来，这是IOC的魅力所在。

即使不用Spring，我们也经常会写一些控制反转的案例，比如模板设计模式，模板提供了整个运行的骨架，开发人员只需要在预留的扩展点实现自身逻辑，这种也可以被认为是一种控制反转思想。

### DI（依赖注入）
IoC控制反转是一种思想，这种思想在实施过程中会有很多问题，比如上述例子IB这个接口实现类很多，该怎么管理？A依赖IB，但是接口不能实例化，该怎么把具体实现类注入到A中？等等问题，那么一种实现方式就是DI（依赖注入），其中Spring就是选择了依赖注入实现IoC设计。

### 处理循环依赖
对于IoC来说一直存在循环依赖的难题，当A依赖B，B依赖C，C依赖A，彼此的依赖关系构成的是一个环形时，就是循环依赖，解决这种环形的依赖才是IoC的最关键的本质。(系统中出现循环依赖的话一不小心就掉进了死递归，因此尽可能避免循环依赖设计)

**构造注入**
构造注入时利用构造函数在实例化类的时候注入需要参数的一种方式。对于构造注入的循环依赖如下所示:
```java
  class A {
    private B b;
    // A的创建依赖B
    public A(B b) {
      this。b = b;
    }
  }
  
  class B {
    private A a;
    // B的创建依赖A
    public B(A a) {
      this。a = a;
    }
  }
```
那么结果自然是死锁，A需要B才能实例化，B需要A才能实例化，系统中有没有两个类的实例，互相僵持就是死锁，无法解决循环依赖问题。

**属性注入**
属性注入是在**类实例化**之后，通过set方法或者反射直接注入到对应的成员变量上的依赖注入方式，如下所示:
```java
  class A {
    private B b;

    public A() {
    }
    // 实例化之后set方法注入B
    public A setB(B b) {
      this。b = b;
      return this;
    }
  }

  class B {
    private A a;

    public B() {
    }
    // 实例化之后set方法注入A
    public B setA(A a) {
      this。a = a;
      return this;
    }
  }
```
与构造函数最大的不同点是去除了类的实例化对外部的强依赖关系，转而用代码逻辑保证这个强依赖的逻辑，比如属性注入失败直接抛异常让系统停止。那么此时的循环依赖解决办法就很简单了。
- 做法1: 系统初始化时不考虑依赖关系把所有的Bean都实例化出来，然后依次执行属性注入，因为每个Bean都有实例，所以循环依赖不存在死锁。
- 做法2: 按需实例化，实例化A，然后执行A的属性注入，发现依赖B，接着去实例化B，执行B的属性注入，此时A已经存在，那么B可以注入A，回到A的属性注入，拿到了B的实例，注入B。到此循环依赖解决。

回归本质，概括一下就是转变**强依赖到弱依赖**，把**实例化与属性注入两个步骤分开**来解决循环依赖的死锁。IoC的核心思想在于资源统一管理，你所持有的资源全部放入到IoC容器中，而你也只需要依赖IoC容器，该容器会自动为你装配所需要的具体依赖。

### 循环依赖的深入思考
循环依赖实际上场景有很多，在JDK当中就有类似的场景，比如Object类是所有类的父类，但是Java中每一个类都有一个对应的Class实例，那么问题就出来了Object类与Object对应的Class类就是一种鸡生蛋，蛋生鸡的问题。
那么这种问题解决的本质就是把**强依赖关系转换成弱依赖关系**，比如可以先把Object与Class对应的内存区域先创建出来，拿到地址引用后相互赋值，最后再一口气把两个都创建出来，和Spring IoC的处理是一模一样的。

用一个很形象的例子比喻：
> 番茄炒蛋，并不是先把番茄炒熟再炒鸡蛋，也不是把鸡蛋炒熟再炒番茄，而是先把番茄或者鸡蛋炒半熟，然后再混合炒，最红炒出来番茄炒鸡蛋，那么这个过程就是一种循环依赖的解决思路。

这一段参考知乎
[https://www.zhihu.com/question/30301819](https://www.zhihu.com/question/30301819)

## AOP

### AOP到底该怎么理解？
AOP是一种设计思想，这种设计思想的目的是不侵入你原有代码的基础上做一定的功能增强实现，这种思想在设计模式中有[装饰者模式](https://mrdear.cn/2018/03/08/experience/design_patterns--decorator_model/)，代理模式等等。那么Spring AOP就是基于动态代理这一设计模式实现了AOP设计，接下来聊一聊动态代理的本质，动态代理得益于Java的类加载机制，内存中生成字节码，然后使用类加载器进行加载，之后实例化出来就是可以用的实例。

从软件重用的角度来看，OOP设计只能在对象继承树的纵向上扩展重用，AOP则使的可以在横向上扩展重用，借助三棱镜分光原理可以更好地理解其AOP横向扩展的本质。(图片来自 《冒号课堂》)

![](http://imgblog.mrdear.cn/1557521693.png?imageMogr2/thumbnail/!100p)



### JDK的动态代理方式
JDK的动态代理是基于`Proxy`和`InvocationHandler`实现的，其中`Proxy`是拦截发生的地方，而`InvocationHandler`是发生调用的地方，创建动态代理方式如下:
```java
Proxy.newProxyInstance(this.getClass().getClassLoader()， new Class[]{interfaceClass}， new InvokerInvocationHandler(interfaceClass));
```
JDK的动态代理只能应用于接口，本质原因是其动态生成一个`extends Proxy implements yourInterface`的代理类，如下所示，由于Java是单继承的存在，因此针对非接口的类是无法动态代理。
其代理方法也很简单，直接将所有操作都转向到对应的`InvocationHandler`，然后用户的`InvocationHandler`就可以收到相关调用信息，然后做出相关的AOP动作。
```java
public final class $proxy4 extends Proxy implements IUserService {
    private static Method m1;
    private static Method m4;
    private static Method m2;
    private static Method m3;
    private static Method m0;
  
    public $proxy4(InvocationHandler var1) throws  {
      super(var1);
    }
  
    public final User findById(Long var1) throws  {
      try {
        return (User)super.h.invoke(this， m3， new Object[]{var1});
      } catch (RuntimeException | Error var3) {
        throw var3;
      } catch (Throwable var4) {
        throw new UndeclaredThrowableException(var4);
      }
    }
  。。。。。。
    public final int hashCode() throws  {
      try {
        return (Integer)super.h.invoke(this. m0， (Object[])null);
      } catch (RuntimeException | Error var2) {
        throw var2;
      } catch (Throwable var3) {
        throw new UndeclaredThrowableException(var3);
      }
    }
  。。。。。
  }
```

### Cglib的动态代理
cglib的动态代理相比JDK方式其更加灵活，支持非final修饰的类，其使用的策略是继承，然后覆盖上层方法，并且自己生成一个转向上层的方法，在覆盖的方法中传入转向上层的方法。说的有点抽象，看下面的**hashCode**实现: 其中`public final int hashCode()`属于覆盖的方法，`final int CGLIB$hashCode$2()`是转向上层的方法，然后再`MethodInterceptor`调用时将`CGLIB$hashCode$2`作为Method参数传入，这样保证了调用时可以转向父类已有的方法。
```java
public class IUserService$$EnhancerByCGLIB$$4ed3797 implements IUserService， Factory {
    。。。。
  private static final Callback[] CGLIB$STATIC_CALLBACKS;
  private MethodInterceptor CGLIB$CALLBACK_0;
  private static final Method CGLIB$hashCode$2$Method;
  private static final MethodProxy CGLIB$hashCode$2$Proxy;
  private static final Method CGLIB$findById$4$Method;
  private static final MethodProxy CGLIB$findById$4$Proxy;

  final int CGLIB$hashCode$2() {
    return super。hashCode();
  }

  public final int hashCode() {
    MethodInterceptor var10000 = this。CGLIB$CALLBACK_0;
    if (this.CGLIB$CALLBACK_0 == null) {
      CGLIB$BIND_CALLBACKS(this);
      var10000 = this.CGLIB$CALLBACK_0;
    }
    if (var10000 != null) {
      Object var1 = var10000.intercept(this， CGLIB$hashCode$2$Method， CGLIB$emptyArgs， CGLIB$hashCode$2$Proxy);
      return var1 == null ? 0 : ((Number)var1)。intValue();
    } else {
      return super。hashCode();
    }
  }

  final User CGLIB$findById$4(Long var1) {
    return super.findById(var1);
  }

  public final User findById(Long var1) {
    MethodInterceptor var10000 = this.CGLIB$CALLBACK_0;
    if (this.CGLIB$CALLBACK_0 == null) {
      CGLIB$BIND_CALLBACKS(this);
      var10000 = this.CGLIB$CALLBACK_0;
    }
    return var10000 != null ? (User)var10000.intercept(this， CGLIB$findById$4$Method， new Object[]{var1}， CGLIB$findById$4$Proxy) : super.findById(var1);
  }
}
```
### Spring AOP的实现
Spring AOP是基于动态代理实现了一种无侵入式的代码扩展方式，与动态代理本身不同的是AOP的前提是**已经存在了目标类的实例**，因此在AOP要做的就是在目标类执行目标方法前后织入相应的操作，对于AOP的实现有两个很重要的接口:
- MethodInvocation: AOP需要增强的那个方法的封装，其中包括被AOP的目标target，这个是为了解决嵌套问题所必须持有的对象。
- MethodInterceptor: AOP的拦截，AOP相关操作一般在其内部完成。
两者混合使用可以构造出如下结构:
`MethodInvocation`是对`HelloService。sayHello();`的封装，而`MethodInterceptor`持有了`MethodInvocation`，在调用其之前进行了增强处理，这就是AOP的实质。
![](http://imgblog.mrdear.cn/1523635444.png?imageMogr2/thumbnail/!100p)

### 处理this
假设`HelloService`被AOP增强，那么调用`sayHello()`时执行`this。sayWorld()`这行代码会走AOP处理吗?
```java
public class HelloService {

  public void sayHello() {
    System.out.println("hello");
    // 这里调用了本类的方法
    this。sayWorld();
  }

  public void sayWorld() {
    System.out.println("world");
  }
}
```
答案当然是不会，由上图可以得知: 无论AOP怎么增强最终调用`sayHello()`这个方法的实例一定是`HelloService`，那么这里的`this`也一定是`HelloService`，既然这样肯定不会走AOP代理了。还有一点要理解，造成这个的原因是**AOP要代理的那个类是实实在在存在的类，动态代理只是起到了方法调用的转发作用**。

解决办法也很简单，就是获取到代理类，然后再执行这个方法，对于Spring，可以从`ApplicationContext`中获取到当前的`HelloService`实例，这里获取到的自然是代理类，然后利用该实例调用`sayWorld()`就会走AOP代理了，大概形式如下，当然可以更好地封装下。
```java
public class HelloService implements ApplicationContextAware {
  private ApplicationContext applicationContext;

  public void sayHello() {
    System.out.println("hello");
    // 这里拿到代理类后再执行
    applicationContext.getBean("helloService"， HelloService.class)
        .sayWorld();
  }

  public void sayWorld() {
    System.out.println("world");
  }

  @Override
  public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
    this.applicationContext = applicationContext;
  }
}
```

### AOP嵌套问题
动态代理之后会产生一个代理类，那么把这个类当成target，也就是AOP后要转向的真实类操作，封装后然后接着AOP，就实现了嵌套。本质上是一样的道理，既然都是实实在在的类，那么就可以一直嵌套下去，这样的嵌套一般会形成一个功能链，Mybatis的Plugin就是利用这种形式来实现的。
代码上的实现就是在`MethodInvocation`对象中存储着要转向的`Object target`，如果这个target是代理类，那么这个传递转向会向责任链一样一直传下去，直到遇到最初被AOP的真实类。
```java
public class ReflectiveMethodInvocation implements MethodInvocation {

	private Object target;

	private Method method;

	private Object[] args;
      。。。。。
	@Override
	public Object proceed() throws Throwable {
		return method.invoke(target， args);
	}
      。。。。
}
```
### 如何获取AOP后的真实类?
想要获取到真实的类，那么就需要了解是什么代理方式。Spring中`org。springframework。aop。support。AopUtils`提供了如下方法来判断一个Object对象所被代理的方式，但是其局限在`object instanceof SpringProxy`，对于很多类实际上并没有实现`SpringProxy`接口，比如Mybatis的Mapper代理。因此建议自己代码中实现一个类似的工具类，**去除**前置`SpringProxy`的判断。
```java
    public static boolean isAopProxy(@Nullable Object object) {
        return object instanceof SpringProxy && (Proxy.isProxyClass(object.getClass()) || object.getClass().getName().contains("$$"));
    }

    public static boolean isJdkDynamicProxy(@Nullable Object object) {
        return object instanceof SpringProxy && Proxy.isProxyClass(object。getClass());
    }

    public static boolean isCglibProxy(@Nullable Object object) {
        return object instanceof SpringProxy && object.getClass().getName().contains("$$");
    }
```
判断类型后，对于JdkDynamicProxy，获取对应的`InvocationHandler`，对于`CglibProxy`获取对应的`CGLIB$CALLBACK_0`字段即可
