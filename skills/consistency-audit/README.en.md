---
authority: zh
translation_of: README.md
source_version: 23840280bf06bfa89fbab1f617493084cbe940fe
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# consistency-audit — Consistency Audit

> **This skill answers only whether two objects agree.** Assessing the quality of a single requirements document or finding defects in code itself is outside its scope. Its output is evidence for the user’s decision; it does not certify consistency or a pass.

## What it solves

Rules live in documents and execute in code. A number appears in both a model and a diagram. Permission points are registered in a catalog and mirrored in code. **Reviewing either object alone cannot reveal disagreement between them.**

The hardest discrepancies to find are “partially satisfied”: a rule holds on the commonly tested path but fails on another path capable of changing the same state. Such defects survive both testing and document review.

## Method

1. **Break down assertions**: turn the Oracle into checkable items with one assertion each.
2. **Find the full implementation surface**: for code, list every entry point that can change the state; for documents, locate every occurrence of the same name or number; for catalogs and mirrors, compute set differences with scripts.
3. **Judge each item**: satisfied / partially satisfied / contradicted / missing / stronger than specified / indeterminate. A “missing” verdict requires a search record.
4. **Check the reverse direction**: separately list implementation behavior absent from the Oracle.
5. **Collect evidence**: use executable probes, mutations, or scripts for high-consequence items; restore all temporary changes before finishing.

## Place in the workflow

- Use for batches containing two or more kinds of reviewed object: rules and code, requirements and models, diagrams and models, catalogs and code mirrors, or test specifications and rules.
- Use this skill for an independent audit of a code implementation batch, rather than a requirements quality framework.
- The dispatcher supplies the Oracle and comparison objects. The auditor writes only the report; the dispatcher manages older reports.

## Acceptance criteria integration

Compare named criteria with PRDs, coverage manifests, and tests, including source versions and coverage gaps. Unconfirmed or obsolete rows are not active Oracles.

Delivery checks may compare scope/criteria with implementation, evidence, and the register. Keep its four factual results separate from the six consistency verdicts. Verify user acceptance decisions read-only without granting approval.

## Model Experience

| Item | Content |
| --- | --- |
| **Always loaded** | `name` + `description`, approximately **232 characters** |
| **On-demand loading** | `SKILL.md` body, approximately **3.4k characters**; loaded on explicit invocation or recognition of consistency audit, reconciliation, rule compliance checks, or independent code-batch audit |
| **Secondary loading** | Three references, approximately **4.9k characters** total, read by step:<br>· `verdicts.md` (1.9k) when judging items<br>· `evidence-methods.md` (1.3k) when finding implementation locations and choosing evidence methods<br>· `report-format.md` (1.6k): section 1 at audit start, section 2 when writing the report |
| **Domain Provider** | `references/providers/<domain>/`, with no domain Provider included. Its `README.md` describes what an appendix supplies and is not loaded during execution |
| **Context budget** | Always loaded 10² / body 10³ / all references on the order of 10³ characters; full loading approximately 8.3k |

## Usage

- **Claude Code / Codex**: put this directory in the project-level or user-level skill directory. Invoke “consistency audit” explicitly or let the description trigger it.
- **Any LLM**: paste `dist/consistency-audit-universal-prompt.md`, then supply the Oracle and comparison objects.

## Directory structure

```text
consistency-audit/
  SKILL.md
  README.md
  CHANGELOG.md
  references/
    verdicts.md             # Six verdicts, two directions, severity
    evidence-methods.md     # Evidence methods, search records, restoration, evidence levels
    report-format.md        # Three audit actions and report structure
    universal-prompt-intro.md
    providers/README.md     # Domain Provider interface (placeholder)
  evals/
    trigger-evals.json
    cases/cross-object-drift/
  scripts/build.py
  dist/
```

## Change history

See [CHANGELOG.md](CHANGELOG.md).
