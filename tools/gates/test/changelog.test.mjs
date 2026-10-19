import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const GATES = resolve(import.meta.dirname, "..");
const versions = "# Changes\n\n## v1.2.0（2026-10-17）\n\nLatest.\n\n## v1.1.0\n\nPrevious.\n";
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "changelog-gate-")), kit = join(root, "cookbook");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const raw = (path, text) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
  const put = (path, text) => raw(`cookbook/${path}`, text);
  cpSync(GATES, join(kit, "tools/gates"), { recursive: true });
  mkdirSync(join(root, "docs"));
  raw("cookbook.config.json", JSON.stringify({ gates: { skillsDir: "cookbook/skills", styleScanRoots: ["docs"], domainWords: [], baseRef: "origin/main" } }));
  for (const name of ["demo", "other"]) {
    put(`skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Fixture skill.\nuser-invocable: true\ndisable-model-invocation: false\n---\n\nGeneric rules.\n`);
    put(`skills/${name}/CHANGELOG.md`, versions);
  }
  const git = (...args) => execFileSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd: root, stdio: "pipe" });
  const save = () => { git("add", "--all"); git("commit", "-qm", "fixture checkpoint"); };
  git("init", "-q", "-b", "main"); save(); git("update-ref", "refs/remotes/origin/main", "HEAD");
  const run = (gate = "verify-changelog") => { const r = spawnSync(process.execPath, [join(kit, `tools/gates/${gate}.mjs`)], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root } }); return { code: r.status, out: r.stdout + r.stderr }; };
  return { root, kit, put, raw, git, save, run };
}

test("changelog: valid skill history passes without a product root changelog", (t) => {
  const f = fixture(t); assert.equal(f.run().code, 0);
});
test("changelog: both PRD skills accept a single initial release without a date", (t) => {
  const f = fixture(t);
  for (const name of ["check-prd", "create-prd"]) {
    f.put(`skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Fixture skill.\nuser-invocable: true\ndisable-model-invocation: false\n---\n`);
    f.put(`skills/${name}/CHANGELOG.md`, "# Changes\n\n## v0.1.0\n\nInitial release.\n");
  }
  const r = f.run(); assert.equal(r.code, 0, r.out);
});
test("changelog: every skill needs a file and a version section", (t) => {
  const f = fixture(t); rmSync(join(f.kit, "skills/demo/CHANGELOG.md")); assert.match(f.run().out, /缺少 CHANGELOG/);
  f.put("skills/demo/CHANGELOG.md", "# Changes\n"); assert.match(f.run().out, /没有版本节/);
});
test("changelog: incomplete, malformed and non-version headings fail", (t) => {
  const f = fixture(t);
  for (const heading of ["v1.2", "v01.2.3", "v1.2.3 (2026-10-17)", "v1.2.3-beta", "未发布", "Notes"]) {
    f.put("skills/demo/CHANGELOG.md", `## ${heading}\n\n## v1.0.0\n`);
    const r = f.run(); assert.equal(r.code, 1, r.out); assert.match(r.out, /版本标题格式/);
  }
});
test("changelog: versions decrease numerically without duplicates", (t) => {
  const f = fixture(t);
  for (const history of [["1.0.0", "1.0.0"], ["1.0.0", "1.1.0"]]) {
    f.put("skills/demo/CHANGELOG.md", history.map(v => `## v${v}\n`).join("\n")); assert.match(f.run().out, /严格递减/);
  }
  f.put("skills/demo/CHANGELOG.md", "## v1.10.0\n\n## v1.9.9\n"); assert.equal(f.run().code, 0);
  f.put("skills/demo/CHANGELOG.md", "## v9007199254740993.0.0\n\n## v9007199254740992.0.0\n"); assert.equal(f.run().code, 0);
});
test("changelog: product root allows a single leading unreleased section or dated versions", (t) => {
  const f = fixture(t);
  for (const text of ["## 未发布\n", "## 未发布\n\n## v0.1.0（2026-10-17）\n", "## v0.1.0（2026-10-17）\n"]) { f.put("CHANGELOG.md", text); assert.equal(f.run().code, 0); }
  for (const text of ["# Changes\n", "## v0.1.0\n", "## 未发布\n\n## 未发布\n", "## v0.1.0（2026-10-17）\n\n## 未发布\n"]) { f.put("CHANGELOG.md", text); assert.equal(f.run().code, 1); }
});
test("changelog: host root history and English sidecars are not product version inputs", (t) => {
  const f = fixture(t); f.raw("CHANGELOG.md", "## Host-specific headings\n"); f.put("skills/demo/CHANGELOG.en.md", "## Translation headings\n"); assert.equal(f.run().code, 0);
});
test("changelog: fenced examples do not supply versions or cause ordering failures", (t) => {
  const f = fixture(t); const code = "```md\n## v99.0.0\n## Not a release\n```\n";
  f.put("skills/demo/CHANGELOG.md", code + "\n## v1.0.0\n"); assert.equal(f.run().code, 0);
  f.put("skills/demo/CHANGELOG.md", code); assert.match(f.run().out, /没有版本节/);
});
test("changelog: each behavior path requires its own skill history update", (t) => {
  for (const path of ["SKILL.md", "references/rule.md", "scripts/build.py", "templates/output.md"]) {
    const f = fixture(t); f.put(`skills/demo/${path}`, "Changed behavior.\n");
    const r = f.run(); assert.equal(r.code, 1, r.out); assert.match(r.out, /CHANGELOG.md 未同步/);
    f.put("skills/demo/CHANGELOG.md", versions + "\nUpdated entry.\n"); assert.equal(f.run().code, 0);
  }
});
test("changelog: updating a different skill does not satisfy the requirement", (t) => {
  const f = fixture(t); f.put("skills/demo/references/rule.md", "Changed.\n"); f.put("skills/other/CHANGELOG.md", versions + "\nOther update.\n"); assert.equal(f.run().code, 1);
});
test("changelog: distribution, evaluation and README edits do not trigger history updates", (t) => {
  const f = fixture(t);
  for (const path of ["dist/prompt.md", "evals/case.json", "README.md", "README.en.md"]) f.put(`skills/demo/${path}`, "Changed docs or generated content.\n");
  assert.equal(f.run().code, 0);
});
test("changelog: staged and committed behavior edits use the configured comparison ref", (t) => {
  for (const commit of [false, true]) {
    const f = fixture(t); f.put("skills/demo/references/rule.md", "Changed.\n"); f.git("add", "--all"); if (commit) f.save();
    assert.equal(f.run().code, 1);
    f.put("skills/demo/CHANGELOG.md", versions + "\nUpdated entry.\n"); assert.equal(f.run().code, 0);
  }
});
test("changelog: an unavailable comparison ref fails instead of reporting no changes", (t) => {
  const f = fixture(t); f.git("update-ref", "-d", "refs/remotes/origin/main"); const r = f.run(); assert.equal(r.code, 2); assert.match(r.out, /比较基准/);
});
test("changelog: doc-sync enforces behavior/history synchronization by default", (t) => {
  const f = fixture(t); let r = f.run("doc-sync"); assert.equal(r.code, 0, r.out); assert.match(r.out, /✓ verify-changelog/);
  f.put("skills/demo/references/rule.md", "Changed behavior.\n"); r = f.run("doc-sync"); assert.equal(r.code, 1, r.out); assert.match(r.out, /CHANGELOG.md 未同步/);
  f.put("skills/demo/CHANGELOG.md", versions + "\nUpdated entry.\n"); r = f.run("doc-sync"); assert.equal(r.code, 0, r.out);
});

for (const state of ["working", "staged", "committed"]) test(`changelog: ${state} pure behavior rename requires its skill history update`, (t) => {
  const f = fixture(t);
  f.put("skills/demo/references/old.md", "Unchanged rules.\n"); f.save();
  f.git("update-ref", "refs/remotes/origin/main", "HEAD");
  f.git("mv", "cookbook/skills/demo/references/old.md", "cookbook/skills/demo/references/new.md");
  if (state === "working") f.git("reset", "-q", "HEAD");
  if (state === "committed") f.save();
  const red = f.run(); assert.equal(red.code, 1, red.out); assert.match(red.out, /CHANGELOG.md 未同步/);
  f.put("skills/demo/CHANGELOG.md", versions + "\nRenamed rules.\n");
  const green = f.run(); assert.equal(green.code, 0, green.out);
});

test("changelog: pure rename out of behavior paths still requires the source skill history", (t) => {
  const f = fixture(t);
  f.put("skills/demo/references/old.md", "Unchanged rules.\n"); f.save();
  f.git("update-ref", "refs/remotes/origin/main", "HEAD");
  f.git("mv", "cookbook/skills/demo/references/old.md", "cookbook/skills/demo/README.md");
  const red = f.run(); assert.equal(red.code, 1, red.out); assert.match(red.out, /CHANGELOG.md 未同步/);
  f.put("skills/demo/CHANGELOG.md", versions + "\nMoved rules.\n");
  const green = f.run(); assert.equal(green.code, 0, green.out);
});
