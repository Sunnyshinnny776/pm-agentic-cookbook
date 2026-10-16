---
description: Use when designing or implementing action buttons, table operation columns, icon actions, action names, or approval-related action visibility.
applies_to:
  - table actions
  - action buttons
  - operation columns
  - icon dictionary
  - approval actions
related_specs:
  - ../../integration/external_integration_spec.md
  - ../../integration/oa_integration_spec.md
---

# Action Icon Spec

## Scope

This spec applies to table operation columns, page-level action buttons, Drawer/Modal action areas, and business object detail action areas.

## Core Rules

- Table operation columns MUST use `icon + Chinese action name`.
- Table operation columns MUST NOT use icon-only buttons or text-only buttons.
- Regular table actions use lightweight text-button styling, not solid `<Button>` components.
- Table action labels MUST use normal table text weight; do not use `font-medium` or bold emphasis in operation columns.
- Multiple actions in one operation column SHOULD use `gap-3` spacing to avoid cramped icon-label groups.
- Default icon size is `14`.
- Compact detail drawer actions may use icon size `12`.
- Page-level Button icons may use icon size `16`.
- Action name and icon MUST come from the global action dictionary.
- Add a new action to this spec before using it in code.
- Action color expresses risk and state transition only; it must not express business category.

## List Action Button Style

```tsx
inline-flex items-center gap-1 text-sm hover:underline disabled:text-gray-300 disabled:cursor-not-allowed
```

```tsx
flex items-center gap-3
```

## Batch (Multi-Select) Operations

- Any list that supports batch operations MUST add a multi-select checkbox as the **first column** of the list (before `序号`), with a header select-all checkbox that shows an indeterminate state when only some rows are selected.
- Selecting one or more rows reveals a batch action bar directly above the table (selected count + batch action buttons + a 取消选择 escape). The bar appears only while a selection exists.
- The batch action buttons ARE the row operation-column buttons "lifted up" above the multi-select: same `icon + 中文动作名`, same font size and tone as the operation column (reuse the shared `ActionButton`), with a border added (`border border-gray-200 rounded-md` + light hover) so they read as standalone buttons. Action names DROP any `批量` prefix — use the plain global-dictionary name (`下发`, `催办`, `归档`, `删除`), identical to the row action.
- Each batch action applies to the **eligible subset** of the selection, gated by per-row status exactly like its single-row equivalent (e.g. `下发` acts only on `待下发` rows). The button disables when no selected row is eligible; on completion a feedback toast reports the affected count.
- Batch actions are role-gated identically to their single-row equivalents; a role that cannot perform the single action sees neither the checkbox column nor the bar.
- Selection MUST clear when any filter changes, so a batch action never acts on rows hidden by the current filter.

## Color Semantics

| Tone | Class | Usage |
| --- | --- | --- |
| `primary` | `text-primary-600 hover:text-primary-700` | Common primary operations: `详情`, `编辑`, `配置`, `提交审批`, `下载`, `上传` |
| `success` | `text-green-600 hover:text-green-700` | Positive state transitions: `启用`, `同意`, `发布执行` |
| `warning` | `text-orange-600 hover:text-orange-700` | Impactful but non-destructive operations: `停用`, `解锁`, `调整`, `更正` |
| `danger` | `text-red-600 hover:text-red-700` | Destructive, rejection, or exception operations: `删除`, `驳回`, `异常报告` |
| `neutral` | `text-gray-500 hover:text-primary-600` | Secondary operations: `历史`, `复制`, `忽略`, `归档`, `重置`, `重试` |
| `disabled` | `text-gray-300 cursor-not-allowed` | Unavailable actions |

## Global Action Dictionary

| Action Key | Chinese Name | Icon | Tone | Usage |
| --- | --- | --- | --- | --- |
| `detail` | 详情 | `Eye` | `primary` | View detail, record, or drill-down entry |
| `preview` | 预览 | `Eye` | `primary` | Preview template, approval package, or export content |
| `edit` | 编辑 | `Edit2` | `primary` | Edit configuration, archive, or account |
| `configure` | 配置 | `Settings` | `primary` | Configure rules, permissions, or cost center mappings |
| `assign` | 指派 | `Network` | `primary` | Assign stores, organizations, or users |
| `enable` | 启用 | `CheckCircle` | `success` | Enable cycle, configuration item, or category |
| `disable` | 停用 | `Power` | `warning` | Disable category or configuration item |
| `archive` | 归档 | `Archive` | `neutral` | Archive cycle or finalized historical object |
| `delete` | 删除 | `Trash2` | `danger` | Delete data that is not referenced and can be safely removed |
| `download` | 下载 | `Download` | `primary` | Download template, file, or TXT |
| `upload` | 上传 | `Upload` | `primary` | Upload file or filled plan sheet |
| `submit` | 提交审批 | `Send` | `primary` | Submit a business object or approval package to approval flow |
| `distribute` | 下发 | `Send` | `primary` | Distribute plan task or redispatch plan assignment |
| `approve` | 同意 | `CheckCircle` | `success` | System-owned internal approval action; hide when the approval node is owned by an external OA system |
| `reject` | 驳回 | `XCircle` | `danger` | System-owned internal rejection action |
| `remind` | 催办 | `Send` | `primary` | Remind subordinate units or users to submit |
| `history` | 历史 | `History` | `neutral` | Version history, submission history, approval history |
| `copy` | 复制 | `Copy` | `neutral` | Copy category, template, or configuration |
| `process` | 处理 | `ArrowRight` | `primary` | Process todo item or enter next workflow step |
| `join` | 加入 | `Plus` | `primary` | Join a settlement run or batch |
| `ignore` | 忽略 | `X` | `neutral` | Ignore pending item or temporarily skip |
| `reset` | 重置 | `RotateCcw` | `neutral` | Reset filter or restore default values |
| `refresh` | 刷新 | `RefreshCw` | `neutral` | Refresh data or recalculate |
| `retry` | 重试 | `RefreshCw` | `neutral` | Retry OA interface call or failed upload |
| `parseDetail` | 解析详情 | `FileText` | `primary` | View upload parsing report |
| `errorReport` | 异常报告 | `Download` | `danger` | Download exception detail report or parse failure report |
| `ledger` | 台账 | `BookOpen` | `primary` | View purchase ledger dashboard or ledger transactions |
| `manualEntry` | 手工录入 | `Edit2` | `primary` | Enter discrete purchase records in the plan execution dashboard |
| `unlock` | 解锁 | `Unlock` | `warning` | Unlock approved version for plan adjustment |
| `execute` | 发布执行 | `PlayCircle` | `success` | Publish approved plan as execution baseline |
| `adjust` | 调整 | `RefreshCw` | `warning` | Start plan adjustment or create adjustment version |
| `correct` | 更正 | `RotateCcw` | `warning` | Red-letter correction or correction record |
| `notify` | 通知 | `Bell` | `primary` | Send system notification or escalation notice |
| `progress` | 进度 | `Clock` | `neutral` | View generation progress or task completion progress |
| `voucher` | 凭证 | `Paperclip` | `neutral` | Upload or view voucher attachment |

## Naming Convergence

| Mixed Names | Standard Chinese Name |
| --- | --- |
| 查看 / 查看详情 / 查看月度明细 | 详情 |
| 修改 | 编辑 |
| 配置规则 / 配置权限 / 配置成本中心 | 配置 |
| 版本历史 / 提交历史 / 审批历史 | 历史 |
| 下载TXT / 下载模板 / 下载模版文件 | 下载 |
| 上传填报文件 / 导入文件 | 上传 |
| 提交 / 提交到 OA | 提交审批 |
| 审批驳回状态 | 已驳回 |

## Flow State Action Completeness

This rule governs flow advancement only. It is decoupled from mock OA scaffolding: a "simulate OA" approval entry exists only because a prototype cannot reach a real OA, and is NOT a spec-level action.

- Every non-terminal status that the business system is responsible for advancing MUST expose at least one status-gated forward (state-advancing) action in the primary list's row action column. A status the business system owns but leaves with no reachable forward action is a dead-end defect.
- Forward actions live on the primary list row, not only inside a detail or panel view, so an operator can advance the flow from the list without hunting.
- This covers system-owned transitions only. A status pending on an external OA decision advances through the OA callback; the business system exposes `submit`, `detail`, or `history` per the rules below, never a system-rendered approve/reject for an OA-owned node.

## Approval and OA Action Rules

This section records only cross-module action rules for OA approval integration. Approval node design, interface payload schemas, callback fields, retry policies, timeout escalation, and business status machines belong in the relevant module PRD or [Integration Specs](../../integration/README.md).

- When an approval node is owned by OA, business-system pages use `submit` to send the approval package and use `detail`, `history`, `download`, `progress`, `retry`, or `notify` to expose traceable follow-up actions.
- Business-system pages MUST NOT render `approve` or `reject` for an OA-owned approval node. Approval decision actions are completed in OA.
- OA approval pages SHOULD rely on OA-readable summaries and attachments from the business system. Do not add system-specific action buttons such as open-in-system buttons or detail deep links into the business system unless the integration spec explicitly defines them.
- The business system may show OA callback results, approval history, and status fields, but the visible action names still come from the global action dictionary.
- `approve` and `reject` are reserved for system-owned internal approval nodes, such as an internal-only review step where the decision is completed inside the business system.
- Rejection status uses `已驳回` in business-system status copy. Do not mix it with action names such as `驳回`.
- A mock / simulated external-system console (e.g. a 模拟 OA 审批回调 panel that only exists because the prototype cannot reach a real external system) MUST be gated to the role that **owns that external system**. Other roles opening the same package see it read-only and never the callback console — owning a data-scope view of a package does not grant operating its external-system callback.

## Implementation Guidance

- Prefer a shared `ActionButton` / `TableActions` component.
- Business pages should not scatter repeated implementations such as `Eye size={14}` plus `text-primary-600`.
- New actions must be added to this dictionary before component mapping and page usage.
