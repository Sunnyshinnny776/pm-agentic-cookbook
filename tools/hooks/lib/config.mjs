#!/usr/bin/env node
// 给 hook 脚本读宿主配置用：与门禁共用同一份 loadConfig，避免两处各算一套缺省值。
// 用法：node config.mjs <键> [real]，键为 check [gates]、root、gates.<字段> 或 hooks.<字段>；数组每项一行输出，未设置时输出为空。
// 加 real 时路径值输出为绝对真实路径（路径不存在时原样拼出绝对路径），供 hook 与真实路径比对。
// 配置有误时向 stderr 输出原因并以退出码 2 结束。
import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, CONFIG } from "../../gates/lib/verify-common.mjs";

// hooks 字段取不到值时的原因：推导缺省值时记下的具体原因，否则是 cookbook 在宿主仓库之外
const why = (field) => CONFIG.hookErrors?.[field] ?? `cookbook 位于宿主仓库之外，推导不出 hooks.${field} 的缺省值；请显式声明 hooks.${field}`;

const key = process.argv[2] ?? "";
if (key === "check") {
  // 导入时已校验配置。「check gates」到此为止；「check」再确认 hooks 各字段都取得到值（缺省值依赖 cookbook 位置，可能推导不出）
  if (process.argv[3] !== "gates") for (const [field, value] of Object.entries(CONFIG.hooks))
    if (value === null) {
      console.error(`cookbook.config.json 配置错误：${why(field)}`);
      process.exit(2);
    }
} else if (key === "root") {
  console.log(ROOT);
} else {
  const [section, field] = key.split(".");
  const value = CONFIG[section]?.[field];
  if (value === null && section === "hooks") {
    console.error(`cookbook.config.json 配置错误：${why(field)}`);
    process.exit(2);
  }
  const out = (x) => {
    if (process.argv[3] !== "real") return x;
    const abs = resolve(ROOT, x);
    return existsSync(abs) ? realpathSync(abs) : abs;
  };
  if (Array.isArray(value)) value.forEach((x) => console.log(out(x)));
  else if (value !== null && value !== undefined) console.log(out(value));
}
