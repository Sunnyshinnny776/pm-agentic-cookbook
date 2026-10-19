# 领域 Provider

本目录放**领域特化**的准入判据。`SKILL.md` 与 `references/` 下的其余文件是 Service Definition，通篇不含领域名词；换一个业务领域，它们一字不改。

本轮未附带任何领域 Provider，本文件同时起占位作用。

---

## 加一个领域

```
references/providers/<domain>/
  intake-appendix.md
```

`<domain>` 用短横线小写标识（如 `wms`、`crm-service`）。领域内容**只在这一层出现**。

## 一份领域附录该供什么

| 供什么 | 为什么在 Provider 而不在 Definition |
| --- | --- |
| 该领域惯常缺哪一层 | Definition 问的是"广度与深度是否够"，答的是"本领域的材料通常在异常与边界这一层就断了" |
| 该领域材料的典型权威度分布 | 哪类文件通常是决策依据、哪类通常是草稿，这是领域经验，不是通用规则 |
| 必问的领域字段与口径 | 数据类需求要问清用途、来源、计算规则；具体要问哪些字段由领域决定 |
| 术语对照的起点 | 该领域常见的同物异名、同名异物，作为一致性检查的初始词表 |
| 该领域的典型冲突模式 | 已知哪两类材料常打架，可以提前查而不是等它爆出来 |

## 三条纪律

1. **加一个领域 = 加一个 Provider 目录，绝不改 Definition。** 若发现必须改 Definition 才能容纳新领域，说明上一个领域的假设漏进了 Definition——修 Definition，不要在里面加分支。
2. **Definition 出现领域名词 = 契约泄漏**，由门禁拦截。
3. **默认值必须显式传入。** Definition 里禁止藏"未指定就按某某领域来"——隐式默认会让准入在新领域里静默产出错误结论，而不是报错。

判不出来某段该放哪时，缺省是 **Definition 写规则句、Provider 写实例**，而不是整段塞进任一侧。

完整规范见本 skill 所在 cookbook 的 Kit 架构规范（`<cookbook>/process/kit-architecture.md`）。本 skill 单独安装、取不到该规范时，按本节三条纪律与上面的判据新建 Provider 即可。
