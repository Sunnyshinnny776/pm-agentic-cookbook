# consistency-audit — 一致性审计

[English](README.en.md)

> **本 skill 只回答两个对象是否一致。** 单份需求文档写得好不好、代码本身有没有缺陷，都不在它的范围内。它的产出是呈给用户裁定的证据，不宣告"一致"或"通过"。

## 它解决什么

规则写在文档里，执行在代码里；同一个数写在模型里，也画在图上；权限点登记在目录里，也镜像在代码里。**对象之间的不一致，单独审任何一个对象都看不见。**

最难发现的一类是"部分成立"：规则在常测的那条路径上做到了，在另一条同样能改变该状态的路径上没有。它通过了测试，也通过了文档审查，于是活得最久。

## 怎么做

1. **拆条目**：把 Oracle 拆成一条一个断言的可核对条目
2. **找全实现侧**：代码侧列出能改变该状态的全部入口；文档侧列出同一个名字、同一个数的全部出现处；目录与镜像用脚本做差集
3. **逐条判定**：成立 / 部分成立 / 相悖 / 缺失 / 强于规定 / 无法判定；判"缺失"必须附检索记录
4. **反方向**：实现有、Oracle 没写的行为单列
5. **取证**：高后果条目用探针、变异、脚本这类可执行证据，临时改动结束前全部还原

## 在流程里的位置

- 一个批次含两类以上被审对象（规则与代码、需求与模型、图示与模型、目录与代码镜像、测试规格与规则）时使用
- 代码实施批的独立审计用本 skill，不用需求文档的质量框架
- 由派发方指定 Oracle 与被核对对象；审计者只写报告，旧报告的治理由派发方负责

## 验收标准接入

核对验收清单与PRD、覆盖清单、测试的具名追溯、来源版本与覆盖差集；未确认或作废条目不作生效Oracle。

交付核对可审范围/标准与实现、证据及台账的一致性；四档台账事实结果与六种一致性判定分开，用户验收结论只读核查，不代签。

## Model Experience

| 项 | 内容 |
| --- | --- |
| **常驻部分** | `name` + `description`，约 **232 字符** |
| **按需加载** | `SKILL.md` 正文约 **3.4k 字符**，被显式调用或识别到"一致性审计 / 对账 / 核对实现是否符合规则 / 代码批独立审计"时加载 |
| **二级加载** | 三份 references 共约 **4.9k 字符**，按步骤读：<br>· 逐条判定时读 `verdicts.md`（1.9k）<br>· 找实现位置与选取证方法时读 `evidence-methods.md`（1.3k）<br>· 开始审计读其第 1 节、出报告读第 2 节 `report-format.md`（1.6k） |
| **领域 Provider** | `references/providers/<domain>/`——本轮未附带任何领域 Provider；该目录的 `README.md` 说明领域附录该供什么，不参与执行期加载 |
| **上下文预算** | 常驻 10² / 正文 10³ / 全量 references 10³ 字符量级；整套加载约 8.3k |

## 使用

- **Claude Code / Codex**：把本目录放进 skill 目录（项目级或用户级），点名"一致性审计"或按描述自动触发
- **任意大模型**：粘贴 `dist/consistency-audit-universal-prompt.md`，再给出 Oracle 与被核对对象

## 目录结构

```
consistency-audit/
  SKILL.md
  README.md
  CHANGELOG.md
  references/
    verdicts.md             # 六种判定、两个方向、严重度
    evidence-methods.md     # 取证方法、检索记录、临时改动还原、证据等级
    report-format.md        # 三种审计动作与报告结构
    universal-prompt-intro.md
    providers/README.md     # 领域 Provider 说明（占位）
  evals/
    trigger-evals.json
    cases/cross-object-drift/
  scripts/build.py
  dist/
```

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。
