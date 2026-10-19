# test-authoring — 以 PRD 为预言编写可执行测试

[English](README.en.md)

从 PRD 的业务规则、验收标准、状态机、异常处理与角色权限矩阵推导测试用例，写出可跑的单元/集成/组件测试，并产出用例文档与测试报告。

它把"实现与 PRD 之间的偏差"从不可见变成可裁定。没有这一环，走查只能抽样、无法回归。

## 不可违反的两条

- **期望值取自 PRD 口径，不照抄实现。** 测试失败优先视为实现或口径的真实发现。
- **不自我宣告通过。** 失败项如实分类为「实现缺陷」或「PRD/Mock 口径待确认」，是否通过由用户裁定。

汇报时必须说明新增测试覆盖了哪些新功能——既有用例全绿只证明"没回归"，不证明新功能对。

## 代码缺陷自查

代码写完、交付之前，本 skill 要求做一次代码缺陷自查（逻辑、数据完整性、安全基础、性能、测试有效性），发现即修，向用户简述，不出报告。

| 环境 | 用什么 |
| --- | --- |
| Claude Code | 内置的 `/code-review` |
| Codex | 内置的 `/review` |
| 其它环境 | 按 `references/code-self-review.md` 的清单逐项查 |

## 验收标准接入

用例以清单名称加编号引用已确认验收标准，记录标准级覆盖与未覆盖原因；依据冲突先回改上游，回归仅守护基线时明确不适用。

交接标准/实现基线、实际断言与覆盖路径、机器结果和未覆盖原因；计划和实跑、Mock/单元与真实集成分开。流程作者维护范围台账，用户裁定交付验收。

## Model Experience

| 项 | 内容 |
| --- | --- |
| 常驻部分 | `name` + `description`，约 197 字符 |
| 按需加载 | `SKILL.md` 正文约 3.6k 字符 |
| 二级加载 | `references/test-mapping.md`（2.6k）在从 PRD 推导用例时读；`references/test-conventions.md`（2.5k，命名/分层/裁定约定）在实际写用例与报告时读；`universal-prompt-intro.md`（0.7k）仅构建 dist 用 |
| 领域 Provider | `references/providers/<domain>/`——本仓暂无。领域特有的测试口径（如某类金额的精度约定）应放这里，不进正文 |
| 上下文预算 | 常驻 10² / 正文 10³ / 全量 10³ 字符量级 |

## 目录结构

```text
SKILL.md
references/test-mapping.md
references/test-conventions.md
references/code-self-review.md
templates/tob_test_case_spec.md       # 测试用例文档模板
templates/tob_test_report.md          # 测试报告模板
dist/
scripts/build.py
```

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。
