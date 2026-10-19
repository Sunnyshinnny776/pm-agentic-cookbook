# table-template-designer — 企业级复杂表格模版

[English](README.en.md)

把 ToB 产品里最容易出错的"数据密集型表格"从经验驱动提升为规范驱动：30+ 列、多级表头、冻结列、级联选择、条件只读，这些细节没有标准就每次从零试错。

## 什么时候用

设计表格模版、报表 UI、数据录入表、填报表格时；也包括只说"帮我设计一个表格""出个报表样式"的场景。

## 覆盖范围

标题行规范与命名格式、3～4 层分组表头、冻结列、行高一致性、级联下拉与单元格内下拉、条件只读与校验反馈。

## 代码缺陷自查

代码写完、交付之前，本 skill 要求做一次代码缺陷自查（逻辑、数据完整性、安全基础、性能、测试有效性），发现即修，向用户简述，不出报告。

| 环境 | 用什么 |
| --- | --- |
| Claude Code | 内置的 `/code-review` |
| Codex | 内置的 `/review` |
| 其它环境 | 按 `references/code-self-review.md` 的清单逐项查 |

## 使用方式

- **Claude Code 等支持 skill 的环境**：安装 `dist/table-template-designer.skill`，或把整个 skill 目录放进环境的 skill 目录
- **任意大模型**：粘贴 `dist/table-template-designer-universal-prompt.md`，再给出表格结构描述

## Model Experience

| 项 | 内容 |
| --- | --- |
| 常驻部分 | `name` + `description`，约 160 字符 |
| 按需加载 | `SKILL.md` 正文约 3.8k 字符，含全部视觉与交互规范 |
| 二级加载 | 两份都是**代码模版**，只在真正要落地该控件时读：`references/dropdown_cell.md`（2.1k，单元格内下拉）、`references/cascading_dropdown.md`（2.5k，多级联动）。只做设计不写代码时不读 |
| 上下文预算 | 常驻 10² / 正文 10³ / 全量 10³ 字符量级 |

## 目录结构

```text
SKILL.md
references/dropdown_cell.md
references/cascading_dropdown.md
references/code-self-review.md
references/universal-prompt-intro.md  # 通用 Prompt 的开篇
evals/
scripts/build.py                      # 重建 dist/
dist/                                 # 通用 Prompt 与 .skill 包
```

无 `providers/`：表格规范与领域无关，正文示例使用通用报表语境。

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。
