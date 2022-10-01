---
title: Java8 Lambda（二）-Stream原理
subtitle: Java8学习记录(二)-Stream原理
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  -  Java
categories:  夯实Java基础
urlname: java_stream2
date: 2017-05-20 19:06:51
updated:  2017-05-20 19:06:51
---
推荐一篇博文,很好的介绍了Stream的原理.本文对其进行一些补充更加详细的讲解.
> 作者: 李豪
> 地址: https://github.com/CarpenterLee/JavaLambdaInternals/blob/master/6-Stream%20Pipelines.md

需求:
>从`"张三","李四","王二","张四五"`中选出以`张`开头的名字,然后从再从中选出名字最长的一个,输出其长度.

### 1.一种直白的实现
![](http://res.mrdear.cn/1497141037.png?imageMogr2/thumbnail/!70p)

**缺点**:
1. 迭代次数过多
2. 频繁产生中间结果,性能无法接受

**实际想要的效果**:
平常的写法:
```java    
int longest = 0;
for(String str : strings){
    if(str.startsWith("张")){// 1. filter(), 保留以张开头的字符串
        int len = str.length();// 2. mapToInt(), 转换成长度
        longest = Math.max(len, longest);// 3. max(), 保留最长的长度
    }
}
System.out.println(longest);
```
Stream的做法:
```java
  Stream.of("张三","李四","王二","张四五")
        .filter(x -> x.startsWith("张"))
        .mapToInt(String::length)
        .max()
        .ifPresent(System.out::println);
```

### 2.Stream是怎么做到的?

**Stream的操作分类**:

中间操作:返回一个新的Stream
        - 有状态 sorted(),必须等上一步操作完拿到全部元素后才可操作
        - 无状态 filter(),该操作的元素不受上一步操作的影响
```java
  list.stream().filter(x -> x.startWith("张").map(x -> x.length())
  list.stream().filter(x -> x.startWith("张").sorted().map(x -> x.length())
```
终端操作:返回结果
        - 短路操作findFirst(),找到一个则返回,也就是break当前的循环
        - 非短路操作forEach(),遍历全部元素

以上操作决定了Stream一定是先构建完毕再执行的特点,也就是延迟执行,当需要结果(终端操作时)开始执行流水线.
Stream做到的是对于多次调用合并到一次迭代中处理完所有的调用方式.换句话说就是解决了上述的两个缺点.大概思路是记录下每一步的操作,然后终端操作时对其迭代依次执行每一步的操作,最后再一次循环中处理.

**问题**:
1. 操作是如何记录下来的?
2. 操作是如何叠加的?
3. 叠加完如何执行的?
4. 执行完如何收集结果的?

- - - - -
Stream结构示意图:

![](http://res.mrdear.cn/1497146463.png?imageMogr2/thumbnail/!70p)


示例代码:
```java
    List<String> data = new ArrayList<>();
    data.add("张三");
    data.add("李四");
    data.add("王三");
    data.add("马六");

    data.stream()
        .filter(x -> x.length() == 2)
        .map(x -> x.replace("三","五"))
        .sorted()
        .filter(x -> x.contains("五"))
        .forEach(System.out::println);
```

#### 1. 操作是如何记录下来的?
1. Head记录Stream起始操作
2. StatelessOp记录中间操作
3. StatefulOp记录有状态的中间操作
这三个操作实例化会指向其父类`AbstractPipeline`,也就是在`AbstractPipeline`中建立了双向链表

对于Head
```java
    AbstractPipeline(Spliterator<?> source,
                     int sourceFlags, boolean parallel) {
        this.previousStage = null; //首操作上一步为null    
        this.sourceSpliterator = source; //数据
        this.sourceStage = this; //Head操作
        this.sourceOrOpFlags = sourceFlags & StreamOpFlag.STREAM_MASK;
        this.combinedFlags = (~(sourceOrOpFlags << 1)) & StreamOpFlag.INITIAL_OPS_VALUE;
        this.depth = 0;
        this.parallel = parallel;
    }
```
对于其他Stage:
```java    
    AbstractPipeline(AbstractPipeline<?, E_IN, ?> previousStage, int opFlags) {
        if (previousStage.linkedOrConsumed)
            throw new IllegalStateException(MSG_STREAM_LINKED);
        previousStage.linkedOrConsumed = true;
        //双向链表的建立
        previousStage.nextStage = this;
        this.previousStage = previousStage;
        this.sourceStage = previousStage.sourceStage;        
        this.depth = previousStage.depth + 1;        
        
        this.sourceOrOpFlags = opFlags & StreamOpFlag.OP_MASK;
        this.combinedFlags = StreamOpFlag.combineOpFlags(opFlags, previousStage.combinedFlags);
        if (opIsStateful())
            sourceStage.sourceAnyStateful = true;
    }
```
<img src="http://res.mrdear.cn/1499071580.png?imageMogr2/thumbnail/!60p" height=500 align=right >
调用过程如此用双向链表串联起来,每一步都得知其上一步与下一步的操作.
 data.stream()
 .filter(x -> x.length() == 2)
 .map(x -> x.replace("三","五"))
 .sorted()
 .filter(x -> x.contains("五"))
 .forEach(System.out::println);

- - - - -
#### 2.操作是如何叠加的?
`Sink<T>`接口:
1. void begin(long size),循环开始前调用,通知每个Stage做好准备
2. void end(),循环结束时调用,依次调用每个Stage的end方法,处理结果
3. boolean cancellationRequested(),判断是否可以提前结束循环
4. void accept(T value),每一步的处理

其子类之一ChainedReference:
```java    
    static abstract class ChainedReference<T, E_OUT> implements Sink<T> {
        protected final Sink<? super E_OUT> downstream;

        public ChainedReference(Sink<? super E_OUT> downstream) {
            this.downstream = Objects.requireNonNull(downstream);
        }
        @Override
        public void begin(long size) {
            downstream.begin(size);
        }
        @Override
        public void end() {
            downstream.end();
        }
        @Override
        public boolean cancellationRequested() {
            return downstream.cancellationRequested();
        }
    }
```

例Filter:
```java
    @Override
    public final Stream<P_OUT> filter(Predicate<? super P_OUT> predicate) {
        Objects.requireNonNull(predicate);
        return new StatelessOp<P_OUT, P_OUT>(this, StreamShape.REFERENCE,
                                     StreamOpFlag.NOT_SIZED) {
            @Override
            Sink<P_OUT> opWrapSink(int flags, Sink<P_OUT> sink) {
                return new Sink.ChainedReference<P_OUT, P_OUT>(sink) {
                    @Override
                    public void begin(long size) {
                        downstream.begin(-1);
                    }

                    @Override
                    public void accept(P_OUT u) {
                        //条件成立则传递给下一个操作,也因为如此所以有状态的操作必须放到
                        //end方法里面
                        if (predicate.test(u))
                            downstream.accept(u);
                    }
                };
            }
        };
    }
```
再例如sorted():
```java    
        @Override
        public void begin(long size) {
            if (size >= Nodes.MAX_ARRAY_SIZE)
                throw new IllegalArgumentException(Nodes.BAD_SIZE);
            list = (size >= 0) ? new ArrayList<T>((int) size) : new ArrayList<T>();
        }
        @Override
        public void end() {
            list.sort(comparator);
            downstream.begin(list.size());
            if (!cancellationWasRequested) {
                list.forEach(downstream::accept);
            }
            else {
                for (T t : list) {
                    if (downstream.cancellationRequested()) break;
                    downstream.accept(t);
                }
            }
            downstream.end();
            list = null;
        }
        @Override
        public void accept(T t) {
            list.add(t);
        }
```
![](http://res.mrdear.cn/1499071806.png?imageMogr2/thumbnail/!70p)

#### 叠加后如何执行?
执行操作是由终端操作来触发的,例如foreach操作
```java
    @Override
    public void forEach(Consumer<? super P_OUT> action) {
        //evaluate就是开关,一旦调用就立即执行整个Stream    
        evaluate(ForEachOps.makeRef(action, false));
    }
```
执行前会对操作从末尾到起始反向包裹起来,得到调用链
```java
Sink opWrapSink(int flags, Sink<P_OUT> sink) ;
```
```java
    //这个Sink是终端操作所对应的Sink
    final <P_IN> Sink<P_IN> wrapSink(Sink<E_OUT> sink) {
        Objects.requireNonNull(sink);

        for ( AbstractPipeline p=AbstractPipeline.this; p.depth > 0; p=p.previousStage) {
            sink = p.opWrapSink(p.previousStage.combinedFlags, sink);
        }
        return (Sink<P_IN>) sink;
    }
```
![](http://res.mrdear.cn/1499071772.png?imageMogr2/thumbnail/!70p)

```java
    @Override
    final <P_IN> void copyInto(Sink<P_IN> wrappedSink, Spliterator<P_IN> spliterator) {
        Objects.requireNonNull(wrappedSink);

        if (!StreamOpFlag.SHORT_CIRCUIT.isKnown(getStreamAndOpFlags())) {
            //依次执行调用链
            wrappedSink.begin(spliterator.getExactSizeIfKnown());
            spliterator.forEachRemaining(wrappedSink);
            wrappedSink.end();
        }
        else {
            copyIntoWithCancel(wrappedSink, spliterator);
        }
    }
```
#### 有状态的中间操作何时执行?
例如sorted()操作,其依赖上一次操作的结果集,按照调用链来说结果集必须在accept()调用完才会产生.那也就说明sorted操作需要在end中,然后再重新开启调用链.

**sorted的end方法**:
```java
       @Override
        public void end() {
            list.sort(comparator);
            downstream.begin(list.size());
            if (!cancellationWasRequested) {
                list.forEach(downstream::accept);
            }
            else {
                for (T t : list) {
                    if (downstream.cancellationRequested()) break;
                    downstream.accept(t);
                }
            }
            downstream.end();
            list = null;
        }
```
那么就相当于sorted给原有操作断路了一次,然后又重新接上,再次遍历.
![](http://res.mrdear.cn/1499071708.png?imageMogr2/thumbnail/!70p)

#### 如何收集到结果?
foreach是不需要收集到结果的,但是对于collect这样的操作是需要拿到最终end产生的结果.end产生的结果在最后一个Sink中,这样的操作最终都会提供一个取出数据的get方法.
```java
       @Override
        public <P_IN> R evaluateSequential(PipelineHelper<T> helper,
                                           Spliterator<P_IN> spliterator) {
            return helper.wrapAndCopyInto(makeSink(), spliterator).get();
        }
```
如此拿到数据返回

> 个人博客 [mrdear.cn](mrdear.cn) ,欢迎交流



