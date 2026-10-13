import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";

const GATES = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function host() {
  const root = mkdtempSync(join(tmpdir(), "cookbook-translation-"));
  const cookbook = join(root, "cookbook");
  mkdirSync(join(cookbook, "skills"), { recursive: true });
  // This fixture tests generic gates; contributor adapters have their own fixture suite.
  cpSync(GATES, join(cookbook, "tools/gates"), {
    recursive: true, filter: (path) => !path.endsWith("/verify-agent-rulebooks.mjs"),
  });
  execFileSync("git", ["init", "-q"], { cwd: root });
  writeFileSync(join(root, "cookbook.config.json"), JSON.stringify({ gates: { skillsDir: "cookbook/skills", styleScanRoots: ["cookbook"] } }));
  const put = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const hash = (path) => execFileSync("git", ["hash-object", "--no-filters", join(root, path)], { cwd: root, encoding: "utf8" }).trim();
  const run = (gate = "verify-translation-sync", env = {}) => {
    const r = spawnSync(process.execPath, [join(cookbook, `tools/gates/${gate}.mjs`)], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root, ...env } });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  return { root, put, hash, run, done: () => rmSync(root, { recursive: true, force: true }) };
}
const sidecar = (hash, source = "README.md") => `---\nauthority: zh\ntranslation_of: ${source}\nsource_version: ${hash}\n---\n\nThis is a translation; the Chinese original is authoritative.\n`;

test("translation-sync：中文修改 → warn → 同步 → 转绿，doc-sync 不阻断滞后", () => {
  const h = host();
  try {
    h.put("cookbook/README.md", "# 中文原文\n");
    h.put("cookbook/README.en.md", sidecar(h.hash("cookbook/README.md")));
    assert.equal(h.run().code, 0);
    assert.doesNotMatch(h.run().out, /译本滞后/);
    h.put("cookbook/README.md", "# 中文原文\n\n新规则。\n");
    const stale = h.run("doc-sync");
    assert.equal(stale.code, 0, stale.out);
    assert.match(stale.out, /译本滞后/);
    h.put("cookbook/README.en.md", sidecar(h.hash("cookbook/README.md")) + "\nNew rule.\n");
    const synced = h.run("doc-sync");
    assert.equal(synced.code, 0, synced.out);
    assert.doesNotMatch(synced.out, /译本滞后/);
  } finally { h.done(); }
});

test("translation-sync：原文缺失或为目录时失败，即使存在另一份滞后译本", () => {
  const h = host();
  try {
    h.put("cookbook/README.en.md", sidecar("a".repeat(40)));
    h.put("cookbook/process/overview.md", "# 原文\n");
    h.put("cookbook/process/overview.en.md", sidecar("b".repeat(40), "overview.md"));
    const r = h.run("doc-sync");
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /找不到原文/);
    assert.match(r.out, /译本滞后/);
    h.put("cookbook/README.md/child.txt", "目录不算原文");
    assert.equal(h.run().code, 1);
  } finally { h.done(); }
});

test("translation-sync：缺字段、错误权威、版本格式与跨目录原文被拦截", () => {
  const h = host();
  try {
    h.put("cookbook/README.md", "原文\n");
    const valid = sidecar(h.hash("cookbook/README.md"));
    for (const invalid of ["No metadata\n", valid.replace("authority: zh", "authority: en"), valid.replace(/source_version: .+/, "source_version: latest"), valid.replace("translation_of: README.md", "translation_of: ../README.md"), valid.replace("translation_of: README.md\n", "")]) {
      h.put("cookbook/README.en.md", invalid);
      const r = h.run();
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, /元信息缺失或无效/);
    }
  } finally { h.done(); }
});

test("translation-sync：配置 skill 根也扫描；构建产物与 Agent 文件免检", () => {
  const h = host();
  try {
    h.put("cookbook/skills/demo/dist/README.en.md", "Generated prompt, no metadata\n");
    for (const name of ["AGENTS", "CLAUDE", "GEMINI", "AGENT_GUIDE"]) h.put(`cookbook/${name}.en.md`, "Agent entry, no sidecar\n");
    h.put("cookbook/llms.txt", "Agent guide\n");
    assert.equal(h.run().code, 0);
    h.put("installed/skills/demo/README.md", "独立 skill\n");
    h.put("installed/skills/demo/README.en.md", sidecar("a".repeat(40)));
    h.put("cookbook.config.json", JSON.stringify({ gates: { skillsDir: "installed/skills", styleScanRoots: ["cookbook"] } }));
    const r = h.run();
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /译本滞后.*installed\/skills\/demo\/README.en.md/);
  } finally { h.done(); }
});

test("translation-sync：CRLF 元信息与带空格的原文名可用", () => {
  const h = host();
  try {
    h.put("cookbook/guide name.md", "原文\r\n");
    h.put("cookbook/guide name.en.md", sidecar(h.hash("cookbook/guide name.md"), "guide name.md").replace(/\n/g, "\r\n"));
    const r = h.run();
    assert.equal(r.code, 0, r.out);
    assert.doesNotMatch(r.out, /译本滞后/);
  } finally { h.done(); }
});


test("translation-sync：严格闭合、重复字段与非支持 header 格式报错", () => {
  const h = host();
  try {
    h.put("cookbook/README.md", "原文\n");
    const valid = sidecar(h.hash("cookbook/README.md"));
    for (const invalid of [
      valid.replace("\n---\n\n", "\n---garbage\n\n"),
      valid.replace("\n---\n\n", "\n"),
      valid.replace("authority: zh", "authority: en\nauthority: zh"),
      valid.replace("authority: zh", "authority: zh\nother: value"),
      valid.replace("authority: zh", 'authority: "zh'),
      valid.replace("authority: zh", "authority: 'zh"),
      valid.replace("authority: zh", "authority: [zh]"),
    ]) {
      h.put("cookbook/README.en.md", invalid);
      const r = h.run();
      assert.equal(r.code, 1, r.out);
      assert.match(r.out, /元信息缺失或无效/);
    }
  } finally { h.done(); }
});

test("translation-sync：三字段的单/双引号及 CRLF 与无引号同值", () => {
  const h = host();
  try {
    h.put("cookbook/guide name.md", "原文\n");
    const hash = h.hash("cookbook/guide name.md");
    for (const quote of ["'", '"']) {
      const header = `---\nauthority: ${quote}zh${quote}\ntranslation_of: ${quote}guide name.md${quote}\nsource_version: ${quote}${hash}${quote}\n---\nEnglish\n`;
      for (const text of [header, header.replace(/\n/g, "\r\n")]) {
        h.put("cookbook/guide name.en.md", text);
        const r = h.run();
        assert.equal(r.code, 0, r.out);
        assert.doesNotMatch(r.out, /译本滞后/);
      }
    }
  } finally { h.done(); }
});

test("translation-sync：clean filter 不改变 source_version 的 raw blob 口径", () => {
  const h = host();
  try {
    h.put("cookbook/README.md", "原文内容\n");
    h.put(".gitattributes", "README.md filter=translation-test\n");
    execFileSync("git", ["config", "filter.translation-test.clean", "printf filtered"], { cwd: h.root });
    const raw = h.hash("cookbook/README.md");
    const filtered = execFileSync("git", ["hash-object", join(h.root, "cookbook/README.md")], { cwd: h.root, encoding: "utf8" }).trim();
    assert.notEqual(raw, filtered, "fixture 必须实际触发 filter");
    h.put("cookbook/README.en.md", sidecar(raw));
    const r = h.run();
    assert.equal(r.code, 0, r.out);
    assert.doesNotMatch(r.out, /译本滞后/);
    h.put("cookbook/README.en.md", sidecar(filtered));
    const stale = h.run();
    assert.equal(stale.code, 0, stale.out);
    assert.match(stale.out, /译本滞后/);
  } finally { h.done(); }
});

test("translation-sync：hash 命令失败退出 2，不能默认为同步", () => {
  const h = host();
  try {
    h.put("cookbook/README.md", "原文\n");
    h.put("cookbook/README.en.md", sidecar(h.hash("cookbook/README.md")));
    h.put("bin/git", "#!/bin/sh\nexit 99\n");
    chmodSync(join(h.root, "bin/git"), 0o755);
    const r = h.run("verify-translation-sync", { PATH: `${join(h.root, "bin")}:${process.env.PATH}` });
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /无法计算.*blob hash/);
  } finally { h.done(); }
});

test("宿主路径：exactLine 保留六处通用名称清单，同文件新增宿主引用逐个报错", () => {
  const h = host();
  try {
    const patterns = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"];
    const fixtures = [
      ["cookbook/process/kit-architecture.md", "Agent names: AGENTS.md, CLAUDE.md, GEMINI.md"],
      ["cookbook/tools/gates/verify-translation-sync.mjs", 'const names = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"];'],
    ];
    const entries = fixtures.flatMap(([file, exactLine]) => patterns.map((match) => ({ file, match, exactLine, reason: "通用入口清单" })));
    h.put("baseline.json", JSON.stringify({ "verify-skill-host-paths": entries }));
    h.put("cookbook.config.json", JSON.stringify({ gates: { skillsDir: "cookbook/skills", styleScanRoots: ["cookbook"], baselineFile: "baseline.json", hostPrivatePatterns: patterns } }));
    for (const [file, text] of fixtures) h.put(file, text + "\n");
    assert.equal(h.run("verify-skill-host-paths").code, 0);
    for (const [file, text] of fixtures) {
      for (const name of patterns) {
        h.put(file, `${text}\n读取宿主 ${name} 的规则\n`);
        const r = h.run("verify-skill-host-paths");
        assert.equal(r.code, 1, r.out);
        assert.match(r.out, /写了宿主私有路径/);
        h.put(file, text + "\n");
      }
      h.put(file, text + "\r\n");
      assert.equal(h.run("verify-skill-host-paths").code, 0);
      h.put(file, text + " changed\n");
      assert.equal(h.run("verify-skill-host-paths").code, 1);
      h.put(file, text + "\n");
    }
    h.put("cookbook/process/other.md", fixtures[0][1] + "\n");
    assert.equal(h.run("verify-skill-host-paths").code, 1);
  } finally { h.done(); }
});

test("宿主路径：exactLine 非单行非空字符串是配置错误", () => {
  const h = host();
  try {
    h.put("cookbook.config.json", JSON.stringify({ gates: { skillsDir: "cookbook/skills", styleScanRoots: ["cookbook"], baselineFile: "baseline.json", hostPrivatePatterns: ["PRIVATE"] } }));
    for (const exactLine of [null, 123, "", "   ", "line\nnext", "line\rnext"]) {
      h.put("baseline.json", JSON.stringify({ "verify-skill-host-paths": [{ file: "cookbook/README.md", match: "PRIVATE", exactLine, reason: "测试" }] }));
      const r = h.run("verify-skill-host-paths");
      assert.equal(r.code, 2, r.out);
      assert.match(r.out, /exactLine 必须/);
    }
  } finally { h.done(); }
});

test("translation-sync：仅 skill 自己的 dist 免检，cookbook 根 dist 仍检查元信息和原文", () => {
  const h = host();
  try {
    h.put("cookbook/skills/demo/dist/README.en.md", "bad\n");
    assert.equal(h.run().code, 0);
    h.put("cookbook/dist/README.en.md", "bad\n");
    const invalid = h.run();
    assert.equal(invalid.code, 1, invalid.out);
    assert.match(invalid.out, /cookbook\/dist\/README.en.md/);
    assert.match(invalid.out, /元信息缺失或无效/);
    h.put("cookbook/dist/README.en.md", sidecar("a".repeat(40)));
    const missing = h.run();
    assert.equal(missing.code, 1, missing.out);
    assert.match(missing.out, /找不到原文/);
    h.put("cookbook/dist/README.md", "原文\n");
    h.put("cookbook/dist/README.en.md", sidecar(h.hash("cookbook/dist/README.md")));
    assert.equal(h.run().code, 0);
    h.put("cookbook/process/dist/README.en.md", "bad\n");
    const nested = h.run();
    assert.equal(nested.code, 1, nested.out);
    assert.match(nested.out, /cookbook\/process\/dist\/README.en.md/);
  } finally { h.done(); }
});
