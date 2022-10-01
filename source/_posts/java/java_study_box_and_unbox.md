---
title: Java学习记录--自动拆箱与装箱
subtitle: 关于拆箱与装箱的深入分析.
cover: http://res.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - Java    
categories: 夯实Java基础
urlname: java_box_unbox
date: 2018-03-04 11:03:01
updated: 2018-03-04 11:03:04
---
先提问题
> 1. 什么是自动拆箱与装箱?
> 2. 什么情况下会自动拆箱与装箱?
> 3. 对性能的影响?
> 4. 使用建议

### 什么是自动拆箱与装箱?
自动拆箱与装箱是Java5引入的新特性,目的是解决基本类型与包装类型之间切换的麻烦.
**装箱**
```java
Integer num = 1;
```
编译之后的代码如下,此时`Integer.valueOf()`把基本类型转换为包装类型叫装箱.
```java
Integer num = Integer.valueOf((int)1);
```
**拆箱**
```java
    // 装箱
    Integer num = 1;
    Integer num2 = 2;
    // 先拆再装
    Integer num3 = num + num2;
```
编译之后代码,调用`num.intValue()`的过程叫做拆箱.对于`+`操作符,其只支持基本类型,因此必然会先拆箱,最后结果又是`Integer`包装类型,因此赋值时发生了装箱.
```java
    Integer num = Integer.valueOf((int)1);
    Integer num2 = Integer.valueOf((int)2);
    Integer num3 = Integer.valueOf((int)(num.intValue() + num2.intValue()));
```
简单来说,基本类型与包装类型在某些操作符的作用下,发生包装类型调用`valueOf()`方法的过程叫做装箱,基本类型调用`xxValue()`的过程叫做拆箱.

### 什么情况下会自动拆箱与装箱?
**拆箱**
1. 只支持基本类型的操作符,如+-*/
2. 包装类型与基本类型共同进行多元操作.例如包装类型->基本类型赋值`double num7 = new Double(1)`.

**装箱**
1. 包装类型与基本类型共同进行多元操作.例如基本类型->包装类型赋值`double double1 =10D`

举例:
```java
    // 正常赋值
    double double1 =10D;
    //装箱 基本类型 -> 包装类型  
    Double double2 =10D;
   // 装箱 基本类型 -> 包装类型  
    Double double3 =10D;
    // double2拆箱  +号只支持基本类型
    double double4 = double1 + double2;
    // double2,double3拆箱,double5装箱  +号只支持基本类型,基本类型 -> 包装类型 
    Double double5 = (double2 + double3);
```
**==的特殊性**
`==`操作符既支持基本类型又支持包装类型(引用类型),那么某些地方必然会有歧义,这类操作符有一个原则,当有基本类型时以基本类型为主.
```java
    double double1 =10D;
    Double double2 =10D;
    Double double3 =10D;
    // double2拆箱,因此比较值
    System.out.println(double1 == double2); //true
    // 包装类比较,直接比较引用地址.
    System.out.println(double2 == double3); //false
```

### 对性能的影响?
装箱与拆箱本质是创建对象(valueOf)与调用对象方法(xxValue),没有多小性能消耗.但是在**循环中也可能成为拖慢系统的最后一根稻草**.如下面代码再一次循环中会有两次拆箱,一次装箱的消耗,不考虑缓存的影响循环多少次就创建了多少个`Integer`对象,虽然执行仍然会很快,但是把cpu浪费在这种地方有些得不偿失了.
```java
    Integer num = 1;
    // num先拆箱再比较
    while (num < 100000) {
        // num先拆箱,然后执行++再装箱
      num++;
      // do something
    }
```

### 使用建议
关于使用需要了解两方的优势:
对于基本类型: 优点速度快,内存占用低,缺点无法表示不存在情况
对于包装类型: 优点有null值代表不存在情况,缺点速度慢,内存占用高(相对于基本类型)
那么基本类型与包装类型就是互补的存在了,具体使用哪个根据你是否有值不存在的这一情况表示决定.
日常开发建议遵循阿里Java开发手册:
1. (强制)所有POJO类属性必须使用包装类型
2. (强制)RPC方法返回值和参数必须包装类型
3. (推荐)所有局部变量使用基本类型

### 其他
最后推荐下一款反编译插件，可以直接看到去糖后的代码
[https://github.com/mrdear/asm-bytecode-intellij](https://github.com/mrdear/asm-bytecode-intellij)
