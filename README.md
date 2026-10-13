# PM Agentic Cookbook

[English](README.en.md)

面向产品经理的 Agentic 全流程方法论 cookbook。
当前以 B 端企业产品为主，其他领域通过 Provider 扩展。

## 它解决什么问题

单个 PRD skill 能生成一份需求文档；完整的产品工作还需要确认业务依据、
建立模型、确认验收标准、连接实现与测试证据，并把发现的缺漏回改到上游。
本 cookbook 将工作流、skills、参考规则、模板和可执行门禁放在同一套结构中，
支持产品团队把这些环节接入自己的工作流程。

流程中的确认与验收由用户或维护者决定。Agent 提供产物、证据和未闭环事项，
不自行认证交付通过。领域规则通过 Provider 接入，通用指令与具体业务规则分开。

## 当前可用内容

本 checkout 包含目录骨架、文档门禁、门禁自测和 Claude Code/Codex 的 hook 注册。
`skills/`、`specs/`、`process/`、`templates/` 和 `examples/` 目前只有目录占位，
没有可安装的 skill 或完整工作流正文。门禁检查不代表真实业务验收；
DSH bundle 配置不代表运行兼容性已验证。

| 目录 | 职责 |
| --- | --- |
| `process/` | 阶段衔接、验证回路及执行职责 |
| `skills/` | 可独立使用的指令与必要参考、模板、构建脚本 |
| `specs/` | 按场景查阅的参考规则库，由宿主声明适用规则 |
| `templates/` | 工作流层的文档骨架 |
| `examples/` | 合成或可公开的使用场景 |
| `tools/` | 可执行门禁、回归测试和 hook 脚本 |

## 本地检查

依赖 Node.js 22 或更高版本、Git 和 Bash；门禁不需要安装 npm 依赖。

```bash
npm run doc-sync
npm run test:gates
```

增量文风门禁依赖完整历史及 `cookbook.config.json` 的 `gates.baseRef`。
The default base is `origin/main`. Fetch that branch before running checks in a clone.
A repository without any commits is checked through its staged and untracked files.
On pull requests, CI uses the common ancestor of the base and HEAD; on pushes to
main, it checks the current tree through the other gates, while the incremental
style gate only sees changes relative to its configured base and local changes.

Hooks 提供及时提醒，不阻止操作；实际检查结果以门禁命令和 CI 为准。
现有门禁覆盖目录/frontmatter、自包含、领域名词、宿主私有路径、决策格式、
增量文风、译本元信息及 Agent 规则薄壳。未配置决策目录时，决策格式门禁明确跳过。

## 贡献与许可

阅读[贡献指引](CONTRIBUTING.md)、[行为准则](CODE_OF_CONDUCT.md)和[安全报告说明](SECURITY.md)。
修改本仓库的 Agent 先读 [AGENTS.md](AGENTS.md)。

本仓库内容按 [Apache License 2.0](LICENSE) 授权，版权与归属声明见 [NOTICE](NOTICE)。
允许企业使用、适配与商业分发；再分发时须遵守许可中的声明保留和修改标记要求。
单独标明许可的第三方内容按其自身许可处理。
