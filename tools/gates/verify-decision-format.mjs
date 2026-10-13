#!/usr/bin/env node
// 守护 pm-agentic-cookbook/process/decision-archive.md 的档案格式。
// 格式乱了查重就失效，同一个问题会被反复重开——这是档案存在的全部理由。
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname, basename, relative } from "node:path";
import { ROOT, CONFIG, walk, loadBaseline, isExempt, listBaseline, report, relativeLinks, maskFences } from "./lib/verify-common.mjs";

const RULE = "verify-decision-format";
const DIR = CONFIG.gates.decisionsDir;
const LIFECYCLES = ["proposed", "implemented", "rejected"];
const CLASSES = ["domain", "product", "spec", "process", "kit"];
// 各 lifecycle 的必需章节，与 decision-archive.md 第 2 节「正文骨架」一致；rejected 保留提案期章节
const PROPOSAL = ["## Problem", "## Proposal", "## Alternatives considered", "## Acceptance criteria", "## Risks"];
const REQUIRED = {
  proposed: PROPOSAL,
  implemented: ["## Problem", "## Decision", "## Alternatives considered", "## Consequences"],
  rejected: PROPOSAL,
};

if (process.argv.includes("--list-baseline")) { listBaseline(RULE); process.exit(0); }
if (!DIR) {
  console.log(`- ${RULE}：cookbook.config.json 未声明 gates.decisionsDir，本项目不使用决策档案，跳过`);
  process.exit(0);
}
const baseline = loadBaseline(RULE);
const v = [];
const add = (file, line, detail, fix) => v.push({ file, line, detail, fix });

// 索引是派生数据，会与档案漂移——不允许存在
for (const bad of ["INDEX.md", "index.md"]) {
  const p = join(DIR, bad);
  if (existsSync(resolve(ROOT, p)))
    add(p, null, "决策档案目录下不允许有索引文件", "删掉它。索引是派生数据，会与档案本身漂移；要检索就直接 grep 档案目录");
}

for (const file of walk(DIR)) {
  if (basename(file) === "README.md") continue;
  const parts = relative(DIR, file).split("/");
  const lifecycle = parts[0], cls = parts[1];
  if (!LIFECYCLES.includes(lifecycle)) {
    add(file, null, `不在 ${LIFECYCLES.join(" / ")} 之下`, "移进对应生命周期目录");
    continue;
  }
  if (!CLASSES.includes(cls))
    add(file, null, `class «${cls}» 不属闭集`, `只能是 ${CLASSES.join(" / ")}`);

  const name = basename(file);
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(name))
    add(file, null, `文件名 «${name}» 不合规`, "用 yyyy-mm-dd-topic-title.md，topic 全小写短横线");

  const text = readFileSync(resolve(ROOT, file), "utf8");
  const L = text.split("\n");

  if (!L[0]?.startsWith("# Decision: ")) add(file, 1, "首行不是 «# Decision: <标题>»", "改成 # Decision: 加标题");
  if (L[1] !== "") add(file, 2, "第二行不是空行", "前三行固定：标题 / 空行 / Status");
  if (!L[2]?.startsWith("Status: ")) add(file, 3, "第三行不是 «Status: <lifecycle>»", "补上 Status 行");
  else {
    // rejected 档案按规范写成「rejected — <一行原因>」，只拿第一个词与目录比对
    const full = L[2].slice(8).trim();
    const st = full.split(/\s/)[0];
    if (st !== lifecycle)
      add(file, 3, `Status «${st}» 与所在目录 «${lifecycle}» 不一致`, "两者必须一致，否则档案的生命周期无从判断");
    else if (lifecycle === "rejected" && !/^rejected\s+—\s*\S/.test(full))
      add(file, 3, "rejected 档案的 Status 没有写否决原因", "写成「Status: rejected — <一行原因>」：否决理由就记在这一行");
  }

  // 章节标题按整行匹配：「### Problem」「## Problems」都不算；代码块里的标题不算章节
  const headings = maskFences(text).split("\n").map((l) => l.trimEnd());
  for (const sec of REQUIRED[lifecycle] ?? []) {
    const at = headings.indexOf(sec);
    if (at === -1) { add(file, null, `缺 «${sec}» 章节`, `补上该章节`); continue; }
    if (sec === "## Alternatives considered") {
      const body = ("\n" + L.slice(at + 1).join("\n")).split(/\n## /)[0].trim();  // 紧跟下一个章节时正文为空
      if (body.length < 20)
        add(file, null, "«## Alternatives considered» 是空的", "写清否决了什么、为什么。这一节是档案对治「反复重开已决问题」的核心");
    }
  }

  // 相对链接可解析：行内链接与引用式链接定义都查，代码块里的不算
  for (const { raw: link, path, line } of relativeLinks(text)) {
    if (!existsSync(resolve(ROOT, dirname(file), path)) && !isExempt(baseline, file, link))
      add(file, line, `链接 «${link}» 无法解析`, "修正相对路径");
  }
}
process.exit(report(RULE, v));
