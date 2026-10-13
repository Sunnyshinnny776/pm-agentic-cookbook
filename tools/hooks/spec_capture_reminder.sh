#!/usr/bin/env bash
# Stop: remind (never run) spec-capture when there are uncommitted changes under hooks.captureWatchPaths.
set -u

# 只用 bash 内建定位自身：PATH 里只有 node、git、bash 时也要能运行
case "${BASH_SOURCE[0]}" in */*) HERE="${BASH_SOURCE[0]%/*}" ;; *) HERE=. ;; esac
[[ "$HERE" == /* ]] || HERE="$PWD/$HERE"
cfg() { node "$HERE/lib/config.mjs" "$1" 2>/dev/null; }
# 配置读不懂时把原因报出来，不静默跳过
cfg_err="$(node "$HERE/lib/config.mjs" check 2>&1)" || { printf '%s' "$cfg_err" | node "$HERE/lib/io.mjs" emit; exit 0; }
ROOT="$(cfg root)"
[ -n "$ROOT" ] || ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# 宿主不在 git 仓库里时无从判断未提交改动：报出来，不静默不做事
git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1 || { printf '%s' "宿主 $ROOT 不在 git 仓库里，spec_capture_reminder 无法判断未提交改动，未执行" | node "$HERE/lib/io.mjs" emit; exit 0; }

paths=()
while IFS= read -r p; do [ -n "$p" ] && paths+=("$p"); done < <(cfg hooks.captureWatchPaths)
[ "${#paths[@]}" -eq 0 ] && exit 0

changed="$(git -C "$ROOT" status --porcelain -- "${paths[@]}" 2>/dev/null)"
[ -z "$changed" ] && exit 0

n="$(printf "%s\n" "$changed" | node "$HERE/lib/io.mjs" count)"
printf '检测到 %s 处 spec 或代码改动。阶段收尾时可考虑调用 spec-capture skill 提炼可复用规则（仅提醒，不自动执行）。' "$n" | node "$HERE/lib/io.mjs" emit
