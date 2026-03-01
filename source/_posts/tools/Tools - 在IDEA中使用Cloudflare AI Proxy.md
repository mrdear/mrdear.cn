---
title: Tools - ClaudeCode和Jetbrains使用Cloudflare AI Proxy
subtitle: 通过Cloudflare Worker代理Gemini等多模型到AI Assistant
cover: https://res.mrdear.cn/blog_mrdear_work.png
author:
  nick: 屈定
tags:
  - 实战
categories: 工程实践与运维
urlname: work-tools-cloudflare-ai-proxy
date: 2025-11-30 12:00:00
updated: 2025-11-30 12:00:00
---

## 前言

突然发现Cloudflare推出了ai gateway，相比之前worker proxy中自己需要写大量代码的方式，当前只需要做一层代理转发就可以轻松在各种工具中使用，相比其他方案需要本地装个软件，这种云端方案更加让我自己满意（非常讨厌本地运行各种开HTTP Server的服务）

## 项目特性

- 🔄 **OpenAI/Claude API兼容**：`/chat/completions`、`/v1/messages`、`/models`
- 🤖 **JetBrains原生支持**：URL认证（`/jb/<key>`），无需自定义header
- 📊 **请求日志**：内置日志记录
- 多模型配置：Gemini、Grok等，通过AI Gateway灵活扩展

![](https://res.mrdear.cn/pic/2025/11/20251130143423750.png)

## 部署项目

详细的使用见README，仓库写的比较详细，因此这里不再赘述。

项目地址：[https://github.com/mrdear/cloudflare-ai-proxy](https://github.com/mrdear/cloudflare-ai-proxy)

## Jetbrains配置

1. `Settings` → `Tools` → `AI Assistant` -> `Models`
2. 点击`+`添加Provider → `OpenAI Compatible`
3. **Base URL**：`https://your-worker.workers.dev/jb/YOUR_PROXY_API_KEY`
   - 替换`your-worker.workers.dev`和`YOUR_PROXY_API_KEY`
4. 点击`Test Connection`

![IDEA连接成功](https://res.mrdear.cn/pic/2025/11/20251130142643513.png)

## Claude Code配置
1. open `~/.claude/setting.json`
2. 写入如下配置
```json
 "env": {
    "ANTHROPIC_AUTH_TOKEN": "YOUR_PROXY_API_KEY",
    "ANTHROPIC_BASE_URL": "https://your-worker.workers.dev",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "your model like gemini-flash-latest",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "your model like gemini-2.5-pro",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "your model like grok-4.1-fast:free",
    "ANTHROPIC_MODEL": "your model like gemini-flash-latest"
  }
```
3. 重启claude

![Claude Code](https://res.mrdear.cn/pic/2025/11/20251130142912566.png)

## API使用示例

列模型：
```bash
curl -H "Authorization: Bearer YOUR_PROXY_API_KEY" https://your-worker.workers.dev/models
```

聊天（OpenAI风格）：
```bash
curl -H "Authorization: Bearer YOUR_PROXY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gemini-2.5-flash", "messages": [{"role": "user", "content": "Hello!"}]}' \
  https://your-worker.workers.dev/chat/completions
```
