# 第七章 Hermes Agent 实践：会从经验中沉淀技能的 Agent

## Overview

> [!NOTE]
>
> **Hermes Agent 的核心特征是 self-improving。**
>
> 它和 Pi、Nanobot、OpenClaw 都不一样。Pi 让我们看到最小 coding agent 内核；Nanobot 让我们看到轻量个人助手骨架；OpenClaw 让我们看到本地优先、多渠道、多设备的完整个人助手平台。
>
> Hermes 最值得读的地方，是它把 Agent 的“越用越顺手”工程化了：
>
> - 会话会持久化到 SQLite
> - 历史会话可以被全文检索和摘要召回
> - 用户偏好可以写进 memory
> - 可复用工作方法可以沉淀成 skill
> - 一次任务结束后，会启动后台 review fork
> - review fork 会判断是否需要更新 memory 或 skill
> - skill 的创建、修改、使用、来源都会被记录
>
> 所以 Hermes 不是只在当前上下文里“显得聪明”，而是在尝试建立一个闭环：
>
> **对话经验 → 反思 → 记忆 / 技能沉淀 → 下一次更适应用户 → 再反思。**

| 小节 | 标题 | 内容 | 状态 |
| :---: | --- | --- | :---: |
| 1 | 为什么读 Hermes | 从 Agent Runtime 走向学习闭环 | ✅ |
| 2 | Hermes 的总体结构 | CLI / Gateway / AIAgent / Tools / Memory / Skills | ✅ |
| 3 | 三种经验形态 | runtime messages、SQLite sessions、skill files | ✅ |
| 4 | 自进化闭环 | 会话结束后的 background review fork | ✅ |
| 5 | Memory：记住用户是谁 | 偏好、身份、状态和长期画像 | ✅ |
| 6 | Session Recall：找回过去做过什么 | SQLite FTS 与 LLM 摘要 | ✅ |
| 7 | Skills：把经验变成做事方法 | SKILL.md、support files、usage telemetry | ✅ |
| 8 | 为什么越用越适应用户 | 偏好进入 memory 和 task skill | ✅ |
| 9 | 为什么越用越强大靠谱 | 技法沉淀、错误修正、技能自我维护 | ✅ |
| 10 | 与 Pi / Nanobot / OpenClaw 的区别 | 四个项目的定位关系 | ✅ |
| 11 | 如何阅读 Hermes 源码 | 从 `run_agent.py` 到 skill manager | ✅ |
| 12 | 本章小结 | 用 Hermes 理解学习型 Agent | ✅ |
| 附录 | 本章参考的 ACP 解析线索 | Hermes 的 ACP 项目地图与自进化切片 | ✅ |

---

## 1. 为什么读 Hermes

前面三章，我们已经从三个方向理解 Agent：

```text
Pi：最小 Agent 内核
Nanobot：轻量个人助手骨架
OpenClaw：完整个人助手平台
```

Hermes Agent 则回答另一个问题：

```text
Agent 如何越用越了解你，越用越会做事？
```

很多 Agent 都能保存聊天记录，也能接入向量数据库。但 Hermes 的特别之处不只是“有记忆”，而是它把经验分成几类，并给每一类不同的保存方式：

- 用户是谁、偏好什么，进入 memory
- 过去做过哪些事，进入 session store 和 session search
- 某类任务以后应该怎么做，进入 skills
- skill 是否被创建、查看、修改、使用，进入 usage telemetry

也就是说，它并不把所有东西都丢进一个“长期记忆池”里，而是尝试区分：

```text
用户画像：我应该如何对待这个用户
历史会话：以前发生过什么
程序性技能：以后遇到这类任务应该怎么做
```

这就是 Hermes 最值得学习的地方：它把“Agent 学习”从一个抽象口号，拆成了可以落盘、可以召回、可以修改、可以审计的工程对象。

## 2. Hermes 的总体结构

Hermes 是一个 Python 为主的 Agent 项目，同时带有 TUI、Web、Gateway、插件、技能库和多种终端后端。

先抓住这几条主线：

| 层级 | 关键路径 | 作用 |
| --- | --- | --- |
| CLI | `cli.py`、`hermes_cli/` | 交互式命令行、slash command、配置、模型切换 |
| Agent Loop | `run_agent.py` | `AIAgent` 主循环、工具调用、上下文、后台自我改进 |
| Tool Runtime | `model_tools.py`、`tools/`、`toolsets.py` | 工具发现、工具执行、toolset 管理 |
| Session Store | `hermes_state.py`、`gateway/session.py` | SQLite 会话、消息、FTS 检索、恢复 |
| Memory Plugins | `plugins/memory/*` | mem0、honcho、supermemory、hindsight 等长期记忆后端 |
| Skill System | `skills/`、`optional-skills/`、`tools/skill_manager_tool.py` | 内置技能、可选技能、用户本地技能、技能管理工具 |
| Gateway | `gateway/` | Telegram、Discord、Slack、WhatsApp、Signal 等消息入口 |
| TUI / Web | `ui-tui/`、`tui_gateway/`、`web/` | 终端 UI、JSON-RPC 后端、浏览器界面 |
| Environments | `tools/environments/` | local、Docker、SSH、Modal、Daytona、Singularity 等执行环境 |

如果用一句话概括：

```text
Hermes = AIAgent 主循环 + 工具系统 + 会话持久化 + 记忆插件 + 技能库 + 后台自我改进 review
```

## 3. 三种经验形态

理解 Hermes 的自进化，必须先区分三种数据形态。

### 3.1 runtime conversation messages

这是当前对话运行时内存中的消息列表。

它包含用户消息、助手消息、工具调用、工具结果、reasoning、token_count 等字段。Agent 当前 turn 如何继续推理，主要看这份运行时消息。

关键点是：Hermes 的当前 turn 技能沉淀路径，首先使用的是这份运行时 `messages_snapshot`，不是先从数据库里把聊天记录读回来。

### 3.2 SQLite sessions

`hermes_state.py` 会把会话和消息持久化到：

```text
~/.hermes/state.db
```

里面有两类核心表：

| 表 | 作用 |
| --- | --- |
| `sessions` | 保存会话元信息，如 session id、source、user、model、system prompt、parent session、token、cost、title |
| `messages` | 保存每条消息，如 role、content、tool_calls、tool_name、reasoning、finish_reason、token_count |

此外，Hermes 还建立 FTS 索引：

```text
messages_fts
messages_fts_trigram
```

这些索引用来支持跨会话搜索和历史召回。

### 3.3 skill files

真正的技能沉淀会落到用户本地技能库：

```text
~/.hermes/skills/<name>/SKILL.md
~/.hermes/skills/<category>/<name>/SKILL.md
```

一个 skill 不只是记忆，它更像“程序性知识”：

- 做某类任务时应该遵循什么流程
- 用户讨厌什么格式和风格
- 哪些坑要避开
- 哪些验证脚本可以复用
- 哪些模板可以直接复制再改
- 哪些参考资料以后还要看

所以 Hermes 的经验沉淀不是单层的：

```text
运行时消息：当前任务怎么继续
SQLite 会话：过去发生过什么
Memory：用户是谁，偏好什么
Skill：以后这类任务应该怎么做
```

## 4. 自进化闭环：background review fork

Hermes 的自进化核心在 `run_agent.py` 的 background memory / skill review。

主对话完成后，Hermes 会判断是否需要 review。触发条件大致是：

- 本轮有 final response
- 对话没有被 interrupt
- memory 或 skill review 达到触发条件
- `skill_manage` 等必要工具可用

触发后，它不会在主对话里继续占用用户等待时间，而是 fork 出一个安静的后台 review agent：

```text
main conversation finished
  ↓
messages_snapshot = list(messages)
  ↓
spawn background AIAgent
  ↓
review_agent.run_conversation(
    user_message=review_prompt,
    conversation_history=messages_snapshot,
)
  ↓
review agent decides whether to call memory / skill tools
```

这个 review fork 有几个重要特点：

- 继承主会话的 provider、model、base_url、api_key、credential pool
- 使用 `enabled_toolsets=["memory", "skills"]`
- `quiet_mode=True`
- `max_iterations=16`
- stdout / stderr 被重定向
- 危险命令审批会自动 deny
- memory / skill nudge interval 被设为 0，避免递归 review
- 最后只向用户显示紧凑的 self-improvement summary

这说明 Hermes 的学习不是“让主 Agent 一边工作一边分心整理笔记”，而是：

```text
主 Agent 先完成任务
后台 Agent 再安静复盘
复盘结果写入 memory / skills
```

这是一个非常重要的工程设计。它让学习过程不阻塞主任务，也避免把反思过程混进用户正在等待的答案里。

## 5. Memory：记住用户是谁

Hermes 的 memory 关注的是“用户是谁”和“用户希望我怎么对待他”。

后台 memory review prompt 会问：

- 用户有没有透露个人信息、身份、偏好、目标？
- 用户有没有表达希望 Agent 如何工作？
- 用户有没有表现出稳定的风格、格式、语气、流程偏好？

如果有，review fork 会用 memory 工具保存。

这一层适合保存：

- 用户喜欢简短还是详细
- 用户希望先给结论还是先分析
- 用户常用的项目、环境、工作方式
- 用户对某类输出格式的偏好
- 用户长期目标或个人背景

但 Hermes 不是把所有偏好只写进 memory。它还强调：当用户纠正的是某类任务的做法时，应该同时进入 skill。

比如用户说：

```text
以后帮我改网页时，不要只写方案，直接改代码并检查路径。
```

这既是用户偏好，也是“网页修改任务”这个技能的操作规则。Memory 记录“用户喜欢直接落地”，Skill 记录“做网页修改时要直接编辑、挂载、验证路径”。

## 6. Session Recall：找回过去做过什么

Hermes 的 `session_search` 是另一种长期经验。

它不是创建 skill 的主路径，但它能让 Agent 回忆过去的会话。

流程是：

```text
query
  ↓
SQLite FTS / LIKE 搜索消息
  ↓
按 session 聚合结果
  ↓
加载完整会话消息
  ↓
格式化成 transcript
  ↓
辅助模型摘要
  ↓
返回与当前问题相关的历史经验
```

格式化后的 transcript 类似：

```text
[USER]: ...

[ASSISTANT]: ...

[ASSISTANT]: [Called: skill_view, terminal]

[TOOL:terminal]: ...
```

辅助摘要会关注：

- 用户当时想做什么
- Agent 做了什么
- 结果是什么
- 有哪些重要命令、文件、URL、技术细节
- 还有哪些 unresolved items

这让 Hermes 不只依赖当前窗口，也能跨 session 找回旧经验。

可以把 session recall 理解成：

```text
Memory 记住人
Session Search 记住事
Skill 记住做法
```

## 7. Skills：把经验变成做事方法

Hermes 的 skill 是最关键的程序性记忆。

后台 skill review prompt 非常主动。它认为很多会话都值得至少产生一个小更新，但也明确排除 transient failure 和 one-off task narrative。

它的优先级是：

1. 优先 patch 当前会话已经加载或查看过的 skill
2. 如果不合适，patch 一个已有的 class-level umbrella skill
3. 如果细节太多，把内容写进已有 skill 的 support files
4. 只有没有合适 umbrella 时，才创建新的 class-level skill

这很重要。

Hermes 不鼓励：

```text
今天修了一个 bug -> 创建一个“修复今天这个 bug”的 skill
```

它鼓励：

```text
今天修 bug 时学到一种可复用方法
  -> patch “debugging” 或 “frontend-testing” 这类 umbrella skill
  -> 把具体日志和复现步骤写进 references/
```

技能文件由 `skill_manage` 工具写入。它支持：

- `create`
- `patch`
- `edit`
- `delete`
- `write_file`
- `remove_file`

`SKILL.md` 必须包含 YAML frontmatter，至少要有：

```yaml
---
name: ...
description: ...
---
```

support files 只能写入这些目录：

```text
references/
templates/
scripts/
assets/
```

这让 skill 不只是一个 prompt，而是一个小型能力包：

```text
SKILL.md：触发条件和工作规则
references/：经验材料、问题记录、外部资料摘录
templates/：可复制的起始文件
scripts/：可重复运行的验证或生成脚本
assets/：辅助资源
```

## 8. 为什么 Hermes 越用越适应用户

Hermes 适应用户，主要靠两条线。

第一条是 memory：

```text
用户表达偏好
  ↓
后台 review 判断值得保存
  ↓
memory 工具保存
  ↓
后续会话加载用户画像
```

这让 Hermes 逐渐知道：

- 用户喜欢什么语气
- 用户讨厌什么输出方式
- 用户经常做什么类型的任务
- 用户希望 Agent 更主动还是更克制

第二条是 skill：

```text
用户纠正某类任务做法
  ↓
后台 review 判断这是任务级偏好
  ↓
patch 对应 skill
  ↓
下次做同类任务时，skill 直接改变工作方式
```

这比只靠 memory 更强。

因为 memory 更像“关于用户的事实”，而 skill 更像“做这类任务的规程”。当用户说“不要这样做，要那样做”时，Hermes 会尝试把它写进相关任务技能，让下一次执行同类任务时直接继承这个规程。

于是，Hermes 的适应不是一句“我记住了”，而是：

```text
记住用户偏好
  +
修改对应任务技能
  =
下一次行为真的变化
```

## 9. 为什么 Hermes 越用越强大靠谱

Hermes 变强，不是因为模型本身更新了，而是因为它把成功经验和失败修正沉淀到了可复用结构里。

它会捕捉这些信号：

- 用户纠正了工作流程
- 某个工具使用方式被证明有效
- 某个调试路径很有价值
- 某个 skill 缺步骤、过时或错误
- 某类任务需要固定验证脚本
- 某类输出需要固定模板

这些经验会进入 skill 或 support files。下一次遇到类似任务时，Agent 不需要重新摸索。

更关键的是，Hermes 对“不要保存什么”也很谨慎。

它明确避免把这些内容变成长期规则：

- 当前机器缺某个二进制
- 某次 fresh install 的临时错误
- 一次命令未配置 credentials
- “某工具坏了”这种负面结论
- 已经通过重试解决的瞬时问题
- 一次性的任务叙事

这解决了学习型 Agent 的一个大坑：

```text
如果什么都学，Agent 会越来越偏执。
如果只学可迁移经验，Agent 才会越来越靠谱。
```

Hermes 的 review prompt 正是在做这个筛选：保存技术、流程、偏好和可复用规程；不保存暂时环境故障和一次性噪声。

## 10. 与 Pi / Nanobot / OpenClaw 的区别

把四个项目放在一起，可以这样理解：

| 项目 | 核心问题 | 关键词 |
| --- | --- | --- |
| Pi | 一个 Agent 最小可运行内核是什么 | model API、Agent Runtime、tool loop、TUI |
| Nanobot | 一个轻量个人助手骨架如何组织 | provider、runtime、context、channel、memory、webui |
| OpenClaw | 一个真实本地个人助手平台需要什么 | Gateway、plugin SDK、multi-channel、apps、security |
| Hermes | 一个 Agent 如何从经验中学习 | memory、session recall、skills、background review |

它们之间不是互相替代，而是关注不同层面。

Pi 更像 Agent 的骨架。

Nanobot 把骨架组装成轻量助手。

OpenClaw 把助手扩展成 local-first 平台。

Hermes 则问：这个助手如何随着使用变得更懂用户、更会做事？

如果用一句话区分：

```text
Pi：怎么跑起来
Nanobot：怎么成为轻量助手
OpenClaw：怎么进入真实设备和渠道
Hermes：怎么从每次使用中沉淀经验
```

## 11. 如何阅读 Hermes 源码

Hermes 的源码很大，不建议一上来读所有工具和插件。

推荐顺序如下。

### 11.1 先读项目入口

```text
README.md
AGENTS.md
pyproject.toml
package.json
```

先确认 Hermes 的产品定位、安装方式、主要入口、Python / Node 组件边界。

### 11.2 读 AIAgent 主循环

```text
run_agent.py
```

重点看：

- `AIAgent`
- `run_conversation`
- tool loop
- memory / skill review prompts
- `_spawn_background_review`
- final response 之后的 review trigger

这里是理解 Hermes 的主干。

### 11.3 读会话持久化

```text
hermes_state.py
gateway/session.py
```

重点看：

- `SessionDB`
- `sessions` / `messages`
- FTS indexes
- append / load / search messages

这一层解释 Hermes 如何跨会话保留历史。

### 11.4 读 session_search

```text
tools/session_search_tool.py
```

重点看：

- 如何检索历史消息
- 如何格式化 transcript
- 如何让辅助模型摘要旧会话

这一层解释 Hermes 如何“想起以前做过什么”。

### 11.5 读 skill manager

```text
tools/skill_manager_tool.py
tools/skill_provenance.py
tools/skill_usage.py
agent/skill_commands.py
```

重点看：

- skill 如何 create / patch / edit
- `SKILL.md` 如何校验
- support files 的目录限制
- background review 创建的 skill 如何标记 provenance
- skill 的 use_count / view_count / patch_count 如何记录

这一层解释 Hermes 如何把一次经验变成可复用能力。

## 12. 本章小结

Hermes 最重要的启发是：

**学习型 Agent 不应该只有“聊天历史”，还应该有分层经验系统。**

它至少需要：

```text
短期上下文：当前任务怎么继续
会话数据库：过去做过什么
历史召回：旧任务如何被搜索和摘要
用户记忆：用户是谁、偏好什么
技能库：这类任务以后应该怎么做
后台复盘：什么时候把经验写入记忆和技能
来源与 telemetry：哪些技能是 Agent 自己沉淀出来的，后来有没有被使用和修改
```

这就是 Hermes 越用越适应用户、越用越强大靠谱的原因。

它不是简单地“保存更多上下文”，而是在不断把上下文压缩成更稳定的能力：

```text
一次对话
  ↓
一次复盘
  ↓
一条 memory
  ↓
一次 skill patch
  ↓
下一次更好的执行
```

对于想做长期运行 Agent 的同学，Hermes 值得重点学习的不是某个具体工具，而是这套闭环：

```text
Experience -> Review -> Memory / Skill -> Better Future Behavior
```

