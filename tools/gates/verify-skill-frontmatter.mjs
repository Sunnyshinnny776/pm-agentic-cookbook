#!/usr/bin/env node
// 守护 kit-architecture.md 第 2 节目录标准、第 3 节 frontmatter 标准、以及第 2 节第 4 条自包含约束。
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";
import { ROOT, COOKBOOK_ABS, CONFIG, walk, parseFrontmatter, loadBaseline, isExempt, listBaseline, report, relativeLinks, maskFences } from "./lib/verify-common.mjs";

const RULE = "verify-skill-frontmatter";
const SKILLS_DIR = CONFIG.gates.skillsDir;
const DESC_MAX = 500;
const BOOL_FIELDS = ["user-invocable", "disable-model-invocation"];
// 规范第 3 节列出的 camelCase 旧键：解析时整个 skill 被忽略，不只是该字段失效
const LEGACY_KEYS = { userInvocable: "user-invocable", modelInvocable: "disable-model-invocation", disableModelInvocation: "disable-model-invocation" };

if (process.argv.includes("--list-baseline")) { listBaseline(RULE); process.exit(0); }
const baseline = loadBaseline(RULE);
const v = [];
const add = (file, line, detail, fix) => v.push({ file, line, detail, fix });

const OWNED = ["templates/", "references/", "scripts/", "evals/", "dist/"];

// cookbook 层：cookbook 目录（按 cookbook 自身的真实位置取，在不在宿主仓库内都一样）下 skill 可能误引的内容目录——
// 流程文档、顶层模板、工具，以及各 skill。示例、宿主配置与运行产物和 skill 正文里的文件名同名是正常现象，不在其内；
// skill 的 dist/ 是构建产物
const KIT_DIR = COOKBOOK_ABS;
const KIT_SUBDIRS = ["process", "templates", "tools"];
// 行内代码里以这些目录开头的路径指向 cookbook 层（写成 <cookbook>/… 的指针按占位符跳过，由规范要求附降级说明）
const KIT_PREFIXES = [...KIT_SUBDIRS, "skills"].map((d) => d + "/");
const KIT_FILES = new Map();
for (const p of [...KIT_SUBDIRS.flatMap((d) => walk(join(KIT_DIR, d), { ext: [""] })), ...walk(SKILLS_DIR, { ext: [""] })]) {
  // 各 skill 自己的 dist/（构建产物）与 evals/（评测语料，fixture 常与宿主文件同名）不是可被引用的 cookbook 内容；
  // 目录外的路径（以 .. 开头）不是 skill
  const fromSkills = relative(SKILLS_DIR, p);
  if (!fromSkills.startsWith("..") && /^[^/]+\/(dist|evals)\//.test(fromSkills)) continue;
  const base = p.split("/").pop();
  if (!KIT_FILES.has(base)) KIT_FILES.set(base, []);
  KIT_FILES.get(base).push(p);
}
const OUTSIDE = "把被引用文件移进 skill 目录。单独分发时目录外的引用会全部断掉";

/** 查一份文档的引用是否都落在 skill 目录 dir 内。链接与 ../ 写法相对文档所在目录，内部目录路径相对 skill 根。 */
function checkSelfContained(dir, file) {
  const text = readFileSync(resolve(ROOT, file), "utf8");
  const skillRoot = resolve(ROOT, dir);
  const base = resolve(ROOT, dirname(file));
  const outside = (target) => relative(skillRoot, target).startsWith("..");
  // 行内代码路径的检查只看正文：代码块里的路径多是示例输出或命令，不是引用
  const prose = maskFences(text);
  const lineOf = (index) => prose.slice(0, index).split("\n").length;
  // 行内代码写的上溯路径同样是引用，不论指向什么类型的文件或目录：指出 skill 目录就会在单独分发时断掉（含 ./../ 写法）
  for (const m of prose.matchAll(/`(\.{1,2}\/[^`\s]*)`/g)) {
    const link = m[1].trim();
    if (outside(resolve(base, link)) && !isExempt(baseline, file, link)) add(file, lineOf(m.index), `引用 «${link}» 指向 skill 目录之外`, OUTSIDE);
  }
  for (const m of prose.matchAll(/`([^`\s]+)`/g)) {
    const link = m[1];
    // 含占位符或通配符的（如 references/providers/<domain>/）是模式，不是具体路径
    if (/[<>*{}$]/.test(link)) continue;
    // 只认 skill 自带目录开头的路径，避免把"产出落点"（如 docs/... ）误判为引用
    if (OWNED.some((d) => link.startsWith(d))) {
      const target = resolve(skillRoot, link);
      // 以内部目录开头、再借 .. 上溯的路径同样是目录外引用
      if (outside(target)) { if (!isExempt(baseline, file, link)) add(file, lineOf(m.index), `引用 «${link}» 指向 skill 目录之外`, OUTSIDE); }
      else if (!existsSync(target) && !isExempt(baseline, file, link)) add(file, lineOf(m.index), `引用 «${link}» 在 skill 目录内不存在`, OUTSIDE);
      continue;
    }
    // 以 cookbook 层目录开头的路径（process/…、tools/…、skills/<其他>/…）指向 skill 目录之外
    if (KIT_PREFIXES.some((d) => link.startsWith(d))) {
      if (!isExempt(baseline, file, link)) add(file, lineOf(m.index), `引用 «${link}» 指向 skill 目录之外的 cookbook 层`, "需要的内容写进本 skill；确需指向 cookbook 流程文档时写成 <cookbook>/process/… 并附单独分发时的降级说明");
      continue;
    }
    // 不带路径的文件名：cookbook 层里有这个文件、skill 目录内却没有，就是在引用目录外的文件（单独分发时找不到）
    if (link.includes("/") || !/\.[A-Za-z0-9]+$/.test(link)) continue;
    const hits = KIT_FILES.get(link) ?? [];
    if (hits.length && !hits.some((p) => !outside(resolve(ROOT, p))) && !isExempt(baseline, file, link))
      add(file, lineOf(m.index), `文件名 «${link}» 指向 skill 目录之外的 ${hits[0]}`, OUTSIDE);
  }
  // 行内链接与引用式链接定义都查，代码块里的不算
  for (const { raw: link, path, line } of relativeLinks(text)) {
    const target = resolve(base, path);
    if (outside(target)) { if (!isExempt(baseline, file, link)) add(file, line, `引用 «${link}» 指向 skill 目录之外`, OUTSIDE); }
    else if (!existsSync(target)) add(file, line, `引用 «${link}» 不存在`, "修正路径或补上文件");
  }
}

for (const name of readdirSync(resolve(ROOT, SKILLS_DIR))) {
  const dir = join(SKILLS_DIR, name);
  const skillMd = join(dir, "SKILL.md");
  if (!existsSync(resolve(ROOT, skillMd))) continue;

  const text = readFileSync(resolve(ROOT, skillMd), "utf8");
  const { fm } = parseFrontmatter(text);

  if (!fm) { add(skillMd, 1, "没有 frontmatter", "补 --- 包裹的 frontmatter，至少含 name 与 description"); continue; }

  // 1 目录名 === name，且 kebab-case
  if (fm.name !== name) add(skillMd, 2, `frontmatter name «${fm.name}» 与目录名 «${name}» 不一致`, "改成一致。不一致时 skill 会静默消失，不报错也唤不起来");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) add(dir, null, `目录名 «${name}» 不是 kebab-case`, "改成全小写短横线");

  // 2 必填字段
  for (const k of ["name", "description"]) if (!fm[k]) add(skillMd, 2, `frontmatter 缺 ${k}`, `补上 ${k}`);

  // 3 两个 invocation 字段：显式布尔字面量，且不得是 camelCase 变体
  for (const [legacy, kebab] of Object.entries(LEGACY_KEYS))
    if (fm[legacy] !== undefined) add(skillMd, 2, `使用了 camelCase 旧键 «${legacy}»`, `改用 «${kebab}»。旧键会让解析出错，整个 skill 从发现列表里消失`);
  for (const f of BOOL_FIELDS) {
    if (fm[f] === undefined) add(skillMd, 2, `缺 ${f}`, `显式写 true 或 false，不要依赖默认值`);
    else if (!["true", "false"].includes(fm[f])) add(skillMd, 2, `${f} 的值 «${fm[f]}» 不是布尔字面量`, "只能是 true 或 false");
  }

  // 4 bundle 内无嵌套 SKILL.md
  // dist/ 也要查：嵌套的 SKILL.md 放在哪个子目录都会让发现失败
  const nested = walk(dir, { ext: ["SKILL.md"], ignore: new Set(["node_modules", ".git"]) }).filter((p) => p !== skillMd);
  for (const n of nested) add(n, null, "bundle 内存在嵌套 SKILL.md", "只保留根部一个。更深的路径不会被扫描，也不报错");

  // 5 description 长度
  if (fm.description && fm.description.length > DESC_MAX)
    add(skillMd, 2, `description ${fm.description.length} 字符，超过 ${DESC_MAX}`, "从尾部截断会切掉触发短语，导致唤不起来。删枚举中的低信号项，保留触发关键词");

  // 6 自包含：SKILL.md 与 references/ 下各文档的引用都必须落在 skill 目录内，单独分发时才不会断
  for (const file of [skillMd, ...walk(join(dir, "references"))]) checkSelfContained(dir, file);
}

// 7 共享 reference 逐字一致：自包含迫使同一份内容在多个 skill 里各放一份，副本一旦各改各的就会漂移
const SHARED_REFERENCES = ["references/code-self-review.md"];
for (const rel of SHARED_REFERENCES) {
  const copies = readdirSync(resolve(ROOT, SKILLS_DIR))
    .map((name) => join(SKILLS_DIR, name, rel))
    .filter((p) => existsSync(resolve(ROOT, p)));
  if (copies.length < 2) continue;
  const first = readFileSync(resolve(ROOT, copies[0]), "utf8");
  for (const p of copies.slice(1)) {
    if (readFileSync(resolve(ROOT, p), "utf8") !== first)
      add(p, null, `与 «${copies[0]}» 内容不一致`, `共享 reference 的各份副本必须逐字相同：改一份就同步其余 ${copies.length - 1} 份`);
  }
}

process.exit(report(RULE, v));
