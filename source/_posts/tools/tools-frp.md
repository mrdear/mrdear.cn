---
title: 内网穿透工具--FRP
subtitle: 利用DRP搭建内网穿透环境
cover: http://imgblog.mrdear.cn/mrdearblog-frp.png
author: 
  nick: 屈定
tags:
  - 轮子
categories: 工具
urlname: tools-frp
date: 2019-08-22 21:37:11
updated: 2020-06-20 16:20:49
---

最近装了黑群晖，有了内网穿透的需求，大学时做微信开发当时用过ngrok，现在貌似2.0版本不开源了，因此选择了更加易用的FRP(Fast Reverse Proxy)来搭建自己的内网穿透链路。

## 环境
1. 1台有公网IP服务器或者VPS (没有的话可以用别人免费的frps)
2. 一个自己的域名 (没有的话,用免费frps提供的域名)

## FRP原理
由于ipv4地址已经用尽，因此一般家庭宽带很少给提供公网IP，另外家庭宽带暴露在公网IP下也不是很安全，因此使用内网穿透是一种比较通用的解决方案，FRP就是这种解决方案的一种实现。FRP分为server端与client端，server端是部署在有公网ip的服务器上，client端则运行在内网环境，当client启动时会主动与server端建立连接，那么server与client间就有了一个通信隧道，当用于访问公网ip机器时，通过这个隧道转发请求到内网服务器，从而达到穿透的目地，借用[少数派](https://sspai.com/)的一张图。
![](http://imgblog.mrdear.cn/1566482563.png?imageMogr2/thumbnail/!100p)

## 部署frps
frps是运行在公网服务器上的服务，去[https://github.com/fatedier/frp/releases](https://github.com/fatedier/frp/releases)下载对应服务器的版本后修改`frps.ini`文件，可以参考完整版的`frps_full.ini`文件示例。

```ini
[common]
bind_port = 7000
# 简单密码验证
token = 123456
# http服务访问端口
vhost_http_port = 80
vhost_https_port = 443
# kcp 绑定的是 udp 端口，可以和 bind_port 一样
kcp_bind_port = 7000
# 连接池配置
max_pool_count = 100
# 域名配置
subdomain_host = mrdear.cn
```
这里配置`subdomain_host`为你想要使用的自定义域名，之后启动fprs。
```sh
# 启动frps服务
nohup ./frps -c frps.ini &
```
启动成功则有以下提示，则证明frps已经正常工作了。
```txt
2019/08/23 11:10:57 [I] [service.go:146] frps tcp listen on 0.0.0.0:7000
2019/08/23 11:10:57 [I] [service.go:155] frps kcp listen on udp 0.0.0.0:7000
2019/08/23 11:10:57 [I] [service.go:188] http service listen on 0.0.0.0:80
2019/08/23 11:10:57 [I] [service.go:209] https service listen on 0.0.0.0:443
```

### 端口和nginx冲突
上述配置会导致frps绑定本地的80,443端口，而大多数开发者都是用nginx管理网站入口，如果出现端口冲突，需要更改这两个值，然后在nginx上使用反向代理转发请求或者直接访问frp对应的http端口，反向代理具体配置示例如下所示：
eg：
```
# frps使用
vhost_http_port = 8080

# nginx使用反向代理
location / {
            proxy_pass http://127.0.0.1:8080;
}
```


## 部署frpc
frpc是运行在内网上的服务，假设公网是8.7.6.5，那么客户端按照如下配置
```ini
[common]
server_addr = 8.7.6.5
server_port = 7000
token = 123456
# 客户端启动后连接池数量
pool_count = 20
use_gzip = true
protocol = kcp

; 方便本地管理
admin_addr = 127.0.0.1
admin_port = 7400
admin_user = admin
admin_pwd = admin

[nas]
type = http
local_ip = 192.168.2.180
local_port = 5000
subdomain= nas
```

这里设置二级域名`subdomain`为nas，接着把 `nas.mrdear.cn`解析到对应的服务器ip地址`8.7.6.5`，访问`nas.mrdear.cn`的请求则都会被转发到内网的`192.168.2.180:5000`地址上，到此FRP内网穿透配置完毕。

## 参考
1. [使用frp进行内网穿透](https://sspai.com/post/52523)
2. [https://github.com/fatedier/frp](https://github.com/fatedier/frp)
