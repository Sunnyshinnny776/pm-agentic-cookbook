# journey-audit — 端到端旅程审计

[English](README.en.md)

以已确认验收标准、PRD 细化与提供的 spec 为预言（oracle），对**真实运行的原型**做两段式审计：阶段A 生成人工 E2E 覆盖清单，阶段B 读取录制器产出的语义快照逐维度核验。

它补的是测试补不到的那一段：单元与组件测试证明规则函数对，走查证明**流程真的能走通**且各页面口径一致。

## 两个阶段

- **阶段A（人工测试前）**：从已确认验收标准及 PRD/spec 细化的适用范围扣除 test-authoring 单测已覆盖的部分与纯视觉盲区，产出按业务关键度排序的覆盖清单，供人照单测试。
- **阶段B（人工测试后）**：读 `journey_steps.json` 与可回放脚本，按 D01–D15 维度核验流程可达、状态机一致、角色×节点权限边界、跨页面数据一致等，并与阶段A 清单做覆盖度 diff。

产出报告带 P0–P3 分级与裁定列，**显式声明需人工视觉复核的盲区与未覆盖项**——"未检出异常"不等于"无缺陷"。

## 执行者隔离

本 skill 属审计类。若当前 Agent 是被审产物的作者，必须按 `process/agent-execution-protocol.md` 派发独立子代理冷启动执行。

## 验收标准接入

阶段A旅程包含具名验收引用及标准级计划/排除/未覆盖对照；缺少可执行细化暂停受影响规划并保留标准。阶段B按映射核实际覆盖，标准和快照能直接支持的判定保留，上游细化缺口单列；来源冲突交用户裁定，始终只报告、不回改上游。

按最终范围交接标准/实现版本、实际路径、步骤定位及未覆盖和视觉盲区，供流程作者维护台账；子范围证据不自动证明集成出口。审计者不代用户验收。

## Model Experience

| 项 | 内容 |
| --- | --- |
| 常驻部分 | `name` + `description`，约 380 字符（两阶段语义需要在 description 里说清，故偏长） |
| 按需加载 | `SKILL.md` 正文约 7.0k 字符 |
| 二级加载 | 按阶段与用途分批，**不整体加载**：阶段A 读 `coverage-manifest.md`（2.6k）与 `coverage-boundary.md`（2.4k）；阶段B 读 `audit-dimensions.md`（5.1k）；采集规则用 `capture-format.md`；构建 dist 时读 `universal-prompt-intro.md`（1.6k） |
| 领域 Provider | `references/providers/<domain>/` 下的 `oracle-map.md`、`capture-anchors.md` 与 `baseline.md`——**仅加载被审模块所属领域的那一份** |
| 上下文预算 | 常驻 10² / 正文 10³ / 单阶段含 Provider 10⁴ 字符量级；全量 `references/` 约 21.0k，不应一次读完 |

## 目录结构

```text
SKILL.md
references/audit-dimensions.md        # D01–D15，域无关
references/coverage-manifest.md       # 覆盖清单的产物规约
references/coverage-boundary.md       # 语义可判 vs 必须人眼
references/capture-format.md          # 快照采集格式与锚点规则
references/providers/<domain>/        # oracle-map + capture-anchors + baseline（领域实例，不随分发包）
templates/tob_test_report.md          # 阶段B 审计报告模板
dist/                                 # 通用 prompt 与 .skill 包，只含域无关部分
scripts/build.py
```

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。
