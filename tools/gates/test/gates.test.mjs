// 门禁自测：每个用例在临时目录里建一个最小宿主仓库，放违规样本与对照样本，断言退出码与输出。
// 运行：node --test "<cookbook>/tools/gates/test/*.test.mjs"，将 <cookbook> 替换为实际路径。
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, symlinkSync, realpathSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";

const GATES = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOOKS = resolve(GATES, "../hooks");

/** 建一个临时宿主：git init + cookbook.config.json + 给定文件。返回运行门禁的函数。 */
function host(files, gatesConfig = {}) {
  const root = mkdtempSync(join(tmpdir(), "cookbook-gate-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  // 配置校验要求 skillsDir 与扫描根都存在
  mkdirSync(join(root, "skills"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  const config = { gates: { skillsDir: "skills", styleScanRoots: ["docs"], ...gatesConfig } };
  writeFileSync(join(root, "cookbook.config.json"), JSON.stringify(config));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
  const run = (gate, ...args) => {
    const r = spawnSync("node", [join(GATES, `${gate}.mjs`), ...args], {
      cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root },
    });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  const git = (...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: root, stdio: "pipe" });
  return { root, run, git, done: () => rmSync(root, { recursive: true, force: true }) };
}

const skill = (name, { fmName = name, extra = "", body = "通用规则正文。" } = {}) => ({
  [`skills/${name}/SKILL.md`]:
    `---\nname: ${fmName}\ndescription: 用于测试的 skill\nuser-invocable: true\ndisable-model-invocation: false\n${extra}---\n\n${body}\n`,
});

// verify-skill-frontmatter

test("frontmatter：合规 skill 通过", () => {
  const h = host(skill("demo-skill"));
  try { assert.equal(h.run("verify-skill-frontmatter").code, 0); } finally { h.done(); }
});

test("frontmatter：name 与目录名不一致时报错", () => {
  const h = host(skill("demo-skill", { fmName: "other-name" }));
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.equal(r.code, 1);
    assert.match(r.out, /与目录名/);
  } finally { h.done(); }
});

test("frontmatter：camelCase 变体与缺字段都被拦截", () => {
  const h = host({
    "skills/demo-skill/SKILL.md":
      "---\nname: demo-skill\ndescription: 测试\nuserInvocable: true\n---\n\n正文\n",
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.equal(r.code, 1);
    assert.match(r.out, /camelCase 旧键/);
    assert.match(r.out, /缺 disable-model-invocation/);
  } finally { h.done(); }
});

test("frontmatter：bundle 内嵌套 SKILL.md 被拦截", () => {
  const h = host({ ...skill("demo-skill"), "skills/demo-skill/references/SKILL.md": "嵌套\n" });
  try { assert.match(h.run("verify-skill-frontmatter").out, /嵌套 SKILL\.md/); } finally { h.done(); }
});

test("frontmatter：引用 skill 目录外的文件被拦截，带 reason 的豁免放行", () => {
  const files = { ...skill("demo-skill", { body: "见 [模板](../../templates/t.md)" }), "templates/t.md": "模板\n" };
  const h = host(files);
  try { assert.match(h.run("verify-skill-frontmatter").out, /指向 skill 目录之外/); } finally { h.done(); }

  const baseline = { "verify-skill-frontmatter": [{ file: "skills/demo-skill/SKILL.md", match: "../../templates/t.md", reason: "测试豁免" }] };
  const h2 = host({ ...files, "baseline.json": JSON.stringify(baseline) }, { baselineFile: "baseline.json" });
  try { assert.equal(h2.run("verify-skill-frontmatter").code, 0); } finally { h2.done(); }
});

test("豁免清单：缺 reason 的条目让门禁直接拒绝", () => {
  const baseline = { "verify-skill-frontmatter": [{ file: "skills/demo-skill/SKILL.md" }] };
  const h = host({ ...skill("demo-skill"), "baseline.json": JSON.stringify(baseline) }, { baselineFile: "baseline.json" });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.equal(r.code, 2);
    assert.match(r.out, /缺 reason/);
  } finally { h.done(); }
});

// verify-skill-generic-layer

test("通用层：规则句中的领域名词被拦截", () => {
  const h = host(skill("demo-skill", { body: "按薪资口径汇总数据。" }), { domainWords: ["hrm"] });
  try {
    const r = h.run("verify-skill-generic-layer");
    assert.equal(r.code, 1);
    assert.match(r.out, /领域名词 «薪资»/);
  } finally { h.done(); }
});

test("通用层：括号内与「例如」引导的示例放行", () => {
  const body = "按统一口径汇总数据（如薪资）。例如：薪资项目。";
  const h = host(skill("demo-skill", { body }), { domainWords: ["hrm"] });
  try { assert.equal(h.run("verify-skill-generic-layer").code, 0); } finally { h.done(); }
});

test("通用层：写死领域 Provider 路径被拦截", () => {
  const h = host(skill("demo-skill", { body: "读取 references/providers/hrm/domain-appendix.md。" }), { domainWords: ["hrm"] });
  try { assert.match(h.run("verify-skill-generic-layer").out, /写死了领域 Provider 路径/); } finally { h.done(); }
});

test("通用层：声明了不存在的领域词表时报错", () => {
  const h = host(skill("demo-skill"), { domainWords: ["no-such-domain"] });
  try {
    const r = h.run("verify-skill-generic-layer");
    assert.equal(r.code, 2);
    assert.match(r.out, /领域词表不存在/);
  } finally { h.done(); }
});

// verify-decision-format

const ALT = "否决了另一个方案，理由是成本过高且与现有约束冲突。";
const decision = (status, alt = ALT) =>
  `# Decision: 测试裁定\n\nStatus: ${status}\n\n## Problem\n\n问题。\n\n## Proposal\n\n提案。\n\n## Alternatives considered\n\n${alt}\n\n## Acceptance criteria\n\n判据。\n\n## Risks\n\n风险。\n`;
const implemented = (sections = ["Problem", "Decision", "Alternatives considered", "Consequences"]) =>
  `# Decision: 测试裁定\n\nStatus: implemented\n\n` + sections.map((x) => `## ${x}\n\n${x === "Alternatives considered" ? ALT : "内容。"}\n`).join("\n");

test("决策档案：未声明 decisionsDir 时跳过", () => {
  const h = host({});
  try {
    const r = h.run("verify-decision-format");
    assert.equal(r.code, 0);
    assert.match(r.out, /跳过/);
  } finally { h.done(); }
});

test("决策档案：合规档案通过，Status 与目录不一致被拦截", () => {
  const ok = host({ "records/proposed/kit/2026-01-01-demo.md": decision("proposed") }, { decisionsDir: "records" });
  try { assert.equal(ok.run("verify-decision-format").code, 0); } finally { ok.done(); }

  const bad = host({ "records/proposed/kit/2026-01-01-demo.md": decision("implemented") }, { decisionsDir: "records" });
  try { assert.match(bad.run("verify-decision-format").out, /与所在目录 «proposed» 不一致/); } finally { bad.done(); }
});

test("决策档案：索引文件与空的 Alternatives 被拦截", () => {
  const h = host({
    "records/INDEX.md": "索引\n",
    "records/proposed/kit/2026-01-01-demo.md": decision("proposed", "无"),
  }, { decisionsDir: "records" });
  try {
    const r = h.run("verify-decision-format");
    assert.match(r.out, /不允许有索引文件/);
    assert.match(r.out, /是空的/);
  } finally { h.done(); }
});

// verify-no-section-sign

test("章节号符：中文文件名中的违规也被查到", () => {
  const h = host({ "docs/中文文档.md": "见 \u00a75 的说明\n" });
  try {
    const r = h.run("verify-no-section-sign");
    assert.equal(r.code, 1);
    assert.match(r.out, /docs\/中文文档\.md/);
  } finally { h.done(); }
});

test("章节号符：扫描根之外的文件不查", () => {
  const h = host({ "other/a.md": "见 \u00a75\n", "docs/b.md": "干净\n" });
  try { assert.equal(h.run("verify-no-section-sign").code, 0); } finally { h.done(); }
});

// 配置边界

test("配置：domainWords 为空数组时不做名词扫描，也不误报", () => {
  const h = host(skill("demo-skill", { body: "按薪资口径汇总。" }), { domainWords: [] });
  try { assert.equal(h.run("verify-skill-generic-layer").code, 0); } finally { h.done(); }
});

test("配置：「./docs/」这类写法规范化后仍能命中", () => {
  const h = host({ "docs/a.md": "见 \u00a75\n", ...skill("demo-skill", { fmName: "wrong" }) },
    { styleScanRoots: ["./docs/"], skillsDir: "./skills/" });
  try {
    assert.equal(h.run("verify-no-section-sign").code, 1);
    assert.match(h.run("verify-skill-frontmatter").out, /与目录名/);
  } finally { h.done(); }
});

// 边界与回归

test("frontmatter：三个 camelCase 旧键都被拦截", () => {
  for (const key of ["userInvocable", "modelInvocable", "disableModelInvocation"]) {
    const h = host(skill("demo-skill", { extra: `${key}: true\n` }));
    try { assert.match(h.run("verify-skill-frontmatter").out, new RegExp(`camelCase 旧键 «${key}»`)); } finally { h.done(); }
  }
});

test("frontmatter：行内代码里的上溯路径与引用式链接也算目录外引用", () => {
  const files = { "templates/t.md": "模板\n" };
  const a = host({ ...files, ...skill("demo-skill", { body: "按 `../../templates/t.md` 填写。" }) });
  try { assert.match(a.run("verify-skill-frontmatter").out, /指向 skill 目录之外/); } finally { a.done(); }
  const b = host({ ...files, ...skill("demo-skill", { body: "见[模板][t]。\n\n[t]: ../../templates/t.md" }) });
  try { assert.match(b.run("verify-skill-frontmatter").out, /指向 skill 目录之外/); } finally { b.done(); }
});

test("通用层：不带尾斜杠的 Provider 路径也被拦截，providers 下的文件名不误报", () => {
  const a = host(skill("demo-skill", { body: "加载 references/providers/hrm 下的附录。" }), { domainWords: [] });
  try { assert.match(a.run("verify-skill-generic-layer").out, /写死了领域 Provider 路径/); } finally { a.done(); }
  const b = host(skill("demo-skill", { body: "说明见 references/providers/README.md。" }), { domainWords: [] });
  try { assert.equal(b.run("verify-skill-generic-layer").code, 0); } finally { b.done(); }
});

test("通用层：报告的行号就是违规所在行", () => {
  // frontmatter 6 行 + 空行，正文首行是第 8 行
  const h = host(skill("demo-skill", { body: "按薪资口径汇总。" }), { domainWords: ["hrm"] });
  try { assert.match(h.run("verify-skill-generic-layer").out, /SKILL\.md:8\b/); } finally { h.done(); }
});

test("决策档案：implemented 缺 Decision 被拦截，规范写法的 rejected 通过", () => {
  const a = host({ "records/implemented/kit/2026-01-01-demo.md": implemented(["Problem", "Alternatives considered", "Consequences"]) }, { decisionsDir: "records" });
  try { assert.match(a.run("verify-decision-format").out, /缺 «## Decision»/); } finally { a.done(); }
  const b = host({ "records/rejected/kit/2026-01-01-demo.md": decision("rejected — 与现有约束冲突") }, { decisionsDir: "records" });
  try { assert.equal(b.run("verify-decision-format").code, 0); } finally { b.done(); }
});

test("章节号符：.py 脚本里的违规也被查到", () => {
  const h = host({ "docs/gen.py": "# 见 \u00a75\n" });
  try { assert.equal(h.run("verify-no-section-sign").code, 1); } finally { h.done(); }
});

test("章节号符：基准分支解析不到时报错，不当作没有改动", () => {
  const h = host({});
  try {
    h.git("checkout", "-q", "-b", "main");
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    h.git("checkout", "-q", "-b", "feature");
    writeFileSync(join(h.root, "docs.md"), "x\n");
    mkdirSync(join(h.root, "docs"), { recursive: true });
    writeFileSync(join(h.root, "docs/b.md"), "见 \u00a75\n");
    h.git("add", "-A"); h.git("commit", "-q", "-m", "change");
    const r = h.run("verify-no-section-sign");
    assert.equal(r.code, 2);
    assert.match(r.out, /比较基准 «origin\/main» 解析不到/);
  } finally { h.done(); }
});

test("章节号符：基准可解析时，已提交的违规被查到", () => {
  const h = host({}, { baseRef: "main" });
  try {
    h.git("checkout", "-q", "-b", "main");
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    h.git("checkout", "-q", "-b", "feature");
    mkdirSync(join(h.root, "docs"), { recursive: true });
    writeFileSync(join(h.root, "docs/b.md"), "见 \u00a75\n");
    h.git("add", "-A"); h.git("commit", "-q", "-m", "change");
    assert.equal(h.run("verify-no-section-sign").code, 1);
  } finally { h.done(); }
});

test("章节号符：纯重命名不算本轮改动", () => {
  const h = host({ "docs/old.md": "存量 \u00a75\n" }, { baseRef: "HEAD" });
  try {
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    h.git("mv", "docs/old.md", "docs/new.md");
    assert.equal(h.run("verify-no-section-sign").code, 0);
  } finally { h.done(); }
});

test("豁免清单：--list-baseline 打印全部条目并标出待办", () => {
  const baseline = { "verify-skill-frontmatter": [{ file: "a.md", reason: "待清理", todo: true }, { file: "b.md", reason: "永久误报" }] };
  const h = host({ "baseline.json": JSON.stringify(baseline) }, { baselineFile: "baseline.json" });
  try {
    const r = h.run("verify-skill-frontmatter", "--list-baseline");
    assert.equal(r.code, 0);
    assert.match(r.out, /豁免 2 条，其中待办 1 条/);
  } finally { h.done(); }
});

test("配置：坏 JSON、空的扫描根、不存在的目录都直接报错", () => {
  const cases = [
    [{ styleScanRoots: [] }, /不能是空数组/],
    [{ skillsDir: "no-such-dir" }, /gates\.skillsDir 指向的目录不存在/],
    [{ decisionsDir: "no-such-dir" }, /gates\.decisionsDir 指向的目录不存在/],
  ];
  for (const [cfg, re] of cases) {
    const h = host({}, cfg);
    try { const r = h.run("verify-no-section-sign"); assert.equal(r.code, 2); assert.match(r.out, re); } finally { h.done(); }
  }
  const bad = host({});
  try {
    writeFileSync(join(bad.root, "cookbook.config.json"), "{ broken");
    const r = bad.run("verify-skill-frontmatter");
    assert.equal(r.code, 2);
    assert.match(r.out, /不是合法的 JSON/);
  } finally { bad.done(); }
});

test("缺省值：没有配置文件时，skill 目录取 cookbook 自带的 skills/", () => {
  // 把门禁拷进临时宿主的 vendor/cb/tools/gates，cookbook 根即 vendor/cb
  const root = mkdtempSync(join(tmpdir(), "cookbook-default-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    cpSync(GATES, join(root, "vendor/cb/tools/gates"), { recursive: true });
    mkdirSync(join(root, "vendor/cb/skills/demo-skill"), { recursive: true });
    writeFileSync(join(root, "vendor/cb/skills/demo-skill/SKILL.md"),
      "---\nname: wrong-name\ndescription: 测试\nuser-invocable: true\ndisable-model-invocation: false\n---\n\n正文\n");
    const r = spawnSync("node", [join(root, "vendor/cb/tools/gates/verify-skill-frontmatter.mjs")], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: "" } });
    assert.equal(r.status, 1);
    assert.match(r.stdout + r.stderr, /vendor\/cb\/skills\/demo-skill\/SKILL\.md/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("通用层：句末带英文句点的 Provider 路径也被拦截", () => {
  const h = host(skill("demo-skill", { body: "See references/providers/hrm." }), { domainWords: [] });
  try { assert.match(h.run("verify-skill-generic-layer").out, /写死了领域 Provider 路径/); } finally { h.done(); }
});

test("宿主根：当前目录不在 git 仓库里时，取 cookbook 自身所在的仓库", () => {
  const root = mkdtempSync(join(tmpdir(), "cookbook-root-"));
  const outside = mkdtempSync(join(tmpdir(), "cookbook-outside-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    cpSync(GATES, join(root, "vendor/cb/tools/gates"), { recursive: true });
    mkdirSync(join(root, "vendor/cb/skills/demo-skill"), { recursive: true });
    writeFileSync(join(root, "vendor/cb/skills/demo-skill/SKILL.md"),
      "---\nname: wrong-name\ndescription: 测试\nuser-invocable: true\ndisable-model-invocation: false\n---\n\n正文\n");
    const r = spawnSync("node", [join(root, "vendor/cb/tools/gates/verify-skill-frontmatter.mjs")], { cwd: outside, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: "", GIT_CEILING_DIRECTORIES: dirname(outside) } });
    assert.equal(r.status, 1);
    assert.match(r.stdout + r.stderr, /vendor\/cb\/skills\/demo-skill\/SKILL\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

// 配置校验

test("配置：顶层不是对象、出现不认识的键都直接报错", () => {
  for (const [content, re] of [["null", /顶层必须是对象/], ["[]", /顶层必须是对象/],
    [JSON.stringify({ gates: { skillsDir: "skills", decisionDir: "x" } }), /gates 中有不认识的键：decisionDir/],
    [JSON.stringify({ gate: {} }), /顶层有不认识的键：gate/]]) {
    const h = host({});
    try {
      writeFileSync(join(h.root, "cookbook.config.json"), content);
      const r = h.run("verify-skill-frontmatter");
      assert.equal(r.code, 2);
      assert.match(r.out, re);
    } finally { h.done(); }
  }
});

test("配置：字段类型不对、gates 不是对象都直接报错", () => {
  for (const [cfg, re] of [[{ gates: { skillsDir: 3, styleScanRoots: ["docs"] } }, /gates\.skillsDir 必须是非空字符串/],
    [{ gates: { skillsDir: "skills", styleScanRoots: ["docs"], domainWords: "hrm" } }, /gates\.domainWords 必须是由非空字符串组成的数组/],
    [{ gates: [] }, /gates 必须是对象/]]) {
    const h = host({});
    try {
      writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
      const r = h.run("verify-skill-frontmatter");
      assert.equal(r.code, 2);
      assert.match(r.out, re);
    } finally { h.done(); }
  }
});

test("配置：扫描根或豁免清单指向不存在的路径时报错，扫描根可以是单个文件", () => {
  for (const [cfg, re] of [[{ styleScanRoots: ["doc"] }, /gates\.styleScanRoots 指向的目录或文件不存在：doc/],
    [{ baselineFile: "nope.json" }, /gates\.baselineFile 指向的文件不存在/]]) {
    const h = host({ "docs/a.md": "x\n" }, cfg);
    try { const r = h.run("verify-no-section-sign"); assert.equal(r.code, 2); assert.match(r.out, re); } finally { h.done(); }
  }
  const f = host({ "docs/a.md": "见 \u00a75\n" }, { styleScanRoots: ["docs/a.md"] });
  try { assert.equal(f.run("verify-no-section-sign").code, 1); } finally { f.done(); }
});

test("配置：cookbook 在宿主仓库之外时，依赖其位置的字段必须显式声明", () => {
  const root = mkdtempSync(join(tmpdir(), "cookbook-outside-host-"));
  const ext = mkdtempSync(join(tmpdir(), "cookbook-ext-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    cpSync(GATES, join(ext, "cb/tools/gates"), { recursive: true });
    mkdirSync(join(ext, "cb/skills"), { recursive: true });
    symlinkSync(join(ext, "cb"), join(root, "cb"));
    const gate = join(root, "cb/tools/gates/verify-skill-frontmatter.mjs");
    const r = spawnSync("node", [gate], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: "" } });
    assert.equal(r.status, 2);
    assert.match(r.stdout + r.stderr, /cookbook 位于宿主仓库之外.*gates\.skillsDir/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(ext, { recursive: true, force: true });
  }
});

test("配置：COOKBOOK_HOST_ROOT 经符号链接给出时按真实路径处理", () => {
  const h = host({ "docs/a.md": "见 \u00a75\n" });
  const link = join(tmpdir(), `cookbook-link-${process.pid}-${Date.now()}`);
  try {
    symlinkSync(h.root, link);
    const r = spawnSync("node", [join(GATES, "verify-no-section-sign.mjs")], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: link } });
    assert.equal(r.status, 1);
    assert.match(r.stdout + r.stderr, /docs\/a\.md:1/);
  } finally { rmSync(link, { force: true }); h.done(); }
});

// 增量范围

test("章节号符：与基准分支没有共同历史时报错", () => {
  const h = host({}, { baseRef: "other" });
  try {
    h.git("checkout", "-q", "-b", "main");
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    h.git("checkout", "-q", "--orphan", "other");
    h.git("commit", "-q", "--allow-empty", "-m", "orphan");
    h.git("checkout", "-q", "main");
    const r = h.run("verify-no-section-sign");
    assert.equal(r.code, 2);
    assert.match(r.out, /没有共同历史/);
  } finally { h.done(); }
});

test("章节号符：宿主不在 git 仓库里时报错", () => {
  const root = mkdtempSync(join(tmpdir(), "cookbook-nogit-"));
  try {
    mkdirSync(join(root, "skills"));
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "docs/a.md"), "见 \u00a75\n");
    writeFileSync(join(root, "cookbook.config.json"), JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["docs"] } }));
    const r = spawnSync("node", [join(GATES, "verify-no-section-sign.mjs")], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root, GIT_CEILING_DIRECTORIES: dirname(realpathSync(root)) } });
    assert.equal(r.status, 2);
    assert.match(r.stdout + r.stderr, /不在 git 仓库里/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("章节号符：.js、.sh 也查；仓库根下的 dist/ 不查；已暂存的改动也查", () => {
  const h = host({ "docs/a.js": "// \u00a75\n", "docs/b.sh": "# \u00a75\n", "dist/c.md": "\u00a75\n" }, { styleScanRoots: ["."] });
  try {
    const out = h.run("verify-no-section-sign").out;
    assert.match(out, /docs\/a\.js:1/);
    assert.match(out, /docs\/b\.sh:1/);
    assert.doesNotMatch(out, /dist\/c\.md/);
  } finally { h.done(); }
  const st = host({ "docs/a.md": "见 \u00a75\n" }, { baseRef: "HEAD" });
  try {
    st.git("add", "-A");
    assert.equal(st.run("verify-no-section-sign").code, 1);
  } finally { st.done(); }
});

// 决策档案与自包含

test("决策档案：rejected 不写原因被拦截，缺章节被拦截，标题按整行匹配", () => {
  const a = host({ "records/rejected/kit/2026-01-01-demo.md": decision("rejected") }, { decisionsDir: "records" });
  try { assert.match(a.run("verify-decision-format").out, /没有写否决原因/); } finally { a.done(); }
  const b = host({ "records/rejected/kit/2026-01-01-demo.md": decision("rejected — 原因").replace("## Risks", "## Riskless") }, { decisionsDir: "records" });
  try { assert.match(b.run("verify-decision-format").out, /缺 «## Risks»/); } finally { b.done(); }
  const c = host({ "records/proposed/kit/2026-01-01-demo.md": decision("proposed").replace("## Problem", "### Problem") }, { decisionsDir: "records" });
  try { assert.match(c.run("verify-decision-format").out, /缺 «## Problem»/); } finally { c.done(); }
});

test("决策档案：引用式链接定义指向不存在的文件被拦截", () => {
  const h = host({ "records/proposed/kit/2026-01-01-demo.md": decision("proposed") + "\n[ref]: ./nope.md\n" }, { decisionsDir: "records" });
  try { assert.match(h.run("verify-decision-format").out, /链接 «\.\/nope\.md» 无法解析/); } finally { h.done(); }
});

test("frontmatter：行内代码里任意类型的上溯路径都查，尖括号写法的链接不误报", () => {
  const a = host({ "templates/x.sh": "x\n", ...skill("demo-skill", { body: "运行 `../../templates/x.sh`。" }) });
  try { assert.match(a.run("verify-skill-frontmatter").out, /指向 skill 目录之外/); } finally { a.done(); }
  const b = host({ "skills/demo-skill/t.md": "x\n", ...skill("demo-skill", { body: "见[模板][t]。\n\n[t]: <t.md>" }) });
  try { assert.equal(b.run("verify-skill-frontmatter").code, 0); } finally { b.done(); }
});

// hooks

/** 在临时宿主里跑一个 hook；stdin 为事件 JSON。 */
function hook(h, name, stdin = "") {
  const r = spawnSync("bash", [join(HOOKS, `${name}.sh`)], { cwd: h.root, input: stdin, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
  return { code: r.status, out: r.stdout + r.stderr };
}

test("hooks：编辑 skill 后各道 skill 门禁各自运行，结果以消息报出", () => {
  const h = host(skill("demo-skill", { fmName: "wrong", body: "按薪资口径汇总。" }), { domainWords: ["hrm"] });
  try {
    const r = hook(h, "post_edit_verify", JSON.stringify({ tool_input: { file_path: join(h.root, "skills/demo-skill/SKILL.md") } }));
    assert.equal(r.code, 0);
    const msg = JSON.parse(r.out).systemMessage;
    assert.match(msg, /与目录名/);
    assert.match(msg, /领域名词/);
  } finally { h.done(); }
});

test("hooks：配置读不懂时把原因报出来", () => {
  const h = host({});
  try {
    writeFileSync(join(h.root, "cookbook.config.json"), "{ broken");
    for (const name of ["stop_checks", "spec_capture_reminder"]) {
      const r = hook(h, name);
      assert.equal(r.code, 0);
      assert.match(JSON.parse(r.out).systemMessage, /不是合法的 JSON/);
    }
  } finally { h.done(); }
});

test("hooks：代码审查提醒同一组改动只提醒一次，改动变了再提醒", () => {
  const h = host({});
  try {
    const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
    cfg.hooks = { codeReviewWatchPaths: ["src"], docSyncWatchPaths: [], captureWatchPaths: ["src"] };
    writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    mkdirSync(join(h.root, "src"));
    writeFileSync(join(h.root, "src/a.ts"), "1\n");
    assert.match(hook(h, "stop_checks").out, /代码缺陷审查/);
    assert.equal(hook(h, "stop_checks").out.trim(), "");
    writeFileSync(join(h.root, "src/a.ts"), "2\n");
    assert.match(hook(h, "stop_checks").out, /代码缺陷审查/);
    assert.match(JSON.parse(hook(h, "spec_capture_reminder").out).systemMessage, /检测到 1 处/);
  } finally { h.done(); }
});


// 第 2、3 节规则的逐条守护

test("frontmatter：description 超长、非 kebab-case 目录、非布尔字面量都被拦截", () => {
  const h = host({
    ...skill("Demo_Skill"),
    ...skill("long-desc"),
    ...skill("yes-skill", { extra: "" }),
  });
  try {
    writeFileSync(join(h.root, "skills/long-desc/SKILL.md"),
      `---\nname: long-desc\ndescription: ${"长".repeat(501)}\nuser-invocable: true\ndisable-model-invocation: false\n---\n\n正文\n`);
    writeFileSync(join(h.root, "skills/yes-skill/SKILL.md"),
      "---\nname: yes-skill\ndescription: 测试\nuser-invocable: yes\ndisable-model-invocation: false\n---\n\n正文\n");
    const r = h.run("verify-skill-frontmatter");
    assert.equal(r.code, 1);
    assert.match(r.out, /不是 kebab-case/);
    assert.match(r.out, /超过 500/);
    assert.match(r.out, /不是布尔字面量/);
  } finally { h.done(); }
});

test("frontmatter：共享 reference 副本不一致被拦截，一致时通过", () => {
  const files = {
    ...skill("a-skill"), ...skill("b-skill"),
    "skills/a-skill/references/code-self-review.md": "清单\n",
    "skills/b-skill/references/code-self-review.md": "清单\n",
  };
  const ok = host(files);
  try { assert.equal(ok.run("verify-skill-frontmatter").code, 0); } finally { ok.done(); }
  const bad = host({ ...files, "skills/b-skill/references/code-self-review.md": "改过的清单\n" });
  try { assert.match(bad.run("verify-skill-frontmatter").out, /内容不一致/); } finally { bad.done(); }
});

test("frontmatter：行内代码里的内部目录路径必须存在；dist/ 下的嵌套 SKILL.md 也查", () => {
  const h = host({
    ...skill("demo-skill", { body: "套用 `templates/report.md`，另见 `references/ok.md`。" }),
    "skills/demo-skill/references/ok.md": "有\n",
    "skills/demo-skill/dist/SKILL.md": "嵌套\n",
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.match(r.out, /«templates\/report\.md» 在 skill 目录内不存在/);
    assert.doesNotMatch(r.out, /references\/ok\.md/);
    assert.match(r.out, /dist\/SKILL\.md[\s\S]*嵌套 SKILL\.md/);
  } finally { h.done(); }
});

test("frontmatter：代码块里的链接不查；百分号编码与带标题的链接能解析", () => {
  const body = "```\n[坏](../../x.md)\n```\n~~~\n[坏](../../y.md)\n~~~\n1. 列表项\n\n   ```markdown\n   [坏](../../z.md)\n   ```\n见 [说明](references/a%20b.md \"标题\")";
  const h = host({ ...skill("demo-skill", { body }), "skills/demo-skill/references/a b.md": "有\n" });
  try { assert.equal(h.run("verify-skill-frontmatter").code, 0, h.run("verify-skill-frontmatter").out); } finally { h.done(); }
});

test("通用层：代码块里的领域名词不查；非 ASCII 的 Provider 目录名也被拦截", () => {
  const h = host(skill("demo-skill", { body: "```\n按薪资口径汇总\n```\n加载 providers/示例域 下的附录。" }), { domainWords: ["hrm"] });
  try {
    const r = h.run("verify-skill-generic-layer");
    assert.doesNotMatch(r.out, /领域名词/);
    assert.match(r.out, /providers\/示例域/);
  } finally { h.done(); }
});

test("决策档案：class 不属闭集、文件名不合规、不在 lifecycle 目录下都被拦截", () => {
  const h = host({
    "records/proposed/misc/2026-01-01-demo.md": decision("proposed"),
    "records/proposed/kit/demo.md": decision("proposed"),
    "records/draft/kit/2026-01-01-demo.md": decision("proposed"),
  }, { decisionsDir: "records" });
  try {
    const r = h.run("verify-decision-format");
    assert.match(r.out, /class «misc» 不属闭集/);
    assert.match(r.out, /文件名 «demo\.md» 不合规/);
    assert.match(r.out, /不在 proposed \/ implemented \/ rejected 之下/);
  } finally { h.done(); }
});

test("决策档案：代码块里的链接不查，带标题与百分号编码的链接能解析", () => {
  const extra = "\n```\n[坏](./nope.md)\n```\n见 [另一篇](./2026-01-02-b%20c.md \"标题\")\n";
  const h = host({
    "records/proposed/kit/2026-01-01-demo.md": decision("proposed") + extra,
    "records/proposed/kit/2026-01-02-b c.md": "占位\n",
  }, { decisionsDir: "records" });
  try { assert.doesNotMatch(h.run("verify-decision-format").out, /无法解析/); } finally { h.done(); }
});

// 增量范围的补充

test("章节号符：未暂存的已跟踪文件改动、含引号的文件名都查得到", () => {
  const h = host({ "docs/a.md": "干净\n" }, { baseRef: "HEAD" });
  try {
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    writeFileSync(join(h.root, "docs/a.md"), "见 \u00a75\n");
    writeFileSync(join(h.root, 'docs/q"t.md'), "见 \u00a76\n");
    const r = h.run("verify-no-section-sign");
    assert.match(r.out, /docs\/a\.md:1/);
    assert.match(r.out, /docs\/q"t\.md:1/);
  } finally { h.done(); }
});

test("章节号符：宿主根是仓库子目录时，已提交文件的修改也查得到", () => {
  const h = host({});
  try {
    const sub = join(h.root, "sub");
    mkdirSync(join(sub, "skills"), { recursive: true });
    mkdirSync(join(sub, "docs"), { recursive: true });
    writeFileSync(join(sub, "cookbook.config.json"), JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["docs"], baseRef: "HEAD" } }));
    writeFileSync(join(sub, "docs/a.md"), "干净\n");
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    writeFileSync(join(sub, "docs/a.md"), "见 \u00a75\n");
    const r = spawnSync("node", [join(GATES, "verify-no-section-sign.mjs")], { cwd: sub, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: sub } });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, /docs\/a\.md:1/);
  } finally { h.done(); }
});

// 配置的补充

test("配置：值写成 null、路径落在宿主之外都直接报错", () => {
  for (const gates of [{ skillsDir: null }, { styleScanRoots: ["../x"] }, { styleScanRoots: ["/"] }]) {
    const h = host({}, gates);
    try {
      const r = h.run("verify-skill-frontmatter");
      assert.equal(r.code, 2, JSON.stringify(gates) + r.out);
    } finally { h.done(); }
  }
});

test("配置：声明了不存在的领域词表时，每道门禁都报错", () => {
  const h = host({}, { domainWords: ["nope"] });
  try {
    for (const g of ["verify-skill-frontmatter", "verify-decision-format", "verify-no-section-sign"])
      assert.equal(h.run(g).code, 2, g);
  } finally { h.done(); }
});

// 宿主契约

/** 写入 host 一节，返回门禁读取配置的结果。 */
function withHost(h, hostSection) {
  const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
  cfg.host = hostSection;
  writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
  return h.run("verify-skill-frontmatter");
}

test("宿主契约：合规的 host 一节通过", () => {
  const h = host({ "docs/specs/ui.md": "规则\n", "docs/modules/.keep": "", "RULES.md": "规则\n" });
  try {
    const r = withHost(h, {
      specMap: { "ui-ux": ["docs/specs"], testing: ["docs/specs/ui.md"] },
      moduleDocs: "docs/modules/<module>", testsDir: "tests", processRecordsDir: "records", rulebooks: ["RULES.md"],
    });
    assert.equal(r.code, 0, r.out);
  } finally { h.done(); }
});

test("宿主契约：未知角色、路径不存在、缺占位符、子路径越界都直接报错", () => {
  const cases = [
    [{ specMap: { design: ["docs"] } }, /不认识的角色/],
    [{ specMap: { "ui-ux": ["docs/none.md"] } }, /不存在/],
    [{ moduleDocs: "docs/modules" }, /占位符 <module>/],
    [{ moduleDocs: "nope/<module>" }, /不存在/],
    [{ testsDir: "../tests" }, /子路径/],
    [{ processRecordsDir: "./" }, /子路径/],
    [{ testsDir: "<module>/t" }, /子路径/],
    [{ moduleDocs: "docs/<module>/../x" }, /占位符/],
    [{ rulebooks: [] }, /不用就省略/],
    [{ specMap: { testing: [] } }, /不用就省略/],
    [{ rulebooks: ["NOPE.md"] }, /不存在/],
    [{ unknown: 1 }, /不认识/],
  ];
  for (const [section, re] of cases) {
    const h = host({});
    try {
      const r = withHost(h, section);
      assert.equal(r.code, 2, JSON.stringify(section) + r.out);
      assert.match(r.out, re, JSON.stringify(section));
    } finally { h.done(); }
  }
});

// verify-skill-host-paths

test("宿主路径：cookbook 通用内容里的私有路径被拦截；providers、evals、examples、CHANGELOG 不查；未声明时跳过", () => {
  // 门禁扫描的是 cookbook 自身，所以把门禁拷进宿主内的 cb/ 当作 cookbook
  const files = {
    "cb/skills/demo-skill/SKILL.md": "产物写到 `docs/modules/x/` 下。\n",
    "cb/skills/demo-skill/references/providers/acme/a.md": "docs/modules/x\n",
    "cb/skills/demo-skill/evals/e.md": "docs/modules/x\n",
    "cb/skills/demo-skill/CHANGELOG.md": "docs/modules/x\n",
    "cb/examples/case.md": "docs/modules/x\n",
  };
  const run = (h) => {
    cpSync(GATES, join(h.root, "cb/tools/gates"), { recursive: true });
    const r = spawnSync("node", [join(h.root, "cb/tools/gates/verify-skill-host-paths.mjs")], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  const skip = host(files);
  try {
    const r = run(skip);
    assert.equal(r.code, 0);
    assert.match(r.out, /跳过/);
  } finally { skip.done(); }

  const h = host(files, { hostPrivatePatterns: ["docs/modules/"] });
  try {
    const r = run(h);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /cb\/skills\/demo-skill\/SKILL\.md:1[\s\S]*docs\/modules\//);
    assert.doesNotMatch(r.out, /providers|evals|CHANGELOG|examples/);
  } finally { h.done(); }

  // cookbook 不在宿主仓库内时，内容不由本宿主维护，跳过
  const out = host({}, { hostPrivatePatterns: ["docs/modules/"] });
  try {
    const r = out.run("verify-skill-host-paths");
    assert.equal(r.code, 0);
    assert.match(r.out, /不在宿主仓库内/);
  } finally { out.done(); }
});

// doc-sync

test("doc-sync：每道门禁都跑完，以最差的退出码结束", () => {
  const h = host({ ...skill("demo-skill", { fmName: "wrong" }), "docs/a.md": "见 \u00a75\n" });
  try {
    const r = spawnSync("node", [join(GATES, "doc-sync.mjs")], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    const out = r.stdout + r.stderr;
    assert.equal(r.status, 1);
    assert.match(out, /与目录名/);
    assert.match(out, /docs\/a\.md:1/);
  } finally { h.done(); }

  const bad = host({});
  try {
    writeFileSync(join(bad.root, "cookbook.config.json"), "{ broken");
    const r = spawnSync("node", [join(GATES, "doc-sync.mjs")], { cwd: bad.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: bad.root } });
    assert.equal(r.status, 2);
  } finally { bad.done(); }
});

// hooks 的补充

/** 只含 node、git、bash 的 PATH，用来证明 hook 不依赖其他命令。 */
function minimalPath() {
  const bin = mkdtempSync(join(tmpdir(), "cookbook-bin-"));
  for (const cmd of ["node", "git", "bash"]) {
    const p = execFileSync("bash", ["-c", `command -v ${cmd}`], { encoding: "utf8" }).trim();
    symlinkSync(p, join(bin, cmd));
  }
  return bin;
}

test("hooks：PATH 里只有 node、git、bash 时三个 hook 正常工作", () => {
  const h = host(skill("demo-skill", { fmName: "wrong" }));
  const bin = minimalPath();
  const run = (name, stdin = "") => {
    const r = spawnSync(join(bin, "bash"), [join(HOOKS, `${name}.sh`)], { cwd: h.root, input: stdin, encoding: "utf8", env: { PATH: bin, COOKBOOK_HOST_ROOT: h.root } });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  try {
    const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
    cfg.hooks = { codeReviewWatchPaths: ["skills"], docSyncWatchPaths: [], captureWatchPaths: ["skills"] };
    writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
    const pe = run("post_edit_verify", JSON.stringify({ tool_input: { file_path: join(h.root, "skills/demo-skill/SKILL.md") } }));
    assert.match(JSON.parse(pe.out).systemMessage, /与目录名/);
    assert.match(run("stop_checks").out, /代码缺陷审查/);
    assert.equal(run("stop_checks").out.trim(), "");
    assert.match(run("spec_capture_reminder").out, /spec-capture skill/);
  } finally { rmSync(bin, { recursive: true, force: true }); h.done(); }
});

test("hooks：编辑后 hook 在配置读不懂时把原因报出来", () => {
  const h = host(skill("demo-skill"));
  try {
    writeFileSync(join(h.root, "cookbook.config.json"), "{ broken");
    const r = hook(h, "post_edit_verify", JSON.stringify({ tool_input: { file_path: join(h.root, "skills/demo-skill/SKILL.md") } }));
    assert.match(JSON.parse(r.out).systemMessage, /不是合法的 JSON/);
  } finally { h.done(); }
});

test("hooks：skill 目录经符号链接放在别处时，编辑其中文件仍会跑门禁", () => {
  const h = host({});
  const ext = mkdtempSync(join(tmpdir(), "cookbook-ext-skills-"));
  try {
    rmSync(join(h.root, "skills"), { recursive: true });
    mkdirSync(join(ext, "demo-skill"), { recursive: true });
    writeFileSync(join(ext, "demo-skill/SKILL.md"), skill("demo-skill", { fmName: "wrong" })["skills/demo-skill/SKILL.md"]);
    symlinkSync(ext, join(h.root, "skills"));
    const r = hook(h, "post_edit_verify", JSON.stringify({ tool_input: { file_path: join(h.root, "skills/demo-skill/SKILL.md") } }));
    assert.match(JSON.parse(r.out).systemMessage, /与目录名/);
  } finally { rmSync(ext, { recursive: true, force: true }); h.done(); }
});

test("hooks：cookbook 在宿主仓库之外且未声明 hooks 字段时，Stop hook 报出配置错误", () => {
  const root = mkdtempSync(join(tmpdir(), "cookbook-outside-hooks-"));
  const ext = mkdtempSync(join(tmpdir(), "cookbook-ext-hooks-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    cpSync(resolve(GATES, ".."), join(ext, "cb/tools"), { recursive: true });
    mkdirSync(join(root, "skills"));
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "cookbook.config.json"), JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["docs"] } }));
    symlinkSync(join(ext, "cb"), join(root, "cb"));
    const r = spawnSync("bash", [join(root, "cb/tools/hooks/spec_capture_reminder.sh")], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root } });
    assert.match(JSON.parse(r.stdout).systemMessage, /请显式声明 hooks\.captureWatchPaths/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(ext, { recursive: true, force: true });
  }
});

test("hooks：宿主不在 git 仓库里时，Stop hook 报出来而不是静默", () => {
  const root = mkdtempSync(join(tmpdir(), "cookbook-nogit-"));
  try {
    mkdirSync(join(root, "skills"));
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "cookbook.config.json"), JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["docs"] }, hooks: { captureWatchPaths: ["docs"], docSyncWatchPaths: [], codeReviewWatchPaths: [] } }));
    for (const name of ["stop_checks", "spec_capture_reminder"]) {
      const r = spawnSync("bash", [join(HOOKS, `${name}.sh`)], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root } });
      assert.match(JSON.parse(r.stdout).systemMessage, /不在 git 仓库里/, name);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// 宿主契约：边界取值

test("frontmatter：内部目录路径任意扩展名与目录引用都查，占位符模式不查", () => {
  const h = host({
    ...skill("demo-skill", { body: "运行 `scripts/x.sh`，套用 `templates/x.tsx`，见 `references/missing/`；Provider 放 `references/providers/<domain>/`。" }),
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.match(r.out, /scripts\/x\.sh/);
    assert.match(r.out, /templates\/x\.tsx/);
    assert.match(r.out, /references\/missing\//);
    assert.doesNotMatch(r.out, /<domain>/);
  } finally { h.done(); }
});

test("frontmatter：references/ 下的文档同样查自包含，链接相对文档所在目录；行内代码里的链接不查", () => {
  const h = host({
    ...skill("demo-skill"),
    "skills/demo-skill/references/a.md": "见 [规范](../../../process/k.md)。\n",
    "skills/demo-skill/references/b.md": "示例写法 `![图](./assets/y.svg)`，正文见 [同目录](a.md)。\n",
    "skills/demo-skill/references/sub/c.md": "见 [上一级](../a.md) 与 [缺失](../gone.md)；套用 `templates/none.md`。\n",
    "process/k.md": "规范\n",
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.equal(r.code, 1);
    assert.match(r.out, /references\/a\.md:1[\s\S]*«\.\.\/\.\.\/\.\.\/process\/k\.md» 指向 skill 目录之外/);
    assert.match(r.out, /references\/sub\/c\.md:1[\s\S]*«\.\.\/gone\.md» 不存在/);
    assert.match(r.out, /«templates\/none\.md» 在 skill 目录内不存在/);
    assert.doesNotMatch(r.out, /y\.svg|«\.\.\/a\.md»|«a\.md»/);
  } finally { h.done(); }
});

test("frontmatter：不带路径的文件名指向 cookbook 层里 skill 目录外的文件时被拦截，skill 内有同名文件时放行", () => {
  const h = host({
    ...skill("demo-skill", { body: "套用设计令牌 `tokens.css`；本 skill 的 `SKILL.md`；宿主的 `package.json` 与 `cookbook.config.json`。" }),
    "package.json": "{}\n",
    ...skill("own-skill", { body: "套用 `own.css` 与 `tokens.css`。" }),
    "skills/own-skill/templates/own.css": "x\n",
    "skills/own-skill/templates/tokens.css": "x\n",
    "templates/tokens.css": "x\n",
    "skills/demo-skill/references/r.md": "设计令牌见 `tokens.css`。\n",
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.equal(r.code, 1);
    assert.match(r.out, /demo-skill\/SKILL\.md:\d+[\s\S]*文件名 «tokens\.css» 指向 skill 目录之外/);
    assert.match(r.out, /demo-skill\/references\/r\.md:1[\s\S]*文件名 «tokens\.css»/);
    assert.doesNotMatch(r.out, /own-skill\/SKILL\.md:|SKILL\.md»|package\.json|cookbook\.config\.json/);
  } finally { h.done(); }
});

test("frontmatter：cookbook 层目录开头的路径算目录外引用，<cookbook>/ 写法的指针放行；内部目录路径相对 skill 根解析", () => {
  const h = host({
    ...skill("demo-skill", { body: "派发规则见 `process/protocol.md`；工具见 `tools/x.sh`；别的 skill 见 `skills/other/SKILL.md`；流程见 `<cookbook>/process/protocol.md`，取不到时按本节要点派发。" }),
    "skills/demo-skill/templates/t.md": "模板\n",
    "skills/demo-skill/references/sub/r.md": "套用 `templates/t.md`；见 `../../templates/t.md`。\n",
    "process/protocol.md": "协议\n",
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.equal(r.code, 1);
    for (const p of ["process/protocol.md", "tools/x.sh", "skills/other/SKILL.md"]) assert.match(r.out, new RegExp(`«${p.replace(/[./]/g, "\\$&")}» 指向 skill 目录之外的 cookbook 层`));
    assert.doesNotMatch(r.out, /«<cookbook>|references\/sub\/r\.md/);
  } finally { h.done(); }
});

test("frontmatter：文件名规则只看 cookbook 层的内容目录——示例、各 skill 的 dist/ 里的同名文件不算；豁免清单对它同样生效", () => {
  const files = {
    ...skill("demo-skill", { body: "产物写成 `journey_steps.json`；宿主配置是 `cookbook.config.json`；包名 `other.skill`；令牌见 `tokens.css`。" }),
    "cb/examples/demo/journey_steps.json": "{}\n",
    "cb/examples/demo/cookbook.config.json": "{}\n",
    "skills/other/SKILL.md": "---\nname: other\ndescription: x\nuser-invocable: true\ndisable-model-invocation: false\n---\n",
    "skills/other/dist/other.skill": "x\n",
    "cb/templates/tokens.css": "x\n",
  };
  const h = host(files);
  try {
    const r = inHostCookbook(h, "cb")("verify-skill-frontmatter");
    assert.equal(r.code, 1);
    assert.match(r.out, /文件名 «tokens\.css»/);
    assert.doesNotMatch(r.out, /journey_steps|cookbook\.config|other\.skill/);
  } finally { h.done(); }
  const baseline = { "verify-skill-frontmatter": [{ file: "skills/demo-skill/SKILL.md", match: "tokens.css", reason: "测试豁免" }] };
  const ok = host({ ...files, "baseline.json": JSON.stringify(baseline) }, { baselineFile: "baseline.json" });
  try { const r = inHostCookbook(ok, "cb")("verify-skill-frontmatter"); assert.equal(r.code, 0, r.out); } finally { ok.done(); }
});

test("frontmatter：落单的反引号不与下一段的反引号配对，中间段落的链接照查", () => {
  const h = host({
    ...skill("demo-skill", { body: "第一段有一个落单的 ` 反引号。\n\n见 [模板](../../templates/t.md) 与 [缺失](./gone.md)。\n\n第三段又有一个 ` 反引号。" }),
    "templates/t.md": "x\n",
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.match(r.out, /«\.\.\/\.\.\/templates\/t\.md» 指向 skill 目录之外/);
    assert.match(r.out, /«\.\/gone\.md» 不存在/);
  } finally { h.done(); }
});

test("frontmatter：cookbook 层按 cookbook 自身位置取——skills 目录不在 cookbook 下、宿主自带同名文件时，只认 cookbook 里的", () => {
  const h = host({
    ...skill("demo-skill", { body: "产出写成 `report.md`；派发见 `protocol.md`；构建见 `Makefile`。" }),
    "templates/report.md": "宿主自己的模板\n",
    "cb/process/protocol.md": "协议\n",
    "cb/tools/Makefile": "x\n",
  });
  try {
    const r = inHostCookbook(h, "cb")("verify-skill-frontmatter");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /文件名 «protocol\.md» 指向 skill 目录之外的 cb\/process\/protocol\.md/);
    assert.doesNotMatch(r.out, /report\.md|Makefile/);
  } finally { h.done(); }
});

test("frontmatter：别的 skill 的 evals/ 里与宿主文件同名的 fixture 不算 cookbook 层文件", () => {
  const h = host({
    ...skill("demo-skill", { body: "读取宿主根目录的 `cookbook.config.json`。" }),
    ...skill("other-skill"),
    "skills/other-skill/evals/cases/c1/fixtures/cookbook.config.json": "{}\n",
  });
  try {
    const r = inHostCookbook(h, "cb")("verify-skill-frontmatter");
    assert.equal(r.code, 0, r.out);
  } finally { h.done(); }
});

test("frontmatter：cookbook 层里名为 dist 的目录不当作 skill 的 dist/ 排除（skills 目录放在 tools/ 下时）", () => {
  const h = host({
    ...skill("demo-skill", { body: "令牌见 `tokens.css`。" }),
    "cb/tools/dist/tokens.css": "x\n",
  }, { skillsDir: "cb/tools/skills" });
  try {
    mkdirSync(join(h.root, "cb/tools/skills"), { recursive: true });
    cpSync(join(h.root, "skills/demo-skill"), join(h.root, "cb/tools/skills/demo-skill"), { recursive: true });
    const r = inHostCookbook(h, "cb")("verify-skill-frontmatter");
    assert.match(r.out, /文件名 «tokens\.css» 指向 skill 目录之外的 .*cb\/tools\/dist\/tokens\.css/);
  } finally { h.done(); }
});

test("frontmatter：落单的反引号不跨列表项、标题与表格行配对", () => {
  const h = host({
    ...skill("demo-skill", { body: "- 第一项有一个落单的 ` 反引号\n- 第二项见 [缺失](./gone-a.md)\n- 第三项又有一个 ` 反引号\n\n## 标题里一个 ` 反引号\n正文见 [缺失](./gone-b.md) 与另一个 ` 反引号\n\n| ` 甲 | 乙 |\n| --- | --- |\n| [缺失](./gone-c.md) | ` 丙 |" }),
  });
  try {
    const r = h.run("verify-skill-frontmatter");
    for (const n of ["a", "b", "c"]) assert.match(r.out, new RegExp(`«\\./gone-${n}\\.md» 不存在`));
  } finally { h.done(); }
});

test("宿主契约：多级子路径允许；host 与各节接受 _ 注释键；经别名的绝对路径按真实路径换算", () => {
  const h = host({ "docs/modules/.keep": "" });
  try {
    const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
    cfg.gates._ = "注释";
    cfg.hooks = { _: "注释", captureWatchPaths: [], docSyncWatchPaths: [] };
    writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
    const r = withHost(h, { _: "注释", moduleDocs: "docs/modules/<module>", testsDir: "qa/cases", processRecordsDir: "records/audit" });
    assert.equal(r.code, 0, r.out);
  } finally { h.done(); }

  // 宿主根经符号链接给出别名；moduleDocs 用别名写绝对路径（含占位符，路径本身不存在）也应认得出在宿主内
  const real = host({ "docs/modules/.keep": "" });
  const alias = join(tmpdir(), `cookbook-alias-${process.pid}-${Date.now()}`);
  try {
    symlinkSync(real.root, alias);
    const cfg = JSON.parse(readFileSync(join(real.root, "cookbook.config.json"), "utf8"));
    cfg.host = { moduleDocs: join(alias, "docs/modules/<module>") };
    writeFileSync(join(real.root, "cookbook.config.json"), JSON.stringify(cfg));
    const r = real.run("verify-skill-frontmatter");
    assert.equal(r.code, 0, r.out);
  } finally { rmSync(alias, { force: true }); real.done(); }
});

test("配置：字符串字段写成 null 报类型错误，不当作未声明；hostPrivatePatterns 类型不对报错", () => {
  for (const [gates, re] of [
    [{ baseRef: null }, /gates\.baseRef 必须是非空字符串/],
    [{ decisionsDir: null }, /gates\.decisionsDir 必须是非空字符串/],
    [{ hostPrivatePatterns: "docs/" }, /gates\.hostPrivatePatterns 必须是由非空字符串组成的数组/],
  ]) {
    const h = host({}, gates);
    try {
      const r = h.run("verify-skill-frontmatter");
      assert.equal(r.code, 2, JSON.stringify(gates));
      assert.match(r.out, re, JSON.stringify(gates));
    } finally { h.done(); }
  }
});

/** 把门禁拷进宿主内的 cb/ 当作 cookbook，返回运行其中某道门禁的函数。 */
function inHostCookbook(h, dir = "cb") {
  cpSync(GATES, join(h.root, dir, "tools/gates"), { recursive: true });
  return (gate) => {
    const r = spawnSync("node", [join(h.root, dir, "tools/gates", `${gate}.mjs`)], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    return { code: r.status, out: r.stdout + r.stderr };
  };
}

test("宿主路径：cookbook 放在宿主的 examples/ 下时照样查；豁免清单生效；.ps1 也查", () => {
  const files = {
    "examples/cb/skills/demo-skill/SKILL.md": "产物写到 `docs/modules/x/` 下。\n",
    "examples/cb/skills/demo-skill/scripts/install.ps1": "Copy-Item docs/modules/x\n",
  };
  const h = host(files, { hostPrivatePatterns: ["docs/modules/"] });
  try {
    const run = inHostCookbook(h, "examples/cb");
    const r = run("verify-skill-host-paths");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /SKILL\.md:1/);
    assert.match(r.out, /install\.ps1:1/);
  } finally { h.done(); }

  const baseline = { "verify-skill-host-paths": [
    { file: "examples/cb/skills/demo-skill/SKILL.md", match: "docs/modules/", reason: "测试豁免" },
    { file: "examples/cb/skills/demo-skill/scripts/install.ps1", match: "docs/modules/", reason: "测试豁免" },
  ] };
  const ok = host({ ...files, "baseline.json": JSON.stringify(baseline) }, { hostPrivatePatterns: ["docs/modules/"], baselineFile: "baseline.json" });
  try { assert.equal(inHostCookbook(ok, "examples/cb")("verify-skill-host-paths").code, 0); } finally { ok.done(); }
});

test("doc-sync：追加的宿主门禁不存在时以退出码 2 结束，其余门禁照常跑完", () => {
  const h = host(skill("demo-skill", { fmName: "wrong" }));
  try {
    const r = spawnSync("node", [join(GATES, "doc-sync.mjs"), "nope.mjs"], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    assert.equal(r.status, 2);
    assert.match(r.stdout + r.stderr, /追加的门禁不存在/);
    assert.match(r.stdout + r.stderr, /与目录名/);
  } finally { h.done(); }
});

test("宿主路径：只有 cookbook 就是宿主根时才跳过宿主的配置与豁免清单", () => {
  const baseline = { "verify-skill-host-paths": [{ file: "cb/skills/demo-skill/SKILL.md", match: "docs/modules/", reason: "测试豁免" }] };
  const files = { "cb/skills/demo-skill/SKILL.md": "产物写到 `docs/modules/x/` 下。\n", "cb/baseline.json": JSON.stringify(baseline) };
  const sub = host(files, { hostPrivatePatterns: ["docs/modules/"], baselineFile: "cb/baseline.json" });
  try {
    const r = inHostCookbook(sub, "cb")("verify-skill-host-paths");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /cb\/baseline\.json:1/);
    assert.doesNotMatch(r.out, /SKILL\.md:/);
  } finally { sub.done(); }

  const root = host({ "baseline.json": JSON.stringify({ "verify-skill-host-paths": [] }) }, { hostPrivatePatterns: ["docs/modules/"], baselineFile: "baseline.json" });
  try {
    const r = inHostCookbook(root, ".")("verify-skill-host-paths");
    assert.equal(r.code, 0, r.out);
  } finally { root.done(); }
});

test("决策档案：必需章节只出现在代码块里时算缺章节", () => {
  const body = implemented(["Problem", "Alternatives considered"]) + "\n```\n## Decision\n\n## Consequences\n```\n";
  const h = host({ "records/implemented/kit/2026-01-01-demo.md": body }, { decisionsDir: "records" });
  try {
    const r = h.run("verify-decision-format");
    assert.match(r.out, /缺 «## Decision» 章节/);
    assert.match(r.out, /缺 «## Consequences» 章节/);
  } finally { h.done(); }
});

test("hooks：编辑 skill 后宿主路径门禁也跑", () => {
  const h = host({ "cb/skills/demo-skill/SKILL.md": skill("demo-skill")["skills/demo-skill/SKILL.md"].replace("通用规则正文。", "写到 `docs/modules/x/`。") }, { skillsDir: "cb/skills", hostPrivatePatterns: ["docs/modules/"] });
  try {
    cpSync(resolve(GATES, ".."), join(h.root, "cb/tools"), { recursive: true });
    const r = spawnSync("bash", [join(h.root, "cb/tools/hooks/post_edit_verify.sh")], {
      cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root },
      input: JSON.stringify({ tool_input: { file_path: join(h.root, "cb/skills/demo-skill/SKILL.md") } }),
    });
    assert.match(JSON.parse(r.stdout).systemMessage, /宿主私有路径/);
  } finally { h.done(); }
});

test("hooks：中文文件名的未跟踪文件改了内容会再次提醒代码审查", () => {
  const h = host({});
  try {
    const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
    cfg.hooks = { codeReviewWatchPaths: ["src"], docSyncWatchPaths: [], captureWatchPaths: [] };
    writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
    h.git("add", "-A"); h.git("commit", "-q", "-m", "init");
    mkdirSync(join(h.root, "src"));
    writeFileSync(join(h.root, "src/页面.ts"), "1\n");
    assert.match(hook(h, "stop_checks").out, /代码缺陷审查/);
    assert.equal(hook(h, "stop_checks").out.trim(), "");
    writeFileSync(join(h.root, "src/页面.ts"), "2\n");
    assert.match(hook(h, "stop_checks").out, /代码缺陷审查/);
  } finally { h.done(); }
});

test("hooks：未声明 docSyncCommand 时，只有 node、git、bash 的 PATH 下也能跑 doc-sync", () => {
  const h = host({ "docs/a.md": "见 \u00a75\n" });
  const bin = minimalPath();
  try {
    const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
    cfg.hooks = { docSyncWatchPaths: ["docs"], codeReviewWatchPaths: [], captureWatchPaths: [] };
    writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
    const r = spawnSync(join(bin, "bash"), [join(HOOKS, "stop_checks.sh")], { cwd: h.root, encoding: "utf8", env: { PATH: bin, COOKBOOK_HOST_ROOT: h.root } });
    const msg = JSON.parse(r.stdout).systemMessage;
    assert.doesNotMatch(msg, /command not found/);
    assert.match(msg, /docs\/a\.md:1/);
  } finally { rmSync(bin, { recursive: true, force: true }); h.done(); }
});

// 宿主契约：占位符、子路径与栅栏

test("宿主契约：占位符可以只占路径段的一部分；子路径原值含 .. 段时拒绝；specMap 内可写 _", () => {
  const ok = host({ "docs/modules/.keep": "", "docs/specs/ui.md": "规则\n" });
  try {
    const r = withHost(ok, { moduleDocs: "docs/modules/m-<module>", specMap: { _: "注释", "ui-ux": ["docs/specs"] } });
    assert.equal(r.code, 0, r.out);
  } finally { ok.done(); }
  for (const [section, re] of [[{ testsDir: "a/../b" }, /子路径/], [{ processRecordsDir: "x/../../y" }, /子路径/]]) {
    const h = host({});
    try {
      const r = withHost(h, section);
      assert.equal(r.code, 2, JSON.stringify(section));
      assert.match(r.out, re);
    } finally { h.done(); }
  }
});

test("doc-sync：宿主门禁给出 0、1 之外的退出码时按 2 计", () => {
  const h = host({ "gate3.mjs": "process.exit(3);\n" });
  try {
    const r = spawnSync("node", [join(GATES, "doc-sync.mjs"), "gate3.mjs"], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    assert.equal(r.status, 2);
  } finally { h.done(); }
});

test("决策档案：四个反引号的代码块里含三反引号行时，块内标题仍不算章节", () => {
  const body = implemented(["Problem", "Alternatives considered", "Consequences"]) + "\n````\n```\n## Decision\n```\n````\n";
  const h = host({ "records/implemented/kit/2026-01-01-demo.md": body }, { decisionsDir: "records" });
  try { assert.match(h.run("verify-decision-format").out, /缺 «## Decision» 章节/); } finally { h.done(); }
});

test("frontmatter：行内代码以内部目录开头再借 .. 上溯到 skill 目录外，同样拦截", () => {
  const h = host({ ...skill("demo-skill", { body: "见 `references/../../other/x.md`。" }), "skills/other/x.md": "存在\n" });
  try { assert.match(h.run("verify-skill-frontmatter").out, /references\/\.\.\/\.\.\/other\/x\.md» 指向 skill 目录之外/); } finally { h.done(); }
});

test("宿主路径：只排除 cookbook 根下的 examples/，skill 里的 examples/ 照样查", () => {
  const h = host({ "cb/skills/demo-skill/examples/a.md": "写到 `docs/modules/x/`。\n" }, { hostPrivatePatterns: ["docs/modules/"] });
  try {
    const r = inHostCookbook(h)("verify-skill-host-paths");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /skills\/demo-skill\/examples\/a\.md:1/);
  } finally { h.done(); }
});

// 栅栏、符号链接与宿主根

test("宿主契约：占位符在中间路径段、其后还有路径段时，校验的是占位符所在段的上一级", () => {
  const ok = host({ "docs/modules/.keep": "" });
  try { assert.equal(withHost(ok, { moduleDocs: "docs/modules/m-<module>/spec" }).code, 0); } finally { ok.done(); }
  const bad = host({ "docs/.keep": "" });
  try {
    const r = withHost(bad, { moduleDocs: "docs/modules/m-<module>/spec" });
    assert.equal(r.code, 2);
    assert.match(r.out, /上级目录.*docs\/modules/);
  } finally { bad.done(); }
});

test("通用层：四反引号块里有奇数个三反引号行时，块后的规则句照查，块内不查；波浪线栅栏同样识别", () => {
  const body = "````\n```\n按薪资口径汇总\n````\n规则句：按薪资口径汇总。\n~~~\n按薪资口径汇总\n~~~\n";
  const h = host(skill("demo-skill", { body }), { domainWords: ["hrm"] });
  try {
    const r = h.run("verify-skill-generic-layer");
    const lines = [...r.out.matchAll(/SKILL\.md:(\d+)/g)].map((m) => Number(m[1]));
    assert.equal(lines.length, 1, r.out);
    assert.match(r.out, /规则句：按薪资口径汇总/);
  } finally { h.done(); }
});

test("链接检查：CRLF 行尾的闭合栅栏能闭合；没有闭合的栅栏延续到文末", () => {
  const body = "```\r\n[坏](../../a.md)\r\n```\r\n见 [好](references/ok.md)\r\n```\n[坏](../../b.md)\n";
  const h = host({ ...skill("demo-skill", { body }), "skills/demo-skill/references/ok.md": "有\n" });
  try { assert.equal(h.run("verify-skill-frontmatter").code, 0, h.run("verify-skill-frontmatter").out); } finally { h.done(); }
});

test("frontmatter：代码块里的行内代码路径不查；./../ 写法上溯到 skill 目录外照样拦截", () => {
  const body = "```\n运行 `scripts/missing.sh`\n```\n读取 `./../../outside.md`。";
  const h = host({ ...skill("demo-skill", { body }), "outside.md": "在外面\n" });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.doesNotMatch(r.out, /scripts\/missing\.sh/);
    assert.match(r.out, /\.\/\.\.\/\.\.\/outside\.md» 指向 skill 目录之外/);
  } finally { h.done(); }
});

test("配置：章节号符扫描根与 hooks 监视路径经符号链接指到仓外时直接报错，skillsDir 不受影响", () => {
  const ext = mkdtempSync(join(tmpdir(), "cookbook-ext-scan-"));
  try {
    for (const [section, key] of [["gates", "styleScanRoots"], ["hooks", "captureWatchPaths"], ["hooks", "docSyncWatchPaths"], ["hooks", "codeReviewWatchPaths"]]) {
      const h = host({});
      try {
        symlinkSync(ext, join(h.root, "ext"));
        const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
        cfg[section] = { ...(cfg[section] ?? {}), [key]: ["ext"] };
        writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
        const r = h.run("verify-skill-frontmatter");
        assert.equal(r.code, 2, key + r.out);
        assert.match(r.out, /经符号链接指到宿主仓库之外/, key);
      } finally { h.done(); }
    }
    const ok = host({});
    try {
      mkdirSync(join(ext, "skills"), { recursive: true });
      symlinkSync(join(ext, "skills"), join(ok.root, "linked-skills"));
      const cfg = JSON.parse(readFileSync(join(ok.root, "cookbook.config.json"), "utf8"));
      cfg.gates.skillsDir = "linked-skills";
      writeFileSync(join(ok.root, "cookbook.config.json"), JSON.stringify(cfg));
      assert.equal(ok.run("verify-skill-frontmatter").code, 0);
    } finally { ok.done(); }
  } finally { rmSync(ext, { recursive: true, force: true }); }
});

test("宿主路径：cookbook 就是宿主根时不查宿主自己的配置与豁免清单；skill 之外的 providers、dist 目录照查", () => {
  const files = {
    "skills/demo-skill/SKILL.md": skill("demo-skill")["skills/demo-skill/SKILL.md"],
    "tools/providers/a.md": "docs/private/x\n",
    "tools/dist/b.md": "docs/private/x\n",
    "baseline.json": JSON.stringify({ "verify-skill-host-paths": [], note: "docs/private/" }),
  };
  const h = host(files, { hostPrivatePatterns: ["docs/private/"], baselineFile: "baseline.json" });
  try {
    // 把门禁放在宿主根下的 tools/gates，使 cookbook 的位置就是宿主根
    cpSync(GATES, join(h.root, "tools/gates"), { recursive: true });
    const r = spawnSync("node", [join(h.root, "tools/gates/verify-skill-host-paths.mjs")], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    const out = r.stdout + r.stderr;
    assert.doesNotMatch(out, /cookbook\.config\.json|baseline\.json/);
    assert.match(out, /tools\/providers\/a\.md:1/);
    assert.match(out, /tools\/dist\/b\.md:1/);
  } finally { h.done(); }
});

test("决策档案：档案目录下名为 dist 的子目录照查", () => {
  const h = host({ "records/dist/kit/2026-01-01-demo.md": decision("proposed") }, { decisionsDir: "records" });
  try { assert.match(h.run("verify-decision-format").out, /records\/dist\/kit\/2026-01-01-demo\.md[\s\S]*不在 proposed/); } finally { h.done(); }
});

test("doc-sync：追加的门禁是目录时以退出码 2 结束", () => {
  const h = host({ "g/.keep": "" });
  try {
    const r = spawnSync("node", [join(GATES, "doc-sync.mjs"), "g"], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    assert.equal(r.status, 2);
  } finally { h.done(); }
});

test("hooks：设了 FORCE_COLOR 时提醒文案里没有颜色码", () => {
  const h = host({});
  try {
    const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
    cfg.hooks = { captureWatchPaths: ["docs"], docSyncWatchPaths: [], codeReviewWatchPaths: [] };
    writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
    writeFileSync(join(h.root, "docs/a.md"), "x\n");
    const r = spawnSync("bash", [join(HOOKS, "spec_capture_reminder.sh")], { cwd: h.root, encoding: "utf8", env: { ...process.env, FORCE_COLOR: "3", COOKBOOK_HOST_ROOT: h.root } });
    const msg = JSON.parse(r.stdout).systemMessage;
    assert.doesNotMatch(msg, /\u001b\[/);
    assert.match(msg, /检测到 1 处/);
  } finally { h.done(); }
});

test("hooks：skill 目录经符号链接放在仓外时，消息里按配置的写法显示路径", () => {
  const h = host({});
  const ext = mkdtempSync(join(tmpdir(), "cookbook-ext-msg-"));
  try {
    rmSync(join(h.root, "skills"), { recursive: true });
    mkdirSync(join(ext, "demo-skill"), { recursive: true });
    writeFileSync(join(ext, "demo-skill/SKILL.md"), skill("demo-skill", { fmName: "wrong" })["skills/demo-skill/SKILL.md"]);
    symlinkSync(ext, join(h.root, "skills"));
    const r = hook(h, "post_edit_verify", JSON.stringify({ tool_input: { file_path: join(h.root, "skills/demo-skill/SKILL.md") } }));
    const msg = JSON.parse(r.out).systemMessage;
    assert.match(msg, /编辑 skills\/demo-skill\/SKILL\.md 后/);
    assert.doesNotMatch(msg, /cookbook-ext-msg-/);
  } finally { rmSync(ext, { recursive: true, force: true }); h.done(); }
});

// 宿主门禁、缺省监视路径与栅栏细则

test("配置：gates.extraGates 里的宿主门禁由聚合命令自动运行；声明的文件不存在时配置报错", () => {
  const h = host({ "gate1.mjs": "console.log('extra ran'); process.exit(1);\n" }, { extraGates: ["gate1.mjs"] });
  try {
    const r = spawnSync("node", [join(GATES, "doc-sync.mjs")], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    assert.equal(r.status, 1);
    assert.match(r.stdout + r.stderr, /extra ran/);
  } finally { h.done(); }
  const bad = host({}, { extraGates: ["nope.mjs"] });
  try {
    const r = bad.run("verify-skill-frontmatter");
    assert.equal(r.code, 2);
    assert.match(r.out, /gates\.extraGates/);
  } finally { bad.done(); }
});

test("配置：decisionsDir 经符号链接接到仓外时门禁照常运行，只有依赖缺省监视路径的 hook 点名来源报错", () => {
  const ext = mkdtempSync(join(tmpdir(), "cookbook-ext-dec-"));
  const h = host({});
  try {
    mkdirSync(join(ext, "proposed/kit"), { recursive: true });
    symlinkSync(ext, join(h.root, "records"));
    const cfg = JSON.parse(readFileSync(join(h.root, "cookbook.config.json"), "utf8"));
    cfg.gates.decisionsDir = "records";
    writeFileSync(join(h.root, "cookbook.config.json"), JSON.stringify(cfg));
    assert.equal(h.run("verify-skill-frontmatter").code, 0);
    assert.equal(h.run("verify-decision-format").code, 0);
    // 把门禁与 hooks 拷进宿主，使缺省监视路径可以推导（含 cookbook 目录与 decisionsDir）
    cpSync(resolve(GATES, ".."), join(h.root, "cb/tools"), { recursive: true });
    const r = spawnSync("bash", [join(h.root, "cb/tools/hooks/stop_checks.sh")], { cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root } });
    assert.match(JSON.parse(r.stdout).systemMessage, /hooks\.docSyncWatchPaths 未声明.*来自 gates\.decisionsDir/);
  } finally { rmSync(ext, { recursive: true, force: true }); h.done(); }
});

test("宿主路径：gates.skillsDir 落在 cookbook 内、目录名不是 skills 时，其中的 providers 同样不查", () => {
  const h = host({
    "cb/my-skills/demo-skill/SKILL.md": skill("demo-skill")["skills/demo-skill/SKILL.md"],
    "cb/my-skills/demo-skill/references/providers/acme/a.md": "docs/private/x\n",
  }, { skillsDir: "cb/my-skills", hostPrivatePatterns: ["docs/private/"] });
  try {
    const r = inHostCookbook(h)("verify-skill-host-paths");
    assert.equal(r.code, 0, r.out);
  } finally { h.done(); }
});

test("链接检查：更长的闭合栅栏也能闭合；信息串里带反引号的那行不算栅栏", () => {
  const body = "```\n[坏](../../a.md)\n`````\n见 [好](references/ok.md)\n``` 带 `反引号` 的信息串\n[坏](../../b.md)\n";
  const h = host({ ...skill("demo-skill", { body }), "skills/demo-skill/references/ok.md": "有\n" });
  try {
    const r = h.run("verify-skill-frontmatter");
    assert.doesNotMatch(r.out, /a\.md/);
    assert.match(r.out, /\.\.\/\.\.\/b\.md/);
  } finally { h.done(); }
});
