# ui-generator — 从 PRD 生成高保真可交互原型

[English](README.en.md)

把已审计的 PRD 变成可点、可走流程的前端原型（React + TypeScript + Tailwind），支持 T 型布局与角色隔离的企业级视觉。

## 什么时候用

要求生成原型、做页面、出 Demo、做高保真、写前端 UI 时；也包括只说"把 PRD 变成可以看的东西"的场景。

## 落地约束

- 复用宿主项目的共享组件与全局元数据，不在页面内新建局部版本。
- 数据访问走模块的 service 层，页面不直接碰存储。
- 金额、状态、反馈文案遵循宿主项目的 spec；具体规范由调用方在请求里指明加载哪些 spec。
- 宿主没有 UI/UX 规则时，提示用户后按 skill 自带的默认 UI/UX 规则生成，并在交付说明里写明；用户给出自己的规则位置，就改用那一套。

复杂表格场景与 `table-template-designer` 配合使用。

## 代码缺陷自查

代码写完、交付之前，本 skill 要求做一次代码缺陷自查（逻辑、数据完整性、安全基础、性能、测试有效性），发现即修，向用户简述，不出报告。

| 环境 | 用什么 |
| --- | --- |
| Claude Code | 内置的 `/code-review` |
| Codex | 内置的 `/review` |
| 其它环境 | 按 `references/code-self-review.md` 的清单逐项查 |

## 使用方式

- **Claude Code 等支持 skill 的环境**：安装 `dist/ui-generator.skill`，或把整个 skill 目录放进环境的 skill 目录
- **任意大模型**：粘贴 `dist/ui-generator-universal-prompt.md`，再给出 PRD 与项目的 UI/UX 规则；没有项目规则时，通用 Prompt 附带的默认规则生效

## Model Experience

| 项 | 内容 |
| --- | --- |
| 常驻部分 | `name` + `description`，约 190 字符 |
| 按需加载 | `SKILL.md` 正文约 3k 字符 |
| 二级加载 | `templates/tob_design_tokens.css`（设计令牌）在落地样式时读；`references/default-uiux-rules.md`（默认 UI/UX 规则）只在宿主没有 UI/UX 规则时读；`references/code-self-review.md` 在交付前自查时读。其余"二级材料"是**宿主项目的 spec 与 PRD**，由 Consumer 在请求中显式给出路径——这是它与其他 skill 最大的不同：变化的部分主要在宿主侧 |
| 上下文预算 | 常驻 10² / 正文 10³ 字符量级；宿主没有 UI/UX 规则时，默认规则带来约 10⁴ 字符的二级加载；其余开销主要来自被传入的 PRD 与 spec |

## 目录结构

```text
SKILL.md
references/code-self-review.md        # 代码缺陷自查清单
references/default-uiux-rules.md      # 默认 UI/UX 规则（宿主没有规则时用）
references/universal-prompt-intro.md  # 通用 Prompt 的开篇
templates/tob_design_tokens.css       # 设计令牌
scripts/scaffold_app.py               # 脚手架
scripts/build.py                      # 重建 dist/
dist/                                 # 通用 Prompt 与 .skill 包
```

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。
