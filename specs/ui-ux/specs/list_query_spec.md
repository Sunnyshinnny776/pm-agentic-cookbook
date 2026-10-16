---
description: Use when designing or implementing main-list search bars, filters, query submission, reset behavior, conditional filters, more menus, or column settings.
applies_to:
  - list search
  - list filters
  - query toolbar
  - submitted query
  - conditional filters
  - more actions
  - column settings
related_specs:
  - ./component_usage_spec.md
  - ./action_icon_spec.md
  - ./ux_writing_semantic_spec.md
---

# List Query Spec

## Scope

This spec governs the search and filter workspace of a main business list. Module PRDs own the concrete searchable fields, status values, permissions, and exceptional defaults.

## PRD Synchronization Gate

- Every main-list query toolbar MUST have an owning module PRD definition for its searchable fields, filter inventory, user-visible labels, option values, initial/reset defaults, conditional dependencies, and permission-based presence.
- A change to any PRD-owned query behavior MUST update the owning PRD in the same logical change as the implementation. This includes adding, removing, renaming, reordering, or changing the default or submission behavior of a search field or filter.
- Shared geometry, visual tokens, accessibility behavior, and interaction mechanics remain owned by this spec. Module PRDs SHOULD reference this spec and record only business-specific values, permissions, exceptions, and acceptance requirements; do not duplicate the full shared style contract in every PRD.
- Before completing a query-toolbar change, compare implementation, owning PRD, and this spec across every authorized role variant. An implementation-only visual migration is incomplete when the owning PRD still states contradictory query behavior.

## Workspace Structure

- The list title, contextual alert, query toolbar, conditional batch-action bar, table, and pagination form one continuous workspace.
- The query toolbar uses `flex flex-wrap items-end gap-3`, a restrained neutral surface, `rounded-lg`, and `p-4` spacing.
- Search inputs, selectors, query actions, reset actions, and the more button share a 38px control height and align to the bottom edge.
- The complete toolbar action group is the final flex item and uses `ml-auto` with right justification. It stays aligned to the list's right edge whether it remains on the filter row or wraps onto a new row.
- Every search or filter control displays a short title above it using `text-xs text-gray-500`.

## Query Lifecycle

- A list with explicit query actions MUST keep separate draft and submitted query states.
- Editing a search or filter control updates only the draft query and MUST NOT request data immediately.
- Clicking `查询` or pressing Enter in the search input submits the complete draft query once and returns the list to page 1.
- While a query is pending, query controls are disabled and the action label changes to `查询中…`.
- `重置` restores the documented default query, immediately requests page 1, and is disabled when the draft already equals the default query.
- Export, task creation, and other downstream operations that depend on the current result set MUST freeze the submitted query rather than an unsubmitted draft.

## Search Field

- The field title is `搜索`.
- A free-text search field is optional. Render it only when the owning PRD identifies meaningful searchable business columns; a stable analytical matrix MAY use structured dimensions only and still follows the same submit/reset lifecycle.
- The placeholder lists searchable conditions only, separated by ` / `, for example `门店名称 / 门店编号 / 所属区域`. Do not add explanatory prefixes such as `请输入`, `支持搜索`, or `可搜索`.
- Placeholder conditions SHOULD reuse the complete Chinese titles of their corresponding list columns and follow the columns' left-to-right order. Do not replace a precise title with a broader alias (for example, use `计划周期编码 / 计划年度` when those are the searchable columns).
- The module PRD declares the searchable conditions and any length or exact-match rules.
- Search input strips line breaks, trims leading and trailing whitespace on submit, and exposes a concise Chinese accessible name.

## Status Filter Completeness

- Every status field displayed as a column in a main list MUST have a same-named status filter in the query toolbar by default.
- The filter title MUST exactly match the corresponding table-column title. Do not shorten, alias, or expose an internal field name in one location (for example, use `付款状态` consistently in both places).
- Status filters use multi-select controls unless the module PRD explicitly requires single selection.
- The initial and reset value is `全部`, represented by an empty selected-value collection and interpreted as no restriction on that status dimension.
- Partial selection displays `已选 N 项`; option labels use Chinese business names while internal enum values remain in the query model.
- If a status column is removed by permission and its existence is sensitive, its corresponding filter MUST also be absent.

## Conditional and Cascading Filters

- A module MAY declare a dependent filter that appears only when a parent condition or option is selected.
- The dependency must be explicit in the module query definition; shared UI components do not infer business relationships from labels or enum values.
- Hiding a dependent filter clears its draft value so an invisible condition cannot continue affecting the query.
- Parent and dependent values are submitted together and validated as one query contract.
- A module that needs only the parent status match MUST NOT reveal additional parameter inputs (for example, selecting a `部分到货` status may filter that status directly without requesting a quantity range).

## Multi-View Applicability

- Tabs on the same page MAY use different query inventories when they represent different business objects or list shapes. The owning PRD defines each tab's searchable columns, filters, defaults, and permissions separately.
- Shared visual consistency does not require every tab to render a free-text search, the same filters, or the same row actions. Apply only controls that produce a meaningful predicate or command for that list.
- A control hidden because the active view does not own that predicate MUST NOT affect the active result set. Pages may preserve submitted values for return navigation, but each view applies only its own visible query contract.
- Common filters shared by multiple views MAY retain their last submitted values across tab switches when their labels, option semantics, and data scope are identical.

## Query Actions and More Menu

- `查询` is the primary action and `重置` is an outline action.
- Toolbar actions use one right-aligned group in this order: `查询`, `重置`, then auxiliary or list-level actions. Do not place a separate action outside this group or give each action its own auto margin.
- Keep the action group on one line as a non-shrinking unit. When the remaining toolbar width is insufficient, move the complete group to the next flex row and keep it right-justified; do not split query and list actions across different alignments.
- Low-frequency or auxiliary actions follow `重置` inside a square ellipsis button using the same 38px height.
- Do not render the ellipsis button when the current user has no available auxiliary action; an empty more menu is not a valid toolbar state.
- The more menu is right-aligned to its trigger and closes after selection, on outside click, or on Escape.
- Menu actions are physically filtered by permission and use a 16px icon plus a stable Chinese action name.
- The same business action uses the same visible name in the toolbar, more menu, dialog title, and feedback copy.

## Column Settings

- Column settings render the same Chinese labels as the table headers. Internal DTO keys, database fields, and enum codes MUST NOT appear in the user interface.
- Required identity, state, and operation columns may be locked and shown as disabled checked options.
- Sensitive columns and their settings options are absent when the user lacks the required field permission.
- Page size and visible-column preferences may be persisted per user and per list; the module supplies the preference key and allowed columns.

## Selection Coupling

- Any search or filter change clears row selection before another batch action can be invoked.
- Switching role, data scope, or primary page tab also clears selection.
- Export scope is independent of row selection unless a module PRD explicitly defines selection-based export.
- Checkbox and batch-action behavior follows [Action Icon Spec](./action_icon_spec.md).

## Shared Component Boundary

- Prefer composable primitives such as `ListQueryToolbar`, `ListQueryField`, `ListSearchField`, `ListSelectFilter`, `ListMultiSelectFilter`, `ListQueryActions`, `ListMoreMenu`, and `ColumnSettingsPopover` over a single schema-heavy business component.
- Shared components own layout, accessibility, opening and closing behavior, and visual states.
- Business pages own filter inventory, enum options, permissions, conditional dependencies, default query values, and Service request contracts.
- Migrate existing pages by query lifecycle. Pages that already use explicit query submission may adopt these primitives directly; pages that currently filter immediately require their draft/submitted behavior and documented defaults to be aligned before migration.
