# 第十四章 ProtoCodeBase

## Overview

> [!NOTE]
>
> **ProtoCodeBase 想解决的不是“让 Agent 多写代码”，而是让 Agent 少猜一点、少重复一点、少在上下文里迷路一点。**
>
> 它背后的理想很直接：
>
> **所有软件都应该可以像积木一样被理解、拆分、复用和拼接。**
>
> 与其让 Agent 每次从空白文件开始造轮子，不如让它参考成熟的工业实现。
> 与其让 Agent 从头读完整个代码库，不如让项目主动说明自己有哪些能力、能力由哪些模块承载、代码应该从哪里进入。
> 与其把一次开发过程只留在聊天记录里，不如把用户需求、标准化 Request、专业 Plan、实际 Change 都沉淀成项目可以继续继承的工程上下文。

ProtoCodeBase 是围绕 ACP（Agent Context Protocol）展开的一套项目级协同思路。它不是单纯的文档生成，也不是给 Agent 多塞一段提示词，而是试图回答一个更底层的问题：

**当一个项目不再只由一个人维护，而是由人和多个 Agent 一起持续演化时，项目应该如何描述自己、约束修改、记录意图，并让下一次接手的 Agent 继续工作？**

完整协议内容可以参考 [ProtoCodeBase.Skill](https://github.com/OhMyYuwan/ProtoCodeBase.Skill)。

本章是从学习和使用的角度，解释 ACP 为什么存在、它的核心结构是什么，以及它如何支撑多 Agent 在同一个项目上的协同开发。

## 1. 为什么需要 ProtoCodeBase

Agentic Coding 很强，但它有一个天然问题：Agent 经常不知道自己应该继承什么。

一个成熟项目里真正有价值的东西，不只是代码文件本身，还包括：

- 这个项目解决什么问题
- 哪些功能已经存在
- 每个功能由哪些模块承载
- 哪些代码可以改，哪些代码不能乱动
- 上一次修改为什么发生
- 用户原始需求是什么
- Agent 当时怎么理解需求
- Plan 是怎么设计的
- 最终 Change 改了哪些地方

如果这些信息只存在于人的脑子里，或者散落在一次聊天记录中，那么下一个 Agent 进入项目时，就只能重新扫描代码、重新猜测意图、重新构造上下文。

这会带来三个浪费：

➢ **重复理解**
每次任务都重新读项目结构、重新判断模块边界，Token 消耗很高，而且容易读偏。

➢ **重复造轮子**
很多软件能力已经在成熟项目中反复实现过，但 Agent 如果不知道该参考哪里，就会从头写一个不成熟版本。

➢ **协同不可持续**
多个 Agent 如果只围绕文件改动工作，而没有统一的 Request、Plan、Change 结构，就很难知道彼此为什么改、改到什么阶段、后续应该如何接上。

ProtoCodeBase 的目标，就是让项目拥有一份可以被 Agent 消费的“源码说明书”和“演化账本”。

## 2. ACP 是什么

ACP 的全称是 Agent Context Protocol。按照协议自己的定义，它是一个面向 Agent 驱动软件延续与项目创建的 **software evolution governance protocol**。

更口语一点说：

**ACP 是一套让软件项目可以被 Agent 安全接手、持续修改、追踪演化的治理协议。**

它不是：

- 不是普通的项目介绍文档
- 不是 Prompt Engineering 框架
- 不是单纯的文档标准
- 也不是一个通用多 Agent 调度系统

它真正关心的是：

- 用户意图如何变成正式的工程请求
- 工程请求如何变成可审查、可执行的计划
- 计划如何变成可追踪的代码修改
- 修改如何绑定到 Git 历史
- 项目如何在多轮、多 Agent、多会话中保持可继续演化

ACP 的核心哲学可以概括成一句话：

> Code belongs to ideas, not programmers.

代码不应该只属于某个开发者的记忆。代码应该属于它背后的想法、能力和演化历史。

当这个思想成立以后，一个项目就不再只是文件树，而是可以被拆成更稳定的语义结构：这个项目有哪些能力，这些能力如何映射到模块，模块最终如何落到代码。

## 3. 从“代码优先”到“能力优先”

传统代码理解通常是从底层往上走：

```text
代码 → 函数 → 模块 → 项目
```

这种方式是Agent模仿人类程序员理解整个项目的过程，但对 Agent 来说并不总是高效。Agent 如果每次都从文件开始理解项目，很容易把大量上下文浪费在与当前需求无关的实现细节上。

ProtoCodeBase 更希望 Agent 按照另一条路径进入项目：

```text
需求 → 能力 → 模块 → 代码
```

也就是先问：

- 用户这次想改变什么能力？
- 这个能力在项目中叫什么？
- 这个能力由哪些模块承载？
- 修改这个能力时应该读哪些文件？
- 哪些边界不应该触碰？

这就是 Capability Layer 和 Support Layer 的价值。

Capability 负责说明“软件能做什么”，Support 负责说明“这些能力在项目结构中如何落地”。Agent 不必一上来全仓库扫描，而是可以沿着能力进入模块，再从模块进入代码。

这也是“软件像积木一样拼接”的关键。积木不是一堆随机塑料块，而是有规格、有接口、有组合方式的部件。软件能力也应该这样：能被命名、能被定位、能被迁移、能被组合。

## 4. ACP 的四层结构

ACP v1.0.0 把协议分成四层：

| 层级 | 是否必须 | 作用 |
| --- | --- | --- |
| Top | 必须 | 定义全局治理、层级关系、版本与一致性边界 |
| Kernel | 必须 | 定义 Intent / Request / Plan / Change、状态机、Git 绑定和追加式历史 |
| Capability | 可选 | 定义项目的语义能力，也就是用户需求对应的稳定目标词汇 |
| Support | 可选 | 定义 Agent 如何进入项目、加载上下文、理解结构和遵守修改边界 |

这四层的关系可以简化为：

```text
Top
  ↓
Kernel
  ├─ 可引用 Capability 中的语义目标
  └─ 可受 Support 中的项目规则约束

Capability 说明“能力是什么”
Support 说明“能力在哪里、怎么加载、哪里不能动”
Kernel 说明“一次修改如何被正式记录和闭环”
Top 说明“这些层之间谁说了算”
```

### Top：协议的治理层

Top 层负责定义 ACP 的总体规则。它说明 ACP 是什么、不是是什么，也规定各层之间不能越界。

比如：

- Kernel 必须存在
- Capability 和 Support 是可选层
- Capability 不能定义状态机
- Support 不能定义演化语义
- Kernel 不能解释 capability 的具体含义
- 低层不能重写高层规则

Top 层的价值在于防止协议失控。没有这一层，项目很容易把“项目说明”“能力定义”“修改历史”“Agent 操作手册”混在一起，最后又变成一坨不可维护的上下文。

### Kernel：项目演化的最小核心

Kernel 是每个 ACP 项目都必须拥有的核心层。

它定义一次软件修改必须经过的链路：

```text
Intent → Request → Plan → Change → Git
```

这里最重要的是：ACP 把 **Request** 视为最小演化单位，而不是把 commit 视为最小演化单位。

因为 commit 只能说明代码怎么变了，却不一定说明用户真正想要什么、Agent 如何理解它、执行计划是什么、哪些边界被确认过。

Kernel 中几个对象的职责可以这样理解：

| 对象 | 作用 |
| --- | --- |
| Intent | 用户的原始需求或意图 |
| Request | 被标准化后的工程请求，是一次演化的正式单位 |
| Plan | 面向执行的专业计划，说明怎么改、改哪里、如何验证 |
| Change | 实际修改记录，说明最终改了什么、验证结果如何 |
| Git Commit | 代码层面的版本绑定 |

这条链路让一次开发不再只是“Agent 改了一些文件”，而是变成可追踪的项目演化记录。

### Capability：稳定的能力词汇

Capability 层解决的是“用户需求应该指向什么”。

用户通常不会说：“请修改 `src/services/auth/login.ts` 的第 42 行。”用户更可能说：

- 登录失败时提示不清楚
- 给任务列表增加筛选
- 让视频生成支持新的比例
- 把导出功能改成异步

这些都是能力层面的表达。Capability 就是把这些能力稳定地命名出来，例如：

```text
auth.login
notification.send
video.generate
project.create
ui.theme.change
```

能力不是文件别名。一个能力现在可能由一个模块实现，未来可能拆成多个模块，但它作为“软件能做什么”的语义身份应该尽量稳定。

有了 Capability，Agent 就可以围绕能力工作，而不是围绕目录猜测工作。

### Support：项目上下文入口

Support 层解决的是“Agent 进入项目时应该先读什么、后读什么、哪里能改、哪里不能改”。

典型 Support 对象包括：

```text
.acp/support/AGENT.md
.acp/support/PROJECT_MAP.yaml
.acp/support/LOAD_RULES.yaml
.acp/support/CHANGE_POLICY.yaml
```

它们的推荐加载顺序是：

```text
AGENT.md → PROJECT_MAP → LOAD_RULES → CHANGE_POLICY
```

Support 的核心思想是：

**先理解项目上下文，再读取源码；先确定修改边界，再生成计划。**

这对大项目尤其重要。Agent 不应该默认全仓库扫描，而应该根据当前 Request 逐步加载最小必要上下文。这样既省 Token，也减少误改风险。

## 5. Request → Plan → Change

ACP 最重要的工程链路，就是把用户需求分层。

```text
用户需求 / Intent
        ↓
标准化 Request
        ↓
专业代码生成 Plan
        ↓
详细项目修改 Change
        ↓
Git 提交与验证
```

这条链路看起来比“直接让 Agent 改代码”更麻烦，但它解决的是长期协同问题。

### Intent：用户真正想要什么

Intent 是需求的来源。它来自用户，不需要被协议强行伪装成复杂对象。

例如：

> 我希望登录页在密码错误时提示更明确，并且不要暴露账号是否存在。

这句话就是 Intent。它可能不够工程化，但它包含了真正的产品意图。

### Request：把需求变成工程目标

Request 是 ACP 的最小演化单位。它不是简单复述用户原话，而是把需求整理成稳定的工程请求。

一个 Request 通常会包含：

- id
- title
- target_type
- target_id
- target_slice
- operation
- summary
- status
- created_at

例如 target_type 可以是：

- `capability`：面向某个能力
- `project`：面向项目级治理或初始化
- `custom`：项目自定义语义目标

Request 的意义在于：它把“用户想要什么”变成“项目这次正式要演化什么”。

### Plan：把目标变成可执行蓝图

Plan 不是把 Request 换一种话说一遍。

Plan 必须回答：

- 这次修改的边界是什么
- 哪些模块会受影响
- 应该从哪些入口文件开始
- 每一步准备怎么改
- 怎么验证修改成功
- 有哪些风险
- 如果失败， fallback 方向是什么

一个好的 Plan 应该能让另一个合格 Agent 接手执行或审查。

这就是多 Agent 协作的基础：一个 Agent 可以负责理解需求和制定 Plan，另一个 Agent 可以负责执行，第三个 Agent 可以负责验证，而它们共享的是结构化的工程对象，而不是一段模糊聊天记录。

### Change：记录实际发生了什么

Change 记录的是 Plan 执行之后真实发生的项目修改。

它通常会包含：

- 对应 Request
- 对应 Plan
- 修改摘要
- 受影响模块
- 状态
- 创建时间
- Git 引用
- 验证结果或备注

如果 Request 说明“为什么要改”，Plan 说明“准备怎么改”，Change 就说明“最终改成了什么”。

这让项目历史具备可审计性，也让后续 Agent 能知道当前代码不是凭空长出来的。

## 6. `.acp/` 是项目的治理层

一个典型 ACP 项目会在项目根目录携带 `.acp/`：

```text
project/
├── .acp/
│   ├── version.yaml
│   ├── kernel/
│   ├── capability/
│   └── support/
├── src/
└── ...
```

`.acp/` 提供的是项目本地的治理、路由与闭环记录，包括：

- ACP 版本声明
- 启用的 profile
- 项目治理元数据
- 能力语义路由
- Agent 加载规则
- 修改边界
- Request / Plan / Change 历史

但 `.acp/` 不是源码的替代品。它不会让 Agent 完全不读代码，也不会自动理解所有实现细节。

更准确地说：

**`.acp/` 是项目入口和治理层，不是完整实现知识库。**

它负责让 Agent 知道从哪里开始、按什么规则继续、哪些历史必须继承、哪些边界不能越过。

## 7. Agent 如何进入 ACP 项目

ACP Runtime Bootstrap 规定了 Agent 进入 ACP 模式时的基本路径。

当项目出现以下情况时，Agent 应该进入 ACP bootstrap：

- 项目包含 `.acp/version.yaml`
- 用户明确说明项目由 ACP 管理
- 外部运行时配置声明项目使用 ACP
- 当前任务要求 ACP-compatible operation

推荐读取顺序是：

```text
1. .acp/version.yaml
2. .acp/support/AGENT.md
3. .acp/support/PROJECT_MAP.yaml
4. .acp/support/LOAD_RULES.yaml
5. .acp/support/CHANGE_POLICY.yaml
6. .acp/capability/capabilities.yaml
7. 相关 .acp/kernel/* 对象
8. 根据需要读取源码
```

这套顺序背后的原则是：

**先确认协议，再确认项目规则，再确认能力和历史，最后才进入源码。**

这和普通 Agent 直接 `ls`、`rg`、全仓库扫描的方式不同。ACP 希望 Agent 的上下文摄入是渐进式的、有边界的、可解释的。

## 8. 参考成熟工业实现，而不是重复发明

ProtoCodeBase 还有一个非常重要的方向：让 Agent 参考成熟工业实现。

现实中的软件需求并不是孤立的。文件管理、权限系统、编辑器、历史记录、协作、导出、支付、部署、错误处理、审计日志、通知中心，这些能力已经在大量成熟软件中被反复验证。
我们希望这些工业软件能够按照某种协议提供其各个模块的实现方案以及模块修改的边界。

如果 Agent 每次都从零开始写，很容易得到一个“能跑但不成熟”的版本。

ProtoCodeBase 更希望形成这样的工作方式：

```text
用户提出需求
    ↓
ACP 标准化为 Request
    ↓
Capability 定位语义能力
    ↓
Support 找到项目模块和边界
    ↓
Agent 参考成熟工业模板（我们将通过 ProtoCodeBase CLI 获取各种已经解析过的代码仓库，通过协议以及少量的 Token 找到需要的功能实现）
    ↓
Plan 生成可执行修改路线
    ↓
Change 记录实际修改
```

这样，Agent 不再只是代码生成器，而更像一个会沿着成熟工程结构做二次开发的协作者。

## 9. 多 Agent 协同为什么需要协议

多 Agent 协同的难点，不是“同时启动几个 Agent”，而是它们如何共享同一个项目事实。

如果没有协议，多 Agent 很容易出现：

- A Agent 理解的需求和 B Agent 不一致
- 执行 Agent 不知道计划 Agent 的边界
- 验证 Agent 不知道哪些结果算成功
- 后续 Agent 不知道某次修改为什么发生，模块的边界在哪里
- 项目历史只剩 commit，但缺少语义解释

ACP 用 Request、Plan、Change 把协作拆成可以交接的层级：

| 协作对象 | 适合谁消费 |
| --- | --- |
| Intent | 用户、产品型 Agent |
| Request | 需求整理 Agent、项目治理 Agent |
| Plan | 架构 Agent、执行 Agent、Review Agent |
| Change | 后续维护 Agent、审计 Agent、测试 Agent |
| Git | 人类开发者、CI、发布系统 |

这样，多 Agent 不需要共享全部聊天上下文，也不需要全员记住所有代码细节。它们只需要围绕同一套项目对象协作。

## 10. ProtoCodeBase 的最终图景

ProtoCodeBase 想构建的是一种新的软件工程入口：

```text
成熟工业实现
      ↓
可复用项目能力
      ↓
ACP 能力与支持层描述
      ↓
Agent 按 Request / Plan / Change 修改
      ↓
多 Agent 可持续协作
      ↓
软件像积木一样被组合和演化
```

在这个图景里，项目不只是代码仓库，而是一个可以向 Agent 说明自己的系统。

它会告诉 Agent：

- 我是什么项目
- 我有哪些能力
- 每个能力在哪里
- 你应该先读什么
- 你不能乱动什么
- 这次需求对应哪个 Request
- 计划如何执行
- 最终 Change 如何闭环

这就是 ProtoCodeBase 的价值：

**让软件项目从 “只有人能长期理解” 变成 “Agent 也能快速持续迭代”。**

当这件事成立以后，软件开发就不再只是单次代码生成，而会变成一种可继承、可组合、可审计、可协作的持续演化过程。
