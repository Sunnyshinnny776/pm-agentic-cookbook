import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const GATES = resolve(import.meta.dirname, "..");
const table = (names) => "| User intent | Skill | Stage |\n| --- | --- | --- |\n" + names.map((n) => `| Use ${n} | \`${n}\` | Design |`).join("\n") + "\n";
function fixture(t, { names = ["first-skill", "second-skill"], guide = table(names), index = "# Cookbook\n\n> Agent index.\n\n## Guide\n\n- [Guide](AGENT_GUIDE.md): Start here.\n" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "agent-guide-gate-")); t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, content) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content); };
  for (const file of ["verify-agent-guide.mjs", "lib/verify-common.mjs"]) { const target = join(root, "tools/gates", file); mkdirSync(dirname(target), { recursive: true }); cpSync(join(GATES, file), target); }
  put("cookbook.config.json", JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["."], domainWords: [] } }));
  for (const name of names) {
    put(`skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Fixture skill.\nuser-invocable: true\ndisable-model-invocation: false\n---\n`);
    put(`skills/${name}/CHANGELOG.md`, "# Changes\n\n## v0.1.0\n");
  }
  if (guide !== null) put("AGENT_GUIDE.md", guide);
  if (index !== null) put("llms.txt", index);
  const run = () => { const r = spawnSync(process.execPath, [join(root, "tools/gates/verify-agent-guide.mjs")], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root } }); return { code: r.status, out: r.stdout + r.stderr }; };
  return { root, put, run };
}

test("agent guide: matching route set and relative links pass", (t) => {
  const f = fixture(t); assert.equal(f.run().code, 0);
});
test("agent guide: missing, unknown and duplicate skills fail", (t) => {
  for (const names of [["first-skill"], ["first-skill", "second-skill", "unknown"], ["first-skill", "second-skill", "first-skill"]]) {
    const f = fixture(t, { guide: table(names) }); assert.equal(f.run().code, 1);
  }
});
test("agent guide: each frontmatter name must match its directory", (t) => {
  const f = fixture(t); f.put("skills/first-skill/SKILL.md", "---\nname: other-name\n---\n"); assert.match(f.run().out, /frontmatter name/);
});
test("agent guide: a directory without its entry point fails", (t) => {
  const f = fixture(t); rmSync(join(f.root, "skills/first-skill/SKILL.md")); assert.equal(f.run().code, 1);
});
test("agent guide: table examples inside fences do not supply or duplicate live routes", (t) => {
  const fake = "```md\n" + table(["fake"]) + "```\n";
  assert.equal(fixture(t, { guide: fake + table(["first-skill", "second-skill"]) }).run().code, 0);
  assert.equal(fixture(t, { guide: fake }).run().code, 1);
});
test("agent guide: missing table, duplicate tables and malformed rows fail", (t) => {
  for (const guide of ["# No table\n", table(["first-skill", "second-skill"]) + "\n" + table([]), table(["first-skill", "second-skill"]).replace("`first-skill`", "first-skill"), table(["first-skill", "second-skill"]).replace("| --- | --- | --- |", "| --- |")]) assert.equal(fixture(t, { guide }).run().code, 1);
});
test("agent guide: either entry point makes both required", (t) => {
  assert.equal(fixture(t, { guide: null }).run().code, 1); assert.equal(fixture(t, { index: null }).run().code, 1);
});
test("agent guide: neither entry point skips with an explicit reason", (t) => {
  const result = fixture(t, { guide: null, index: null }).run();
  assert.equal(result.code, 0); assert.match(result.out, /跳过.*AGENT_GUIDE\.md.*llms\.txt/);
});
test("agent guide: doc-sync checks routes without extraGates configuration", (t) => {
  const f = fixture(t);
  cpSync(GATES, join(f.root, "tools/gates"), { recursive: true });
  assert.equal(spawnSync("git", ["init", "-q"], { cwd: f.root }).status, 0);
  const run = () => spawnSync(process.execPath, [join(f.root, "tools/gates/doc-sync.mjs")], { cwd: f.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: f.root } });
  let result = run(); assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /✓ verify-agent-guide/);
  f.put("AGENT_GUIDE.md", table(["first-skill"]));
  result = run(); assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /路由表缺少 skill：second-skill/);
});
test("agent guide: broken, encoded and reference-style links are checked", (t) => {
  const f = fixture(t); f.put("docs/guide note.md", "guide\n");
  f.put("llms.txt", "- [Note](docs/guide%20note.md#section)\n- [Guide][g]\n\n[g]: AGENT_GUIDE.md\n"); assert.equal(f.run().code, 0);
  rmSync(join(f.root, "docs/guide note.md")); assert.match(f.run().out, /不可解析/);
});
test("agent guide: external URLs and code examples are not local file links", (t) => {
  const f = fixture(t, { index: "- [Site](https://example.invalid/docs)\n\n```md\n- [Example](missing.md)\n```\n" }); assert.equal(f.run().code, 0);
});
test("agent guide: traversal and symlink links cannot escape the cookbook", (t) => {
  const f = fixture(t); f.put("llms.txt", "- [Outside](../outside.md)\n"); assert.equal(f.run().code, 1);
  symlinkSync(tmpdir(), join(f.root, "outside")); f.put("llms.txt", "- [Outside](outside/)\n"); assert.match(f.run().out, /外部/);
});
test("agent guide: both the full and reduced skill collections can be verified", (t) => {
  const all = Array.from({ length: 11 }, (_, i) => `skill-${i}`);
  for (const names of [all, all.slice(2)]) assert.equal(fixture(t, { names }).run().code, 0);
});
