---
authority: zh
translation_of: README.md
source_version: 12f682063b8f204ef01db19e724f8b64f82d40ae
---

<!-- Derived from pmYangKun/check-prd-skill; modified by PM Agentic Cookbook contributors. SPDX-License-Identifier: Apache-2.0. See LICENSE and NOTICE. -->

This is an English translation of [README.md](README.md); the Chinese original is authoritative.

# check-prd — ToB PRD Quality Review

> **Have AI review your PRD with established industry methods.**

Many people write PRDs; fewer can review them systematically. A review requires judgment across business understanding, product architecture, data modeling, interaction design, and business analysis—capabilities that typically take over a decade of practice to develop.

check-prd turns that review capability into a tool. Based on the 《决胜B端》 methodology, it checks **14 dimensions**, identifies omissions, contradictions, and risks, and gives concrete improvements.

For HR systems, it also checks organizational data permissions, employee/employment/salary-profile entity granularity, payroll months/attendance cycles/tax periods, salary and personal income tax sensitivity, state locking, batch import synchronization, cross-module data flows, idempotency, and audit traceability. It applies to HR SaaS, in-house HRM, private deployments, and customization projects.

## Why this framework is effective

The checklist draws on two established methodology books:

- **《决胜B端（第二版）》** — rated 8.6 on Douban and reprinted 13 times; a reference for ToB practitioners covering business research, positioning, architecture, data modeling, process design, and requirements management.
- **《决胜体验设计》** — a systematic ToB experience design framework spanning interaction principles, user journeys, and AI interaction patterns.

These methods have been used in training and consulting for over a hundred companies, including Huawei, JD.com, P&G, and ICBC. check-prd **puts those methods to work in AI document review**.

## 14 review dimensions

| # | Dimension | What it checks |
| --- | --- | --- |
| 1 | Business research | Clear context, complete stakeholder identification, sufficient process analysis |
| 2 | Product classification | Correct product type and explicit commercial nature |
| 3 | Product positioning | Clear value proposition, focused target customers, credible differentiation |
| 4 | Scenario analysis | Core scenarios, complete journeys, identified pain points |
| 5 | Document structure | Complete PRD structure and coherent chapters |
| 6 | Product architecture | Sound application architecture, clear modules and system boundaries |
| 7 | Data model | Complete ER model, correct relationships, defined key fields |
| 8 | Process design | Complete processes, state machine coverage, exception paths |
| 9 | Interaction experience | Sound page design, efficient operations, adequate feedback |
| 10 | Business analysis | Viable revenue model, ROI estimates, sound market positioning |
| 11 | MVP strategy | Appropriate MVP scope and explicit validation hypotheses |
| 12 | Exception handling | Boundary conditions, error handling, fallback design |
| 13 | AI features | Sound AI design and clear human-AI boundaries, when AI features exist |
| 14 | Operations plan | Launch plan, monitoring metrics, iteration strategy |

Each dimension produces its own conclusion, followed by a consolidated P0–P3 issue list and Top 10 improvements.

### Review by product type

In-house ToB systems prioritize process efficiency and internal collaboration; commercial software prioritizes market positioning and revenue. A single standard risks missing issues or misclassifying them.

Before reviewing, check-prd performs **product classification** (commercial vs. in-house × business/tool/transaction/infrastructure type × domain × document granularity), then adjusts each dimension’s focus and applicability:

- **Commercial products**: emphasize business analysis, competitive positioning, MVP strategy, and pricing.
- **In-house systems**: emphasize process coverage, permissions, data integration, and exceptions.
- **Overview PRDs**: emphasize positioning, PRD package decomposition, information architecture, cross-module boundaries, global state/permission/security/exception baselines, and constraints for later Sub PRDs.
- **HR systems**: emphasize organizational permissions, sensitive data, entity granularity, period semantics, state locking, import synchronization, cross-module flows, and traceability.
- **Module-level PRDs**: emphasize module boundaries, Domain Model consistency, entity reads/writes, interactions, exceptions, permissions, and acceptance criteria.
- Mark inapplicable dimensions as skipped; do not impose commercial standards on in-house systems.

## Quick start

### Option 1: Any LLM, without installing tools

1. Download [`dist/check-prd-universal-prompt.md`](dist/check-prd-universal-prompt.md).
2. Open your preferred LLM (ChatGPT, Gemini, DeepSeek, Kimi, Qwen, etc.).
3. Upload or paste your PRD first.
4. Paste `check-prd-universal-prompt.md` and send.
5. For domain-specific review, name the domain and also paste its Provider files from `references/providers/<domain>/`. The universal prompt contains no domain Provider.

> Use a capable model, such as GPT-4o, Claude, Gemini Pro, or DeepSeek-R1, for stronger review results.

### Option 2: Claude Code integration

```bash
git clone https://github.com/Sunnyshinnny776/pm-agentic-cookbook.git
cd pm-agentic-cookbook/skills/check-prd
bash scripts/install.sh          # Mac/Linux
# .\scripts\install.ps1          # Windows PowerShell
```

After installation:

```text
/check-prd path/to/prd.pdf
```

Or trigger it with natural language:

- “Help me review this ToB PRD.”
- “What gaps remain in this requirements document?”
- “Review this SaaS product proposal.”

## Close the loop with create-prd

| Step | Tool | Purpose |
| --- | --- | --- |
| Create | [create-prd](../create-prd/README.en.md) | Generate a structured 14-chapter PRD draft from business context |
| Review | **check-prd** | Check 14 dimensions and produce issues and improvements |

Create, check, and iterate.

## Community contribution

[@Scofy0123](https://github.com/Scofy0123) extended the standard version with a **Feishu CLI collaboration edition**, integrating PRD review into Feishu document collaboration with comment writeback and feedback collection.

See the branch: [check-prd-skill Feishu CLI edition](https://github.com/pmYangKun/check-prd-skill/tree/check-prd-skill飞书CLI协作版(Special-tks-to-Scofy)).

## Model Experience

Character counts use Unicode code points. Body counts exclude frontmatter; all references include Providers and universal prompt introductions. Character counts are not token counts.

| Item | Content |
| --- | --- |
| Always loaded | `name` + `description`, **431 characters**. A common catalog description limit is 500; truncation removes the **tail**, where trigger phrases sit. Measure before editing and leave margin |
| On-demand loading | `SKILL.md` body, approximately 7.0k characters |
| Secondary loading | **Read by dimension, never together**: 14 files in `references/dimensions/`, approximately 61.0k characters total; read file N only when reviewing dimension N (3.0k–7.1k each). Read `appendices/check-prd-appendix-veto.md` (4.4k) when consolidating major risks, except its issue-priority definitions and common-issue table, which are read before the first dimension; read `appendices/check-prd-appendix-guide.md` (5.8k) when writing the final report, except section 2.1 (adjusting focus by PRD type), which is read before the first dimension. Load `references/audit-lifecycle.md` (1.4k) for every audit; it defines the scope of three audit actions and required report metadata |
| Domain Provider | `references/providers/<domain>/domain-appendix.md` (HR approximately 10.6k), loaded only when the caller explicitly names the domain; a PRD merely appearing to belong to that domain does not count. The Provider defines domain risks and dimension mappings; the body does not duplicate them |
| Context budget | Always loaded 10² / body 10³ / one dimension 10³–10⁴ / all `references/` approximately 86.2k characters; **never load everything at once** |

## Repository structure

```text
SKILL.md                             # Claude Code skill entry
references/dimensions/               # Sources for 14 dimensions
references/appendices/               # Risk checklist and report template
references/providers/hrm/domain-appendix.md
                                      # HR review rules (example Provider, excluded from dist/)
dist/check-prd-universal-prompt.md   # Universal prompt, ready to use
scripts/
  install.sh / install.ps1           # Mac/Linux and Windows installers
  install_skill.py                   # Installer core
  build.py                           # Rebuild universal prompt
  validate.py                        # Validate structure and generated artifacts
evals/                               # Eval seeds
```

## About the author

**杨堃 (pmYangKun)**, author of 《决胜B端》 (Douban 8.6, 13 reprints), is a ToB product expert and an appointed corporate MBA mentor at the University of Chinese Academy of Sciences. His clients include over a hundred companies such as Huawei, JD.com, Baidu, P&G, and ICBC.

This version extends the original open-source [`check-prd`](https://github.com/pmYangKun/check-prd-skill) skill. It retains the author’s methodology and 14-dimension review framework while adding adaptations for Overview PRDs, HR systems, module-level PRDs, Domain Model consistency, cross-module data flows, sensitive data permissions, import synchronization idempotency, and specialized risks.

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License and derivative work

This skill is derived from [pmYangKun/check-prd-skill](https://github.com/pmYangKun/check-prd-skill) and is used and distributed under the upstream Apache License 2.0. Original author and contributor attributions are retained in [NOTICE](NOTICE); the complete terms are in [LICENSE](LICENSE). This version includes modifications by PM Agentic Cookbook contributors, identified in the modified files.

The upstream main license covers all historical main versions. This version does not incorporate upstream community branches. Copyright, contributor and methodology notices in the upstream NOTICE are preserved verbatim.
