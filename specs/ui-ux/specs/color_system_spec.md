---
description: Use when choosing UI colors, status tones, text hierarchy, borders, backgrounds, or action color semantics.
applies_to:
  - color tokens
  - status colors
  - text hierarchy
  - borders
  - backgrounds
related_specs:
  - ./component_usage_spec.md
  - ./action_icon_spec.md
---

# Color System Spec

## Scope

This spec applies to global UI colors, status tones, text hierarchy, borders, backgrounds, and action tone semantics.

## Primary Theme

- Primary color: `primary-600` (`#16a34a`).
- Active or pressed state: `primary-700`.
- Light background, weak highlight, and selected background: `primary-50`.
- Use primary color for primary actions, selected navigation, focused indicators, and key metric emphasis.
- Do not use the primary color as large-area decoration.

## Neutral Colors

- Page background: `#F5F7FA` or `gray-50`.
- Content surfaces: `bg-white` or `gray-50`.
- Primary text: `gray-800` or `gray-900`.
- Secondary text: `gray-500`.
- Helper, disabled, and empty-state text: `gray-400`.
- Borders: `gray-100` or `gray-200`.

## Status Colors

- Success: `bg-green-50`, `text-green-700`, `border-green-200`, icon `text-green-600`.
- Warning: `bg-orange-50`, `text-orange-700`, `border-orange-200`, icon `text-orange-600`.
- Error/Danger: `bg-red-50`, `text-red-700`, `border-red-200`, icon `text-red-600`.
- Processing: `bg-blue-50`, `text-blue-700`, `border-blue-200`, icon `text-blue-600`.

## Usage Rules

- Object state MUST use `<Badge />` first. Do not rebuild status pills page by page.
- Common actions use `primary`; destructive or rejection actions use `danger`; positive state transitions use `success`; impactful but non-destructive state transitions use `warning`.
- Do not use different colors for the same action semantics. For example, `编辑` should not be blue in one table and primary in another.
