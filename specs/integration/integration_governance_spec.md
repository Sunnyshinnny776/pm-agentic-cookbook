---
description: Use when writing a module-level integration contract — an approval package flow, a validation call before an irreversible step, a write-back into another module's ledger, or the hand-off of an approved deliverable.
applies_to:
  - module integration contract
  - approval package identity
  - idempotency registry
  - period anchor
  - pre-close validation
  - cumulative write-back
  - deliverable hand-off
related_specs:
  - ./external_integration_spec.md
  - ./oa_integration_spec.md
---

# Integration Governance Patterns

## Scope

[External Integration Spec](./external_integration_spec.md) sets the global rules every integration follows. This spec collects the reusable patterns a **module-level** integration contract is built from. A module contract picks the patterns it needs, fills in its own keys, fields and states, and states which pattern each section follows.

Examples use one fictional retail chain: stores compile an annual purchase plan (`PlanTask`), regions aggregate it, OA approves it, and a monthly supplier settlement run (`SettlementRun`) closes each `SettlementPeriod`.

## Pattern 1: Approval Package Identity and Idempotency Registry

Use when a business object is submitted to an external approval system, possibly more than once.

**Deterministic package identity.** A package ID is derived from the owning object, its period and a submission sequence, so a rejected-then-resubmitted object always yields a new ID and never overwrites an old one:

| Package type | Encoding (example) |
| --- | --- |
| Store own-level plan package | `pkg-store-{storeId}-{cycle}-s{submission}` |
| Region aggregation package | `pkg-region-{regionId}-{cycle}-s{submission}` |
| Headquarters package | `pkg-hq-{cycle}-s{submission}` |

**Idempotency registry.** The business system persists a registry keyed by `package_id + external_process_id` with the recorded terminal result:

- Duplicate callback with the same terminal result: return success with zero side effects — no state change, no history append, no ledger write.
- Callback with a conflicting terminal result on the same key: reject; the recorded result stands. A correction requires a resubmission, which produces a new package.
- Hash validation failure, missing fields, unknown package or mismatched process ID: reject, leave business state unchanged, record for audit only.
- A callback for a package that is no longer the latest submission is recorded but cannot mutate the current business object.
- A manual "sync status" action goes through the same result handler and registry as callbacks.

**Approval is not the business effect.** An approved package changes the object's approval status only. Downstream effects (publishing a plan for execution, generating ledger entries) happen at an explicit later step with its own idempotency key, for example `PUBLISH:{cycle}:{storeId}`.

**Delivery safety.**

- Commit the package's pushing state and a delivery reservation (attempt number, request ID, actor) before the network call; record the result in a separate transaction. If recording fails, recovery repeats delivery with the same package ID and reservation.
- The adapter declares a delivery-safety mode before any reservation: **idempotent** (resending the same package ID returns the original process ID) or **lookup** (an authoritative lookup by package ID finds an existing process before sending). With neither, fail closed before sending.
- An "accepted" response without a usable process ID is an unknown remote outcome, not success and not failure: move the package to a reconciliation-required state, keep all material locked, and bind a process ID only from a verified callback or an authoritative lookup.

**Retry and exhaustion.**

- Retry automatically only for transport errors, timeouts, rate limiting and server errors, on a versioned schedule. Validation, authentication, signature and snapshot-consistency failures fail immediately.
- Every module declares its exhausted-state policy explicitly: return to an editable state, or stay in a locked pushing state that offers only authorized same-package retry or withdraw-and-edit.
- Same-package retry reuses the package ID, hashes and frozen material and appends a delivery attempt; withdraw-and-edit keeps the failed package read-only and starts a new submission sequence.

## Pattern 2: Pre-Close Validation and Period Anchor

Use when one module must ask another to validate data before an irreversible step, such as confirming a settlement run against the approved purchase plan.

**Period anchor.** The contract names the authoritative fields that place a request in the receiving module's period (for example the settlement period's plan cycle and monthly period code). The anchor may be corrected while the source period is still open; generating the period instance freezes it. After the freeze the sender never rewrites the anchor — the receiving module restores the same referenced period to a usable state, and a permanently different anchor needs a new, versioned contract.

**Trigger timing.**

| Trigger | Behavior |
| --- | --- |
| Confirming or sealing the source result | Validate before allowing the step; freeze the request snapshot |
| Source amounts change after a validation | Invalidate the previous result; require a new validation |
| Preview during calculation | Optional, non-blocking warning; must not reserve anything on the receiving side |

The blocking checkpoint sits **before** the source becomes immutable, not after.

**Data direction.** The receiver reads a summary the sender provides and returns a result. The validation call never mutates the receiver's ledger; any reservation or occupancy that follows is a separate, receiver-side stage.

**Idempotency.** Key one validation series by the source run, the period and a snapshot hash of the submitted summary, for example `settlement_plan_validation:{run_id}:{period_id}:{snapshot_hash}`. Retrying the same key returns the existing result. Any change to the summary produces a new hash and a new series. A further attempt within the same series is allowed only when the latest attempt failed on the period anchor and a recorded resolution reference proves that the receiving module restored that same frozen period; every other blocking result needs a changed summary, and so a new series.

**Result and blocking policy.**

| Result | Sender behavior |
| --- | --- |
| `ACCEPTED` | Allow the step |
| `ACCEPTED_WITH_WARNING` | Allow only for a role with exception-confirmation permission; record the reason |
| `REJECTED` | Stop; show what blocks and by how much |
| `TEMPORARY_FAILURE` | Stop; allow retry |
| `PERIOD_MISMATCH` | Stop; correct the anchor while the period is open, otherwise wait for the receiver to restore the same period |

Blocking is the default. A non-blocking warning must be explicit in the response and audited with the responsible role and reason.

**Audit fields.** Validation ID, idempotency key, attempt sequence, source run and period, anchor values copied at request time, snapshot hash, request and response summaries, requester and time, resolver and time for overrides, and the resolution reference.

## Pattern 3: Cumulative Write-Back

Use when an approved result must update a cumulative ledger owned by another module, such as a supplier's year-to-date purchase volume.

- Write back **after** approval, asynchronously, as per-period increments. Before approval the results stay internal to the source run.
- Complex branching (recalculation, corrections across periods) is resolved in the source module; the ledger receives only final increments.
- Key each write-back by run, period and the approved snapshot hash. Retrying the same key never double-posts; a newly approved version is a new request, and the ledger reconciles by period and run rather than accumulating blindly.
- A write-back is atomic per batch; partial acceptance is not allowed.
- A failed write-back is marked failed and retried as compensation. **Approval never rolls back** because a write-back failed; the failure surfaces as an operations alert.

## Pattern 4: Immutable Deliverable Hand-Off

Use when a downstream module consumes an approved result, such as a payment module consuming an approved settlement statement.

- The deliverable is one specific approved version identified by version and snapshot hash. Downstream references that version, never live results.
- Re-delivering the same version is a no-op that returns the earlier acknowledgement.
- An approved version is never unlocked or replaced. Corrections arrive as separate adjustment records in a later run.
- Downstream failures (an OA rejection, a failed payment) stay in the downstream module and do not move the upstream state machine.
- Planning markers such as a scheduled pay date are display information; they never affect delivery eligibility.

## Writing a Module Contract

A module-level integration spec states, for each pattern it uses: the keys and their encoding, the trigger table, the data direction table, the result and status mapping, the failure and retry table, and the audit fields. Keep business rules in the module PRD and link to it; keep payload fields and status mapping in the contract.
