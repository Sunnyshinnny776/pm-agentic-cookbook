# input：跨对象漂移

> **本文件分两部分。** 「给被试的原话」可以原样交给被试；**「给执行者的说明」绝不能进被试的上下文**——它含判定意图与答案线索。

---

## 给执行者的说明

- 被试环境必须干净：在宿主项目仓库之外的空目录，只装本 skill（装载时排除 `evals/` 与 `dist/`），fixture 复制到不含 case 名的中性路径。
- 被试只拿到下面的原话与 fixture 路径，不拿到 `expected-points.md`。
- 判卷由另一个独立执行者完成，给它 `expected-points.md`、被试报告全文与 fixture。

装载示例：

```bash
mkdir -p ~/eval-ca/.claude/skills/consistency-audit ~/eval-ca/work
rsync -a --exclude 'evals/' --exclude 'dist/' <kit>/skills/consistency-audit/ ~/eval-ca/.claude/skills/consistency-audit/
cp -r <kit>/skills/consistency-audit/evals/cases/cross-object-drift/fixtures/. ~/eval-ca/work/
cd ~/eval-ca && claude
```

---

## 给被试的原话

> 请做一次一致性审计。Oracle 是 `work/spec.md` 和 `work/permission-registry.md`；被核对对象是 `work/src/` 下的两份代码和 `work/flow.md`。这是独立审计，首轮，报告写到 `work/consistency-report.md`。
