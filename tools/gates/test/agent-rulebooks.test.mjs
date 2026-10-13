import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";

const GATES = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const authority = "# Contributor instructions\n\nIf you use this toolkit, read AGENT_GUIDE.md. These rules govern modifying this repository.\n";
function fixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "cookbook-rulebooks-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  mkdirSync(join(root, "skills"));
  const files = {
    "AGENTS.md": authority,
    "CLAUDE.md": "@AGENTS.md\n\nClaude Code integration information.\n",
    "GEMINI.md": "@./AGENTS.md\n\nGemini CLI integration information.\n",
    "cookbook.config.json": JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["."] } }),
    ...overrides,
  };
  for (const [name, text] of Object.entries(files)) if (text !== null) writeFileSync(join(root, name), text);
  const run = (gate = "verify-agent-rulebooks") => {
    const r = spawnSync(process.execPath, [join(GATES, `${gate}.mjs`)], {
      cwd: root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: root },
    });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  return { root, run, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("adapters: valid host imports and host integration headings pass", () => {
  const h = fixture({ "CLAUDE.md": "@AGENTS.md\n\n## Claude Code integration\nHook locations.\n" });
  try { assert.equal(h.run().code, 0); } finally { h.done(); }
});

test("adapters: missing files and directories fail", () => {
  for (const file of ["AGENTS.md", "CLAUDE.md", "GEMINI.md"]) {
    const h = fixture({ [file]: null });
    try {
      assert.equal(h.run().code, 1);
      mkdirSync(join(h.root, file));
      assert.equal(h.run().code, 1);
    } finally { h.done(); }
  }
});

test("adapters: quoted, commented, fenced, late and unrelated imports fail", () => {
  for (const text of ["`@AGENTS.md`", "<!-- @AGENTS.md -->", "```\n@AGENTS.md\n```", "Read first.\n@AGENTS.md", "@OTHER.md"]) {
    const h = fixture({ "CLAUDE.md": text + "\n" });
    try { assert.equal(h.run().code, 1, text); } finally { h.done(); }
  }
});

test("adapters: CRLF imports pass", () => {
  const h = fixture({ "GEMINI.md": "@./AGENTS.md\r\n\r\nGemini integration.\r\n" });
  try { assert.equal(h.run().code, 0); } finally { h.done(); }
});

test("adapters: forty lines pass and forty-one fail", () => {
  for (const [count, expected] of [[40, 0], [41, 1]]) {
    const h = fixture({ "CLAUDE.md": ["@AGENTS.md", ...Array(count - 1).fill("Host integration detail.")].join("\n") + "\n" });
    try { assert.equal(h.run().code, expected); } finally { h.done(); }
  }
});

test("adapters: shared rules cannot hide in decorated or setext headings", () => {
  for (const heading of ["## Shared rules", "### **Permissions**", "Git workflow\n---", "Security policy\n===", "## CONTRIBUTIONS"]) {
    const h = fixture({ "GEMINI.md": "@./AGENTS.md\n\n" + heading + "\n" });
    try { assert.equal(h.run().code, 1, heading); } finally { h.done(); }
  }
});

test("adapters: literal headings inside code samples do not count", () => {
  const h = fixture({ "GEMINI.md": "@./AGENTS.md\n\n```text\n## Rules\n```\n" });
  try { assert.equal(h.run().code, 0); } finally { h.done(); }
});

test("authority: routing must be in the opening prose, not a code sample or later section", () => {
  for (const text of ["# Instructions\n\nNo routing.\n", "```\n" + authority + "```\n", "# Instructions\n\n## Later\n" + authority]) {
    const h = fixture({ "AGENTS.md": text });
    try { assert.equal(h.run().code, 1); } finally { h.done(); }
  }
});

test("authority: routing in a later paragraph cannot substitute for the first paragraph", () => {
  const h = fixture({ "AGENTS.md": "# Instructions\n\nThese instructions govern contributors.\n\nIf you use this toolkit, read AGENT_GUIDE.md. These rules govern modifying this repository.\n" });
  try { assert.equal(h.run().code, 1); } finally { h.done(); }
});

test("adapters: branching, code standards and privacy titles are shared-rule headings", () => {
  for (const heading of ["Branching strategy", "Code standards", "Privacy"]) {
    const h = fixture({ "GEMINI.md": `@./AGENTS.md\n\n## ${heading}\nAll contributors must follow these shared requirements.\n` });
    try { assert.equal(h.run().code, 1, heading); } finally { h.done(); }
  }
});

test("adapters: host permissions integration headings remain available", () => {
  const h = fixture({ "GEMINI.md": "@./AGENTS.md\n\n## Gemini CLI permissions integration\nGemini CLI local permissions configuration resides in settings.json.\n" });
  try { assert.equal(h.run().code, 0); } finally { h.done(); }
});

test("aggregator: adapter violations do not skip other gates", () => {
  const h = fixture({
    "CLAUDE.md": "## Rules\n",
    "cookbook.config.json": JSON.stringify({ gates: { skillsDir: "skills", styleScanRoots: ["."], extraGates: ["tools/gates/verify-agent-rulebooks.mjs"] } }),
  });
  try {
    cpSync(GATES, join(h.root, "tools/gates"), { recursive: true });
    const r = spawnSync(process.execPath, [join(h.root, "tools/gates/doc-sync.mjs")], {
      cwd: h.root, encoding: "utf8", env: { ...process.env, COOKBOOK_HOST_ROOT: h.root },
    });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /verify-translation-sync/);
    assert.match(r.stderr, /verify-agent-rulebooks/);
  } finally { h.done(); }
});
