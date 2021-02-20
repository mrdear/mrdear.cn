---
title: IDEA插件ASM Bytecode Outline
subtitle: 修改自ASM Bytecode Outline的反编译插件
cover: http://imgblog.mrdear.cn/idea.png
author: 
  nick: 屈定
tags:
  - IntelliJ
  - 轮子
categories: 工具
urlname: idea_plugin_compile
date: 2018-02-04 15:29:34
updated: 2018-08-21 05:08:53
---

**该插件不再维护，我这边提供了另一个比较好用的插件，可以替代使用 [https://plugins.jetbrains.com/plugin/index?xmlId=cn.mrdear.intellij.class-decompile-intellij](https://plugins.jetbrains.com/plugin/index?xmlId=cn.mrdear.intellij.class-decompile-intellij)**

这款插件对于我学习JVM上的其他语言帮助非常大，很多高级语法糖反编译之后能够明白背后的原理，目前插件已经上传到JetBrains官方仓库，欢迎试用。
**插件地址：**
[https://plugins.jetbrains.com/plugin/11035-cfr-decompile](https://plugins.jetbrains.com/plugin/11035-cfr-decompile)

**源码地址：**
[https://github.com/mrdear/asm-bytecode-intellij](https://github.com/mrdear/asm-bytecode-intellij)

- - - - - 

对于有Java基础的人学习kotlin的高效方式就是看反编译的代码.那么对于其各种语法糖可以很好的了解背后的原理.那么就需要一款反编译插件`ASM Bytecode Outline`.
[https://github.com/melix/asm-bytecode-intellij](https://github.com/melix/asm-bytecode-intellij),原版插件只支持翻译为字节码指令对于开发人员来说不是很友好,比如下面代码.
```java
data class TableModel(val tableName: String,
                      val columns: List<ColumnModel>) {
}
```
这反编译的bytecode形式看起来不是很友好.
```java
public final class com/itoolshub/pojo/model/table/TableModel {

  // compiled from: TableModel.kt
  // access flags 0x12
  private final Ljava/lang/String; tableName
  @Lorg/jetbrains/annotations/NotNull;() // invisible

  // access flags 0x12
  // signature Ljava/util/List<Lcom/itoolshub/pojo/model/table/ColumnModel;>;
  // declaration: java.util.List<com.itoolshub.pojo.model.table.ColumnModel>
  private final Ljava/util/List; columns
  @Lorg/jetbrains/annotations/NotNull;() // invisible

  // access flags 0x11
  public final getTableName()Ljava/lang/String;
  @Lorg/jetbrains/annotations/NotNull;() // invisible
   L0
    LINENUMBER 8 L0
    ALOAD 0
    GETFIELD com/itoolshub/pojo/model/table/TableModel.tableName : Ljava/lang/String;
    ARETURN
   L1
    LOCALVARIABLE this Lcom/itoolshub/pojo/model/table/TableModel; L0 L1 0
    MAXSTACK = 1
    MAXLOCALS = 1

  // access flags 0x11
  // signature ()Ljava/util/List<Lcom/itoolshub/pojo/model/table/ColumnModel;>;
  // declaration: java.util.List<com.itoolshub.pojo.model.table.ColumnModel> getColumns()
  public final getColumns()Ljava/util/List;
  ............等等
```
集成的`CFR Decompile`后的结果如下,看起来清晰了许多.
```java
public final class TableModel {
    @NotNull
    private final String tableName;
    @NotNull
    private final List<ColumnModel> columns;

    @NotNull
    public final String getTableName() {
        return this.tableName;
    }
    @NotNull
    public final List<ColumnModel> getColumns() {
        return this.columns;
    }
    public TableModel(@NotNull String tableName, @NotNull List<ColumnModel> columns) {
        Intrinsics.checkParameterIsNotNull((Object)tableName, (String)"tableName");
        Intrinsics.checkParameterIsNotNull(columns, (String)"columns");
        this.tableName = tableName;
        this.columns = columns;
    }
    @NotNull
    public final String component1() {
        return this.tableName;
    }
    @NotNull
    public final List<ColumnModel> component2() {
        return this.columns;
    }
...... 等等
```
### 下载
原版代码风格不是很适应,因此改了好多自我感觉不合理的地方,应该不会提pull request了.
[https://github.com/mrdear/asm-bytecode-intellij](https://github.com/mrdear/asm-bytecode-intellij)