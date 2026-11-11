---
description: Use when creating or refactoring a business module's state, data access, or money handling with a replaceable service boundary.
applies_to:
  - module architecture
  - data access layer
  - service interface
  - async contract
  - money arithmetic
  - mock persistence
related_specs:
  - ../ui-ux/specs/feedback_message_spec.md
  - ../ui-ux/specs/component_usage_spec.md
  - ../integration/external_integration_spec.md
---

# Frontend Architecture Spec

## Scope

Business modules use a replaceable service boundary: backend integration must mean replacing one layer, not rewriting pages.

## Module Layering (three layers)

Every module splits into three files/layers:

| Layer | File pattern | Owns | Must not |
| --- | --- | --- | --- |
| Models | `<module>Models.ts` | Entity types (aligned to the module's Domain Model), pure derivation functions, mock seeds | Touch React, storage, or UI |
| Service | `<module>Service.ts` | Async `Service` interface (commands + queries) and its mock implementation; deterministic reconciliation after every command | Render feedback; hold React state |
| Provider | `<module>State.tsx` | Thin React provider: snapshot cache + command delegation; sync queries over the cache | Contain business state transitions or persistence calls |

- Entity types come from the module's Domain Model document; `any` is not acceptable for core business data.
- Pages depend on the provider hook only; they never import storage or reach around the service.
- Backend integration = re-implementing the service interface; pages and provider stay unchanged.

## Async Contract

- Service commands are `Promise`-shaped even while the implementation is synchronous localStorage. Retrofitting sync → async is invasive; shipping the async shape first is mandatory.
- Guarded commands return an error value (`GuardedCommandResult`) instead of throwing or alerting; the page presents it per `feedback_message_spec.md`. This covers business-state refusals (wrong source status, missing object, rule violations). **Authorization refusals are the exception**: a caller without the permission point (or outside the object's organization) is a calling-path error, not a state the user can correct, so the service rejects with a dedicated error type and leaves storage untouched; the page catches that type per action and presents it as an action failure.
- Service commands normalize optional form values into their canonical domain representation before validation, comparison, or persistence (for example: trim optional strings and convert an empty optional date to `undefined`). Business guards must not depend on a page-specific empty-value representation.
- The mock implementation injects a dev-only latency (0 in tests) so loading/pending states are observable and testable (see `component_usage_spec.md` async pending rule).

## Mock Persistence (stateless repository)

- The mock service implementation treats storage as the single source of truth: read + reconcile on access, persist on commit. No module-level singleton in-memory cache.
- Rationale: a cached singleton can leak state across tests after the per-test storage stub is cleared, and can desynchronize multiple provider instances. Stateless repositories reset naturally when storage is cleared.
- All storage access goes through the module's storage wrapper (`<module>Storage.ts`) with versioned one-shot migration.
- A controlled replacement binds an explicit selection to a detached preview of the observed state. The owner must compare and commit against that state within an atomic boundary covering every writer of the key, including migration and backfill; a lock used only by the new command is insufficient. Recheck trusted identity and authorization inside the boundary, commit business changes with their audit evidence, and fail closed when the capability is unavailable. An uncertain result is reconciled by its original request identifier without rollback or automatic replay.
- A protected read that commits access evidence may revalidate its confirmed source while that same evidence write is pending. Only the internally assigned operation ID may identify that pending write; unrelated pending operations still block the read. After confirmation, recheck authorization and source freshness without the pending-write exception before returning protected content.
- Recovery journals may deduplicate repeated image strings and fragments only through a lossless versioned representation. Decoding must restore the exact original owner strings, receipt identities, results and states for recovery and replay. Preserve legacy decoding without rewriting on read; reject corrupt references and unsupported versions without replacing stored data. Deduplication does not remove receipts or waive finite storage failures.

## Single-Key Initial Persistence

- First persistence prepares and validates a detached candidate before writing a single versioned owner key. It preserves every existing raw value, including damaged or unsupported snapshots; replacement and migration are separate operations.
- All writers of the key must use the same cross-context exclusive lock. Recheck absence inside the lock, then perform the synchronous write and verification without an asynchronous gap. A lock supplied by a test fixture proves only the fixture's concurrency contract; uncooperative writers are outside this guarantee.
- An asynchronous pre-write check must complete while the exclusive lock remains held. Reject or catch a failed check before accessing storage; after it succeeds, recheck the raw value and write/verify synchronously. Identity, authorization and producer rechecks use trusted ports; a single-owner lock does not freeze other owners or provide a cross-domain transaction.
- Missing or unavailable locking must fail closed. Read failure before writing prevents the write; a failed write is reported as not applied only when rereading proves the key still absent. A failed or mismatching verification, or failure after a write attempt whose result cannot be established, returns an explicit unconfirmed outcome.
- An unconfirmed outcome never triggers rollback, reseeding or overwrite. Recovery rereads the persisted owner; repeated initialization refuses an existing key. Single-key persistence does not prove a consumer switch or a transaction across stores.
- Initialization repositories are infrastructure, with injected storage and locking. The owning Service remains responsible for trusted identity, current authorization, authoritative producer facts and command context; repositories must not install browser defaults or permission substitutes.

## View Invalidation and Command Outcomes

- Configuration invalidation tokens use the caller-visible business revisions and references. Appended access evidence or operation history does not change the business token; recovery/read-only state is reported separately. Same-context notifications defer their probe until the initiating Service calls settle.
- A changed token invalidates cached reads and ephemeral protected views. Retain in-flight command outcomes above those views so closing or rebuilding a view cannot lose an unconfirmed operation identifier. Refresh never replays commands, and unrelated storage or personal-preference events do not invalidate business configuration.

## Two-Layer Guards (page affordance + service guard)

- A blocking rule owns **two** enforcement points: the page disables/hides the affordance, and the service command refuses the write. Both derive from the **same judgement source** — one predicate or one derived field, never two hand-written conditions that can drift apart.
- **Judgement data already existing does not mean the gate is wired.** A field can be present, populated and already consumed by some indicator (a red dot, a badge) while no guard reads it. When implementing a blocking rule, grep the rule id across the service layer; zero hits means the gate does not exist regardless of how complete the data looks.
- **Each layer needs its own test.** The service guard is covered by a service-level case (call the command, assert the rejection and that no state advanced); the page affordance is covered by a component case (assert disabled / not rendered plus the hover reason). A single test at one layer leaves the other free to regress.
- The page layer is a convenience, not the enforcement. Never rely on the disabled control alone, and never rely on the service guard alone — the first is bypassable, the second surfaces too late for the user.

## Analytics Boundary

- When a backend does arrive, the shape that keeps the events honest:
  - one thin exit, `track(event, props)`, with a single swappable sink — scattered call sites to a logging library are what make the events impossible to redirect later;
  - event names and property schemas come from the PRD tables, typed, rather than being invented at the call site;
  - **calls belong after the service command reports success**, never in the page's `onClick` — an event fired on click also fires when the command is refused, which quietly inflates every funnel;
  - user and org context is injected centrally, not assembled by each caller.

## Cross-Module Contract Staging

- A producer module exclusively owns its entities, storage key, state transitions, and access rules. Consumers obtain cross-module data only through the producer Service's query and command contracts; pages and storage wrappers must not read or write another module's persisted snapshot directly.
- Define the smallest stable contract before connecting two modules: stable IDs, status and time semantics, versioning, access boundaries, and failure results. Do not create dependent mock business data before its owning module and Service contract are ready.
- Connect stable modules incrementally. Replace one consumer seed-data dependency with the producer Service, then verify data propagation, permission rejection, missing references, and invalid state handling before connecting the next dependency.
- Dispatch persisted data to the reader and writer that own its schema version. Compatibility readers and serializers must reject newer owner facts instead of downgrading, reseeding or copying them into older mutable structures. Derived catalog revisions are query tokens and must not be accepted as owner facts.
- When a downstream business record is created, revalidate referenced data and freeze the required IDs, versions, time range, and immutable snapshot or hash. Later master-data changes must not rewrite the historical business record.
- Keep a producer reference scope open from preparation through the consumer transaction commit. Recheck external proof tokens immediately before commit and expire the scope on exit; a local coordinator protects only writers that participate in it and cannot prove atomicity with remote sources. Do not report a failed command by adding a new validation after its transaction has committed.
- A submitted directory choice preserves its provider-owned identifier and expected directory version. Resolve the choice again inside the write boundary and verify that its binding still matches the submitted references; directory selection evidence does not replace the business record's own contract snapshot.

## Money Arithmetic

- Money arithmetic MUST go through the shared integer-cents utilities (parse, add, subtract); raw float addition/subtraction on money values is prohibited (IEEE754 drift compounds through ledger chains).
- User-entered amounts are parsed by the shared amount parser (2-dp normalization, invalid input → 0).
- The Number-based APIs apply only while cents remain within JavaScript's safe integer range. Full-range `Decimal(18,2)` values use exact string utilities (parse, add, sum, compare) and never convert through `number`; invalid input and overflow return explicit errors.
- Exact amount inputs are normalized to two decimal places. Use the parser that matches the field contract: the number-based parser keeps its zero fallback for existing number-based flows, while exact Decimal values preserve validation errors. Display formatting stays `toLocaleString`.

## Identifiers

- Consumers preserve provider-owned external IDs as opaque identifiers and validate them through the owning producer. They must not invent replacement IDs or infer identity/ownership from a string pattern.
- Entity IDs use `crypto.randomUUID()`; derived records that must be idempotent (e.g. ledger entries) use deterministic IDs built from their source business key.
