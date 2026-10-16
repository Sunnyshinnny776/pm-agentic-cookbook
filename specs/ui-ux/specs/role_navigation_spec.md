---
description: Use when implementing role-based navigation, Mock RBAC, role switching, sidebar menu visibility, or role-isolated pages.
applies_to:
  - role navigation
  - Mock RBAC
  - role switching
  - sidebar menu
  - role isolation
  - data scope vs function permission
  - cross-org edit boundary
related_specs:
  - ./layout_interaction_spec.md
  - ../../integration/external_integration_spec.md
  - ../../integration/oa_integration_spec.md
---

# Role Navigation Spec

> **Authority**: role definitions, the permission-point catalogue, the permission table format
> and the global RBAC rules live in one place only — the project's system-level role and
> permission registry. Read it before any role or permission work. This spec governs how roles manifest in **navigation
> and page isolation**; it never restates who holds which permission.
>
> Rules that belong to the registry, not here: the two orthogonal axes (function vs data
> permission), the role roster and their scope tiers, upward visibility (record scope inherits,
> sensitive fields need a separate grant), posts carrying grants but never permissions,
> suggestion-before-grant, the self-operation limit, and the three-state cell notation.

## Scope

This spec applies to Mock RBAC, role-based page isolation, menu visibility, and navigation behavior after switching roles.

## Navigation Input Contract

| Question | Contract |
| --- | --- |
| Who is the subject? | An effective `User`, whose roles resolve through grants derived from assigned positions and manual grants, each carrying its own origin and org anchor |
| Where do menus come from? | Function-tree page nodes the user's effective permissions hit, with directories pruned bottom-up when they have no visible descendant |
| What is the predicate? | `can(user, code)` and `inScope(user, org, code)`; the required access class is derived from the code |
| Which pages are guarded? | Every page node, including the ones that never appear in a menu |

When migrating from an older authorization path, keep exactly one authorization source. **Do not
build a second one alongside it**, and do not fall back to the old path when the new one denies —
that turns two guards into an OR and defeats both.

### Navigation derivation

- Visible navigation = the navigable page nodes hit by the effective permission set, then prune
  directories with no visible descendant. Directories are not permission points; their visibility is
  derived, never granted.
- **Holding an action point never grants access to the page it sits on.** Page access is a separate
  point on the page node and is checked on its own.
- **Pages outside the menu are still guarded.** Detail pages, wizard steps and in-app jump targets
  are page nodes marked as non-navigable: absent from the sidebar, fully route-guarded. Reaching one
  by URL, by browser history, or by a programmatic jump goes through the same check.
- Menu rendering must never write permissions back. Loading a menu does not grant a user the page
  permission that would have made the item visible.

## Role-Based View Isolation

- Do not merge core workflows for different personas into one page using Tabs or Toggles. For example, `集团管理员` and `门店负责人` plan workflows should use separate pages.
- Prototypes MUST use the global `RoleContext` and the header role switcher to simulate persona changes.
- Sidebar menus and main page content MUST rerender based on the active role.
- Pages that are not accessible to the active role MUST not be shown as available navigation targets.

## Data Scope vs Function Permission (Cross-Org Edit Boundary)

- Data-scope (view) permission and function (edit/operate) permission are distinct and MUST NOT be conflated. A superior org being able to *see* a subordinate org's data does NOT, by itself, grant the right to *edit* that data.
- A superior org may VIEW and APPROVE / aggregate a subordinate org's data, but MUST NOT directly edit (e.g. compile or modify) it. Example: `区域管理员` can view and approve its stores' plans, yet cannot compile or change a store's plan data.
- Function-permission inheritance across organizations covers **view-class permissions only**; operate and review permissions never roll up (see the role registry). Inheritance of operate permissions holds only within one organization, from `组织管理员` to `组织协管员`. Example: `区域管理员` can view and approve its stores' plans but does NOT compile for the `区域本级` or for any store; the `区域本级` is compiled by the `组织管理员` / `组织协管员` instantiated on that node.
- Consequently, a role's editable (compilable) target is exactly **the org self-level it is instantiated on**: an `组织管理员` / `组织协管员` instantiated on a store, on the region self-level, or on the group HQ self-level compiles that node's self-level; `系统管理员` is a wildcard. `区域管理员` and `集团管理员` do not compile across organizations; covering a node means stacking that node's `组织管理员` role on the person.
- Implementation: gate edit/compile actions on the permission point **and the unit's owning organization** (the service re-checks both), not merely on data-scope visibility. Subordinate-org rows stay visible but render as read-only / approve-only.
- List division of labor: a **compilation / workbench** list (the actor's own working surface) shows ONLY the actor's own self-level (`本级`) task — subordinate-org rows are NOT listed there at all. Oversight of subordinates (`下发` / `催办` / progress / `归档` / `删除`) lives in a separate **task-management** list that carries the full subordinate scope, with cross-org rows read-only. A superior org thus reaches subordinate data through the management list, not by mixing it into its own workbench.

## Function Permission Matrix as Executable Data

- The PRD's function permission matrix (chapter 12) MUST be materialized as a single executable configuration (for example `permissionMatrix.ts`), queried through one entry point such as `can(user, code)` / `inScope(user, org, code)`. Whatever the predicate's shape, there is exactly one entry point.
- Pages and the service layer MUST NOT hard-code scattered role arrays (e.g. `[Role.SYS_ADMIN, Role.GROUP_ADMIN].includes(...)`) for function permissions; every check goes through the matrix.
- Changing a permission starts in the PRD matrix, then syncs to the configuration. Matrix ↔ PRD consistency is guarded by a full-set assertion test (`permissionMatrix.test.ts`): for each action it asserts the complete authorized role set, so both over-grant and missing-grant fail.
- Function permission (this matrix) and data scope (`RoleContext` strategies, locked units) remain separate axes and MUST NOT be conflated — see the sections above.

## Role vs Post (Position) Layering

- A **Role** is an org-agnostic permission subject class; a **Post** is that role instantiated on a concrete organization (e.g. role `区域管理员 REGION_ADMIN` → posts `东区管理员`, `西区管理员`). Roles own menus, data-scope strategy, and permission-matrix keys; posts own the display name, job title, and the concrete org anchors (`unitId` / `regionId`).
- The header switcher lists **posts** (display name + mapped role as subtitle); authorization always resolves through the post's mapped role. Adding an organization means adding a post row only — role definitions and the permission matrix stay untouched.
- Org data-scope resolution combines both layers through a single entry point (`orgInScope`): the scope **type** comes from the role's data-scope strategy (global / region / self-level), the concrete **org** comes from the current post's anchors. Services and pages MUST NOT hard-code org IDs against roles (e.g. `role === REGION_ADMIN → 'region-east'` is prohibited); service commands/queries accept anchor parameters and pass them to the resolver.
- PRD role sections MUST reference the project's unified role metadata source (for example `roleMetadata.ts` plus its owning PRD role-definition chapter) instead of inventing module-local roles. Existing roles that do not participate in a module are registered explicitly as "no permission" rather than omitted, so absence is a decision, not an oversight.

## Role Switching

- Every new page or feature MUST integrate with the global role-switching logic.
- When the user switches role from the header, the app should first navigate to the equivalent functional node for the new role.
- If no equivalent node exists, fallback to the first accessible page in the same parent menu.
- If the parent menu is also inaccessible, fallback to Dashboard.
- **Dashboard is itself a permission-guarded page**, so the fallback chain
  can run out. If Dashboard is inaccessible but other pages remain, go to the first accessible page in
  navigation order. When the user has no accessible page at all, show the agreed no-accessible-page state
  — a plain message naming who to contact — and stop. Never redirect in a loop, never fall back to a
  superadmin view, and never render a page the user cannot access just to avoid an empty screen.
- Role switching MUST NOT leave the user on a blank page or a generic `Permission Denied` screen.
- **Switching identity must clear what the previous identity could see**: lists, opened detail
  drawers, cached sensitive values and modals. A response that arrives late for the previous
  identity must not be written into the current view.
- **The acting role / post MUST survive a page reload and browser forward-back.** Persist it (e.g. `localStorage`), validate the stored value against the post metadata so a stale or hand-edited entry falls back to the default, and treat a storage failure as non-fatal for the switch itself.
- This is not only a comfort rule. A role that resets on reload makes permission scenarios **unconstructable in E2E walkthroughs**: the walkthrough navigates to the page under test, the reload resets the role, and the no-permission branch can never be reached. Prototype role state that only lives in memory silently caps what the test layer can cover.

## Role Equivalent Node Mapping

- Role-specific pages may represent the same business workflow node from different persona perspectives. For example, a group-level management page and a branch-level workbench can be equivalent nodes when they operate on the same workflow stage.
- When role switching from one persona-specific node to another role with an equivalent node, navigate to the equivalent node instead of falling back to a generic default page.
- Equivalent node mapping MUST be explicit in navigation metadata or a central route mapping. Do not infer equivalence from similar page names only.
- Equivalent nodes must preserve the user's workflow context where possible, such as selected cycle, organization, task, package, or source entry point.
- If the target role cannot access the equivalent node, use the standard fallback order: first accessible page in the same parent menu, then Dashboard.
- Workflows owned by external systems are not role-equivalent pages of the business system. Its routes may expose traceable records, snapshots, attachments, external process IDs, and callback results according to the relevant integration spec, but they must not act as external workflow operation pages or receive undocumented deep links from external systems.

## Sidebar Navigation Menu Hierarchy

- **Indentation Levels**:
  - 1st-level items: `px-6` (24px left/right padding).
  - 2nd-level items: `pl-14` (56px left padding).
  - 3rd-level items: `pl-[70px]` (70px left padding), designed specifically so that the first character of the 3rd-level label aligns vertically with the second character of the 2nd-level label.
- **Font Size & Weight**:
  - 1st-level and 2nd-level menu items use `text-sm` (14px).
  - 3rd-level menu items use `text-sm` (14px) for readability, avoiding smaller font sizes.
  - Active/Selected 3rd-level menu items DO NOT use bold weights (do not apply `font-semibold` or `font-bold`), relying purely on background highlight and text color transitions for navigation feedback.
- **Color Styling**:
  - Inactive 3rd-level menu items MUST use `text-gray-500`, matching the color style of 2nd-level menu items. Do not use lighter text colors (such as `text-gray-400` or lighter) to prevent poor contrast and legibility issues.

## Folder Sub-menu Navigation Logic

For 2nd-level menu headers that serve as collapsible folders without direct target pages:
- **Toggle Behavior**: Clicking the header toggles its collapse/expansion state.
- **First Accessible Child Redirect**: Clicking the header navigates the user to the first accessible 3rd-level page ONLY if BOTH of the following conditions are met:
  1. The user's current view does not belong to any of the children of this folder (`!isAnyChildActive`).
  2. The folder was collapsed prior to the click (`!isSubExpanded`).
- **Retain View State**: In any other case (e.g., clicking to collapse an expanded folder, or clicking when already on a 3rd-level page inside that folder), the click MUST only toggle the folding state. Do not trigger any page redirect, ensuring the current view and input states are preserved.

## Recursive Menu Traversal on Role Switch

- The role switcher and navigation guards must support multi-level menus. When a role switches, the router must recursively search for the parent of the `currentPage` in the menu tree to retrieve sibling routes. It must resolve fallback pages within the closest sibling scope before falling back to the top-level menu or Dashboard.
