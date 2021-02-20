---
title: 造轮子--文件分享工具
subtitle: 解决日常分享文件给别人的痛点
cover: http://imgblog.mrdear.cn/zaolunzi2.png
author: 
  nick: 屈定
tags:
  - 轮子
categories: 工具
urlname: tools-tempfile-viewer
date: 2018-07-14 07:07:22
updated: 2018-07-28 02:07:36
---

## 背景
一般工作中会有我想把某个文件分享给别人，但是又不想直接发给对方，因此需要一个中转站，我把文件上传到这个中转站，然后中转站给我一个可以查看的url，我再把url发给要查看的人。
或者是想把一个文件分享给别人但是由于操作系统不同或者使用的文件编辑器不同而导致展示上有一些差异。

那么这个项目的目的就是为了解决这种需求。目前工作中我会把临时的接口文档写好，然后生成一个url分享给前端或者客户端，并且我这边是可以随时更新。

## 项目地址
[https://github.com/mrdear/temp-file-viewer](https://github.com/mrdear/temp-file-viewer)

## 功能

1. markdown √
2. json,xml,java,c,cpp,php,python等 √
3. jpg,jpeg,png,gif √  (大图片展示取决于服务器带宽,另外提供TinyPNG压缩选项)
4. doc,docx,xls,xlsx,ppt,pptx √ (尝试了不少方案,poi+itext,最后还是微软的在线预览体验最好,当然也实现最简单)

## 使用
项目已封装成docker，建议直接获取docker使用。
```bash

docker pull push ifreehub/temp-file-viewer:1.3

docker run -d -p 8081:8081 -e APP_OPTS="-Dspring.profiles.active=prod" docker.io/ifreehub/temp-file-viewer:1.3

```

访问 ip:8081 即可.


**配置**

使用环境变量配置参数,可以使用`-Dspring.config.location`复写应用的配置.

```bash
# 应用参数
APP_OPTS="-Dspring.config.location=file:/application.properties -Dspring.profiles.active=prod"  

# 虚拟机参数
JVM_OPTS="-server -Xms256m -Xmx256m"
```

**Spring boot配置说明**
```prop
server.port=8081

# 文件上传相关配置
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.file-size-threshold=1
spring.http.encoding.charset=utf-8
spring.http.encoding.force=true
spring.http.encoding.force-request=true
spring.http.encoding.force-response=true

# root账户配置，该配置作为该项目的管理员账户
root.username=quding
root.password=123456
root.avatar=http://imgblog.mrdear.cn/avatar.png

# jwt签名锁需要的密钥，管理员登录使用的是jwt方式，因此需要配置个秘钥。
jwt.secret=123456

# 上传的文件会存在该配置的本地目录中
temp.file.dist=/quding/data/file
# 对外访问域名，cookie会设置到该域名下,不设置则默认是当前response,对于nginx代理的可能会出问题
temp.hostname=

# 启用图片压缩,依赖第三方tinypng的服务  https://tinypng.com/developers
temp.picture.tinypng.enable=true
temp.picture.tinypng.apikey=JKwWUnDJK2TsriXiBXzoKzziSnKHk3lh

```

## 技术
主要是用以下两种技术，该项目作为Spring boot的入门项目非常合适。
1. Spring Boot
2. Angular6

## 示意图

**upload**

![](http://imgblog.mrdear.cn/1529721579.png?imageMogr2/thumbnail/!100p)

**display**
![](http://imgblog.mrdear.cn/1529721623.png?imageMogr2/thumbnail/!100p)



