---
title: (转)Java--栈与队列
subtitle: 学习Java中所提供的栈与队列数据结构
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 李豪
tags:
  - Java
categories: 夯实Java基础
urlname: java_deque
date: 2018-02-23 11:02:59
updated: 2018-02-23 11:02:01
---
<!-- toc -->
- - - - -
Java中栈与队列相比集合来说不是很常用的数据结构,因此经常被忽略.个人觉得还是有必要掌握下,以备不时之需.
Java中实际上提供了`java.util.Stack`来实现栈结构,但官方目前已不推荐使用,而是使用`java.util.Deque`双端队列来实现队列与栈的各种需求.如下图所示`java.util.Deque`的实现子类有`java.util.LinkedList`和`java.util.ArrayDeque`.顾名思义前者是基于链表,后者基于数据实现的双端队列.
![](http://res.mrdear.cn/1519395982.png)

### 总体介绍
要讲栈和队列，首先要讲Deque接口。Deque的含义是“double ended queue”，即双端队列，它既可以当作栈使用，也可以当作队列使用。下表列出了Deque与Queue相对应的接口：
![](http://res.mrdear.cn/1519396771.png)
下表列出了Deque与Stack对应的接口：
![](http://res.mrdear.cn/1519396747.png)
上面两个表共定义了Deque的12个接口。添加，删除，取值都有两套接口，它们功能相同，区别是对失败情况的处理不同。**一套接口遇到失败就会抛出异常**，**另一套遇到失败会返回特殊值（false或null）**。除非某种实现对容量有限制，大多数情况下，添加操作是不会失败的。虽然Deque的接口有12个之多，但**无非就是对容器的两端进行操作**，或添加，或删除，或查看。明白了这一点讲解起来就会非常简单。

### ArrayDeque
从名字可以看出ArrayDeque底层通过数组实现，为了满足可以同时在数组两端插入或删除元素的需求，该数组还必须是循环的，即**循环数组**（circular array），也就是说数组的任何一点都可能被看作起点或者终点。ArrayDeque是**非线程安全**的（not thread-safe），当多个线程同时使用的时候，需要程序员手动同步；另外，该容器**不允许放入null元素**。
![](http://res.mrdear.cn/1519396968.png)
上图中我们看到，**head指向首端第一个有效元素**，**tail指向尾端第一个可以插入元素的空位**。因为是循环数组，所以head不一定总等于0，tail也不一定总是比head大。

#### addFirst()
针对首端插入实际需要考虑：1.空间是否够用，以及2.下标是否越界的问题。上图中，如果head为0之后接着调用addFirst()，虽然空余空间还够用，但head为-1，下标越界了。下列代码很好的解决了这两个问题。
```java
      public void addFirst(E e) {
        if (e == null)
            throw new NullPointerException();
        //下标越界问题解决方案
        elements[head = (head - 1) & (elements.length - 1)] = e;
        //容量问题解决方案
        if (head == tail)
            doubleCapacity();
    }
```
上述代码我们看到，空间问题是在插入之后解决的，因为tail总是指向下一个可插入的空位，也就意味着elements数组至少有一个空位，所以插入元素的时候不用考虑空间问题。

下标越界的处理解决起来非常简单，**head = (head - 1) & (elements.length - 1)**就可以了，这段代码相当于取余，同时解决了head为负值的情况。因为**elements.length必需是2的指数倍**(构造函数初始化逻辑保证)，elements - 1就是二进制低位全1，跟head - 1相与之后就起到了取模的作用，如果head - 1为负数（其实只可能是-1），则相当于对其取相对于elements.length的补码。

下面再说说扩容函数doubleCapacity()，其逻辑是**申请一个更大的数组（原数组的两倍）**，然后将原数组复制过去。过程如下图所示：
![](http://res.mrdear.cn/1519397934.png)
图中我们看到，复制分两次进行，第一次复制head右边的元素，第二次复制head左边的元素。
```java
    private void doubleCapacity() {
        assert head == tail;
        int p = head;
        int n = elements.length;
        int r = n - p; // number of elements to the right of p
        int newCapacity = n << 1;
        if (newCapacity < 0)
            throw new IllegalStateException("Sorry, deque too big");
        Object[] a = new Object[newCapacity];
        System.arraycopy(elements, p, a, 0, r);
        System.arraycopy(elements, 0, a, r, p);
        elements = a;
        head = 0;
        tail = n;
    }

```

#### addLast()
addLast(E e)的作用是在Deque的尾端插入元素，也就是在tail的位置插入元素，由于tail总是指向下一个可以插入的空位，因此只需要elements[tail] = e;即可。插入完成后再检查空间，如果空间已经用光，则调用doubleCapacity()进行扩容。与first比较类似就不多分析了.
![](http://res.mrdear.cn/1519398033.png)

其他操作也是差不多的方式,唯一麻烦的head与tail位置转换也用取余巧妙的化解了.

### LinkedList
`LinkedList`实现了`Deque`接口,因此其具备双端队列的特性,由于其是链表结构,因此不像`ArrayDeque`要考虑越界问题,容量问题,那么对应操作就很简单了,另外当需要使用栈和队列是官方推荐的是`ArrayDeque`,因此这里不做多的分析.
![](http://res.mrdear.cn/1519398499.png)

> 作者: 李豪
> [https://github.com/CarpenterLee/JCFInternals](https://github.com/CarpenterLee/JCFInternals)