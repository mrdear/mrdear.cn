---
title: Hadoop -- Map与Reduce
subtitle: 关于MapReduce的一些理解
cover: http://imgblog.mrdear.cn/mrdear-blog-hadoop.png
author: 
  nick: 屈定
tags:
  - 大数据
  - Hadoop
categories: 大数据
urlname: framework-hadoop-map-reduce
date: 2018-09-23 21:48:32
updated: 2018-09-23 21:48:32
---
最近一直在学习Hadoop相关的生态，本文记录下关于Hadoop下MapReduce的一些运作机制以及背后的原理。

## MapReduce流程
网上找的一张MapReduce流程图，个人认为过程是很清晰的，那么理解MapReduce就要深入到每一个过程，也是文章后面分析的步骤。
![来源自网络](http://imgblog.mrdear.cn/1537748759.png?imageMogr2/thumbnail/!100p)

### 输入分片
在进行MapReduce计算时会先进行文件分片，分片的目的就是利用分治思想，把大任务分解为小任务。分片并不是根据数据文件本身分片，而是根据NameNode中存储的元数据信息来分，得到的结果`split`是一个**数据长度**和**记录数据位置的数组**。分片分发这个过程中会考虑Block大小，以及该Block与Map task是否在同一台机器或者机架上，以便最大的节省网络传输消耗。
假设HDFS的block大小为64M，如果一个文件是150M大小，那么就会产生三个block，64M，64M，22M，那么在输入分片过程中一般会分为三个`split`，对应于三个Map task。
![](http://imgblog.mrdear.cn/1539699187.png?imageMogr2/thumbnail/!100p)


### Map阶段
在Map阶段，每个Map任务处理接收到的split，然后去指定位置获取数据，调用Map函数处理。
Map函数的处理是技术人员写的逻辑，以wordcount为例，Map处理后产生的是一个个单词与数量的键值对，如下图所示，存放在内存中（mapreduce.task.io.sort.mb）。
![](http://imgblog.mrdear.cn/1539699436.png?imageMogr2/thumbnail/!100p)

### Combine阶段
Combine阶段是一个可选的操作，其本质是一个Map本地的Reduce操作，目的是为了减少Map输出的文件大小，尽可能利用Map的计算能力多做一些计算。比如以求和为例，如果不使用combine，那么每个Map输出的是多个数字，然后reduce再一个一个的加在一起，使用了Combine后，每个Map输出的是当前Map任务所负责文件对应数字的总和，也就是每个Map只会输出一个结果，Reduce只需要把这些结果加在一起生成最终结果，即可。
Combine的使用一定是队最终结果无影响才可以，上述求和是无影响的，如果是求平均值使用combine那么就是错误的了。
![](http://imgblog.mrdear.cn/1539699879.png?imageMogr2/thumbnail/!100p)

### Map shuffle阶段
首先明确shuffle阶段的目的是**解决如何高效的把Map产生的结果文件传给Reduce**。然后再分析。
Map处理的数据量往往是非常巨大的，并且Map还会对结果排序，那么要解决的第一个问题是如何对大量结果排序输出？答案是外排序，
在Map中产生的中间结果是存放在内存中，当内存使用率达到一定比率（mapreduce.map.sprt.spill.percent），默认是80%，会通过后台守护线程将这80%的内容写到磁盘中，这个过程叫`spill`。`spill`也是由单独的线程完成处理，另外在`spill`过程中内存满了则会造成map阻塞。在写磁盘之前，当前线程会根据Reduce的数量设置分区，然后把内存中的数据写入到对应的分区中，这个过程也会对内存中的数据进行合并以及排序，如果存在combine则会执行combine逻辑，先本地reduce尽可能的减少生成文件大小。
当Map处理完全部输入文件后，产生的结果是一堆已经分区且有序的`spill`文件，那么针对这些有序文件会进行多路归并处理，归并完后按照每一个分区独立一个文件输出到JobTracker能够访问的本地目录中，到此Map任务才算完全执行完毕。
![](http://imgblog.mrdear.cn/1539701466.png?imageMogr2/thumbnail/!100p)


### Reduce shuffle
Map端结束后在对应的机器上生成本地结果文件，Reduce Shuffle要做的第一件事就是根据Reduce任务分区的配置，使用HTTP的方式去获取到对应Map的结果文件，简单点说就是去各各Map机器上拿自己所需要的数据，接着是合并阶段，这里是能使用内存就使用内存，不能使用则会像Map Shuffle一样使用外排序方式合并，默认情况下当已执行完的Map Task大于总量的5%时就开始执行copy逻辑汇集结果。

### Reduce
到达此阶段后，Map的结果文件已经在Reduce Shuffle阶段合并完毕，那么只需要读取数据执行Reduce函数的逻辑，产出最终的结果。

### 其他问题

#### 如何优化MapReduce？
从上述流程来分析，Map端是业务处理的重点，且Map task的数量往往又远大于Reduce task数量，更容易依赖并行进行更多的计算。
1. 根据文件block数量设置一个合理的Map task数量，该目的是为了减少网络传输的消耗。
2. 减少Map任务的内存使用，对于单一的Map，Hadoop是串行调用，不存在并发，因此可以使用全局变量等方式重用对象。
3. 使用combine，combine相当于Map本地的reduce，利用map数量的优势，可以大幅度减少Reduce的压力。
4. 压缩输出结果，在Reduce shuffle过程中会去不同的Map机器上获取文件，那么性能瓶颈就在网络IO上，因此压缩会让传输更加效率。


#### 为什么Map端排序Reduce端也要排序？
很多场景下排序是一件没有必要的事情，但是Hadoop没有对应的配置选项，默认是都排序的。这个问题说说个人的理解，首先对于大量数据排序本身就是一件困难的事情，因此Hadoop作为框架必须提供排序功能，至于为什么不可配置，那就不清楚了。
Map端排序主要是分散排序压力，毕竟Map的任务数量一般会大于Reduce的数量，当结果到达Reduce端是已经是有序状态了，那么Reduce端只需要多路归并有序集，排序的绝大部分压力被Map端分担了起来，这个也是两次排序的目的。


### 参考
[离线和实时大数据开发实战](https://item.jd.com/12359008.html)