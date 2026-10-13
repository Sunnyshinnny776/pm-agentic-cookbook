#!/usr/bin/env node
// 中文是权威；英文 sidecar 的版本落后只警告，元信息或原文缺失则报错。
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { ROOT, COOKBOOK_ABS, CONFIG, walk, report } from "./lib/verify-common.mjs";

const RULE = "verify-translation-sync";
const AGENT_FILES = new Set(["AGENTS.md", "CLAUDE.md", "GEMINI.md", "AGENT_GUIDE.md", "llms.txt"]);
const roots = [...new Set([COOKBOOK_ABS, resolve(ROOT, CONFIG.gates.skillsDir)])];
const skillRoots = [resolve(COOKBOOK_ABS, "skills"), resolve(ROOT, CONFIG.gates.skillsDir)];
const files = [...new Set(roots.flatMap((root) => walk(root, { ext: [".en.md"] })))].filter((file) =>
  !skillRoots.some((root) => {
    const fromSkills = relative(root, resolve(ROOT, file));
    return !fromSkills.startsWith("..") && /^[^/]+\/dist\//.test(fromSkills);
  }));
const errors = [];
let stale = 0;

// 只解析译本的三字段 header；公共 skill frontmatter 的解析语义保持独立。
function translationHeader(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const delimiter = /^---[ \t]*$/;
  if (!delimiter.test(lines[0])) return null;
  const end = lines.findIndex((line, i) => i > 0 && delimiter.test(line));
  if (end === -1) return null;
  const fm = Object.create(null);
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) continue;
    const row = line.match(/^(authority|translation_of|source_version):[ \t]*(\S.*)$/);
    if (!row || Object.hasOwn(fm, row[1])) return null;
    let value = row[2].trim();
    if (value.startsWith('"')) {
      try { value = JSON.parse(value); } catch { return null; }
      if (typeof value !== "string") return null;
    } else if (value.startsWith("'")) {
      if (!/^'(?:[^']|'')*'$/.test(value)) return null;
      value = value.slice(1, -1).replace(/''/g, "'");
    } else if (/[\\'"#:\[\]{},&*!|>@`]/.test(value)) return null;
    fm[row[1]] = value;
  }
  return fm;
}

for (const file of files) {
  const expected = basename(file).replace(/\.en\.md$/, ".md");
  // Agent 入口只有英文一份，不属于中文权威 sidecar。
  if (AGENT_FILES.has(expected)) continue;
  const fm = translationHeader(readFileSync(resolve(ROOT, file), "utf8"));
  const invalid = !fm || fm.authority !== "zh" || fm.translation_of !== expected ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(fm.source_version ?? "");
  if (invalid) {
    errors.push({ file, detail: "译本元信息缺失或无效", fix: `文件头声明 authority: zh、translation_of: ${expected}、source_version: <原文 git blob hash>` });
    continue;
  }
  const source = resolve(ROOT, dirname(file), expected);
  try {
    if (!statSync(source).isFile()) throw new Error("原文不是文件");
  } catch {
    errors.push({ file, detail: `找不到原文文件：${expected}`, fix: "恢复同目录中文原文，确认译本文件名与 translation_of 对应" });
    continue;
  }
  let hash;
  try {
    hash = execFileSync("git", ["hash-object", "--no-filters", source], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (e) {
    console.error(`${RULE}：无法计算 ${file} 的原文 blob hash：${e.message}`);
    process.exit(2);
  }
  if (hash !== fm.source_version) {
    stale++;
    console.warn(`⚠ ${RULE}：译本滞后：${file}\n  source_version: ${fm.source_version}\n  原文当前版本: ${hash}\n  → 同步英文正文后更新 source_version；中文原文为准`);
  }
}

const code = report(RULE, errors);
if (stale) console.log(`- ${RULE}：${stale} 份译本滞后（warn，不阻断）`);
process.exit(code);
