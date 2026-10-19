<!-- Derived from pmYangKun/create-prd-skill; modified by PM Agentic Cookbook contributors. SPDX-License-Identifier: Apache-2.0. See LICENSE and NOTICE. -->

# create-prd — B端 PRD 生成

[English](README.en.md)

> **给 AI 一段业务描述，拿回一份 14 章结构化 PRD。**

产品经理最耗时的工作不是写 PRD，是**从零开始搭 PRD 的结构**——想清楚该有哪些章节、每个章节该写什么、哪些维度容易遗漏。这个过程往往占了写文档时间的一半以上。

create-prd 解决的就是这个问题。你提供业务上下文（一段描述、一份会议纪要、甚至一句话），AI 自动生成一份带有初始内容的 B端 PRD，包括业务背景、商业分析、产品架构、数据模型、流程设计、权限体系、运营计划——每个章节都有实质性内容，不是空模板。

对于 HR 系统领域，create-prd 会额外关注组织权限、员工/任职/档案粒度、薪酬和个税等敏感数据、周期口径、状态锁定、批量导入同步、跨模块数据流和审计追溯。它不限定产品形态，既可用于 HR SaaS，也可用于企业自研 HRM、私有化交付和二开项目。

**你要做的不是从零开始写，而是在一份 80 分的初稿上修改到 100 分。**

## 为什么生成的 PRD 质量靠谱

因为生成逻辑不是"让 AI 随便写"，而是严格基于三本经过市场验证的方法论著作：

- **《决胜B端（第二版）》** — 豆瓣 8.6 分，重印 13 次，B端从业者经典案头参考书。三层业务调研框架、十三要素五步法、ER 建模三步法、STP 市场细分等核心方法论均来自此书
- **《决胜体验设计》** — 聚焦 B端体验设计，四象限分析、六脉神剑、设计四原则等框架来自此书
- **《决胜B端 PRD 模板 v2.0》** — 标准化的 14 章 PRD 结构，定义了每个章节该写什么、怎么写

这些方法论已在华为、京东、宝洁、工商银行等上百家企业的培训和咨询中验证。create-prd 做的事情，就是**让 AI 用这套方法论帮你搭建 PRD 骨架并填充初始内容**。

## 生成的 PRD 长什么样

| 章节 | 内容 | 背后的方法论 |
|------|------|------------|
| 1. 项目背景 | 行业分析、业务现状、痛点总结 | 三层业务调研框架 |
| 2. 需求基本情况 | 需求来源、场景还原、深层动机 | 十三要素五步法 |
| 3. 商业分析 | 市场定位、竞品分析、盈利模式 | STP + 精益画布 |
| 4. 项目收益目标 | 北极星指标、量化目标、ROI 测算 | OCSM 方法论 |
| 5. 项目方案概述 | 整体方案、技术选型、里程碑 | — |
| 6. 项目范围 | 功能边界、非功能需求、排除项 | — |
| 7. 项目风险 | 风险识别、评估、应对策略 | — |
| 8-9. 术语与参考 | 专业术语定义、参考文献 | — |
| **10. 功能需求** | **架构图、ER 模型、流程图、状态机、逐模块需求详解** | **ER 建模三步法 + UML** |
| 11. 数据埋点 | 埋点规划、指标体系 | — |
| 12. 角色与权限 | RBAC 模型、数据权限 | RBAC 权限模型 |
| 13. 运营计划 | 上线推广、监控体系 | 试点六步法 |
| 14. 待决事项 | 未确认项、风险待决、后续计划 | — |

信息充分时生成实质内容；信息不足时用 `[TODO: 具体需要补充什么]` 标注缺口，不编造。

### 区分产品类型，针对性生成

B端自研系统和商业化软件的 PRD 侧重点完全不同——强行套用同一套模板，写出来的文档要么缺了关键章节、要么塞了一堆不相关的内容。

create-prd 在生成前会先做**产品定型**（商业化产品 or 企业自研 × 业务型/工具型/交易型/基础服务型 × 业务领域 × 文档范围），然后自动调整每个章节的深度和侧重：

- **商业化产品**：强化市场分析、竞品定位、盈利模式、定价策略、MVP 验证、获客转化
- **企业自研系统**：强化业务流程覆盖、组织架构适配、权限体系、数据集成、异常处理、内部推广
- **HR 系统领域**：强化组织数据权限、敏感数据保护、人员和时间口径、状态锁定、跨模块协同、导入同步幂等、审计追溯
- **功能模块级需求**：优先聚焦模块边界、页面交互、字段、业务规则、异常处理、权限和验收标准，避免把复杂模块塞进一个超长 PRD

不会用商业化模板去套自研系统，也不会让自研系统的 PRD 去写盈利模式。

## 快速开始

### 方式一：任意大模型（不需要安装任何工具）

1. 下载 [`dist/create-prd-universal-prompt.md`](dist/create-prd-universal-prompt.md)
2. 打开你常用的大模型（ChatGPT、Gemini、DeepSeek、Kimi、通义千问等均可）
3. 先粘贴 `create-prd-universal-prompt.md` 的内容
4. 再提供你的业务上下文，发送
5. 要按某个领域写时，明说领域，并把该领域 Provider 的文件（`references/providers/<domain>/` 下）一并粘贴；通用 Prompt 本身不含任何领域 Provider

> 建议使用能力较强的模型（如 GPT-4o、Claude、Gemini Pro、DeepSeek-R1）以获得更完整的生成效果。

### 方式二：Claude Code 集成

```bash
python scripts/install_skill.py
```

安装后直接使用：

```text
/create-prd
```

或者自然语言触发：
- "帮我写一个 CRM 系统的 PRD"
- "基于这个会议纪要生成产品方案"
- "我要做一个供应链管理系统，帮我出个需求文档"

## 生成流程

```
你提供业务描述
    |
阶段 0: AI 自动推断产品类型 → 你确认
    |
阶段 1: 前置章节 1-9（逐章即时输出，不用等全部写完）
    |
阶段 2: 核心章节 10（架构图 + ER 模型 + 流程图 + 状态机 + 逐模块需求）
    |
阶段 3: 后置章节 11-14
    |
阶段 4: 自动自检 → 输出待完善清单
```

商业化产品、企业自研系统、私有化交付和功能模块级需求的侧重点不同——AI 自动识别产品类型、业务领域和文档范围并调整章节深度。

## 与 check-prd 形成闭环

| 环节 | 工具 | 作用 |
|------|------|------|
| 创建 | **create-prd** | 从业务描述生成 14 章结构化 PRD 初稿 |
| 审查 | [check-prd](../check-prd/README.md) | 用 14 维度逐项检查，输出问题清单和改进建议 |

先 create 生成初稿，自己修改完善，再用 check 做质量审查。**AI 搭骨架 → 人填血肉 → AI 查漏洞**，形成完整的文档工作流。

## 验收标准接入

PRD输入要求已确认的独立验收清单，第4.2节具名引用，第10.2.1.4细化并逐行追溯；新业务口径先回改上游、确认后同步。

按最终确认需求范围引用唯一标准清单；一个范围可关联多模型/PRD。PRD只细化标准，模块入口索引清单及台账，不复制台账或把标准确认当交付验收。

## Model Experience

字符数按 Unicode code point 统计；正文不含 frontmatter，全量 references 包含 Provider 与通用 Prompt 开篇。字符数不等同于 token 数。

| 项 | 内容 |
| --- | --- |
| 常驻部分 | `name` + `description`，约 146 字符 |
| 按需加载 | `SKILL.md` 正文约 9.8k 字符（14 章骨架与字段级规则块都在正文） |
| 二级加载 | **按章逐份读**：`references/chapters/` 13 份共约 35.5k 字符，写第 N 章才读第 N 份。注意 `create-prd-ch10-functions.md` 单份就有 **14.6k 字符**，是最大的一份，写功能章节前要预留预算；`appendices/create-prd-appendix-typing.md`（3.6k）在产品定型阶段读；`appendices/create-prd-appendix-selfcheck.md`（2.1k）在收尾自检时读 |
| 领域 Provider | `references/providers/<domain>/domain-appendix.md`（HR 域约 5.6k）——仅当目标 PRD 属该领域时加载 |
| 上下文预算 | 常驻 10² / 正文 10³ / 写单章 10³–10⁴ / 全量 `references/` 约 46.8k 字符，不应一次读完 |

## 仓库结构

```text
SKILL.md                             # Claude Code skill 入口
references/chapters/                 # 各章节生成指引（13个文件）
references/appendices/               # 产品定型 + 自检指引
references/providers/hrm/domain-appendix.md
                                      # HR 系统领域适配规则（示例 Provider，不打进 dist/）
scripts/build.py                     # 构建 universal prompt
scripts/install_skill.py             # 安装为 Claude Code 技能
dist/create-prd-universal-prompt.md  # 独立可用的完整 prompt
dist/create-prd.skill                # skill 目录的 zip 包
```

## 关于作者

**杨堃**，《决胜B端》（豆瓣 8.6 分，重印 13 次）作者，B端产品专家。中国科学院大学 MBA 特聘企业导师，服务客户涵盖华为、京东、百度、宝洁、工商银行等上百家企业。

本仓库中的版本基于原开源 [`create-prd`](https://github.com/pmYangKun/create-prd-skill) skill 进行针对性优化，在保留原作者方法论框架和通用 B 端 PRD 生成能力的基础上，补充了 HR 系统领域、功能模块级 PRD、跨模块数据流一致性、Domain Model 引用、敏感数据权限与专项自检等适配能力。

## 版本历史

见 [CHANGELOG.md](CHANGELOG.md)

## 许可与派生说明

本 skill 派生自 [pmYangKun/create-prd-skill](https://github.com/pmYangKun/create-prd-skill)，依据上游的 Apache License 2.0 使用与分发。原作者及贡献者声明保留在 [NOTICE](NOTICE)，协议全文见 [LICENSE](LICENSE)。本版本包含 PM Agentic Cookbook contributors 的修改；修改文件带有相应标记。

上游 main 的授权覆盖其全部历史版本；本版本未采用上游 community 分支。上游 NOTICE 中的版权、贡献者及方法论署名保持原文。
