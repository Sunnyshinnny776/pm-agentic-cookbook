#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist"
UNIVERSAL_PROMPT = DIST_DIR / "spec-capture-universal-prompt.md"
SKILL_PACKAGE = DIST_DIR / "spec-capture.skill"

SECTION_ORDER = [
    ROOT / "references" / "universal-prompt-intro.md",
    ROOT / "references" / "capture-routine.md",
    ROOT / "references" / "routing-map.md",
]

IGNORE_PARTS = {
    ".git",
    "dist",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".DS_Store",
}


def clean_section(text: str) -> str:
    lines = text.strip().splitlines()
    if len(lines) > 1 and lines[1].startswith("> Supporting reference"):
        lines.pop(1)
        if len(lines) > 1 and not lines[1].strip():
            lines.pop(1)
    return "\n".join(lines).strip() + "\n"


LOCAL_LINK = re.compile(r"\[([^\]]+)\]\((?![a-zA-Z][a-zA-Z0-9+.-]*:|#)[^)]*\)")


def build_universal_prompt(output_path: Path = UNIVERSAL_PROMPT) -> Path:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    parts = []
    for section in SECTION_ORDER:
        parts.append(clean_section(section.read_text(encoding="utf-8")))
    prompt = "\n\n---\n\n".join(parts).rstrip() + "\n"
    # Relative file links do not resolve in a pasted prompt; keep the link text as a named reference.
    prompt = LOCAL_LINK.sub(r"「\1」", prompt)
    output_path.write_text(prompt, encoding="utf-8")
    return output_path


def should_package(path: Path) -> bool:
    # 按 skill 内的相对路径判断：skill 放在任何名为 dist 等的目录之下也照常打包
    parts = path.relative_to(ROOT).parts
    if any(part in IGNORE_PARTS for part in parts):
        return False
    # 领域 Provider 不随分发包：只留 providers/ 下说明接口的文件，各领域目录按需单独附带
    if parts[:2] == ("references", "providers") and len(parts) > 3:
        return False
    # 评测用例从源仓库运行，不随安装包下发：用例里的答案文件进了被试的 skill 目录，评测就失效了
    if parts[0] == "evals":
        return False
    return path.is_file()


def build_skill_package(output_path: Path = SKILL_PACKAGE) -> Path:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(ROOT.rglob("*")):
            if not should_package(path):
                continue
            archive.write(path, arcname=path.relative_to(ROOT))
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Build generated artifacts for the spec-capture skill.")
    parser.add_argument("--skip-package", action="store_true", help="Build the universal prompt only.")
    args = parser.parse_args()

    prompt_path = build_universal_prompt()
    print(f"Built universal prompt: {prompt_path}")

    if not args.skip_package:
        package_path = build_skill_package()
        print(f"Built skill package: {package_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
