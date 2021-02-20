---
title: IntelliJ IDEA自定义备忘录 
subtitle: 记录针对IntelliJ IDEA的各项设置
cover: http://imgblog.mrdear.cn/idea.png
author: 
  nick: 屈定
tags:
  - IntelliJ
categories: 工具
urlname: idea-setting-memo
date: 2020-02-16 22:52:46
updated: 2020-12-12 11:18:15
---

本文记录在使用IDEA过程中的一些配置，一方面是备份，一方面是给其他人一些使用参考，本文会根据使用情况不断更新。

## 代码提示

### Editor -> General -> Auto import

该配置为自动导包相关配置项，比如从其他地方复制一段Java代码，粘贴后，import部分自动优化。

#### Java配置项
- insert imports on the paste: **ALL**
- show inports popup for:  **classes**  **static method and field** 全部选上
- add unambiguous imports on the fly: **开启** ，当前环境中假设一个类只有一个，那么就自动导入这个，虽然有时候会导入错误，但是往往都是正确。
- optimize imports on the fly: **开启** ，优化导包功能，会删除无用的导入指令
- Exclude from import and completion: 排除一些包，比如sun开头的以及其他不常用的包

```java
com.sun
sun
com.alibaba.fastjsonfordrm
```

### Editor -> General -> Postfix Completion
该模块为代码提示的另一种用法，比如`var.null` -> `if(null == var)`，这种变化，因此可以很好的结合自己习惯扩展

#### 增加集合框架null判断支持(isnull，notnull)
集合类一般要判null以及空，因此针对集合类的语法。

1. java.util.Map
2. java.util.List
3. java.util.Set

```java
// 替换前
$EXPR$.isnull

// 替换后
if(null == $EXPR$ || $EXPR$.isEmpty()){
    $END$
}
```

### Editor -> Inspections

Serializable class without "SerializableUID" : 设置error告警

### Editor -> File and Code Template

**File header** 

```
/**
 * 
 * @author ${USER}
 * @since ${DATE}
 */
```

### Editor -> Reader Mode 

- Render Doc comment：关闭，选然后注释很小，看着不方便



## 快捷键

### Main Menu -> Navigate 

- Type Hierarchy：获取类型层次结构
- Method Hierarchy：获取方法层次结构
- Call Hierarchy：获取调用层次结构，在看源代码的时候，该功能很有用



