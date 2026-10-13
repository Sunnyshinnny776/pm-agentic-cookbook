#!/usr/bin/env node
// Contributor rulebooks: one authority and two short, host-specific adapters.
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, maskFences, report } from "./lib/verify-common.mjs";

const RULE = "verify-agent-rulebooks";
const MAX_LINES = 40;
const violations = [];
const add = (file, line, detail, fix) => violations.push({ file, line, detail, fix });
const read = (file) => {
  const path = resolve(ROOT, file);
  if (!existsSync(path) || !statSync(path).isFile()) {
    add(file, null, "Required rulebook is missing or is not a file", "Add the contributor rulebook");
    return null;
  }
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
};

const authority = read("AGENTS.md");
if (authority !== null) {
  const intro = maskFences(authority)
    .replace(/^ {0,3}#[ \t]+[^\n]*\n(?:[ \t]*\n)*/, "")
    .trimStart().split(/\n[ \t]*\n/)[0];
  if (!/\buse\b/i.test(intro) || !/\bAGENT_GUIDE\.md\b/.test(intro) ||
      !/\bmodify(?:ing)?\b/i.test(intro) || !/\brepository\b/i.test(intro)) {
    add("AGENTS.md", 1, "Missing use-versus-contribute routing in the opening section",
      "Route toolkit users to AGENT_GUIDE.md and state that these rules govern modifying this repository");
  }
}

const ruleHeading = /\b(rules?|polic(?:y|ies)|permissions?|requirements?|workflow|contributions?|licensing|validation|security|git|language|testing|decisions?|branching|standards?|privacy)\b/i;
const hostIntegrationHeading = /^(Claude Code|Gemini CLI)( (permissions|security|hooks?|settings|skill discovery))? integration$/i;
for (const file of ["CLAUDE.md", "GEMINI.md"]) {
  const text = read(file);
  if (text === null) continue;
  const lines = text.replace(/\n$/, "").split("\n");
  if (!/^@(?:\.\/)?AGENTS\.md$/.test(lines[0])) {
    add(file, 1, "The first line does not import AGENTS.md",
      "Use @AGENTS.md or @./AGENTS.md as the first line, outside Markdown code");
  }
  if (lines.length > MAX_LINES) {
    add(file, null, `Adapter has ${lines.length} lines; limit is ${MAX_LINES}`,
      "Move shared rules to AGENTS.md and keep only host integration information");
  }
  const prose = maskFences(text).split("\n");
  for (let i = 0; i < prose.length; i++) {
    const heading = prose[i].match(/^ {0,3}#{1,6}\s+(.+)/)?.[1] ??
      (/^ {0,3}(?:=+|-+)\s*$/.test(prose[i + 1] ?? "") ? prose[i].trim() : null);
    if (heading && ruleHeading.test(heading.replace(/[*_`]/g, "")) &&
        !hostIntegrationHeading.test(heading.replace(/[*_`]/g, "").replace(/\s+#+\s*$/, "").trim())) {
      add(file, i + 1, `Shared-rule heading in a host adapter: ${heading}`,
        "Keep the shared rule in AGENTS.md");
    }
  }
}

process.exit(report(RULE, violations));
