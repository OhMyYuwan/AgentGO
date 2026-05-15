# PI：极简主义的 Agent 框架

## Overview

> [!NOTE]
>
> **Pi 是一个 最小的终端代码框架**
>
> 它和很多“完整个人助手系统”不同：Pi 不急着把所有功能都内置进去，也不把 sub agents、plan mode、复杂工作流当作默认能力。它更像一块很薄但很硬的 Agent 底板：
>
> - 底层有统一的 LLM Provider API
> - 中间有可复用的 Agent Runtime
> - 上层有面向开发者的 Coding Agent CLI
> - 终端体验由独立 TUI 包支撑
> - Web 场景也有可复用 Chat UI 组件
>
> 所以读 Pi 的时候要从你手里这个 Nanobot 拉回来，看看已经 Nano 的 bot 的核心究竟是啥，理解：
>
> **一个极简 Agent 框架，怎样用最少的默认假设，把模型、工具、状态、终端交互和可扩展资源组织起来？**

| 小节 | 标题 | 内容 | 状态 |
| :---: | --- | --- | :---: |
| 1 | 为什么读 Pi | 从“大而全 Agent”切换到“极简 Harness”视角 | ✅ |
| 2 | Pi 的五层包结构 | `ai` / `agent` / `coding-agent` / `tui` / `web-ui` | ✅ |
| 3 | 最小 Agent 内核 | `Agent`、`agentLoop`、事件流与工具调用 | ✅ |
| 4 | CLI 如何启动 | 从 `cli.ts` 到 `main.ts` 的运行路径 | ✅ |
| 5 | 资源扩展系统 | AGENTS、Skills、Prompt Templates、Extensions、Themes | ✅ |
| 6 | Pi 与 Nanobot 的差异与联系 | 一个偏极简开发底板，一个偏完整个人助手系统，但共享同一套 Agent 骨架 | ✅ |
| 7 | 如何阅读 Pi 源码 | 从包边界到 runtime，再到 CLI 和 UI | ✅ |
| 8 | 本章小结 | 用 Pi 理解“少即是多”的 Agent 工程设计 | ✅ |
| 附录 | Pi 的项目解析文件 | 本仓库提供的 Pi 指定版本解析资料 | ✅ |

---

## 1. 为什么读 Pi

前面读 nanobot 时，我们把它看作一个完整个人助手系统：多入口、多模型、长期记忆、WebUI、Bridge、部署和产品体验都在里面。

Pi 的切入点不同。

Pi 的 README 里甚至直接说自己是：```minimal terminal coding harness```

这个定位很关键。它不是要一开始就提供所有 Agent 产品能力，而是先把 coding agent 最核心的事情做清楚：

- 模型如何统一接入
- 消息如何进入 Agent
- 工具如何被模型调用
- 工具结果如何回到上下文
- 终端如何展示流式输出和工具执行
- 用户如何通过 CLI、print、JSON、RPC 或 SDK 使用它
- 复杂能力如何通过扩展、技能和模板外挂上去

也就是说，Pi 的核心价值不是“大”，而是“薄”。

它把 Agent 系统拆成几个相对独立的包，让我们能看到一个 coding agent 从底层模型 API 到终端产品的最小工程路径。

## 2. Pi 的五层包结构

Pi 的主干可以理解为五层。

### 2.1 `packages/ai`：统一模型接口

`@earendil-works/pi-ai` 负责多模型、多 Provider 的统一 API。

它支持 OpenAI、Anthropic、Google、Vertex AI、Mistral、Groq、OpenRouter、Bedrock、GitHub Copilot、Codex 等多种 Provider，也支持 OpenAI-compatible API。

但它不是普通 SDK 封装。它明确只收纳支持 tool calling 的模型，因为 Pi 的目标是 agentic workflow，而不是普通聊天。

这一层解决的是：

- Provider 和模型如何统一描述
- streaming / completion 如何统一调用
- 工具 schema 如何传给模型
- 工具调用事件如何流式返回
- thinking / reasoning / usage / cost 如何统一表达
- 上下文如何序列化和跨模型迁移

可以把它理解为：

```text
packages/ai = Agent 世界里的模型适配层
```

### 2.2 `packages/agent`：Agent Runtime 核心

`@earendil-works/pi-agent-core` 是 Pi 最值得精读的部分。

它提供一个 stateful agent，围绕消息、工具、事件流和 loop 管理 Agent 执行过程。

官方 quick start 很短：

```typescript
const agent = new Agent({
  initialState: {
    systemPrompt: "You are a helpful assistant.",
    model: getModel("anthropic", "claude-sonnet-4-20250514"),
  },
});

agent.subscribe((event) => {
  if (event.type === "message_update") {
    // render streaming output
  }
});

await agent.prompt("Hello!");
```

这里已经出现了 Agent Runtime 的核心结构：

- `initialState`：系统提示、模型、工具、消息
- `prompt()`：向 Agent 注入用户输入
- `subscribe()`：监听事件流
- `message_update`：接收流式输出
- tool call：由 loop 自动执行并回填上下文

### 2.3 `packages/coding-agent`：面向用户的 CLI

这一层才是用户直接运行的 `pi`。

它负责：

- CLI 参数解析
- interactive / print / json / rpc 模式选择
- session 读取、恢复、fork、continue
- auth 和模型选择
- resource loading
- TUI 初始化
- runtime service 创建

源码入口很清楚：

```text
packages/coding-agent/src/cli.ts
packages/coding-agent/src/main.ts
```

`cli.ts` 很薄，只做 Node 入口、环境标记和全局 HTTP dispatcher 设置，然后把参数交给 `main()`。

真正的启动编排在 `main.ts`。

### 2.4 `packages/tui`：终端 UI 底座

Pi 的交互核心是终端，所以它单独抽出了 `@earendil-works/pi-tui`。

这个包关注：

- differential rendering
- synchronized output
- raw terminal input
- editor / input components
- overlay / focus 管理
- keybindings
- markdown、select list、settings list、image 等终端组件

这说明 Pi 没有把终端 UI 当成简单 `console.log`，而是把它当成一个可以复用的 UI runtime。

### 2.5 `packages/web-ui`：浏览器 Chat Surface

虽然 Pi 的主体验是终端，但它也提供了 `@earendil-works/pi-web-ui`。

这一层提供：

- `ChatPanel`
- `AgentInterface`
- artifact panel
- browser storage
- API key / settings / session store
- attachment 处理
- sandboxed artifact rendering

它说明 Pi 的底层 Agent Runtime 可以脱离 CLI，被嵌入 Web 应用。

这和 OpenClaw 这类项目的 SDK 集成方向是对齐的：Agent 不一定只能跑在终端里，它也可以成为应用内部的一个执行核心。

### 2.6 Nanobot 与 Pi 五层结构的对应关系

读完 Pi 的五层包结构，再回头看 Nanobot，会发现它们不是完全不同的两类东西，而是同一套 Agent 分层在不同工程取向下的展开。

Pi 把这些层拆成 npm workspace 包；Nanobot 则把它们组织在一个 Python 应用和 React WebUI 产品系统里。

| Pi 五层包结构 | Nanobot 中的对应位置 | 对应关系 |
| --- | --- | --- |
| `packages/ai` | `nanobot/providers/*` | 都负责把 OpenAI、Anthropic、Bedrock、本地模型等差异收敛成统一 Provider / Model 接口 |
| `packages/agent` | `nanobot/agent/runner.py`、`nanobot/agent/loop.py`、`nanobot/agent/context.py`、`ToolRegistry` | 都是在做 Agent Runtime：上下文构建、模型调用、工具执行、turn loop 和状态推进 |
| `packages/coding-agent` | `nanobot/cli/*`、`nanobot/api/server.py` | 都是用户入口和运行时编排层，只是 Pi 以 coding CLI 为主，Nanobot 还提供 API 服务入口 |
| `packages/tui` | `nanobot/channels/*` | Pi 用 TUI 承担终端交互、输入编辑和输出渲染；Nanobot 则由 Channels 承担不同平台的交互承载与消息渲染 |
| `packages/web-ui` | `webui/`、`nanobot/channels/websocket.py` | 都把 Agent Runtime 的事件和状态转成浏览器界面，只是 Nanobot 的 WebUI 更贴近完整个人助手产品 |

所以，Pi 的五层是一种更内核的范式，能够将 Nanobot 里已经存在的层拆得更薄、更模块化，能够用更轻量化的内容来实现一个完整的 Agent（如果你认可万物皆 coding 的话）

可以这样理解：

```text
Pi：把 Agent 系统拆成可复用包
Nanobot：把 Agent 系统组装成完整产品
```

二者共享的骨架是：

```text
Provider → Runtime Loop → Tool → Session/State → User Interface
```

差别在于，Pi 让你更容易看见最小骨架；Nanobot 让你更容易看见骨架外面还需要哪些产品能力。

## 3. 最小 Agent 内核：Agent + Loop + Event

如果只看 Pi 的 Agent 核心，可以抓住三个对象：

```text
Agent
agentLoop / runLoop
AgentEvent
```

### 3.1 Agent 是状态包装器

`packages/agent/src/agent.ts` 中的 `Agent` 负责保存当前 Agent 状态：

- `systemPrompt`
- `model`
- `thinkingLevel`
- `tools`
- `messages`
- `streamingMessage`
- `pendingToolCalls`
- `errorMessage`

同时它还管理：

- listeners
- steering queue
- follow-up queue
- active abort controller
- API key resolver
- transformContext
- convertToLlm
- beforeToolCall / afterToolCall hooks

换句话说：

```text
Agent = 状态 + 队列 + 生命周期 + loop 配置桥接
```

### 3.2 Loop 是执行器

`packages/agent/src/agent-loop.ts` 里真正跑的是 `runLoop()`。

它的执行路径很清楚：

1. `agentLoop()` 新开一次运行，把 prompt 加入上下文
2. `agentLoopContinue()` 从已有上下文继续
3. `runLoop()` 维护两层循环
4. 每轮调用 `streamAssistantResponse()`
5. 如果 assistant 产生 tool call，就执行工具
6. 工具结果变成 `toolResult` message 回填上下文
7. 每轮结束后可以 `prepareNextTurn` 或 `shouldStopAfterTurn`

可以画成：

```text
user prompt
   ↓
assistant streaming response
   ↓
tool calls?
   ↓
execute tools
   ↓
toolResult messages
   ↓
next assistant turn or stop
```

这就是 ReAct 在工程里的真实形态：不是写在论文里的 Thought / Action / Observation，而是一组可执行的 message、tool call、event 和 loop。

### 3.3 Event 是 UI 和 Runtime 的接口

Pi 的 agent core 会发出事件：

- `agent_start`
- `turn_start`
- `message_start`
- `message_update`
- `message_end`
- `tool_execution_start`
- `tool_execution_update`
- `tool_execution_end`
- `turn_end`
- `agent_end`

这些事件让 UI 不需要知道 loop 内部怎么写，只需要订阅事件并渲染。

这也是 Pi 架构很干净的一点：

```text
Runtime 负责执行
Event 负责说明发生了什么
UI 负责展示
```

## 4. CLI 如何启动

Pi 的 CLI 启动路径可以简化为：

```text
packages/coding-agent/src/cli.ts
        ↓
main(process.argv.slice(2))
        ↓
parseArgs()
        ↓
resolveAppMode()
        ↓
createSessionManager()
        ↓
createAgentSessionRuntime()
        ↓
InteractiveMode / runPrintMode / runRpcMode
```

它支持四种运行模式：

- `interactive`：终端交互模式
- `print`：非交互文本输出
- `json`：结构化输出
- `rpc`：进程集成模式

这很适合作为教学案例。因为很多 Agent 框架只展示“聊天”，但真实 coding agent 至少要回答：

- 用户是在终端输入，还是管道输入？
- 是要持续交互，还是一次性输出？
- 是否需要被别的进程调用？
- session 如何恢复？
- 当前工作目录是否来自旧 session？
- API key、模型、settings、extensions 在哪里加载？

Pi 把这些都放进 `coding-agent` 层，而不是塞进底层 `agent` 包里。

这就是分层的价值。

## 5. 资源扩展系统

Pi 的极简主义不是“不能扩展”，而是“不把所有扩展默认内置”。

它支持：

- Extensions
- Skills
- Prompt Templates
- Themes
- Pi Packages
- AGENTS / CLAUDE context files
- `.pi/` 本地资源目录

资源扩展主要集中在：

```text
packages/coding-agent/src/core/resource-loader.ts
packages/coding-agent/src/core/skills.ts
packages/coding-agent/src/core/prompt-templates.ts
packages/coding-agent/src/core/extensions
.pi
```

资源加载的大致顺序是：

1. reload settings
2. resolve package-managed resources
3. resolve CLI temporary paths
4. load extensions
5. load skills / prompts / themes
6. walk project context files
7. resolve system prompt and append prompt

这说明 Pi 的扩展思想是：

```text
核心保持薄
能力通过资源系统进入
资源可以来自项目、用户、本地包或 npm/git 包
```

这和我们前面讲 Skill 的观点很一致：不要把所有经验都写死到 Agent 里，而是把能力封装成可发现、可安装、可复用的资源。

## 6. Pi 与 Nanobot 的差异与联系

把 Pi 和 nanobot 放在一起看，会更容易理解 Agent 框架的不同路线。

它们的联系在于：二者都不是“只有一个 LLM 调用”的薄封装，而是围绕同一套 Agent 工程问题展开。

| 共同问题 | Pi 的回答 | Nanobot 的回答 |
| --- | --- | --- |
| 模型差异怎么统一 | `packages/ai` | `nanobot/providers` |
| Agent loop 怎么跑 | `packages/agent` | `AgentRunner` + `AgentLoop` |
| 工具如何执行 | tool call + hooks + tool execution mode | `ToolRegistry` + tools + MCP |
| 用户如何进入 | coding CLI / print / JSON / RPC / SDK | CLI / API / WebSocket / Chat Channels |
| 状态如何延续 | sessions、queues、context transform | SessionManager、Memory、Dream |
| UI 如何展示 | TUI 包、Web UI 包 | WebUI、stream events、channel renderer |

也就是说，Pi 和 Nanobot 的底层问题是一样的：把模型变成一个可执行、可交互、可延续的 Agent 系统。

真正不同的是默认取舍。

| 维度 | Pi | nanobot |
| --- | --- | --- |
| 核心定位 | 极简终端 coding harness | 完整个人助手系统 |
| 默认体验 | CLI / TUI / print / RPC | 多入口、多平台、长期运行 |
| 重点 | Agent loop、工具调用、资源扩展 | Provider、Channel、Memory、Bridge、WebUI |
| 扩展方式 | extensions、skills、prompt templates、pi packages | skills、memory、channels、providers、runtime 配置 |
| 学习价值 | 理解最小 coding agent 内核 | 理解完整 Agent 产品系统 |

Pi 的取舍很鲜明：

- 不默认内置 sub agents
- 不默认内置 plan mode
- 不把所有工作流塞进核心
- 鼓励用户通过扩展和第三方包适配自己的工作流

这对学习者很有价值。它提醒我们：Agent 框架不一定越大越好。很多时候，更重要的是边界清楚、核心稳定、扩展入口明确。

## 7. 如何阅读 Pi 源码

建议按照下面顺序读：

### 第一步：读 root README 和 package.json

确认项目对外宣称什么、有哪些 package、如何 build/check、有哪些运行模式。

### 第二步：读 `packages/agent`

重点看：

```text
packages/agent/src/agent.ts
packages/agent/src/agent-loop.ts
packages/agent/src/types.ts
```

目标是理解最小 Agent Runtime。

### 第三步：读 `packages/coding-agent`

重点看：

```text
packages/coding-agent/src/cli.ts
packages/coding-agent/src/main.ts
packages/coding-agent/src/core/resource-loader.ts
```

目标是理解一个库如何变成真实 CLI 产品。

### 第四步：按兴趣读 UI

如果你关注终端产品，可以读 `packages/tui`部分。
如果你关注浏览器应用，可以读 `packages/web-ui`部分。

## 8. 本章小结

Pi 给我们的启发是：

**Agent 框架可以很小，但不能没有边界。**

一个极简 coding agent 至少需要：

- 统一模型接口
- 可执行 Agent loop
- 工具调用和结果回填
- 可订阅事件流
- session 和队列管理
- CLI / TUI 入口
- 可扩展资源系统

Pi 的设计不是把一切都做进核心，而是把核心打薄，把扩展入口留出来。

这对我们做安全研究和落地应用很重要。因为真实项目里的 Agent 往往不是一次性 demo，而是需要不断接入新工具、新技能、新上下文和新工作流。Pi 提供了一个很好的反面提醒：

```text
不要先追求大而全。
先把 Agent 的最小可执行骨架做稳定。
```

当我们理解了 Pi，再回头看 nanobot、OpenClaw、ProtoCodeBase，就能更清楚地判断：哪些能力属于 Agent 内核，哪些属于产品系统，哪些应该被沉淀成 Skill，哪些应该交给协议和项目上下文治理。


# 本周作业
- 解析 PI 并增加任意一个功能。
  - 给你的 CodeAgent 安装 [ProtoCodeBase](https://github.com/OhMyYuwan/ProtoCodeBase.Skill) 任意协议解析Skill，解析 PI；想一想你需要什么功能呢，让你的 CodeAgent 添加一下这个功能，（你可以找找那个库实现了这个功能，然后用 ProtoCodeBase 解析一下它，然后让 CodeAgent 参照这个功能对 PI 进行修改）。
  - 我们提供了一个 ACP 协议解析 PI（commit [`a8af0b5`](https://github.com/earendil-works/pi/commit/a8af0b5e99e3309c5cbc3301c276302512789ca5)）后的文档在 [assets/PI/](../assets/pi-a8af0b5e99e3309c5cbc3301c276302512789ca5/AGENTS.md) 文件夹下。

----

<div align="center">
  <table>
    <tr>
      <td width="720" style="border:1px solid #d0d7de; border-radius:18px; padding:22px; background:#f6f8fa;">
        <h2 style="margin:0 0 10px 0;">致谢</h2>
        <p style="margin:0 0 14px 0;">
        @Yuwan0 编写本章内容。
        </p>
      </td>
    </tr>
  </table>
</div>
