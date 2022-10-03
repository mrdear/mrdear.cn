---
title: 造轮子-- Hosts-Switch-Alfred插件
subtitle: 利用Alfred的workflow制作的一款切换hosts的工具
cover: http://res.mrdear.cn/zaolunzi2.png
author: 
  nick: 屈定
tags:
  - 轮子
  - Alfred
categories: 工具
urlname: tools-hosts
date: 2019-04-07 21:44:01
updated: 2019-04-07 21:44:06
---

最近遇到了多环境的问题，同一个域名在线下，预发，线上分别访问的是不同的地址，因此有了hosts便捷更换的需求。对于这种工具我不是很想运行一个独立后台的软件，因此一开始就把`IHost`，`SwitchHosts`类似的独立软件给排除掉了，调研到最后发现还是利用Alfred最能满足我的需求。

## 需求
1. hosts文件外置：因为有多台OSX设备，外置的目地是为了多终端备份，一般我会放在ICloud中，多终端很自然的备份过来。
2. 快捷打开文件：选中某一个文件后可以很方便的打开，然后进行编辑。
3. 快捷切换Hosts：选中一个文件后，enter直接切换对应的Hosts文件。

## 实现
实现过程很简单，使用Alfred过程中发现一行代码也不需要写，直接自带功能就足以满足上述需求，整个workflow如下所示：
![](http://res.mrdear.cn/1554645326.png)

### 输入
该workflow的输入是准备好的不同环境的hosts文件，每一个环境对应一个文件，方便自己区分，也方便CURD操作。
![](http://res.mrdear.cn/1554645307.png)

### 替换
替换过程中要解决的问题是如何自动输入sudo的密码，这里使用`sudo -S`指令，该执行会让sudo从标准输入stdin中读取密码，因此在前面加上`echo`把密码输入到对应的标准输入中。
```sh
echo '123456' | sudo -S cmd
```
### 打开文件
Alfred的`File Open`节点不支持参数路径，因此没办法使用，这里直接使用一个bash脚本，该脚本很简单，该脚本调用对应的软件打开该文件即可，其中`query`为对应的文件路径。
```sh
query=$1
open $query
# 或者调用vscode打开文件
# /usr/local/bin/code $query  
```

## 下载
虽然没有什么代码量。。。但是感觉还是挺棒的工具，所以还是放到了Github上。

下载：[Host-Switch-Alfred](https://github.com/work-helper/Host-Switch-Alfred)

## 使用
1. 在`List Filter`节点中，添加自己的hosts文件配置。
2. **修改替换脚本中的密码**
3. 输入`hs`指令, 会自动列出相关的文件配置,然后`enter`自动替换.
4. 当列出文件配置后,按住`cmd`, 然后`enter`会调用系统的open指令打开文件,这里可以换成自己常用的编辑器.

## 其他
由于都是利用shell进行操作，因此可扩展性很强，利用hosts翻墙的话，可以直接写一个shell脚本，在shell获取hosts输入，然后写入到`/etc/hosts`中。