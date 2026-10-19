---
authority: zh
translation_of: overview.md
source_version: be5745e2a1588a360f9b413f0124f3707fbdc8ab
---

This is an English translation of [overview.md](overview.md); the Chinese original is authoritative.

# End-to-End Agentic Workflow for ToB Products

> PM Agentic Cookbook’s central navigation guides PMs through every stage from requirements to launch.

---

## Workflow overview

```text
Source Intake → Domain Model → Acceptance Criteria → PRD Draft → PRD Audit → UI Prototype → Test → Requirements Acceptance & Final Verification
   Stage 0        Stage 1         After Stage 1       Stage 2     Stage 3      Stage 4      Stage 5                     Stage 6
```

**Stage zero determines the evidence base for later stages.** It establishes what material exists and whether it can support design. The business basis at the start of the workflow is a stage-zero output.

---

## Stage gate rules

Every stage follows “deliverables + AI self-check + user review + explicit confirmation before advancing.”

Execution constraints:

- Stop at the end of each stage; do not automatically enter the next.
- Multiple revisions within a stage are allowed until both self-check and user review are satisfied.
- Do not advance without explicit user confirmation.
- All business evidence comes from confirmed source documents within the project.
- **The system solution or confirmed project source documents are the sole implementation basis**. Do not independently change their functional logic. Stop for a user decision when deviation is necessary.
- **When the underlying data layer is broken or absent, or differs from source-document logic, do not remove links or intermediate layers to build a fallback implementation**. Explain the gap and let the user decide whether to complete the data layer before continuing. Silent deviation compounds through PRDs and prototypes.
- **Keep the Domain Model → Acceptance Criteria → PRD order**. Generate PRDs from completed, correct models. When underlying PRD logic is missing or wrong, inspect and correct the Domain Model first, confirm it, revise and confirm affected criteria, then synchronize the PRD.
- **Feedback at every stage**: when downstream work reveals an upstream gap, conflict, or infeasible requirement, pause affected work and revise the earliest affected artifact. Do not replace its semantics downstream. Mark affected criteria as pending confirmation and record the originating stage. After user confirmation, synchronize PRD, coverage, and test references and validate again; old results do not establish the new criteria. Auditors and walkthrough executors only report; an authorized author performs revisions.
- **Every workflow starts with Source Intake**. Tier selection determines the Oracle’s source without removing subsequent stages. Skipping intake silently assumes that the material is adequate.
- Do not skip modeling, PRDs, or audits to write UI directly.
- Do not skip tests before Final Verification. Apply executable tests to prototype code using the PRD as oracle, making deviations visible in test specifications and reports.
- Record test results honestly. Classify failures as “implementation defect” or “PRD/Mock semantics awaiting confirmation.” **The user decides whether the stage passes and advances**; AI does not self-certify a test pass.
- Consider commits, pushes, and PRs after Final Verification passes.
- **Authors may not audit their own artifacts**. PRD Audit (stage 3), checklist-driven E2E walkthroughs, and journey audit (stage 5) must be delegated to independent subagents. See `process/agent-execution-protocol.md` for stage executors, dispatch checklists, and repair boundaries.

---

## Requirement scopes and artifact ownership

A requirement scope has a clear business result, inclusions/exclusions, dependency contracts, and a meaningful acceptance exit. Each scope finally confirmed by the user owns one criteria checklist and one corresponding acceptance register. A scope may reference multiple Domain Models and PRDs; several scopes may share one authoritative model. Business objects determine model organization; file counts, pages, module names, and a single user message cannot alone determine the number of scopes.

At stage zero, map every original requirement to candidate scopes and unresolved intersections and obtain preliminary user confirmation. Modeling validates entities, states, rules, and dependencies and proposes necessary merges, splits, or dependency adjustments. Before criteria generation, the user finally confirms the scope name, business result, inclusions/exclusions, dependencies, and acceptance exit. This may share the existing model confirmation gate; do not ask again about an explicitly confirmed final boundary. Later scope changes require user confirmation before synchronizing models, criteria, PRDs, and registers; do not shrink requirements to match the implementation.

Reuse the Requirements Confirmation or existing module/project entry document with a small table: `Scope name | Business result | Inclusions and exclusions | Dependencies and intersections | Acceptance exit | Confirmation status`. Independent results close separately; an inseparable cross-module result stays in one scope. Independent results with an additional shared end-to-end requirement need an integration acceptance scope containing only the shared conditions and interaction result, referencing shared contracts and component scope versions without copying their criteria. Component acceptance cannot prove integration acceptance. Submit uncertain boundaries to the user without dropping original requirements or confirming them yourself.

Module entry documents keep only a light index: `Scope name | Models/PRDs | Criteria checklist | Acceptance register | Current progress`. A cross-module scope has one explicitly confirmed primary location and coordinator; other modules index the same authoritative artifacts. Without an applicable primary module, the caller specifies a project-level location. Continuous revisions of the same scope reuse its checklist and register. Confirmed splits/merges preserve mappings from old scopes and criterion IDs to their new ownership, retaining IDs and history.

The checklist holds business definitions, current confirmation/obsolete status, and a concise change log. The register belongs to the host's process records: its current view holds effective results, open matters, and a round index, while complete ended rounds remain in locatable historical snapshots rather than accumulating full old text. Save the scope-prefixed register in the caller-specified primary module's `host.processRecordsDir`; module paths come from `host.moduleDocs`. Do not guess locations. Confirmation of definitions and acceptance of delivery are recorded separately; pending delivery acceptance does not change a confirmed criterion's status.

---

## Stage 0: Source Intake

**Goal**: assess whether materials support design, determine the Oracle's source, and outline deliverable requirement scopes before modeling. Tier selection does not remove subsequent stages.

**Why first?**
Every later stage assumes a sufficiently good Oracle exists. PRDs need a basis, audits need a comparison baseline, and tests need an oracle. **The assumption does not raise an error**: missing material can still yield apparently complete documents without criteria. Intake makes the assumption explicit.

**Core rule**: **An Oracle must exist and must be a file**. Its source may be supplied documentation, interview-based confirmation, or a reverse-engineered baseline of a running system. **Do not take on projects without an Oracle.**

**Steps**:

1. Load `skills/source-intake/SKILL.md`.
2. Answer the **four intake questions**: readability → authority → **completeness (breadth × depth)** → consistency. Conclude all four before proceeding.
3. **Assign T0–T3** to determine the Oracle’s source. Submit the tier decision to the user.
4. For insufficient material (T0/T1), conduct **structured interviews** and create a Requirements Confirmation with a completeness matrix: user confirmed / executor inferred / still blank.
5. For a running system (T3), reverse engineer a Current-State Baseline, labeling each conclusion with credibility and evidence pointers.
6. Organize candidate scopes, intersecting dependencies, and unresolved boundaries in the scope table for preliminary user confirmation. Submit UNRESOLVED items to the user. **AI may not self-certify intake.**

**Deliverables**:

- [ ] Source Material Intake Report: four conclusions, tier, breadth/depth gaps, UNRESOLVED items, capability boundaries.
- [ ] Source Material Index: the **sole entry point** for later material consultation.
- [ ] Requirements Confirmation and completeness matrix (T0/T1).
- [ ] Current-State Baseline (T3).

**Requirements**:

- **Later stages must not manually scan material directories**. Use anchors in the Source Material Index.
- When materials change or coverage proves insufficient, **repeat the four questions and update the tier**, rather than retaining the old conclusion.
- Interview outputs are **drafts awaiting confirmation**. AI cannot observe work, rotate through roles, enter a workplace, or establish the trust needed for the strongest forms of business investigation. State this limit in the report.

---

## Stage 1: Domain Model

**Goal**: turn vague business needs into precise, structured data models.

**Why it matters**
ToB complexity lives in the data layer. Compensation calculations, budgeting, and approvals depend on rigorous relationships. An unclear model distorts later AI-generated PRDs and prototypes.

**Steps**:

1. Use stage-zero outputs: the Source Material Index for T2/T3, Requirements Confirmation for T0/T1. **Do not collect requirements again from scratch**; that belongs to stage zero.
2. Supply requirements to AI with `skills/domain-modeling/SKILL.md`.
3. AI produces ER diagrams, core entities, field specifications, and calculation chains.
4. AI self-checks and validates Mermaid, using the model to validate candidate scope exits, shared entities, and dependencies. Submit adjustments for user confirmation; do not invent or split entities for acceptance grouping.
5. After confirmation of both models and final requirement scopes, enter Acceptance Criteria. A scope may reference multiple models; confirm the checklist row by row before PRD Draft.

**Deliverables**:

- [ ] Domain Model document.
- [ ] Core entities and field definitions.
- [ ] ER diagram and relationship details.
- [ ] Business rules and calculation chains.
- [ ] Self-check checklist.

---

## After Stage 1: Acceptance Criteria

**Goal**: turn the confirmed model and requirements basis into business completion criteria the user can check one row at a time.

1. Use `skills/acceptance-criteria/SKILL.md` with the finally confirmed scope, requirements sources, all associated confirmed model versions, checklist path, and corresponding register location.
2. Produce scope/basis/status at the top, categorized five-column tables (ID, scenario, expected result, source, status), pending questions, and a change log. Each row checks one result. Sources name the document, section number and title. Status is pending confirmation, confirmed, or obsolete; IDs increase and are never reused.
3. Stop after generating the draft for explicit per-row confirmation. Do not enter PRD drafting with unconfirmed criteria or upstream conflicts.
4. Downstream artifacts reference the checklist name and ID without copying the authoritative table. PRDs add page-level assertions; journey-audit stage A and test-authoring supply journeys and test data.

**Deliverables**: a named, traceable checklist, pending questions, and a change log. consistency-audit checks its agreement with PRDs, coverage manifests, and tests.

---

## Stage 2: PRD Draft

**Goal**: generate a PRD draft from the confirmed Domain Model and acceptance checklist.

**Steps**:

1. Supply the confirmed model and per-row-confirmed checklist. Section 4.2 references the checklist; each row in 10.2.1.4 names the criterion it refines.
2. Use `skills/create-prd/SKILL.md` to generate the full PRD.
3. AI checks chapter completeness, diagrams, flows, state machines, and exceptions.
4. PRD Audit requires user confirmation of the draft.

**Deliverables**:

- [ ] Structured PRD.
- [ ] PRD self-check checklist.

---

## Stage 3: PRD Audit

**Goal**: assess PRD quality and produce severity-ranked issues and corrections.

**Steps**:

1. Supply the stage-two PRD.
2. Audit with `skills/check-prd/SKILL.md`.
3. Produce P0/P1/P2/P3 issues and corrections.
4. After retrieving the audit, the main Agent registers open issues in `<module>_open_findings.md` under the module’s process-record directory, named by `host.processRecordsDir`. Commit the original report with the batch, then remove it; the user only needs the register.
5. UI Prototype requires user confirmation that no blocking issue remains.

**Deliverables**:

- [ ] PRD audit report.
- [ ] Disposition checklist for historical audit reports in the same location.
- [ ] P0/P1 dispositions.
- [ ] P2/P3 deferral or acceptance explanations.

---

## Stage 4: UI Prototype

**Goal**: generate an interactive, high-fidelity frontend from the audited PRD.

**Steps**:

1. Supply the PRD, audit conclusions, and ui-generator’s `templates/tob_design_tokens.css`.
2. Use `skills/ui-generator/SKILL.md`.
3. Add `skills/table-template-designer/SKILL.md` for complex tables.
4. Preview locally with `npm run dev` and iterate.
5. Enter Test only after the user confirms the page experience and complete business flows.

**Deliverables**:

- [ ] Runnable high-fidelity prototype.
- [ ] Component-based frontend code.
- [ ] Disposition of user walkthrough feedback.

---

## Stage 5: Test

**Goal**: make deviations between implementation and PRD visible and available for a decision. Use the PRD as oracle for executable tests and produce case specifications and reports.

**Why a separate stage?**
Without tests, deviations in AI-generated code are invisible to users; walkthroughs sample behavior and cannot provide regression testing. Testing makes deviations visible, repeatable, and traceable, closing the loop back to the PRD.

**Steps**:

1. Load `skills/test-authoring/SKILL.md`. Derive cases from PRD business rules (facts, constraints, triggers, inferences, calculations), confirmed independent criteria and their PRD refinements, state machines, exception plans, and role-permission matrices.
2. Implement the test pyramid: pure functions/derived logic → unit tests; state transitions/cross-entity rules → integration tests; critical pages → component tests. Expected values come from the PRD.
3. Run tests, such as `npm run test:run`, and produce:
   - **Test case specification**, using test-authoring’s `templates/tob_test_case_spec.md`: case ID, named PRD section, acceptance criterion (checklist name plus ID), steps, expectations, and results; record criterion coverage or reasons for gaps.
   - **Test report**, using `templates/tob_test_report.md`: pass/fail summary and failure list with severity and decision columns.
4. Classify failures honestly as “implementation defect” or “PRD/Mock semantics awaiting confirmation.” AI does not self-certify a pass.
5. After development and tests for a declared feature/iteration scope, review the criteria and update its register's factual results and gaps without automatically declaring final acceptance. After user decision, enter Requirements Acceptance & Final Verification or route deviations to the earliest affected stage. Revise and confirm model/criteria changes before synchronizing PRD, UI, and tests.

**Deliverables**:

- [ ] Executable unit/integration/component tests.
- [ ] PRD-traceable test case specification.
- [ ] Test report: pass/fail, severity, decision columns.
- [ ] Failure classifications and routing/repair conclusions.

**Requirements**:

- Treat failing tests first as real findings about implementation or semantics. Do not change expectations to accommodate code.
- v1 need not pursue coverage percentages, but tests must actually run and support regression, with case specifications and reports.

---

## Stage 6: Requirements Acceptance & Final Verification

**Goal**: after development, tests, and necessary walkthroughs, check delivery against each confirmed criterion, supply evidence and open matters, and obtain explicit user acceptance of the current scope.

**Steps**:

1. Fix the confirmed requirement scope, current inclusions/exclusions, checklist version, implementation version, and evidence baseline, and verify build/runtime. Exclusions require explicit scope confirmation. Unconfirmed or missing criteria are upstream prerequisites; do not skip them and claim whole-scope acceptance.
2. Use the [acceptance register template](../templates/tob_acceptance_register.md), one register per scope, listing all applicable criteria and the disposition of other rows. Check normal, exceptional, permission, boundary, and explicitly sourced nonfunctional requirements. Verify integration exits separately; Mock results cannot establish real completion of unavailable dependencies.
3. Reuse valid current tests, real walkthroughs, and independent audit evidence. Check actual assertions, paths, versions, and uncovered boundaries. Green tests or a completed page do not replace criterion-specific evidence; unit tests do not automatically cover journeys/integrations, and old evidence does not prove changed semantics. Route needed independent checks by object/question into the established task's closing audit or reuse valid conclusions. Entering stage six does not automatically add a full audit.
4. Record one of four factual results, evidence, and open matters. Reverse-check implementation/tests for business behavior without a criterion basis. Repair definite defects and retest; revise and reconfirm the earliest incorrect upstream basis when criteria are wrong. Do not weaken criteria to obtain green results.
5. Submit per-row results, evidence, open matters, and the current scope for user acceptance. An explicit batch ruling updates only that scope; leave other user-decision cells blank. Proceed to delivery/collaboration after the user explicitly decides the current delivery, retaining exceptions and deferrals.

**Factual results and user decisions**: the register has `Acceptance criterion (checklist name + ID) | Check result | Evidence | Open matters | User acceptance decision`; it does not copy the criteria table. Leave unreviewed results blank and mark them pending review in open matters. After review use only these four values:

| Check result | Criterion |
| --- | --- |
| Satisfied | Current sufficient evidence supports every necessary applicable path in the declared scope, without a counterexample |
| Partially satisfied | Some paths of the same criterion are proven satisfied and other paths proven unsatisfied; locate both |
| Unsatisfied | A definite counterexample exists without a proven satisfied subset supporting partial satisfaction; disclose unknown paths too |
| Insufficient evidence | Current relevant sufficient evidence cannot establish the preceding three results; sampled success with remaining paths untested belongs here |

Partial satisfaction does not reduce the risk severity of security/permission failures. Record user decisions only from explicit rulings: pass, fail, accept deviation, or defer, with date and evidence. Satisfied plus explicit user pass closes the acceptance matter for that version/scope; satisfied without a ruling remains awaiting acceptance. Accepting a deviation preserves the factual result, exception boundary, and follow-up; it does not make the criterion satisfied. Deferral preserves incomplete delivery. The source checklist retains pending confirmation/confirmed/obsolete status. Acceptance does not delete criteria or recycle IDs, and obsolete criteria do not count as passes.

**Stage reviews and changed-version checks**: review a declared feature/iteration after development/tests, or affected rows after semantic changes, using the same evidence checks and an explicit current scope. Ordinary saves do not create rounds. Recheck affected rows and obtain new acceptance decisions. Carrying forward unaffected results requires evidence that semantics and implementation are unchanged. Old user decisions retain their original scope/version/date as history; the user explicitly confirms any current reuse. Summaries separately count applicable rows, each factual result/unreviewed rows, and user rulings/unruled rows. Partial results, deviations, deferrals, and inapplicable rows do not count as all satisfied.

**Deliverables**:

- [ ] Build results.
- [ ] Key interaction walkthrough records.
- [ ] Acceptance registers for each requirement scope and integration exit evidence.
- [ ] Open matters, user acceptance rulings, and a scope-limited delivery decision.

---

## 💡 Best practices

1. **Build and reflect together**: after each module, review the collaboration with AI.
2. **Model first**: complete modeling before the PRD.
3. **Small steps**: generate and verify individual pages; do not submit every requirement at once.
4. **Keep prompt logs**: record key prompts to improve instructions.
5. **Diagnose first; separate repairs from design decisions**: locate every mixed-list issue and diagnose its root cause at `file:line`. Classify each as a deterministic repair or an open design decision. Execute repairs; offer explicit viable options for design decisions and wait for the user before coding them.
6. **Stop on data-layer gaps**: when modeling or PRD work reveals missing intermediate entities or broken links, stop, complete the data, and revise the Domain Model as needed. Fallbacks through missing layers deviate from source logic and compound through PRDs and prototypes. The user decides whether to complete the data layer; AI diagnoses and submits the decision.
