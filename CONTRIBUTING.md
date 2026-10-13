# 贡献指引

[English](CONTRIBUTING.en.md)

欢迎提交可复现问题、合成案例、Provider 和有依据的通用规则提案。
请阅读[行为准则](CODE_OF_CONDUCT.md)。安全问题按 [SECURITY.md](SECURITY.md) 报告。

## 修改与验证

External contributors fork the repository and create a focused branch. Agents
explicitly authorized by the maintainer may use repository task branches such as
`codex/<task>`, `claude/<task>` or `antigravity/<task>`. Submit changes through a pull
request to `main`; the maintainer reviews and merges it. Keep commit messages,
branch names, PR titles and Git workflow instructions in English. Use Conventional
Commit messages, preserve the contributor's author identity, and obtain explicit
authorization before committing, pushing or opening a PR on someone else's behalf.

变更说明写明具体问题、结果、受影响载体、实跑验证和仍未覆盖的边界。
提交前运行 `npm run doc-sync` 与 `npm run test:gates`。修改门禁时补能证明违规被拒绝、
合法输入通过的回归用例。门禁成功只证明对应检查完成，不构成维护者验收。

## Skill 与规则的职责

Definition 定义通用任务、输入、输出与停机条件，不能携带领域名词；
Provider 提供显式选择的领域规则；Consumer 给出完整请求、领域及宿主约定。
skill 引用的执行必需内容应在自己的目录内；指向 cookbook 流程的可选指针要附带
单独安装时的降级说明。修改正文或参考文件后运行该 skill 的构建脚本，
重建 `dist/` 并更新版本与 CHANGELOG。评测从源目录运行，不放进安装包。

新增共享规则走“spec-capture 提议 → 维护者裁定”：提交触发场景、证据、
适用边界、真实备选、最小归属位置和验证方法。Agent 不自动批准新规则。
审计类 skill 的修改须由独立执行者核对，作者不得审计自己的产物。

## 中文权威与英文同步

有 `.en.md` 的文档以中文原文为权威。改变规则或含义时先改中文，
再同步英文；禁止只改英文规则。译本的开头声明中文权威，元信息固定为：

```yaml
---
authority: zh
translation_of: README.md
source_version: <raw-git-blob-hash>
---
```

`translation_of` 指同目录的中文原文件名。英文内容同步完成后，从仓库根运行：

```bash
git hash-object --no-filters README.md
```

将结果写入对应译本的 `source_version`，再运行 `npm run doc-sync`。
`--no-filters` 保证记录原文件字节，不受本地 Git filters 影响。
译本滞后会警告；原文缺失或元信息非法会失败。
`AGENTS.md`、`CLAUDE.md`、`GEMINI.md`、`AGENT_GUIDE.md`、`llms.txt` 只有英文一份，
不采用 sidecar；标准 LICENSE 保留许可原文。

## Agent 规则文件

本仓贡献者的注册位于 `.claude/settings.json` 与 `.codex/hooks.json`，按仓库根目录定位脚本。
`tools/hooks/` 中的注册样例用于把 cookbook 嵌入其他宿主，默认 cookbook 位于宿主根目录下的
`pm-agentic-cookbook/`；位置不同时按样例说明调整路径前缀。

`AGENTS.md` 是贡献者侧唯一权威。`CLAUDE.md` 与 `GEMINI.md` 第一行以宿主支持的
`@AGENTS.md` 或 `@./AGENTS.md` 导入它，后面只放宿主集成信息。
两个薄壳最多 40 行，不重复共享规则；门禁拒绝规则、权限、Git 工作流等规则类标题。
`AGENTS.md` 首段必须区分使用工具包与修改工具包。

## 授权与内容边界

只提交你有权按项目许可贡献的内容，保留已有版权和许可声明。
提交贡献不转移原作者版权；除明确另作声明或另有协议，提交纳入项目的贡献
按 Apache-2.0 授权。分发修改文件时标明修改，并保留适用的 `NOTICE` 内容。
不要提交客户数据、凭据、私有路径或外部参考资料。案例使用合成数据或已明确获准公开的材料。
