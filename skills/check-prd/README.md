<!-- Derived from pmYangKun/check-prd-skill; modified by PM Agentic Cookbook contributors. SPDX-License-Identifier: Apache-2.0. See LICENSE and NOTICE. -->

# check-prd — B端 PRD 质量审查

[English](README.en.md)

> **让 AI 用行业经典方法论帮你审 PRD。**

写 PRD 的人很多，能系统审 PRD 的人很少。审一份 PRD 需要同时具备业务理解、产品架构、数据建模、交互设计、商业分析等多个维度的判断力——这种能力通常需要十年以上的实战经验。

check-prd 把这种审查能力工具化了。它基于《决胜B端》系列方法论，用 **14 个维度**逐项检查你的 PRD，指出遗漏、矛盾和风险，给出具体的改进建议。

对于 HR 系统领域，check-prd 会额外检查组织数据权限、员工/任职/薪资档案等实体粒度、薪资月/考勤周期/税款所属期等时间口径、薪资和个税等敏感数据、状态锁定、批量导入同步、跨模块数据流、幂等和审计追溯。它不限定产品形态，既可用于 HR SaaS，也可用于企业自研 HRM、私有化交付和二开项目。

## 为什么这套审查框架有效

因为它不是凭空编出来的 checklist，而是从两本经过市场验证的方法论著作中提炼的：

- **《决胜B端（第二版）》** — 豆瓣 8.6 分，重印 13 次，B端从业者经典案头参考书。覆盖业务调研、产品定位、架构设计、数据建模、流程设计、需求管理的完整方法论
- **《决胜体验设计》** — 聚焦 B端体验设计，从交互原则到用户旅程到 AI 交互模式的系统框架

这两本书的方法论已经在华为、京东、宝洁、工商银行等上百家企业的培训和咨询中验证过。check-prd 做的事情，就是**让 AI 用这套方法论帮你审文档**。

## 14 个检查维度

| # | 维度 | 检查什么 |
|---|------|---------|
| 1 | 业务调研 | 业务背景是否清晰、利益方是否识别完整、业务流程是否梳理到位 |
| 2 | 产品定型 | 产品类型判断是否准确、商业属性是否明确 |
| 3 | 产品定位 | 价值主张是否清晰、目标客群是否聚焦、竞争差异是否成立 |
| 4 | 场景分析 | 核心场景是否覆盖、用户旅程是否完整、痛点是否识别到位 |
| 5 | 文档结构 | PRD 结构是否完整、章节逻辑是否自洽 |
| 6 | 产品架构 | 应用架构是否合理、模块划分是否清晰、系统边界是否明确 |
| 7 | 数据模型 | ER 模型是否完整、实体关系是否正确、关键字段是否定义 |
| 8 | 流程设计 | 业务流程是否完整、状态机是否覆盖、异常路径是否考虑 |
| 9 | 交互体验 | 页面设计是否合理、操作路径是否高效、反馈机制是否完善 |
| 10 | 商业分析 | 盈利模式是否可行、ROI 是否测算、市场定位是否合理 |
| 11 | MVP 策略 | 最小可行产品范围是否合理、验证假设是否明确 |
| 12 | 异常处理 | 边界条件是否考虑、错误处理是否完善、降级方案是否设计 |
| 13 | AI 功能 | AI 功能设计是否合理、人机协同边界是否清晰（有 AI 功能时适用） |
| 14 | 运营计划 | 上线推广方案是否完整、监控指标是否定义、迭代策略是否明确 |

每个维度独立输出检查结论，最后汇总为 P0-P3 分级的问题清单和 Top 10 改进建议。

### 区分产品类型，针对性审查

B端自研系统和商业化软件的设计逻辑差异很大——自研系统关注流程效率和内部协同，商业化产品关注市场定位和盈利模式。用同一套标准审两类 PRD，要么漏检、要么误判。

check-prd 在审查开始前会先做**产品定型**（商业化产品 or 企业自研 × 业务型/工具型/交易型/基础服务型 × 业务领域 × 文档粒度），然后自动调整每个维度的检查重点和适用性：

- **商业化产品**：加重商业分析、竞品定位、MVP 策略、定价模式的检查力度
- **企业自研系统**：加重业务流程覆盖度、权限模型、数据集成、异常处理的检查力度
- **Overview PRD**：重点审查产品/模块定位、PRD 包拆分、信息架构、跨模块边界、全局状态/权限/安全/异常基线，以及后续 Sub PRD 约束
- **HR 系统领域**：加重组织权限、敏感数据、实体粒度、时间口径、状态锁定、导入同步、跨模块数据流、审计追溯的检查力度
- **功能模块级 PRD**：重点审查本模块边界、Domain Model 一致性、涉及实体读写、页面交互、异常、权限和验收标准
- 不适用的维度自动标记跳过，不会用商业化标准去审自研系统

## 快速开始

### 方式一：任意大模型（不需要安装任何工具）

1. 下载 [`dist/check-prd-universal-prompt.md`](dist/check-prd-universal-prompt.md)
2. 打开你常用的大模型（ChatGPT、Gemini、DeepSeek、Kimi、通义千问等均可）
3. 先上传或粘贴你的 PRD
4. 再把 `check-prd-universal-prompt.md` 的内容粘贴进去，发送
5. 要做某个领域的专项检查时，明说按哪个领域审，并把该领域 Provider 的文件（`references/providers/<domain>/` 下）一并粘贴；通用 Prompt 本身不含任何领域 Provider

> 建议使用能力较强的模型（如 GPT-4o、Claude、Gemini Pro、DeepSeek-R1）以获得更好的检查效果。

### 方式二：Claude Code 集成

```bash
git clone https://github.com/Sunnyshinnny776/pm-agentic-cookbook.git
cd pm-agentic-cookbook/skills/check-prd
bash scripts/install.sh          # Mac/Linux
# .\scripts\install.ps1          # Windows PowerShell
```

安装后直接使用：

```text
/check-prd path/to/prd.pdf
```

或者自然语言触发：
- "帮我审一下这个 B端 PRD"
- "看看这份需求文档还有什么漏洞"
- "review 这个 SaaS 产品方案"

## 与 create-prd 形成闭环

| 环节 | 工具 | 作用 |
|------|------|------|
| 创建 | [create-prd](../create-prd/README.md) | 从业务描述生成 14 章结构化 PRD 初稿 |
| 审查 | **check-prd** | 用 14 维度逐项检查，输出问题清单和改进建议 |

先 create，再 check，迭代优化。

## 社区贡献

[@Scofy0123](https://github.com/Scofy0123) 基于标准版扩展了**飞书 CLI 协作版**，将 PRD 审查接入飞书文档协作闭环，支持评论回写和反馈收集。

详见分支：[check-prd-skill 飞书 CLI 协作版](https://github.com/pmYangKun/check-prd-skill/tree/check-prd-skill飞书CLI协作版(Special-tks-to-Scofy))

## Model Experience

字符数按 Unicode code point 统计；正文不含 frontmatter，全量 references 包含 Provider 与通用 Prompt 开篇。字符数不等同于 token 数。

| 项 | 内容 |
| --- | --- |
| 常驻部分 | `name` + `description`，**431 字符**。catalog description 的常见上限是 500，超出部分从**尾部**截断，而尾部正是触发短语所在——改动前先量长度，留足余量 |
| 按需加载 | `SKILL.md` 正文约 7.0k 字符 |
| 二级加载 | **按维度逐份读，不整体加载**：`references/dimensions/` 14 份共约 61.0k 字符，审到第 N 维才读第 N 份（3.0k–7.1k 不等）；`appendices/check-prd-appendix-veto.md`（4.4k）在汇总重大风险项时读，其中「问题优先级说明」与常见问题对照表在第一个维度之前读；`appendices/check-prd-appendix-guide.md`（5.8k）在生成最终报告时读，其中 2.1 节按 PRD 类型调整检查侧重的表在第一个维度之前读；`references/audit-lifecycle.md`（1.4k）每次审计都加载，规定三种审计动作在本 skill 下的范围与报告必须包含的元信息 |
| 领域 Provider | `references/providers/<domain>/domain-appendix.md`（HR 域约 10.6k）——仅当调用方明确指定了该领域时加载（被审 PRD 看起来属于某个领域不算指定），其领域风险项与维度映射由 Provider 定义，正文不复制 |
| 上下文预算 | 常驻 10² / 正文 10³ / 单维度审查 10³–10⁴ / 全量 `references/` 约 86.2k 字符，**任何情况下都不应一次读完** |

## 仓库结构

```text
SKILL.md                             # Claude Code skill 入口
references/dimensions/               # 14 个维度的源文件
references/appendices/               # 风险清单与报告模板
references/providers/hrm/domain-appendix.md
                                      # HR 系统领域专项审查规则（示例 Provider，不打进 dist/）
dist/check-prd-universal-prompt.md   # 通用 Prompt（直接拿去用）
scripts/
  install.sh / install.ps1           # 安装脚本（Mac/Linux / Windows）
  install_skill.py                   # 安装核心逻辑
  build.py                           # 重新生成通用 Prompt
  validate.py                        # 校验结构和生成物
evals/                               # eval 种子
```

## 关于作者

**杨堃**，《决胜B端》（豆瓣 8.6 分，重印 13 次）作者，B端产品专家。中国科学院大学 MBA 特聘企业导师，服务客户涵盖华为、京东、百度、宝洁、工商银行等上百家企业。

本仓库中的版本基于原开源 [`check-prd`](https://github.com/pmYangKun/check-prd-skill) skill 进行针对性优化，在保留原作者方法论框架和 14 维 B 端 PRD 审查能力的基础上，补充了 Overview PRD、HR 系统领域、功能模块级 PRD、Domain Model 一致性、跨模块数据流、敏感数据权限、导入同步幂等与专项风险项等适配能力。

## 版本历史

见 [CHANGELOG.md](CHANGELOG.md)

## 许可与派生说明

本 skill 派生自 [pmYangKun/check-prd-skill](https://github.com/pmYangKun/check-prd-skill)，依据上游的 Apache License 2.0 使用与分发。原作者及贡献者声明保留在 [NOTICE](NOTICE)，协议全文见 [LICENSE](LICENSE)。本版本包含 PM Agentic Cookbook contributors 的修改；修改文件带有相应标记。

上游 main 的授权覆盖其全部历史版本；本版本未采用上游 community 分支。上游 NOTICE 中的版权、贡献者及方法论署名保持原文。
