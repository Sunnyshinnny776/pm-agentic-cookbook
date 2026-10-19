#!/usr/bin/env node
// 章节号符禁令：文档与代码注释中不写 U+00A7（章节号符），一律写裸数字。
//
// 默认增量式：只查本轮改动过的文件。规则是「编辑一个文件时把其中的存量一并清掉」，
// 增量检查正好把它变成强制：碰了就得清干净，没碰的存量不阻断。
// --all 列出扫描根下的全部存量，只出清单，不阻断。
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, CONFIG, walk, changedFiles, loadBaseline, isExempt, listBaseline, report } from "./lib/verify-common.mjs";

const RULE = "verify-no-section-sign";
const SIGN = "\u00A7"; // 用转义写，否则脚本自己会命中自己
const EXT = [".md", ".ts", ".tsx", ".css", ".mjs", ".js", ".py", ".sh"];
const SCAN = CONFIG.gates.styleScanRoots;
// dist 是构建产物，其中的符号来自源文件。拦它等于要求"重建某个包之前先清干净无关源文件"，
// 与「编辑文件时在同一轮清除其中的章节号符」的写作规则冲突。清源文件再重建即可。
const isDist = (f) => ("/" + f).includes("/dist/");

if (process.argv.includes("--list-baseline")) { listBaseline(RULE); process.exit(0); }
const all = process.argv.includes("--all");
const baseline = loadBaseline(RULE);

let files;
if (all) {
  files = SCAN.flatMap((d) => {
    const abs = resolve(ROOT, d);
    return existsSync(abs) && statSync(abs).isFile() ? (EXT.some((e) => d.endsWith(e)) ? [d] : []) : walk(d, { ext: EXT });
  }).filter((f) => !isDist(f));
} else {
  files = changedFiles().filter(
    (f) => EXT.some((e) => f.endsWith(e)) && SCAN.some((d) => d === "." || f === d || f.startsWith(d + "/")) && !isDist(f) && existsSync(resolve(ROOT, f))
  );
}

const v = [];
for (const file of files) {
  readFileSync(resolve(ROOT, file), "utf8").split("\n").forEach((line, i) => {
    if (!line.includes(SIGN)) return;
    if (isExempt(baseline, file, line.trim())) return;
    v.push({
      file, line: i + 1,
      detail: `出现 U+00A7：${line.trim().slice(0, 80)}`,
      fix: "写裸数字（10.2.5、see 10.3）。编辑该文件时把其中每一处都清掉，不留半份",
    });
  });
}

if (all) {
  const byFile = new Map();
  for (const x of v) byFile.set(x.file, (byFile.get(x.file) ?? 0) + 1);
  console.log(`${RULE} --all：${byFile.size} 个文件、${v.length} 处存量（不阻断）`);
  [...byFile].sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`  ${String(n).padStart(4)}  ${f}`));
  process.exit(0);
}
console.log(`（增量模式：本轮改动 ${files.length} 个文件）`);
process.exit(report(RULE, v));
