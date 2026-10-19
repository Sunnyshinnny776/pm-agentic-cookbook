# domain-modeling — ToB 数据实体与关系设计

[English](README.en.md)

把模糊的业务诉求转成精确的数据模型：实体清单、字段规范、ER 关系、计算链路、业务规则。

ToB 产品的核心复杂度在数据层。数据模型不清晰，后续生成的 PRD 和原型都会失真——所以本 skill 是全流程的第一阶段，`process/overview.md` 规定不得跳过它直接写 PRD。

## 什么时候用

用户讨论数据建模、数据库设计、ER 图、业务对象、实体关系、字段定义、数据流或业务规则提取时；也包括只说"帮我把这个业务理一下"的场景。

## 产出物

实体清单、字段定义表、Mermaid ER 图与关系明细表、计算链路流程图与触发时机、业务规则清单、自检结论。Mermaid 需通过 `scripts/validate_mermaid.py` 校验。

## 使用方式

- **Claude Code 等支持 skill 的环境**：安装 `dist/domain-modeling.skill`，或把整个 skill 目录放进环境的 skill 目录
- **任意大模型**：粘贴 `dist/domain-modeling-universal-prompt.md`，再给出业务需求描述

建模同时验证候选需求范围的业务出口与共享依赖，必要调整交用户确认；模型及最终范围确认后交接验收标准。共享实体按业务事实组织，范围可引用多模型/PRD。

## Model Experience

| 项 | 内容 |
| --- | --- |
| 常驻部分 | frontmatter 的 `name` + `description`，约 168 字符，任何会话都在上下文里 |
| 按需加载 | `SKILL.md` 正文约 3.6k 字符，被显式调用或识别到建模场景时加载 |
| 二级加载 | `references/temporal-and-event-modeling.md`（约 2k 字符）——**仅当模型涉及时态事实、集合载体或事件投递时**加载；普通实体建模不读 |
| 上下文预算 | 常驻 10² / 正文 10³ / 全量含二级加载 10³ 字符量级 |

## 目录结构

```text
SKILL.md                              # Definition
references/temporal-and-event-modeling.md
references/universal-prompt-intro.md  # 通用 Prompt 的开篇
scripts/validate_mermaid.py           # Mermaid 语法校验
scripts/build.py                      # 重建 dist/
dist/                                 # 通用 Prompt 与 .skill 包
```

无 `providers/`：本 skill 的方法论与领域无关。要加领域特化（某领域的常见实体骨架、字段口径），新建 `references/providers/<domain>/` 即可，不改 `SKILL.md`。

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。
