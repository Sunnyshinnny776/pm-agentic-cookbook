#!/usr/bin/env python3
# Derived from pmYangKun/check-prd-skill; modified by PM Agentic Cookbook contributors. SPDX-License-Identifier: Apache-2.0. See LICENSE and NOTICE.
from __future__ import annotations

import argparse
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist"
UNIVERSAL_PROMPT = DIST_DIR / "check-prd-universal-prompt.md"
SKILL_PACKAGE = DIST_DIR / "check-prd.skill"

SECTION_ORDER = [
    ROOT / "references" / "universal-prompt-intro.md",
    ROOT / "references" / "audit-lifecycle.md",
    ROOT / "references" / "dimensions" / "check-prd-01-business.md",
    ROOT / "references" / "dimensions" / "check-prd-02-product-type.md",
    ROOT / "references" / "dimensions" / "check-prd-03-positioning.md",
    ROOT / "references" / "dimensions" / "check-prd-04-scenario.md",
    ROOT / "references" / "dimensions" / "check-prd-05-structure.md",
    ROOT / "references" / "dimensions" / "check-prd-06-architecture.md",
    ROOT / "references" / "dimensions" / "check-prd-07-data.md",
    ROOT / "references" / "dimensions" / "check-prd-08-process.md",
    ROOT / "references" / "dimensions" / "check-prd-09-ux.md",
    ROOT / "references" / "dimensions" / "check-prd-10-commercial.md",
    ROOT / "references" / "dimensions" / "check-prd-11-mvp.md",
    ROOT / "references" / "dimensions" / "check-prd-12-exception.md",
    ROOT / "references" / "dimensions" / "check-prd-13-ai.md",
    ROOT / "references" / "dimensions" / "check-prd-14-operations.md",
    ROOT / "references" / "appendices" / "check-prd-appendix-veto.md",
    ROOT / "references" / "appendices" / "check-prd-appendix-guide.md",
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


def build_universal_prompt(output_path: Path = UNIVERSAL_PROMPT) -> Path:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    parts = []
    for section in SECTION_ORDER:
        text = clean_section(section.read_text(encoding="utf-8"))
        # The lifecycle reference is embedded in this standalone prompt.
        text = text.replace("](../audit-lifecycle.md)", "](#审计动作与报告元信息)")
        parts.append(text)
    parts.append("# License and upstream notices\n\n" + "\n\n".join((ROOT / name).read_text(encoding="utf-8").strip() for name in ("NOTICE", "LICENSE")))
    output_path.write_text("\n\n---\n\n".join(parts).rstrip() + "\n", encoding="utf-8")
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
    parser = argparse.ArgumentParser(description="Build generated artifacts for the check-prd skill.")
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
