---
title: Java8 Lambda（三）-强大的collect操作
subtitle: Java8学习记录(三)-强大的collect操作
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  -  Java
categories:  夯实Java基础
urlname: java_stream3
date: 2017-09-20 22:59:38
updated:  2017-09-20 22:59:38
---
`collect`应该说是`Stream`中最强大的终端操作了,使用其几乎能得到你想要的任意数据的聚合,下面好好分析该工具的用法.
- - - - -
在Stream接口中有如下两个方法
```java
  <R> R collect(Supplier<R> supplier,
                  BiConsumer<R, ? super T> accumulator,
                  BiConsumer<R, R> combiner);
                  
 <R, A> R collect(Collector<? super T, A, R> collector);
```
很明显第一种相当于简易实现版本,第二种为高级用法.更多更复杂的操作都封装到Collector接口中,并提供一些静态方法供使用者调用.下面逐一分析.

### 简易调用形式
简易调用形式就是第一种接口,接口如下
```java
  <R> R collect(Supplier<R> supplier,
                  BiConsumer<R, ? super T> accumulator,
                  BiConsumer<R, R> combiner);
```
调用方式如下,很明显第一个参数`supplier`为结果存放容器,第二个参数`accumulator`为结果如何添加到容器的操作,第三个参数`combiner`则为多个容器的聚合策略.
```java
String concat = stringStream.collect(StringBuilder::new, StringBuilder::append,StringBuilder::append).toString();
//等价于上面,这样看起来应该更加清晰
String concat = stringStream.collect(() -> new StringBuilder(),(l, x) -> l.append(x), (r1, r2) -> r1.append(r2)).toString();
```
那么换一种,我想对一个List<Integer>收集结果总和,按照Collect的要求,首先需要容器sum,然后添加操作 sum+x,聚合操作,sum1+sum2,那么就很容易写出来了,看完下面代码后好好体会下,然后再看高级用法.当然用sum方法收集是最佳解决方案,这里只是提供一种示例应用.
```java
// 由于基本类型都是不可变类型,所以这里用数组当做容器
final Integer[] integers = Lists.newArrayList(1, 2, 3, 4, 5)
        .stream()
        .collect(() -> new Integer[]{0}, (a, x) -> a[0] += x, (a1, a2) -> a1[0] += a2[0]);
```
那么再换一种,有一个`Person`类,其拥有type与name两个属性,那么使用`collect`把他收集到Map集合中,其中键为type,值为person的集合.如下代码所示,看明白了相信就掌握了该方法.
```java
   Lists.<Person>newArrayList().stream()
        .collect(() -> new HashMap<Integer,List<Person>>(),
            (h, x) -> {
              List<Person> value = h.getOrDefault(x.getType(), Lists.newArrayList());
              value.add(x);
              h.put(x.getType(), value);
            },
            HashMap::putAll
        );
```
### Collector高级调用
`Collector`接口是使得`collect`操作强大的终极武器,对于绝大部分操作可以分解为旗下主要步骤,**提供初始容器->加入元素到容器->并发下多容器聚合->对聚合后结果进行操作**,同时`Collector`接口又提供了`of`静态方法帮助你最大化的定制自己的操作,官方也提供了`Collectors`这个类封装了大部分的常用收集操作.
另外`CollectorImpl`为`Collector`的实现类,因为接口不可实例化,这里主要完成实例化操作.
```java
    //初始容器
     Supplier<A> supplier();
    //加入到容器操作
    BiConsumer<A, T> accumulator();
    //多容器聚合操作
    BinaryOperator<A> combiner();
    //聚合后的结果操作
    Function<A, R> finisher();
    //操作中便于优化的状态字段
    Set<Characteristics> characteristics();
```

### Collectors的方法封装
`Collectors`作为官方提供的收集工具类,那么其很多操作都具有参考性质,能帮助我们更加理解`Collector`接口,万变不离其宗,最终只是上面五个函数接口的混合操作,下面来分析下官方是如何使用这几个接口的.
#### toList()
容器: `ArrayList::new`
加入容器操作: `List::add`
多容器合并: `left.addAll(right); return left;`
聚合后的结果操作: 这里直接返回,因此无该操作,默认为`castingIdentity()`
优化操作状态字段: `CH_ID`
这样看起来很简单,那么对于Map,Set等操作都是类似的实现.
```java
   public static <T>
    Collector<T, ?, List<T>> toList() {
        return new CollectorImpl<>((Supplier<List<T>>) ArrayList::new, List::add,
                                   (left, right) -> { left.addAll(right); return left; },
                                   CH_ID);
    }
```
#### joining()
容器: `StringBuilder::new`
加入容器操作: `StringBuilder::append`
多容器合并: `r1.append(r2); return r1; `
聚合后的结果操作: `StringBuilder::toString`
优化操作状态字段: `CH_NOID`
```java
    public static Collector<CharSequence, ?, String> joining() {
        return new CollectorImpl<CharSequence, StringBuilder, String>(
                StringBuilder::new, StringBuilder::append,
                (r1, r2) -> { r1.append(r2); return r1; },
                StringBuilder::toString, CH_NOID);
    }
```

下面来个复杂的
#### groupingBy()
`groupingBy`是`toMap`的一种高级方式,弥补了`toMap`对值无法提供多元化的收集操作,比如对于返回`Map<T,List<E>>`这样的形式`toMap`就不是那么顺手,那么`groupingBy`的重点就是对Key和Value值的处理封装.分析如下代码,其中`classifier`是对key值的处理,`mapFactory`则是指定Map的容器具体类型,`downstream`为对Value的收集操作,具体代码这里不做分析,无非是把值一个一个的put进指定容器.
```java
   public static <T, K, D, A, M extends Map<K, D>>
    Collector<T, ?, M> groupingBy(Function<? super T, ? extends K> classifier,
                                  Supplier<M> mapFactory,
                                  Collector<? super T, A, D> downstream) {
       .......
    }
```
对于之前用原生`collect`方法做的收集操作那么就可以很容易改写为groupBy形式
```java
//原生形式
   Lists.<Person>newArrayList().stream()
        .collect(() -> new HashMap<Integer,List<Person>>(),
            (h, x) -> {
              List<Person> value = h.getOrDefault(x.getType(), Lists.newArrayList());
              value.add(x);
              h.put(x.getType(), value);
            },
            HashMap::putAll
        );
//groupBy形式
Lists.<Person>newArrayList().stream()
        .collect(Collectors.groupingBy(Person::getType, HashMap::new, Collectors.toList()));
//因为对值有了操作,因此我可以更加灵活的对值进行转换
Lists.<Person>newArrayList().stream()
        .collect(Collectors.groupingBy(Person::getType, HashMap::new, Collectors.mapping(Person::getName,Collectors.toSet())));
```
#### reducing()
`reducing`是针对单个值的收集,其返回结果不是集合家族的类型,而是单一的实体类T
容器: `boxSupplier(identity)`,这里包裹用的是一个长度为1的Object[]数组,至于原因自然是不可变类型的锅
加入容器操作: `a[0] = op.apply(a[0], t)`
多容器合并: `a[0] = op.apply(a[0], b[0]); return a;`
聚合后的结果操作: 结果自然是Object[0]所包裹的数据`a -> a[0]`
优化操作状态字段: `CH_NOID`
那么看到这里困惑是不是有一种恍然大悟的感觉,反正我是有的.
```java
  public static <T> Collector<T, ?, T>
    reducing(T identity, BinaryOperator<T> op) {
        return new CollectorImpl<>(
                boxSupplier(identity),
                (a, t) -> { a[0] = op.apply(a[0], t); },
                (a, b) -> { a[0] = op.apply(a[0], b[0]); return a; },
                a -> a[0],
                CH_NOID);
    }
```
那么接下来就是对之前Collect的一些操作的改造
```java
//原生操作
final Integer[] integers = Lists.newArrayList(1, 2, 3, 4, 5)
        .stream()
        .collect(() -> new Integer[]{0}, (a, x) -> a[0] += x, (a1, a2) -> a1[0] += a2[0]);
//reducing操作
final Integer collect = Lists.newArrayList(1, 2, 3, 4, 5)
        .stream()
        .collect(Collectors.reducing(0, Integer::sum));    
//当然Stream也提供了reduce操作
final Integer collect = Lists.newArrayList(1, 2, 3, 4, 5)
        .stream().reduce(0, Integer::sum)
```

### 可能遇到的问题
记录下生产中使用该工具遇到的一些小错误
#### toMap所产生的异常
toMap的操作主要如下代码,异常来自两个方面
1. 操作调用的是`map.merge`方法,该方法遇到value为null的情况会报npe,即使你使用的是hashMap可以接受null值,也照样报.搞不懂这里为什么这样设计.
2. 未指定冲突合并策略,也就是第三个参数`BinaryOperator<U> mergeFunction`时遇到重复的key会直接抛`IllegalStateException`,因此需要注意.


### 总结
到此对于`collect`的操作应该就很清晰了,希望通过这些例子能掌握核心,也就是`Collector`接口中那几个函数的作用,希望对你有帮助.
