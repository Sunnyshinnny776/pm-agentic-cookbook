---
authority: zh
translation_of: README.md
source_version: c41814b82483236d7f1986d66de9030a3a7cd68e
---

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# acceptance-criteria — Business acceptance criteria

Generate a checklist defining completion after a confirmed Domain Model and before a PRD. The user confirms each criterion; downstream artifacts reference the checklist name and ID. A generated draft does not advance to PRD drafting automatically.

## Usage

Provide scope, confirmed requirements or a source index, the confirmed model file/version, and an output path. For revisions, also provide the current checklist and downstream gaps. Resolve unconfirmed models or unlocatable sources first.

The document contains only scope/basis/status at the top, categorized five-column criterion tables, pending questions, and a change log. The five columns are ID, scenario, expected result, source, and status. Name the source document, section number, and section title. Row statuses are pending confirmation, confirmed, and obsolete. IDs increase and are never reused.

## Responsibilities and feedback

create-prd adds page-level details; journey-audit stage A and test-authoring create journeys and test data. consistency-audit checks agreement. When downstream work uncovers upstream gaps, pause affected work, revise its basis and checklist, obtain confirmation, then synchronize references. Do not create another authoritative copy downstream.

Provide the finally confirmed scope statement, all associated confirmed model versions, checklist path, and corresponding register location. Each scope owns one artifact pair; modules only index it. Revisions reuse the pair, keeping definition confirmation separate from delivery acceptance.

## Model Experience

| Item | Consumption |
| --- | --- |
| Resident | Name and description, approximately 175 characters, discover checklist generation/revision requests |
| On demand | Load SKILL instructions when defining or revising business completion criteria |
| Secondary | Read templates/acceptance-criteria.md when organizing the checklist; other skills and domain material are not loaded by default |
| Context budget | Approximately 2985 characters for instructions excluding frontmatter and 690 for the template; business inputs are additional |

## Distribution

Directory use loads SKILL and the template; the universal prompt embeds both. Installation packages exclude evals and domain instances. Build with:

```sh
python3 scripts/build.py
```

## Limits

Traceability and per-row confirmation do not establish that the model is business-correct or that implementation passed acceptance. Missing sources, unknown values, and conflicting evidence remain pending. The user supplies confirmation and progression decisions.
