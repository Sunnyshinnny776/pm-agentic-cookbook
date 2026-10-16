---
description: Use when deriving executable tests from a PRD, recording test evidence, and placing case specifications and execution reports.
applies_to:
  - PRD-driven tests
  - test oracle
  - test case specification
  - test execution report
  - guard reverse verification
related_specs:
  - ../engineering/frontend_architecture_spec.md
---

# Testing Spec

Testing makes implementation-vs-PRD divergence executable, repeatable (regressable), and adjudicable.

## 1. Core principles

- **PRD is the oracle**: expected values come from the PRD wording and business invariants, never
  copied from the current implementation. A failing test is treated first as a real finding
  (implementation or spec-wording defect), not as a reason to relax the test.
- **Report honestly, never self-certify a pass**: the test report states pass/fail and defect
  grading; **whether to pass and proceed is the user's call** (same boundary as create-prd /
  check-prd).
- **Co-located, runnable, regressable**: tests sit next to the code under test; the host declares a command that runs the whole suite.
- **Guard cases must be reverse verified**: revert the guarded implementation, confirm the case goes
  red *on its assertion*, then restore. Two criteria decide whether the verification counts — the
  case must go red **for the right reason** (the assertion that encodes the rule, not an unrelated
  crash or a type error), and the reverted state must **reproduce the real failure mechanism**
  rather than a caricature of it. A case that goes red because the mutation broke compilation has
  demonstrated nothing about the guard.

## 2. Stack and commands

The host declares its test stack, setup, and runnable commands. For example, a TypeScript/React host using Vitest, @testing-library/react, and jsdom can define:

| Purpose | Example command |
| --- | --- |
| Watch mode | `npm run test` |
| Single run (CI / report) | `npm run test:run` |
| Type check | `npm run typecheck` |
| Production build | `npm run build` |

For that example stack, `vitest.config.ts` configures the runner; a host-declared global setup supplies in-memory localStorage and per-test isolation.

## 3. Layout and naming

- Co-located: `<module-code>/__tests__/<unit>.test.ts(x)`, relative to the host's module code directory.
- Integration tests: `<domain>.integration.test.tsx` (need a state container / Provider).
- A header comment names the **PRD file and sections traced**; key cases name the PRD rule in their
  description or a comment.
- **Adjudication cases**: a case written against the PRD oracle that is expected to fail (to surface
  a divergence) prefixes its `it` description with `[待裁定]` and notes in a comment that the failure
  is intentional (a finding, not a framework fault) plus its classification.

### Oracle version synchronization

- Test case docs record the current PRD/Domain Model baseline version or date, not only a file path.
- When an Oracle change alters an entity, invariant, state machine, permission, integration contract,
  or acceptance criterion, update affected case traces and expected outcomes in the same change.
- A case that passed under the previous Oracle cannot remain `passed` after its expected behavior
  changes. Mark it `pending update` or `pending implementation` until the revised executable test runs.
- New design coverage may be documented before implementation, but it must never be reported as an
  executed pass without machine or walkthrough evidence.
- Test reports preserve actual execution history. A newer PRD audit does not automatically delete or
  rewrite older test results; each new execution appends a dated section to the module's one ongoing
  report, and a result that supersedes an earlier one says so explicitly.

## 4. Layering (test pyramid)

| Layer | Targets | Notes |
| --- | --- | --- |
| Unit | pure functions, derivations, data contracts | make this thick first (e.g. `getApprovedPlanAmount`, org tree, role contracts) |
| Integration | state transitions, procurement ledger, approval side effects | use `renderHook` + Provider |
| Component | key page render and core interactions | |
| E2E | cross-page flows | |

## 5. Artifacts and placement

Each tested module produces two human-readable docs under the host-declared module documentation directory:

- **Test case doc**, under the host's `testsDir` (a result document): use the test-case template supplied by `test-authoring`, `skills/test-authoring/templates/tob_test_case_spec.md` relative to the cookbook root.
- **Test report**, under the host's `processRecordsDir` (a process document, one ongoing report per module, updated in place): use `skills/test-authoring/templates/tob_test_report.md` relative to the cookbook root, including the failure list with defect P-grading and an adjudication column.

`testsDir` and `processRecordsDir` are host configuration fields for child directories relative to each module's documentation directory.

Both docs stay in Chinese (alongside the module PRD).

## 6. Failure classification and adjudication

Each failure is classified as an **implementation defect** or a **PRD/Mock wording to confirm**, with
expected (PRD), actual, location (`file:line`), and a P-grade. **The adjudication column is filled by
the user**: fix / change PRD wording / accept and record.

P-grades: P0 blocks a core flow or data correctness; P1 a key rule deviates from the PRD; P2 wording
to confirm / boundary; P3 optimization.
