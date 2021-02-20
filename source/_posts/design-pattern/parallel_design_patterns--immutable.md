---
title: 并行设计模式--immutable模式
subtitle: 关于并行设计中的immutable模式学习笔记
cover: http://imgblog.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-immutable
date: 2018-05-18 10:05:41
updated: 2018-05-18 10:05:44
---
线程不安全的原因是共享了变量且对该共享变量的操作存在原子性、可见性等问题，因此一种解决思路就是构造不可变的对象，没有修改操作也就不存在并发竞争，自然也不需要额外的锁，同步等操作，这种设计叫做`immutable object`模式，本文主要理解这种模式，并学习如何实现一个较好的`immutable`类。

## immutable设计原则
一个比较严格的`immutable`模式，有如下几种设计原则（来自[Java多线程编程实战指南](https://item.jd.com/11785190.html)）
1. 类本身是final修饰，防止其子类改变其定义的行为
2. 所有字段都是用final修饰，是用final修饰不仅可以从语义上说明被修饰字段的引用不可改变，更重要的是这个语义在多线程环境下由JMM（Java内存模型）保证了被引用字段的初始化安全。即final修饰字段在其他线程可见时，其必须初始化完成。
3. 在对象的创建过程中，this指针没有泄露给其他对象。防止其他对象在创建过程中对其进行修改。
4. 任何字段，若其引用了其他可改变字段，其必须使用private修饰，并且该字段不能向外暴露，如有相关方法返回该值，则使用防御性拷贝。

## immutable设计陷阱
不可变类经常会遇到以下陷阱，他是不可变的吗？答案当然不是，该类本身是不可变的，但是其内部引用的`Date`对象可变，调用方可以获取`Date`之后调用其set方法改变其指向的时间，最终导致该类变化，这种设计过程中经常遇到的一个问题。
```java
public final class Interval {

  private final Date start;

  private final Date end;
  // 传入的是引用，因此共享了内存，导致Date可变。
  public Interval(Date start, Date end) {
    this.start = start;
    this.end = end;
  }

  public Date getStart() {
    return start;
  }

  public Date getEnd() {
    return end;
  }
  
}
```
一般解决思路是使用防御性拷贝，也就是要赋值的地方都重新创建对象，如下所示。
```java
public final class Interval {

  private final Date start;

  private final Date end;

    // 进行防御性拷贝
  public Interval(Date start, Date end) {
    this.start = new Date(start.getTime());
    this.end = new Date(end.getTime());
  }
    // 对外接口仍然需要拷贝
  public Date getStart() {
    return new Date(start.getTime());
  }

  public Date getEnd() {
    return new Date(end.getTime());
  }

}
```

## immutable设计举例

### JDK8日期类
在JDK8中新增关于时间日期的一批API ，其设计均采用`immutable`模式，主要体现在一旦该实例被创建之后，不会提供修改的方法，每次需要进行操作时返回的总是一个新的类，也因此该类是线程安全的。
```java
public final class LocalDate
        implements Temporal, TemporalAdjuster, ChronoLocalDate, Serializable {
    /**
     * The year.
     */
    private final int year;
    /**
     * The month-of-year.
     */
    private final short month;
    /**
     * The day-of-month.
     */
    private final short day;
    
    ....
    // 对其的操作总会返回一个新的实例
  public LocalDate plusDays(long daysToAdd) {
        if (daysToAdd == 0) {
            return this;
        }
        long mjDay = Math.addExact(toEpochDay(), daysToAdd);
        return LocalDate.ofEpochDay(mjDay);
    }
}
```

### immutable与享元模式
`immutable`模式最大的弊端是产生了很多对象，比如上述JDK8的日期类，每一步修改操作都要产生一个中间对象，在很多情况下是可以利用**享元模式来较少对象创建次数**，事实上享元模式并没有要求所共享的实例一定是不可变的，只是在大多数情况不可变会使得享元模式更加简单纯粹。比如系统中有表示用户一次下单购买商品数量的类`Quantity`，那么考虑到用户一次性购买数量很少大于10，因此这个类设计成`immutable`并且应用享元模式就可以很好地提高性能。
其本身就是类似`Integer`类，因此设计的具体做法就非常类似`Integer`的实现（之所以在实现一遍，是为了更好的语义描述），对外提供两个创建入口，**1是构造函数**，构造函数直接创建出该类。**2是valueOf静态方法**，该方法会先去缓存中查询是否包含，包含则直接返回。当然也可以在该类中加一些关于数量本身限制判断的业务方法。
```java
public class Quantity {

  private final int value;

  /**
   * 提供创建不可变类
   */
  public Quantity(int value) {
    this.value = value;
  }

  /**
   * 提供享元模式复用类
   */
  public static Quantity valueOf(int value) {
    if (null != QuantityCache.cache[value-1]) {
      return QuantityCache.cache[value-1];
    }
    return new Quantity(value);
  }

  private static class QuantityCache {
    static final int low = 1;
    static final int high = 10;
    static final Quantity cache[];

    static {

      cache = new Quantity[(high - low) + 1];
      int j = low;
      for(int k = 0; k < cache.length; k++)
        cache[k] = new Quantity(j++);

    }

    private QuantityCache() {}
  }
}
```

### immutable与Builder模式
`immutable`有可能面临创建所需要过多的参数以及步骤，导致设计该类时需要提供很多与类本身没必要的方法，因此比较好的解决方案是利用Builder模式创建实例，Builder模式的本质是**把对象本身提供的操作与对象的创建分离开**，为客户端提供一个较易操作的方式去得到类的实例。

与`Builder`模式配合中，对应的目标类往往只需要提供私有的构造函数，以及属性的get方法，构造过程则交给内部的`Builder`类来完成，这是一种对于过多参数或者构造之后很少变动的类所采取的一种比较好的方式。
```java
public final class AsyncLoadConfig {
  /**
   * 模板执行任务所需要的线程池
   */
  @Getter
  private ExecutorService executorService;
  /**
   * 单个方法默认超时时间
   */
  @Getter
  private Long defaultTimeout;

  private AsyncLoadConfig(ExecutorService executorService, Long defaultTimeout) {
    this.executorService = executorService;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * 相关配置的建造器
   * @return
   */
  public static AsyncLoadConfigBuilder builder() {
    return new AsyncLoadConfigBuilder();
  }

  public static class AsyncLoadConfigBuilder {

    private Long defaultTimeout;

    private ExecutorService executorService;

    public AsyncLoadConfigBuilder defaultTimeout(Long defaultTimeout) {
      this.defaultTimeout = defaultTimeout;
      return this;
    }

    public AsyncLoadConfigBuilder executorService(ExecutorService executorService) {
      this.executorService = executorService;
      return this;
    }

    public AsyncLoadConfig build() {
      Assert.notNull(executorService, "executorService can't be null");
      Assert.notNull(defaultTimeout, "defaultTimeout can't be null");
      return new AsyncLoadConfig(executorService, defaultTimeout);
    }
  }
}
```
### JDK中的CopyOnWrite容器
在JDK1.5之后提供了`CopyOnWriteArrayList`、`CopyOnWriteArraySet`容器，这类容器并不是严格意义上的不可变，但是其是`immutable`思想的一种应用，其本质是每次添加都重新创建一个底层数组，把之前的数据拷贝过来，然后把要添加的数据添加到尾部，最后更新这个数组的引用，实现关键点时更新数组引用是一个原子性操作，因此所有读线程将始终看到数组处于一致性状态，那么这个数组就可以理解为`immutable`的一种实现，一旦创建后不再改变。
```java
public boolean add(E e) {
  final ReentrantLock lock = this.lock;
  lock.lock();
  try {
      Object[] elements = getArray();
      int len = elements.length;
      // 创建新数组,并拷贝旧元素
      Object[] newElements = Arrays.copyOf(elements, len + 1);
      // 设置新增的元素
      newElements[len] = e;
      // 设置新数组
      setArray(newElements);
      return true;
  } finally {
      lock.unlock();
  }
}
```

## 参考
[Java多线程编程实战指南](https://item.jd.com/11785190.html)