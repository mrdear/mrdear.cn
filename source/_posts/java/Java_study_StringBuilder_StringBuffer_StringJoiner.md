---
title: Java--StringBuilder,StringBuffer,StringJoiner
subtitle: java.util源码阅读系列,阅读中查漏补缺巩固自己的基础知识.
cover: http://imgblog.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - Java
categories: 夯实Java基础
urlname: java_stringbuilder
date: 2018-02-12 09:02:51
updated: 2018-02-12 09:02:56
---
<!-- toc -->
- - - - -

开始自己的一个半年计划,也就是java相关常用类的源码阅读,通过阅读查漏补缺,加深基础知识的运用与理解.

### 简介
StringBuilder,StringBuffer三个类在平时工作中很常用,因此详细了解下还是很必须的,由类图可以很清晰的得到其底层都是基于char[]数组的存储,基于数组存储必然会遇到与List集合一样的扩容问题,那么这两个类可以理解为专为字符定制的List集合(实际上与List也非常相似).其中`AbstractStringBuilder`作为BaseParent其封装了很多通用的操作,比如最麻烦的扩容操作,掌握`StringBuilder,StringBuffer`基本上只要了解`AbstractStringBuilder`就好了.
另外`StringJoiner`是Java8所提供的的一个字符串工具类,从类图来看和其他的类都没关系,其内部只是对StringBuilder的一种封装,便于更加轻松地连接字符串.
![](http://imgblog.mrdear.cn/1518444191.png?imageMogr2/thumbnail/!100p)

### AbstractStringBuilder
`AbstractStringBuilder`是提供字符串连接的核心,其成员变量有`value: char[]`存储容器,`count: int`实际字符串大小,int类型也决定了最大长度不能超过`Integer.MAX_VALUE`,实际上代码中最大长度定义的是`Integer.MAX_VALUE - 8`,不知道为什么减8.....

#### append操作
与List相同,基于数组的顺序结构,在数组改变的时候会有产生容量的问题.`AbstractStringBuilder`在所有的append操作前都会先去检查容量,然后确定容量足够后才往数组添加数据,容量不足时则新建 oldCount x 2+2的数组,把旧数据拷贝进去后继续添加操作.
那么可以得出的结论,**对于能预估大概长度的字符串拼接一次性分配指定容量是一种提高性能的好策略**.

```java
   private void ensureCapacityInternal(int minimumCapacity) {
        // overflow-conscious code
        if (minimumCapacity - value.length > 0) {
            value = Arrays.copyOf(value,
                    newCapacity(minimumCapacity));
        }
    }

//  newCapacity逻辑
        int newCapacity = (value.length << 1) + 2;
```

#### delete操作
删除操作与添加类似,同样需要改变value数组,那么就涉及到数组的元素移动.主要是由`System.arraycopy`来进行操作,对于大数组来说**删除前面的元素就需要移动后面全部的内容**.
```java
   public AbstractStringBuilder delete(int start, int end) {
        if (start < 0)
            throw new StringIndexOutOfBoundsException(start);
        if (end > count)
            end = count;
        if (start > end)
            throw new StringIndexOutOfBoundsException();
        int len = end - start;
        if (len > 0) {
            // 把end之后的元素都向前移动len位.
            System.arraycopy(value, start+len, value, start, count-end);
            count -= len;
        }
        return this;
    }
```

#### insert操作
insert需要涉及一次移动一次拷贝,先把移动元素空出位置给要insert的字符,然后再把字符填充进去.
```java
  public AbstractStringBuilder insert(int offset, char[] str) {
        if ((offset < 0) || (offset > length()))
            throw new StringIndexOutOfBoundsException(offset);
        int len = str.length;
        ensureCapacityInternal(count + len);
        // 移动空出字符
        System.arraycopy(value, offset, value, offset + len, count - offset);
        // 填充
        System.arraycopy(str, 0, value, offset, len);
        count += len;
        return this;
    }
```

### StringBuilder
由于抽象类不能实例化,因此其作为`AbstractStringBuilder`的实现类提供日常使用,内部基本没有自己的逻辑,绝大部分方法只是调用`super()`的方法委托.

另外在Java中字符串拼接绝大多数使用的都是StringBuilder,比如下面代码
```java
  @Test
  public void test() {
    String str = "王二";
    System.out.println("张三"+"李四" + str);
  }
```
使用[IDEA插件ASM Bytecode Outline](http://mrdear.cn/2018/02/04/%E5%B7%A5%E5%85%B7/IDEA%E6%8F%92%E4%BB%B6ASM%20Bytecode%20Outline/)反编译之后,对于`"张三"+"李四`这样的操作直接合并,对于变量则使用StringBuilder进行连接.
```java
 @Test
    public void test() {
        String str = "\u738b\u4e8c";
        System.out.println(new StringBuilder().append("\u5f20\u4e09\u674e\u56db").append(str).toString());
    }
```
那么在**循环中使用字符串拼接就可能造成性能问题**,如下代码
```java
    String result = "";

    for (int i = 0; i < 100; i++) {
    // 每次都会创建StringBuilder对象,然后赋值给result    
      result += i;
    }
```
编译之后的代码每次都会创建StringBuilder对象,可想性能多浪费.
```java
String result = "";
        for (int i = 0; i < 100; ++i) {
            result = new StringBuilder().append((String)result).append((int)i).toString();
        }
```

### StringBuffer
`StringBuffer`操作与StringBuilder很类似,其方法使用`synchronized`修饰,使其成为一个原子性操作从而保证了线程安全.

### StringJoiner
`StringJoiner`是JDK8所提供的字符串拼接函数,直接使用StringBuilder拼接也是可以的,只是有点复杂,比如下面类似的代码应该不少人写过,代码并没什么问题,只是有点小麻烦那么`StringJoiner`实际上就帮助我们解决了这一点的麻烦.
```java
 List<String> strs = Lists.newArrayList("张三","李四","王二");
    StringBuilder builder = null;
    for (int i = 0; i < strs.size(); i++) {
      if (i == 0) {
        builder = new StringBuilder("start").append(strs.get(i));
      } else {
        builder.append(",").append(strs.get(i));
      }
    }
    builder.append("end");
    Assert.assertEquals("start张三,李四,王二end", builder.toString());
```

改写成StringJoiner后就比较简洁了.
```java
  List<String> strs = Lists.newArrayList("张三","李四","王二");
    StringJoiner joiner = new StringJoiner(",","start","end");
    for (String str : strs) {
      joiner.add(str);
    }
    Assert.assertEquals("start张三,李四,王二end", joiner.toString());
```
配合Stream使用更佳,这里只是示例,单步操作并不是很建议使用Stream,Stream执行前需要构造自己的执行链,然后再在一次for循环中执行,其流程也是挺复杂的,详情可以看我之前Stream分析的文章,相对一次操作感觉性价比不是很高,还是一个foreach循环来的性价比最高.
```java
 Assert.assertEquals("start张三,李四,王二end",
        strs.stream().collect(Collectors.joining(",","start","end")));
```


