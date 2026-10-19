---
description: Use when writing Chinese UI copy, business labels, button display names, hints, recovery guidance, terminology, or export-compatible semantic classes.
applies_to:
  - UI copy
  - Chinese labels
  - button names
  - error recovery guidance
  - terminology
  - semantic classes
related_specs:
  - ./action_icon_spec.md
  - ./feedback_message_spec.md
---

# UX Writing & Semantic Spec

## Scope

This spec applies to page copy, button display names, hints, error recovery guidance, business terminology translation, and export-compatible semantic classes.

## Language Rule

- User-facing page copy, labels, button names, status names, and business examples MUST use Chinese.
- Rule structure, implementation guidance, action keys, code identifiers, and spec headings SHOULD use English.
- When a rule maps to code, use a stable English key plus a Chinese display name, for example `submit` -> `提交审批`.

## UX Writing Rules

- Write from the business user's perspective.
- Assume users understand their work, not product architecture or technical implementation.
- Do not expose technical or product implementation terms such as `mapping`, `1:1`, `locked relationship`, `entity`, `async`, or `idempotency` unless business users naturally use them.
- PRD and engineering docs may use precise domain models; UI copy should translate them into business actions, consequences, and next steps.
- Validation and error copy should explain what happened, why it matters, and how the user can recover.

## Context-Aware Object Naming

- When the page context already identifies a single ownership or organization level, list titles use the concise business-object name and omit a redundant level prefix.
- Keep level qualifiers when multiple ownership levels appear side by side, when a higher-level user must distinguish object types, or when removing the qualifier would make the object ambiguous.
- Apply the same scope decision consistently to the owning PRD and the main list title; local Drawer or action copy MAY retain a qualifier when it clarifies the target of a cross-level operation.

## Domain Term Productization

- Every domain-model entity that surfaces in the UI MUST have a productized display name; raw domain/technical nouns such as "batch", "instance", or "snapshot" MUST NOT appear in page copy (e.g. entity `SettlementRun` / DM term `结算批次` renders as `结算流程`; `SettlementPayeeSnapshot` renders as `结算供应商名单`).
- Internal names stay stable: Domain Model entity names, code identifiers, and DB field names do NOT change when the display name is productized. Register the display-name ↔ internal-name pairing in the owning PRD's terminology section so the mapping is traceable.
- Derived copy follows the display name consistently: list titles, status text, toasts, and empty states all use the productized term (e.g. `流程编号` not `批次号`, `本期暂无结算流程` not `本期暂无结算批次`).

## Business Impact First

- Prefer business impact over implementation detail.
- Recommended UI copy: `门店会按 1 月到 12 月填写采购计划，启用后不能再调整月份安排。`
- Avoid UI copy like: `计划月度与系统结算月默认 1:1 映射并锁定。`

## Action Naming

- Action button names MUST follow [Action Icon Spec](./action_icon_spec.md).
- Table operation names should be short and stable.
- State copy and action copy are separate. Example: action `驳回`, state `已驳回`.

## Business Status Naming

- Status names MUST describe the current business phase or durable result. Use `待…` for queued or not-yet-submitted work, `…中` only for an ongoing process, and `已…` for completed or terminal results.
- Do not mechanically add `中` or `已` to every noun. Choose the established business term that lets users identify what can happen next, for example `待提交`、`区域审核中`、`OA 提交中`、`OA 审批中`、`待发布`、`执行中`、`已关闭`、`已归档`、`已作废`.
- Approval actions and outcomes are transition events unless the business must query them as a durable phase. For example, `审核通过`、`审批通过` and `驳回` move a document to its next durable status; they do not automatically become standalone statuses.
- Use a durable business status when an integration phase owns locks, compensation actions, or SLA tracking after an upstream business transition. Example: after regional review, a plan task whose OA package is still being prepared, pushed or waiting for a retry shows `OA 提交中`; it must not be represented as `待提交` plus a temporary tag.
- Technical delivery tags may supplement a durable business status with details such as `系统重试中` or `提交失败`; tags must not replace the owning business status.

## Semantic Compatibility

- Preserve class names required by export and design restoration pipelines.
- Do not remove or rename these semantic classes unless the export chain is updated:
  - `sidebar-container`
  - `data-table-row`
  - `status-badge-*`
- B2B scrollbar styling follows the project's global stylesheet; do not redefine it in business pages.

## Decoupled Flow Status Caliber

- When two business flows are decoupled in the PRD (e.g. `门店计划任务` vs `区域计划汇总`), each flow's list MUST show only **that flow's** caliber status. The `计划汇总` list shows aggregation-flow status (`待汇总` / `已纳入汇总` / `已报集团审批` / `集团审批通过` / `集团已驳回` / `已发布执行`), not the `计划任务` compilation status (`待编制` / `编制中` / `区域审批中` …).
- Cross-flow drill-down uses an explicit entry button (e.g. `前往计划任务列表`), never by embedding the other flow's per-row status or detail link into this flow's list.
- The concrete per-flow status machine and its caliber are owned by the module PRD; this rule governs the UI principle of not mixing two decoupled flows' statuses in one list.

## Number & Percentage Formatting

- **Single Decimal Rule**: All percentage inputs and displays MUST be formatted to show exactly one decimal place (e.g., `10.0%`, `0.5%`).
- **Placeholder Rule**: Percentage input placeholders MUST be unified as `0.0`.
- **Suffix Placement**: The percentage unit symbol (`%`) MUST be placed immediately to the right of the input field rather than in the field label header. Input box width should be shortened accordingly (e.g. `w-32` or `max-w-[120px]`) to keep the layout compact and clear.
- **Validation Consistency**: All ratio and percentage inputs must validate for positive numbers (greater than `0.0` or as per business rules) and show warning tooltips inline.

## Date & Month Formatting

- **Chinese Date Formatting**: YYYY年MM月DD日 (e.g., `2025年01月24日`).
- **Standard Date Formatting**: YYYY-MM-DD (e.g., `2025-01-24`).
- **Period / Month Formatting**: In tabular displays, data grids, and data-oriented month representations (e.g. monthly cycle details, preview tables), months MUST be displayed using standard code format: `M01`, `M02`, ..., `M12`. Natural monthly descriptions in page text copy (e.g., "1月 - 12月" or "1月到12月") should remain as descriptive Chinese.

## Plan Cycle & Year Naming

- **Plan Cycle (计划周期)**: Must be formatted using the cycle code prefix `CYC-` followed by the four-digit year (e.g., `CYC-2027`). This represents the time/calendar container.
- **Plan Year (计划年度)**: Must be displayed as the four-digit numeric year (e.g., `2027` or `2027 年度`).
- **Separation of Concerns**: Do not mix plan cycles and plan years. Dropdown filters and headers referencing the cycle container must use the `CYC-YYYY` cycle code, while purely referencing the fiscal target year uses `YYYY`.

## Pagination Formatting & Copywriting

- **Text Copy & Layout**:
  - The pagination text layout MUST display total count and total pages on the left: `共计 {total} 条数据，共 {totalPages} 页` (with counts highlighted or formatted appropriately).
  - The page navigation is displayed on the right, formatted as: `第 [ChevronLeft icon] 1 2 3 [ChevronRight icon] 页` (ellipses `...` are shown for compressed lists where pages > 7).
- **Button Icons & Style**:
  - The "Previous Page" and "Next Page" buttons are icon-only using standard Lucide-react `ChevronLeft` and `ChevronRight` (size 14), wrapped in a standard `w-6 h-6` (24px) bordered button (with background `#ffffff`, border `#e5e7eb` (`border-gray-200`), rounded, and smooth transitions on hover/focus).
  - **Tooltips**: The icon-only buttons MUST show `上一页` and `下一页` through the shared `<Tooltip>` and expose the same text as the button's accessible name (for example `aria-label`); do not use native `title` attributes.
