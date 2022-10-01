---
title: Java8 Lambda（一）-函数式接口
subtitle: Java8学习记录(一)-函数式接口
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  -  Java
categories:  夯实Java基础
urlname: java_stream1
date: 2017-05-18 23:39:11
updated:  2017-05-18 23:39:11
---
实习前只是粗略的看了下Java8的一些基本语法,但是没有系统的学习过.在使用一段时间后决定系统的对其进行一次分析,加深对Java8函数式编程的理解,提高自己的编码技巧.另外kotlin崛起,感兴趣的朋友尝试下混编也未尝不可.
- - - - -

### 函数式接口
函数式接口,对于Java来说就是接口内只有一个公开方法的接口,因为使用lanbda表达式,例如`() -> user.getName()`对应的调用则可能是`func.get()`,编译器会根据接口推断所属于的方法,如果有两个则无法推断.Java8提供了很多函数式接口,一般都使用注解`@FunctionalInterface`声明,有必要了解如下一些函数式接口.

函数式接口        |      参数类型    |    返回类型   |   描述   |
---  |      ---    |    ---   |    ---
Supplier<T>       |      无      |   T  |   接收一个T类型的值
Consumer<T>        |      T     | 无 |  处理一个T类型的值
BiConsumer<T, U>    | T,U   | 无  |  处理T类型和U类型的值
Predicate<T>    | T  | boolean  |  处理T类型的值,并返回true或者false.
ToIntFunction<T>    | T  | int  |  处理T类型的值,并返回int值
ToLongFunction<T>    | T  | long  |  处理T类型的值,并返回long值
ToDoubleFunction<T>    | T  | double  |  处理T类型的值,并返回double值
Function<T, R>    | T  | R  |  处理T类型的值,并返回R类型值
BiFunction<T, U, R>    | T,U  | R  |  处理T类型和U类型的值,并返回R类型值
BiFunction<T, U, R>    | T,U  | R  |  处理T类型和U类型的值,并返回R类型值
UnaryOperator<T>    | T  | T  |  处理T类型值,并返回T类型值,
BinaryOperator<T>    | T,T  | T  |  处理T类型值,并返回T类型值

以上的函数每一个代表的都是一种基本的操作,操作之间可以自由组合,所以才有了stream这些灵活的操作.

### Stream操作
Stream的操作是建立在函数式接口的组合上的,最好的学习方法是看Stream接口来学习.下面举一些例子来分析,假设有这样的一些初始数据.
```java
List<String> testData = new ArrayList<String>();
    testData.add("张三");
    testData.add("李四");
    testData.add("王二");
    testData.add("麻子");
```

**filter**
```java
    Stream<T> filter(Predicate<? super T> predicate);
```
filter接收predicate函数,predicate是接收T值,返回boolean值,那么对应的引用就可以写成如下形式,意思是取集合中以'张'开头的名字.
```java
testData.stream()
        .filter(x -> x.startsWith("张"))
```
**map**
```java
    <R> Stream<R> map(Function<? super T, ? extends R> mapper);
```
map操作接收的是Function接口,对于Function接收T值返回R值,那map的作用就很明显是转换用的,比如下面代码,转换名称为对应的名称长度,也就是从输入String数据返回int数据.
```java
testData.stream()
        .map(x -> x.length())
```
**flatMap**
```java
    <R> Stream<R> flatMap(Function<? super T, ? extends Stream<? extends R>> mapper);
```
flatMap和map都是使用Function接口,不同的是返回值flatMap限定为Stream类型.所以flatMap可以作为合并流使用,如以下代码,提取出所有的字符.
```java
testData.stream()
        .flatMap(x -> Stream.of(x.split("")))
        .collect(Collectors.toList());
        //输出  [张, 三, 李, 四, 王, 二, 麻, 子]
```
**peek**
```java
    Stream<T> peek(Consumer<? super T> action);
```
peek参数为Consumer,Consumer接收T值,无返回,那么该方法就可以作为调试不影响stream中内容的一些操作,不过由于对象都是地址引用,你再此做一些对象内容操作也是可以的.
**reduce**
```java
<U> U reduce(U identity, BiFunction<U, ? super T, U> accumulator, BinaryOperator<U> combiner);
```
Reduce比较复杂的一个接口,属于归纳性操作,看参数,第一个是U泛型,也就是输入类型的参数,最为初始值,第二个BiFunction,接收T,U参数,返回U类型参数,BinaryOperator接收U,U类型,并返回U类型.
```java
    StringBuilder identity = new StringBuilder();
    StringBuilder reduce = testData.stream()
        .flatMap(x -> Stream.of(x.split("")))
        .reduce(identity, (r, x) -> {
          r.append(x);
          return r;
        }, StringBuilder::append);
    System.out.println(identity == reduce);
    System.out.println(reduce.toString());
    //输出 true
   //  张三李四王二麻子
```
首先提供一个基本容器identity,然后两个参数r即是identity,x为每次输入参数,最后一个StringBuilder::append是并发下多个identity的合并策略.
再举个例子,既然reduce属于归纳性操作,那么也可以当成collect使用,如下:
```java    
 ArrayList<String> identity = new ArrayList<>();
    ArrayList<String> result = testData.stream()
        .flatMap(x -> Stream.of(x.split("")))
        .reduce(identity, (r, x) -> {
          r.add(x);
          return r;
        },(r1,r2) -> {
          r1.addAll(r2);
          return r1;
        });
    System.out.println(identity == result);
    System.out.println(result);
    //输出 true
    //[张, 三, 李, 四, 王, 二, 麻, 子]
```
### 强大的collect
collect无疑是stream中最强大的操作,掌握了collect操作才能说掌握了stream.为了便于使用者,Java提供了`Collectors`类,该类提供了很多便捷的collect操作,如`Collector<T, ?, List<T>> toList()`,`Collector<T, ?, Set<T>> toSet()`等操作.这些操作最终都会调用如下构造函数构造出collector对象,因此掌握该本质是最佳的学习方式.
```java
CollectorImpl(Supplier<A> supplier,
                      BiConsumer<A, T> accumulator,
                      BinaryOperator<A> combiner,
                      Function<A,R> finisher,
                      Set<Characteristics> characteristics) {
            this.supplier = supplier;
            this.accumulator = accumulator;
            this.combiner = combiner;
            this.finisher = finisher;
            this.characteristics = characteristics;
        }
```
Supplier类似reduce中的u,接收一个元数据,BiConsumer则是操作数据,BinaryOperator并发下聚合,finisher完成时的转换操作,Set<Characteristics>应该按照定义是优化一些操作中的转换.如下面的toList()操作,其finish操作为`castingIdentity()`.
```java    
   public static <T>
    Collector<T, ?, List<T>> toList() {
        return new CollectorImpl<>((Supplier<List<T>>) ArrayList::new, List::add,
                                   (left, right) -> { left.addAll(right); return left; },
                                   CH_ID);
    }
```
再看toMap的实现
```java
    public static <T, K, U, M extends Map<K, U>>
    Collector<T, ?, M> toMap(Function<? super T, ? extends K> keyMapper,
                                Function<? super T, ? extends U> valueMapper,
                                BinaryOperator<U> mergeFunction,
                                Supplier<M> mapSupplier) {
        BiConsumer<M, T> accumulator
                = (map, element) -> map.merge(keyMapper.apply(element),
                                              valueMapper.apply(element), mergeFunction);
        return new CollectorImpl<>(mapSupplier, accumulator, mapMerger(mergeFunction), CH_ID);
    }
```
Function作为转换函数提供了key和value的转换,BinaryOperator提供了重复key合并策略,mapSupplier则表示最终收集到的容器.那么使用就很简单了
```java
HashMap<Character, String> map = testData.stream()
        .collect(Collectors.toMap(x -> x.charAt(0), Function.identity()
            , (v1, v2) -> v2, HashMap::new));
```

其他还有很多方法,就不一一叙述,主要是了解这些接口,知道他所拥有的功能,以及组合的意义,即可很好的掌握Java中的函数式编程.

> 个人博客 [mrdear.cn](mrdear.cn) ,欢迎交流

