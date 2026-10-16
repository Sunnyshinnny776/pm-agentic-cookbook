---
description: Use when implementing workflows that submit approval packages to an external OA system, receive OA callbacks, display OA approval results, or handle OA retry and idempotency.
applies_to:
  - OA approval
  - approval package
  - approval callback
  - approval retry
  - approval idempotency
  - OA process instance
related_specs:
  - ./external_integration_spec.md
  - ./integration_governance_spec.md
  - ../ui-ux/specs/action_icon_spec.md
---

# OA Integration Spec

## Scope

This spec records the rules for approval flows owned by an external OA system. Module-specific package types, callback fields, idempotency keys, and status mapping live in each module's own integration spec, written to the patterns in [Integration Governance Patterns](./integration_governance_spec.md).

## Ownership Boundary

| Area | Business System Responsibility | OA Responsibility |
| --- | --- | --- |
| Approval material | Generate, freeze, archive, and push approval packages, snapshots, attachments, hashes, and summary fields | Display the received approval summary and attachments |
| Approval process | Track OA process instance ID, push result, callback result, and its own side of the status | Own approval process instance, nodes, approvers, comments, result, and completion time |
| Business interpretation | Own business calculations, validation, and status mapping | Do not modify or reinterpret the business system's data |
| Page navigation | Provide internal package records for authorized users | Complete approval inside OA without deep links into the business system |

## General OA Approval Rules

- OA-owned approval nodes must be completed inside OA. The business system must not render `approve` or `reject` actions for those nodes.
- The business system uses `submit` to push an approval package to OA and uses traceability actions such as `detail`, `history`, `download`, `progress`, `retry`, or `notify` after submission.
- OA approval pages rely on the summary fields and attachments the business system provides. OA pages must not include detail deep links, open-in-system buttons, or page URL parameters of the business system unless an integration spec explicitly changes this rule.
- The business system may show OA callback results, approval history, OA process IDs, attachments, and package records to authorized users.
- Approval package material pushed to OA should include stable identifiers and hashes for reconciliation, such as package ID, snapshot ID, package hash, snapshot hash, and file hash.
- Approval package summaries must avoid record-level sensitive details unless the owning module PRD explicitly approves that data scope.

## Module-Specific Approval Rules

- Modules may define module-specific approval package types, summary fields, attachments, status mapping, and retry handling in their owning integration spec.
- OA workflow nodes, approvers, approval-chain personnel configuration, and OA page behavior remain owned by OA unless an integration spec explicitly changes that boundary.

## Submission Version Chain And History

- Every resubmission creates a new immutable approval package with a monotonically increasing submission sequence. Rejected, withdrawn, canceled, or failed packages are never overwritten.
- The business object may keep a pointer to the latest package; package storage remains a one-to-many version chain and is the audit authority for external submissions.
- A package freezes its business snapshot, attachments, hashes, submitter, and delivery evidence. Editing after a retryable failure produces a new snapshot and package.
- Authorized users must be able to inspect historical package versions, OA process IDs, package/snapshot hashes, delivery attempts, terminal results, and failure categories.
- Historical packages are read-only. They cannot be edited, deleted, resent, or used to mutate the current business object.
- Package-history access rechecks current business-data and attachment permissions and must not expose raw sensitive payloads in logs or list views.

## Callback and Idempotency

- OA approval completion callbacks must be processed idempotently.
- Each module-specific spec must define its callback idempotency key, for example `package_id + external_process_id`.
- Duplicate callbacks for the same processed result must return success and must not change the task state again.
- Callback records must keep OA result, approver, approval comment, approval time, callback signature or hash, and the original callback summary for audit.
- Callback signature or hash validation failure must not move the task into processing or terminal success states.

## Failure and Retry

- If the push to OA fails because OA is unavailable or the interface times out, the business system may hold the business object in a submitted or pushing state and retry asynchronously.
- After retry succeeds, the business object moves to the module-defined external-processing state.
- After retry exhaustion, the business system follows the owning module's explicitly declared exhausted-state policy. A module may roll back to an editable/retryable state, or remain in a durable pushing state with frozen material and expose only authorized same-package retry/withdraw commands.
- During submitted or pushing states, the business system must lock upload, edit, and resubmit actions that could change the frozen submission material.

## References

- [External Integration Spec](./external_integration_spec.md)
- [Integration Governance Patterns](./integration_governance_spec.md)
- [Action Icon Spec](../ui-ux/specs/action_icon_spec.md)
