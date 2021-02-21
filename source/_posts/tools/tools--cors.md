---
title: 工具 -- nginx实现cors-anywhere
subtitle: 自己开放的一个cors域名,可以很方便反向代理
cover: http://imgblog.mrdear.cn/zaolunzi2.png
author: 
  nick: 屈定
tags:
  - cors
categories: 工具
urlname: tools-cors-anywhere
date: 2021-02-21 09:51:50
updated: 2021-02-21 09:51:53
---

最近发现博客评论使用的gittalk授权时，一直报403错误，排查了下，主要原因是gittalk授权过程需要调用github的接口获取对应的信息，但由于跨域存在需要使用一个CORS地址进行转接，默认使用的是`https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token`是[cors-anywhere](https://github.com/Rob--W/cors-anywhere)所提供的示例服务，由于访问量大，cors-anywhere这个地址做出了响应的限制。找到了原因，稳定的解决方案就是自建，恰好自己有域名以及服务器，因此开放出来给其他人使用，希望帮助到你。

## Nginx配置

CORS本质上是请求一个地址能够接受跨域，也就是header需要有`Access-Control-Allow-Origin "*";`，但往往大多数地址为了安全不支持跨域，因此诞生了CORS Proxy，也就是跨域地址 + 反向代理。

针对Nginx的配置如下，大概思路是用户访问`https://cors.mrdear.cn/https://github.com/login/oauth/access_token`地址时，nginx需要解析出真正的地址`https://github.com/login/oauth/access_token`，然后使用`proxy_pass`给代理过去。

```sh
 location ~* "/(.*):/(.*)" {
                #增加响应头
                add_header Access-Control-Allow-Origin "*";
                add_header Access-Control-Allow-Methods "POST,GET,PUT,OPTIONS,DELETE";
                add_header Access-Control-Max-Age "3600";
                add_header Access-Control-Allow-Headers "Origin,X-Requested-With,Content-Type,Accept,Authorization,FOO";
                add_header Content-Type "application/json;charset=utf-8,text/plain";
                add_header Proxy-Addr https://cors.mrdear.cn;
                #如果为预检请求则直接响应204
                if ($request_method = OPTIONS ) {
                  return 204;
                }
                proxy_set_header Host $proxy_host;
                proxy_set_header Referer $proxy_host;
                proxy_set_header Accept "application/json";
                #代理地址
                proxy_pass $1://$2/;
            }
```

## 分享

自己搭建一个其实很简单，不过如果闲麻烦的话，可以使用我自建的服务，域名续费了10多年，服务器也一直有，只要不被封，会一直提供下去。

```sh
https://cors.mrdear.cn/想要访问的地址

eg：
https://cors.mrdear.cn/https://github.com/login/oauth/access_token
```

