---
authority: zh
translation_of: README.md
source_version: a6786d641df471aa1928eb582cc34c63b3f8e162
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# table-template-designer — Complex Enterprise Table Templates

Give data-intensive ToB tables a specification to follow: 30+ columns, grouped headers, frozen columns, cascading selection, and conditional read-only behavior otherwise require repeated trial and error.

## When to use

When designing table templates, report UIs, data entry tables, or submission forms—including requests such as “Help me design a table” or “Give me a report layout.”

## Coverage

Title row rules and naming formats, three to four levels of grouped headers, frozen columns, consistent row heights, cascading and in-cell dropdowns, conditional read-only behavior, and validation feedback.

## Code defect self-review

After writing code and before delivery, this skill requires a defect review covering logic, data integrity, security basics, performance, and test effectiveness. Fix findings and briefly tell the user; do not create a report.

| Environment | Review capability |
| --- | --- |
| Claude Code | Built-in `/code-review` |
| Codex | Built-in `/review` |
| Other environments | Follow `references/code-self-review.md` item by item |

## Usage

- **Skill-enabled environments such as Claude Code**: install `dist/table-template-designer.skill`, or place the entire skill directory in the environment’s skill directory.
- **Any LLM**: paste `dist/table-template-designer-universal-prompt.md`, then provide the table structure.

## Model Experience

| Item | Content |
| --- | --- |
| Always loaded | `name` + `description`, approximately 160 characters |
| On-demand loading | `SKILL.md` body, approximately 3.8k characters, including all visual and interaction rules |
| Secondary loading | Both files are **code templates**, read only when implementing the control: `references/dropdown_cell.md` (2.1k, in-cell dropdown) and `references/cascading_dropdown.md` (2.5k, cascading selection). Do not load them for design-only work |
| Context budget | Always loaded 10² / body 10³ / full content on the order of 10³ characters |

## Directory structure

```text
SKILL.md
references/dropdown_cell.md
references/cascading_dropdown.md
references/code-self-review.md
references/universal-prompt-intro.md  # Universal prompt introduction
evals/
scripts/build.py                      # Rebuild dist/
dist/                                 # Universal prompt and .skill package
```

There is no `providers/` directory: table rules are domain independent, and body examples use generic reporting scenarios.

## Change history

See [CHANGELOG.md](CHANGELOG.md).
