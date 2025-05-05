---
title: IntelliJ - 在IDEA AI中使用gemini api
subtitle: 使用Cloudflare worker针对IDEA中的ollama做转发
cover: http://res.mrdear.cn/blog_mrdear_work.png
author: 
  nick: 屈定
tags:
  - 实战    
categories: 实战总结
urlname: work-intellij-ollama
date: 2025-05-05 11:37:36
updated: 2025-05-05 08:46:00
---

## 前言
作为IDEA多年的付费用户，对于JB在AI领域的集成总是诟病，不过在2025.1这个版本上看到的希望，我的个人体验因为`AI Assistant`和`Junie`两个产品的改进，编程效率提升了非常多。

随之而来的就是quota不够用。不过好在还有其他模型的AK，初步设想是IDEA支持本地的ollama调用，那么使用cloudflare worker做一个ollama的api中转服务。

![这个月前三分之一已经用掉了大量的quota](https://resource.libx.fun/pic/2025/05/20250505215456201.png)

## IDEA中对Ollama的依赖

- /：直接返回 Ollama is running，属于健康检查
- api/tags：返回可用的模型列表
- api/chat：对话聊天

因此只需要针对这三个接口进行处理，好在已经有朋友实现了大部分功能[openai-api-proxy](https://github.com/mrdear/openai-api-proxy)，我fork后，在openai风格的基础上增加了ollama风格的api，具体的可以参考项目仓库。

参考github的readme部署后，在IDEA连接，即可愉快的使用自己的API

![](https://resource.libx.fun/pic/2025/05/20250505220020880.png)