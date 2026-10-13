#!/usr/bin/env node
// 守护 kit-architecture.md 第 1 节：Definition 层零领域名词。
// 难点在于合法示例——规范 1.3 允许"先写通用规则句，领域示例放在括号或独立示例块里"。
// 纯词表扫描会把这些也判成违规，所以必须排除示例上下文。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT, CONFIG, WORDS_DIR, walk, parseFrontmatter, loadBaseline, isExempt, listBaseline, report, maskFences } from "./lib/verify-common.mjs";

const RULE = "verify-skill-generic-layer";
const SKILLS_DIR = CONFIG.gates.skillsDir;

if (process.argv.includes("--list-baseline")) { listBaseline(RULE); process.exit(0); }
const baseline = loadBaseline(RULE);
// 领域词表随 cookbook 分发，一个领域一份 domain-words/<domain>.json；宿主经 gates.domainWords 选择启用哪些，缺省全部启用。
// 词表是否存在已在读取配置时校验
const domains = CONFIG.gates.domainWords ?? readdirSync(WORDS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
const words = [...new Set(domains.flatMap((d) => JSON.parse(readFileSync(join(WORDS_DIR, `${d}.json`), "utf8")).words))];
// HR 这类拉丁词要加词边界，避免命中 HRM 之外的无关串；中文词直接匹配
// 宿主可以不启用任何领域词表（domainWords: []）：此时只做 Provider 路径检查，不做名词扫描
const pattern = words.length ? new RegExp(words.map((w) => (/^[A-Za-z]+$/.test(w) ? `\\b${w}\\b` : w)).join("|"), "g") : null;

/** 把一行里属于"示例上下文"的片段抹掉，剩下的才是规则句。 */
function stripExamples(line) {
  return line
    .replace(/`[^`]*`/g, " ")                              // 行内代码
    .replace(/（[^）]*）|\([^)]*\)/g, " ")                   // 括号内示例
    .replace(/(例如|例：|如：|比如|e\.g\.|譬如)[^。；;]*/gi, " "); // 「例如…」到句末
}

const v = [];
for (const name of readdirSync(resolve(ROOT, SKILLS_DIR))) {
  const dir = join(SKILLS_DIR, name);
  if (!existsSync(resolve(ROOT, dir, "SKILL.md"))) continue;

  // Definition = SKILL.md 正文（description 免检） + references 下非 providers 的 .md
  const files = [join(dir, "SKILL.md"), ...walk(join(dir, "references")).filter((p) => !p.includes("/providers/"))];

  for (const file of files) {
    let text = readFileSync(resolve(ROOT, file), "utf8");
    let offset = 0;
    if (file.endsWith("SKILL.md")) {
      const { body, fmRaw } = parseFrontmatter(text);
      // 正文第 1 行紧接 frontmatter 的结束分隔行：起止两行分隔符 + frontmatter 行数，正文下标 0 即该分隔行所在行
      if (fmRaw) { offset = fmRaw.split("\n").length + 1; text = body; }
    }
    // Definition 层不得写死某个领域的 Provider 路径。加一个领域 = 加一个 Provider 目录，
    // 绝不改 Definition。这类泄漏是路径而非散文里的领域词，词表扫描抓不到它。
    // 目录名不限于 ASCII；带不带尾斜杠、句末带不带句点都算写死；「.」后面紧跟字母数字的是文件名（如 providers/README.md），不算
    for (const m of text.matchAll(/providers\/([\p{L}\p{N}_-]+)(?![\p{L}\p{N}_-]|\.[\p{L}\p{N}])/gu)) {
      if (m[1] === "<domain>") continue;
      const line = text.slice(0, m.index).split("\n").length + offset;
      if (isExempt(baseline, file, m[0])) continue;
      v.push({
        file, line,
        detail: `Definition 层写死了领域 Provider 路径 «${m[0]}»`,
        fix: "改成 `references/providers/<domain>/`，领域由调用方显式给出。加领域是加 Provider 目录，不改 Definition",
      });
    }

    // 代码块整体跳过，栅栏按公共规则识别（与其他门禁一致）
    const masked = maskFences(text).split("\n");
    text.split("\n").forEach((raw, i) => {
      if (masked[i] === "" && raw !== "") return;
      const hits = pattern ? [...new Set(stripExamples(raw).match(pattern) ?? [])] : [];
      for (const h of hits) {
        if (isExempt(baseline, file, h) || isExempt(baseline, file, raw.trim())) continue;
        v.push({
          file, line: i + 1 + offset,
          detail: `规则句中出现领域名词 «${h}»：${raw.trim().slice(0, 80)}`,
          fix: "领域内容移入 references/providers/<domain>/；确需举例时写成「通用规则句 + 括号内示例」或「例如…」，换领域时只替换示例",
        });
      }
    });
  }
}
process.exit(report(RULE, v));
