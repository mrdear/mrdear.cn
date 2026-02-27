---
title: Claude Code Skill的加载以及问题思考
subtitle: Learn Skill
cover: https://res.mrdear.cn/pic/2026/02/20260227230357394.png
author: 
  nick: 屈定
tags:
  - LLM
  - Agent
categories: LLM
urlname: claude_code_skill_load
date: 2026-02-27 12:43:53
updated: 2026-02-27 12:43:56
---

## 前言
很多人对 Skill 的理解停留在“能跑脚本”，同时又容易神化这个概念。本文通过代理 Claude Code 的请求，拆解 Skill 的加载机制，并讨论它在工程化落地中的边界和风险。

## 准备工作
为了减少变量，我在 Claude 的配置里只保留了一个 Skill（用于联网查询），目录结构如下所示：
```
.skills
--- web-search
------example.md
------SKILL.md
------scripts
--------fetch.ts
--------search-deep.ts
--------search-fast.ts
```

SKILL.md 文件主要描述了如何使用 bun 执行脚本：

```md
---
name: Web Search Skills
description: 提供了多种搜索工具，用于互联网最新信息获取，包含fetch(url)：获取网页详情,search-fast(text)：快速搜索相关网页,search-deep(text)：深度搜索以及AI内容总结
---

这是一个的网络搜索工具集，包含三个独立的脚本，用于网页内容提取、快速搜索和深度搜索。
**重要提示**：根据查询复杂度和成本考虑选择合适工具，简单问题优先使用低成本方案。

## Utility scripts

### 1. fetch.ts - 网页内容提取工具
- **功能**：爬取网页内容，遵循 Robots 协议，使用 Readability 提取核心内容，并转换为 Markdown 格式
- **特点**：
    - 自动检查目标网站的 `robots.txt` 规则
    - 使用 Readability 算法提取文章主要内容（去除侧边栏、广告等干扰元素）
    - 将 HTML 转换为整洁的 Markdown 格式
- **快速使用**：`bun ./scripts/fetch.ts "https://example.com/article"`

### 2. search-fast.ts - 快速搜索工具（Brave Search API）
- **功能**：使用 Brave Search API 进行快速网络搜索，适用于简单事实查询（如：\"当前美国总统是谁\"）
- **特点**：
    - 返回前 10 个搜索结果，包含标题、URL 和描述
- **快速使用**：`bun ./scripts/search-fast.ts "如何学习 React"`

### 3. search-deep.ts - 深度搜索工具（Tavily API）
- **功能**：使用 Tavily API 进行深度搜索并生成 AI 总结，适用于复杂查询（如：\"人工智能发展趋势2025\"）
- **特点**：
    - 使用 "advanced" 搜索深度获取更全面的结果
    - 自动生成问题或话题的综合答案（AI 总结）
    - 提供参考来源列表，包含内容摘要
- **快速使用**：`bun ./scripts/search-deep.ts "Web3 技术发展趋势"`

## Additional resources

- For usage examples, see [examples.md](examples.md)
```


## 调试记录

### 第一轮交互
**Q：查询下微软现在的股价**

Claude拿到该请求后，会构建向LLM的请求，其中Skills会放在Tool描述中，如下所示：

核心点为：
1. Skills的渐进式加载，第一层元数据是放入到tool的**description**中的。
2. Skills的期望参数只有skill名称和一个通用的args参数

```json
{
  "name": "Skill",
  "description": "Execute a skill within the main conversation\n\nWhen users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.\n\nWhen users ask you to run a \"slash command\" or reference \"/<something>\" (e.g., \"/commit\", \"/review-pr\"), they are referring to a skill. Use this tool to invoke the corresponding skill.\n\nExample:\n  User: \"run /commit\"\n  Assistant: [Calls Skill tool with skill: \"commit\"]\n\nHow to invoke:\n- Use this tool with the skill name and optional arguments\n- Examples:\n  - `skill: \"pdf\"` - invoke the pdf skill\n  - `skill: \"commit\", args: \"-m 'Fix bug'\"` - invoke with arguments\n  - `skill: \"review-pr\", args: \"123\"` - invoke with arguments\n  - `skill: \"ms-office-suite:pdf\"` - invoke using fully qualified name\n\nImportant:\n- When a skill is relevant, you must invoke this tool IMMEDIATELY as your first action\n- NEVER just announce or mention a skill in your text response without actually calling this tool\n- This is a BLOCKING REQUIREMENT: invoke the relevant Skill tool BEFORE generating any other response about the task\n- Skills listed below are available for invocation\n- Do not invoke a skill that is already running\n- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)\n- If you see a <command-name> tag in the current conversation turn (e.g., <command-name>/commit</command-name>), the skill has ALREADY been loaded and its instructions follow in the next message. Do NOT call this tool - just follow the skill instructions directly.\n\nAvailable skills:\n- web-search: 提供了多种搜索工具，用于互联网最新信息获取，包含fetch(url)：获取网页详情,search-fast(text)：快速搜索相关网页,search-deep(text)：深度搜索以及AI内容总结\n",
  "input_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "skill": {
        "description": "The skill name. E.g., \"commit\", \"review-pr\", or \"pdf\"",
        "type": "string"
      },
      "args": {
        "description": "Optional arguments for the skill",
        "type": "string"
      }
    },
    "required": [
      "skill"
    ],
    "additionalProperties": false
  }
}
```

模型接收到请求后，会先思考，思考后，选择使用Skill工具，产生如下回复：

```json
{  
  "skill": "web-search",  
  "args": "微软当前股价 Microsoft stock price today"
}
```

Claude获取到模型的返回后，会调用Load Skill能力去加载对应的skill，产生如下的结果，放入到对话历史中，到此，完成了整个渐进式加载流程。

接下来就是根据Skill的描述，使用Bash工具完成脚本执行。

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "fc-45dfca4e-7f59-46b9-9fb4-981bd275c4cd",
      "content": "Launching skill: web-search"
    },
    {
      "type": "text",
      "text": "Base directory for this skill: /Users/quding/.claude/skills/web-search\n\n这是一个的网络搜索工具集，包含三个独立的脚本，用于网页内容提取、快速搜索和深度搜索。\n**重要提示**：根据查询复杂度和成本考虑选择合适工具，简单问题优先使用低成本方案。\n\n## Utility scripts\n\n### 1. fetch.ts - 网页内容提取工具\n- **功能**：爬取网页内容，遵循 Robots 协议，使用 Readability 提取核心内容，并转换为 Markdown 格式\n- **特点**：\n    - 自动检查目标网站的 `robots.txt` 规则\n    - 使用 Readability 算法提取文章主要内容（去除侧边栏、广告等干扰元素）\n    - 将 HTML 转换为整洁的 Markdown 格式\n- **快速使用**：`bun ./scripts/fetch.ts \"https://example.com/article\"`\n\n### 2. search-fast.ts - 快速搜索工具（Brave Search API）\n- **功能**：使用 Brave Search API 进行快速网络搜索，适用于简单事实查询（如：\\\"当前美国总统是谁\\\"）\n- **特点**：\n    - 返回前 10 个搜索结果，包含标题、URL 和描述\n- **快速使用**：`bun ./scripts/search-fast.ts \"如何学习 React\"`\n\n### 3. search-deep.ts - 深度搜索工具（Tavily API）\n- **功能**：使用 Tavily API 进行深度搜索并生成 AI 总结，适用于复杂查询（如：\\\"人工智能发展趋势2025\\\"）\n- **特点**：\n    - 使用 \"advanced\" 搜索深度获取更全面的结果\n    - 自动生成问题或话题的综合答案（AI 总结）\n    - 提供参考来源列表，包含内容摘要\n- **快速使用**：`bun ./scripts/search-deep.ts \"Web3 技术发展趋势\"`\n\n## Additional resources\n\n- For usage examples, see [examples.md](examples.md)\n\nARGUMENTS: 微软当前股价 Microsoft stock price today",
      "cache_control": {
        "type": "ephemeral"
      }
    }
  ]
}
```

### 第二轮交互
**Q：查询rocket lab的股价**

第二轮模型会直接使用 Bash 工具执行脚本，因为上下文里已经有该 Skill 的详细说明，避免了重复加载。


## Skill有哪些问题
Skill 机制表面上简单，但线上化后风险会集中暴露。按实际影响看，至少有以下问题：

### 1. 密钥管理与最小权限
常见做法是共享 env 或在 skill 目录放 `.env`。这两种方式都存在问题：
- 多个 skill 变量名冲突，容易互相覆盖。
- 模型如果拿到过宽的文件读取权限，可能间接读取到敏感信息。
- 无法做到“每次执行只注入当前 skill 必需密钥”。

更稳妥的做法是把密钥依赖写在 skill manifest 中，执行时在隔离沙箱内按需注入，并且执行结束即销毁。

### 2. Prompt 注入到命令注入的链路风险
Skill 通常最终会落到 Bash/Node/Python 执行。一旦把用户原始输入直接拼接到命令里，就可能出现命令注入或越权访问。

至少需要三层防护：
- 参数结构化：`args` 不能直接拼接命令字符串，必须走 schema 校验。
- 能力白名单：skill 可调用的命令、网络域名、文件路径都要受限。
- 输出净化：防止工具输出里的恶意提示再次污染模型后续推理。

### 3. Skill 边界过大导致“万能脚本化”
如果一个 skill 既能读写文件、又能联网、还能执行任意命令，模型会倾向于把它当成“超级工具”，带来可控性下降和审计困难。

建议把 skill 拆成最小能力单元，按任务组合，而不是堆成一个大而全工具。

### 4. 版本治理与兼容性
Skill 的 `SKILL.md`、脚本实现、依赖版本可能不同步。线上一旦自动更新，历史会话复现会变得困难。

建议：
- skill 必须带版本号（如 `web-search@1.3.0`）。
- 会话中记录“加载时的版本 + 哈希”。
- 线上默认使用锁定版本，灰度后再升级。

### 5. SaaS 化落地的一致性问题
在分布式架构里，请求会落到任意节点，不能假设“本地目录 + 当前进程上下文”一直存在。要把“Skill 加载”和“Skill 执行”拆开设计。

一个可落地的最小架构如下：
- Skill Registry：存储 manifest、版本、依赖、权限声明。
- Artifact Store：存储脚本包或镜像（按版本寻址）。
- Skill Runner：沙箱执行器，负责注入最小权限环境并返回结果。
- Session Store：保存会话状态（已加载 skill、版本、最近工具结果）。
- Trace/Audit：记录每次 skill 调用参数、耗时、退出码、资源消耗。

一次请求链路可以是：
1. 模型返回 `skill=web-search, args=...`。
2. 网关校验该 skill 是否允许当前租户调用。
3. 调度器从 Session Store 读取已加载版本；若未加载则从 Registry 拉取并缓存。
4. Runner 在隔离环境执行，按 manifest 注入最小密钥和权限。
5. 返回结构化结果给模型，并写入 Trace/Audit。
6. 会话恢复时，按“skill 名称 + 版本”重建上下文，避免漂移。

## 小结
Skill 的本质是“把能力描述注入上下文，再把执行下沉到工具层”。它不神秘，但工程化要求很高。真正的门槛不在“会不会写 SKILL.md”，而在密钥隔离、权限边界、版本治理和可观测性。
