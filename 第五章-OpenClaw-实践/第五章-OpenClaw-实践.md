# 第六章 OpenClaw 实践：个人 AI 助手的完整工程形态

## Overview

> [!NOTE]
>
> **OpenClaw 是一个 local-first 的个人 AI 助手系统。**
>
> 如果说 Pi 让我们看见“最小 coding agent 内核”是什么，Nanobot 让我们看见“轻量个人助手”可以怎样组织，那么 OpenClaw 展示的是另一个方向：
>
> **当一个 Agent 不再只活在终端或一个 Web 页面里，而是要进入用户真实设备、真实聊天渠道、真实本地权限和长期运行环境时，工程系统会膨胀成什么样？**
>
> OpenClaw 的关键词不是“轻”，而是：
>
> - 本地优先的 Gateway
> - 多 Channel 接入
> - 多 Agent / 多 Session 路由
> - 插件系统和 Plugin SDK
> - Provider、工具、媒体、语音、节点、Canvas
> - 安全默认值、配对、沙箱和权限边界
> - macOS / iOS / Android 伴生应用
>
> 所以读 OpenClaw 时，我们不应该只问“Agent loop 在哪里”，还要问：
>
> **一个 Agent 要变成你自己设备上常驻的个人助手，需要哪些系统层？**

| 小节 | 标题 | 内容 | 状态 |
| :---: | --- | --- | :---: |
| 1 | 为什么读 OpenClaw | 从最小 Agent 走向真实个人助手系统 | ✅ |
| 2 | OpenClaw 的总体分层 | Gateway / Agent Runtime / Channel / Plugin / Apps | ✅ |
| 3 | Gateway：控制平面 | 为什么 OpenClaw 的中心不是聊天窗口，而是 Gateway | ✅ |
| 4 | Agent Runtime：执行内核 | OpenClaw 如何把用户输入变成一次可执行 Agent turn | ✅ |
| 5 | Channel Runtime：真实世界入口 | 多聊天平台如何被统一成消息与会话 | ✅ |
| 6 | Plugin System：把能力移出核心 | Provider、Channel、Tool、Memory 如何插件化 | ✅ |
| 7 | OpenClaw 与 Pi 的内核对应 | OpenClaw 如何把 Pi 嵌入成 Agent harness | ✅ |
| 8 | OpenClaw 与 Nanobot 的区别和联系 | 为什么说 Nanobot 是 OpenClaw 的轻量化版本 | ✅ |
| 9 | 如何阅读 OpenClaw 源码 | 从 Gateway 到 Agent，再到 Channel 和 Plugin | ✅ |
| 10 | 本章小结 | 用 OpenClaw 理解“个人助手系统” | ✅ |
| 附录 | 本章参考的项目解析线索 | OpenClaw ACP 项目地图与能力索引 | ✅ |

---

## 1. 为什么读 OpenClaw

前面读 Nanobot 时，我们关注的是一个轻量 Agent Framework 如何把 LLM、ReAct、Runtime、Channel、Memory 和 WebUI 组合起来。

读 Pi 时，我们又把视角收缩到更小：一个极简终端 coding harness，只保留模型接口、Agent Runtime、工具调用、状态、TUI 和资源扩展。

OpenClaw 则正好站在另一个端点。

它不是“最小 Agent”，也不是“轻量框架”，而是一个面向真实使用场景的个人 AI 助手系统。它的 README 直接把自己定义为：

```text
Personal AI Assistant you run on your own devices.
```

这句话有三个重点：

- **Personal**：它不是给所有用户共享的云端客服，而是你的个人助手。
- **AI Assistant**：它不只是聊天，还要能执行工具、接入渠道、管理会话、处理媒体和设备能力。
- **Run on your own devices**：它强调本地优先，运行在你的机器、你的移动设备、你的聊天渠道上。

因此，OpenClaw 要解决的问题比 Pi 和 Nanobot 都更“产品化”：

- 用户从 WhatsApp、Telegram、Slack、Discord、Signal、iMessage 等渠道发来消息，谁来接？
- 多个聊天账号、群聊、私聊、线程如何路由到正确 session？
- Agent 运行时如何选择模型、工具、沙箱、权限和工作目录？
- 本地 Gateway 如何向 Web、移动端、桌面端、插件和节点暴露统一控制平面？
- 多 Provider、多 Channel、多 Tool 如何不把核心代码拖成一团？
- 当 Agent 接触真实 DM、真实文件、真实设备时，安全默认值在哪里？

所以 OpenClaw 适合用来理解：

```text
最小 Agent 内核
  ↓
轻量个人助手框架
  ↓
本地优先、长期运行、多入口、多设备的完整 Agent 产品系统
```

## 2. OpenClaw 的总体分层

从项目地图看，OpenClaw 是一个 TypeScript / pnpm monorepo。核心目录可以先抓住这几块：

| 层级 | 关键路径 | 作用 |
| --- | --- | --- |
| CLI / Operator | `openclaw.mjs`、`src/cli/`、`src/commands/` | 用户启动、配置、发送消息、运行 Agent、诊断系统 |
| Gateway | `src/gateway/` | 本地控制平面，承载 RPC、WebSocket、节点、事件、服务端方法 |
| Agent Runtime | `src/agents/`、`src/sessions/`、`src/tasks/` | Agent 执行、会话、工具、沙箱、模型选择、运行状态 |
| Embedded Pi Runner | `src/agents/pi-embedded-runner/` | 将 Pi 的 Agent / Coding Agent 能力嵌入 OpenClaw |
| Channel Runtime | `src/channels/` | 多聊天渠道的消息、目标、会话、配对、allowlist、发送与接收 |
| Plugin System | `src/plugins/`、`src/plugin-sdk/`、`extensions/` | 插件发现、加载、能力注册、SDK、Provider / Channel / Tool 扩展 |
| Media / Provider | `src/media-*`、`src/tts/`、`src/web-*`、`src/memory/` | 媒体理解、生成、语音、搜索、记忆、模型能力 |
| UI / Apps | `ui/`、`apps/macos/`、`apps/ios/`、`apps/android/` | 控制台、桌面端、移动端、设备节点 |
| Config / Security | `src/config/`、`src/security/`、`src/pairing/`、`src/infra/` | 配置、密钥、配对、安全策略、出站访问和运行边界 |

可以把它画成这样：

```text
用户真实入口
CLI / Web UI / macOS / iOS / Android / Chat Channels
        ↓
Gateway 控制平面
RPC / WebSocket / Events / Nodes / Server Methods
        ↓
路由与会话
Agent / Session / Target / Channel / Account / Thread
        ↓
Agent Runtime
Model / Tools / Sandbox / Skills / Memory / Context / Pi Runner
        ↓
Plugin System
Providers / Channels / Tools / Media / Memory / Diagnostics
```

这个分层和 Nanobot 的“产品系统”很像，但 OpenClaw 把每一层都拆得更细，尤其是 Gateway、Plugin SDK、Channel 安全策略和伴生 App。

## 3. Gateway：OpenClaw 的控制平面

读 OpenClaw，第一件事是不要把它想成“一个聊天机器人”。

它真正的中心是 Gateway。

Gateway 负责把本地服务、聊天渠道、Web 控制台、移动节点、桌面 App、Agent 执行和插件能力连接起来。它不是单纯的 HTTP API，而是一个本地控制平面：

- 接收 CLI、Web、App、Node、Channel 的请求
- 维护连接和身份
- 处理 RPC / WebSocket 事件
- 分发 server methods
- 广播状态、健康检查、presence、任务事件
- 让真实设备和聊天平台能够接入同一个运行时

这和 Pi 很不一样。

Pi 的中心是：

```text
终端 CLI → Agent Runtime → 工具执行 → 终端输出
```

OpenClaw 的中心更像：

```text
多个入口 → Gateway → 路由 / 会话 / 权限 → Agent Runtime → 多个出口
```

这也是 OpenClaw “重”的第一个原因：它要处理的不是一次终端会话，而是一套长期在线的本地服务。

## 4. Agent Runtime：执行内核

OpenClaw 的 Agent Runtime 主要在 `src/agents/`。

它负责把一次用户输入变成一次可执行 Agent turn。你可以抓住这条路径：

```text
src/agents/agent-command.ts
  ↓
src/agents/command/attempt-execution.runtime.ts
  ↓
src/agents/pi-embedded-runner/run.ts
  ↓
src/agents/pi-embedded-runner/run/attempt.ts
```

从 `agent-command.ts` 可以看到，OpenClaw 在进入真正模型调用前，会先处理大量产品级问题：

- session 如何解析
- agent id 如何确定
- model override 如何应用
- thinking / verbose 等运行级别如何确定
- auth profile 如何选择
- skills 如何 hydrate
- ACP / subagent / channel provenance 如何保留
- delivery runtime 如何把结果送回原渠道
- 是否需要 model fallback

而 `pi-embedded-runner/run.ts` 更像一个“外层执行控制器”。它会处理：

- 运行 lane 和队列
- provider auth profile 轮转
- failover / retry
- context overflow 和 compaction
- context engine maintenance
- tool loop detection
- usage 统计
- session suspension
- post-compaction side effects

真正构造 Pi Agent 会话、准备工具、注入 prompt、订阅事件流的细节，则集中在 `run/attempt.ts`。

这说明 OpenClaw 的 Agent Runtime 不是一个简单的：

```text
messages -> model -> tools -> answer
```

而是一套围绕真实运行环境建立的执行系统：

```text
输入来源
  ↓
会话解析
  ↓
模型 / Provider / Auth / Fallback
  ↓
上下文 / Skills / Memory / Files / Runtime Metadata
  ↓
工具 / 沙箱 / MCP / Channel Actions
  ↓
Pi Agent Runtime
  ↓
事件流 / 结果 / 交付 / 记录
```

## 5. Channel Runtime：真实世界入口

OpenClaw 支持很多渠道：WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、IRC、Microsoft Teams、Matrix、Feishu、LINE、Mattermost、Nextcloud Talk、Nostr、Twitch、Zalo、QQ、WebChat 等。

这不是“多写几个 webhook”那么简单。

不同渠道至少会带来这些差异：

- 私聊、群聊、频道、线程的目标格式不同
- 消息 id、sender id、account id、thread id 不同
- 是否支持 markdown、附件、语音、图片、reaction 不同
- 是否需要配对、allowlist、mention gating 不同
- 回复、草稿、typing、ack、message action 的语义不同
- 安全边界不同，尤其是真实 DM 进入本地 Agent 时

因此 OpenClaw 把渠道能力拆成两层：

```text
src/channels/
  核心 Channel Runtime：消息、目标、会话、配对、安全、发送与接收

extensions/*
  具体渠道插件：Telegram、Discord、Slack、WhatsApp 等
```

这和 Nanobot 的 channels 很像，但 OpenClaw 做得更重：

- Nanobot 的 channels 更像“把不同平台消息接进 Agent”
- OpenClaw 的 channels 同时承担“真实平台接入 + 安全策略 + 插件契约 + Gateway 路由 + 多设备交付”

所以在 OpenClaw 里，Channel Runtime 不只是 UI 层，它是产品入口层，也是安全边界层。

## 6. Plugin System：把能力移出核心

OpenClaw 的一个重要工程选择是：核心保持 plugin-agnostic。

也就是说，核心不应该直接知道每个具体 Provider、Channel、Tool 的细节。具体能力通过插件系统进入：

```text
src/plugins/       插件发现、加载、注册、运行时管理
src/plugin-sdk/    给插件作者使用的稳定契约
extensions/        内置插件包
```

这带来一个很清晰的边界：

| 能力 | 应该在哪里 |
| --- | --- |
| Provider 接入 | Provider plugin |
| Channel 接入 | Channel plugin |
| Tool 扩展 | Tool plugin / SDK |
| Memory 扩展 | Memory plugin |
| Media / TTS / Search | Capability plugin |
| 核心路由、会话、安全 | OpenClaw core |

这也是 OpenClaw 和 Nanobot 的一个重要差异。

Nanobot 作为轻量系统，很多能力可以直接放在应用内部：provider、channel、memory、websocket、bridge、配置都在一个更小的工程体里协同。

OpenClaw 面向的是更长期的生态：第三方插件、官方插件、ClawHub、Plugin SDK、稳定 public surface。它必须更强调边界、契约、懒加载和热路径性能。

## 7. OpenClaw 与 Pi 的内核对应

OpenClaw 和 Pi 的关系不是“相似而已”。OpenClaw 里真的有一个 Pi embedded runner：

```text
src/agents/pi-embedded-runner/
```

它使用了 Pi 的包：

```text
@earendil-works/pi-ai
@earendil-works/pi-agent-core
@earendil-works/pi-coding-agent
```

所以 OpenClaw 的 Agent 内核可以理解为：

```text
OpenClaw 外壳
  Gateway / Channel / Plugin / Config / Security / Apps
        ↓
OpenClaw Agent Runtime
  Session / Auth / Model Routing / Tools / Sandbox / Delivery
        ↓
Embedded Pi Runner
  Pi Agent / Pi Session / Pi Model / Pi Tool Calling
```

对应关系大致如下：

| Pi 五层结构 | OpenClaw 中的对应位置 | 联系 |
| --- | --- | --- |
| `packages/ai` | `src/agents/pi-embedded-runner/model.ts`、Provider plugins、model catalog | Pi 负责模型接口抽象；OpenClaw 在外层增加 provider runtime、auth profile、model fallback、插件化 model catalog |
| `packages/agent` | `src/agents/pi-embedded-runner/run/attempt.ts` | Pi Agent loop 被嵌入到 OpenClaw 的一次 attempt 中，负责工具调用、消息推进和事件流 |
| `packages/coding-agent` | `src/agents/agent-command.ts`、`src/commands/agent/`、`src/agents/pi-embedded-runner/run.ts` | Pi 的 coding harness 在 OpenClaw 中变成 Agent 执行后端，不再只是终端 CLI |
| `packages/tui` | CLI 输出、Channel reply pipeline、Control UI、App surface | Pi 用 TUI 承担终端交互；OpenClaw 把“交互面”扩展为多渠道、多设备和 Web 控制台 |
| `packages/web-ui` | `ui/`、Gateway Web routes、Canvas、Companion Apps | Pi 的 Web UI 是嵌入式 Chat Surface；OpenClaw 的 UI 是控制平面和设备体验的一部分 |

因此，OpenClaw 不是重新发明 Pi 的 Agent loop，而是把 Pi 的内核放进更大的系统里。

可以这样理解：

```text
Pi：提供最小可复用 Agent 内核
OpenClaw：把这个内核接入真实个人助手产品系统
```

如果 Pi 关心的是“怎样让 Agent 在终端里跑起来”，OpenClaw 关心的是：

```text
怎样让这个 Agent 在我的设备、聊天软件、浏览器、插件和本地权限体系里长期运行？
```

## 8. OpenClaw 与 Nanobot 的区别和联系

### 8.1 为什么说 Nanobot 是 OpenClaw 的轻量化版本

这里的“轻量化版本”不是说 Nanobot 是 OpenClaw 的 fork，也不是说二者代码同源。

更准确地说：

**Nanobot 和 OpenClaw 面向的是同一类产品问题，但 Nanobot 选择了更轻的工程表达。**

它们都在解决：

- 多入口接入用户
- 多模型 Provider 抽象
- Agent Runtime 执行
- 工具调用
- 会话和记忆
- Web / API / Channel 输出
- 配置和部署

但是 OpenClaw 把这些问题展开成一个大型 local-first assistant 平台；Nanobot 则把这些能力压缩成一个更适合学习和快速改造的轻量系统。

### 8.2 轻量化体现在哪里

| 维度 | OpenClaw | Nanobot |
| --- | --- | --- |
| 系统定位 | 本地优先、长期运行、多设备、多渠道个人助手 | 轻量 Agent Framework / 个人助手系统 |
| 控制平面 | 独立 Gateway，承载 RPC、WebSocket、节点、事件和控制面 | 更直接的 CLI / API / WebSocket 入口 |
| Channel | 大量真实渠道 + 配对 + allowlist + target/thread/account/session 路由 | Channel 结构更轻，重点是把消息接入 Agent |
| Plugin | Plugin SDK、ClawHub、bundled plugins、公共契约、懒加载 | 扩展方式更直接，工程边界较轻 |
| Agent 内核 | OpenClaw 外层编排 + Pi embedded runner | 自己的 AgentRunner / AgentLoop / ContextBuilder |
| 安全 | DM pairing、sandbox、权限策略、doctor、配置迁移 | 安全边界较少，适合学习主干 |
| 设备 | macOS / iOS / Android companion apps、nodes、Canvas | 更偏 WebUI / bridge / channel |
| 工程规模 | 大型 TypeScript monorepo | 更容易读完和改动的轻量项目 |

因此，Nanobot 像 OpenClaw 的“轻量教学版”：

```text
OpenClaw 展示真实产品系统需要什么
Nanobot 保留个人助手的核心骨架，让学习者更容易看懂
```

### 8.3 二者的联系

Nanobot 和 OpenClaw 都可以放在同一条演进线上：

```text
LLM
  ↓
ReAct / Tool Calling
  ↓
Agent Runtime
  ↓
Session / Memory / Provider
  ↓
Channel / API / WebUI
  ↓
长期运行的个人助手系统
```

区别在于：

- Nanobot 停在“轻量完整系统”这一层，很适合让你第一次把 Agent 产品骨架看完整。
- OpenClaw 继续往前走，把真实渠道、真实设备、本地 Gateway、插件生态、安全策略和长期运行都加上。

所以学习顺序上，可以这样安排：

```text
Pi：看最小内核
Nanobot：看轻量产品骨架
OpenClaw：看完整个人助手平台
```

## 9. 如何阅读 OpenClaw 源码

OpenClaw 很大，不建议从 `src/` 全量扫起。

更好的阅读顺序是：

### 9.1 先读产品入口

```text
README.md
VISION.md
AGENTS.md
package.json
```

这四个文件回答：

- OpenClaw 想做什么
- 它把哪些能力视为核心
- 项目边界和开发规则是什么
- monorepo 里有哪些 workspace 和发布入口

### 9.2 再读 Gateway

```text
src/gateway/
src/gateway/protocol/
src/gateway/server/
src/gateway/server-methods/
```

目标不是读懂每个 server method，而是先理解：

- Gateway 是谁的控制平面
- WebSocket 和 RPC 如何承载事件
- App、Node、Channel、UI 如何连接到 Gateway

### 9.3 然后读 Agent Runtime

```text
src/agents/agent-command.ts
src/agents/command/
src/agents/pi-embedded-runner/run.ts
src/agents/pi-embedded-runner/run/attempt.ts
src/sessions/
```

这一层要看：

- 用户输入如何进入 Agent
- session key 如何决定
- model / provider / auth 如何解析
- tools / skills / context 如何准备
- Pi runner 如何被调用
- 结果如何回写和交付

### 9.4 再读 Channels

```text
src/channels/
extensions/telegram/
extensions/discord/
extensions/slack/
extensions/whatsapp/
```

先读 `src/channels/AGENTS.md`，再看核心 channel contracts。不要一开始就跳进某个渠道插件，否则很容易被平台细节淹没。

你要抓住的是：

```text
外部消息 → 标准化 message / target / session → Agent → outbound delivery
```

### 9.5 最后读 Plugin System

```text
src/plugins/
src/plugin-sdk/
extensions/
packages/plugin-sdk/
```

这一层适合理解 OpenClaw 为什么能扩展这么多能力。

重点不是记住每个插件，而是理解：

- manifest 如何描述插件
- runtime 如何加载插件
- SDK 给第三方暴露了哪些稳定面
- core 如何避免依赖具体插件实现

## 10. 本章小结

读完 Pi、Nanobot、OpenClaw，可以形成一个很清楚的三角关系。

```text
Pi
  最小 Agent 内核：模型、工具、状态、事件流、终端 harness

Nanobot
  轻量个人助手：Provider、Runtime、Channel、Memory、WebUI、Bridge

OpenClaw
  完整个人助手平台：Gateway、Plugin SDK、多渠道、多设备、安全、长期运行
```

它们不是互相替代，而是回答不同层级的问题：

| 项目 | 最适合回答的问题 |
| --- | --- |
| Pi | 一个 Agent 最小可运行内核应该长什么样？ |
| Nanobot | 一个轻量个人助手系统需要哪些核心模块？ |
| OpenClaw | 一个真实可用、长期运行、本地优先的个人助手平台需要哪些工程层？ |

如果你要学习 Agent 工程，建议先用 Pi 建立内核直觉，再用 Nanobot 理解轻量产品骨架，最后用 OpenClaw 看到真实系统会遇到的复杂度。

而 OpenClaw 最重要的启发是：

**Agent 不只是一个 loop。**

当它进入真实设备、真实用户、真实渠道和真实权限时，它会自然长出 Gateway、Channel、安全、插件、UI、App、配置、诊断和部署。

这就是从“能跑的 Agent”到“能长期陪你工作的个人助手”的距离。
