# Agent Guide

Use this guide when applying the cookbook in a host project. To contribute to the cookbook itself, read its AGENTS.md. Reply to the user in their language.

## Choose a skill

Inspect the skills actually present in this checkout before promising a capability. Read the selected skill's SKILL.md and required references. If a requested skill is absent, report its absence; do not invent its checks or install an unapproved substitute.

| User intent | Skill | Stage |
| --- | --- | --- |
| Establish whether source material can support design; conduct an intake interview | `source-intake` | Source Intake |
| Define business objects, relationships, fields, time semantics and calculation chains | `domain-modeling` | Domain Model |
| Define confirmed acceptance criteria and reconcile delivered evidence against them | `acceptance-criteria` | After modeling; Requirements Acceptance |
| Draft a PRD from confirmed models, scope and criteria | `create-prd` | PRD Draft |
| Review the quality and completeness of a requirements document | `check-prd` | PRD Audit |
| Produce an interactive prototype from a PRD | `ui-generator` | UI Prototype |
| Design complex input tables, nested headers or cascading selectors | `table-template-designer` | UI Prototype |
| Derive executable unit, integration and component tests from a PRD | `test-authoring` | Test |
| Plan manual journey coverage or audit recorded runtime journeys | `journey-audit` | Test; Journey Verification |
| Compare rules, models, specifications or implementation paths for consistency | `consistency-audit` | Across stages |
| Capture confirmed reusable rules in the smallest owning spec | `spec-capture` | After confirmed phase work |

Choose by the object and question. A document-quality review and a comparison between multiple artifact types answer different questions. Use the skill's own contract to determine depth and inputs.

## Follow the workflow

Source Intake → Domain Model → Acceptance Criteria → PRD Draft → PRD Audit → UI Prototype → Test → Requirements Acceptance & Final Verification.

- Establish authoritative source material before deriving business facts. Obtain user confirmation at phase boundaries.
- Preserve the model-before-PRD order. When a later stage exposes an upstream gap, pause affected work and return to the owning artifact.
- Keep confirmed acceptance criteria separate from evidence checks and the user's acceptance decision.
- Do not rewrite source material, fabricate business facts or silently narrow scope to match the implementation.
- Read the `停机条件` (stop conditions) section in the selected skill's `SKILL.md`. Report missing required inputs and source conflicts before dependent work.

Read [the process overview](process/overview.md) and [the executor protocol](process/agent-execution-protocol.md) for detailed stage and audit responsibilities.

## Resolve domains explicitly

For PRD skills with domain Providers, use a domain only when the caller explicitly says which domain to apply. A business topic in a document is not a domain parameter.

If no domain was specified, ask when domain-specific checks are needed, or follow the generic contract and state that no domain supplement was loaded. Record what was actually loaded. Do not infer a Provider from document vocabulary. When a named Provider is unavailable, follow the selected skill's missing-input contract and report the limitation.

## Ask before installing or writing

Obtain permission before creating host files, copying skills, changing configuration or enabling hooks. Read-only use of an available skill does not require silently installing it.

| Host | User-approved destination |
| --- | --- |
| Claude Code | `.claude/skills/<skill>/` inside the user's project |
| Codex and hosts following the shared agent-directory convention | `.agents/skills/<skill>/` inside the user's project |
| Other hosts | Read the selected `skills/<skill>/dist/<skill>-universal-prompt.md` as instructions |

Use the selected skill's documented installation method. Preserve its required references, templates and scripts. Keep evaluation answers out of execution contexts. Add a domain Provider separately only when it is available, appropriate and explicitly selected.

## Host configuration

Read the host's cookbook.config.json before resolving host paths. Ask for required values that the user has not supplied. Do not guess paths from nearby files or create configuration without permission. Resolve only fields needed by the selected operation.

The following is an illustrative shape. Replace its values with user-confirmed directories before use:

```json
{
  "host": {
    "moduleDocs": "modules/<module>",
    "testsDir": "tests",
    "processRecordsDir": "records"
  }
}
```

| Field | Meaning |
| --- | --- |
| `host.moduleDocs` | Module documentation directory pattern, containing `<module>` |
| `host.testsDir` | Test specifications directory relative to each module's documentation directory |
| `host.processRecordsDir` | Process-record directory relative to each module's documentation directory |
| `host.specMap` | Paths grouped by the declared index, loading-rule, ui-ux, integration, testing, engineering and security roles |
| `host.rulebooks` | Host-confirmed rulebook paths |
| `gates.skillsDir` | Skills directory checked by the host gates |
| `gates.styleScanRoots` | Host-owned paths checked for document-style changes |
| `gates.decisionsDir` | Decision archive, when the host maintains one |
| `gates.baselineFile` | Explicit exemptions, each with a reason |
| `gates.baseRef` | The host's actual Git comparison baseline |
| `gates.domainWords` and `gates.hostPrivatePatterns` | Configured domain vocabulary and private path fragments |
| `gates.extraGates` | Additional existing Node gate scripts selected by the host |

Follow declared fallback behavior. For example, ui-generator can use its bundled default UI/UX rules when the host has no UI/UX mapping; it must tell the user which rules it uses. This does not authorize guessing other host values.

See [the configuration contract](process/kit-architecture.md) for validation and optional fields.

## Keep audits independent

When you authored an artifact being audited, dispatch an independent executor with the artifact, Oracle, output location and completion criteria. Keep audit and walkthrough executors separate when required. If the harness cannot provide the needed isolation, state that boundary and obtain the user's decision before treating the result as independent.

Auditors report findings and evidence. Authors repair only within their authorized scope. Preserve the auditor's original conclusions, register unresolved findings in the host's process records, and leave acceptance and phase advancement to the user.

## Optional gates and hooks

Ask permission before enabling repository automation. Read the documented host configuration, then run the gates applicable to the current tree. Inside a cookbook checkout the aggregate command is:

```sh
node tools/gates/doc-sync.mjs
```

Report the actual exit code and every failure. A successful documentation gate does not establish business correctness, runtime integration, independent audit completion or user acceptance. Rebuild distribution artifacts when their inputs change, then check their contents.

Hook registration is host-specific. Read `tools/hooks/claude-settings.example.json` or `tools/hooks/codex-hooks.example.json` and the `hooks` section of the host's `cookbook.config.json`; use user-approved paths and do not copy another project's configuration. Hooks surface checks and reminders, while their gate results remain the evidence.

## Report each phase clearly

State the requested scope, artifacts produced, sources and versions used, checks actually executed, failures, unverified boundaries and decisions needed from the user. Distinguish author implementation, independent confirmation, runtime evidence and user acceptance. Stop at the phase boundary until the user confirms the next step.
