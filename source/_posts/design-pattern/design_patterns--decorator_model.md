---
title: 设计模式--装饰者模式思考
subtitle: 关于装饰者模式的思考,以及装饰者模式在JavaIO体系中解决的问题.
cover:  http://res.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-decorator-model
date: 2018-03-08 09:03:29
updated: 2018-06-23 10:06:20
---
<!-- toc -->
- - - - -
装饰者模式实际上是一直提倡的**组合代替继承**的实践方式,个人认为要理解装饰者模式首先需要理解为什么需要**组合代替继承**,继承又是为什么让人深恶痛绝.

## 为什么建议使用组合代替继承?
面向对象的特性有继承与封装,但两者却又有一点矛盾,继承意味子类依赖了父类中的实现,一旦父类中改变实现则会对子类造成影响,这是打破了封装性的一种表现.
而组合就是巧用封装性来实现继承功能的代码复用.
举一个Effective Java中的案例,当前需求是为HashSet提供一个计数,要求统计它创建以来曾经添加了多少个元素,那么可以写出下面的代码.
```java
public class InstrumentedHashSet <E> extends HashSet<E> {

  private int addCount = 0;

  @Override
  public boolean add(E e) {
    this.addCount++;
    return super.add(e);
  }

  @Override
  public boolean addAll(Collection<? extends E> c) {
    this.addCount += c.size();
    return super.addAll(c);
  }
  public int getAddCount() {
    return this.addCount;
  }
}
```
下面测试代码会抛出异常,正确结果是6,是不是匪夷所思,这种匪夷所思需要你去看`HashSet`的具体实现,其`addAll`实际上是调用了`add`方法.
```java
  InstrumentedHashSet<String> hashSet = new InstrumentedHashSet<>();
    hashSet.addAll(Arrays.asList("张三", "李四", "王二"));
    Assert.assertEquals(hashSet.getAddCount(), 3);
```
这个案例说明了继承导致子类变得很脆弱,其不知道父类的细节,但是却实实在在的依赖了父类的实现.出现了问题也很难找出bug.本质原因是**HashSet并不是专门为继承所设计的类**,因此强行继承那会出现意想不到的问题.有关什么时候该用继承在[设计模式--模板方法模式的思考](https://mrdear.cn/2018/03/25/experience/design_patterns--template_method/)一文章有相关讨论,感兴趣的可以去看看.

回到正题那么换成组合模式,让`InstrumentedHashSet`持有`HashSet`的私有实例,add以及addAll方法由`HashSet`的私有实例代理执行.这就是组合所带来的优势,充分利用其它类的特点,降低耦合度,我只需要你已完成的功能,相比继承而并不受到你内部实现的制约.
```java
public class InstrumentedHashSet <E>{

  private int addCount = 0;

  private HashSet<E> hashSet = new HashSet<>();

  public boolean add(E e) {
    this.addCount++;
    return hashSet.add(e);
  }

  public boolean addAll(Collection<? extends E> c) {
    this.addCount += c.size();
    return hashSet.addAll(c);
  }

  public int getAddCount() {
    return this.addCount;
  }
}
```


## 装饰者模式
装饰者模式定义为:动态的给一对象添加一些额外的职责,对该对象进行功能性的增强.(只是增强,并没有改变使用原对象的意图)
装饰器模式类图:
![](http://res.mrdear.cn/1520506012.png?imageMogr2/thumbnail/!100p)
以上是标准的装饰器模式,其中`AbstractDecorator`为一个装饰器模板,目的是为了提高代码复用,简化具体装饰器子类的实现成本,当然不需要的话也是可以省略的,其最主要的功能是持有了`ComponentInterface`这个被装饰者对象,然后子类可以利用类似AOP环绕通知形式来在被装饰类执行`sayHello()`前后执行自己的逻辑.这是装饰者模式的本质.

比如`ContreteDecoratorA`增强了`sayHello()`
```java
public class ContreteDecoratorA extends AbstractDecorator {

  public ContreteDecoratorA(ComponentInterface componentInterface) {
    super(componentInterface);
  }

  @Override
  public void sayHello() {
    System.out.println("A start");
    super.sayHello();
    System.out.println("A end");
  }
}
```
具体使用方式
```java
 public static void main(String[] args) {
    final ContreteDecoratorA decoratorA = new ContreteDecoratorA(new ComponentInterfaceImpl());
    decoratorA.sayHello();
  }
```
输出
```txt
A start
hello world
A end
```
其中默认实现`ComponentInterfaceImpl`的sayHello()功能被装饰后增强.

## Java I/O与装饰者

### 字节流
Java I/O框架就是一个很好的装饰者模式的实例.如下`InputStream`关系图
![](http://res.mrdear.cn/1520512559.png?imageMogr2/thumbnail/!100p)
其中`FileInputStream`,`ObjectInputStream`等直接实现类提供了最基本字节流读取功能.
而`FilterInputStream`作为装饰者,其内部引用了另一个`InputStream`(实际被装饰的对象),然后以AOP环绕通知的形式来进行功能增强,笔者认为这里应该把该类定义为abstract更为合适.其承担的角色只是代码复用,帮助具体的装饰者类更加容易的实现功能增强.
![](http://res.mrdear.cn/1520512740.png?imageMogr2/thumbnail/!100p)
具体的装饰者`BufferedInputStream`为其他字节流提供了缓冲输入的支持.`DataInputStream`则提供了直接解析Java原始数据流的功能.

由于装饰者模式的存在,原本一个字节一个字节读的`FileInputStream`只需要嵌套一层`BufferedInputStream`即可支持缓冲输入,
```java
    BufferedInputStream br = new BufferedInputStream(new FileInputStream(new File("path")));
```

### 字符流
相比较字节流,字符流这边的关系则有点混乱,主要集中在`BufferedReader`与`FilterReader`,其两个角色都是装饰者,而`FilterReader`是更加基本的装饰者其相对于字节流中的`FilterInputStream`已经升级为abstract了,目的就是便于具体装饰者实现类更加容易的编写.那么为什么`BufferedReader`不继承`FilterReader`呢?这个问题暂时不知道答案,有兴趣的可以关注下知乎,等大牛回答.
[为什么BufferedReader 不是 FilterReader的子类，而直接是Reader的子类？](https://www.zhihu.com/question/57094582/answer/337119885)

不过从另一个角度来说,设计模式并不是套用模板,其最主要的是思想,对于装饰者模式最重要的是利用组合代替了继承,原有逻辑交给内部引用的类来实现,而自己只做增强功能,只要符合这一思想都可以称之为装饰者模式.
![](http://res.mrdear.cn/1520514188.png?imageMogr2/thumbnail/!100p)

## Mybatis与装饰者
Mybatis中有不少利用到装饰者模式,比如二级缓存`Cache`,另外其`Executor`也正在朝着装饰者模式改变.这里以Cache接口为主,类图如下:
![](http://res.mrdear.cn/1520515773.png?imageMogr2/thumbnail/!100p)
从类图来看和装饰者模式似乎无半毛钱关系,实际上其省略了`AbstractDecorator`这一公共的装饰者基类.那么要实现装饰者其实现类中必须有一个Cache的被装饰对象,以LruCache为例.
```java
public class LruCache implements Cache {

  private final Cache delegate;
  private Map<Object, Object> keyMap;
  private Object eldestKey;
  
  @Override
  public String getId() {
    return delegate.getId();
  }
  ....
}
```
其内部拥有`Cache delegate`这一被装饰者,也就是无论什么Cache,只要套上了`LruCache`那么就有了LRU这一特性.
在`org.apache.ibatis.mapping.CacheBuilder#setStandardDecorators`构造时则根据配置参数来决定增强哪些功能,下面代码则很好的体现了装饰者模式的优势,还望好好体会.
```java
  private Cache setStandardDecorators(Cache cache) {
    try {
      MetaObject metaCache = SystemMetaObject.forObject(cache);
      if (size != null && metaCache.hasSetter("size")) {
        metaCache.setValue("size", size);
      }
      if (clearInterval != null) {
        cache = new ScheduledCache(cache);
        ((ScheduledCache) cache).setClearInterval(clearInterval);
      }
      if (readWrite) {
        cache = new SerializedCache(cache);
      }
      cache = new LoggingCache(cache);
      cache = new SynchronizedCache(cache);
      if (blocking) {
        cache = new BlockingCache(cache);
      }
      return cache;
    } catch (Exception e) {
      throw new CacheException("Error building standard cache decorators.  Cause: " + e, e);
    }
  }
```

## 线程安全与装饰者
装饰者模式的功能是增强原有类，因此其经常被用来包装一个非线程安全的类，使其提供线程安全的访问，在JDK中的体现则是`Collections.synchronizedXXX`方法以及与其类似的一些方法。以`synchronizedList`为例，其本意是将线程不安全的`List`实例包装成线程安全的实例，包装方式是使用`SynchronizedList`提供同步包装，如下所示：对相关方法都使用独占锁来修饰，保证了并发访问的线程安全性。
```java
static class SynchronizedList<E> extends SynchronizedCollection<E> implements List<E> {
  final List<E> list;

  SynchronizedList(List<E> list) {
    super(list);
    this.list = list;
  }

  public E get(int index) {
    synchronized (mutex) {
      return list.get(index);
    }
  }

  public void add(int index, E element) {
    synchronized (mutex) {
      list.add(index, element);
    }
  }
  ....
}
```

## 函数式编程与装饰者
在函数式编程中因为函数是一等公民，因此互相嵌套是常有的事情，比如以下对于加锁解锁的一个函数封装调用
```java
  public static <T> T  lockTemplate(Lock lock, Supplier<T> supplier) {
    lock.lock();
    try {
      return supplier.get();
    } finally {
      lock.unlock();
    }
  }
```
该函数接收一个锁以及一个`supplier`提供者，其使用方式也很简单，比如下面方式使得`i++`变得线程安全。
```java
  ReentrantLock lock = new ReentrantLock();

    int[] boxInt = new int[1];
    
    Integer value = LockTemplate.lockTemplate(lock, () -> {
      // 线程不安全的操作
      return boxInt[0]++;
    });
```
由于Java是面向对象范式语言，对函数式编程支持的并不是很好，所以这个例子并不能很好的描述函数式编程，不过思想上来看这是一种装饰者模式的实践，只不过装饰者与被装饰都变成了函数，装饰者函数的功能也是对被装饰者功能的增强。

## 装饰者模式与桥接模式
这两个模式起初笔者很疑惑，两者的本质都是组合，并且从类图上来看两者几乎是一致的，那么他们的区别是什么呢？
我认为从继承树上来看装饰者模式的目的是纵向的扩展类（增加树的深度），从而为现有的实现类提供更强大的支援。
桥接模式则是水平扩展（增加树的宽度），以现有的类为代码复用的基础，然后在这个基础上水平扩展出另外的业务实现，这里更加注重的是解耦，把变化的与不变的分离开。

另外设计模式本身之间相互影响，没必要纠结于是某一种特定的模式，只要理解其背后的思想就可以了。

## 总结
装饰者模式本质上来说是AOP思想的一种实现方式，其持有被装饰者，因此可以控制被装饰者的行为从而达到了AOP的效果。

## 扩展
偶然看到一篇博文: [项目中用到的一个小工具类(字符过滤器)](http://javatar.iteye.com/blog/40188),里面运用了装饰者设计模式,工厂模式,模板方法模式设计了这样一个符合开闭原则的工具类.感兴趣的也可以看看.