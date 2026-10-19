import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const GATE = resolve(import.meta.dirname, "../verify-skill-packages.mjs");
function fixture(t, { rootName = "host", method = 8 } = {}) {
  const temporary = mkdtempSync(join(tmpdir(), "skill-package-gate-")), root = join(temporary, rootName);
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const skill = join(root, "skills/demo"), packagePath = join(skill, "dist/demo.skill");
  mkdirSync(join(skill, "dist"), { recursive: true });
  writeFileSync(join(root, "cookbook.config.json"), JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["skills"] } }));
  const put = (name, content, mode = 0o644) => {
    const path = join(skill, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); chmodSync(path, mode);
  };
  put("SKILL.md", "skill entry\n"); put("references/rules.md", "source rules\n");
  const entries = () => [
    { name: "SKILL.md", content: readFileSync(join(skill, "SKILL.md"), "utf8"), mode: 0o100644 },
    { name: "references/rules.md", content: readFileSync(join(skill, "references/rules.md"), "utf8"), mode: 0o100644 },
  ];
  // Use an independent ZIP implementation to generate fixtures, not the gate's reader.
  const pack = (members = entries()) => {
    const code = 'import io,json,sys,zipfile\nb=io.BytesIO()\nwith zipfile.ZipFile(b,"w") as z:\n for e in json.load(sys.stdin):\n  i=zipfile.ZipInfo(e["name"]);i.create_system=3;i.external_attr=e["mode"]<<16;i.compress_type=int(sys.argv[1]);z.writestr(i,e["content"])\nsys.stdout.buffer.write(b.getvalue())';
    writeFileSync(packagePath, execFileSync("python3", ["-c", code, String(method)], { input: JSON.stringify(members), stdio: ["pipe", "pipe", "pipe"] }));
  };
  const run = (env = {}) => {
    const r = spawnSync(process.execPath, [GATE], { cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root, ...env } });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  return { root, skill, packagePath, put, entries, pack, run };
}

for (const method of [0, 8]) test(`skill packages: valid ZIP method ${method} passes without Python on the gate PATH`, (t) => {
  const f = fixture(t, { method }); f.pack();
  const result = f.run({ PATH: "" }); assert.equal(result.code, 0, result.out);
});

test("skill packages: stale bytes fail and rebuilding the package passes", (t) => {
  const f = fixture(t); f.pack(); f.put("references/rules.md", "updated rules\n");
  const stale = f.run(); assert.equal(stale.code, 1); assert.match(stale.out, /字节与源码不一致：references\/rules\.md/);
  f.pack(); assert.equal(f.run().code, 0);
});

test("skill packages: missing members and obsolete extra members fail", (t) => {
  const f = fixture(t); f.pack(); f.put("new.md", "new source");
  assert.match(f.run().out, /缺少成员：new\.md/);
  rmSync(join(f.skill, "new.md")); f.pack([...f.entries(), { name: "obsolete.md", content: "old source", mode: 0o100644 }]);
  assert.match(f.run().out, /多余成员：obsolete\.md/);
});

test("skill packages: executable member permissions must match the source", (t) => {
  const f = fixture(t); f.put("scripts/run.sh", "echo ready\n", 0o755);
  f.pack([...f.entries(), { name: "scripts/run.sh", content: "echo ready\n", mode: 0o100644 }]);
  assert.match(f.run().out, /执行权限与源码不一致：scripts\/run\.sh/);
  f.pack([...f.entries(), { name: "scripts/run.sh", content: "echo ready\n", mode: 0o100755 }]);
  assert.equal(f.run().code, 0);
});

test("skill packages: member selection matches builders and retains the Provider interface", (t) => {
  const f = fixture(t, { rootName: "dist" });
  for (const path of ["evals/answer.md", "references/providers/demo/domain.md", "__pycache__/state", ".pytest_cache/state", ".mypy_cache/state", ".DS_Store", "dist/stale.txt"]) f.put(path, "excluded");
  f.put("references/providers/README.md", "Provider interface\n");
  f.pack([...f.entries(), { name: "references/providers/README.md", content: "Provider interface\n", mode: 0o100644 }]);
  assert.equal(f.run().code, 0);
  f.pack([...f.entries(), { name: "references/providers/README.md", content: "Provider interface\n", mode: 0o100644 }, { name: "evals/answer.md", content: "excluded", mode: 0o100644 }]);
  assert.match(f.run().out, /多余成员：evals\/answer\.md/);
});

test("skill packages: UTF-8 member names and empty directory entries work", (t) => {
  const f = fixture(t); f.put("references/说明.md", "reference\n");
  f.pack([...f.entries(), { name: "references/", content: "", mode: 0o40755 }, { name: "references/说明.md", content: "reference\n", mode: 0o100644 }]);
  assert.equal(f.run().code, 0);
});

test("skill packages: local metadata case variants follow publisher source and archive guards", (t) => {
  const f = fixture(t);
  for (const name of ["__PYCACHE__", ".PYTEST_CACHE", ".MYPY_CACHE", ".ds_store"]) {
    const path = name === ".ds_store" ? name : `${name}/state`;
    f.put(path, "local metadata"); f.pack(); assert.equal(f.run().code, 0);
    f.pack([...f.entries(), { name: path, content: "local metadata", mode: 0o100644 }]);
    assert.equal(f.run().code, 1);
  }
});

test("skill packages: duplicate and unsafe member paths are rejected", (t) => {
  const f = fixture(t); f.pack([...f.entries(), f.entries()[0]]);
  assert.match(f.run().out, /成员重复/);
  for (const name of ["../outside.md", "/absolute.md", ".GiT/config", "a\\b.md"]) {
    f.pack([...f.entries(), { name, content: "unsafe", mode: 0o100644 }]);
    assert.equal(f.run().code, 1);
  }
});

test("skill packages: symlink members and symlink sources are rejected", (t) => {
  const f = fixture(t); f.pack([...f.entries(), { name: "link", content: "SKILL.md", mode: 0o120777 }]);
  assert.match(f.run().out, /不是普通文件/);
  f.pack(); symlinkSync("SKILL.md", join(f.skill, "link"));
  assert.match(f.run().out, /源码不能是符号链接/);
});

test("skill packages: encrypted and corrupted archives are rejected", (t) => {
  const f = fixture(t); f.pack(); const original = readFileSync(f.packagePath);
  writeFileSync(f.packagePath, original.subarray(0, original.length - 3));
  assert.equal(f.run().code, 1);
  const encrypted = Buffer.from(original), central = encrypted.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  encrypted.writeUInt16LE(1, central + 8); writeFileSync(f.packagePath, encrypted);
  assert.equal(f.run().code, 1);
  const badCrc = Buffer.from(original); badCrc.writeUInt32LE(0, central + 16); writeFileSync(f.packagePath, badCrc);
  assert.match(f.run().out, /成员校验失败/);
});

test("skill packages: directory entries cannot hide file content", (t) => {
  const f = fixture(t); f.pack([...f.entries(), { name: "hidden/", content: "unexpected", mode: 0o40755 }]);
  assert.match(f.run().out, /目录不能携带文件内容/);
});

test("skill packages: an additional archive in dist is checked too", (t) => {
  const f = fixture(t); f.pack(); mkdirSync(join(f.skill, "dist/alternate")); writeFileSync(join(f.skill, "dist/alternate/old.skill"), "invalid archive");
  assert.equal(f.run().code, 1);
});

test("skill packages: no generated package is not mistaken for a validated package", (t) => {
  const f = fixture(t); const result = f.run();
  assert.equal(result.code, 0); assert.match(result.out, /没有已生成的/);
});

for (const dist of ["empty", "missing", "prompt-only"]) test(`skill packages: each missing package is explicitly skipped with ${dist} dist`, (t) => {
  const f = fixture(t); f.pack();
  const missing = join(f.root, "skills/other");
  mkdirSync(missing); writeFileSync(join(missing, "SKILL.md"), "other skill entry\n");
  if (dist !== "missing") mkdirSync(join(missing, "dist"));
  if (dist === "prompt-only") writeFileSync(join(missing, "dist/other-universal-prompt.md"), "prompt\n");
  let result = f.run();
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /skills\/other[^\n]*跳过[^\n]*未验证/);
  assert.doesNotMatch(result.out, /skills\/demo[^\n]*跳过/);
  // A skip must not mask validation failures in the other skill's existing package.
  f.put("references/rules.md", "changed source\n");
  result = f.run(); assert.equal(result.code, 1, result.out);
  assert.match(result.out, /字节与源码不一致/);
  assert.match(result.out, /skills\/other[^\n]*跳过/);
  rmSync(f.packagePath);
  result = f.run(); assert.equal(result.code, 0, result.out);
  for (const name of ["demo", "other"]) assert.match(result.out, new RegExp(`skills/${name}[^\\n]*跳过[^\\n]*未验证`));
});
