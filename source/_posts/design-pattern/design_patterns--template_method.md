---
title: 设计模式--模板方法模式的思考
subtitle: 关于模板方法模式的一些思考,不仅仅是会写出设计模式的代码,更重要的是理解其背后的设计之道.
cover: http://imgblog.mrdear.cn/designpattern.png
author: 
  nick: 屈定
tags:
  - 设计模式
categories: 设计模式专题
urlname: design-patterns-template-method
date: 2018-03-25 10:03:08
updated: 2018-04-27 11:04:27
---
模板方法同样也是一种很实用的方法,目的是提高代码复用,并且统一大体的算法流程,比如一个一台电脑主机,定义好放置CPU,硬盘,内存等空位后,就形成了一个骨架,那么这个就是模板,具体的CPU,内存,硬盘是什么牌子型号则不需要考虑,这些是具体到业务中的实现类所负责的事情.

## 模板方法模式
模板方法模式可以说是抽象类的一种特性,可以定义抽象(abstract)方法与常规方法,抽象方法延迟到子类中实现.因此标准的模板方法一般是一个抽象类+具体的实现子类,抽象类(AbstractClass)负责整个执行流程的定义,而子类(ConcreteClass)负责某一具体流程的实现策略,类图如下:
![](http://imgblog.mrdear.cn/1521982796.png?imageMogr2/thumbnail/!100p)

## Mybatis中的模板方法模式
实际中由于模板方法很好的兼容性,因此经常与其他设计模式混用,并且在模板类之上增加一个接口来提高系统的灵活性.因此模板类经常作为中间层来使用,比如Mybatis的`Executor`的设计,其中在`Executor`与具体实现类之间增加中间层`BaseExecutor`作为模板类.
![](http://imgblog.mrdear.cn/1521983235.png?imageMogr2/thumbnail/!100p)

作为模板类的`BaseExecutor`到底做了什么呢?举一个代码比较短的例子,下面的代码是Mybatis缓存中获取不到时执行去DB查询所需要的结果,顺便再放入缓存中的流程.其中`doQuery()`方法便是一个抽象方法,其被延迟到子类中来实现.而缓存是所有查询都需要的功能,因此每一个查询都会去执行.
```java
  private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    List<E> list;
    localCache.putObject(key, EXECUTION_PLACEHOLDER);
    try {
        // doQuery具体查询策略延迟到子类中来实现
      list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
      localCache.removeObject(key);
    }
    localCache.putObject(key, list);
    if (ms.getStatementType() == StatementType.CALLABLE) {
      localOutputParameterCache.putObject(key, parameter);
    }
    return list;
  }
```
`BaseExecutor`作为模板类的同时其还是抽象父类,因此还可以实现一些子类锁需要的公共方法,比如事务的提交与回滚,模板类的本质还是抽象类,同时也是父类,当然可以有这些公共方法的定义.
```java
  @Override
  public void commit(boolean required) throws SQLException {
    if (closed) {
      throw new ExecutorException("Cannot commit, transaction is already closed");
    }
    clearLocalCache();
    flushStatements();
    if (required) {
      transaction.commit();
    }
  }

  @Override
  public void rollback(boolean required) throws SQLException {
    if (!closed) {
      try {
        clearLocalCache();
        flushStatements(true);
      } finally {
        if (required) {
          transaction.rollback();
        }
      }
    }
  }
```
总结来说**模板方法类作为上级,那么其要做的事情就是针对接口提出的需求进行规划,自己实现一部分,然后把需求拆分成更加细小的任务延迟到子类中实现,这是模板的责任与目的.**

## Spring JDBC中的模板方法模式
模板的另一种实现方式就是Java的接口回调机制,固定好方法模板后接收一个行为策略接口作为参数,模板中执行该接口的方法,比如Spring中的JdbcTemplate就是这样的设计.
```java
	public <T> T execute(StatementCallback<T> action) throws DataAccessException {
        ...
			stmt = con.createStatement();
			applyStatementSettings(stmt);
			 // 执行传入的策略接口
			T result = action.doInStatement(stmt);
			handleWarnings(stmt);
			return result;
    	...
	}
```
因为篇幅原因,这里删减了很多代码,但是可以看出来这种方式实现有点策略模式的味道.其需要两个东西
1. 方法模板,在这里是该`execute()`方法
2. 策略接口,这里是`StatementCallback`,其本质上是一个函数是接口.

这种模式的好处自然是灵活,通过策略接口可以把行为分离出来并且可以灵活的在运行时替换掉对应的行为,雨点策略模式的味道.
那么这种到底是策略模式还是模板方法模式呢?个人认为没必要纠结这些,说他是哪个都有挺充分的理由,但是设计模式本身就是思想的体现,很多模式与模式之间都互相有思想的重叠,具体业务场景不同选择不同.

## 总结
模板方法在我看来更像是一个产品经理,而接口就是需求方,面对需求方模板做的事情是制定合理的统一执行计划,然后把需求拆分成更加细小的任务,分配到对应的程序员身上.
另外模板方法模式是一种变与不变的思想体现,固定不变的,提出变化的,这样增加系统的灵活性,就像圆规画圆一样,先固定中心点,然后另一个脚随意扩展.这种思想是很实用,比如产品往往提出需求后,程序员就需要考虑具体的对象模型,那么此时比较好的做法就是尽早固定出不会变化的对象,然后其他功能在此基础上做关联来扩展,最后希望本文对你有启发.

## 扩展想法
在日常的业务开发中我很少看到继承相关的代码,可能是和面向对象设计中提到多用组合少用继承这一原则有关.在`Effective Java`中`第16条: 复合优先于继承`这一小节中中举了如下例子:
实现`HashSet`的计数功能,因此复写了`add`,`addAll`方法,然而因为对于父类实现逻辑的不了解(addAll实际上是循环调用add)导致了bug.
```java
public class InstrumentedHashSet<E> extends HashSet<E> {
  private Integer count;

  @Override
  public boolean add(E e) {
    count++;
    return super.add(e);
  }

  @Override
  public boolean addAll(Collection<? extends E> c) {
    count = count + c.size();
    return super.addAll(c);
  }
}
```
**这个问题的根本原因是什么?**
我认为是 **`HashSet`并不是专门为继承设计的类**,因此去继承就出现了上述的问题.这么就代表代码中不应该使用继承吗?当然不是.

随后在`第17条: 要么为继承而设计,并提供说明文档,要么就禁止继承`指出为继承而设计是一种可取的行为,在我看来模板方法设计模式就是一种为继承而设计的方式.模板方法设计模式主要有两点本意:
1.尽早的使用模板类,也就是Abstract或者Base开头的类来让实现类分叉,分叉的越早,对于结构上的理解就越清晰,比如下方Spring MVC对URL的处理,可以很清晰的看到一种处理是定位到具体的执行方法`AbstractHandlerMethodMapping`,一种是定位到另一个URL,可能是静态资源,可能是其他页面`AbstractUrlHandlerMapping`.
![](http://imgblog.mrdear.cn/1524840843.png?imageMogr2/thumbnail/!100p)

2.降低子类的实现接口的复杂度,主要是模板类中实现了接口的方法,然后把不变的固定,变化的使用抽象接口延迟到子类中,让子类的任务更加清晰合理.比如`Mybatis的BaseExector`就通过`doQuery()`把变化的查询步骤延迟到了子类中实现.另外有一种模板类是单纯的提供代码复用,其可以当成是不含有业务属性的一个方法库,提供对所有子类都有用的公共方法.这个我在我公司订单系统中采用,如下图所示(这里只列出一部分,实际上最下层的Service还会承担更多角色),`AbstractOrderService`只是单纯的提供数据获取,比如获取用户信息,获取优惠券信息等方法,具体的创建逻辑在子类中,比如`BizVipOrderService`创建vip订单,`BizResearchOrderService`创建研究员订单.当子类有通性是则可以在上层增加专属抽象类来提前分叉,最终保证每一个订单创建走的流程都是可控的,当要修改某一个订单的规则时,比如vip订单可以使用优惠券,则只需要改其子类而不用担心对其他的订单类型创建有影响.
最后通过组合类提供对外的入口访问.降低外部操作的复杂性.另外最底层子类也可以实现其他接口,比如观察者来实现状态更改的通知处理.
![](http://imgblog.mrdear.cn/1524841389.png?imageMogr2/thumbnail/!100p)

那么**这种设计就是为继承而设计**,这种设计出来的类有一个特点,通常是以`Abstract/Base`开头,其就是为了继承,而不想让其他人实例化自身.最后继承作为面向对象的一大特性,掖着不用还能叫面向对象编程吗?
