# notes：阶段B 的偏差、盲区与不宣告通过

## 守护什么

`journey-audit` 阶段B 的停机条件与输出规范：偏差都有快照证据与定位；需人工视觉复核的部分单独列出；快照信息不足的点标「快照不可判定」，不推测；不宣告「流程通过」。

## 为什么这样设计

一份短旅程里放进三类点：可判定的偏差（权限）、快照里没有的信息（缺状态字段、缺驳回原因）、只有视觉才能判的徽标颜色。只测偏差测不出它会不会把盲区当成符合；只测盲区测不出维度核验有没有真的做。不提供覆盖清单，是为了看它会不会编一个覆盖度。场景选 CRM 的报价单审批，受众广，也避开 skill 采集格式里的示例节点。

## 怎么跑

1. 仓库外建空目录，`.claude/skills/journey-audit/` 放 skill 源码（排除 `evals/`、`dist/`）。
2. `fixtures/prd.md` 复制为 `docs/报价单审批需求.md`，`fixtures/journey_steps.json` 复制为 `records/报价单审批.steps.json`，`fixtures/cookbook.config.json` 复制到目录根（宿主契约，声明了模块目录、测试目录与过程记录目录；没有声明 `specMap`，被试可能因 spec 角色未声明而合规停下，判法见 `expected-points.md`「合规停下」）。
3. 新会话冷启动，原样发送 `input.md` 的「给被试的原话」。
4. 判卷由独立执行者按 `expected-points.md` 逐条勾选。
