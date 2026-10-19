---
authority: zh
translation_of: README.md
source_version: c139ef02a433e9eadffc537cc6543dcecbf29335
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# ui-generator — High-Fidelity Interactive Prototypes from a PRD

Turn an audited PRD into a clickable frontend prototype with working flows (React + TypeScript + Tailwind), supporting T-shaped layouts, role isolation, and enterprise visual design.

## When to use

When asked to generate a prototype, build pages, make a Demo, create a high-fidelity interface, or write frontend UI—including “Turn this PRD into something I can look at.”

## Implementation constraints

- Reuse the host project’s shared components and global metadata; do not create page-local substitutes.
- Access data through the module’s service layer; pages do not access storage directly.
- Follow host specs for monetary values, states, and feedback copy. The caller names the specs to load in the request.
- When the host has no UI/UX rules, tell the user and generate with the skill's bundled default UI/UX rules, stating this in the delivery notes; if the user points to their own rules, use those instead.

Use `table-template-designer` alongside this skill for complex tables.

## Code defect self-review

After writing code and before delivery, this skill requires a defect review covering logic, data integrity, security basics, performance, and test effectiveness. Fix findings and briefly tell the user; do not create a report.

| Environment | Review capability |
| --- | --- |
| Claude Code | Built-in `/code-review` |
| Codex | Built-in `/review` |
| Other environments | Follow `references/code-self-review.md` item by item |

## Usage

- **Skill-enabled environments such as Claude Code**: install `dist/ui-generator.skill`, or place the entire skill directory in the environment’s skill directory.
- **Any LLM**: paste `dist/ui-generator-universal-prompt.md`, then provide the PRD and the project’s UI/UX rules; without project rules, the default rules bundled in the universal prompt apply.

## Model Experience

| Item | Content |
| --- | --- |
| Always loaded | `name` + `description`, approximately 190 characters |
| On-demand loading | `SKILL.md` body, approximately 3k characters |
| Secondary loading | Read `templates/tob_design_tokens.css` (design tokens) when implementing styles; `references/default-uiux-rules.md` (default UI/UX rules) only when the host has no UI/UX rules; `references/code-self-review.md` before delivery. The remaining secondary material is **host project specs and PRDs**, with paths explicitly supplied by the Consumer. This is its key difference from other skills: most variable material lives on the host side |
| Context budget | Always loaded 10² / body on the order of 10³ characters; when the host has no UI/UX rules, the default rules add a secondary load of about 10⁴ characters; the remaining cost comes mainly from the supplied PRD and specs |

## Directory structure

```text
SKILL.md
references/code-self-review.md        # Code defect self-review checklist
references/default-uiux-rules.md      # Default UI/UX rules (used when the host has none)
references/universal-prompt-intro.md  # Universal prompt introduction
templates/tob_design_tokens.css       # Design tokens
scripts/scaffold_app.py               # Scaffold generator
scripts/build.py                      # Rebuild dist/
dist/                                 # Universal prompt and .skill package
```

## Change history

See [CHANGELOG.md](CHANGELOG.md).
