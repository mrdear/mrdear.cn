---
title: 读书笔记 -- 《Maven实战》
subtitle: 读《Maven实战》了解的知识，加深了对Maven配置的了解以及jar的查找流程
cover: https://res.mrdear.cn/maven.png
author: 
  nick: 屈定
tags:
  - 读书笔记
categories: 读书笔记
urlname: readnote-maven_in_action
date: 2022-02-01 20:36:35
updated: 2022-02-01 20:36:38
---

前段时间Maven更新到了3.8.1版本，该版本只支持HTTPS协议仓库，公司内部升级后又需要重新将配置修改一番，然而修改过程并不容易，由于不了解Maven的配置与定位jar的关系，只能不断试错重来。想到使用Maven这么多年，每次都是直接copy别人的配置，随便改改以及替换URL，是时候好好去了解下了。

## 基础概念

- maven资源标识：groupId-artifactId-version-packageing-classifier，通常packageing为jar，classifier不指定。
- maven的仓库：
  - 本地仓库：`${user.home}/.m2/repository` 
  - 中央仓库：id默认为central，地址为`http://repo1.maven.org/maven2` 
  - 聚合仓库：第三方开放的Maven仓库，如阿里云，腾讯云等提供的加速库

这里很核心的一点：中央仓库(id=central)是一个特有的概念和定位，他是Maven资源的首要来源，central的配置在超级pom中，因此其等级是优先于聚合仓库低于本地仓库。

## 查找流程

整个查找流程如下图所示：

- 查找本地repository
- 查找id=central仓库，该过程会使用servers做认证，使用mirrors做拉取地址替换
- 根据release以及snapshot的配置，查找其他仓库，该过程同样使用servers以及mirrors做认证以及地址替换

![image-20220201211136346](https://res.mrdear.cn/uPic/image-20220201211136346_1643721096.png)

## 如何配置合理？

从上面流程来看，Maven的配置逻辑本身很简单，但在一些公司中，Maven配置的复杂性主要来源于仓库众多，以蚂蚁为例，官方的仓库就有7个左右，新同学接手时，就很容易出现错误，那么怎么配置呢？

**1. 选定中央仓库代理**

中央仓库自然优先级最高，默认的`http://repo1.maven.org/maven2` 由于网络原因，拉取常常出现中断，因此中央仓库一般使用mirrors方式定向到国内镜像，而**不是复写repository配置**，比如下方我使用的阿里云仓库。

这里需要注意下`<mirrorOf>`，国内很多加速库会推荐设置为*，代表代理所有仓库，这种当然是不负责的推荐配置，阿里云的public库只是central以及jcenter的聚合，并不能代替spring,gradle,jetbrain等仓库。

```xml
   <mirror>
            <id>mirror</id>
            <mirrorOf>central,jcenter</mirrorOf>
            <name>mirror</name>
            <url>https://maven.aliyun.com/nexus/content/groups/public</url>
        </mirror>
```

**2. 使用Profile划分其他仓库**

profile用于圈定一批生效仓库，比如下方我定义了一个rdc profile作为默认生效的配置，其中的repositories分别配置了私有的releases&snapshot库，如果有多个release或者snapshot，那么只需要在该配置中增加即可。如果独立环境的仓库，那么可以新建一个profile圈选，在IDE中做快捷切换。

```xml
        <profile>
            <id>rdc</id>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>
            <repositories>
                <repository>
                    <id>rdc-releases</id>
                    <url>https://packages.aliyun.com/maven/repository/2184158-release-WRgrWp/</url>
                    <releases>
                        <enabled>true</enabled>
                    </releases>
                    <snapshots>
                        <enabled>false</enabled>
                    </snapshots>
                </repository>
                <repository>
                    <id>rdc-snapshots</id>
                    <url>https://packages.aliyun.com/maven/repository/2184158-snapshot-3P70Vz/</url>
                    <releases>
                        <enabled>false</enabled>
                    </releases>
                    <snapshots>
                        <enabled>true</enabled>
                    </snapshots>
                </repository>
            </repositories>
        </profile>
```

