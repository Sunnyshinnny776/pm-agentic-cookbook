#!/usr/bin/env node
// hook 的输入输出与文本处理，全部用 node 完成，hook 除 node、git、bash 外不依赖其他命令行工具。
//   node io.mjs file-path      从 stdin 读 hook 事件 JSON，输出被编辑文件的真实路径（文件已不存在时原样输出；没有则输出为空）
//   node io.mjs emit [事件名]   从 stdin 读消息正文，输出 hook 结果 JSON；给了事件名时同时写入 additionalContext
//   node io.mjs count          输出 stdin 中非空行的行数
//   node io.mjs hash           输出 stdin 内容的 sha1
//   node io.mjs cat-files      stdin 为 NUL 分隔的文件路径（git ls-files -z 的输出），依次输出路径与文件内容（用于把未跟踪文件的内容纳入签名）
//   node io.mjs tail <N>       输出 stdin 的最后 N 行
//   node io.mjs remind-once <状态文件>  stdin 为本次改动的签名：与状态文件记录的相同时以退出码 1 结束；不同则记下新签名、退出码 0
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [cmd, arg] = process.argv.slice(2);
let input = "";
for await (const chunk of process.stdin) input += chunk;

if (cmd === "file-path") {
  let p = "";
  try {
    const j = JSON.parse(input);
    p = j?.tool_input?.file_path ?? j?.tool_response?.filePath ?? "";
  } catch {}
  // 取真实路径：经符号链接或系统别名（如 macOS 的 /tmp）给出的路径，才能与宿主根按前缀比对
  console.log(p && existsSync(p) ? realpathSync(p) : p);
} else if (cmd === "emit") {
  const m = input.replace(/\n+$/, "");
  const out = { systemMessage: m };
  if (arg) out.hookSpecificOutput = { hookEventName: arg, additionalContext: m };
  console.log(JSON.stringify(out, null, 2));
} else if (cmd === "count") {
  // 用 stdout.write 输出纯文本：console.log 输出数字时，设了 FORCE_COLOR 的环境会加上颜色码
  process.stdout.write(String(input.split("\n").filter((l) => l.trim()).length) + "\n");
} else if (cmd === "hash") {
  console.log(createHash("sha1").update(input).digest("hex"));
} else if (cmd === "cat-files") {
  for (const f of input.split("\0").filter(Boolean)) {
    process.stdout.write(`${f}\n`);
    if (existsSync(f) && statSync(f).isFile()) process.stdout.write(readFileSync(f));
  }
} else if (cmd === "tail") {
  const n = Number(arg) || 20;
  console.log(input.replace(/\n+$/, "").split("\n").slice(-n).join("\n"));
} else if (cmd === "remind-once") {
  if (existsSync(arg) && readFileSync(arg, "utf8") === input) process.exit(1);
  mkdirSync(dirname(arg), { recursive: true });
  writeFileSync(arg, input);
} else {
  console.error(`未知命令：${cmd ?? ""}`);
  process.exit(2);
}
