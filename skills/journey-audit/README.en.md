---
authority: zh
translation_of: README.md
source_version: f54173932e4585cfa03e09e61a0003bbba984483
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# journey-audit — End-to-End Journey Audit

Use confirmed acceptance criteria, PRD refinements and supplied specs as the oracle to audit a **running prototype** in two stages: Stage A produces a manual E2E coverage checklist; Stage B verifies recorder-generated semantic snapshots dimension by dimension.

It covers the gap left by tests: unit and component tests establish that rule functions are correct; a walkthrough establishes that **the flow is reachable in practice** and that pages use consistent semantics.

## Two stages

- **Stage A (before manual testing)**: subtract areas already covered by test-authoring unit tests and purely visual blind spots from the applicable scope of confirmed acceptance criteria and PRD/spec refinements. Produce a coverage checklist ordered by business criticality for a person to follow.
- **Stage B (after manual testing)**: read `journey_steps.json` and the replayable script. Check flow reachability, state machine consistency, role × node permission boundaries, cross-page data consistency, and other D01–D15 dimensions; compare coverage against Stage A.

The report includes P0–P3 severity and decision columns, and **explicitly lists blind spots requiring human visual review and uncovered areas**. Finding no anomaly does not establish the absence of defects.

## Executor isolation

First apply Allow / Ask / Deny to the required result. Stage A creates coverage without automatically starting Stage B. Author isolation applies only after the Stage B or walkthrough task is established: authors may not audit their own artifacts; dispatch an independent executor under `process/agent-execution-protocol.md`. This behavior does not enforce host permissions.

## Acceptance criteria integration

Stage A journeys name acceptance criteria and distinguish planned, excluded, and uncovered criteria. Missing executable refinements pause the affected planning while retaining the criteria. Stage B checks actual coverage against that mapping, retains judgments directly supported by criteria and snapshots, and records upstream refinement gaps separately. Source conflicts go to the user for a decision; the audit remains report-only and does not modify upstream rules.

Hand off final scope, criterion/implementation versions, actual paths, step locations, and uncovered/visual boundaries for the workflow author to maintain the register. Component evidence does not automatically prove integration exits. Auditors do not grant user acceptance.

## Model Experience

| Item | Content |
| --- | --- |
| Always loaded | `name` + `description`, 149 characters |
| On-demand loading | `SKILL.md` body, approximately 7.5k characters; loading it does not itself authorize execution |
| Secondary loading | Load by stage and purpose, **never all at once**: Stage A uses `coverage-manifest.md` (2.6k) and `coverage-boundary.md` (2.3k); Stage B uses `audit-dimensions.md` (5.1k); capture rules use `capture-format.md`; dist builds use `universal-prompt-intro.md` (2.0k) |
| Domain Provider | `oracle-map.md`, `capture-anchors.md`, and `baseline.md` under `references/providers/<domain>/`; **load only the Provider for the audited module’s domain** |
| Context budget | Body 7.5k / generic references 14.7k characters (including the prompt introduction; domain Providers are counted separately); load only the branches needed for execution |

## Directory structure

```text
SKILL.md
references/audit-dimensions.md        # D01–D15, domain independent
references/coverage-manifest.md       # Coverage manifest contract
references/coverage-boundary.md       # Semantic checks vs. human visual review
references/capture-format.md          # Snapshot format and anchor rules
references/providers/<domain>/        # oracle-map + capture-anchors + baseline (domain instances, excluded from distribution)
templates/tob_test_report.md          # Stage B audit report template
dist/                                 # Universal prompt and .skill package, domain-independent content only
scripts/build.py
```

## Change history

See [CHANGELOG.md](CHANGELOG.md).
