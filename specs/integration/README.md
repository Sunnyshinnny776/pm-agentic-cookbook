# Integration Specification Index

This directory records how the business system integrates with external systems. Use the global spec first, then load the pattern or system-specific spec only when the current work touches it.

## Specs

- [External Integration Spec](./external_integration_spec.md): global rules for integrations with external systems — ownership, status mapping, callbacks, retries, idempotency, audit, and sensitive data.
- [OA Integration Spec](./oa_integration_spec.md): approval flows owned by an external OA system — action ownership, approval packages, callback idempotency, and push retry.
- [Integration Governance Patterns](./integration_governance_spec.md): reusable patterns for module-level contracts — approval package identity and idempotency registry, pre-close validation and period anchor, cumulative write-back, and immutable deliverable hand-off.

## Usage Rule

When a module needs to integrate with an external system, define the shared integration behavior in `external_integration_spec.md` and put system-specific flow, payload, and callback details in a module-level integration spec that follows the patterns in `integration_governance_spec.md`.
