---
title: IDEA插件 -- Class Decompile
subtitle: 一款支持asm,javap,cfr反编译对应.class文件的插件
cover: http://imgblog.mrdear.cn/idea.png
author: 
  nick: 屈定
tags:
  - IntelliJ
  - 轮子
categories: 工具
urlname: idea_plugin_decompile
date: 2020-03-14 08:51:23
updated: 2020-03-14 08:51:27
---

最近开始学习IntelliJ插件开发，于是就把之前维护的一款[反编译插件](https://github.com/work-helper/asm-bytecode-intellij)重新实现了一个版本，并且加入了javap指令的支持，对于理解Java class文件有着不错的帮助。

## 安装下载
源码: [https://github.com/work-helper/class-decompile-intellij](https://github.com/work-helper/class-decompile-intellij)

JB插件地址: [https://plugins.jetbrains.com/plugin/13914-class-decompile](https://plugins.jetbrains.com/plugin/13914-class-decompile)


## 插件功能
插件的使用很简单，对着Java，Kotlin等JVM上语言文件或者是class文件点击右键，选择`Show Decompile Code`，即可反编译对应的class文件，如下图所示：
![](http://imgblog.mrdear.cn/1583656954.png?imageMogr2/thumbnail/!60p)

### Javap支持
`javap`是JDK自带的反编译工具，因此支持需要依赖`External Tools`功能支持，如下图所示在对应菜单中配置javap命令入口，插件则会自动调用对应的javap指令进行反编译。

![](http://imgblog.mrdear.cn/1583656067.png?imageMogr2/thumbnail/!60p)

## 反编译能做什么

### 理解语法糖
反编译能够还原语法糖的实现，帮助你更好的理解编程语言的本质。比如kotlin下的`object class`，反编译后可以很好的理解单例实现。

**反编译前**
```kotlin
object UserService {
}
```

**cfr反编译后**

```java
import kotlin.Metadata;

@Metadata(mv={1, 1, 16}, bv={1, 0, 3}, k=1, d1={"。。。。"})
public final class UserService {
    public static final UserService INSTANCE;

    private UserService() {
    }

    static {
        UserService userService;
        INSTANCE = userService = new UserService();
    }
}
```

### 了解Class文件结构
在插件javap指令参数配置上增加`-p -v`，那么反编译能够打印出对应的class文件信息，你可以很清楚的了解的class文件由哪几部分构成。

**反编译前**
```kotlin
object UserService {
}
```

**javap反编译后(比较长，省略了很多内容)**
```java
public final class cn.mrdear.test.UserService
  minor version: 0
  major version: 50
  flags: ACC_PUBLIC, ACC_FINAL, ACC_SUPER
Constant pool:
   #1 = Utf8               cn/mrdear/test/UserService
   #2 = Class              #1             // cn/mrdear/test/UserService
   #3 = Utf8               java/lang/Object
   #4 = Class              #3             // java/lang/Object
   #5 = Utf8               <init>
......
{
  public static final cn.mrdear.test.UserService INSTANCE;
    descriptor: Lcn/mrdear/test/UserService;
    flags: ACC_PUBLIC, ACC_STATIC, ACC_FINAL

  private cn.mrdear.test.UserService();
    descriptor: ()V
    flags: ACC_PRIVATE
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #8                  // Method java/lang/Object."<init>":()V
         4: return
      LineNumberTable:
        line 8: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       5     0  this   Lcn/mrdear/test/UserService;

  static {};
    descriptor: ()V
    flags: ACC_STATIC
    Code:
      stack=2, locals=1, args_size=0
         0: new           #2                  // class cn/mrdear/test/UserService
         3: dup
         4: invokespecial #26                 // Method "<init>":()V              // Field INSTANCE:Lcn/mrdear/test
      LineNumberTable:
        line 8: 0
}
SourceFile: "UserService.kt"
RuntimeVisibleAnnotations:
  0: #13(#14=[I#15,I#15,I#16],#17=[I#15,I#18,I#19],#20=I#15,#21=[s#22],#23=[s#10,s#24,s#6,s#25])
```

### 学习Java字节码指令
反编译后能够查看到对应的字节码操作，了解`dup，ldc，invokespecial，astore_0`等相应字节码在JVM上起到的具体作用。
**反编译前**
```kotlin
object UserService {
}
```

**ASM反编译后**
```kotlin
public final class cn/mrdear/test/UserService {

  // compiled from: UserService.kt

  @Lkotlin/Metadata;(mv={1, 1, 16}, bv={1, 0, 3}, k=1, d1={"。。。。 "class-decompile-intellij.main"})

  // access flags 0x19
  public final static Lcn/mrdear/test/UserService; INSTANCE

  // access flags 0x2
  private <init>()V
   L0
    LINENUMBER 8 L0
    ALOAD 0
    INVOKESPECIAL java/lang/Object.<init> ()V
    RETURN
   L1
    LOCALVARIABLE this Lcn/mrdear/test/UserService; L0 L1 0
    MAXSTACK = 1
    MAXLOCALS = 1

  // access flags 0x8
  static <clinit>()V
   L0
    LINENUMBER 8 L0
    NEW cn/mrdear/test/UserService
    DUP
    INVOKESPECIAL cn/mrdear/test/UserService.<init> ()V
    ASTORE 0
    ALOAD 0
    PUTSTATIC cn/mrdear/test/UserService.INSTANCE : Lcn/mrdear/test/UserService;
    RETURN
    MAXSTACK = 2
    MAXLOCALS = 1
}
```

废话不多说，赶快去使用吧。