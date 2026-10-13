#!/usr/bin/env node
// 聚合命令：依次运行全部门禁，每一道都跑完，最后以最差的退出码结束（2 配置错误 > 1 有违规 > 0 通过）。
// 宿主自己的门禁在 cookbook.config.json 的 gates.extraGates 里声明，也可作为参数追加：node doc-sync.mjs scripts/verify-x.mjs
// 读取配置在运行任何门禁之前：配置读不懂时直接以退出码 2 结束
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GATES = ["verify-skill-frontmatter", "verify-skill-generic-layer", "verify-skill-host-paths", "verify-decision-format", "verify-no-section-sign", "verify-translation-sync"]
  .map((g) => join(HERE, `${g}.mjs`));
const { ROOT, CONFIG } = await import("./lib/verify-common.mjs");
const extra = [...CONFIG.gates.extraGates.map((p) => resolve(ROOT, p)), ...process.argv.slice(2).map((p) => resolve(p))];

// 追加的门禁文件不存在（或不是文件）属于配置错误（2），不能和「有违规」（1）混为一谈；其余门禁照常跑完
const missing = extra.filter((p) => !existsSync(p) || !statSync(p).isFile());
let worst = 0;
if (missing.length) {
  console.error(`doc-sync：追加的门禁不存在：${missing.join("、")}`);
  worst = 2;
}

for (const gate of [...GATES, ...extra.filter((p) => !missing.includes(p))]) {
  const r = spawnSync(process.execPath, [gate], { stdio: "inherit" });
  // 门禁的退出码只有三档；宿主门禁给出 0、1 之外的退出码（含被信号终止）一律按配置错误计
  worst = Math.max(worst, r.status === 0 || r.status === 1 ? r.status : 2);
}
process.exit(worst);
