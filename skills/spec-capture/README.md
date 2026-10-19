# spec-capture — 阶段性规则沉淀

[English](README.en.md)

阶段建设收尾时，由用户发信号触发，回看本阶段产出，把其中**可复用、已确定**的规则提炼出来，落到最小的 owning spec 或对应 skill 里。

它解决的是"同一个教训被反复重新学"：一轮返工得出的结论如果不落盘，下一轮换个页面又会重犯。

## 什么时候用

用户说"沉淀规则、提炼规则、spec capture、阶段沉淀、收口本阶段规则"时。**不由 AI 自行发起**——沉淀什么、是否成立，由用户裁定。

## 产出物

每条规则给出：规则句、归属的最小 owning spec、落点位置、以及它来自哪次返工或哪条裁定。无可沉淀时如实说"无"，不凑数。

## Model Experience

| 项 | 内容 |
| --- | --- |
| 常驻部分 | `name` + `description`，约 180 字符 |
| 按需加载 | `SKILL.md` 正文约 2.1k 字符 |
| 二级加载 | `references/capture-routine.md`（1.9k，8 步例程）在执行沉淀时读；`references/routing-map.md`（1.8k，规则归属路由）在判断"这条规则该落到哪个 spec"时读；`universal-prompt-intro.md`（0.6k）仅构建 dist 用 |
| 上下文预算 | 常驻 10² / 正文 10³ / 全量 10³ 字符量级 |

## 目录结构

```text
SKILL.md
references/capture-routine.md
references/routing-map.md
dist/
scripts/build.py
```

无 `providers/`：沉淀方法与领域无关；路由图里的 spec 路径属于宿主项目配置，通过调用时传入。

## 变更记录

见 [CHANGELOG.md](CHANGELOG.md)。
