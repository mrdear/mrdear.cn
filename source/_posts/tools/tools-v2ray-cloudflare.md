---
title: V2ray -- 使用Cloudflare CDN加速访问
subtitle: 使用Cloudflare CDN加速v2ray访问
cover: http://res.mrdear.cn/mrdearblog-v2ray.png
author: 
  nick: 屈定
tags:
categories: 工具
urlname: tools-v2ray-cloudflare
date: 2020-03-07 19:50:55
updated: 2020-03-21 08:06:47
---

由于一些原因，需要利用cloudflare作为请求流量中转，进而访问到对应的VPS机器，本文记录下整个操作流程。

## 原理
本质原理是将v2ray伪装成web服务，然后利用CDN进行流量转发，从而隐藏真实VPS地址，请求路径如下图所示。
![](http://res.mrdear.cn/1583580459.png)

## 准备工作
1. 自有域名，可配置解析
2. cloudflare帐号
3. vps (如果国内无法访问，mac下可以利用**FinalShell**使用海外加速连接ssh)

## 配置

### 配置域名
登录cloudflare后，按照提示添加对应域名信息，之后添加你的域名，假设值`abc.com`，IP记录指向对应的VPS IP，注意一点，解析选择`DNS ONLY`。
![](http://res.mrdear.cn/1583581398.png)

### 配置VPS
vps端配置主要有v2ray服务端以及caddy转发请求，得益于社区的强大能力，这些一键脚本即可完成。
```sh
bash <(curl -s -L https://git.io/v2ray.sh)
```
有几个选项注意下
1. 传输协议 WebSocket + TLS，即4
2. 端口，随意
3. 域名
4. 全部默认

### 安装BBR Plus
我的机器是centos7，安装比较曲折，首先按照下面脚本升级内核，升级之后，使用另一个脚本进行配置优化。
```sh
# 升级内核安装
wget "https://github.com/cx9208/bbrplus/raw/master/ok_bbrplus_centos.sh" && chmod +x ok_bbrplus_centos.sh && ./ok_bbrplus_centos.sh

# 使用该脚本切换到bbr_plus以及配置优化
wget -N --no-check-certificate "https://raw.githubusercontent.com/chiakge/Linux-NetSpeed/master/tcp.sh" && ./tcp.sh

# 查看状态
lsmod | grep bbr

# 查看当前已经使用的TCP拥塞控制配置
cat /proc/sys/net/ipv4/tcp_congestion_control

# 查看当前配置
cat /etc/sysctl.conf

```

如果没开启,则使用下面命令
```
sudo modprobe tcp_bbrplus
```

### 配置转发
登录cloudflare，将之前配置DNS ONLY的域名改成**proxy**，即点下对应的灰云。
![](http://res.mrdear.cn/1583581531.png)

然后在`SSL/TLS`选项卡中，将`SSL/TLS encryption mode`改成full，就完成了配置

### 客户端配置
客户端就不多说了，主要有几点，客户端访问的是你CDN配置，也就是你的域名，端口443，协议ws，开始TLS，就可以愉快的使用了。