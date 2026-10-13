#!/usr/bin/env bash
# PostToolUse (Edit|Write): run the gates that own the edited file.
# Reads the hook payload (JSON) on stdin; agent-neutral apart from the payload shape.
# Which paths belong to which gate comes from gates.skillsDir and gates.decisionsDir in cookbook.config.json.
set -u

# 只用 bash 内建定位自身：PATH 里只有 node、git、bash 时也要能运行
case "${BASH_SOURCE[0]}" in */*) HERE="${BASH_SOURCE[0]%/*}" ;; *) HERE=. ;; esac
[[ "$HERE" == /* ]] || HERE="$PWD/$HERE"
GATES="$HERE/../gates"
cfg() { node "$HERE/lib/config.mjs" "$1" 2>/dev/null; }

f="$(node "$HERE/lib/io.mjs" file-path)"
[ -z "$f" ] && exit 0
# 只校验本 hook 用到的门禁配置；配置读不懂时把原因报出来，不静默跳过
cfg_err="$(node "$HERE/lib/config.mjs" check gates 2>&1)" || { printf '%s' "$cfg_err" | node "$HERE/lib/io.mjs" emit PostToolUse; exit 0; }

ROOT="$(cfg root)"
rel="${f#"$ROOT"/}"
# 被编辑文件取的是真实路径，配置里的目录也取真实路径再比对：目录经符号链接放在别处时才认得出
skills="$(node "$HERE/lib/config.mjs" gates.skillsDir real 2>/dev/null)"
decisions="$(node "$HERE/lib/config.mjs" gates.decisionsDir real 2>/dev/null)"

if [ -n "$skills" ] && [[ "$f" == "$skills"/* ]]; then
  gates=(verify-skill-host-paths verify-skill-frontmatter verify-skill-generic-layer)
  # 消息里按配置的写法显示路径：目录经符号链接放在仓外时，真实路径对用户没有意义
  rel="$(cfg gates.skillsDir)/${f#"$skills"/}"
elif [ -n "$decisions" ] && [[ "$f" == "$decisions"/* ]]; then
  gates=(verify-decision-format)
  rel="$(cfg gates.decisionsDir)/${f#"$decisions"/}"
else
  exit 0
fi

# 每道门禁各自运行：前一道失败不应让后一道的结果被跳过
failed=""
for g in "${gates[@]}"; do
  out="$(cd "$ROOT" && node "$GATES/$g.mjs" 2>&1)" || failed+="$(printf '%s\n' "$out" | node "$HERE/lib/io.mjs" tail 20)"$'\n'
done
[ -z "$failed" ] && exit 0

printf '%s' "门禁未通过（编辑 $rel 后）："$'\n'"$failed" | node "$HERE/lib/io.mjs" emit PostToolUse
exit 0
