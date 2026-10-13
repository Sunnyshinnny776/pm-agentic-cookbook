#!/usr/bin/env bash
# Stop: end-of-turn checks, reported as one systemMessage. Never blocks.
#  1. doc-sync, when the worktree has uncommitted changes under hooks.docSyncWatchPaths.
#  2. code self-review reminder, once per distinct set of uncommitted changes under hooks.codeReviewWatchPaths.
# Paths and the doc-sync command come from the host's cookbook.config.json.
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
git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1 || { printf '%s' "宿主 $ROOT 不在 git 仓库里，stop_checks 无法判断未提交改动，未执行" | node "$HERE/lib/io.mjs" emit; exit 0; }
cd "$ROOT" || exit 0
msgs=()

docs_paths=()
while IFS= read -r p; do [ -n "$p" ] && docs_paths+=("$p"); done < <(cfg hooks.docSyncWatchPaths)
if [ "${#docs_paths[@]}" -gt 0 ] && [ -n "$(git status --porcelain -- "${docs_paths[@]}" 2>/dev/null)" ]; then
  cmd="$(cfg hooks.docSyncCommand)"
  out="$(bash -c "$cmd" 2>&1)"
  if [ $? -ne 0 ]; then
    msgs+=("$cmd 未通过："$'\n'"$(printf '%s\n' "$out" | node "$HERE/lib/io.mjs" tail 20)")
  fi
fi

code_paths=()
while IFS= read -r p; do [ -n "$p" ] && code_paths+=("$p"); done < <(cfg hooks.codeReviewWatchPaths)
if [ "${#code_paths[@]}" -gt 0 ] && [ -n "$(git status --porcelain -- "${code_paths[@]}" 2>/dev/null)" ]; then
  state="$(git rev-parse --absolute-git-dir)/hook-state/code-review-reminded"
  # 签名覆盖已跟踪文件的 diff 与未跟踪文件的内容：新建的文件再被修改时也要再提醒
  sig="$( { git diff HEAD -- "${code_paths[@]}"; git ls-files -z --others --exclude-standard -- "${code_paths[@]}" | node "$HERE/lib/io.mjs" cat-files; } 2>/dev/null | node "$HERE/lib/io.mjs" hash)"
  if printf '%s' "$sig" | node "$HERE/lib/io.mjs" remind-once "$state"; then
    msgs+=("${code_paths[*]} 有未提交改动：完成前先做代码缺陷审查；优先调用宿主原生审查能力，没有则逐项核对输入与边界、权限、错误处理、引用及跨文件同步，并运行相关验证。发现即修，向用户简述结果与未覆盖边界。同一组改动只提醒这一次。")
  fi
fi

[ "${#msgs[@]}" -eq 0 ] && exit 0
joined="$(printf '%s\n\n' "${msgs[@]}")"
printf '%s' "$joined" | node "$HERE/lib/io.mjs" emit
exit 0
