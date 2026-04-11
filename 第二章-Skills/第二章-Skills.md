# 第二章 Skills
## Overview

> [!NOTE]
> **Skill 是对 Prompt 的结构化延伸。**
> 它不是一次性任务提示，而是把某一类可复用的**做事方法、约束规则、可调用脚本和配套说明**，封装成一个可以被 Agent 反复调用的能力单元，用来让 Agent 在特定场景下稳定完成某类任务。
>
> 更直接一点说：
>
> **Prompt 解决“这次要做什么”，Skill 解决“这类事情通常该怎么做”。**
>
> 所以，**Skill 本质上是在 Agent 系统中，把零散提示词升级为可组织、可复用、可维护的能力模块。**
> 

| 小节 | 标题  | 内容 | 状态 | 
| :---: | --- | --- | :---: |
| 1 | 什么是 Skills | skill 的定义、作用、和 prompt / tool / workflow 的区别 | ✅ |
| 2 | Skills 是怎么组织的 | 一个 skill 通常由哪些文件组成、目录结构长什么样 | ✅ |
| 3 | Skills 怎么写 | skill 主体内容怎么写、常见写法、设计原则 | ✅ |
| 4 | Skills 怎么安装 | 手动安装、目录放置、注册方式、常见安装路径 |  ✅ |
| 5 | Skills 怎么使用 | 在 Agent 中如何调用、如何触发、如何调试，配一个小实践 | ✅ |
| 6 | Skills 怎么自动化生成 | 用 Agent 生成 skill 草稿、自动补全辅助文件、自动测试/修正 |  ✅ |
| 7 | Skills 设计指北 |  |  ✅ |


## 1. 什么是 Skills

➢ **定义** 基于 Agent Skills 的相关定义，可以将 Skill 理解为一个围绕特定能力组织起来的文件夹，其中封装了 **指令**、**脚本**和**资源**。Agent 会在任务过程中发现并加载相关 Skill，从而更准确、更高效地完成特定类型的工作。[Anthropic](https://github.com/anthropics/skills) 和 GitHub 对 Skill 的定义都强调了这一点：Skill 不是单独的一段提示词，而是一个可被动态加载的能力模块，其中既可以包含面向模型的说明，也可以包含可执行脚本、模板、示例和其他辅助资源。换句话说，Skill 可以看作是对某种“可复用能力”的模块化封装。

➢ **作用** 它把原本分散在 prompt、经验、脚本和参考资料中的内容，组织成一个能够被 Agent 反复调用的整体。Prompt 更多解决“这次要做什么”，而 Skill 进一步沉淀了“这类事情通常应该怎么做、需要用到哪些资源、必要时调用哪些脚本”。

➢ **区别**
Prompt 面向当前任务，Tool 面向外部操作，WorkFlow 面向全局流程，而 Skill 面向可复用能力。
<details>
<summary>Skill v.s. Prompt</summary>

<table style="width:100%; table-layout:fixed; border-collapse:collapse;" border="0">
  <tr>
    <td style="width:40%; vertical-align:top; padding:12px;">
      <b style="font-size:15px">Prompt</b>
    </td>
    <td style="width:60%; vertical-align:top; padding:12px;">
      <b style="font-size:15px">Skill</b>
    </td>
  </tr>
  <tr>
    <td style="width:40%; vertical-align:top; padding:12px; word-wrap:break-word;">
      Prompt 通常是面向当前一次任务的输入，告诉模型“这次要做什么”。
      它更偏向单次交互的任务描述，例如背景、要求、格式、限制等。
      适用于临时需求或者没有清晰可沉淀的处理流的任务。
    </td>
    <td style="width:60%; vertical-align:top; padding:12px; word-wrap:break-word;">
      Skill 则是对某一类可复用能力的封装，告诉 Agent“这类事情通常该怎么做”。
      它不只是当前任务的一段提示，还可以进一步包含：
      <ul>
        <li>稳定的执行规则</li>
        <li>结构化说明</li>
        <li>示例</li>
        <li>相关资源</li>
        <li>可调用脚本</li>
      </ul>
      适用于对某类任务清晰理解下的任务流程可控与能力的持久化。
    </td>
  </tr>
</table>


所以可以简单理解为：

Prompt：面向当前任务的临时指令。
Skill：面向某类任务的长期能力模块。

换句话说，Prompt 更像“现场要求”，而 Skill 更像“已经整理好的方法包”。
</details>

<details>
<summary>Skill v.s. Tool</summary>
    
<table style="width:100%; table-layout:fixed; border-collapse:collapse;" border="0">
  <tr>
    <td style="width:50%; vertical-align:top; padding:12px;">
      <b style="font-size:15px">Tool</b>
    </td>
    <td style="width:50%; vertical-align:top; padding:12px;">
      <b style="font-size:15px">Skill</b>
    </td>
  </tr>
  <tr>
    <td style="width:50%; vertical-align:top; padding:12px; word-wrap:break-word;">
        Tool 是 Agent 可调用的外部操作能力，重点在于“能做什么动作”。<br><br>
        例如：
        <ul>
          <li>搜索网页</li>
          <li>读取文件</li>
          <li>调用 API</li>
          <li>执行命令</li>
          <li>返回数据</li>
        </ul>
      </td>
    </td>
    <td style="width:50%; vertical-align:top; padding:12px; word-wrap:break-word;">
      Skill 则更关注“遇到某类任务时应该怎么做”。它强调的是方法、规则、步骤组织和经验沉淀，而不是具体的外部操作本身。
    </td>
  </tr>
</table>

例如：

> “使用搜索接口检索网页”是 Tool
“先拆分关键词、再多轮检索、最后交叉验证信息”是 Skill

因此：

Tool 提供操作能力
Skill 提供使用这些能力的方法

一个 Skill 内部可以调用多个 Tool，但 Skill 本身不是 Tool。
</details>

<details>
<summary>Skill v.s. WorkFlow</summary>
  <table style="width:100%; table-layout:fixed; border-collapse:collapse;" border="0">
    <tr>
      <td style="width:45%; vertical-align:top; padding:12px;">
        <b style="font-size:15px">WorkFlow</b>
      </td>
      <td style="width:55%; vertical-align:top; padding:12px;">
        <b style="font-size:15px">Skill</b>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top; padding:12px; word-wrap:break-word; overflow-wrap:break-word;">
        WorkFlow 强调的是全局任务的组织方式，也就是“整个任务流程怎么串起来”。<br><br>
        它通常关注：
        <ul>
          <li>步骤顺序</li>
          <li>分支条件</li>
          <li>状态流转</li>
          <li>失败重试</li>
          <li>模块协作</li>
        </ul>
          举个例子这个就是有 5 个任务组成的一个 workflow：
         <ul>
          <li>理解用户需求</li>
          <li>检索相关资料</li>
          <li>生成论文大纲</li>
          <li>撰写正文</li>
          <li>检查与修改</li>
        </ul>
      </td>
      <td style="vertical-align:top; padding:12px; word-wrap:break-word; overflow-wrap:break-word;">
        Skill 更像流程中的一个能力单元，关注的是“某一个局部任务应该怎样完成”。<br><br>
        例如，一个论文写作 Agent 的 WorkFlow 可能是：
        <ul>
          <li>理解用户需求</li>
          <li>检索相关资料</li>
          <li>生成论文大纲</li>
          <li>撰写正文</li>
          <li>检查与修改</li>
        </ul>
        其中“生成论文大纲”这一步，就可以由一个专门的 Skill 来完成。
      </td>
    </tr>
  </table>

简而言之，
WorkFlow：定义全流程如何运转
Skill：定义某个局部能力如何执行

可以把 WorkFlow 看作“任务编排层”，把 Skill 看作“能力封装层”。
</details>

## 2. Skills 是怎么组织的

在简单场景下，Skill 可以只是说明文档和示例；在更完整的工程场景下，Skill 也可以进一步绑定脚本、命令或工具入口，形成“提示 + 规则 + 执行”的完整能力单元，它的构成形式简化为：

<pre>
完整的 Skill = SKILL.md（必选）
            + resources / examples / scripts / assets（可选）
</pre>

Skill的结构可以理解为 “**leader+worker**”,leader即skill.md文件，workers即各个资源文件，存放于辅助文件夹下

### Skill的最小形态
技能市场: https://skills.sh/

```shell
skill-name/
└── SKILL.md # 大小写敏感，不接受 skill.md 或 SKILL.MD 等
    ├── YAML frontmatter 技能名称，描述等
    └── Markdown 主体部分
```

```SKILL.md``` 的结构很简单——上半部分告诉 AI"什么时候用我"，下半部分告诉 AI"具体怎么做"。

➢ **上部分--元数据（metadata）**
元数据十分重要，其作为 ```SKILL.md``` 文件中的渐进式披露系统的第一级，提供足够的信息让 Claude 知道何时应使用该技能，而无需加载全部内容。相关元数据字段如下：

```  
--- metadata
name: 这个skill的名字；
description: 该skill的作用以及何时使用该skill。
dependencies: 虚拟环境，无需多言。
---
```
➢ **下部分--正文（main body）**
正文是元数据之后的第二级详细信息，其涉及到对其他文件的描述和引用 ，因此当 大模型 在读取元数据后需要更多信息时，会访问这部分内容。这部分内容将指导模型去访问更多文件和信息
```  
--- main body
Skill 正文
---
```
### 完整结构的 Skill
具备完整结构的skill应该包括以下部分

```shell
skill-name/
├── SKILL.md          # 必须，主文件。链接skill里其他内容的入口。
│   ├── YAML frontmatter 技能名称，描述等
│   └── Markdown 主体部分
├── scripts/          # 可选，可执行脚本（Python、Bash 等）
├── references/       # 可选，按需加载的文档
└── assets/           # 可选，模板、字体、图标等
```
```scripts/``` — 写好的程序，AI 不需要读懂它，直接调用 shell 执行就行。

```references/``` — AI 在工作过程中需要查阅的参考资料。例如，样板代码，AI 直接把这套模板拷贝出来，在上面修改。

```assets/``` — 不是给 AI 看的，而是直接用在Agent 产物里的文件。


### 其他常见的结构
比较常见的结构是这样：
```shell
paper-outline/
├── SKILL.md
├── references/
│   └── example.md
└── assets/
    └── outline_template.md
```
或者：
```shell
review-analysis/
├── SKILL.md
├── references/
│   └── examples/
│       ├── input.md
│       └── output.md
└── assets/
    └── checklist.md
```
这类 Skill 仍然以 ```SKILL.md``` 为中心，有一些必要的配套资源，可能有模板、示例、清单，但未必需要脚本，适合大多数“方法明确，但又需要一点辅助材料”的任务。这也是本教程中最优先推荐的形式，因为它在复杂度和可维护性之间比较平衡。比单文件 Skill 更清晰、比大型 Skill 更容易写和维护，并且已经足够支撑大多数实际使用场景。对于初学者来说，可以优先把 Skill 先组织成这种形式：```一个主文件 + 少量参考资源 + 必要示例。```等到能力逐渐成熟、需求逐渐复杂，再继续往脚本化、配置化方向扩展。

## 3. Skills 怎么写
  一个skill是一个被 Agent 自动调用的任务模块，他应该同时包含三件东西:啥时候用（即提示词）->怎么用（接口定义） -> 用了之后干啥 （执行逻辑）。
  每一个skill都由一个文件夹组成，其中至少包含一个skill.md文件，这是核心。该文件必须以 YAML 前导块开头，用于包含名称和描述字段，这些是必需的元数据。它还可以包含其他元数据、对 Claude 的说明或参考文件、可执行脚本或工具。

### 设计原则
 三层设计原则：
 1. 简洁。
 2. 信息放在哪里&&AI的自由度 
  **信息放在哪里**
  不是所有信息都需要一开始就加载，让不同的信息在不同的时机进入上下文。包含三种类型的数据，L1（元数据）：始终在上下文中，约 100 词——AI 靠它判断要不要激活这个技能；L2（SKILL.md body）：触发后才加载，控制在 5k 词以内——操作指令；L3（scripts/references/assets）：按需使用，无上限——其中 scripts 执行而不读入，零 token 成本
  **AI的自由度**
  根据任务的要求，来指定模型使用该skill时的自由度，这个通过在skill.md里面设定即可
  3. 落地流程
  共六步
1.通过具体使用例子理解技能的功能边界与典型使用方式，明确需要解决的问题与交互形式。
2.分析例子中的可复用部分，将重复逻辑抽象为 scripts、assets 或 references 等模块化资源。
3.使用初始化脚本生成标准化 skill 目录结构，确保符合统一规范与约束。
4.进行核心编辑：实现并测试可复用资源，同时编写或更新 SKILL.md，明确技能功能、使用条件及资源调用方式。
5.使用校验工具检查技能的结构、命名与配置规范性，修复不符合要求的部分。
6.在真实使用中持续迭代，根据反馈优化 SKILL.md 与资源实现，不断提升技能效果与稳定性。
  
## 4. Skills 安装
Skill 本质上就是一个目录，所以“安装”的核心很简单：把完整的 Skill 包放到 你的 Agent 会扫描的位置。
手动安装 skill:
1. 找对网站：https://skills.sh/
2. 下载 Skill：https://github.com/vercel-labs/skills/tree/main/skills/find-skills
3. 安装路径：将 Skill 文件移动到你的 agent 扫描的文件夹（全局skills文件或项目级skills 文件）
4. 验证：问 Agent 你有什么技能。

## 5. Skills 怎么使用

**如何触发**
询问大模型："你什么时候会使用 [技能名称] 技能？" 。其会引用 description，帮助你识别触发条件是否正确。

**对skill的测试**
覆盖三个层面。
（1） 触发测试，确保技能在正确的时间加载(以创建项目为例)
（2）功能测试，验证技能产生正确的输出。
（3）性能比较，证明技能相比基线改善了结果。

调试时，当skill被加载了但是指令没有遵循时，常见的问题主要有两类：指令过于冗长或指令被埋没(在skill文件中)。
针对两种问题也提供了对应的对策，对于指令过于冗长，应该采取以下措施：
（1）保持指令的简洁性
（2）使用项目符号和编号列表进行内容规范化表达
（3）将详细说明移至单独的文件

对于指令被埋没，可以考虑：
（1）将关键指令放在顶部
（2）使用## 重要或## 关键标题(mrakdown标题语法)
（3）根据需要重复重点内容

## 6. skills 自动生成
Skill 自动生成目前有两种方案，其一是自然语言生成 Skill，其二是海量数据生成 Skill。前者一般口头描述生成简单skill 或缓慢确定 skill。后者通过大量数据直接提取出一般模式并转化为 Skill🌟。

推荐使用 Anthropic 家的 [skill-creator](https://skills.sh/anthropics/skills/skill-creator)。skill-creator 可以：从自然语言描述生成技能；生成带有正确前置元数据的 SKILL.md；建议触发短语和结构；审查现有技能并提供改进建议；基于你遇到的边缘情况或失败案例进行迭代改进。

推荐看[技能蒸馏](https://github.com/xixu-me/awesome-persona-distill-skills)🌟，这部分内容是在思考什么样的数据能够被用来提取和归纳出一个复杂的系统。学会鞭策你的 Agent 从海量输入里拟合出来一个目标技能。

## 8. Skills 设计指北
规范与常见错误（可选）
 避免深层嵌套引用 — 所有 reference 文件应该从 SKILL.md 直接链接，不要 A → B → C 式嵌套
长文件加目录 — 超过 100 行的 reference 文件要在顶部加 TOC，方便 Codex 预览全貌

|错误	|后果	|修正|
| :---: | --- | :---: |
|触发条件放在 body 里	|body 是触发后才加载的，晚了 | 放 frontmatter description|
|"When to Use This Skill" 写在 body	|同上，Codex 已经决定用了才看到	|移到 description|
|参考细节塞进 SKILL.md	|body 膨胀，信息密度下降|	拆到 references/，body 只放引用链接|
|确定性操作写成文字指令	|AI 每次重新理解，可能出错	|封装成 scripts/，执行不读入|
|references 互相引用	|AI 需要多跳获取信息	|所有 references 从 SKILL.md 直接链接|
|SKILL.md 和 references 内容重复	|浪费 token，更新时可能不一致	|信息只在一处存在|

# 首周作业
1. 蒸馏投毒：这么晚了还在蒸？你蒸得动吗你？赛博力工跑路喽～
  > [投毒.Skill](https://github.com/OhMyYuwan/Poison-Skill)
2. 基于 GAN 架构的高纯度蒸馏：你以为喂完资料就躺平了，该不是蒸馏出了傻瓜？我测测你的纯度。
  > [天工.Skill](https://github.com/OhMyYuwan/TianGong-Skill)


----
## 参考
- Github 库：https://github.com/anthropics/skills 
https://github.com/datawhalechina/hello-agents/blob/main 详细阐述skill
- 文章 https://agentskills.io/home
- 视频  https://www.bilibili.com/video/BV1TKrfBUEQv/
- Github 库：蒸馏同事 https://github.com/titanwings/colleague-skill?tab=readme-ov-file
- Github 库：万物皆可蒸馏 https://github.com/xixu-me/awesome-persona-distill-skills


## 资源
<div align="center">
  <table>
    <tr>
      <td width="720" style="border:1px solid #d0d7de; border-radius:18px; padding:22px; background:#f6f8fa;">
        <h2 style="margin:0 0 10px 0;">MemoTrace</h2>
        <p style="margin:0 0 14px 0;">
          微信对话数据导出
        </p>
        <p style="margin:0 0 8px 0;">
          <strong>链接：</strong>
          <a href="https://pan.quark.cn/s/f7873edbf343">点击打开</a>
        </p>
        <p style="margin:0 0 8px 0;">
          <strong>提取码：</strong><code>b46w</code>
        </p>
        <p style="margin:0;">
          <strong>夸克口令：</strong><code>/~ae583Y6TEM~:/</code>
        </p>
      </td>
    </tr>
  </table>
</div>
----
<div align="center">
  <table>
    <tr>
      <td width="720" style="border:1px solid #d0d7de; border-radius:18px; padding:22px; background:#f6f8fa;">
        <h2 style="margin:0 0 10px 0;">致谢</h2>
        <p style="margin:0 0 14px 0;">@pixd28，@Yuwan0编写本章内容。
        </p>
      </td>
    </tr>
  </table>
</div>