# 第四章 轻量 Agent 框架入门

## Overview

> [!NOTE]
>
> **Agent 是围绕推理引擎构建的可执行系统，由四层构成：**
>
> - **LLM**：推理引擎，根据上下文生成下一步的文本或动作建议
> - **ReAct**：核心行为范式，让推理（Thought）、行动（Action）、观察（Observation）循环交错推进
> - **Agent Runtime**：执行层，组织上下文、执行工具、管理状态、控制循环，把 ReAct 循环变成真实可运行的系统
> - **产品系统**：完整体验层，多入口接入、多模型适配、长期记忆、配置与部署
>
> 它们之间的关系是：
>
> - LLM 提供 **智能**（怎么思考下一步）
> - ReAct 提供 **范式**（思考和行动如何交错）
> - Runtime 提供 **可执行性**（让动作真正发生、状态真正保存）
> - nanobot 把这套结构 **工程化、产品化、长期运行化**，变成可接入多平台、多模型、有长期记忆的完整 Agent 系统
>
> 所以读 nanobot 最重要的不是"它接了多少模型、多少平台"，而是理解：
>
> **Agent 由哪些层构成？ReAct 在哪一层？LLM 扮演什么角色？nanobot 又把这套系统做到了什么程度？**

| 小节 | 标题 | 内容 | 状态 |
| :---: | --- | --- | :---: |
| 1 | 从 LLM 到 nanobot | LLM → ReAct → Agent → nanobot 的四层递进 | ✅ |
| 2 | nanobot 分层图 | 从核心到展示的层级结构 | ✅ |
| 3 | LLM 在哪里 | `LLMProvider`、`AgentRunner` 与模型调用位置 | ✅ |
| 4 | 真正的工程内核 | 为什么核心更像 Agent Runtime，而不是单独 LLM | ✅ |
| 5 | Context 系统 | Prompt、memory、skills、runtime metadata 如何进入 LLM | ✅ |
| 6 | Loop 系统 | `AgentLoop` 与 `AgentRunner` 如何组成循环 | ✅ |
| 7 | Tool 与 MCP | Agent 如何从”会说”变成”会做” | ✅ |
| 8 | Provider 层 | 多模型供应商如何变成统一接口 | ✅ |
| 9 | 交互层 | CLI、API、Channel、WebSocket 如何输入输出 | ✅ |
| 10 | 展示层 | WebUI、SSE、stream event 与产品体验 | ✅ |
| 11 | Memory 与 Session | Agent 的短期历史与长期连续性 | ✅ |
| 12 | Bridge 与辅助系统 | WhatsApp Bridge、配置、安全、部署 | ✅ |
| 13 | 如何扩展 | 新增 Provider、Channel、Tool、WebUI 时怎么判断归属 | ✅ |
| 14 | 本章小结 | 用 nanobot 回答”Agent 都需要什么” | ✅ |

---

## 1. 从 LLM 到 nanobot：四层递进

理解 nanobot 的关键是理解从 LLM 到完整 Agent 系统的层级递进。每一层都在上一层基础上新增能力，解决新的问题。

### 1.1 第一层：LLM（推理引擎）

**是什么**：根据输入上下文生成输出的模型。

**核心能力**：
- 读取 system prompt、用户消息、历史对话、工具 schema
- 生成文本回复
- 生成工具调用参数（function calling）
- 输出推理过程（reasoning/thinking）

**边界**：
- ✅ 能推理、能生成
- ❌ 不能执行工具
- ❌ 不能保存状态
- ❌ 不能控制循环
- ❌ 不能处理输入输出

**一句话**：LLM 是推理引擎，但不是可执行系统。

---

### 1.2 第二层：ReAct（推理-行动循环）

**是什么**：让 LLM 交错生成推理轨迹（Thought）和任务操作（Action）的范式。

**新增能力**：
- Thought：解释当前问题、拆解目标、决定下一步
- Action：调用工具、查询环境
- Observation：获取工具返回的结果
- 循环：Thought → Action → Observation → Thought → ...

**解决什么**：让 LLM 不再只是一次性回答，而是可以多轮推理和行动。

**还缺什么**：
- 谁来真正执行 Action？
- 谁来管理 Observation 并回填给 LLM？
- 谁来控制循环何时继续、何时结束？
- 谁来保存中间状态？

**一句话**：ReAct 定义了推理-行动的范式，但还需要外部系统来承载这个循环。

---

### 1.3 第三层：Agent（可执行系统）

**是什么**：围绕 LLM 和 ReAct 循环组织起来的运行时系统。

**新增能力**：

| 组件 | 解决的问题 |
| --- | --- |
| Context | 让 LLM 看到身份、规则、历史、记忆和当前任务 |
| Tools | 让 Action 真正可以执行（读文件、写文件、调用 API） |
| State | 保存 session、checkpoint、中间状态 |
| Loop | 控制 ReAct 循环如何推进、何时结束 |
| I/O | 接收用户输入、返回结果 |
| Guardrails | 限制文件、网络、shell 权限风险 |

**核心公式**：
```
Agent = LLM + Context + Tools + State + Loop + I/O + Guardrails
```

**解决什么**：让 ReAct 循环真正可以运行、可以保存状态、可以安全执行。

**还缺什么**：
- 如何接入多个聊天平台？
- 如何支持多个 LLM 供应商？
- 如何长期记忆和沉淀？
- 如何提供产品级体验？
- 如何配置、部署、长期运行？

**一句话**：Agent 是可执行的 ReAct 系统，但还不是完整产品。

---

### 1.4 第四层：nanobot（完整个人助手系统）

**是什么**：轻量 Agent Framework，把 Agent 变成可长期运行的完整系统。

**新增能力**：

| 层级 | 能力 |
| --- | --- |
| 多入口 | CLI、API、WebSocket、Telegram、Discord、Slack、WhatsApp 等 |
| 多模型 | Provider 抽象，统一接入 OpenAI、Anthropic、Bedrock、本地模型 |
| 长期记忆 | Memory、Dream 两阶段记忆沉淀 |
| 产品体验 | WebUI、流式输出、进度展示、多会话管理 |
| 运维能力 | Config、Bridge、Cron、Heartbeat、部署、安全边界 |

**解决什么**：让 Agent 变成可以：
- 从多个平台接入用户
- 使用多个 LLM 供应商
- 长期记住用户和项目信息
- 提供流畅的产品体验
- 可配置、可部署、可长期运行

**一句话**：nanobot 是围绕 Agent Runtime 构建的完整个人助手系统。

---

### 1.5 层级总结

```text
LLM
  ↓ 能推理和生成，但不能执行
ReAct
  ↓ 定义了推理-行动循环，但需要外部系统承载
Agent
  ↓ 可执行的 ReAct 系统，但还不是完整产品
nanobot
  ↓ 完整的个人助手系统
```

**核心判断**：
- LLM 提供智能
- ReAct 提供范式
- Agent 提供可执行性
- nanobot 提供完整系统

读 nanobot 时，应该把注意力从”模型是谁”移动到”系统如何围绕模型运转”。


---

## 2. nanobot 分层图

下面这张图是 v3 的核心图。读者应该先记住它，再去读具体模块。

```text
┌──────────────────────────────────────────────────────────────┐
│  nanobot 产品与辅助系统                                       │
│  Config / Security / Bridge / Cron / Heartbeat / Deployment   │
└──────────────────────────────▲───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│  展示层 Presentation                                          │
│  WebUI / Markdown render / streaming bubble / channel output  │
└──────────────────────────────▲───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│  交互层 Interaction                                           │
│  CLI / Chat Channels / WebSocket / OpenAI-compatible API      │
│  输入变成 InboundMessage，输出变成 OutboundMessage             │
└──────────────────────────────▲───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│  ReAct-style Agent Runtime 内核                               │
│                                                              │
│  AgentLoop        一次 turn 的产品状态机                      │
│  AgentRunner      LLM + Tool 的执行循环                       │
│  ContextBuilder   把规则、历史、memory、skills 渲染给 LLM       │
│  ToolRegistry     管理可执行动作                              │
│  SessionManager   保存短期状态                                │
└──────────────────────────────▲───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│  LLM 推理层 Reasoning Engine                                  │
│                                                              │
│  LLMProvider -> OpenAI / Anthropic / Bedrock / local models   │
│  输入 messages + tools schema                                 │
│  输出 content 或 tool_calls                                   │
└──────────────────────────────▲───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│  能力与状态层 Capabilities & State                            │
│  Tools / MCP / Memory / Dream / Cron / Heartbeat / Security   │
└──────────────────────────────────────────────────────────────┘
```

### 这张图怎么读

从内到外看：

1. **LLM 推理层** 负责生成下一步。
2. **ReAct-style Agent Runtime 内核** 负责组织 reasoning、action、observation 如何交错发生。
3. **能力与状态层** 给 Runtime 提供可执行动作和持久状态。
4. **交互层** 负责和用户、客户端、聊天平台对接。
5. **展示层** 负责把结果变成可读、可操作、可感知的产品体验。
6. **nanobot 产品与辅助系统** 负责让这个 Agent 变成可以长期运行、部署、桥接、配置和维护的完整系统。

注意这里的判断：

> **LLM 很核心，但 nanobot 的工程内核不是 LLM 本身，而是 Agent Runtime。**

为什么？

因为没有 LLM，Agent 不会智能；但只有 LLM，没有 Runtime，也不会成为可运行的 Agent 系统。

同样，只有 ReAct-style loop 也还不是完整 nanobot。nanobot 还需要 WebUI、Channel、Bridge、Heartbeat、Cron、Config、Security、Deployment 等外层能力，才能变成可长期运行的个人 assistant 系统。

---

## 3. LLM 在哪里

在 nanobot 里，LLM 位于 Provider 层背后。

相关文件：

```text
nanobot/providers/base.py
nanobot/providers/factory.py
nanobot/providers/registry.py
nanobot/providers/openai_compat_provider.py
nanobot/providers/anthropic_provider.py
nanobot/providers/bedrock_provider.py
```

最重要的抽象在 `nanobot/providers/base.py`：

| 对象 | 含义 |
| --- | --- |
| `LLMProvider` | 模型供应商统一接口 |
| `LLMResponse` | 模型统一回复结构 |
| `ToolCallRequest` | 模型提出的工具调用 |
| `GenerationSettings` | temperature、max_tokens、reasoning_effort |

也就是说，nanobot 不直接把 OpenAI、Anthropic、Bedrock 等接口散落到 Runtime 里，而是把它们收敛成统一 Provider。

### LLM 的输入是什么

LLM 收到的不是“用户原文”这么简单，而是由 `ContextBuilder` 和 Runtime 处理后的 messages。

输入通常包括：

- system prompt
- workspace bootstrap files
- memory
- skills summary
- recent history
- runtime metadata
- 当前用户消息
- tools schema

这就是为什么同一个 LLM，在不同 Agent 框架里表现会很不一样。

> **LLM 的能力上限很重要，但 Agent 的上下文组织方式决定了它具体怎么使用这个能力。**

### LLM 的输出是什么

在 nanobot 里，LLM 的输出被统一为 `LLMResponse`：

- `content`
- `tool_calls`
- `finish_reason`
- `usage`
- `retry_after`
- `reasoning_content`
- `thinking_blocks`
- error metadata

如果 LLM 只是返回文本，那么本轮可能直接进入最终回复。

如果 LLM 返回工具调用，那么 `AgentRunner` 会执行工具，把结果加入 messages，再次调用 LLM。

所以 LLM 不直接操作文件、不直接发消息、不直接改记忆。

它只是说：

> 我建议下一步调用这个工具，参数是这些。

真正执行这件事的是 Agent Runtime。

---

## 4. 真正的工程内核是什么

如果一定要问 nanobot 的“内核”是谁，我会把它分成两层回答。

### 智能内核：LLM

LLM 是智能来源。

没有 LLM，系统就不会根据上下文做推理，不会选择工具，不会生成自然语言回复。

所以从智能角度说：

> **LLM 是推理内核。**

### 工程内核：Agent Runtime

但从框架工程角度看，内核不是单独的 LLM，而是这组闭环：

```text
AgentLoop
  + AgentRunner
  + ContextBuilder
  + ToolRegistry
  + SessionManager
```

它们共同决定：

- 一条消息如何进入 turn
- 历史如何恢复
- 上下文如何构造
- 模型如何被调用
- 工具如何执行
- checkpoint 如何保存
- session 如何持久化
- 最终输出如何发布

因此从框架角度说：

> **Agent Runtime 才是工程内核。**

### 为什么这个区分重要

如果你把 LLM 当成全部，就会误以为做 Agent 只是：

```text
写一个 prompt + 调用一个 API
```

但真实 Agent 很快会遇到问题：

- 用户第二次来，历史在哪里？
- 工具调用一半失败，怎么恢复？
- 模型输出了工具调用，谁执行？
- 工具结果太长，怎么裁剪？
- 用户从 WebUI 和 Telegram 同时来，怎么隔离 session？
- 需要流式显示时，谁发 delta？
- 长期记忆怎么沉淀？
- 文件和网络权限怎么管？

这些问题都不是 LLM API 本身解决的。

所以本教程的核心判断是：

> **LLM 提供智能，Agent Runtime 提供可运行性。**

---

## 5. Context 系统

LLM 不会凭空知道该怎么做。

它看到什么、以什么顺序看到、哪些信息被标记为规则、哪些信息只是 metadata，都会影响 Agent 的行为。

nanobot 的上下文构建在：

```text
nanobot/agent/context.py
```

核心类是 `ContextBuilder`。

### ContextBuilder 做什么

它把多个来源拼成 LLM messages：

| 来源 | 作用 |
| --- | --- |
| identity | 告诉模型运行环境、workspace、平台策略 |
| `AGENTS.md` | workspace 或项目级工作规则 |
| `SOUL.md` | Agent 的长期语气和表达方式 |
| `USER.md` | 用户长期偏好和信息 |
| `TOOLS.md` | 工具说明 |
| `memory/MEMORY.md` | 长期项目事实和决策 |
| skills | 可用能力摘要和 always skills |
| recent history | 近期历史摘要 |
| runtime metadata | 当前时间、channel、chat id、sender id |
| current message | 当前用户输入 |

这说明 Context 不是“prompt 字符串”，而是一套上下文渲染系统。

### Runtime metadata

nanobot 会把当前时间和 channel 信息放进一个明确标记的块：

```text
[Runtime Context — metadata only, not instructions]
Current Time: ...
Channel: ...
Chat ID: ...
Sender ID: ...
[/Runtime Context]
```

这很重要。

它告诉模型：

- 当前是什么时间
- 消息来自哪个 channel
- 当前 chat id 是什么
- sender id 是什么

但同时又强调：

> **这些是 metadata，不是新的用户指令。**

这就是 Agent 系统里非常重要的一类设计：把上下文分层，降低混淆和注入风险。

### Context 决定 LLM 如何工作

LLM 的机制是根据上下文预测和生成，但 Agent 框架决定上下文是什么。

放回 ReAct 语境里看：

- Reasoning trace 取决于 messages 中已有的任务、历史、规则和观察。
- Action 取决于 tools schema 中暴露了哪些可用操作。
- 下一轮 reasoning 又取决于上一轮 action 得到的 observation。

`ContextBuilder` 就是在准备 LLM 进行 reasoning 和 action selection 所需的上下文。

---

## 6. Loop 系统

Agent 不是一次性调用。

真正的 Agent 通常需要循环：

```text
模型思考
  |
  v
模型请求工具
  |
  v
运行时执行工具
  |
  v
工具结果回填给模型
  |
  v
模型继续判断
```

nanobot 把 Loop 分成两层。

### AgentLoop：产品层 Loop

`nanobot/agent/loop.py` 的 `AgentLoop` 管一次 turn 的产品生命周期。

状态是：

```text
RESTORE -> COMPACT -> COMMAND -> BUILD -> RUN -> SAVE -> RESPOND -> DONE
```

它负责：

- 恢复未完成状态
- 判断是否压缩历史
- 处理 slash command
- 构建 messages
- 调用 Runner
- 保存 session
- 组装 outbound message
- 发布进度、流式输出、最终回复

它像应用框架里的主事件循环。

### AgentRunner：LLM + Tool Loop

`nanobot/agent/runner.py` 的 `AgentRunner` 管模型和工具循环。

它负责：

- 调用 provider
- 识别 tool_calls
- 执行工具
- 写入 tool result
- 处理空回复、长度恢复、错误恢复
- 管理工具结果预算
- 发 checkpoint
- 处理用户中途 injection

简化后是：

```text
messages
  |
  v
provider.complete(...)
  |
  +--> content -> final
  |
  +--> tool_calls -> execute tools -> append results -> call provider again
```

这就是工具型 Agent 的核心闭环。

### 两层 Loop 的区别

| 层 | 关注点 | 代表 |
| --- | --- | --- |
| AgentLoop | 一轮产品交互如何完成 | restore、compact、command、save、respond |
| AgentRunner | LLM 与工具如何循环 | model call、tool call、tool result、retry |

所以：

> **Loop 不是一个 while 循环那么简单，而是产品状态机 + 模型工具循环的组合。**

---

## 7. Tool 与 MCP

LLM 只能生成内容，Tool 让 Agent 能做事。

nanobot 的工具在：

```text
nanobot/agent/tools/
```

由 `ToolRegistry` 统一管理。

### Tool 解决什么

Tool 解决的是动作能力：

- 读文件
- 写文件
- 搜索文件
- 执行命令
- 搜索网页
- 抓取网页
- 向用户提问
- 发送消息
- 设置 cron
- 生成图片
- 启动子 Agent

LLM 决定“要不要调用工具”和“参数是什么”，Runtime 决定“工具是否存在、是否允许、怎么执行、结果怎么回填”。

所以可以这样分：

| 部分 | 负责什么 |
| --- | --- |
| LLM | 选择下一步动作 |
| ToolRegistry | 提供动作目录 |
| Tool implementation | 真正执行动作 |
| AgentRunner | 把工具结果带回模型循环 |

### MCP 在哪里

MCP 在 nanobot 里是一种外部能力接入方式。

相关文件：

```text
nanobot/agent/tools/mcp.py
```

MCP server 暴露的：

- tools
- resources
- prompts

会被包装成 nanobot 工具，注册到 `ToolRegistry`。

因此在 nanobot 的分层里：

> **MCP 不是 Agent 内核，而是能力接入层。它最终还是要进入 ToolRegistry，供 Runner 调用。**

### Tool 与安全

Tool 越强，越需要边界。

nanobot 对工具边界的控制包括：

- workspace restriction
- allowed directory
- shell timeout
- shell deny patterns
- SSRF validation
- external lookup violation tracking
- channel allowFrom
- WebSocket token

这说明一个 Agent 不只是“有工具”，还要有：

> **工具边界和失败处理。**

---

## 8. Provider 层

Provider 层的任务是把不同 LLM 供应商统一起来。

如果没有 Provider 层，Runtime 里就会到处都是：

- OpenAI 参数
- Anthropic 参数
- Bedrock 参数
- streaming 差异
- tool call 差异
- reasoning 字段差异
- error metadata 差异

nanobot 用 Provider 抽象把这些差异挡在外面。

### Provider Factory

`nanobot/providers/factory.py` 根据配置创建当前 Provider。

它会判断：

- 显式 provider
- model prefix
- provider registry keyword
- local provider fallback
- API key fallback

最终返回 `ProviderSnapshot`：

- `provider`
- `model`
- `context_window_tokens`
- `signature`

`signature` 用来判断 provider 相关配置是否变化。

### Provider 的边界

Provider 应该做：

- 请求模型 API
- 适配消息格式
- 适配 tools schema
- 解析 content
- 解析 tool calls
- 解析 usage
- 解析 retry/error metadata

Provider 不应该做：

- 保存 session
- 管 channel
- 改 memory
- 直接执行工具
- 决定 WebUI 如何展示

一句话：

> **Provider 是 LLM 世界和 Agent Runtime 世界之间的适配器。**

---

## 9. 交互层

交互层负责让用户和 Agent Runtime 相遇。

nanobot 的交互层包括：

- CLI
- Chat Channels
- WebSocket
- OpenAI-compatible API

### CLI

CLI 在：

```text
nanobot/cli/commands.py
```

它提供：

- `nanobot onboard`
- `nanobot agent`
- `nanobot gateway`
- `nanobot serve`
- provider login
- plugin/channel 管理相关命令

CLI 适合本地开发、调试和直接使用。

### Channel

Channel 在：

```text
nanobot/channels/
```

Channel 的本质是平台适配器。

它把 Telegram、Discord、Slack、Feishu、WebSocket 等平台消息转成：

```text
InboundMessage
```

再把 Agent 输出转成平台消息。

### API

API 在：

```text
nanobot/api/server.py
```

它把 HTTP 请求转成：

```python
agent_loop.process_direct(...)
```

它支持：

- `/health`
- `/v1/models`
- `/v1/chat/completions`
- session_id
- base64 image
- multipart upload
- SSE streaming

### WebSocket

WebSocket Channel 在：

```text
nanobot/channels/websocket.py
```

它是 WebUI 的实时后端，也可以被外部客户端直接使用。

支持：

- token
- short-lived token
- multi-chat multiplex
- streaming delta
- turn_end
- session update

### 交互层不是核心推理

这些入口非常重要，但它们不是推理内核。

它们的任务是：

> **把外部世界的输入输出，翻译成 Agent Runtime 能处理的标准事件。**

---

## 10. 展示层

展示层负责用户最终看到什么、感受到什么。

它不是 Agent 的智能核心，但会强烈影响产品体验。

nanobot 的展示层主要包括：

- WebUI
- CLI stream renderer
- Channel message renderer
- SSE streaming chunks
- WebSocket events

### WebUI

WebUI 位于：

```text
webui/
```

关键文件：

| 文件 | 作用 |
| --- | --- |
| `webui/src/App.tsx` | 应用 shell、认证、sidebar、settings、theme |
| `webui/src/lib/nanobot-client.ts` | WebSocket client |
| `webui/src/hooks/useNanobotStream.ts` | 把 server event 转成 UI message state |
| `webui/src/components/` | 聊天界面组件 |

WebUI 不重新实现 Agent。

它只是通过 WebSocket 与 Agent Runtime 通信，把事件展示出来。

### stream_end 与 turn_end

WebUI 里一个很关键的判断是：

- `stream_end`：一段文本流结束
- `turn_end`：整个 turn 完成

为什么要区分？

因为模型可能先输出一段文本，然后调用工具，然后继续输出。此时文本段结束不代表本轮结束。

所以展示层必须理解 Runtime 事件语义，否则 UI loading 会错。

这说明：

> **展示层虽然不是智能核心，但必须尊重 Agent Runtime 的事件模型。**

---

## 11. Memory 与 Session

Agent 如果不能保存状态，就很难成为长期助手。

nanobot 把状态分成两类：

- Session：短期会话
- Memory：长期记忆

### Session

Session 在：

```text
nanobot/session/manager.py
```

每个 session 默认保存为 workspace 下的 JSONL 文件。

它负责：

- 保存消息
- 加载历史
- 修复损坏文件
- 控制 replay 数量
- 保持工具调用边界合法
- 对图片消息添加 breadcrumb
- 原子写入 session 文件

Session 是短期状态。

它回答：

> **这次对话到目前为止发生了什么？**

### Memory

Memory 在：

```text
nanobot/agent/memory.py
```

核心文件：

```text
workspace/
├── SOUL.md
├── USER.md
└── memory/
    ├── MEMORY.md
    ├── history.jsonl
    ├── .cursor
    └── .dream_cursor
```

它回答：

> **长期来看，Agent 应该记住什么？**

### Consolidator 与 Dream

nanobot 的长期记忆分两步：

```text
session messages
  |
  v
Consolidator
  |
  v
history.jsonl
  |
  v
Dream
  |
  v
SOUL.md / USER.md / MEMORY.md
```

Consolidator 把旧会话压缩成历史素材。

Dream 再把历史素材整理进长期记忆文件。

这说明长期记忆不是简单追加聊天记录，而是一种整理和提炼。

---

## 12. Bridge 与辅助系统

除了核心 Runtime，nanobot 还有一些辅助系统。

这些系统不一定属于智能核心，但它们让 Agent 能真实运行。

### WhatsApp Bridge

Bridge 位于：

```text
bridge/
```

它是 TypeScript/Node 服务，用来处理 WhatsApp Web 生态。

关键文件：

- `bridge/src/index.ts`
- `bridge/src/server.ts`
- `bridge/src/whatsapp.ts`

它做的事情：

- 启动本地 WebSocket server
- 要求 `BRIDGE_TOKEN`
- 连接 WhatsApp
- 处理 QR 登录
- 下载媒体
- 转发 inbound message
- 执行 send/send_media 命令

为什么不直接放在 Python 主运行时？

因为 WhatsApp Web 生态主要在 Node.js，隔离成 bridge 可以让 Python 核心保持轻量。

### Config

配置在：

```text
nanobot/config/schema.py
nanobot/config/loader.py
```

`Config` 是整个运行时的 typed contract。

它包括：

- agents
- providers
- channels
- api
- gateway
- tools

配置加载还支持：

- 默认值
- 旧配置迁移
- Pydantic 校验
- `${VAR_NAME}` 环境变量解析
- SSRF whitelist 应用

### Security

安全边界在多个地方：

- `nanobot/security/network.py`
- filesystem tools
- shell tools
- WebSocket config
- Channel allowFrom
- Bridge token

默认策略可以概括为：

> **默认本地，显式授权，网络和路径都要受控。**

### Cron 与 Heartbeat

`cron` 和 `heartbeat` 让 Agent 不只是被动聊天。

它可以：

- 定时触发任务
- 周期性保持运行状态
- 推动 Dream 或提醒类工作
- 支撑长期运行场景

这些都不是 LLM 本身提供的，而是 Agent 系统提供的运行能力。

---

## 13. 如何扩展

理解分层之后，扩展 nanobot 就会清楚很多。

### 如果你要接新模型

改 Provider。

可能涉及：

```text
nanobot/providers/registry.py
nanobot/providers/factory.py
nanobot/providers/<name>_provider.py
nanobot/config/schema.py
docs/configuration.md
```

判断标准：

> **差异来自模型 API，就放 Provider。**

### 如果你要接新聊天平台

改 Channel。

可能涉及：

```text
nanobot/channels/<name>.py
nanobot/channels/registry.py
docs/chat-apps.md
```

外部插件可以注册：

```toml
[project.entry-points."nanobot.channels"]
my_channel = "my_package:MyChannel"
```

判断标准：

> **差异来自用户入口或平台消息协议，就放 Channel。**

### 如果你要新增动作能力

改 Tool，或者接 MCP。

可能涉及：

```text
nanobot/agent/tools/
nanobot/agent/loop.py
tests/tools/
```

判断标准：

> **它是 Agent 可执行的具体动作，就放 Tool。**

如果这个能力已经是外部服务，并且希望被多个客户端复用，可以考虑 MCP。

### 如果你要改界面体验

改展示层。

可能涉及：

```text
webui/src/components/
webui/src/hooks/useNanobotStream.ts
webui/src/lib/nanobot-client.ts
nanobot/channels/websocket.py
```

判断标准：

> **它改变用户看到的体验，但不改变 Agent 推理和执行本身，就属于展示层或交互层。**

### 如果你要改长期行为

看 Session、Memory、Cron、Heartbeat。

可能涉及：

```text
nanobot/session/manager.py
nanobot/agent/memory.py
nanobot/cron/service.py
nanobot/heartbeat/service.py
```

判断标准：

> **它改变 Agent 如何延续状态、长期记住或主动运行，就属于状态和长期运行层。**

---

## 14. 本章小结

这一版最想让读者留下的印象是：

> **Agent 不是 LLM 本身，而是围绕 LLM 建起来的一套运行系统。**

在 nanobot 中，可以这样分层：

```text
展示层：WebUI / stream / channel render
交互层：CLI / API / WebSocket / Chat Channels
运行时内核：AgentLoop / AgentRunner / ContextBuilder / ToolRegistry / SessionManager
推理层：LLMProvider -> external LLM
能力与状态层：Tools / MCP / Memory / Cron / Security
辅助系统：Bridge / Config / Deployment
```

如果按“Agent 都需要什么”来总结，答案是：

| Agent 需要 | nanobot 中的实现 |
| --- | --- |
| 一个推理引擎 | LLMProvider 连接外部 LLM |
| 一个上下文系统 | ContextBuilder |
| 一个循环系统 | AgentLoop + AgentRunner |
| 一组动作能力 | ToolRegistry + tools + MCP |
| 一个状态系统 | SessionManager + MemoryStore + Dream |
| 一组交互入口 | CLI + Channel + API + WebSocket |
| 一个展示系统 | WebUI + stream events + channel output |
| 一组安全边界 | network guardrails + tool restrictions + auth |
| 一套运维能力 | config + bridge + cron + heartbeat + deployment |

所以，nanobot 最值得学习的不是某个具体平台适配，而是它提供了一个轻量但完整的 Agent 分层样本：

> **LLM 负责生成可能的下一步，Agent Runtime 负责把下一步变成可执行、可保存、可恢复、可展示的系统行为。**

只要理解了这一点，再读 `nanobot/agent/loop.py`、`nanobot/agent/runner.py`、`nanobot/providers/base.py`、`nanobot/channels/base.py` 和 `nanobot/session/manager.py`，就不会被目录数量吓到。

你会看到的不是一堆文件，而是一套围绕 LLM 运转的 Agent 工程结构。

---

# 本周作业
- 解析 Nanobot 并增加任意一个功能。
  - 给你的 CodeAgent 安装 [ProtoCodeBase](https://github.com/OhMyYuwan/ProtoCodeBase.Skill) 任意协议解析Skill，解析 Nanobot；想一想你需要什么功能呢，让你的 CodeAgent 添加一下这个功能，（你可以找找那个库实现了这个功能，然后用 ProtoCodeBase 解析一下它，然后让 CodeAgent 参照这个功能对 Nanobot 进行修改）。
  - 我们提供了一个 ACP 协议解析 Nanobot（commit [`73a8d8a`](https://github.com/HKUDS/nanobot/commit/73a8d8a8755aa5af422d3217c281f795580bb4b2)）后的文档在 [assets/Nanobot/](assets/Nanobot/) 文件夹下。

----

<div align="center">
  <table>
    <tr>
      <td width="720" style="border:1px solid #d0d7de; border-radius:18px; padding:22px; background:#f6f8fa;">
        <h2 style="margin:0 0 10px 0;">致谢</h2>
        <p style="margin:0 0 14px 0;">
        @Yuwan0编写本章内容。
        </p>
      </td>
    </tr>
  </table>
</div>