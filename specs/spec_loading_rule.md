# Spec Loading and Capture Rule

## Purpose

This rule ensures agents and engineers load the right project specs before implementation and capture new agreed rules after implementation. It applies to every agent and engineer working on the project.

## When To Use

Use this rule before and after any task that touches:

- UI pages, interaction patterns, components, copy, colors, layout, feedback, table actions, or role navigation.
- External system integration, OA approval, callbacks, retries, idempotency, snapshots, attachments, or status mapping.
- Cross-module business rules, shared data, shared types, reusable components, or workflow state transitions.
- Any new pattern that may repeat across pages, modules, or future sessions.

## Required Loading Flow

1. Read `specs/README.md` to identify the rule domain.
2. Read the relevant domain index:
   - UI/UX work: `specs/ui-ux/ui_ux_specification.md`
   - External integration work: `specs/integration/README.md`
   - Module business work: the relevant module PRD
   - Module state / data access / money handling work: `specs/engineering/frontend_architecture_spec.md`
3. Match candidate specs by front matter:
   - `description`
   - `applies_to`
   - `related_specs`
4. Load only the matched spec bodies and necessary related specs.
5. When the task touches roles, permissions, data scope, or a PRD's chapter 12, read the project's
   system-level role and permission registry first, if it keeps one. That registry is the single
   source for the role roster, the permission-point catalogue, the table format and the global
   RBAC rules; module PRDs carry only their own grant decisions and must not restate the standard.
6. Before implementation, state which specs were loaded and which key rules apply.

## Front Matter Format

Specs should use this minimal front matter:

```yaml
---
description: Use when ...
applies_to:
  - keyword or scenario
related_specs:
  - relative/path.md
---
```

Do not add maintenance-heavy metadata such as owner, lifecycle status, or version unless the project explicitly needs it later.

## Spec Capture Check

After implementation and validation, agents must decide whether new rules should be captured. Update an existing spec, or propose a new spec, when any of the following occurred:

- The user and agent reached a stable decision about a reusable UI, interaction, integration, or workflow rule.
- A new pattern was introduced that future pages or modules should follow.
- A spec gap was discovered and resolved during implementation.
- Multiple files or modules now depend on the same behavior or terminology.
- A user correction changed a previous rule, boundary, or naming convention.
- A new external system, workflow ownership boundary, callback pattern, retry rule, or status mapping was introduced.

Do not update specs for one-off page content, temporary mock data, isolated copy changes, implementation details that are unlikely to repeat, or unresolved ideas that the user has not accepted.

## Born-Portable Writing Rule

A spec rule is meant to be reused beyond the page or module that prompted it. When adding or editing a spec rule:

- Write the generic rule sentence first; attach project-specific illustrations as clearly separable examples (e.g. in parentheses: `danger for destructive actions (e.g. 删除计划任务)`), so reusing the rule elsewhere only replaces the example, never rewrites the rule.
- Do not weave project entity names, org structures, role matrices, or business figures into the rule sentence itself.

## The Toolkit Is Not an Authority

The cookbook's skills, process documents, templates and tools are a **separately maintained
toolkit**, not part of the project's authority chain. A result document — a PRD, a Domain Model, a
spec — states the criterion it relies on; it does not cite a toolkit rule id or file path as the
reason a decision holds.

**Scope**: this governs claims about *the project's* artifacts. A section whose subject is the
toolkit itself — how its skills are structured, how its decision archive works — names the toolkit
document that owns that subject, because there the toolkit is what is being described rather than
the grounds for a claim about a project artifact.

- **Why**: the toolkit restructures on its own schedule. When it does, a citation either dangles or,
  worse, silently points at a file whose content has moved on — and a reader chasing the reference
  cannot tell which. A criterion worth relying on is worth writing down where it is relied upon.
- **What this bans**: rule ids (`XX-R9` and the like), toolkit paths given as the basis of a claim,
  and reference-table rows naming a skill as a document's upper source. Write the substance instead;
  it costs a sentence and stops depending on someone else's directory layout.
- **What stays**: running a toolkit script or filling a toolkit template is an action, not a basis —
  those commands and template paths remain. Agent rulebooks and execution plans may point at the
  toolkit, because routing work to it is their job.
- **Fix on contact**: when editing a document that still carries such a citation, replace it in the
  same change. No repo-wide sweeps.

## Kit Skill Architecture

Separating the generic layer from project or domain specifics inside a cookbook skill follows `process/kit-architecture.md`, which is the owning document for skill structure. It applies whenever a skill is added or its structure changes:

- A new skill must be designed with all three capability-seam roles resolved before it is written: what the Service Definition owns (`SKILL.md` plus the generic `references/` files, which must carry no domain nouns), what a Service Provider supplies (`references/providers/<domain>/`), and how a Consumer passes a complete request rather than relying on an implicit domain default.
- Adding a domain means adding a Provider, never editing the Definition. Needing to edit the Definition to fit a new domain is the signal that a previous domain's assumptions leaked into it.
- Directory name, frontmatter fields, and the README's Model Experience declaration follow the same document; the `verify-skill-frontmatter` and `verify-skill-generic-layer` gates enforce its machine-checkable parts.
- **Invoking a skill that has a Provider means naming the domain.** A skill that ships domain Providers must be invoked with the project's domain (for example `hrm`, the example Provider); its domain risk rules, dimension checkpoints and report rows live in `references/providers/<domain>/` and load only when the domain is named. Omitting it degrades silently — the generic frame still runs and still produces a report, with the domain checks simply absent. Projects usually repeat this rule in their agent rulebook; keep the two in sync.

## Capture Workflow

1. Identify the smallest existing spec that owns the new rule.
2. Add the rule there using the same style and terminology as the existing document.
3. If no existing spec owns it, tell the user a new spec is needed and recommend the file path.
4. Update index links when a new spec file is created.
5. In the final report, include whether a spec was updated or why no spec update was needed.

## Boundary

Specs record reusable product, UI, integration, and workflow rules. Module PRDs record module-specific business requirements. Code comments and implementation docs record local technical details.

The project's decision archive records the decisions themselves — what was chosen and what it beat; the mechanism is owned by `process/decision-archive.md`, and the archive's own README carries only the project's usage. The split against a PRD is deliberation versus norm: a rejected proposal is not project content and does not belong in a PRD, while the value the ruling settles on (a `—` in a permission matrix, a scope boundary) is normative and stays. The test is whether removing the line would make an implementer get it wrong. Closed ruling items therefore leave no dedicated table in the PRD: the change log carries one line saying what closed, the body carries the resolved values, and the archive carries the reasoning and the alternatives. One exception stays in the PRD — a registered, deliberate divergence between a norm and the current implementation, because a reader of the norm has to see it in the same place or will treat it as a defect.

The same split governs identifiers. An audit finding number, a walkthrough observation number, a backlog item number, a plan's ruling number — each is defined in a **process document** (an audit report, a walkthrough record, an execution plan, a task list), and process documents are cleaned up when their task ends. A result document outlives them, so the identifier is left dangling: a reader meets it and can no longer resolve it anywhere. The test is whether the identifier can be explained inside this document, or inside some document that will still exist. If not, replace it with the substance it stood for — "closes audit F-07" becomes "closes the plan-lock timing conflict", which carries more information, not less. Change logs are the usual offender, because they naturally record why a version changed and the why is often a process identifier. Identifiers that belong to result documents (business rule numbers, permission codes, rules defined in the document itself) may be used, but carry an intelligible name rather than a bare code.

Fix these opportunistically: when editing a section that contains a dangling process identifier, resolve it in the same change. No document-wide sweep is required, and none should be scheduled — the backlog is cleared by ordinary editing.
