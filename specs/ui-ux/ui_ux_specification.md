# UI/UX Specification Index

This file is the entry point for the product UI/UX rules. Detailed rules are split into modular specs under `specs/ui-ux/specs/` so agents and engineers can load only the rules relevant to the current task.

## Core Principles

- **Enterprise B2B quality**: Keep the interface restrained, professional, data-dense, and workflow-oriented. Use the primary color to guide attention, not as decoration.
- **Modular implementation**: Prefer the project's shared components and project-level shared UI helpers. Avoid page-local one-off styling.
- **Consistent interaction feedback**: Buttons, row hover states, object state changes, and operation results must use predictable feedback patterns.
- **Context-efficient rule loading**: Read only the relevant modular spec for the task. For example, table operation buttons require `action_icon_spec.md`; feedback changes require `feedback_message_spec.md`.
- **Chinese UI, English rules**: User-facing UI labels, page copy, button names, and business examples stay in Chinese. Rule structure, implementation guidance, code identifiers, and action keys use English for stable model parsing.

## Modular Specs

- [Role Navigation Spec](./specs/role_navigation_spec.md): role isolation, Mock RBAC, and role-switch navigation behavior.
- [Color System Spec](./specs/color_system_spec.md): primary color, neutral colors, status tones, and token usage.
- [Component Usage Spec](./specs/component_usage_spec.md): usage rules for `Button`, `Badge`, `Card`, `Table`, and shared components.
- [List Query Spec](./specs/list_query_spec.md): main-list search, status filters, submitted-query behavior, conditional filters, more menus, and column settings.
- [Layout Interaction Spec](./specs/layout_interaction_spec.md): page layout, metric bands, modal, drawer, inline expansion, and safety patterns.
- [Feedback Message Spec](./specs/feedback_message_spec.md): Page Alert, Field Message, Action Feedback, Success Toast, and Context Callout.
- [Action Icon Spec](./specs/action_icon_spec.md): action buttons, table operation columns, icon dictionary, and action color semantics.
- [UX Writing & Semantic Spec](./specs/ux_writing_semantic_spec.md): Chinese business copy, terminology translation, and export-compatible semantic classes.
- [Diagram Spec](./specs/diagram_spec.md): shape semantics, swimlanes, edge annotation density, and palette for hand-drawn SVG diagrams in PRDs.

## Execution Rule

Before implementing UI work, follow [Spec Loading and Capture Rule](../spec_loading_rule.md), identify which modular specs apply, and read those files first. If the current scenario is not covered, capture the reusable rule in the appropriate spec after the user and agent agree on the pattern.
