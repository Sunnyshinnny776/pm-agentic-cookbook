---
authority: zh
translation_of: README.md
source_version: cb92c81cee65548bdb62455921df62ce893e95ac
---

<!-- Derived from pmYangKun/create-prd-skill; modified by PM Agentic Cookbook contributors. SPDX-License-Identifier: Apache-2.0. See LICENSE and NOTICE. -->

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# create-prd — ToB PRD Generation

> **Give AI a business description and receive a structured, 14-chapter PRD.**

A product manager’s biggest writing cost is **building the PRD structure from scratch**: deciding which chapters to include, what each should say, and what is easy to overlook. This often consumes more than half the writing time.

create-prd addresses that cost. Supply business context—a description, meeting notes, or even a sentence—and AI generates a ToB PRD with initial content covering business context, business analysis, product architecture, data modeling, processes, permissions, and operations. Each chapter contains substance rather than empty placeholders.

For HR systems, it also addresses organizational permissions, employee/employment/profile granularity, salary and personal income tax sensitivity, period semantics, state locking, batch import synchronization, cross-module flows, and traceability. It applies to HR SaaS, in-house HRM, private deployments, and customization projects.

**Start from an 80-point draft and refine it to 100, rather than writing from zero.**

## Why the generated PRD is reliable

Generation follows three established methodology publications:

- **《决胜B端（第二版）》** — Douban 8.6, 13 reprints; a ToB reference supplying the three-layer business research framework, thirteen-element/five-step method, three-step ER modeling method, and STP segmentation.
- **《决胜体验设计》** — ToB experience design, supplying quadrant analysis, the “Six Swords” framework, and four design principles.
- **《决胜B端 PRD 模板 v2.0》** — the standard 14-chapter structure defining what each chapter contains and how to write it.

These methods have been used in training and consulting for over a hundred companies, including Huawei, JD.com, P&G, and ICBC. create-prd **uses them to build a PRD structure and fill initial content**.

## What the PRD contains

| Chapter | Content | Methodology |
| --- | --- | --- |
| 1. Project background | Industry analysis, current business state, pain points | Three-layer business research |
| 2. Requirements context | Sources, reconstructed scenarios, underlying motivations | Thirteen-element/five-step method |
| 3. Business analysis | Positioning, competitors, revenue model | STP + Lean Canvas |
| 4. Benefits and goals | North Star metric, quantified goals, ROI | OCSM |
| 5. Solution overview | Overall solution, technology choices, milestones | — |
| 6. Scope | Functional boundaries, nonfunctional requirements, exclusions | — |
| 7. Risks | Identification, assessment, responses | — |
| 8–9. Terms and references | Terminology and references | — |
| **10. Functional requirements** | **Architecture, ER model, flowcharts, state machines, per-module requirements** | **Three-step ER modeling + UML** |
| 11. Analytics instrumentation | Event tracking plan and metrics | — |
| 12. Roles and permissions | RBAC and data permissions | RBAC |
| 13. Operations plan | Launch and monitoring | Six-step pilot method |
| 14. Open decisions | Unconfirmed items, risk decisions, later plans | — |

When input is sufficient, generate substantive content. Otherwise use `[TODO: specify the missing information]`; do not invent facts.

### Generate by product type

In-house systems and commercial products require different PRD priorities. A single template can omit essentials or add irrelevant content.

Before generation, create-prd performs **product classification** (commercial vs. in-house × business/tool/transaction/infrastructure type × domain × document scope), then adjusts chapter depth and focus:

- **Commercial products**: market analysis, competitors, revenue, pricing, MVP validation, acquisition, and conversion.
- **In-house systems**: process coverage, organizational fit, permissions, data integration, exceptions, and internal rollout.
- **HR systems**: organizational data permissions, sensitive data protection, person and period semantics, state locking, cross-module collaboration, import synchronization idempotency, and traceability.
- **Module-level requirements**: module boundaries, interactions, fields, rules, exceptions, permissions, and acceptance criteria; avoid packing a complex module into one oversized PRD.

Do not impose commercial templates or revenue-model sections on in-house system PRDs.

## Quick start

### Option 1: Any LLM, without installing tools

1. Download [`dist/create-prd-universal-prompt.md`](dist/create-prd-universal-prompt.md).
2. Open your preferred LLM (ChatGPT, Gemini, DeepSeek, Kimi, Qwen, etc.).
3. Paste `create-prd-universal-prompt.md` first.
4. Supply your business context and send.
5. For a particular domain, name it and also paste its Provider files from `references/providers/<domain>/`. The universal prompt contains no domain Provider.

> Use a capable model, such as GPT-4o, Claude, Gemini Pro, or DeepSeek-R1, for more complete generation.

### Option 2: Claude Code integration

```bash
python scripts/install_skill.py
```

After installation:

```text
/create-prd
```

Or trigger it with natural language:

- “Write a PRD for a CRM system.”
- “Generate a product proposal from these meeting notes.”
- “I want to build a supply chain management system; help me write the requirements.”

## Generation flow

```text
You provide a business description
    |
Stage 0: AI infers product type → you confirm
    |
Stage 1: Chapters 1–9 (output one chapter at a time)
    |
Stage 2: Chapter 10 (architecture + ER model + processes + state machines + module requirements)
    |
Stage 3: Chapters 11–14
    |
Stage 4: Automatic self-check → remaining improvements
```

Commercial products, in-house systems, private deployments, and module-level requirements have different priorities. AI identifies product type, domain, and document scope and adjusts chapter depth.

## Close the loop with check-prd

| Step | Tool | Purpose |
| --- | --- | --- |
| Create | **create-prd** | Generate a structured 14-chapter PRD draft from business context |
| Review | [check-prd](../check-prd/README.en.md) | Check 14 dimensions and produce issues and improvements |

Generate a draft, refine it yourself, then review it. **AI builds the structure → humans fill it out → AI finds gaps**: a complete document workflow.

## Acceptance criteria integration

Use a confirmed independent acceptance checklist: section 4.2 references it, and each assertion in 10.2.1.4 names the criterion it refines. New business expectations return upstream for confirmation.

Reference the unique criteria checklist for the finally confirmed scope, which may associate multiple models/PRDs. PRDs refine criteria; module entry documents index the checklist and register without copying delivery records or treating definition confirmation as delivery acceptance.

## Model Experience

Character counts use Unicode code points. Body counts exclude frontmatter; all references include Providers and universal prompt introductions. Character counts are not token counts.

| Item | Content |
| --- | --- |
| Always loaded | `name` + `description`, approximately 146 characters |
| On-demand loading | `SKILL.md` body, approximately 9.8k characters, including the 14-chapter structure and field-level rule blocks |
| Secondary loading | **Read by chapter**: 13 files in `references/chapters/`, approximately 35.5k characters total. Read file N when writing chapter N. `create-prd-ch10-functions.md` alone is **14.6k characters**, the largest file; reserve context before writing functional requirements. Read `appendices/create-prd-appendix-typing.md` (3.6k) during classification and `appendices/create-prd-appendix-selfcheck.md` (2.1k) for the final self-check |
| Domain Provider | `references/providers/<domain>/domain-appendix.md` (HR approximately 5.6k), loaded only when the target PRD belongs to that domain |
| Context budget | Always loaded 10² / body 10³ / one chapter 10³–10⁴ / all `references/` approximately 46.8k characters; do not load everything together |

## Repository structure

```text
SKILL.md                             # Claude Code skill entry
references/chapters/                 # Chapter generation guides (13 files)
references/appendices/               # Classification and self-check guides
references/providers/hrm/domain-appendix.md
                                      # HR adaptation rules (example Provider, excluded from dist/)
scripts/build.py                     # Build universal prompt
scripts/install_skill.py             # Install as a Claude Code skill
dist/create-prd-universal-prompt.md  # Standalone complete prompt
dist/create-prd.skill                # ZIP package of the skill directory
```

## About the author

**杨堃 (pmYangKun)**, author of 《决胜B端》 (Douban 8.6, 13 reprints), is a ToB product expert and an appointed corporate MBA mentor at the University of Chinese Academy of Sciences. His clients include over a hundred companies such as Huawei, JD.com, Baidu, P&G, and ICBC.

This version extends the original open-source [`create-prd`](https://github.com/pmYangKun/create-prd-skill) skill. It retains the author’s methodology and generic ToB PRD generation while adding HR-system and module-level adaptations, cross-module data flow consistency, Domain Model references, sensitive data permissions, and specialized self-checks.

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License and derivative work

This skill is derived from [pmYangKun/create-prd-skill](https://github.com/pmYangKun/create-prd-skill) and is used and distributed under the upstream Apache License 2.0. Original author and contributor attributions are retained in [NOTICE](NOTICE); the complete terms are in [LICENSE](LICENSE). This version includes modifications by PM Agentic Cookbook contributors, identified in the modified files.

The upstream main license covers all historical main versions. This version does not incorporate upstream community branches. Copyright, contributor and methodology notices in the upstream NOTICE are preserved verbatim.
