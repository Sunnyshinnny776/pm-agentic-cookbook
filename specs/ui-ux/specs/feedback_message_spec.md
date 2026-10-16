---
description: Use when designing or implementing validation messages, warnings, errors, success feedback, toasts, alerts, or contextual explanations.
applies_to:
  - validation
  - error messages
  - warnings
  - success toast
  - action feedback
  - context callout
related_specs:
  - ./component_usage_spec.md
  - ./ux_writing_semantic_spec.md
---

# Feedback Message Spec

## Scope

This spec applies to user hints, validation, warnings, errors, success feedback, operation results, and contextual explanations.

## Feedback Taxonomy

- **Page Alert**: page-level or workflow-level condition. Place below the page title.
- **Field Message**: field validation, helper text, or recovery guidance. Place directly under the field.
- **Action Feedback**: immediate result of a button, icon, or table-row action. Keep it visually attached to the triggering control.
- **Success Toast**: success result for submit, create, save, publish, enable, archive, or equivalent completion. Place near the visual center of the viewport.
- **Error Toast**: the immediate result of a command the system refused — a state gate rejection, an unmet precondition, a permission refusal. Same placement and lifetime rules as Success Toast; only the tone differs. Use it when the rejection answers an action the user just took. A condition that persists on the page independently of any action is a Page Alert, and a single field's validation error is a Field Message.
- **Context Callout**: business rule, consequence, or stable explanation near the relevant content.
- **Status Badge**: object state only. Use `<Badge />`.

## Icon Standard

- All feedback types except `Status Badge` use one unified cue icon.
- Icon shape: circular outline + exclamation mark.
- Preferred icon: lucide-react `CircleAlert`.
- Icon color follows the feedback tone.
- Do not mix warning triangles, checkmarks, bells, or custom SVG icons for the same feedback category.

## Style Standard

- Page Alert: `rounded-lg border px-4 py-3 flex items-start gap-2.5 text-sm`.
- Field Message: `mt-1.5 flex items-start gap-1.5 text-xs leading-5`.
- Action Feedback: `rounded-md border px-2.5 py-1.5 flex items-start gap-1.5 text-xs leading-5`.
- Success Toast: fixed at `left-1/2 top-[38vh]` with `-translate-x-1/2 -translate-y-1/2`.
- Success Toast width follows content with `w-fit` plus viewport max-width protection.
- Success Toast style: gray background (#F9FAFB), subtle gray border (#E5E7EB), dark green text (#166534), left-aligned content, `rounded-[14px]`, `px-5 py-3.5`, `text-sm`.
- Error Toast shares the Success Toast container exactly — same position, width behaviour, radius, padding and text size — and differs only in tone: `text-red-700` with icon `text-red-600`, per the Error row of Tone Mapping. Keeping one container means the two toasts read as one system rather than two competing shapes.
- Context Callout: `rounded-lg border px-4 py-3 flex items-start gap-2.5 text-sm`.

### Actionable Work Summary Callouts

- A Context Callout that summarizes actionable records MUST state its counting scope and use the same authoritative query contract as the list opened by its action.
- When the summary represents the user's complete authorized work queue, calculate it from the full authorized data scope independently of the main list's submitted filters. Do not let a keyword or page-local filter silently reduce the work count.
- Evaluate message visibility and inline-action visibility separately. A user with the required view permission and data scope may see the informational summary; render an action such as `去处理` only when the user also holds that action's explicit function permission and at least one target is inside the user's operate scope. Hiding the action MUST NOT hide the informational message.
- Re-evaluate permission and operate scope for every row in a scoped list opened from a summary. A mixed list may show read-only detail/progress actions on all visible rows while showing edit, confirm, or process actions only on rows the user may operate.
- End the concise count and consequence with normal punctuation, then place one explicit verb action immediately after it with `gap-2` spacing (for example `去处理` or `查看名单`). The count and action color MUST match that row's cue icon; the action adds an underline on hover. It opens the corresponding scoped list; it must not mutate the main list's draft filters as a substitute.
- A single persistent guidance message with an inline navigation action uses the same work-summary row pattern; ordinary explanations without an action and success, error, or validation feedback keep their existing feedback component and do not add the guide character.
- When two or more work summaries appear together, render each message in its own `rounded-xl` container and arrange the containers with `gap-2`; do not wrap them in another bordered or colored container. Use low-saturation light backgrounds, subtle borders, secondary text, and compact vertical padding; different tones may distinguish queue types, but no row should compete visually with the page's primary action.
- Every actionable work-summary set MUST include the shared non-interactive guide character as one overlay on the right edge of the message set. Vertically center it against the complete message set, keep it above the message containers with an explicit overlay layer, and allow visible overflow so the full character remains visible. Its position remains stable when multiple message containers are present; do not reserve a separate grid column, card, or background region for it and do not repeat it inside each row. The placeholder character MUST use the product theme, expose an accessible label, and MUST NOT imply an AI feature, chat entry, or executable capability that the product does not provide; replace the shared component centrally when the final identity is designed.
- If independently calculated summaries can overlap, say so in the UI or supporting copy. Do not imply that their counts are mutually exclusive.
- After an item is processed or becomes stale, refresh both the summary count and its scoped list from the same source. Hide a zero-count Callout after refresh unless an explicit empty-state entry remains useful.

## Tone Mapping

- Success: `bg-green-50`, `border-green-200`, `text-green-700`, icon `text-green-600`.
- Warning: `bg-orange-50`, `border-orange-200`, `text-orange-700`, icon `text-orange-600`.
- Error: `bg-red-50`, `border-red-200`, `text-red-700`, icon `text-red-600`.
- Info: `bg-primary-50` or `bg-gray-50`, `border-primary-100` or `border-gray-200`, `text-gray-600`.

## Display Duration

- Transient feedback messages stay visible for exactly 5 seconds. **Success Toast and Error Toast share this duration** — refusal is not shown for a different length of time than success.
- Implement the duration from the shared `FEEDBACK_TOAST_MS` constant in the shared component library, never as a literal at the call site. Scattered literals let durations drift apart from page to page.
- `Context Callout` and `Page Alert` do not auto-dismiss unless the UI provides an explicit close action.

## Drawer Message Placement

- A persistent Drawer-level condition, blocking reason, or recovery instruction that applies to the whole form MUST appear in a dedicated non-scrolling notice region directly below the fixed header and above the scrollable body. It remains visible while the user edits content at the bottom of the Drawer.
- Keep field validation beside its field and keep action feedback attached to the triggering action; do not move those messages into the pinned notice region merely because they are rendered inside a Drawer.
- Instructional content that belongs to one section or workflow step remains in that section. The pinned region is reserved for whole-Drawer context, so it does not grow into a second scrollable body.

## Layer Boundary (Guarded Commands)

- The state / service layer MUST NOT render any UI feedback (`alert`, toast, modal, etc.).
- Guarded commands surface rejection as a returned error value (e.g. `GuardedCommandResult.error`); the calling page presents it using this spec's taxonomy (usually Action Feedback next to the triggering control).
- Success feedback fires ONLY after the command result confirms success. A guarded command that returns an error must never trigger the success path.

## Precedence over Loose PRD Wording

- PRDs often say "toast" as a generic word for feedback. **This spec's taxonomy wins** — resolve the word against the taxonomy rather than inventing a channel to match the prose: a rejection answering a user action is an Error Toast, a standing page condition is a Page Alert, a single field's problem is a Field Message.
- When a PRD asks for feedback this taxonomy genuinely does not have, treat the PRD wording as the loose side: implement the taxonomy-correct channel and correct the PRD wording in the same change. Never handwrite an off-taxonomy component to match PRD prose literally.
- Where the gap is real rather than a wording slip, extend the taxonomy here first, then implement. A refusal answers in the same shape and place as the corresponding success, differing only in colour.
- Record the correction in the PRD change log so the next audit does not re-open it as a deviation.

## Prohibited Patterns

- Do not use top-right fixed toast for page-local business actions. Global shell notifications are the only exception.
- Do not call `alert` / `window.confirm` / `window.prompt` in business pages or the state layer. Confirmations use the shared `CustomModal` (see `layout_interaction_spec.md`); errors and successes use the shared feedback components.
- Do not fire success feedback optimistically before the async command settles successfully.
- Do not place field validation errors far away from the field.
- Do not use `<Badge />` for long explanations, recovery guidance, or error details.
- Do not mix multiple feedback shapes, icons, colors, and positions in one page.
- Do not handwrite one-off feedback styles in business pages when shared feedback components exist.
