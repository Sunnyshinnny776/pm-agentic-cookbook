#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { ROOT, COOKBOOK_ABS, CONFIG, changedFiles, maskFences, report } from "./lib/verify-common.mjs";

const RULE = "verify-changelog", violations = [];
const bad = (path, line, detail, fix) => violations.push({ file: relative(ROOT, path), line, detail, fix });
const number = "(0|[1-9][0-9]*)", date = "（[0-9]{4}-[0-9]{2}-[0-9]{2}）";
const skillHeading = new RegExp(`^v${number}\\.${number}\\.${number}(?:${date})?$`);
const rootHeading = new RegExp(`^v${number}\\.${number}\\.${number}${date}$`);
function less(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}
function check(path, root = false) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    bad(path, 1, "缺少 CHANGELOG.md", "为该 skill 添加至少一个合法版本节");
    return;
  }
  const text = maskFences(readFileSync(path, "utf8"));
  const headings = [...text.matchAll(/^ {0,3}##[ \t]+([^\n]*?)[ \t\r]*$/gm)];
  if (!headings.length) bad(path, 1, "没有版本节", "添加符合版本管理规则的二级版本标题");
  let previous;
  for (const [i, h] of headings.entries()) {
    const line = text.slice(0, h.index).split("\n").length;
    if (root && i === 0 && h[1] === "未发布") continue;
    const match = h[1].match(root ? rootHeading : skillHeading);
    if (!match) {
      bad(path, line, `版本标题格式不合规：${h[1]}`, root ? "使用顶部的 未发布 或 vX.Y.Z（YYYY-MM-DD）；未发布 只允许出现一次" : "使用 vX.Y.Z，可附全角括号日期（YYYY-MM-DD）");
      continue;
    }
    const current = match.slice(1, 4).map(BigInt);
    if (previous && !less(current, previous)) bad(path, line, "版本号必须自上而下严格递减，不能重复", "按主、次、修订号的数值顺序排列版本节");
    previous = current;
  }
}

const changed = new Set(changedFiles());
// The shared style scan ignores pure renames; version history must include both moved paths.
const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
try {
  const diffs = [["--cached"]];
  if (spawnSync("git", ["rev-parse", "--verify", "-q", "HEAD"], { cwd: ROOT, stdio: "ignore" }).status === 0) {
    const base = git(["merge-base", CONFIG.gates.baseRef, "HEAD"]).trim();
    diffs.push(["HEAD"], [`${base}..HEAD`]);
  }
  for (const args of diffs) {
    const paths = git(["diff", "--name-only", "--no-renames", "-z", "--relative", ...args]);
    for (const path of paths.split("\0").filter(Boolean)) changed.add(path);
  }
} catch (e) {
  console.error(`${RULE}：无法确定重命名改动：${e.message}`);
  process.exit(2);
}
for (const name of readdirSync(resolve(ROOT, CONFIG.gates.skillsDir))) {
  const skill = join(ROOT, CONFIG.gates.skillsDir, name);
  if (name.startsWith(".") || !statSync(skill).isDirectory()) continue;
  const changelog = join(skill, "CHANGELOG.md"), prefix = relative(ROOT, skill) + "/";
  check(changelog);
  const behavior = [...changed].some((p) => p === prefix + "SKILL.md" || ["references/", "scripts/", "templates/"].some((dir) => p.startsWith(prefix + dir)));
  if (behavior && !changed.has(prefix + "CHANGELOG.md")) bad(changelog, 1, "skill 行为文件有改动，CHANGELOG.md 未同步", "在该 skill 的 CHANGELOG.md 顶部记录此次变化");
}
const rootChangelog = join(COOKBOOK_ABS, "CHANGELOG.md");
if (existsSync(rootChangelog)) check(rootChangelog, true);
process.exit(report(RULE, violations));
