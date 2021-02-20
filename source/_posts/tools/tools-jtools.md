---
title: JTool -- 自定义个人导航
subtitle: 基于Github管理数据，开发的一款导航工具站
cover: http://imgblog.mrdear.cn/1589681238.png
author: 
  nick: 屈定
tags:
  - 轮子
categories: 工具
urlname: tools-jtool
date: 2020-05-17 10:06:18
updated: 2020-05-17 10:06:21
---

## 简介
出于优化自己工作效率目的，又做了一个导航 [https://jtool.top/home](https://jtool.top/home)，造轮子的目地主要是想实现自己的以下几个需求：
- 免登录注册
- 可自定义内容
- 具备简易RSS订阅
- 数据能够使用GIT管理
这几个也是当前导航的特点。网站原理很简单，当用户输入github对应仓库地址时，程序会主动拉取对应仓库文件，然后生成针对当前仓库的配置，提供导航数据。

![](http://imgblog.mrdear.cn/1589679448.png?imageMogr2/thumbnail/!100p)


## 使用指南

网站数据是基于Github仓库配置文件驱动，因此网站提供了一个示例导航用户`qudingDashBoard ，dashboard-example`，其对应的Github仓库[https://github.com/qudingDashBoard/dashboard-example](https://github.com/qudingDashBoard/dashboard-example)，用户可以fork该仓库后自己修改对应配置。
![](http://imgblog.mrdear.cn/1589679646.png?imageMogr2/thumbnail/!100p)

## 配置文件

### user.toml
用户全局配置。

- title：导航标题
- avatar：用户头像

**举个栗子**
```toml
title='示例用户'
avatar='http://imgblog.mrdear.cn/avatar.jpg'
```

### bookmark.toml
导航网址配置，以数组形式，每一个数组内的为一个组

- [xxx] ：数组名
    - name：当前数组对应的名称
    - sort：当前数组位于整体的排序，越小越靠前
        - [[xxx.sites]]：单个网站配置
            - url：网站地址
            - name：网站名称
            - favicon (可选)：网站icon
            - desc (可选)：网站描述
            - openType (可选)：网站打开方式，支持url(默认)，iframe
            - config.iframe-style (可选)：如果是iframe时，对应CSS样式，例如`height:100%;width:100%;min-height:1000px`

**举个栗子**

```toml
[readnote]
name='读书笔记'
sort=0
    [[readnote.sites]]
    url='https://mubu.com/doc/2TG2Oiz1mU'
    name='秒杀系统读书笔记'
    favicon='https://mubu.com/favicon.ico'
    desc='极客时间秒杀笔记'
    openType='iframe'
    config.iframe-style='height:100%;width:100%;min-height:1000px'
[blog]
name='订阅'
sort=2
    [[blog.sites]]
    url='http://tech.lede.com'
    name='网易乐得技术团队'
    [[blog.sites]]
    url='https://tech.meituan.com'
    name='美团技术团队'
```

### rss.toml
阅读器内容数据，目前以RSS订阅为主，该订阅起到一个通知作用，并不能完全当作阅读器。

- [xxx] ：数组名
    - name：当前数组对应的名称
    - sort：当前数组位于整体的排序，越小越靠前
        - [[xxx.sites]]：单个网站配置
            - url：网站RSS地址
            - name：网站名称
            - favicon (可选)：网站icon

**举个栗子**

```toml
[blog]
name='博客'
sort=1
    [[blog.sites]]
    url='https://blog.alswl.com/atom.xml'
    name='3D的博客'
    [[blog.sites]]
    url='https://draveness.me/feed.xml'
    name='面向信仰编程'
[itNews]
name='IT资讯'
sort=2
    [[itNews.sites]]
    url='https://sspai.com/feed'
    favicon='https://cdn.sspai.com/sspai/assets/img/favicon/icon.ico'
    name='少数派'
    [[itNews.sites]]
    url='https://www.expreview.com/rss.php'
    name='超能网'
```

## 其他

### 导航站点以及订阅怎么保证隐私
fork仓库后，可以设置为private类型，然后添加 `qudingDashBoard` 用户为collaborator，目前需要我手动同意，同意后，有访问权限即可拉取到数据。
![](http://imgblog.mrdear.cn/1589680545.png?imageMogr2/thumbnail/!100p)

## 支持一下

用爱发电。。。如果对你有帮助还请赞助下

![](http://imgblog.mrdear.cn/1589680961.png)

## 网站欣赏
感谢V站大佬 `Awe`  帮忙设计。

![](http://imgblog.mrdear.cn/1589681023.png?imageMogr2/thumbnail/!100p)

![](http://imgblog.mrdear.cn/1589681040.png?imageMogr2/thumbnail/!100p)

