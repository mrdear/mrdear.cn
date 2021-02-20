---
title: IntelliJ Plugin -- related files
subtitle: 开发的一款通过@doc标记定位到文件的插件
cover: http://imgblog.mrdear.cn/idea.png
author: 
  nick: 屈定
tags:
  - IntelliJ
  - 轮子
categories: 工具
urlname: idea-plugin-related-file
date: 2020-02-28 21:59:22
updated: 2020-02-28 21:59:25
---

## 简介

工作中喜欢文档跟着项目走，直接存放到代码库中，这样有疑问可以随时去看，那么当看到一个类或者一个方法时怎么知道有相关文档呢？该插件就是解决这个问题，先看下示意图：

![http://imgblog.mrdear.cn/mweb/example.gif](http://imgblog.mrdear.cn/mweb/example.gif)

功能很简单，通过在**类名**或者**方法名**加上注解`@doc 文件名`，来指向到对应的文件，同时有文件名重复则会让用户自己选择，插件是最小化功能集，没有任何会影响到编码流畅的点。

## 安装
- 方式一：Jetbrains下IDE仓库里面搜索 `related-file`，安装即可

- 方式二：Github对应地址releases下载最新版本，手动安装



## 源码
[https://github.com/work-helper/related-file-intellij](https://github.com/work-helper/related-file-intellij)
