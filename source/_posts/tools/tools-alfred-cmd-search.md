---
title: 造轮子--Command Search Alfred
subtitle: 利用alfred写的常用命令搜索插件
cover: http://imgblog.mrdear.cn/zaolunzi2.png
author: 
  nick: 屈定
tags:
  - 轮子
  - Alfred
categories: 工具
urlname: tools-alfred-cmd-search
date: 2021-02-22 22:35:58
updated: 2021-02-22 22:36:02
---

这个插件自己已经用了将近两年了，现在日常工作中完全离不开该插件了，最近更新版本才发现之前没好好写过文章宣传一波，特此补上。

## 问题场景

先说说解决的场景是什么？

入职新公司后，第一件事情要做的就是熟悉环境，熟悉各种平台，要记住非常多的地址，这个时候大部分人会选择使用收藏夹，但问题是找起来麻烦，而且遇到一个平台分成DEV,TEST,PRE,PROD四个环境时，收藏夹中会出现大量冗余，带来搜索不便，该插件就是解决这个问题场景。


## 介绍

该workflow把命令分为key -> values形式,如下所示,key属于大分类,匹配到key后会显示其下全部value.

目前支持yaml格式(推荐)以及json配置，这里以yaml为例介绍字段含义

```yaml
- key: 用于搜索指令
  remark: 用于指令描述
  tags: 辅助搜索关键词，可以不填写
  values:
    - cmd: 搜索命中后展示的内容
      remark: 命中后内容描述
```

**eg：yaml格式**

```yaml
- key: ss
  remark: 搜索引擎
  tags: sousuo,baidu,duoji
  values:
    - cmd: https://www.baidu.com/s?wd={clip_0}
      remark: 百度地址
    - cmd: https://www.dogedoge.com/results?q={clip_0}
      remark: 多吉搜索
- key: cc
  remark: 通用命令
  values:
    - cmd: git branch -r | sed 's/origin///g' | grep '/' | xargs git push origin --delete
      remark: git批量删除远程分支}
    - cmd: npm install --registry=http://registry.npm.alibaba-inc.com {clip_0}
      remark: npm使用淘宝源安装
```

**eg：json格式**
```json
[
  {
    "key": "搜索引擎",
    "values": [
      {
        "cmd": "https://www.baidu.com/s?wd={clip_0}", 
        "remark": "百度地址"
      }
    ],
    "remark": "搜索引擎"
  },
  {
    "key": "git-common",
    "values": [
      {
        "cmd": "git branch -r | sed 's/origin///g' | grep '/' | xargs git push origin --delete",
        "remark": "git批量删除远程分支"
      }
    ],
    "remark": "git通用命令"
  }
]
```


主要功能:
1. cmd(触发关键词)->搜索key->选择value->复制到粘贴板(可以自动粘贴)
2. cmd(触发关键词)->搜索key->选择value-> 判断是网址 -> 调用浏览器打开
3. cmd(触发关键词)->open->选择打开命令配置->调用你喜欢的编辑器打开命令配置(需要在workflow中配置打开应用,默认是TextEdit)

支持获取粘贴板，使`{clip_0}`来代替，最终渲染时会自动进行粘贴板数据替换。比如我选择了`https://www.baidu.com/s?wd={clip_0}`，此时我粘贴板数据假设为 `张三`，那么最终打开浏览器的地址为`https://www.baidu.com/s?wd=张三`。

## 数据保存
该插件对应命令数据支持外置的(便于云端保存,丢到同步盘中即可),因此自己指定一个路径后,以参数形式传入即可.

![](https://imgblog.mrdear.cn/uPic/PJgMxW_1614003592.png)

## 更多变量支持
变量的支持依赖于alfred，可以在自己的脚本中配置多个变量，在后面使用`Utils`工具替换。

![](http://imgblog.mrdear.cn/1539613678.png?imageMogr2/thumbnail/!100p)

## 演示

![](https://imgblog.mrdear.cn/uPic/yulan_1614005703.gif)

