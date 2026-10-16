---
description: Use when implementing shared UI components, business page component composition, page-level tabs, tables, cards, buttons, badges, or feedback components.
applies_to:
  - shared components
  - Button
  - Badge
  - Card
  - PageTabs
  - Table
  - feedback components
related_specs:
  - ./action_icon_spec.md
  - ./feedback_message_spec.md
  - ./list_query_spec.md
  - ./layout_interaction_spec.md
---

# Component Usage Spec

## Scope

This spec applies to the project's shared components and how business pages should use them.

## Mandatory Component Library

Business pages MUST use shared components whenever they cover the need:

- `<Button variant="primary|secondary|outline|danger|ghost">`
- `<Badge status="success|warning|error|default|processing" text="...">`
- `<Card title="..." extra="...">`
- `<PageTabs tabs={...} activeTab={...} onChange={...} ariaLabel="..." />`
- `<Table columns={...} dataSource={...}>`
- `<FeedbackMessage />`, `<AlertBanner />`, `<SuccessToast />`
- List-query primitives from the shared list-query component module, composed according to [List Query Spec](./list_query_spec.md)

## List Query Components

- `<ListQueryToolbar>` owns the neutral continuous toolbar surface, wrapping, gap, and bottom alignment.
- `<ListQueryField>` provides the standard field-title treatment for non-search controls such as dates; `<ListSearchField>` owns the search icon, concise placeholder presentation, line-break stripping, Enter submission, and 38px input geometry.
- `<ListSelectFilter>` is for a PRD-defined single-select field. `<ListMultiSelectFilter>` is the default for status dimensions and owns `全部` / `已选 N 项`, accessibility, outside-click closing, and Escape closing.
- `<ListQueryActions>` owns the right-aligned toolbar action group plus query, pending, and reset button presentation. Pass more-menu and list-level action buttons as its children so the group preserves global order and wrapping; the page still owns draft/submitted state, trimming on submit, default-query comparison, page reset, and Service invocation.
- `<ListMoreMenu>` owns the ellipsis trigger, permission-filtered item rendering supplied by the page, anchored panels, outside-click closing, and Escape closing.
- `<ColumnSettingsPopover>` receives user-visible Chinese table labels and never derives labels from DTO keys.
- Do not migrate an immediate-filter page only for visual consistency. Align its query lifecycle and documented defaults first, then replace the controls with the shared primitives.

## Button

- `primary`: page-level primary actions, for example `保存`, `提交审批`, `确认下发`.
- `secondary`: secondary active actions, for example `导出`, `版本历史`.
- `outline`: auxiliary or cancel actions, for example `取消`, `重新同步`.
- `danger`: destructive or blocking actions.
- `ghost`: low-priority actions, for example `返回工作台`.
- Disabled buttons MUST use `disabled` and inherit `disabled:opacity-50 disabled:cursor-not-allowed`.
- **Async command pending**: a button that triggers an async command MUST be `disabled` while the command is in flight and show a pending label (e.g. `处理中…`, `提交中…`) to prevent duplicate submission. The mock data layer injects a dev-only latency (0 in tests) so the pending state stays observable and testable.
- **Button Sizing & Height Consistency**: All standard page-level action buttons (including primary actions like "使用此模板下发计划任务" and flow-level back buttons like "返回") MUST use the default `<Button>` styling (`text-sm` font size, standard padding) to guarantee a consistent height (around 34px-38px depending on layout/flex contexts) and visual weight. Custom font-size overrides (e.g., `text-xs`) or height overrides are prohibited unless explicitly aligning with inline tables or forms.

## Form Field Requirements

- Create, edit, and detail surfaces for the same object MUST expose the same required / optional field semantics. Do not hide requirement markers in read-only detail mode when that mode reuses the form information architecture.
- Mark a required field with `*` immediately after its label. Use the error color while its current value is missing or invalid, and change the marker to neutral gray after the requirement is satisfied; the neutral marker still communicates that the field remains required.
- Mark a non-required business input with the neutral text `（选填）`. Do not add required / optional markers to calculated outputs, audit metadata, section headings, or other values the user cannot supply.
- Conditional requirements follow the currently selected business state. When a controlling value changes, update the marker, validation, and visible dependent field together.
- A paired start/end input that represents one effective interval MUST stay in one explicit two-column row on desktop. Wrap the pair in its own grid container so the appearance or disappearance of adjacent conditional fields cannot separate the dates or push one endpoint onto another row.

## Badge

- Object states MUST use `<Badge />`.
- `Badge` is for state only. Do not use it for long explanations, recovery guidance, or error details.
- Do not redefine badge dots, backgrounds, or status colors in business pages.

## Card

- Use Card for standalone business modules.
- Keep the default white background, `rounded-lg`, subtle shadow, and `border-gray-100`.
- Do not nest UI cards inside other cards unless there is a real repeated-item card pattern.

## Page-Level Tabs

- A page-level primary view switch MUST use the shared `<PageTabs />` component. This applies when tabs switch the main business view beneath a page title, including a main-view switch placed at the top of the page's continuous content container.
- Each tab MUST include a 16px Lucide icon and a concise text label. The shared visual contract is `gap-2`, `px-6 py-3`, `text-sm`, and `font-medium`.
- The tab list MUST use a neutral bottom divider. The active tab uses a white surface, neutral border, no bottom border, rounded top corners, and `text-primary-600`; the active surface covers the divider by 1px. Inactive tabs use transparent borders and neutral text with a light hover surface.
- Every instance MUST provide a descriptive `ariaLabel`; the shared component supplies `tablist` / `tab` roles and `aria-selected`.
- Drawer sections, workbook or detail-sheet selectors, wizard steps, and compact content-category switches have different information hierarchy and MUST NOT use `<PageTabs />`.
- Page-level tabs switch views within the same page and MUST NOT be used to switch user roles or personas.

## Table

- Main list headers use theme-green light treatment: `bg-primary-50/70`, `text-primary-800`, `border-primary-100`.
- Child tables, drawer preview tables, and inline expansion detail tables use neutral headers: `bg-gray-50`, `text-gray-500`, `border-gray-200`.
- Child tables and inline expansion detail tables (such as monthly details or assigned units) MUST use `text-[13px]` (13px) for all table headers, body cells, and inner buttons to maintain UI consistency.
- Row hover uses `hover:bg-primary-50/30`.
- Table containers must keep lightweight border, radius, and row dividers.
- **Cell padding / column spacing**: Main (non-compact) data tables MUST use `px-6 py-3` for header and body cells — `px-6` gives comfortable inter-column breathing room, `py-3` sets a consistent row height. Cells are `whitespace-nowrap` with the container `overflow-x-auto`. This applies uniformly to the shared `<Table>` component and any raw HTML main-list tables (e.g. 计划周期 / 采购品类 lists) so all main lists share one column-spacing standard. Compact, child, drawer-preview, and inline-expansion tables stay at `px-4` with `text-[13px]`.
- Operation columns MUST follow [Action Icon Spec](./action_icon_spec.md).
- **Left-side identity freeze**: Every horizontally scrollable main list MUST keep the leading identity block fixed on the left, from the first visible column through the primary name column (for example: multi-select, index, store code, store name). The primary name column is the right boundary of this block and uses an opaque surface plus a subtle right separation shadow. Pages MUST declare explicit fixed widths and cumulative left offsets for these columns; do not infer the boundary from display text. This keeps the record identity visible while users inspect fields to the right.
- **Right-side operation freeze**: When a main list has enough columns to require horizontal scrolling and row-level commands are needed to complete the primary task, the operation column MUST stay visible at the right edge. Use an opaque sticky header and body cell with `bg-clip-padding`, a body/header z-index boundary, and a subtle left separation shadow; do not let hidden columns show through the frozen action surface.
- **Column applicability**: Do not add a sequence column, checkbox column, batch-action bar, or operation column solely for visual uniformity. Analytical matrices MAY begin with their natural business dimension, append-only audit logs MAY omit selection and operation columns, and transactional lists SHOULD expose only commands supported by the owning PRD and executable permission matrix. Any exception to the common list shape must be stated in the owning PRD.

### Main List Continuous Container

- A main business list MUST place its list title, search/filter toolbar, conditional batch-action bar, table body, and pagination inside one continuous container. These elements form one query-and-operation workspace and must not be split into separate floating cards.
- The list header is the first section of that container and displays only the list title using `text-base font-bold text-gray-800`.
- The list header uses `px-6 py-4` and a neutral bottom divider. The query toolbar follows inside the same container, then the conditional batch-action bar, table body, and pagination in that order.
- Search, filter, query-action, more-menu, and column-setting behavior MUST follow [List Query Spec](./list_query_spec.md).
- The page-level create action belongs at the right end of the search/filter toolbar. Keep the list title area descriptive; do not place a duplicate primary action beside the title.
- The batch-action bar appears between the toolbar and table only after selection, following [Action Icon Spec](./action_icon_spec.md). Its appearance must not create a second nested card.
- A list-style change MUST apply to every role authorized to access that business list. Reuse the same title, query toolbar, table, pagination, and responsive structure across those roles; role permissions may narrow data scope, filter options, selection, create actions, row actions, and batch actions, but MUST NOT create a separate visual variant. Verify the complete authorized role set against the executable permission matrix when implementing the change.

### Main List PRD Synchronization Gate

- Every main business list MUST have an owning module PRD section that identifies its list title, business columns, selection and batch-operation semantics, page-level actions, permission differences, and any page-specific fixed-column or pagination exception.
- When an implementation changes PRD-owned list structure or behavior, update the owning PRD in the same logical change. This includes adding, removing, renaming, or reordering business columns; changing the identity-freeze boundary; adding or removing selection, batch actions, create actions, row actions, or role-specific variants; and changing page-specific pagination defaults.
- Shared table geometry, typography, colors, spacing, sticky-surface treatment, and continuous-container styling remain owned by this spec. Module PRDs SHOULD reference this spec and state only business-specific requirements or exceptions, avoiding a second copy of the shared style rules.
- A documentation-only style description MUST NOT override the executable component contract. Before completion, compare the implementation, owning PRD, this spec, and the complete authorized role set; report any residual mismatch instead of silently rewriting the PRD to match an implementation defect.

## Pagination

- **Page Size Limits**: All main tables and custom lists (including raw HTML table lists) MUST default to showing a maximum of 10 rows per page.
- **Empty State Behavior**: When `dataSource` is empty, a standard "暂无数据" placeholder is displayed, and the pagination footer is hidden.
- **Filter Reset Interaction**: Whenever any query filters, search inputs, or category dropdowns are changed, the current page number MUST automatically reset to Page 1.
- **Row Index Accumulation**: Row indices/numbers on paginated lists must adapt dynamically to the current page: `Index = (currentPage - 1) * pageSize + index + 1`.

## Table Cell Content

- Numbers and amounts should be formatted.
- Long text may use truncation plus tooltip.
- Business states use `Badge`.
- Business hints, errors, and recovery guidance use shared feedback components.

## Hierarchical Filters & Global Metadata Reuse

- List filters, dropdowns, and trees that select an organization MUST reuse the global org tree (the project's shared organization metadata). Do not build page-local org datasets.
- Cross-module assignment workflows MUST use the shared organization-assignment drawer for the tree, selection toolbar, affected-count feedback, and confirmation footer. Pages supply only business copy, selected IDs, and their command callback.
- A hierarchical (cascading) unit filter reveals the next level only after a parent is chosen: pick `集团总部` / a `区域` first, and the `门店` level appears only once a specific `区域` is selected. The deeper select includes a `全部下属门店` option plus the parent's own 本级.
- Role-scoped roles lock the filter to their own subtree (e.g. a `区域管理员` cannot widen past its own region), consistent with role view isolation.
- When a hierarchical tree expands parent selection into an explicit set of selected organization IDs, that ID set is the submitted business scope. Do not add a parallel `仅所选组织 / 组织及下级` selector that restates the same cascade behavior.
- When the structural root is itself an assignable operational unit, expose that unit as a standalone selectable row before the descendant tree. The root's own ID must never be selected only as a side effect of selecting every descendant.
- Before confirmation, show the resulting selected/affected organization count. Persist or submit the concrete organization IDs so later assignment, revocation, audit, and duplicate checks operate on unambiguous objects.

## Tooltip

- **Custom Tooltip Component**: All hover tips, action descriptions, and icon tooltips MUST use the shared `<Tooltip>` component instead of native browser `title` attributes.
- **Sizing & Typography**: The tooltip font size MUST be exactly `text-[13px]` (13px), which is 1 point larger than default browser tooltips (12px), enhancing readability.
- **Visual Theme & Geometry**: The tooltip MUST be rendered as a clean **rounded-rectangle** shape (without any speech bubble pointer/arrow). It displays the text content directly without any leading icons or markers. It uses a grayscale color theme: background `#f3f4f6` at 95% opacity (`bg-gray-100/95`), border color `#e5e7eb` (`border-gray-200`), font color `#4b5563` (`text-gray-600`), and a default normal font weight (`font-normal` / not bolded) to maintain a clean B2B look.
- **Hover Trigger Delay**: To prevent visual noise during quick sweeps of the mouse, the hover display transition MUST trigger exactly after **0.5 seconds** (500ms) of cursor hover.
