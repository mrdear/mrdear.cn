---
title: Pi-Mono AI相关模块设计学习
subtitle: Learn Agent Framework
cover: https://res.mrdear.cn/pic/2026/02/20260225192952293.png
author: 
  nick: 屈定
tags:
  - LLM
  - Agent
categories: LLM
urlname: pi_mono_ai_framework
date: 2026-02-24 12:43:53
updated: 2026-02-24 12:43:56
---

Pi-mono的AI相关模块代码量非常少，但其支撑了复杂的OpenClaw，因此值得学习下其中的设计精髓。
该篇主要涉及`pi-ai`,`pi-ageng-core`两个模块。

# pi-ai

该模块逻辑很简单，就是将拿到的消息和参数，传递给不同的大模型厂商，然后将厂商的返回给映射到平台的自身对象。因此最主要的是扩展性设计。

## 设计精髓

### 两层抽象

一是定义的API风格，比如openai completion，anthropic-message，不同的厂商往往有着不同的风格，即使是openai后期也新增了openai-responses风格。

```ts
export type KnownApi =  
    | "openai-completions"  
    | "openai-responses"  
    | "azure-openai-responses"  
    | "openai-codex-responses"  
    | "anthropic-messages"  
    | "bedrock-converse-stream"  
    | "google-generative-ai"  
    | "google-gemini-cli"  
    | "google-vertex";  
  
export type Api = KnownApi | (string & {});
```

二是定义API提供商，不同的提供商需要不同的对接API Key，或者额外多余的参数信息。

```ts
export type KnownProvider =  
    | "amazon-bedrock"  
    | "anthropic"  
    | "google"  
    | "google-gemini-cli"  
    | "google-antigravity"  
    | "google-vertex"  
    | "openai"  
    | "azure-openai-responses"  
    | "openai-codex"  
    | "github-copilot"  
    | "xai"  
    | "groq"  
    | "cerebras"  
    | "openrouter"  
    | "vercel-ai-gateway"  
    | "zai"  
    | "mistral"  
    | "minimax"  
    | "minimax-cn"  
    | "huggingface"  
    | "opencode"  
    | "kimi-coding";  
export type Provider = KnownProvider | (string & {});
```

模块拿到调用信息后，首先确定是当前哪种API风格，然后转交给对应的API处理，处理过程中可以根据Provider再解决一些特有的处理方式。一句话总结：先按 api 做主路由（协议级适配），再按 provider 做细分兼容（鉴权、header、参数和行为补丁）。

### 流式优先

模型对接的API都是流式，所谓的非流式只是在最终拿到结果后，内存中拼接完全部，使用`stream.result()`阻塞等待获取到最终结果。

这个设计的好处是避免写两套接口，而且没必要，现在的LLM都是流式主流架构，使用端自己选择是否需要等待流。


其次是模型调用返回的是一系列事件流，使用方可以根据事件自行做处理，同时将增量内容给额外拆分到单独的delta字段中，该类型只是字符串，partial仍然是保留全量，两部分都可以消费的到。

该设计的目的主要是LLM比较慢，多种事件埋点，让对接的客户端可以根据所需获取到对应需要展示的事件。

```ts
export type AssistantMessageEvent =  
    | { type: "start"; partial: AssistantMessage }  
    | { type: "text_start"; contentIndex: number; partial: AssistantMessage }  
    | { type: "text_delta"; contentIndex: number; delta: string; partial: AssistantMessage }  
    | { type: "text_end"; contentIndex: number; content: string; partial: AssistantMessage }  
    | { type: "thinking_start"; contentIndex: number; partial: AssistantMessage }  
    | { type: "thinking_delta"; contentIndex: number; delta: string; partial: AssistantMessage }  
    | { type: "thinking_end"; contentIndex: number; content: string; partial: AssistantMessage }  
    | { type: "toolcall_start"; contentIndex: number; partial: AssistantMessage }  
    | { type: "toolcall_delta"; contentIndex: number; delta: string; partial: AssistantMessage }  
    | { type: "toolcall_end"; contentIndex: number; toolCall: ToolCall; partial: AssistantMessage }  
    | { type: "done"; reason: Extract<StopReason, "stop" | "length" | "toolUse">; message: AssistantMessage }  
    | { type: "error"; reason: Extract<StopReason, "aborted" | "error">; error: AssistantMessage };
```

### 消息结构
增量信息从消息中给独立出来后，最大的受益是消息结构的设计，只需要考虑全量，因此会变的相对简单，针对当前的模型只会有三种类型消息。 （ps. 从这个定义来看，联合类型是很不错的语法，在java中可以用sealed interface permits来模拟）

此外针对工具结果调用，保留了toolCallId指向，方便定位查询。

```ts
export interface UserMessage {  
    role: "user";  
    content: string | (TextContent | ImageContent)[];  
    timestamp: number; // Unix timestamp in milliseconds  
}

export interface AssistantMessage {  
    role: "assistant";  
    content: (TextContent | ThinkingContent | ToolCall)[];  
    api: Api;  
    provider: Provider;  
    model: string;  
    usage: Usage;  
    stopReason: StopReason;  
    errorMessage?: string;  
    timestamp: number; // Unix timestamp in milliseconds  
}

export interface ToolResultMessage<TDetails = any> {  
    role: "toolResult";  
    toolCallId: string;  
    toolName: string;  
    content: (TextContent | ImageContent)[]; // Supports text and images  
    details?: TDetails;  
    isError: boolean;  
    timestamp: number; // Unix timestamp in milliseconds  
}

```

### 消息修复层

模型调用期间会存在问题导致不连续，比如需要执行tool，但是没有执行结果。

比如使用A模型，输出了think块，但此时切换到B模型，但B模型没有这一层协议，因此设计了一个消息修复能力，核心逻辑如下所示：

```json
输入历史（简化）：

  [
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "..." , thinkingSignature: "sig1" },
        { type: "toolCall", id: "call_abc|fc_xxx/+++==", name: "search", arguments: { q: "ts" }, thoughtSignature: "enc" }
      ],
      provider: "openai",
      api: "openai-responses",
      model: "gpt-5",
      stopReason: "toolUse"
    },
    {
      role: "user",
      content: "继续"
    }
  ]

  transformMessages 给 Anthropic 时会做：

  1. thinking 从专有块转成普通 text（跨模型不保留专有推理块）。
  2. toolCall.id 规范化（去特殊字符/截断），例如变成 call_abc_fc_xxx___。
  3. thoughtSignature 去掉（跨模型无意义）。
  4. 发现这个 toolCall 后面没有对应 toolResult，自动补一条：

  {
    role: "toolResult",
    toolCallId: "call_abc_fc_xxx___",
    toolName: "search",
    content: [{ type: "text", text: "No result provided" }],
    isError: true
  }
```

# pi-agent-core
该部分为Agent设计的核心，整个的轮转都是基于该模块设计实现。

## 设计精髓

### 独立的AgentMessage
Agent有很多自己的定义，比如通知用户`请稍等，正在查询`，或者为UI做一些进度更新，这部分也是通过流式渠道完成的，但这部分不进入到LLM的History，因此通过扩展功能，可以让用户自定义消息。

其次Agent配置上开放了`convertToLlm: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;` 函数，可以在给到LLM的时候，做一层过滤属性。

```ts

/**
 * Extensible interface for custom app messages.
 * Apps can extend via declaration merging:
 *
 * @example
 * ```typescript
 * declare module "@mariozechner/agent" {
 *   interface CustomAgentMessages {
 *     artifact: ArtifactMessage;
 *     notification: NotificationMessage;
 *   }
 * }
 * ```
*/
export interface CustomAgentMessages {
// Empty by default - apps extend via declaration merging
}

/**
* AgentMessage: Union of LLM messages + custom messages.
* This abstraction allows apps to add custom message types while maintaining
* type safety and compatibility with the base LLM messages.
  */
  export type AgentMessage = Message | CustomAgentMessages[keyof CustomAgentMessages];
```

convertToLlm函数定义：

```ts
	/**
	 * Converts AgentMessage[] to LLM-compatible Message[] before each LLM call.
	 *
	 * Each AgentMessage must be converted to a UserMessage, AssistantMessage, or ToolResultMessage
	 * that the LLM can understand. AgentMessages that cannot be converted (e.g., UI-only notifications,
	 * status messages) should be filtered out.
	 *
	 * @example
	 * ```typescript
	 * convertToLlm: (messages) => messages.flatMap(m => {
	 *   if (m.role === "custom") {
	 *     // Convert custom message to user message
	 *     return [{ role: "user", content: m.content, timestamp: m.timestamp }];
	 *   }
	 *   if (m.role === "notification") {
	 *     // Filter out UI-only messages
	 *     return [];
	 *   }
	 *   // Pass through standard LLM messages
	 *   return [m];
	 * })
	 * ```
	 */
	convertToLlm: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;

```

### Agent Tool工具设计
工具的核心就两个属性：一是Tool的描述，二是工具的执行，因此pi-mono只需要两个定义。

```ts
export interface AgentToolResult<T> {  
    // Content blocks supporting text and images  
    content: (TextContent | ImageContent)[];  
    // Details to be displayed in a UI or logged  
    details: T;  
}  
  
// Callback for streaming tool execution updates  
export type AgentToolUpdateCallback<T = any> = (partialResult: AgentToolResult<T>) => void;  
  
// AgentTool extends Tool but adds the execute function  
export interface AgentTool<TParameters extends TSchema = TSchema, TDetails = any> extends Tool<TParameters> {  
    // A human-readable label for the tool to be displayed in UI  
    label: string;  
    execute: (  
       toolCallId: string,  
       params: Static<TParameters>,  
       signal?: AbortSignal,  
       onUpdate?: AgentToolUpdateCallback<TDetails>,  
    ) => Promise<AgentToolResult<TDetails>>;  
}
```

### 独立的Agent事件
Agent有自己的独立事件，该部分参考了LLM Model的事件，但两者的生命周期不一样。

```ts
/**
 * Events emitted by the Agent for UI updates.
 * These events provide fine-grained lifecycle information for messages, turns, and tool executions.
 */
export type AgentEvent =
	// Agent lifecycle
	| { type: "agent_start" }
	| { type: "agent_end"; messages: AgentMessage[] }
	// Turn lifecycle - a turn is one assistant response + any tool calls/results
	| { type: "turn_start" }
	| { type: "turn_end"; message: AgentMessage; toolResults: ToolResultMessage[] }
	// Message lifecycle - emitted for user, assistant, and toolResult messages
	| { type: "message_start"; message: AgentMessage }
	// Only emitted for assistant messages during streaming
	| { type: "message_update"; message: AgentMessage; assistantMessageEvent: AssistantMessageEvent }
	| { type: "message_end"; message: AgentMessage }
	// Tool execution lifecycle
	| { type: "tool_execution_start"; toolCallId: string; toolName: string; args: any }
	| { type: "tool_execution_update"; toolCallId: string; toolName: string; args: any; partialResult: any }
	| { type: "tool_execution_end"; toolCallId: string; toolName: string; result: any; isError: boolean };
```

### Steering与FollowUp设计
当Agent在执行一个复杂操作的时候，可能会非常久，一旦方向错误后就会陷入长久的思维链，因此`Steering`机制主要是在每一轮Tool执行后，加入到当前的Message[]数组中，让模型重新思考，用于修正模型的方向。

`FollowUP`是后续任务队列，模型每处理完任务后，会再去检查Follow UP中是否存在消息，如果存在，那么继续处理。

```ts
	/**
	 * Returns steering messages to inject into the conversation mid-run.
	 *
	 * Called after each tool execution to check for user interruptions.
	 * If messages are returned, remaining tool calls are skipped and
	 * these messages are added to the context before the next LLM call.
	 *
	 * Use this for "steering" the agent while it's working.
	 */
	getSteeringMessages?: () => Promise<AgentMessage[]>;

	/**
	 * Returns follow-up messages to process after the agent would otherwise stop.
	 *
	 * Called when the agent has no more tool calls and no steering messages.
	 * If messages are returned, they're added to the context and the agent
	 * continues with another turn.
	 *
	 * Use this for follow-up messages that should wait until the agent finishes.
	 */
	getFollowUpMessages?: () => Promise<AgentMessage[]>;
```

### Agent两层循环体系
外层循环主要是看是否有新的消息接入，保证消息继续，内层循环主要是看当前轮次的消息是否处理完毕，处理结束的标识就是没有任何工具再调用。

```ts
外层 while(true) {                    ← 处理 follow-up 消息
  内层 while(hasMoreToolCalls || pendingMessages) {  ← 处理工具调用 + steering
    1. 注入 pending messages（发射 message_start/end 事件）
    2. streamAssistantResponse()  → 拿到 AssistantMessage
    3. 如果 error/aborted → agent_end，返回
    4. 如果有 tool calls → executeToolCalls()
       - 每个工具执行后检查 steering 队列
       - 如果有 steering → 跳过剩余工具（标记为 "Skipped"）
    5. 发射 turn_end
    6. 再次检查 steering 队列
  }
  检查 follow-up 队列 → 如果有 → 设为 pending → continue 外层
  没有了 → break
}
```

(ps. 此处参考 https://guangzhengli.com/notes/pi-ai-and-agent-core-course LLM画的图很好)
