#!/usr/bin/env node
// 守护 process/kit-architecture.md「宿主契约」一节：cookbook 的通用内容不写宿主的私有路径。
// 宿主的目录约定经 cookbook.config.json 的 host 一节声明，skill 与文档只引用契约字段。
// 禁止的路径片段由宿主在 gates.hostPrivatePatterns 中声明；行内代码与示例里出现同样算，因为路径几乎都写在那里。
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { ROOT, COOKBOOK, CONFIG, walk, loadBaseline, isExempt, listBaseline, report } from "./lib/verify-common.mjs";

const RULE = "verify-skill-host-paths";
const EXT = [".md", ".mjs", ".js", ".ts", ".tsx", ".py", ".sh", ".ps1", ".json", ".css", ".html", ".txt", ".yml", ".yaml"];

if (process.argv.includes("--list-baseline")) { listBaseline(RULE); process.exit(0); }
const patterns = CONFIG.gates.hostPrivatePatterns;
if (!patterns.length) {
  console.log(`- ${RULE}：cookbook.config.json 未声明 gates.hostPrivatePatterns，跳过`);
  process.exit(0);
}
// 本门禁守护 cookbook 自身的内容：cookbook 经符号链接等方式接入、不在宿主仓库内时，它的内容不由本宿主维护
if (COOKBOOK === null) {
  console.log(`- ${RULE}：cookbook 不在宿主仓库内，其内容不由本宿主维护，跳过`);
  process.exit(0);
}
const baseline = loadBaseline(RULE);
if (baseline.some((e) => e.exactLine !== undefined &&
  (typeof e.exactLine !== "string" || !e.exactLine.trim() || /[\r\n]/.test(e.exactLine)))) {
  console.error(`${RULE}：exactLine 必须是非空的单行字符串`);
  process.exit(2);
}

// 领域 Provider、skill 评测语料与版本记录允许写具体项目的内容；skill 的 dist/ 是构建产物；门禁自测的夹具不是 cookbook 的通用内容。
// 按相对 cookbook 的路径匹配：cookbook 本身放在宿主的 examples/ 一类目录下时，不能把整个 cookbook 排除掉
// skill 内的位置：cookbook 自带的 skills/，以及 gates.skillsDir 落在 cookbook 内时的那个目录
const esc = (x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
const skillRoots = [...new Set(["skills", relative(COOKBOOK, CONFIG.gates.skillsDir)])].filter((d) => d && !d.startsWith(".."));
const inSkill = (sub) => new RegExp(`^/(${skillRoots.map(esc).join("|")})/[^/]+/${sub}/`);
const SKIP = [inSkill("references/providers"), inSkill("evals"), inSkill("dist"), /(^|\/)CHANGELOG\.md$/, /^\/tools\/gates\/test\//];
// cookbook 就是宿主根时，宿主自己的配置与豁免清单里必然写着这些模式，不属于 cookbook 的通用内容
const HOST_FILES = new Set(COOKBOOK === "." ? ["cookbook.config.json", CONFIG.gates.baselineFile].filter(Boolean) : []);
const files = walk(COOKBOOK, { ext: EXT }).filter((f) => !HOST_FILES.has(f) && !SKIP.some((re) => re.test("/" + relative(COOKBOOK, f))));

const v = [];
for (const file of files) {
  readFileSync(resolve(ROOT, file), "utf8").split("\n").forEach((line, i) => {
    const allowed = baseline.filter((e) => e.exactLine === undefined || e.exactLine === line.replace(/\r$/, ""));
    for (const p of patterns) {
      if (!line.includes(p) || isExempt(allowed, file, p)) continue;
      v.push({
        file, line: i + 1,
        detail: `写了宿主私有路径 «${p}»：${line.trim().slice(0, 80)}`,
        fix: "改为引用宿主契约字段（host.specMap、host.moduleDocs 等），或写成与宿主无关的通用描述",
      });
    }
  });
}
process.exit(report(RULE, v));
