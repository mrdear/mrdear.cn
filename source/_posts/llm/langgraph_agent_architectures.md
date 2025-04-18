---
title: Agent architectures
subtitle: LangGraph针对Agent的一些阐述
cover: https://resource.libx.fun/pic/2025/01/20250105032832395.png
author: 
    nick: LangGraph
tags:
    - LLM
    - Agent
    - 转载
categories: LLM
urlname: llm_agent_architectures
date: 2025-01-05 12:43:53
updated: 2025-01-05 12:43:56
---

# LangGraph - Agent architectures

Many LLM applications <LibPopover title="实现一个特定的控制流程">implement a particular control flow</LibPopover> of steps before and / or after LLM calls. As an example, RAG performs <LibPopover title="检索与用户问题相关的文档">retrieval of documents relevant to a user question</LibPopover>, and passes those documents to an LLM in order to <LibPopover title="在提供的文档上下文中使模型的响应有依据">ground the model's response in the provided document context</LibPopover>.

Instead of <LibPopover title="硬编码固定的控制流程">hard-coding a fixed control flow</LibPopover>, we sometimes want LLM systems that can <LibPopover title="选择它们自己的控制流程">pick their own control flow</LibPopover> to solve more complex problems! This is one definition of an agent: an agent is a system that uses an LLM to <LibPopover title="决定一个应用程序的控制流程">decide the control flow of an application</LibPopover>. There are many ways that an LLM can <LibPopover title="控制应用程序">control application</LibPopover>:

- An LLM can <LibPopover title="在两个潜在路径之间路由">route between two potential paths</LibPopover>
- An LLM can decide which of many <LibPopover title="工具调用">tools to call</LibPopover>
- An LLM can decide whether the <LibPopover title="生成的答案">generated answer</LibPopover> is <LibPopover title="足够了">sufficient</LibPopover> or more work is needed
As a result, there are many different types of <LibPopover title="代理架构">agent architectures</LibPopover>, which give an LLM <LibPopover title="不同程度的控制">varying levels of control</LibPopover>.

![](https://resource.libx.fun/pic/2025/01/20250105024724178.png)


## Router
A router allows an LLM to <LibPopover title="从一组指定的选项中选择一个步骤">select a single step from a specified set of options</LibPopover>. This is an agent architecture that exhibits a <LibPopover title="相对有限的控制水平">relatively limited level of control</LibPopover> because the LLM usually focuses on making a single decision and produces a specific output from <LibPopover title="有限的预定义选项集">limited set of pre-defined options</LibPopover>. Routers typically employ a few different concepts to achieve this.

### Structured Output
<LibPopover title="具有LLM的结构化输出">Structured outputs with LLMs</LibPopover> work by <LibPopover title="提供一个特定的格式或模式">providing a specific format or schema</LibPopover> that the LLM should follow in its response. This is similar to tool calling, but more general. While tool calling typically involves selecting and using predefined functions, structured outputs can be used for any type of formatted response. Common methods to achieve structured outputs include:

1. <LibPopover title="提示工程">Prompt engineering</LibPopover>: Instructing the LLM to respond in a specific format via the system prompt.
2. <LibPopover title="输出解析器">Output parsers</LibPopover>: Using <LibPopover title="后处理">post-processing</LibPopover> to extract structured data from LLM responses.
3. <LibPopover title="工具调用">Tool calling</LibPopover>: Leveraging built-in tool calling capabilities of some LLMs to generate structured outputs.
Structured outputs are crucial for routing as they ensure the LLM's decision can be <LibPopover title="被系统可靠地解释并执行">reliably interpreted and acted upon by the system</LibPopover>. Learn more about structured outputs in this how-to guide.

## Tool calling agent
While a router allows an LLM to make a single decision, more complex agent architectures <LibPopover title="扩展了LLM的控制">expand the LLM's control</LibPopover> in two key ways:

1. <LibPopover title="多步骤决策">Multi-step decision making</LibPopover>: The LLM can make a series of decisions, one after another, instead of just one.
2. <LibPopover title="工具访问">Tool access</LibPopover>: The LLM can choose from and use a variety of tools to accomplish tasks.
ReAct is a popular <LibPopover title="通用代理架构">general purpose agent architecture</LibPopover> that combines these expansions, integrating three core concepts.

1. <LibPopover title="工具调用">Tool calling</LibPopover>: Allowing the LLM to select and use various tools as needed.
2. <LibPopover title="记忆">Memory</LibPopover>: Enabling the agent to retain and use information from previous steps.
3. <LibPopover title="规划">Planning</LibPopover>: Empowering the LLM to create and follow <LibPopover title="多步骤计划">multi-step plans</LibPopover> to achieve goals.
This architecture allows for more complex and flexible agent behaviors, going beyond simple routing to enable <LibPopover title="具有多个步骤的动态问题解决">dynamic problem-solving with multiple steps</LibPopover>. You can use it with create_react_agent.

### Tool calling
Tools are useful whenever you want an agent to <LibPopover title="与外部系统交互">interact with external systems</LibPopover>. External systems (e.g., APIs) often require a particular <LibPopover title="输入模式或有效负载">input schema or payload</LibPopover>, rather than natural language. When we <LibPopover title="绑定一个API">bind an API</LibPopover>, for example, as a tool, we give the model <LibPopover title="对所需输入模式的感知">awareness of the required input schema</LibPopover>. The model will choose to call a tool based upon the natural language input from the user and it will return an output that <LibPopover title="遵守工具所需的模式">adheres to the tool's required schema</LibPopover>.

Many LLM providers support tool calling and tool calling interface in LangChain is simple: you can simply pass any Python `function` into `ChatModel.bind_tools(function)`.
![](https://resource.libx.fun/pic/2025/01/20250105025032726.png)

### Memory
<LibPopover title="记忆对于智能体至关重要">Memory is crucial for agents</LibPopover>, enabling them to retain and utilize information across multiple steps of problem-solving. It operates on different scales:

1. <LibPopover title="短期记忆">Short-term memory</LibPopover>: Allows the agent to access information acquired during earlier steps in a sequence.
2. <LibPopover title="长期记忆">Long-term memory</LibPopover>: Enables the agent to recall information from previous interactions, such as past messages in a conversation.
LangGraph provides <LibPopover title="对内存实现的完全控制">full control over memory implementation</LibPopover>:

- <LibPopover title="状态">State</LibPopover>: User-defined schema specifying the exact structure of memory to retain.
- <LibPopover title="检查点">Checkpointers</LibPopover>: Mechanism to store state at every step across different interactions.
This flexible approach allows you to <LibPopover title="根据你特定的代理架构需求定制内存系统">tailor the memory system to your specific agent architecture needs</LibPopover>. For a practical guide on adding memory to your graph, see this tutorial.

<LibPopover title="有效的内存管理">Effective memory management</LibPopover> enhances an agent's ability to maintain context, learn from past experiences, and make more informed decisions over time.

### Planning
In the ReAct architecture, an LLM is called repeatedly in a while-loop. At each step the agent decides which tools to call, and what the inputs to those tools should be. Those tools are then executed, and the outputs are fed back into the LLM as observations. The while-loop terminates when the agent decides it has enough information to <LibPopover title="解决用户请求">solve the user request</LibPopover> and it is not worth calling any more tools.

### ReAct implementation
There are several differences between [this](https://arxiv.org/abs/2210.03629) paper and the pre-built [`create_react_agent`](https://langchain-ai.github.io/langgraph/reference/prebuilt/#langgraph.prebuilt.chat_agent_executor.create_react_agent) <LibPopover title="实现">implementation</LibPopover>:

- First, we use [tool-calling](https://langchain-ai.github.io/langgraph/concepts/agentic_concepts/#tool-calling) to have LLMs <LibPopover title="调用工具">call tools</LibPopover>, whereas the paper used <LibPopover title="提示和解析原始输出">prompting + parsing of raw output</LibPopover>. This is because tool calling did not exist when the paper was written, but is generally better and more <LibPopover title="可靠">reliable</LibPopover>.
- Second, we use <LibPopover title="消息">messages</LibPopover> to <LibPopover title="提示LLM">prompt the LLM</LibPopover>, whereas the paper used string formatting. This is because at the time of writing, LLMs didn't even expose a message-based interface, whereas now that's the only interface they expose.
- Third, the paper required all <LibPopover title="工具的输入">inputs to the tools</LibPopover> to be a single string. This was largely due to LLMs not being super capable at the time, and only really being able to <LibPopover title="生成单个输入">generate a single input</LibPopover>. Our <LibPopover title="实现">implementation</LibPopover> allows for using tools that require multiple inputs.
- Fourth, the paper only looks at <LibPopover title="一次调用一个工具">calling a single tool at the time</LibPopover>, largely due to limitations in LLMs performance at the time. Our <LibPopover title="实现">implementation</LibPopover> allows for <LibPopover title="一次调用多个工具">calling multiple tools at a time</LibPopover>.
- Finally, the paper asked the LLM to explicitly generate a "Thought" step before <LibPopover title="决定调用哪些工具">deciding which tools to call</LibPopover>. This is the "Reasoning" part of "ReAct". Our <LibPopover title="实现">implementation</LibPopover> does not do this by default, largely because LLMs have gotten much better and that is not as necessary. Of course, if you wish to <LibPopover title="提示这样做">prompt it do so</LibPopover>, you certainly can.

## Custom agent architectures

While routers and tool-calling agents (like ReAct) are common, <LibPopover title="定制智能体架构">customizing agent architectures</LibPopover> often <LibPopover title="导致更好的表现">leads to better performance</LibPopover> for specific tasks. LangGraph offers several powerful features for <LibPopover title="构建定制的智能体系统">building tailored agent systems</LibPopover>:

### Human-in-the-loop

Human involvement can significantly <LibPopover title="提高智能体的可靠性">enhance agent reliability</LibPopover>, especially for <LibPopover title="敏感的任务">sensitive tasks</LibPopover>. This can involve:

- <LibPopover title="批准特定的动作">Approving specific actions</LibPopover>
- <LibPopover title="提供反馈以更新智能体的状态">Providing feedback to update the agent's state</LibPopover>
- <LibPopover title="在复杂决策过程中提供指导">Offering guidance in complex decision-making processes</LibPopover>

Human-in-the-loop patterns are crucial when <LibPopover title="完全自动化">full automation</LibPopover> isn't <LibPopover title="可行的">feasible</LibPopover> or <LibPopover title="理想的">desirable</LibPopover>. Learn more in our <LibPopover title="人机回路指南">human-in-the-loop guide</LibPopover>.

### Parallelization

Parallel processing is <LibPopover title="至关重要的">vital</LibPopover> for <LibPopover title="高效的多智能体系统">efficient multi-agent systems</LibPopover> and <LibPopover title="复杂的任务">complex tasks</LibPopover>. LangGraph supports parallelization through its Send API, enabling:

- <LibPopover title="多个状态的并行处理">Concurrent processing of multiple states</LibPopover>
- <LibPopover title="实现类似map-reduce的操作">Implementation of map-reduce-like operations</LibPopover>
- <LibPopover title="高效处理独立的子任务">Efficient handling of independent subtasks</LibPopover>

For practical implementation, see our <LibPopover title="map-reduce教程">map-reduce tutorial</LibPopover>.

### Subgraphs

Subgraphs are essential for <LibPopover title="管理复杂的智能体架构">managing complex agent architectures</LibPopover>, particularly in <LibPopover title="多智能体系统">multi-agent systems</LibPopover>. They allow:

- <LibPopover title="单个智能体的独立状态管理">Isolated state management for individual agents</LibPopover>
- <LibPopover title="智能体团队的层级组织">Hierarchical organization of agent teams</LibPopover>
- <LibPopover title="智能体与主系统之间的受控通信">Controlled communication between agents and the main system</LibPopover>

Subgraphs communicate with the parent graph through overlapping keys in the state schema. This enables flexible, <LibPopover title="模块化的智能体设计">modular agent design</LibPopover>. For implementation details, refer to our <LibPopover title="子图指南">subgraph how-to guide</LibPopover>.

### Reflection

Reflection mechanisms can significantly <LibPopover title="提高智能体的可靠性">improve agent reliability</LibPopover> by:

1. <LibPopover title="评估任务的完成情况和正确性">Evaluating task completion and correctness</LibPopover>
2. <LibPopover title="提供反馈以进行迭代改进">Providing feedback for iterative improvement</LibPopover>
3. <LibPopover title="启用自我纠正和学习">Enabling self-correction and learning</LibPopover>

While often LLM-based, reflection can also use <LibPopover title="确定的方法">deterministic methods</LibPopover>. For instance, in coding tasks, compilation errors can serve as feedback. This approach is demonstrated in <LibPopover title="此视频使用LangGraph进行自我纠正代码生成">this video using LangGraph for self-corrective code generation</LibPopover>.

By leveraging these features, LangGraph enables the creation of <LibPopover title="复杂的，针对特定任务的智能体架构">sophisticated, task-specific agent architectures</LibPopover> that can handle <LibPopover title="复杂的工作流程">complex workflows</LibPopover>, <LibPopover title="有效协作">collaborate effectively</LibPopover>, and <LibPopover title="持续提高其性能">continuously improve their performance</LibPopover>.
