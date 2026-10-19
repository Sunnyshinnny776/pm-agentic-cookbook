---
authority: zh
translation_of: README.md
source_version: 101e46884fdeec583034311908d23001f6b9bd63
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# spec-capture — Capture Reusable Rules at Stage Completion

Triggered by a user signal at the end of a stage, this skill reviews its outputs and extracts **reusable, settled** rules into the smallest owning spec or the corresponding skill.

It prevents repeatedly relearning the same lesson: a conclusion from rework must be recorded so the next page does not repeat the mistake.

## When to use

When the user requests “capture rules,” “extract rules,” “spec capture,” or “capture this stage’s rules.” **The AI does not initiate it independently**; the user decides what to capture and whether it holds.

## Deliverables

For each rule: the rule statement, the smallest owning spec, its insertion location, and the rework or ruling it comes from. If there is nothing to capture, say so without inventing items.

## Model Experience

| Item | Content |
| --- | --- |
| Always loaded | `name` + `description`, approximately 180 characters |
| On-demand loading | `SKILL.md` body, approximately 2.1k characters |
| Secondary loading | Read `references/capture-routine.md` (1.9k, eight steps) when capturing rules; `references/routing-map.md` (1.8k, ownership routing) when choosing the owning spec; `universal-prompt-intro.md` (0.6k) is for dist builds only |
| Context budget | Always loaded 10² / body 10³ / full content on the order of 10³ characters |

## Directory structure

```text
SKILL.md
references/capture-routine.md
references/routing-map.md
dist/
scripts/build.py
```

There is no `providers/` directory: the capture method is domain independent. Spec paths in the routing map belong to host project configuration and are supplied on invocation.

## Change history

See [CHANGELOG.md](CHANGELOG.md).
