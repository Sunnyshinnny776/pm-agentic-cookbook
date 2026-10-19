---
authority: zh
translation_of: README.md
source_version: 1ec7d42100ecac28560881b47a5846f00f96fb3d
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# test-authoring — Executable Tests with the PRD as Oracle

Derive test cases from the PRD’s business rules, acceptance criteria, state machines, exception handling, and role-permission matrix. Write runnable unit, integration, and component tests, plus a test case specification and execution report.

This makes implementation deviations from the PRD visible and available for a user decision. Without it, walkthroughs only sample behavior and cannot provide regression testing.

## Two mandatory rules

- **Expected values come from the PRD, never by copying the implementation.** Treat a failing test first as evidence of a real implementation or specification issue.
- **Do not self-certify a pass.** Classify failures honestly as “implementation defect” or “PRD/Mock semantics awaiting confirmation.” The user decides whether the work passes.

Reports must say which new functionality the added tests cover. Existing green tests establish the absence of regression; they do not establish the correctness of new functionality.

## Code defect self-review

After writing code and before delivery, this skill requires a defect review covering logic, data integrity, security basics, performance, and test effectiveness. Fix findings and briefly tell the user; do not create a report.

| Environment | Review capability |
| --- | --- |
| Claude Code | Built-in `/code-review` |
| Codex | Built-in `/review` |
| Other environments | Follow `references/code-self-review.md` item by item |

## Acceptance criteria integration

Cases name confirmed criteria using checklist name plus ID and record criterion-level coverage and gaps. Conflicting sources return upstream; baseline-only regression cases explicitly mark criteria not applicable.

Hand off criterion/implementation baselines, actual assertions and covered paths, machine results, and coverage gaps. Separate plans from executed tests and Mock/unit results from real integrations. The workflow author maintains scope registers; the user decides delivery acceptance.

## Model Experience

| Item | Content |
| --- | --- |
| Always loaded | `name` + `description`, approximately 197 characters |
| On-demand loading | `SKILL.md` body, approximately 3.6k characters |
| Secondary loading | Read `references/test-mapping.md` (2.6k) when deriving cases from the PRD; `references/test-conventions.md` (2.5k, naming/layers/decisions) when writing cases and reports; `universal-prompt-intro.md` (0.7k) is for dist builds only |
| Domain Provider | `references/providers/<domain>/`, currently absent. Domain-specific testing semantics, such as precision rules for a category of monetary values, belong here rather than in the body |
| Context budget | Always loaded 10² / body 10³ / full content on the order of 10³ characters |

## Directory structure

```text
SKILL.md
references/test-mapping.md
references/test-conventions.md
references/code-self-review.md
templates/tob_test_case_spec.md       # Test case specification template
templates/tob_test_report.md          # Test execution report template
dist/
scripts/build.py
```

## Change history

See [CHANGELOG.md](CHANGELOG.md).
