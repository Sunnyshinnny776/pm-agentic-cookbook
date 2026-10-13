// 门禁脚本的共享工具。只放各门禁都要用的东西，不做框架。
import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CONFIG_FILE = "cookbook.config.json";

/** 配置或环境不可用时直接失败，退出码 2。门禁宁可报错，也不在读不懂配置时静默放行。 */
function fail(msg) {
  console.error(`${CONFIG_FILE} 配置错误：${msg}`);
  process.exit(2);
}

/**
 * 宿主仓库根，一律取真实路径。依次取：环境变量 COOKBOOK_HOST_ROOT；当前目录所在 git 仓库的根；
 * 当前目录不在任何 git 仓库里时（如在 home 目录直接调用门禁），取 cookbook 自身所在 git 仓库的根；都没有就用当前目录。
 */
function hostRoot() {
  if (process.env.COOKBOOK_HOST_ROOT) {
    const p = resolve(process.env.COOKBOOK_HOST_ROOT);
    if (!existsSync(p)) fail(`环境变量 COOKBOOK_HOST_ROOT 指向的目录不存在：${p}`);
    return realpathSync(p);
  }
  const toplevel = (cwd) => {
    try {
      return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return null;
    }
  };
  return toplevel(process.cwd()) ?? toplevel(dirname(fileURLToPath(import.meta.url))) ?? realpathSync(process.cwd());
}

export const ROOT = hostRoot();
/** cookbook 自身所在目录的真实绝对路径（tools/gates/lib 往上三级），不论它在不在宿主仓库内都取得到。 */
export const COOKBOOK_ABS = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../.."));
/** cookbook 自身所在目录（tools/gates/lib 往上三级），相对宿主根；cookbook 不在宿主仓库内时为 null。 */
const cookbookRel = relative(ROOT, COOKBOOK_ABS);
export const COOKBOOK = cookbookRel.startsWith("..") || isAbsolute(cookbookRel) ? null : cookbookRel || ".";

/** 缺省值只从 cookbook 自身位置推导；cookbook 在宿主仓库之外（如经符号链接接入）时推导不出，要求显式声明。 */
function cookbookDefault(field, sub = "") {
  if (COOKBOOK === null) fail(`cookbook 位于宿主仓库之外（${COOKBOOK_ABS}），推导不出 ${field} 的缺省值；请显式声明 ${field}`);
  return sub ? join(COOKBOOK, sub) : COOKBOOK;
}

/** 绝对路径的真实路径：路径本身不存在时（如含 <module> 占位符），对已存在的最长前缀取真实路径再拼回余下部分。 */
function realOf(p) {
  let head = p, rest = "";
  while (!existsSync(head)) {
    const up = dirname(head);
    if (up === head) return p;
    rest = join(basename(head), rest);
    head = up;
  }
  return rest ? join(realpathSync(head), rest) : realpathSync(head);
}
/**
 * 靠 git 判断改动的字段（章节号符的扫描根、hooks 的监视路径）不能经符号链接指到仓外：
 * git 只把符号链接当成一个文件，看不到它指向的内容的改动，检查会静默不生效。
 */
const linksOut = (rel) => {
  const real = relative(ROOT, realOf(resolve(ROOT, rel)));
  return real === ".." || real.startsWith("../") || isAbsolute(real);
};
const linkOutReason = (field, rel) => `${field} 的 ${rel} 经符号链接指到宿主仓库之外：git 看不到那里的改动，检查不会生效。请在被链接内容所在的仓库里运行门禁`;
function gitTracked(field, rel) {
  if (linksOut(rel)) fail(linkOutReason(field, rel));
  return rel;
}
/**
 * 规范化配置里的路径：「./docs」「docs/」都当作「docs」；绝对路径换算成相对宿主根的路径。
 * 落在宿主仓库之外的路径直接拒绝——按相对前缀比对的检查会对它们静默失配。
 */
function hostPath(field, p) {
  // 绝对路径先取真实路径再换算：宿主根是真实路径，经别名（如 macOS 的 /tmp）给出的路径否则会被误判为宿主之外
  const abs = isAbsolute(p) ? realOf(p) : p;
  const rel = normalize(isAbsolute(abs) ? relative(ROOT, abs) : abs).replace(/\/+$/, "") || ".";
  if (rel === ".." || rel.startsWith("../") || isAbsolute(rel)) fail(`${field} 落在宿主仓库之外：${p}`);
  // 相对路径按写法判断，不追符号链接：经仓库内符号链接接入仓外目录（如 cookbook 或其 skills 目录）是支持的接入方式
  return rel;
}

// null 视为写错，不当作未声明：未声明请直接省略该键
function str(section, obj, key) {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (typeof v !== "string" || !v.trim()) fail(`${section}.${key} 必须是非空字符串`);
  return v;
}
function list(section, obj, key, { allowEmpty, emptyHint = "门禁会一个文件都不查却报通过" }) {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !x.trim())) fail(`${section}.${key} 必须是由非空字符串组成的数组`);
  if (!allowEmpty && v.length === 0) fail(`${section}.${key} 不能是空数组：${emptyHint}`);
  return v;
}
function obj(section, raw) {
  const v = raw[section];
  if (v === undefined) return undefined;
  if (typeof v !== "object" || v === null || Array.isArray(v)) fail(`${section} 必须是对象`);
  return v;
}
function mustExist(field, path, kind) {
  const abs = resolve(ROOT, path);
  const st = existsSync(abs) ? statSync(abs) : null;
  const ok = st && (kind === "dir" ? st.isDirectory() : kind === "file" ? st.isFile() : true);
  const what = { dir: "目录", file: "文件", any: "目录或文件" }[kind];
  if (!ok) fail(`${field} 指向的${what}不存在：${path}`);
}

/** 宿主契约中 spec 地图的角色闭集，含义见 process/kit-architecture.md「宿主契约」一节。 */
export const SPEC_ROLES = ["index", "loading-rule", "ui-ux", "integration", "testing", "engineering", "security"];
/** 领域词表所在目录：一个领域一份 <domain>.json。 */
export const WORDS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../domain-words");

// 允许出现的配置键。拼错的键不能被静默忽略：那会让对应的检查悄悄退回缺省或直接跳过
const KNOWN = {
  "": ["_", "gates", "hooks", "host"],
  gates: ["_", "skillsDir", "decisionsDir", "styleScanRoots", "baselineFile", "baseRef", "domainWords", "hostPrivatePatterns", "extraGates"],
  hooks: ["_", "captureWatchPaths", "docSyncWatchPaths", "codeReviewWatchPaths", "docSyncCommand"],
  host: ["_", "specMap", "moduleDocs", "testsDir", "processRecordsDir", "rulebooks"],
};
function rejectUnknown(section, o) {
  const bad = Object.keys(o).filter((k) => !KNOWN[section].includes(k));
  if (bad.length) fail(`${section ? section + " 中" : "顶层"}有不认识的键：${bad.join("、")}（可用：${KNOWN[section].join("、")}）`);
}

const shellQuote = (s) => `'${s.replace(/'/g, `'\\''`)}'`;

/** 宿主契约（host 一节）：供 skill 读取的宿主目录约定。整节可以不写；写了就逐项校验。 */
function loadHost(h) {
  if (h === undefined) return null;
  rejectUnknown("host", h);
  const host = { specMap: null, moduleDocs: null, testsDir: null, processRecordsDir: null, rulebooks: null };
  if (h.specMap !== undefined) {
    if (typeof h.specMap !== "object" || h.specMap === null || Array.isArray(h.specMap)) fail("host.specMap 必须是对象：键为 spec 角色，值为路径数组");
    const bad = Object.keys(h.specMap).filter((k) => k !== "_" && !SPEC_ROLES.includes(k));
    if (bad.length) fail(`host.specMap 中有不认识的角色：${bad.join("、")}（可用：${SPEC_ROLES.join("、")}）`);
    host.specMap = {};
    for (const role of Object.keys(h.specMap).filter((k) => k !== "_")) {
      const paths = list("host.specMap", h.specMap, role, { allowEmpty: false, emptyHint: "声明了角色就要登记路径，不用就省略该角色" }).map((p) => hostPath(`host.specMap.${role}`, p));
      for (const p of paths) mustExist(`host.specMap.${role}`, p, "any");
      host.specMap[role] = paths;
    }
  }
  if (str("host", h, "moduleDocs")) {
    // 先规范化再查占位符：「docs/<module>/../x」规范化后占位符就没了
    const md = hostPath("host.moduleDocs", h.moduleDocs);
    if (!md.includes("<module>")) fail("host.moduleDocs 必须含占位符 <module>，例如 modules/<module>");
    // 占位符可以只占路径段的一部分（如 modules/m-<module>）：校验的是占位符所在路径段的上一级目录
    const segs = md.split("/");
    mustExist("host.moduleDocs 的上级目录", segs.slice(0, segs.findIndex((x) => x.includes("<module>"))).join("/") || ".", "dir");
    host.moduleDocs = md;
  }
  for (const k of ["testsDir", "processRecordsDir"])
    if (str("host", h, k)) {
      const v = normalize(h[k]).replace(/\/+$/, "");
      // 先看原值：「a/../b」规范化后合法，但 skill 读到的是原值
      if (h[k].split(/[\\/]/).includes("..") || isAbsolute(v) || v === "." || v.includes("<module>")) fail(`host.${k} 必须是相对模块目录的子路径（可以多级，不得含 .. 与 <module>）`);
      host[k] = v;
    }
  if (list("host", h, "rulebooks", { allowEmpty: false, emptyHint: "声明了就要列出规则文件，不用就省略该键" })) {
    host.rulebooks = h.rulebooks.map((p) => hostPath("host.rulebooks", p));
    for (const p of host.rulebooks) mustExist("host.rulebooks", p, "file");
  }
  return host;
}

/**
 * 读宿主根目录的 cookbook.config.json，校验并补齐缺省值。
 * 推导不出缺省值的字段（决策档案目录、豁免清单）留空，由各门禁自行声明跳过。
 */
export function loadConfig() {
  const f = resolve(ROOT, CONFIG_FILE);
  let raw = {};
  if (existsSync(f)) {
    try { raw = JSON.parse(readFileSync(f, "utf8")); } catch (e) { fail(`不是合法的 JSON：${e.message}`); }
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail("顶层必须是对象");
  rejectUnknown("", raw);
  const g = obj("gates", raw) ?? {};
  const h = obj("hooks", raw) ?? {};
  const hostRaw = obj("host", raw);
  rejectUnknown("gates", g);
  rejectUnknown("hooks", h);

  const gates = {
    skillsDir: hostPath("gates.skillsDir", str("gates", g, "skillsDir") ?? cookbookDefault("gates.skillsDir", "skills")),
    decisionsDir: str("gates", g, "decisionsDir") ? hostPath("gates.decisionsDir", g.decisionsDir) : null,
    styleScanRoots: (list("gates", g, "styleScanRoots", { allowEmpty: false }) ?? [cookbookDefault("gates.styleScanRoots")]).map((p) => gitTracked("gates.styleScanRoots", hostPath("gates.styleScanRoots", p))),
    baselineFile: str("gates", g, "baselineFile") ? hostPath("gates.baselineFile", g.baselineFile) : null,
    baseRef: str("gates", g, "baseRef") ?? "origin/main",
    domainWords: list("gates", g, "domainWords", { allowEmpty: true }) ?? null,
    hostPrivatePatterns: list("gates", g, "hostPrivatePatterns", { allowEmpty: true }) ?? [],
    extraGates: (list("gates", g, "extraGates", { allowEmpty: true }) ?? []).map((p) => hostPath("gates.extraGates", p)),
  };
  mustExist("gates.skillsDir", gates.skillsDir, "dir");
  if (gates.decisionsDir) mustExist("gates.decisionsDir", gates.decisionsDir, "dir");
  if (gates.baselineFile) mustExist("gates.baselineFile", gates.baselineFile, "file");
  for (const p of gates.extraGates) mustExist("gates.extraGates", p, "file");
  // 扫描根可以是目录，也可以是单个文件；写错一个字就会一个文件都不查，所以逐项校验
  for (const r of gates.styleScanRoots) if (r !== ".") mustExist("gates.styleScanRoots", r, "any");
  // 声明的领域词表必须存在；在这里统一校验，各道门禁对同一份配置给出同一个结论
  for (const d of gates.domainWords ?? []) {
    if (!/^[A-Za-z0-9_-]+$/.test(d)) fail(`gates.domainWords 中的「${d}」不是合法的词表名`);
    if (!existsSync(join(WORDS_DIR, `${d}.json`))) fail(`gates.domainWords 中的领域词表不存在：${d}`);
  }

  // hooks 的监视路径允许显式写空数组，表示关闭对应的提醒或检查。
  // 缺省值依赖 cookbook 位置；推导不出时记为 null，由 hook 读取时报错——只跑门禁的宿主不受影响
  const hookDefault = (...extra) => (COOKBOOK === null ? null : [COOKBOOK, ...extra]);
  // 显式声明的监视路径经符号链接指到仓外时直接报错。推导出的缺省值（cookbook 目录、gates.decisionsDir）出这个问题时，
  // 不让门禁失败——那些字段本身是受支持的接入方式——只把该 hooks 字段记为不可用，由 hook 读取时点名来源报错
  const hookErrors = {};
  const watch = (key, dflt) => {
    const declared = list("hooks", h, key, { allowEmpty: true });
    if (declared) return declared.map((p) => gitTracked(`hooks.${key}`, hostPath(`hooks.${key}`, p)));
    if (!dflt) return null;
    const out = dflt.map((p) => hostPath(`hooks.${key}`, p)).find(linksOut);
    if (out) {
      // cookbook 目录在宿主仓库之外时缺省值整体推导不出（hookDefault 为 null），能经符号链接出仓的只有 decisionsDir
      hookErrors[key] = `hooks.${key} 未声明，它的缺省值包含 ${out}（来自 gates.decisionsDir），而 ${out} 经符号链接指到宿主仓库之外，git 看不到那里的改动。请显式声明 hooks.${key}`;
      return null;
    }
    return dflt.map((p) => hostPath(`hooks.${key}`, p));
  };
  const hooks = {
    captureWatchPaths: watch("captureWatchPaths", hookDefault()),
    docSyncWatchPaths: watch("docSyncWatchPaths", hookDefault(...(gates.decisionsDir ? [gates.decisionsDir] : []))),
    codeReviewWatchPaths: watch("codeReviewWatchPaths", []),
    // 默认直接运行 cookbook 自带的聚合命令：hook 只依赖 node、git、bash，也不假设宿主有某个 npm 脚本名
    docSyncCommand: str("hooks", h, "docSyncCommand") ?? `node ${shellQuote(join(COOKBOOK_ABS, "tools/gates/doc-sync.mjs"))}`,
  };
  return { gates, hooks, hookErrors, host: loadHost(hostRaw) };
}

export const CONFIG = loadConfig();

// 构建产物目录 dist/ 不在这里跳过：只有 skill 的 dist/ 是构建产物，由各门禁按位置排除
const DEFAULT_IGNORE = new Set(["node_modules", ".git", "__pycache__", ".DS_Store"]);

/** 递归遍历目录，返回相对仓库根的路径。 */
export function walk(dir, { ext = [".md"], ignore = DEFAULT_IGNORE } = {}) {
  const out = [];
  const abs = resolve(ROOT, dir);
  if (!existsSync(abs)) return out;
  (function rec(d) {
    for (const name of readdirSync(d)) {
      if (ignore.has(name)) continue;
      const p = join(d, name);
      if (statSync(p).isDirectory()) rec(p);
      else if (ext.some((e) => name.endsWith(e))) out.push(relative(ROOT, p));
    }
  })(abs);
  return out.sort();
}

/** 解析 frontmatter。无 frontmatter 时 fm 为 null，body 为全文。 */
export function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return { fm: null, body: text, fmRaw: "" };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { fm: null, body: text, fmRaw: "" };
  const raw = text.slice(4, end);
  const fm = {};
  for (const line of raw.split("\n")) {
    if (/^\s/.test(line) || !line.includes(":")) continue;
    const i = line.indexOf(":");
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: text.slice(end + 4), fmRaw: raw };
}

/** 读豁免清单。每条必须有 reason，缺 reason 直接报错——豁免必须写明理由。 */
export function loadBaseline(rule) {
  if (!CONFIG.gates.baselineFile) return [];
  const f = resolve(ROOT, CONFIG.gates.baselineFile);
  if (!existsSync(f)) return [];
  const all = JSON.parse(readFileSync(f, "utf8"));
  const entries = all[rule] ?? [];
  const bad = entries.filter((e) => !e.reason || !e.reason.trim());
  if (bad.length) {
    console.error(`基线条目缺 reason（${rule}）：${bad.length} 条。豁免必须写明理由。`);
    process.exit(2);
  }
  return entries;
}

export function isExempt(entries, file, match) {
  return entries.some((e) => e.file === file && (e.match === undefined || match.includes(e.match)));
}

/** 打印全部待办型豁免，供 --list-baseline 用。 */
export function listBaseline(rule) {
  const entries = loadBaseline(rule);
  const todos = entries.filter((e) => e.todo);
  console.log(`${rule}: 豁免 ${entries.length} 条，其中待办 ${todos.length} 条`);
  for (const e of entries) {
    console.log(`  ${e.todo ? "[待办]" : "[永久]"} ${e.file}${e.match ? `  «${e.match}»` : ""}`);
    console.log(`         ${e.reason}`);
  }
  return entries.length;
}

/** 本轮改动的文件（相对仓库根）。供增量式门禁用。 */
export function changedFiles() {
  // quotePath=false：否则中文路径会被转义成带引号的八进制串，下游的路径过滤全部失配
  const git = (args) => {
    try {
      return execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return null;
    }
  };
  // -z：路径按 NUL 分隔、不加引号，文件名含引号、反斜杠、制表符时也能原样取到
  const fields = (out) => (out ?? "").split("\0").filter(Boolean);
  // --relative：宿主根是仓库子目录时，只看该子目录内的改动，路径也相对宿主根
  // 纯重命名（内容一字未改，R100）不算改动：搬家不等于编辑，不该把被搬文件的存量问题算到本轮头上
  const names = (args) => {
    const t = fields(git(["diff", "--name-status", "-M", "-z", "--relative", ...args]));
    const out = [];
    for (let i = 0; i < t.length; ) {
      const status = t[i++];
      const paths = /^[RC]/.test(status) ? [t[i++], t[i++]] : [t[i++]];
      if (status !== "R100") out.push(paths[paths.length - 1]);
    }
    return out;
  };

  // 不在 git 仓库里就算不出本轮改动，不能当作「没有改动」
  if (git(["rev-parse", "--is-inside-work-tree"]) === null) {
    console.error(`无法确定本轮改动：宿主根 ${ROOT} 不在 git 仓库里。增量检查依赖 git；请在 git 仓库内运行，或用 COOKBOOK_HOST_ROOT 指向宿主仓库`);
    process.exit(2);
  }
  // 还没有任何提交的仓库只有暂存区与未跟踪文件可查
  const hasHead = git(["rev-parse", "--verify", "-q", "HEAD"]) !== null;
  let committed = [];
  if (hasHead) {
    // 比较基准解析不到时必须失败：把「算不出本轮改动」当成「没有改动」，已提交的违规会全部漏检
    const ref = CONFIG.gates.baseRef;
    const hint = "在 CI 里先取回完整历史与基准分支（如 actions/checkout 设 fetch-depth: 0），或在 cookbook.config.json 的 gates.baseRef 写本仓库实际的基准分支";
    if (git(["rev-parse", "--verify", "-q", `${ref}^{commit}`]) === null) {
      console.error(`无法确定本轮改动：比较基准 «${ref}» 解析不到。${hint}`);
      process.exit(2);
    }
    const base = git(["merge-base", ref, "HEAD"]);
    if (base === null) {
      console.error(`无法确定本轮改动：«${ref}» 与当前分支没有共同历史（常见于浅克隆）。${hint}`);
      process.exit(2);
    }
    committed = names([`${base.trim()}..HEAD`]);
  }
  const working = hasHead ? names(["HEAD"]) : [];
  const staged = names(["--cached"]);
  const untracked = fields(git(["ls-files", "-z", "--others", "--exclude-standard"]));
  return [...new Set([...committed, ...working, ...staged, ...untracked])];
}

/**
 * 把代码块（栅栏代码块）整段替换成同样行数的空行：代码块里的内容不算正文，行号保持不变。
 * 按 CommonMark 识别：开栅栏是三个或更多反引号或波浪线（可以缩进，如列表项里的代码块）；闭合栅栏须与开栅栏
 * 同字符、不短于开栅栏、且该行只有栅栏字符（允许行尾空白与 CRLF）；没有闭合的栅栏延续到文末。
 */
export function maskFences(text) {
  const lines = text.split("\n");
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (fence) {
      const close = l.match(/^[ \t]*(`+|~+)[ \t]*\r?$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      lines[i] = "";
      continue;
    }
    const open = l.match(/^[ \t]*(`{3,}|~{3,})/);
    if (open && !(open[1][0] === "`" && l.slice(l.indexOf(open[1]) + open[1].length).includes("`"))) {
      fence = open[1];
      lines[i] = "";
    }
  }
  return lines.join("\n");
}

/**
 * 取出 Markdown 正文里的相对链接：行内链接 [x](目标) 与引用式链接定义 [x]: 目标。
 * 代码块（``` 或 ~~~ 栅栏，可以缩进，如列表项里的代码块）与行内代码里的不算链接（它们不渲染成链接，多是示例写法）；
 * 尖括号包住的目标去掉尖括号；链接标题（"…"、'…'、(…)）去掉；
 * 百分号编码解码后再用。外部链接、页内锚点与空目标不返回。返回 { raw, path, line }，path 已去掉 #锚点。
 */
export function relativeLinks(text) {
  // 行内代码整段换成等长空白，位置与行号不变；行内代码不跨行（列表项、标题、表格行、段落都在行内结束），落单的反引号不与别行的反引号配对
  const masked = maskFences(text).replace(/(`+)[^`\n]+?\1/g, (m) => m.replace(/[^\n]/g, " "));
  const found = [
    ...[...masked.matchAll(/\]\(([^)]*)\)/g)].map((m) => ({ target: m[1], index: m.index })),
    ...[...masked.matchAll(/^\s*\[[^\]]+\]:\s*(.+)$/gm)].map((m) => ({ target: m[1], index: m.index })),
  ];
  const out = [];
  for (const { target, index } of found) {
    let t = target.trim();
    t = t.startsWith("<") ? t.slice(1, t.indexOf(">") === -1 ? undefined : t.indexOf(">")) : t.split(/\s+/)[0];
    if (!t || /^(https?:|mailto:|#)/.test(t)) continue;
    let path = t.split("#")[0];
    try { path = decodeURIComponent(path); } catch {}
    if (!path) continue;
    out.push({ raw: t, path, line: masked.slice(0, index).split("\n").length });
  }
  return out;
}

/** 统一输出。每条给文件、行号、违规内容、怎么修。 */
export function report(name, violations) {
  if (!violations.length) {
    console.log(`✓ ${name}`);
    return 0;
  }
  console.error(`✗ ${name}：${violations.length} 处`);
  for (const v of violations) {
    console.error(`  ${v.file}${v.line ? `:${v.line}` : ""}`);
    console.error(`     ${v.detail}`);
    console.error(`     → ${v.fix}`);
  }
  return 1;
}
