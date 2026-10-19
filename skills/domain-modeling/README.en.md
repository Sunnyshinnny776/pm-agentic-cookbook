---
authority: zh
translation_of: README.md
source_version: a2384883490faad6f70b0ee1f640b7ce885f3241
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# domain-modeling — ToB Data Entities and Relationships

Turn vague business needs into a precise data model: entities, field specifications, ER relationships, calculation chains, and business rules.

The core complexity of ToB products lies in the data layer. An unclear model distorts the PRDs and prototypes generated afterward. This skill is stage one of the full workflow; `process/overview.md` requires completing it before writing a PRD.

## When to use

Use when discussing data modeling, database design, ER diagrams, business objects, entity relationships, field definitions, data flows, or business rule extraction—even for requests such as “Help me make sense of this business.”

## Deliverables

An entity inventory, field definition tables, Mermaid ER diagrams and relationship details, calculation flowcharts and trigger timing, business rules, and self-check conclusions. Validate Mermaid with `scripts/validate_mermaid.py`.

## Usage

- **Skill-enabled environments such as Claude Code**: install `dist/domain-modeling.skill`, or place the entire skill directory in the environment’s skill directory.
- **Any LLM**: paste `dist/domain-modeling-universal-prompt.md`, then provide the business requirements.

Modeling also validates candidate scope exits and shared dependencies, submitting necessary adjustments for user confirmation. Hand off criteria work after model and final scope confirmation. Shared entities follow business facts; a scope can reference multiple models/PRDs.

## Model Experience

| Item | Content |
| --- | --- |
| Always loaded | Frontmatter `name` + `description`, approximately 168 characters, present in every session’s context |
| On-demand loading | `SKILL.md` body, approximately 3.6k characters; loaded on explicit invocation or recognition of a modeling request |
| Secondary loading | `references/temporal-and-event-modeling.md` (approximately 2k characters), loaded **only when the model involves temporal facts, collection containers, or event delivery**; ordinary entity modeling does not load it |
| Context budget | Always loaded 10² / body 10³ / full content including secondary loading on the order of 10³ characters |

## Directory structure

```text
SKILL.md                              # Definition
references/temporal-and-event-modeling.md
references/universal-prompt-intro.md  # Universal prompt introduction
scripts/validate_mermaid.py           # Mermaid syntax validation
scripts/build.py                      # Rebuild dist/
dist/                                 # Universal prompt and .skill package
```

There is no `providers/` directory: the methodology is domain independent. To add domain-specific entity patterns or field semantics, create `references/providers/<domain>/` without changing `SKILL.md`.

## Change history

See [CHANGELOG.md](CHANGELOG.md).
