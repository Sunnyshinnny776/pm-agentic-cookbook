---
description: Use when the business system integrates with any external system and needs global rules for ownership, status mapping, callbacks, retries, idempotency, audit, or sensitive data boundaries.
applies_to:
  - external system integration
  - callback
  - retry
  - idempotency
  - audit trail
  - status mapping
related_specs:
  - ./oa_integration_spec.md
  - ./integration_governance_spec.md
  - ../ui-ux/specs/action_icon_spec.md
  - ../security/sensitive_export_spec.md
---

# External Integration Spec

## Scope

This spec defines global rules for integrations between the business system and external systems such as OA, finance, tax, payment, master data, and warehouse systems.

The goal is to keep integration governance consistent across modules while allowing each external system to keep its own business flow, interface payload, protocol, SLA, and state mapping in a dedicated system spec.

## Core Principles

- The business system is the source of its own business data, snapshots, status display, and audit records.
- External systems own their internal workflow engines, page design, approval or processing nodes, and internal data models.
- Integration contracts cover exchanged metadata, summary fields, attachments or file streams, external process IDs, callback fields, status mapping, idempotency keys, and error handling.
- A module PRD owns module-specific business rules. A system-specific integration spec owns concrete external payloads and callback details.
- UI action specs only define button names, icons, tones, and action visibility. They do not define integration payloads or approval flow logic.

## Responsibility Boundary

| Area | Business System Responsibility | External System Responsibility |
| --- | --- | --- |
| Business data | Generate, validate, freeze, and display its business data | Do not reinterpret the business system's rules unless explicitly agreed |
| Process ownership | Track outbound requests, callbacks, and its own side of the status | Execute external workflow, approval, payment, filing, or sync logic |
| Display material | Provide readable summaries, attachments, hashes, and identifiers | Display or consume the supplied materials inside the external workflow |
| Status update | Map accepted external results back to its business objects | Return process IDs, result codes, comments, timestamps, and error details |
| Audit | Persist request, response, callback, operator, timestamp, source, and hashes | Provide traceable external process and callback evidence |

## Global Rules

- Every outbound integration request must have a stable business key and an external request or process reference after the external system accepts it.
- The business system must record request payload summaries, response summaries, callback summaries, timestamps, status changes, and failure reasons for audit and troubleshooting.
- Callback handling must be idempotent. Each system-specific spec must define the idempotency key, such as `package_id + external_process_id`.
- Duplicate callbacks must return success after confirming the same result has already been processed; they must not repeat business state changes.
- External system failures must not leave business objects in an untraceable state. The business system must expose a clear pending, failed, or retryable state.
- Automatic retry is allowed only for transport errors, timeout, or external temporary unavailability. Business validation failures require user or administrator handling.
- Retry exhaustion must create a visible failure result, notify the responsible user or administrator, and preserve enough diagnostic detail for IT troubleshooting.
- Pages must distinguish actions the business system owns from actions an external system owns. Actions owned by an external system must not be duplicated as buttons in the business system.
- Record-level sensitive details must not be pushed to external systems unless the module PRD and system-specific integration spec explicitly require them.
- Attachments, snapshots, and exported files used as external workflow evidence should include stable IDs and hashes so both systems can reconcile the same material.
- Downloadable sensitive exports follow [Sensitive Export Security Spec](../security/sensitive_export_spec.md); structure protection alone does not satisfy file-content encryption.
- **Mock consoles exercise the real contract**: any prototype integration simulator (e.g. a mock approval console) MUST construct the complete contract payload (all required fields, hash, deterministic external process ID) and submit it through the real callback intake, never by calling internal state methods directly. This makes the simulator double as a living contract test — repeated firing demonstrates idempotency, and payload drift is caught immediately.

## Standard Integration Lifecycle

| Stage | State Meaning in the Business System | Required Evidence |
| --- | --- | --- |
| Prepared | Data is validated and an outbound request can be generated | Business key, submitter, source object, validation result |
| Submitted | The submitted material is frozen and the external push has started | Request summary, submission time, snapshot or attachment references |
| Accepted | External system accepted the request | External process ID, accepted time, response summary |
| Processing | External system owns the current node | External status or process reference |
| Completed | External system returned a terminal success result | Callback payload summary, result time, mapped state |
| Rejected or Failed | External system returned a rejection, cancellation, or failure | Reason, operator if available, retry or correction guidance |

## Documentation Rules

- Put shared integration behavior in this file only when it applies across multiple external systems.
- Put system-specific flow, payload fields, result codes, timeout rules, and examples in a dedicated spec, for example `oa_integration_spec.md`.
- If a module introduces a new external system without an existing spec, create a new file in the integration spec directory before implementing the integration; follow the patterns in [Integration Governance Patterns](./integration_governance_spec.md).
- If a UI action rule changes because of integration ownership, update `../ui-ux/specs/action_icon_spec.md` and link back to the relevant integration spec.
