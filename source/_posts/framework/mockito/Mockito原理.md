---
title: Mockito -- Mockito原理
subtitle: 了解Mockito的原理，为了更加自由的mock对象
cover: http://imgblog.mrdear.cn/uPic/Mockito.png-default
author: 
  nick: 屈定
tags:
  - Mockito
categories: 框架与中间件
urlname: framework-mockito
date: 2020-07-19 09:40:05
updated: 2020-07-19 09:40:08
---

最近开始使用Mockito进行单元测试，本篇文章是理解Mockito并对其常见测试方式进行归纳总结。

## Mocito体系
从使用角度，可以将Mockito分为插桩以及验证，使用者只需要关心模块提供的能力，不需要太过于深入了解。
- 插桩
    - ArgumentMatcher：参数匹配工具，比如Mokito.eq("屈定")类似语句会创建该匹配
    - OngoingStubbing：mock入口类，用于打桩，应对 when() thenXXX形式
    - Stubber：mock入口类，用于打桩，应对doXXX when()形式
- 验证
    - VerificationMode：验证器，用于验证mock对象行为，常见实现有times()
    - InOrder：验证器的一种，用于验证执行顺序
    - ArgumentCaptor：用于被mock对象参数捕获


## Mockito原理
想要在开发中随心所欲的使用Mockito达到单测目的，了解Mockito原理是必须的。当我们在用Mockito时，经常写出以下类似代码，从逻辑上可以分为四部分：定义Mock对象，定义方法返回值，调用**单测方法**(这里直接调用mock方法，方便阐述原理)，验证业务结果。那么每一步骤对于Mockito分别做了什么呢？
```java
UserService mockService = Mockito.mock(UserService.class);

Mockito.when(mockService.queryUser(Mockito.eq("xxx")))
    .thenReturn(new User("屈定"));

User user = mockService.queryUser("xxx");
Assertions.assertEquals("屈定", user.getOwner());
```
简单来看，我们可以猜想到所谓的Mock测试技术原理应是预先定义好该方法返回值，使用AOP技术拦截对应的方法执行，当拦截直接返回对应的值，从而达到Mock效果，如下图所示：
![](http://imgblog.mrdear.cn/uPic/mockito_simple_struct.png-default "")

问题回到Mockito，可以提出以下三个问题为思考的切入点：
- Mockito是如何创建AOP对象的
- Mockito是如何预先定义方法返回值
- Mockito是如何拦截方法执行并返回给定mock值的

### Mockito是如何创建AOP对象的
Mockito AOP对象的创建，对应代码的第一行`Mockito.mock(UserService.class)`，贴一下相关代码
```java
# Mockito.mock(UserService.class)
 public static <T> T mock(Class<T> classToMock, MockSettings mockSettings) {
        return MOCKITO_CORE.mock(classToMock, mockSettings);
}

# MOCKITO_CORE.mock(xxxx)
public <T> T mock(Class<T> typeToMock, MockSettings settings) {
    if (!MockSettingsImpl.class.isInstance(settings)) {
        throw new IllegalArgumentException("Unexpected implementation of '" + settings.getClass().getCanonicalName() + "'\n" + "At the moment, you cannot provide your own implementations of that class.");
    }
    MockSettingsImpl impl = MockSettingsImpl.class.cast(settings);
    MockCreationSettings<T> creationSettings = impl.build(typeToMock);
    T mock = createMock(creationSettings);
    mockingProgress().mockingStarted(mock, creationSettings);
    return mock;
}
```
上述代码中，`Mockito`会使用全局静态变量`MOCKITO_CORE`创建代理对象，核心逻辑都在`MockitoCore`中，我们不必关心很细节，所以仍然按照带着问题的方式去探索。

**1.**创建中的`MockSettings`可以做什么？

`MockSettings`可以针对一个mock对象创建做额外的配置，比如使用指定构造函数进行初始化，设置mock的一些调用监听器，以及mock拦截后默认返回值，一般创建时不指定，系统默认为`new MockSettingsImpl().defaultAnswer(RETURNS_DEFAULTS)`。

**2.**代理对象创建使用的是什么技术？对应拦截器实现是什么？

对应细节都在`createMock(...)`方法中，这里就不贴代码，直接说结论。Mockito内部有一套插件机制，其中生成代理类对应`MockMaker`扩展点，默认实现为`org.mockito.internal.creation.bytebuddy.SubclassByteBuddyMockMaker`，即用ByteBuddy技术生成对应代理类，`ByteBuddy`博主了解的不是很多，但根据`SubclassBytecodeGenerator`处的源码可以发现其本质是使用**继承**动态创建需要代理类的子类，然后复写对应方法达到拦截目的，因此也说明了Mockito不支持final类，不支持static，private等方法mock的原因，不过这个算不上缺点，private方法外部根本不用关心，因此无需考虑mock，static方法作为全局使用的工具类型方法，如果也需要mock那么说明存在坏代码的味道，最好的做法是重构，而不是想方设法的mock。另外Mockito提供了`InlineByteBuddyMockMaker`实现类，该类利用**Instrumentation API**特性实现了静态方法，私有方法，final方法等拦截，更加强大，该特性还在试验中，感兴趣的可以尝试。

`ByteBuddy`代理类默认拦截器为`org.mockito.internal.creation.bytebuddy.MockMethodInterceptor`类。该类面向ByteBuddy提供的调用入口，内部会将参数包装后，给到真正的Mock拦截器`org.mockito.invocation.MockHandler`，进而决定返回或者插桩定义。`MockHandler`的实现可以理解为下图结构，
![](http://imgblog.mrdear.cn/uPic/mockito_method_handler.png-default "")

**3.**Mockito如何保证线程安全

在测试中会开启多线程测试，而Mockito又是一个静态调用形式，内部MockitoCore是全局共享变量，如果没有一定处理措施，必然会导致并发冲突。Mockito的解决方案是使用ThreadLocal，其提供`MockingProgress`类存储当前mock进度信息，提供`ThreadSafeMockingProgress`使其与ThreadLocal进行绑定，线程安全和mock本身原理关系不是很大，这里不多做分析，具体细节感兴趣的可以去了解下。

### Mockito是如何预先定义方法返回值
常用的预定义方法返回值主要有两种形式`when() thenXXX`，`doXXX when`，很多同学不理解这两个的区别，事实不然，两者的存在都很有必要，按照上述拦截后执行逻辑，分别分析两者的不同点。

**1.**when() thenXXX是如何预定义值的

还是以上述为例`Mockito.when(mockService.queryUser(Mockito.eq("xxx"))).thenReturn(new User("屈定"));`，Java是顺序执行代码的，那么针对该部分代码执行顺序可以拆解为以下几个步骤，下面分别分析：

- Mockito.eq("xxx")
    - 往`MockingProgress`添加一个equal的ArgumentMatcher，`MockingProgress`使用Stack结构存储ArgumentMatcher，因此可以推测出，这里默认规则在方法拦截前所有的ArgumentMatcher都会按照执行顺序入栈。
- mockService.queryUser
    - mockService已经被代理了，因此该方法会直接进入`org.mockito.internal.handler.MockHandlerImpl#handle`中，此时MockHandler发现该是一个方法调用，接着去查找对应的ArgumentMatcher与其绑定，存到Stub Container中，mockContainer结构可以看作为`UserService+queryUser+eq(xxx)  -> NULL`
- Mockito.when
    - 这里when接收到的参数实际上是NULL，因为上面的queryUser并没有对应值与其绑定，此时When相当于返回`MockingProgress`的mock进度
- new User("屈定")
    - 普通创建对象
- OngoingStubbing.thenReturn
    - OngoingStubbing则是`MockingProgress`中当前mock进度，thenReturn会创建`Returns`对象，该对象会与上一个方法调用进行绑定，因此执行完毕后，mockContainer结构可以看作`UserService+queryUser+eq(xxx)  -> User(“屈定”)`

**2.**doXXX when()是如何预定义的

在doXXX when()模式下，一般这样`Mockito.doReturn(new User("屈定")).when(mockService).queryUser(Mockito.eq("xxx"));`定义mock，按照同样步骤进行拆解：

- new User("屈定")
    - 普通创建对象
- Mockito.doReturn
    - 此时该方法创建的是一个`StubberImpl`对象，与上述流程是不一样的。该类有成员变量`List<Answer<?>> answers`，此方法执行会将对应Answer对象暂存到该集合中
- Stubber.when
    - when的入参是被mock对象，那么就能拿到`MockingProgress`获取当前mock进度，之后再把成员变量`List<Answer<?>> answers`与当前mock对象进行绑定，此时mockContainer结构可以看作`NULL -> User(“屈定”)`
- Mockito.eq("xxx")
    - 同上，往`MockingProgress`添加一个equal的ArgumentMatcher
- UserService.queryUser
    - 同上，进入到拦截器，然后与对应Answer绑定，mockContainer结构可以看作为`UserService+queryUser+eq(xxx)  -> User(“屈定”)`

**3.**两者的不同点带来什么不同

按照上述流程分析，无论是`when() thenXXX`还是`doXXX when()`，最终都能得到`UserService+queryUser+eq(xxx)  -> User(“屈定”)`的结构，那两者的不同点是为了什么呢？
在Mock代理中，因为Mock都会被拦截掉，并不会有任何真实调用，两者所产生的效果是没有区别的。`doXXX when()`主要是用在Spy和void返回形式上，在Spy模式下，`UserService.queryUser`会产生真实调用，`doXXX when()`的做法是将调用放在最后一步，调用时，已经知道对应的Answer了，而`when() thenXXX`则是在最后一步才知道Answer，无法做拦截。

### Mockito是如何拦截方法执行并返回给定mock值的
第二个问题分析过程中实际上已经回答了这个问题，在Mock构建完毕后，对应的方法调用Invocation以及Answer是一一对应绑定起来的，因此只需要找到对应的stub，然后发现有Answer直接返回即可

## 参考
上文主要来源于源码翻查以及网上一些资料，如有错误，还请指出。

[反模式的经典 - Mockito 设计解析](https://www.infoq.cn/article/mockito-design)
[Mockito官方文档](https://www.javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)