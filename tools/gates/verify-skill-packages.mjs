#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { ROOT, CONFIG, report } from "./lib/verify-common.mjs";

const RULE = "verify-skill-packages";
const IGNORED = new Set([".git", "dist", "__pycache__", ".pytest_cache", ".mypy_cache", ".DS_Store"]);
const LOCAL_METADATA = new Set([".ds_store", "__pycache__", ".pytest_cache", ".mypy_cache"]);
const CRC = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function checksum(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function requireZip(condition, message) {
  if (!condition) throw new Error(message);
}

// Read ordinary stored/deflated build outputs in memory; never extract members.
function members(bytes) {
  requireZip(bytes.length <= 20 * 1024 * 1024, "安装包超过 20 MiB");
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50 && i + 22 + bytes.readUInt16LE(i + 20) === bytes.length) { end = i; break; }
  }
  requireZip(end >= 0, "ZIP 目录缺失或损坏");
  const count = bytes.readUInt16LE(end + 10), size = bytes.readUInt32LE(end + 12);
  let cursor = bytes.readUInt32LE(end + 16), expanded = 0;
  requireZip(bytes.readUInt16LE(end + 4) === 0 && bytes.readUInt16LE(end + 6) === 0 && bytes.readUInt16LE(end + 8) === count && count <= 5000 && cursor + size === end, "不支持的 ZIP 目录；请用 skill 构建脚本重建");
  const result = new Map(), names = new Set();
  for (let i = 0; i < count; i++) {
    requireZip(cursor + 46 <= end && bytes.readUInt32LE(cursor) === 0x02014b50, "ZIP 成员目录损坏");
    const flags = bytes.readUInt16LE(cursor + 8), method = bytes.readUInt16LE(cursor + 10);
    const crc = bytes.readUInt32LE(cursor + 16), compressedSize = bytes.readUInt32LE(cursor + 20), length = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28), extraLength = bytes.readUInt16LE(cursor + 30), commentLength = bytes.readUInt16LE(cursor + 32);
    const mode = bytes.readUInt32LE(cursor + 38) >>> 16, offset = bytes.readUInt32LE(cursor + 42);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    requireZip(next <= end && !(flags & 1) && [0, 8].includes(method) && bytes.readUInt16LE(cursor + 34) === 0, "加密、压缩方法或成员目录不受支持");
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = new TextDecoder("utf-8", { fatal: true }).decode(nameBytes);
    const directory = name.endsWith("/"), path = directory ? name.slice(0, -1) : name;
    requireZip(!directory || length === 0, "ZIP 目录不能携带文件内容");
    requireZip(path && !path.startsWith("/") && !/^[a-z]:/i.test(path) && !/[\\\x00-\x1f\x7f]/.test(path) && !path.split("/").some((p) => !p || p === "." || p === ".." || p.toLowerCase() === ".git" || LOCAL_METADATA.has(p.toLowerCase())), "ZIP 成员路径不安全");
    requireZip(!names.has(name), `ZIP 成员重复：${name}`); names.add(name);
    requireZip([0, 0o100000, 0o040000].includes(mode & 0o170000) && (directory || (mode & 0o170000) !== 0o040000), `ZIP 成员不是普通文件：${name}`);
    requireZip(offset + 30 <= cursor && bytes.readUInt32LE(offset) === 0x04034b50 && bytes.readUInt16LE(offset + 6) === flags && bytes.readUInt16LE(offset + 8) === method, "ZIP 本地成员头损坏");
    const localNameLength = bytes.readUInt16LE(offset + 26), localExtraLength = bytes.readUInt16LE(offset + 28);
    const start = offset + 30 + localNameLength + localExtraLength;
    requireZip(bytes.subarray(offset + 30, offset + 30 + localNameLength).equals(nameBytes) && start + compressedSize <= bytes.readUInt32LE(end + 16), "ZIP 本地成员与目录不一致");
    expanded += length;
    requireZip(expanded <= 50 * 1024 * 1024, "ZIP 展开内容超过 50 MiB");
    const compressed = bytes.subarray(start, start + compressedSize);
    const content = method === 0 ? compressed : inflateRawSync(compressed, { maxOutputLength: Math.max(1, length) });
    requireZip(content.length === length && checksum(content) === crc, `ZIP 成员校验失败：${name}`);
    if (!directory) result.set(path, { bytes: content, executable: Boolean(mode & 0o111) });
    cursor = next;
  }
  requireZip(cursor === end, "ZIP 成员数量与目录不一致");
  return result;
}

function inputs(skill) {
  const files = new Map();
  function visit(dir, parts = []) {
    for (const name of readdirSync(dir)) {
      if (IGNORED.has(name) || LOCAL_METADATA.has(name.toLowerCase())) continue;
      const path = join(dir, name), rel = [...parts, name], st = lstatSync(path);
      if (rel[0] === "evals") continue;
      if (rel[0] === "references" && rel[1] === "providers" && rel.length >= 3 && st.isDirectory()) continue;
      if (st.isSymbolicLink()) throw new Error(`源码不能是符号链接：${rel.join("/")}`);
      if (st.isDirectory()) visit(path, rel);
      else if (st.isFile()) files.set(rel.join("/"), { bytes: readFileSync(path), executable: Boolean(st.mode & 0o111) });
    }
  }
  visit(skill);
  return files;
}

const violations = [], skills = resolve(ROOT, CONFIG.gates.skillsDir);
let checked = 0;
for (const name of readdirSync(skills)) {
  const skill = join(skills, name), dist = join(skill, "dist");
  if (!statSync(skill).isDirectory() || !existsSync(join(skill, "SKILL.md"))) continue;
  const archives = [];
  function find(dir) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name), st = lstatSync(path);
      if (st.isDirectory()) find(path);
      else if (name.endsWith(".skill")) archives.push(path);
    }
  }
  if (existsSync(dist)) find(dist);
  if (!archives.length) {
    console.log(`${RULE}：${relative(ROOT, skill)} 没有已生成的 .skill 安装包，跳过成员核对（未验证分发产物）`);
    continue;
  }
  for (const path of archives) {
    const file = relative(ROOT, path), fix = "用该 skill 的构建脚本重建安装包，并检查源码及文件执行权限";
    try {
      requireZip(!lstatSync(path).isSymbolicLink() && statSync(path).size <= 20 * 1024 * 1024, "安装包路径无效或超过 20 MiB");
      const expected = inputs(skill), actual = members(readFileSync(path)); checked++;
      for (const key of expected.keys()) if (!actual.has(key)) violations.push({ file, detail: `安装包缺少成员：${key}`, fix });
      for (const [key, member] of actual) {
        const source = expected.get(key);
        if (!source) violations.push({ file, detail: `安装包多余成员：${key}`, fix });
        else if (!member.bytes.equals(source.bytes)) violations.push({ file, detail: `成员字节与源码不一致：${key}`, fix });
        else if (member.executable !== source.executable) violations.push({ file, detail: `成员执行权限与源码不一致：${key}`, fix });
      }
    } catch (e) { violations.push({ file, detail: e.message, fix }); }
  }
}
if (!checked && !violations.length) console.log(`${RULE}：没有已生成的 .skill 安装包，跳过成员核对`);
process.exit(report(RULE, violations));
