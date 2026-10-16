---
description: Use when designing or implementing page layout, metric bands, spacing, modal, drawer, inline expansion, back navigation, or interaction safety.
applies_to:
  - page layout
  - metric bands
  - modal
  - drawer
  - inline expansion
  - back navigation
related_specs:
  - ./component_usage_spec.md
  - ./role_navigation_spec.md
---

# Layout Interaction Spec

## Scope

This spec applies to page layout, top metric bands, spacing, Modal, Drawer, Inline Expansion, and interaction safety.

## Page Layout

- Page root should use `animate-fade-in`.
- Major modules use `space-y-6`.
- Elements inside cards use `space-y-4`.
- Standard card padding is `p-6`.
- Page title areas use `flex justify-between items-center`.
- Page titles use `text-2xl font-bold text-gray-800`.
- Multiple page-level action buttons use `flex gap-2` or `flex gap-3`.
- When the global shell and sidebar already expose the active module hierarchy, the page title area MUST NOT repeat that hierarchy as a breadcrumb. Render the object/page title and description directly; add a breadcrumb only when it provides a real in-page hierarchy or round-trip navigation path that the shell does not expose.

## Top Full-Width Metric Band

Use one full-width band for top key metrics instead of multiple separate cards.

- Layout: `flex` with `divide-x divide-gray-100`.
- Alignment: `flex-col items-center justify-center`.
- No decorative icons.
- Label: `text-sm text-gray-500 mb-2`.
- Value: `text-3xl font-bold text-gray-800`.
- The most important metric may use `text-primary-600` and `text-4xl`.

## Scoped Work Context

- A user-selectable period, cycle, organization, or similar work context MUST declare its persistence scope explicitly. When the choice is personal and organization-sensitive, persist it by `user_id + org_id`; do not turn it into an organization-wide global switch.
- On first entry, restore the saved context only when it remains accessible. Otherwise choose the documented safe default and record the fallback source.
- Switching organization MUST load the target organization's independent context. A choice made under one organization must never overwrite or leak into another organization's context.
- A mutable UI context is only an entry preference. When a downstream workflow creates a historical business object, freeze the selected context and relevant configuration IDs/versions in that object's snapshot.

## Temporal Overlap Labels

- When a list is filtered by a business period, determine inclusion by explicit interval overlap with documented inclusive/exclusive endpoints; do not approximate with the current date or matching month labels alone.
- Use distinct state labels for a record that covers the full period, overlaps only part of the period, or is currently inactive but historically overlapped the selected period.
- A missing period instance or other required temporal anchor is a blocking page state with recovery guidance. It must not be silently converted into an empty result or fallback period.

## Modal

- Modal backdrop uses `backdrop-blur-sm bg-black/50`.
- Confirmation and decision modals MUST be centered: `fixed inset-0 flex items-center justify-center`.
- Default width should use `w-[min(960px,calc(100vw-48px))]` when content is rich.
- Max height should use `max-h-[80vh]`.
- For table-heavy content, use fixed header, scrollable content, and fixed footer.
- Avoid narrow, tall table modals.

### Confirmation Dialogs

- Second confirmations for irreversible or outward-facing actions MUST use the shared `CustomModal` component. Native `window.confirm` / `window.prompt` / `window.alert` are prohibited in business pages.
- Type mapping: `danger` for destructive actions (delete, e.g. `删除计划任务`); `warning` for locking or outward-facing actions (submit to OA, release, e.g. `提交 OA 审批`, `发布执行`); `info` for neutral confirmations.
- The confirm button executes the async command; the page then follows `feedback_message_spec.md` (success feedback only after the command succeeds).
- Exemption: integration-debug-only components explicitly marked `生产隐藏` (e.g. the mock integration console) may keep native dialogs; they are outside the production surface.

## Modal Content Density

- When a Modal contains both business summary and detail table, use horizontal layout on desktop.
- Put summary, warnings, and consequences on the left.
- Put detail table or list on the right.
- Detail lists should scroll inside a bounded region instead of stretching the modal vertically.

## Drawer

- Use Drawer for create, edit, and complete object detail workflows.
- Drawer should have fixed header, scrollable body, and fixed footer.
- A full-height Drawer MUST render in the document-level overlay root (for example through a Portal), use `fixed inset-0`, and occupy the complete viewport height. Do not mount it inside a page content container whose offset, overflow, transform, or stacking context can clip the mask or shift the Drawer below the global header.
- Close action uses `X` with `text-gray-400 hover:text-gray-600`.
- Place object lifecycle or availability status beside the Drawer title when it is essential context for the whole object. Do not spend a standalone body row on the same status Badge.
- In a Drawer that presents object detail information, section headings inside the body MUST use the theme text color (`text-primary-700`) with the standard compact heading hierarchy (`text-sm font-bold`). The heading itself has no divider or bottom padding that implies separation from its own content. Apply the same heading treatment when edit mode reuses the detail information architecture.
- Treat each heading plus its fields as one detail section. Place the neutral divider after the section content (`border-b border-gray-100 pb-6`), so it separates adjacent sections rather than splitting a heading from its fields; use `last:border-b-0 last:pb-0` to omit the trailing divider after the final section.
- Create, view, and edit for the same business object SHOULD reuse one Drawer information architecture and field grouping. The operation mode changes field editability, visible commands, and validation; it must not create three unrelated layouts.
- Put commit actions such as `保存`, `确认`, `创建`, and `提交` in the fixed Drawer footer, right-aligned beside `取消` or `关闭`; the secondary action comes first and the primary action comes last. The header contains title context and the close icon, not a duplicate commit action.
- View mode is fully read-only. Create mode enables fields allowed at creation. Edit mode applies field-level locks from object state and permissions, with the disabled reason visible near the field or action.
- When a list Drawer launches another Drawer for object detail, edit, or workflow progress, use replacement navigation instead of stacking both containers. Close the list Drawer, open the target Drawer, preserve the originating list context, and refresh/reopen that list when the target closes or completes.
- A scoped work-list Drawer owns its own selection state. It MUST NOT reuse the main table's Checkbox selection or batch-action state unless the PRD explicitly defines one shared batch operation.

## Inline Expansion

- Use inline expansion for subordinate details, read-only child lists, and quick checks that should preserve table context.
- Expanded content must push following rows downward.
- Visual weight should feel like a child row, not a standalone page.
- All inline expanded child lists and compact tables MUST uniformly use a `13px` (`text-[13px]`) font size for all table headers, rows, and buttons, to maintain child-row visual weight and consistent typography.
- Use light neutral background, subtle border, compact tables, and Chinese detail wording such as `明细`.
- Avoid heavy Card headers or drawer-like `详情` semantics for inline child lists.

## Interaction Safety

- Every interactive element MUST have hover feedback.
- Disabled actions MUST use `disabled` or `aria-disabled`.
- Disabled visual style should be `text-gray-300 cursor-not-allowed` or the shared Button disabled style.
- Disabled actions should explain why via `title`, nearby `Action Feedback`, or a visible disabled reason.
- **Pre-execution conflict check**: when an action can conflict with existing data (duplicate identity, in-flight work), the conflict MUST be detected and presented BEFORE the action executes, with the user deciding (exclude conflicting items and continue / cancel). Never execute first and report the skipped part inside a success message.
- **Uniqueness is enforced at creation, not at a later workflow step**: identity constraints (e.g. one active task per cycle × unit × template) block at create time. Deferring the block to a later step (e.g. dispatch) creates undispatchable zombie drafts and moves the error far from its cause. Later steps only guard state-type conditions (e.g. archived cycle), plus a service-side backstop for race windows.

## Modal State Freshness & Container Consistency

- A user-initiated open of a create/edit modal MUST present a fresh form: no leftover field values, validation errors, conflict prompts, or pending flags from a previous session (clear drafts + force a keyed remount, or reset on open).
- Explicit round-trip flows (e.g. jumping to a template preview and back) may restore drafts, but that restore path MUST be distinguished from a user-initiated fresh open.
- The create and edit surfaces of the SAME business object MUST use the same container form (both centered modal, or both drawer). Mixing containers for one object splits the user's mental model; consistency with the object's own create surface outweighs consistency with other objects' edit surfaces.

## Navigation Context & Back Button Flow

- **Round-trip principle**: the entry point determines the return point. Any cross-page jump MUST land the user back where they came from, keeping the journey continuous — back from a detail returns to the originating list/tab/scroll context, not a generic default page. When building or changing a navigation link, verify the whole round trip (enter → act → back) end to end. No dead ends, no silent redirects to an unrelated page.
- When jumping from a source workflow page (e.g., a creation modal/drawer) to a secondary detail or preview page, the application MUST preserve the source state (e.g., form input drafts) to prevent interrupting the user's journey.
- The secondary page's original default back button (e.g., top-left title back arrow) MUST remain unchanged and point to its standard default page.
- For users accessing the page mid-workflow, a separate, highly visible "Back" button MUST be provided.
- This mid-workflow back button MUST be positioned in its own row directly above the page title block (aligned to the left). Its layout container should ensure the vertical position of the button is stable.
- The font size and height of this flow-level back button MUST remain consistent with the primary action buttons (such as the template dispatch button) on the right side of the page.
- Globally, all flow-level back buttons of this style MUST maintain consistent UI rules (inheriting the standard `<Button>` component properties with `text-sm` size and default padding).
- Hovering over this button MUST display a custom tooltip with the text "返回原流程" (using the unified `<Tooltip content="返回原流程">` component wrapper with a 0.5s hover delay).
- Clicking this button MUST return the user to their original flow, automatically reopening any previously open modals/drawers and restoring draft inputs.
- Hardcoding static back redirects for mid-workflow buttons is prohibited; they MUST dynamically inspect entry-point context (e.g., `localStorage` entry target).
