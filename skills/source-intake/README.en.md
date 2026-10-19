---
authority: zh
translation_of: README.md
source_version: bb2a255da35bdffb4cfb6c242a3bda09c91abb41
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# source-intake — Source Material Intake

> **This skill does not treat interview outputs as authoritative requirements.** Its completeness matrix distinguishes “user confirmed / executor inferred / still blank.” AI cannot observe work, rotate through roles, or enter the workplace, so interviews produce **requirement drafts awaiting confirmation**. A person decides whether intake passes; the executor may not declare it.

**Stage zero** of the workflow: before modeling, writing requirements, or building prototypes, establish what material exists. Use that to determine the basis for later stages, which conclusions can be cited directly, and which need human confirmation first.

## What it solves

Every later stage assumes a sufficiently good Oracle exists: requirements generation needs a basis, audits need a comparison baseline, and tests need an oracle. **That assumption never raises an error on its own**. Missing material still leads to apparently complete documents, but those documents have no criteria behind them.

This skill makes the assumption an explicit check and provides fallback paths for insufficient material and iteration on existing systems.

## Core rule

**An Oracle must exist, and it must be a file.** Only its source varies: supplied documents, an interview-based confirmation document, or a baseline reverse engineered from a running system. Do not take on a project without an Oracle.

Verbal agreement cannot be diffed, cited by line, or checked in the next session. All three downstream activities depend on being able to point to a line.

## Four questions and four tiers

**Four intake questions**: readability → authority → **completeness (breadth × depth)** → consistency. Reach a conclusion on all four before assigning a tier.

Completeness has two dimensions: **breadth** covers which modules are described; **depth** covers how far each module is specified—business processes, business rules, fields and values, exceptions and boundaries. Depth is the common source of trouble: differing expectations about depth drive scope creep.

**Four tiers**: T0 conversational (no documents), T1 lightweight (fragmentary material), T2 complete (systematic documents), T3 existing-system iteration (running implementation). The tier determines the Oracle’s source; it does not remove later stages. Every tier follows data modeling → requirements → audit.

## Deliverables

Source Material Intake Report; Source Material Index (the sole entry point for consulting material in all later stages); Requirements Confirmation (T0/T1); Current-State Baseline (T3).

Stage zero maps original requirements to candidate scopes and intersecting dependencies for preliminary confirmation, then modeling validates them before final scope confirmation prior to criteria generation. Scopes may span modules and reference multiple models/PRDs; modules only index them, and file counts do not determine ownership.

## Model Experience

| Item | Content |
| --- | --- |
| **Always loaded** | `name` + `description`, **192 characters**. A common catalog description limit is 500, leaving ample margin |
| **On-demand loading** | `SKILL.md` body, approximately **6.3k characters**, loaded on explicit invocation or requests to start a project, assess material sufficiency, investigate requirements, or take over an existing system |
| **Secondary loading** | Four references, approximately **13.2k characters** total, **read by stage rather than together**:<br>· `intake-checklist.md` (3.4k) for the four questions<br>· `tier-decision.md` (3.2k) for tier and change granularity<br>· `interview-guide.md` (5.5k, the largest) when interviews are needed<br>· `credibility-levels.md` (1.1k) when labeling conclusions |
| **Domain Provider** | `references/providers/<domain>/`, with no domain Provider included. Its `README.md` describes what a domain appendix supplies; **it is for people adding domains and is not loaded at runtime**. Add a domain directory without changing the files above |
| **Context budget** | Always loaded 10² / body 10³ / one stage including one reference 10³ / all references approximately 13.2k characters |

A common T2 path loads the body plus two intake/scope references (approximately 12.9k), excluding the interview guide. When interviewing, the body plus interview guide is approximately 11.8k. Business inputs and templates are additional; character counts are not token counts.

## Capability boundaries

- **Enforceable: behavior constraints and interview methods.** Do not self-certify intake, label inferences as user confirmation, or transfer impossible tasks to the user. Expose assumptions, work backward from motivations, avoid predictive questions, and scale interviews to change granularity.
- **Not guaranteed: discovery of deep requirements.** Interviews may miss structures stakeholders do not volunteer: multilevel authorization chains, parent-child period structures, or control frameworks between organizational levels. **Do not expect spoken requirements to become a directly citable deep business model**. Interviews yield drafts; people must probe and confirm deeper structures.

## Directory structure

```text
SKILL.md                          # Definition
references/intake-checklist.md    # Four-question intake checklist
references/tier-decision.md       # Decision tree, tier comparison, two scope-convergence models
references/interview-guide.md     # Structured interviews (T0/T1)
references/credibility-levels.md  # Four credibility levels
references/providers/README.md    # Domain specialization: what an appendix supplies
templates/                        # Four output templates, distributed with the skill
dist/                             # Universal prompt and package
scripts/build.py                  # Rebuild dist
```

## Methodological basis

《决胜B端》: the three-layer business research framework (strategic → tactical → operational) and five-part research method. 《决胜体验设计》: user research methods and techniques in chapter 3; scenario identification and journey analysis in chapter 4. See “Sources and acknowledgments” in the cookbook README for attribution.

## Change history

See [CHANGELOG.md](CHANGELOG.md).
