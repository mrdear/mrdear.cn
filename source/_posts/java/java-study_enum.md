---
title: Java--Enum的思考
subtitle: 枚举类是Java5引进的特性,本文主要对其原理的剖析,更加彻底的了解枚举类的实质.
cover: http://imgblog.mrdear.cn/javastudy.png
author: 
  nick: 屈定
tags:
  - Java    
categories: 夯实Java基础
urlname: java_enum
date: 2018-03-10 01:03:13
updated: 2018-03-10 01:03:15
---
<!-- toc -->
- - - - -

枚举类是Java5引进的特性,其目的是替换**int枚举模式**或者**String枚举模式**,使得语义更加清晰,另外也解决了行为和枚举绑定的问题.

## int枚举模式
在枚举类之前该模式被广泛使用,如果是int类型常量就被成为**int枚举模式**,同理是字符串类型常量则是**String枚举模式**.
```java
public class Plante {

  public static final int MERCURY = 1;

  public static final int VENUS = 2;

  public static final int EARTH = 3;
}
```
该模式的缺点有很多:
**1. Java作为强类型语言,该模式让其失去了强类型优势.**
举个例子,假设我又有下面一个枚举类,那么执行`Plante.EARTH == Fruit.APPLE`结果将为true,这显然是不可接受的
```java
public class Fruit {
  public static final int APPLE = 1;
}
// 该条件将成功
Assert.assertTrue(Plante.EARTH == Fruit.APPLE);
```
**2. 枚举类与其行为无法很好的绑定**
枚举类与行为绑定的操作一般使用switch-case来进行操作,这模式有缺点,比如增加了一个新的枚举常量,但是switch-case中没有增加,这是常有的事情,因为switch-case少一个分支并不会导致编译错误,这种问题很难暴露出来.
```java
  public static void apply(int n) {
    switch (n) {
      case Plante.MERCURY:
        // do something
        break;
      case Plante.VENUS:
        // do something
        break;
      case Plante.EARTH:
        // do something
        break;
    }
  }
```
## 枚举类
### enum语法糖
枚举类实质上是一种语法糖,比如下面这个空枚举.
```java
public enum PlanetEnum {
}
```
反编译([asm-bytecode-intellij](https://github.com/mrdear/asm-bytecode-intellij))后为
```java
public final class PlanetEnum
extends Enum<PlanetEnum> {
    private static final /* synthetic */ PlanetEnum[] $VALUES;

    public static PlanetEnum[] values() {
        return (PlanetEnum[])$VALUES.clone();
    }

    public static PlanetEnum valueOf(String name) {
        return Enum.valueOf(PlanetEnum.class, (String)name);
    }

    private PlanetEnum(String string,int n) {
        super((String)string, (int)n);
    }

    static {
        // 当枚举字段时在这里放入到数组
        $VALUES = new PlanetEnum[0];
    }
}
```
能够看出要点:
1. 枚举类默认继承`Enum`,并且`final`类,所以自定义枚举类无法继承与被继承.但是可以实现接口
2. 枚举字段是该枚举类的一个静态常量对象,且用数组存储.
3. values实际上是调用clone方法,其会创建新数组,数组中放入所有枚举字段.
4. 构造函数前两个默认为枚举字段名称,以及所处的顺序.也就是`Enum`中的name与ordinal.

### 如何与行为绑定
从反编译的代码来看枚举类是可以实现接口的,那么就可以利用接口定义行为,然后枚举类中覆盖行为.同样假设每一个枚举字段所对应的行为不同,那么直接内部覆盖掉也是很好的策略,这种情况下也叫策略枚举模式.(比如计算器实现加减乘除,都是二元操作符,那么策略枚举就很适合,可以动手试试)
```java
public enum PlanetEnum implements Supplier<String>{
  MERCURY(1) {
    @Override
    public String get() {
      return "地球";
    }
  };

  private int code;

  PlanetEnum(int code) {
    this.code = code;
  }

  public int getCode() {
    return code;
  }

  @Override
  public String get() {
    return "PLANET";
  }
}
```

### 线程安全问题
反编译后的代码所有枚举字段都是`static final`,Jvm的加载初始化流程保证其只被实例化一次,且实例化之后不可更改.
枚举类的实例化可以看做为饿汉式的单例,实际上是一个简单而又有效的模式,包括kotlin的`object`单例关键字也是使用了类似的方式.

### 序列化问题
在JDK序列化方式中,`ObjectInputStream`类中有如下注释:
>  <p>Enum constants are deserialized differently than ordinary serializable or externalizable objects.  The serialized form of an enum constant consists solely of its name; field values of the constant are not transmitted.  To deserialize an enum constant,ObjectInputStream reads the constant name from the stream; the deserialized constant is then obtained by calling the static method <code>Enum.valueOf(Class, String)</code> with the enum constant's base type and the received constant name as arguments.  Like other serializable or externalizable objects, enum constants can function as the targets of back references appearing subsequently in the serialization stream.  The process by which enum constants are deserialized cannot be customized: any class-specific readObject, readObjectNoData, and readResolve methods defined by enum types are ignored during deserialization. Similarly, any serialPersistentFields or serialVersionUID field declarations are also ignored--all enum types have a fixed serialVersionUID of 0L.

大概意思是枚举类的序列化依靠的是`name`字段,序列化时转成对应的name输出,反序列化时再依靠`valueOf()`方法得到对应的枚举字段,从而保证了单例. 并且枚举类的反序列化过程不可定制,入口封住后那么就能彻底保证单例.

那么为什么有很多公司禁止在二方库中返回值或者POJO使用枚举类呢?先看下`valueOf`方法也就是反序列化的实现
```java
    public static <T extends Enum<T>> T valueOf(Class<T> enumType,
                                                String name) {
        T result = enumType.enumConstantDirectory().get(name);
        if (result != null)
            return result;
        if (name == null)
            throw new NullPointerException("Name is null");
        throw new IllegalArgumentException(
            "No enum constant " + enumType.getCanonicalName() + "." + name);
    }
```
注意**当中找不到对应的枚举类时直接抛IllegalArgumentException异常**,直接导致返序列化失败,那么本次调用就会失败.这种行为主要出现在对于同一个二方库新版本新增枚举类字段,服务端升级了版本,而客户端端没升级版本,那么整个流程自然会在服务端处理完成后造成失败,既浪费了服务端的计算性能,又没得到想要的结果,自然属于严重事故了.

## 使用建议
关于使用建议,参考阿里巴巴Java开发手册中的三条建议,以及笔者的一条建议
1. 所有的枚举类型字段必须要有注释，说明每个数据项的用途。
2. 二方库里可以定义枚举类型，参数可以使用枚举类型，但是接口返回值不允许使用枚 举类型或者包含枚举类型的 POJO 对象。​​​​(这里返回值不可使用因为有反序列化的问题,那么为什么参数又可以使用呢?笔者不太清楚,希望大牛告知.)[作者孤尽的解答](https://www.zhihu.com/question/52760637/answer/338584321?utm_source=com.tencent.tim&utm_medium=social),实际上参数使用这个是属于客户端的责任了,不然的话枚举类的用处真的不是很大.
3. 枚举类名建议带上 Enum 后缀，枚举成员名称需要全大写，单词间用下划线隔开。​
4. 枚举类与switch-case在外部搭配时要注意,当枚举类增加字段时就带来switch-case的更新问题,这种bug编译期间无法得知,最好的办法时把行为与枚举类绑定,或者把switch-case的逻辑统一写在该枚举类的内部.