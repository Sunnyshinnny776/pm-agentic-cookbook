#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { COOKBOOK_ABS, ROOT, maskFences, parseFrontmatter, relativeLinks, report } from "./lib/verify-common.mjs";

const RULE = "verify-agent-guide", violations = [];
const guide = join(COOKBOOK_ABS, "AGENT_GUIDE.md"), index = join(COOKBOOK_ABS, "llms.txt");
if (!existsSync(guide) && !existsSync(index)) {
  console.log(`${RULE}：跳过（cookbook 根目录没有 AGENT_GUIDE.md 和 llms.txt）`);
  process.exit(0);
}
const label = (path) => relative(ROOT, path);
const bad = (path, detail, fix) => violations.push({ file: label(path), detail, fix });
const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
const skills = new Set();
for (const name of readdirSync(join(COOKBOOK_ABS, "skills"))) {
  const dir = join(COOKBOOK_ABS, "skills", name);
  if (name.startsWith(".") || !statSync(dir).isDirectory()) continue;
  skills.add(name);
  const entry = join(dir, "SKILL.md");
  if (!existsSync(entry)) bad(entry, "skill 目录缺少 SKILL.md", "恢复该 skill 的入口或删除无效目录");
  else if (parseFrontmatter(readFileSync(entry, "utf8")).fm?.name !== name) bad(entry, "frontmatter name 与 skill 目录不一致", "将目录名、frontmatter name 与路由表统一为同一名称");
}

if (!existsSync(guide)) bad(guide, "缺少 Agent 使用说明", "添加包含 User intent | Skill | Stage 路由表的说明");
else {
  const lines = maskFences(readFileSync(guide, "utf8")).split(/\r?\n/);
  const headings = lines.flatMap((line, i) => cells(line).join("|") === "User intent|Skill|Stage" ? [i] : []);
  if (headings.length !== 1) bad(guide, "必须有且只有一张 User intent | Skill | Stage 路由表", "恢复唯一的三列路由表；示例表放在代码块内");
  else {
    const start = headings[0], declared = new Set();
    if (cells(lines[start + 1] ?? "").length !== 3 || !cells(lines[start + 1] ?? "").every((cell) => /^:?-{3,}:?$/.test(cell))) bad(guide, "路由表缺少三列分隔行", "在表头后添加三列 Markdown 分隔行");
    else for (let i = start + 2; i < lines.length && lines[i].includes("|"); i++) {
      const row = cells(lines[i]), match = row[1]?.match(/^`([a-z0-9]+(?:-[a-z0-9]+)*)`$/);
      if (row.length !== 3 || !row[0] || !row[2] || !match) { bad(guide, `路由表第 ${i + 1} 行格式不合规`, "每行填写意图、一个由反引号包裹的 skill 名、阶段"); continue; }
      const name = match[1];
      if (declared.has(name)) bad(guide, `路由表重复 skill：${name}`, "每个 skill 保留一行路由");
      declared.add(name);
    }
    for (const name of skills) if (!declared.has(name)) bad(guide, `路由表缺少 skill：${name}`, "按当前 skills 目录补齐路由");
    for (const name of declared) if (!skills.has(name)) bad(guide, `路由表含不存在的 skill：${name}`, "删去不可用条目，或先添加完整的 skill");
  }
}

if (!existsSync(index)) bad(index, "缺少 llms.txt", "添加当前目录可用文档的索引");
else for (const link of relativeLinks(readFileSync(index, "utf8"))) {
  const target = resolve(COOKBOOK_ABS, link.path), fromRoot = relative(COOKBOOK_ABS, target);
  if (fromRoot === ".." || fromRoot.startsWith("../") || isAbsolute(fromRoot) || !existsSync(target)) {
    bad(index, `llms.txt 链接不可解析：${link.raw}`, "将链接指向当前 cookbook 内实际存在的文件或目录"); continue;
  }
  const real = relative(realpathSync(COOKBOOK_ABS), realpathSync(target));
  if (real === ".." || real.startsWith("../") || isAbsolute(real)) bad(index, `llms.txt 链接指向 cookbook 外部：${link.raw}`, "不要通过符号链接引用宿主或其他仓库的内容");
}
process.exit(report(RULE, violations));
