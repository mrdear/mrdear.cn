---
title: Building effective agents
subtitle: Anthropic年底针对Agent的总结，很值得一看
cover: https://resource.libx.fun/pic/2024/12/build_effective_agents.png
author: 
  nick: Anthropic
tags:
  - LLM
  - Agent
  - 转载
categories: LLM
urlname: llm_building_effective_agents
date: 2024-12-20 12:43:53
updated: 2024-12-20 12:43:56
---

# Building effective agents

## 转载说明

该篇文章对2024年大模型领域的实际落地场景做了一个很好的总结,给出了一些可行的落地思路参考.
原文地址: https://www.anthropic.com/research/building-effective-agents

---

Over the past year, we've worked with dozens of teams <LibPopover title="构建大型语言模型（LLM）代理">building large language model (LLM) agents</LibPopover> across industries. Consistently, the most successful <LibPopover title="实施">implementations</LibPopover> weren't using <LibPopover title="复杂的框架">complex frameworks</LibPopover> or <LibPopover title="专门的库">specialized libraries</LibPopover>. Instead, they were building with simple, <LibPopover title="可组合的模式">composable patterns</LibPopover>.

In this post, we <LibPopover title="分享我们学到的">share what we’ve learned</LibPopover> from <LibPopover title="与客户合作">working with our customers</LibPopover> and <LibPopover title="自己构建代理">building agents ourselves</LibPopover>, and <LibPopover title="给出实用的建议">give practical advice</LibPopover> for developers on <LibPopover title="构建具备生产力的智能体">building effective agents</LibPopover>.

## What are agents?
"Agent" can be <LibPopover title="定义">defined</LibPopover> in several ways. Some customers <LibPopover title="将智能体定义为">define agents as</LibPopover> fully <LibPopover title="自主的">autonomous</LibPopover> systems that <LibPopover title="独立运作">operate independently</LibPopover> over <LibPopover title="较长的时期">extended periods</LibPopover>, using various <LibPopover title="工具">tools</LibPopover> to <LibPopover title="完成复杂的任务">accomplish complex tasks</LibPopover>. Others use the <LibPopover title="术语">term</LibPopover> to <LibPopover title="描述">describe</LibPopover> more <LibPopover title="规范的">prescriptive</LibPopover> <LibPopover title="执行">implementations</LibPopover> that follow <LibPopover title="预先定义的工作流">predefined workflows</LibPopover>. At Anthropic, we <LibPopover title="把所有这些变化归类为">categorize all these variations as</LibPopover> agentic systems, but <LibPopover title="在工作流和智能体之间做出重要的架构区别">draw an important architectural distinction between</LibPopover> workflows and agents:

- Workflows are systems where LLMs and tools are <LibPopover title="通过预定义的代码路径协调">orchestrated through predefined code paths</LibPopover>.

- Agents, on the other hand, are systems where LLMs <LibPopover title="动态地指导他们自己的过程">dynamically direct their own processes</LibPopover> and tool usage, <LibPopover title="保持对其如何完成任务的控制">maintaining control over how they accomplish tasks</LibPopover>.

Below, we will <LibPopover title="详细探索">explore</LibPopover> both types of agentic systems in detail. In Appendix 1 (“Agents in Practice”), we <LibPopover title="描述了客户发现使用这些系统特别有价值的两个领域">describe two domains where customers have found particular value in using these kinds of systems</LibPopover>.

## When (and when not) to use agents
When <LibPopover title="构建">building</LibPopover> applications with LLMs, we <LibPopover title="建议">recommend</LibPopover> finding the <LibPopover title="最简单的">simplest</LibPopover> solution possible, and only <LibPopover title="增加复杂性">increasing complexity</LibPopover> when <LibPopover title="需要">needed</LibPopover>. This might mean not <LibPopover title="构建智能体系统">building agentic systems</LibPopover> at all. Agentic systems often <LibPopover title="牺牲延迟和成本来换取更好的任务表现">trade latency and cost for better task performance</LibPopover>, and you should <LibPopover title="考虑何时这种权衡是有意义的">consider when this tradeoff makes sense</LibPopover>.

When more complexity is <LibPopover title="被证明是正当的">warranted</LibPopover>, workflows offer <LibPopover title="可预测性">predictability</LibPopover> and <LibPopover title="一致性">consistency</LibPopover> for <LibPopover title="定义明确的任务">well-defined tasks</LibPopover>, whereas agents are the better <LibPopover title="选择">option</LibPopover> when <LibPopover title="灵活性">flexibility</LibPopover> and <LibPopover title="模型驱动的决策">model-driven decision-making</LibPopover> are needed at <LibPopover title="规模">scale</LibPopover>. For many applications, however, <LibPopover title="优化带有检索和上下文示例的单次LLM调用">optimizing single LLM calls with retrieval and in-context examples</LibPopover> is usually enough.

## When and how to use frameworks
There are many <LibPopover title="框架">frameworks</LibPopover> that make agentic systems easier to <LibPopover title="实现">implement</LibPopover>, including:

- LangGraph from LangChain;
- Amazon Bedrock's AI Agent framework;
- Rivet, a drag and drop GUI LLM <LibPopover title="工作流程构建器">workflow builder</LibPopover>; and
- Vellum, another GUI tool for building and testing <LibPopover title="复杂的工作流程">complex workflows</LibPopover>.
These frameworks make it easy to get started by <LibPopover title="简化标准的底层任务">simplifying standard low-level tasks</LibPopover> like <LibPopover title="调用LLM">calling LLMs</LibPopover>, <LibPopover title="定义和解析工具">defining and parsing tools</LibPopover>, and <LibPopover title="将调用链接在一起">chaining calls together</LibPopover>. However, they often create extra layers of <LibPopover title="抽象">abstraction</LibPopover> that can <LibPopover title="掩盖底层提示和响应">obscure the underlying prompts and responses</LibPopover>, making them harder to <LibPopover title="调试">debug</LibPopover>. They can also make it <LibPopover title="诱人地">tempting</LibPopover> to add complexity when a simpler <LibPopover title="设置">setup</LibPopover> would <LibPopover title="足够">suffice</LibPopover>.

We suggest that developers start by using LLM APIs directly: many <LibPopover title="模式">patterns</LibPopover> can be implemented in a few lines of code. If you do use a framework, <LibPopover title="确保你理解底层代码">ensure you understand the underlying code</LibPopover>. <LibPopover title="关于底层代码的不正确的假设">Incorrect assumptions about what's under the hood</LibPopover> are a <LibPopover title="常见的客户错误来源">common source of customer error</LibPopover>.

See our cookbook for some sample <LibPopover title="实现">implementations</LibPopover>.

## Building blocks, workflows, and agents
In this section, we’ll <LibPopover title="探索">explore</LibPopover> the <LibPopover title="常见模式">common patterns</LibPopover> for <LibPopover title="代理系统">agentic systems</LibPopover> we’ve seen in <LibPopover title="生产环境">production</LibPopover>. We'll start with our <LibPopover title="基础构建模块">foundational building block</LibPopover>—the <LibPopover title="增强型大型语言模型">augmented LLM</LibPopover>—and <LibPopover title="逐步增加">progressively increase</LibPopover> <LibPopover title="复杂度">complexity</LibPopover>, from <LibPopover title="简单的组合工作流程">simple compositional workflows</LibPopover> to <LibPopover title="自主代理">autonomous agents</LibPopover>.

### Building block: The augmented LLM
The <LibPopover title="基本构建模块">basic building block</LibPopover> of <LibPopover title="代理系统">agentic systems</LibPopover> is an LLM <LibPopover title="增强">enhanced</LibPopover> with <LibPopover title="扩展功能">augmentations</LibPopover> such as <LibPopover title="检索">retrieval</LibPopover>, <LibPopover title="工具">tools</LibPopover>, and <LibPopover title="记忆">memory</LibPopover>. Our current models can <LibPopover title="主动使用">actively use</LibPopover> these <LibPopover title="能力">capabilities</LibPopover>—<LibPopover title="生成它们自己的搜索查询">generating their own search queries</LibPopover>, <LibPopover title="选择合适的工具">selecting appropriate tools</LibPopover>, and <LibPopover title="决定保留哪些信息">determining what information to retain</LibPopover>.
![The augmented LLM](https://resource.libx.fun/pic/2024/12/20241221101726639.png)

We recommend <LibPopover title="专注于">focusing on</LibPopover> two <LibPopover title="关键方面">key aspects</LibPopover> of the <LibPopover title="实施">implementation</LibPopover>: <LibPopover title="根据你的特定用例定制">tailoring these capabilities to your specific use case</LibPopover> and <LibPopover title="确保它们为你的大型语言模型提供简单，文档完善的界面">ensuring they provide an easy, well-documented interface for your LLM</LibPopover>. While there are many ways to <LibPopover title="实现这些增强">implement these augmentations</LibPopover>, one approach is through our recently released <LibPopover title="模型上下文协议">Model Context Protocol</LibPopover>, which allows developers to <LibPopover title="集成到日益增长的第三方工具生态系统中">integrate with a growing ecosystem of third-party tools</LibPopover> with a <LibPopover title="简单的客户端实现">simple client implementation</LibPopover>.

For the remainder of this post, we'll <LibPopover title="假设">assume</LibPopover> each LLM call has access to these <LibPopover title="增强能力">augmented capabilities</LibPopover>.

### Workflow: Prompt chaining
<LibPopover title="提示链接">Prompt chaining</LibPopover> <LibPopover title="将任务分解为一系列步骤">decomposes a task into a sequence of steps</LibPopover>, where each LLM call processes the <LibPopover title="前一个的输出">output of the previous one</LibPopover>. You can add <LibPopover title="程序化检查">programmatic checks</LibPopover> (see “gate” in the diagram below) on any <LibPopover title="中间步骤">intermediate steps</LibPopover> to <LibPopover title="确保过程仍在正轨上">ensure that the process is still on track</LibPopover>.

![The prompt chaining workflow](https://resource.libx.fun/pic/2024/12/20241221101852476.png)

When to use this workflow: This workflow is <LibPopover title="理想">ideal</LibPopover> for situations where the task can be <LibPopover title="容易且清晰地分解">easily and cleanly decomposed</LibPopover> into <LibPopover title="固定的子任务">fixed subtasks</LibPopover>. The main goal is to <LibPopover title="权衡延迟以获得更高的准确性">trade off latency for higher accuracy</LibPopover>, by making each LLM call an <LibPopover title="更容易的任务">easier task</LibPopover>.

**Examples where prompt chaining is useful**:

- <LibPopover title="生成营销文案，然后将其翻译成不同的语言">Generating Marketing copy, then translating it into a different language</LibPopover>.
- <LibPopover title="编写文档大纲，检查大纲是否符合某些标准，然后根据大纲编写文档">Writing an outline of a document, checking that the outline meets certain criteria, then writing the document based on the outline</LibPopover>.

### Workflow: Routing
<LibPopover title="路由">Routing</LibPopover> <LibPopover title="对输入进行分类">classifies an input</LibPopover> and <LibPopover title="将其定向到特定的后续任务">directs it to a specialized followup task</LibPopover>. This workflow allows for <LibPopover title="关注点分离">separation of concerns</LibPopover>, and <LibPopover title="构建更专业的提示">building more specialized prompts</LibPopover>. Without this workflow, <LibPopover title="优化一种输入">optimizing for one kind of input</LibPopover> can <LibPopover title="损害其他输入的性能">hurt performance on other inputs</LibPopover>.

![The routing workflow](https://resource.libx.fun/pic/2024/12/20241221102027407.png)

When to use this workflow: Routing works well for <LibPopover title="复杂任务">complex tasks</LibPopover> where there are <LibPopover title="不同的类别">distinct categories</LibPopover> that are better handled separately, and where <LibPopover title="分类可以准确处理">classification can be handled accurately</LibPopover>, either by an LLM or a more <LibPopover title="传统的分类模型/算法">traditional classification model/algorithm</LibPopover>.

**Examples where routing is useful**:

- <LibPopover title="将不同类型的客户服务查询（一般问题，退款请求，技术支持）定向到不同的下游流程，提示和工具">Directing different types of customer service queries (general questions, refund requests, technical support) into different downstream processes, prompts, and tools</LibPopover>.
- <LibPopover title="将简单/常见的问题路由到像Claude 3.5 Haiku这样的小型模型，将困难/不寻常的问题路由到像Claude 3.5 Sonnet这样更强大的模型，以优化成本和速度">Routing easy/common questions to smaller models like Claude 3.5 Haiku and hard/unusual questions to more capable models like Claude 3.5 Sonnet to optimize cost and speed</LibPopover>.

### Workflow: Parallelization
LLMs can sometimes work simultaneously on a task and have their outputs <LibPopover title="以编程方式聚合">aggregated programmatically</LibPopover>. This workflow, <LibPopover title="并行化">parallelization</LibPopover>, <LibPopover title="表现为">manifests in</LibPopover> two key variations:

- <LibPopover title="分段">Sectioning</LibPopover>: <LibPopover title="将任务分解为并行运行的独立子任务">Breaking a task into independent subtasks run in parallel</LibPopover>.
- <LibPopover title="投票">Voting</LibPopover>: <LibPopover title="多次运行同一任务以获得不同的输出">Running the same task multiple times to get diverse outputs</LibPopover>.

![The parallelization workflow](https://resource.libx.fun/pic/2024/12/20241221102308037.png)

When to use this workflow: <LibPopover title="并行化">Parallelization</LibPopover> is <LibPopover title="有效">effective</LibPopover> when the <LibPopover title="划分的子任务">divided subtasks</LibPopover> can be <LibPopover title="为了速度并行化">parallelized for speed</LibPopover>, or when <LibPopover title="需要多个视角或尝试">multiple perspectives or attempts are needed</LibPopover> for higher <LibPopover title="置信度结果">confidence results</LibPopover>. For <LibPopover title="复杂任务">complex tasks</LibPopover> with multiple considerations, LLMs generally perform better when each consideration is handled by a separate LLM call, allowing <LibPopover title="专注于每个特定方面">focused attention on each specific aspect</LibPopover>.

Examples where parallelization is useful:

- Sectioning:
  - <LibPopover title="实施保护措施，其中一个模型实例处理用户查询，而另一个模型实例筛选它们是否包含不适当的内容或请求。这往往比让同一个大型语言模型调用处理保护措施和核心响应效果更好">Implementing guardrails where one model instance processes user queries while another screens them for inappropriate content or requests. This tends to perform better than having the same LLM call handle both guardrails and the core response</LibPopover>.
  - <LibPopover title="自动化评估以评估大型语言模型的性能，其中每个大型语言模型调用评估模型在给定提示下性能的不同方面">Automating evals for evaluating LLM performance, where each LLM call evaluates a different aspect of the model’s performance on a given prompt</LibPopover>.
- Voting:
  - <LibPopover title="审查一段代码的漏洞，其中几个不同的提示审查并标记代码（如果发现问题）">Reviewing a piece of code for vulnerabilities, where several different prompts review and flag the code if they find a problem</LibPopover>.
  - <LibPopover title="评估给定内容是否不合适，使用多个提示评估不同方面或要求不同的投票阈值，以平衡假阳性和假阴性">Evaluating whether a given piece of content is inappropriate, with multiple prompts evaluating different aspects or requiring different vote thresholds to balance false positives and negatives</LibPopover>.

### Workflow: Orchestrator-workers
In the <LibPopover title="协调器-工作器">orchestrator-workers</LibPopover> workflow, a central LLM <LibPopover title="动态地分解任务">dynamically breaks down tasks</LibPopover>, <LibPopover title="将其委托给工作器大型语言模型">delegates them to worker LLMs</LibPopover>, and <LibPopover title="综合他们的结果">synthesizes their results</LibPopover>.

![The orchestrator-workers workflow](https://resource.libx.fun/pic/2024/12/20241221102452947.png)

When to use this workflow: This workflow is <LibPopover title="非常适合">well-suited</LibPopover> for <LibPopover title="复杂任务">complex tasks</LibPopover> where you can’t predict the <LibPopover title="需要的子任务">subtasks needed</LibPopover> (in coding, for example, the number of files that need to be changed and the nature of the change in each file likely depend on the task). Whereas it’s <LibPopover title="在地形上相似">topographically similar</LibPopover>, the key difference from <LibPopover title="并行化">parallelization</LibPopover> is its flexibility—subtasks aren't pre-defined, but determined by the <LibPopover title="协调器">orchestrator</LibPopover> based on the specific input.

**Example where <LibPopover title="协调器-工作器">orchestrator-workers</LibPopover> is useful**:

- <LibPopover title="编码产品，每次都对多个文件进行复杂更改">Coding products that make complex changes to multiple files each time</LibPopover>.
- <LibPopover title="搜索任务，涉及从多个来源收集和分析信息，以获取可能的相关信息">Search tasks that involve gathering and analyzing information from multiple sources for possible relevant information</LibPopover>.

### Workflow: Evaluator-optimizer
In the <LibPopover title="评估器-优化器">evaluator-optimizer</LibPopover> workflow, one LLM call <LibPopover title="生成响应">generates a response</LibPopover> while another provides <LibPopover title="评估和反馈">evaluation and feedback</LibPopover> in a loop.

![The evaluator-optimizer workflow](https://resource.libx.fun/pic/2024/12/20241221102612665.png)

When to use this workflow: This workflow is <LibPopover title="特别有效">particularly effective</LibPopover> when we have <LibPopover title="明确的评估标准">clear evaluation criteria</LibPopover>, and when <LibPopover title="迭代改进">iterative refinement</LibPopover> provides <LibPopover title="可衡量的价值">measurable value</LibPopover>. The two signs of good fit are, first, that LLM responses can be <LibPopover title="显著提高">demonstrably improved</LibPopover> when a human articulates their feedback; and second, that the LLM can provide such feedback. This is <LibPopover title="类似于">analogous to</LibPopover> the <LibPopover title="迭代写作过程">iterative writing process</LibPopover> a human writer might go through when producing a polished document.

**Examples where <LibPopover title="评估器-优化器">evaluator-optimizer</LibPopover> is useful**:

- <LibPopover title="文学翻译，其中存在翻译大型语言模型最初可能无法捕捉到的细微差别，但评估器大型语言模型可以提供有用的评论">Literary translation where there are nuances that the translator LLM might not capture initially, but where an evaluator LLM can provide useful critiques</LibPopover>.
- <LibPopover title="需要多轮搜索和分析以收集全面信息的复杂搜索任务，其中评估器决定是否有必要进行进一步搜索">Complex search tasks that require multiple rounds of searching and analysis to gather comprehensive information, where the evaluator decides whether further searches are warranted</LibPopover>.

### Agents
<LibPopover title="智能体">Agents</LibPopover> are <LibPopover title="正在生产环境中涌现">emerging in production</LibPopover> as LLMs mature in key capabilities—<LibPopover title="理解复杂输入">understanding complex inputs</LibPopover>, <LibPopover title="参与推理和计划">engaging in reasoning and planning</LibPopover>, <LibPopover title="可靠地使用工具">using tools reliably</LibPopover>, and <LibPopover title="从错误中恢复">recovering from errors</LibPopover>. Agents begin their work with either a command from, or interactive discussion with, the human user. Once the task is clear, agents plan and operate independently, potentially returning to the human for further information or judgement. During execution, it's <LibPopover title="至关重要的">crucial</LibPopover> for the agents to gain “<LibPopover title="真实情况">ground truth</LibPopover>” from the environment at each step (such as tool call results or code execution) to <LibPopover title="评估其进展">assess its progress</LibPopover>. Agents can then pause for human feedback at checkpoints or when encountering blockers. The task often terminates upon completion, but it’s also common to include <LibPopover title="停止条件">stopping conditions</LibPopover> (such as a maximum number of iterations) to maintain control.

Agents can handle <LibPopover title="复杂的任务">sophisticated tasks</LibPopover>, but their implementation is often straightforward. They are typically just LLMs using tools based on <LibPopover title="环境反馈">environmental feedback</LibPopover> in a loop. It is therefore crucial to design toolsets and their documentation clearly and thoughtfully. We expand on best practices for tool development in Appendix 2 ("<LibPopover title="提示工程你的工具">Prompt Engineering your Tools</LibPopover>").

![Autonomous agent](https://resource.libx.fun/pic/2024/12/20241221102757741.png)

When to use agents: Agents can be used for <LibPopover title="开放式问题">open-ended problems</LibPopover> where it’s difficult or impossible to predict the required number of steps, and where you can’t <LibPopover title="硬编码固定的路径">hardcode a fixed path</LibPopover>. The LLM will potentially operate for many turns, and you must have some level of trust in its decision-making. Agents' <LibPopover title="自主性">autonomy</LibPopover> makes them ideal for <LibPopover title="在受信任的环境中扩展任务">scaling tasks in trusted environments</LibPopover>.

The <LibPopover title="智能体的自主性">autonomous nature of agents</LibPopover> means higher costs, and the potential for <LibPopover title="复合错误">compounding errors</LibPopover>. We recommend <LibPopover title="在沙盒环境中进行广泛的测试">extensive testing in sandboxed environments</LibPopover>, along with the appropriate guardrails.

Examples where agents are useful:

The following examples are from our own implementations:

- A coding Agent to <LibPopover title="解决 SWE-bench 任务">resolve SWE-bench tasks</LibPopover>, which involve edits to many files based on a task description;
- Our “computer use” reference implementation, where Claude uses a computer to accomplish tasks.

![High-level flow of a coding agent](https://resource.libx.fun/pic/2024/12/20241221102845194.png)

### Combining and customizing these patterns
These <LibPopover title="构建模块">building blocks</LibPopover> aren't <LibPopover title="规定性的">prescriptive</LibPopover>. They're <LibPopover title="常见模式">common patterns</LibPopover> that developers can <LibPopover title="塑造和组合">shape and combine</LibPopover> to fit different use cases. The key to success, as with any LLM features, is <LibPopover title="衡量性能">measuring performance</LibPopover> and <LibPopover title="迭代实施">iterating on implementations</LibPopover>. To repeat: you should consider adding complexity only when it <LibPopover title="可以证明可以改善结果">demonstrably improves outcomes</LibPopover>.

## Summary
<LibPopover title="在大型语言模型领域的成功">Success in the LLM space</LibPopover> isn't about building the most sophisticated system. It's about building the right system for your needs. Start with simple prompts, optimize them with <LibPopover title="全面的评估">comprehensive evaluation</LibPopover>, and add <LibPopover title="多步骤代理系统">multi-step agentic systems</LibPopover> only when simpler solutions fall short.

When implementing agents, we try to follow three core principles:

1. <LibPopover title="保持智能体设计的简洁">Maintain simplicity in your agent's design</LibPopover>.
2. <LibPopover title="通过明确展示智能体的规划步骤来优先考虑透明度">Prioritize transparency by explicitly showing the agent’s planning steps</LibPopover>.
3. <LibPopover title="通过全面的工具文档和测试精心设计智能体-计算机界面 (ACI)">Carefully craft your agent-computer interface (ACI) through thorough tool documentation and testing</LibPopover>.
Frameworks can help you get started quickly, but don't hesitate to reduce <LibPopover title="抽象层">abstraction layers</LibPopover> and build with basic components as you move to production. By following these principles, you can create agents that are not only powerful but also reliable, maintainable, and trusted by their users.

### Acknowledgements
Written by Erik Schluntz and Barry Zhang. This work draws upon our experiences building agents at Anthropic and the valuable insights shared by our customers, for which we're deeply grateful.

## Appendix 1: Agents in practice
Our work with customers has revealed two particularly promising applications for AI agents that demonstrate the <LibPopover title="上述模式的实际价值">practical value of the patterns discussed above</LibPopover>. Both applications illustrate how agents add the most value for tasks that require both conversation and action, have clear success criteria, enable feedback loops, and integrate meaningful human oversight.

### A. Customer support
Customer support combines familiar chatbot interfaces with <LibPopover title="通过工具集成增强的功能">enhanced capabilities through tool integration</LibPopover>. This is a <LibPopover title="自然适合">natural fit</LibPopover> for more open-ended agents because:

- Support interactions naturally follow a conversation flow while requiring access to <LibPopover title="外部信息和操作">external information and actions</LibPopover>;
- Tools can be integrated to <LibPopover title="提取客户数据、订单历史和知识库文章">pull customer data, order history, and knowledge base articles</LibPopover>;
- Actions such as <LibPopover title="发出退款或更新工单">issuing refunds or updating tickets</LibPopover> can be handled programmatically; and
- Success can be clearly measured through <LibPopover title="用户定义的解决方案">user-defined resolutions</LibPopover>.
Several companies have demonstrated the <LibPopover title="这种方法的可行性">viability of this approach</LibPopover> through <LibPopover title="基于使用情况的定价模型">usage-based pricing models</LibPopover> that charge only for successful resolutions, showing confidence in their agents' effectiveness.

### B. Coding agents
The software development space has shown remarkable potential for LLM features, with capabilities evolving from code completion to <LibPopover title="自主问题解决">autonomous problem-solving</LibPopover>. Agents are particularly effective because:

- Code solutions are <LibPopover title="可通过自动化测试验证">verifiable through automated tests</LibPopover>;
- Agents can <LibPopover title="使用测试结果作为反馈来迭代解决方案">iterate on solutions using test results as feedback</LibPopover>;
- The problem space is well-defined and structured; and
- <LibPopover title="输出质量可以客观衡量">Output quality can be measured objectively</LibPopover>.
In our own implementation, agents can now solve real GitHub issues in the SWE-bench Verified benchmark based on the pull request description alone. However, whereas automated testing helps verify functionality, human review remains crucial for ensuring solutions align with broader system requirements.

## Appendix 2: Prompt engineering your tools
No matter which agentic system you're building, tools will likely be an important part of your agent. Tools enable Claude to interact with <LibPopover title="外部服务和API">external services and APIs</LibPopover> by specifying their exact structure and definition in our API. When Claude responds, it will include a tool use block in the API response if it plans to invoke a tool. Tool definitions and specifications should be given just as much prompt engineering attention as your overall prompts. In this brief appendix, we describe how to prompt engineer your tools.

There are often several ways to specify the same action. For instance, you can specify a file edit by writing a diff, or by rewriting the entire file. For structured output, you can return code inside markdown or inside JSON. In software engineering, differences like these are cosmetic and can be converted losslessly from one to the other. However, some formats are much more difficult for an LLM to write than others. Writing a diff requires knowing how many lines are changing in the chunk header before the new code is written. Writing code inside JSON (compared to markdown) requires extra escaping of newlines and quotes.

Our suggestions for deciding on tool formats are the following:

- <LibPopover title="给模型足够的令牌来“思考”，然后再自我陷入困境">Give the model enough tokens to "think" before it writes itself into a corner</LibPopover>.
- <LibPopover title="使格式接近模型在互联网文本中自然看到的格式">Keep the format close to what the model has seen naturally occurring in text on the internet</LibPopover>.
- <LibPopover title="确保没有格式“开销”，例如必须准确计算数千行代码或转义它编写的任何代码">Make sure there's no formatting "overhead" such as having to keep an accurate count of thousands of lines of code, or string-escaping any code it writes</LibPopover>.
One rule of thumb is to think about how much effort goes into human-computer interfaces (HCI), and plan to invest just as much effort in creating good agent-computer interfaces (ACI). Here are some thoughts on how to do so:

- <LibPopover title="把自己放在模型的角度考虑">Put yourself in the model's shoes</LibPopover>. Is it obvious how to use this tool, based on the description and parameters, or would you need to think carefully about it? If so, then it’s probably also true for the model. A good tool definition often includes example usage, edge cases, input format requirements, and clear boundaries from other tools.
- <LibPopover title="如何更改参数名称或描述以使事情更明显？">How can you change parameter names or descriptions to make things more obvious?</LibPopover> Think of this as writing a great docstring for a junior developer on your team. This is especially important when using many similar tools.
- <LibPopover title="测试模型如何使用您的工具：在我们的工作台中运行许多示例输入，以查看模型犯了哪些错误，并进行迭代">Test how the model uses your tools: Run many example inputs in our workbench to see what mistakes the model makes, and iterate</LibPopover>.
- <LibPopover title="防止错误发生">Poka-yoke your tools</LibPopover>. Change the arguments so that it is harder to make mistakes.

While building our agent for SWE-bench, we actually spent more time optimizing our tools than the overall prompt. For example, we found that the model would make mistakes with tools using relative filepaths after the agent had moved out of the root directory. To fix this, we changed the tool to always require absolute filepaths—and we found that the model used this method flawlessly.

