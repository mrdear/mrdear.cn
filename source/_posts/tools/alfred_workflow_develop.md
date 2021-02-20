---
title: Alfred插件开发--了解Alfred的数据流动
subtitle: 开发了一款alfred插件,顺便记录下开发历程.
cover: http://imgblog.mrdear.cn/1519565599.png
author: 
  nick: 屈定
tags:
  - Alfred
  - 轮子
categories: 工具
urlname: alfred-developer
date: 2018-02-25 08:02:08
updated: 2018-02-25 08:02:11
---
最近发现要记住的长命令太多了,因此打算开发一款Alfred插件帮助自己记录.
先展示下成品,大概就是输入关键词->搜索展示->复制到指定位置这一流程,借此开分析下Alfred插件开发.
![http://imgblog.mrdear.cn/201811111111.gif](http://imgblog.mrdear.cn/201811111111.gif)

Alfred插件开发要解决如下几个问题
1. 用户输入如何到达自定义脚本?
2. 自定义脚本如何输出到Alfred的item选项?
3. Alfred的item选项选择后如何传递到下一个执行点?

### 用户输入如何到达自定义脚本?
Alfred的入口(`inputs组件`)有很多,一般常用的是`Keyword`,`Script Filter`,`List Filter`等.
对于`Keyword`是输入`cmd xxx`后按enter才能触发.
对于`XXX Filter`是输入时不停地调用脚本触发.

假设用户输入的是`cmd xxx`这样的输入,Alfred会把关键词`cmd`后面的内容当成参数传递,传递有两种形式1.类似shell形式$1 $2这种风格,2.是使用一个字符串{query}来表示后面所有内容

以`Script Filter`为例
当用户输入`cmd dt-ansible`时,alfred实际上执行命令为`./go_start -s dt-ansible`
当用户输入`cmd dt-ansible1 dt-ansible2`时,alfred实际上执行命令为`./go_start -s 'dt-ansible1 dt-ansible2' `,{query}形式主要解决空格等分隔符输入问题.
![](http://imgblog.mrdear.cn/1519564240.png?imageMogr2/thumbnail/!100p)

### 自定义脚本如何输出到Alfred的item选项?
上述用户输入`cmd dt-ansible`后,Alfred接管了`go_start`这个脚本的输入与输出,那么只需要在输出时按照Alfred格式要求,Alfred就会自动显示Item选项,格式如下:
```xml
<items>
  <item uid="0" arg="npm config set registry https://registry.npm.taobao.org" valid="YES" autocomplete="npm-common" type="default">
    <title>npm-common</title>
    <subtitle>npm通用命令</subtitle>
    <icon>./icon.png</icon>
  </item>
</items>
```
其中重要的是`arg`参数,该参数表示选中这个Item后传递给下一个工作流节点的参数内容,其他参数请参考下列文档.
另外新版的Alfred是推荐使用json形式参数,但是为了兼容Alfred2,没特殊需求的话使用xml时最好的方式.
[Alfred XML格式指南](https://www.alfredapp.com/help/workflows/inputs/script-filter/xml/)

![](http://imgblog.mrdear.cn/1519564710.png?imageMogr2/thumbnail/!100p)

### Alfred的item选项选择后如何传递到下一个执行点?
每一个Item的xml选项都有对应的Arg参数,如上述xml,那么我传递给下一个节点的就是`npm config set registry https://registry.npm.taobao.org`这一串命令,同样下一个节点使用`{query}`即可获取,如下图Copy to Clipboard节点所示.
![](http://imgblog.mrdear.cn/1519565086.png?imageMogr2/thumbnail/!100p)

### 输入数据转换
输入参数在`Alfred`可以使用其提供的各种`Utils`进行filter,map等操作,如下面操作我使用的是filter分支操作,当输入指令为open时执行下面分支,不等于open时执行上面分支.
![](http://imgblog.mrdear.cn/1519565430.png?imageMogr2/thumbnail/!100p)

### 插件地址
[https://github.com/mrdear/Command_Search](https://github.com/mrdear/Command_Search)


