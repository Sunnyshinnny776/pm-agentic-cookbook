#!/usr/bin/env python3
"""Write dist/ for the acceptance-criteria skill.

dist/acceptance-criteria-universal-prompt.md  the skill as one prompt for any LLM
dist/acceptance-criteria.skill                a zip of the skill directory for agents that load skills
"""
from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

NAME = "acceptance-criteria"
SKILL_DIR = Path(__file__).resolve().parent.parent
DIST = SKILL_DIR / "dist"

# Prompt sections, in reading order.
PROMPT_SOURCES = (
    "SKILL.md",
    "templates/acceptance-criteria.md",
)

# Links that point inside the skill, rewritten for a standalone prompt.
REWRITES = (
    ("[验收标准模板](templates/acceptance-criteria.md)", "下文内嵌的验收标准模板"),
)

# Directory names never shipped in the package.
NOT_SHIPPED = {".git", "dist", "__pycache__", ".pytest_cache", ".mypy_cache", ".DS_Store"}
# Fixed member timestamps keep rebuilt packages byte-stable.
STAMP = (1980, 1, 1, 0, 0, 0)


def section(rel: str) -> str:
    source = SKILL_DIR / rel
    raw = source.read_text(encoding="utf-8")
    if source.suffix != ".md":
        # Non-Markdown files go in verbatim, fenced and labelled with their skill path.
        return f"## {rel}\n\n```{source.suffix[1:]}\n{raw.strip()}\n```\n"
    if raw.startswith("---\n"):
        raw = raw.split("\n---\n", 1)[1]
    rows = raw.strip().split("\n")
    # A "> Supporting reference" note under the title only makes sense inside the skill directory.
    if rows[1:2] and rows[1].startswith("> Supporting reference"):
        del rows[1]
        if rows[1:2] and not rows[1].strip():
            del rows[1]
    return "\n".join(rows).strip() + "\n"


def universal_prompt() -> str:
    text = "\n\n---\n\n".join(section(rel) for rel in PROMPT_SOURCES).rstrip() + "\n"
    for old, new in REWRITES:
        text = text.replace(old, new)
    return text


def shipped(rel: Path) -> bool:
    top = rel.parts
    if NOT_SHIPPED.intersection(top) or top[0] == "evals":
        return False  # evaluation cases run from the source tree; their answers must not reach the agent under test
    # Only the interface notes under providers/ ship; each domain directory is supplied separately.
    return not (top[:2] == ("references", "providers") and len(top) > 3)


def write_package(target: Path) -> None:
    files = [p for p in sorted(SKILL_DIR.rglob("*")) if p.is_file() and shipped(p.relative_to(SKILL_DIR))]
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            member = zipfile.ZipInfo(path.relative_to(SKILL_DIR).as_posix(), STAMP)
            member.compress_type = zipfile.ZIP_DEFLATED
            member.external_attr = (0o100000 | (path.stat().st_mode & 0o777)) << 16
            archive.writestr(member, path.read_bytes())


def main() -> int:
    cli = argparse.ArgumentParser(description=f"Write dist/ for the {NAME} skill.")
    cli.add_argument("--skip-package", action="store_true", help="write the universal prompt only")
    options = cli.parse_args()
    DIST.mkdir(exist_ok=True)
    prompt = DIST / f"{NAME}-universal-prompt.md"
    prompt.write_text(universal_prompt(), encoding="utf-8")
    print(f"universal prompt: {prompt}")
    if not options.skip_package:
        package = DIST / f"{NAME}.skill"
        write_package(package)
        print(f"skill package: {package}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
