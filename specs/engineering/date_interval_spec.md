---
description: Use when defining or consuming business date intervals, effective-date ranges, open-ended periods, interval overlap, or DATE and TIMESTAMP boundary conversion.
applies_to:
  - business date interval
  - effective date range
  - open-ended date
  - interval overlap
  - date and timestamp boundary
related_specs:
  - ./frontend_architecture_spec.md
  - ../ui-ux/specs/layout_interaction_spec.md
  - ../ui-ux/specs/component_usage_spec.md
---

# Date Interval Spec

## Scope

This spec owns the shared meaning and representation of business date intervals. It applies to effective dates, validity ranges, period overlap queries, interval replacement, and conversions between date-only values and timestamps.

The owning domain spec still defines what an interval means for its business object, which states create or close it, whether same-day replacement is allowed, and whether an interval must be continuous. This document supplies the common date semantics those rules use.

This spec does not define settlement-month generation, settlement-cycle anchors, authorization expiry policy, approval lifecycle, audit-event retention, or UI-specific query-span limits. Those rules remain in their owning PRD, Domain Model, integration spec, or UI spec.

## Canonical temporal types

### Business `DATE`

- A `DATE` is a calendar date in `YYYY-MM-DD` form. It has no time of day and no time zone.
- Date arithmetic uses calendar-day arithmetic. Subtracting one day from `2026-03-01` produces `2026-02-28`; month length and leap years must be handled by a date library or equivalent trusted implementation.
- A date-only field must not be compared by matching month labels or by the client machine's local clock when the business rule requires an as-of date.
- A business rule that depends on “today” must receive an explicit business date from its command or service context. The owning module declares the business timezone used to derive that date.

### Timestamp instant

- A timestamp represents an instant and includes a time zone or an explicit UTC offset.
- A timestamp interval must declare whether its end is inclusive or exclusive. The common half-open form is `[start, end)`, where `end` is not included.
- A `DATE` open-end sentinel must not be copied into timestamp fields. Likewise, a timestamp's nullable or long-term-valid convention must not be silently converted into a date sentinel.

## Date interval semantics

### Closed date intervals

An effective or validity interval whose endpoints are dates uses the closed form `[start, end]`: both endpoints are included.

The minimum invariants are:

- `start` is present.
- `end` is present when the field represents a persisted closed interval.
- `start <= end`.
- A query or command that accepts both endpoints rejects an inverted range before making a service request.

### Open-ended date intervals

When a `DATE` field is explicitly defined as an open-ended interval endpoint, `9999-12-31` represents “no planned end”. The same representation is used in the business value, API contract, and storage model.

The sentinel has one meaning only. It must not be used to represent an unknown date, a date that has not yet been supplied, a value that does not apply, or a failed migration. Those cases retain the nullable or error semantics defined by the owning field.

`NULL` or an empty form value must not be interpreted as an open-ended date for a field governed by this rule. Existing records using a different open-end representation require an explicit migration and evidence before they participate in new interval writes.

### Interval predicates

For two closed date intervals `A=[a_start,a_end]` and `B=[b_start,b_end]`:

- They overlap when `a_start <= b_end AND b_start <= a_end`.
- `x` is inside `A` when `a_start <= x <= a_end`.
- `A` is strictly before `B` when `a_end < b_start`.
- `A` and `B` are adjacent when `a_end + 1 calendar day = b_start`.

Consumers must use the endpoint convention declared by the owning field. A half-open timestamp interval uses different predicates and must not reuse these date-only comparisons without conversion.

### Replacement and truncation

When an owning domain replaces one closed date interval with another and disallows same-day handoff, the old interval ends on `new_start - 1 calendar day`. The owning domain must still decide whether replacement is allowed, whether the old interval is immutable, and whether the resulting intervals must be adjacent.

The shared rule does not imply that every date interval must be continuous. Continuity, gap prohibition, adjacent equal-value merging, historical prepend, and correction behavior belong to the owning domain.

## Boundary conversion

When a date-only interval is queried against timestamped records, conversion must be explicit:

- The start boundary is the start of `start` in the declared business timezone.
- An inclusive end date becomes the exclusive instant immediately after the end date, namely the start of the following calendar day in that timezone.
- A timestamp query must not use `23:59:59` as a hand-written inclusive endpoint; precision and daylight-saving transitions can make that boundary incorrect.

The reverse conversion from an instant to a business date is valid only when the owning contract declares the business timezone. The client browser timezone is not an authority for business-date conversion.

## Input, API, and storage normalization

- UI date controls use `YYYY-MM-DD` values and keep start and end as separate fields until service validation.
- The service normalizes and validates date values before comparison or persistence. An empty optional input is normalized according to the owning field contract; it is never silently changed into `9999-12-31`.
- API and storage use the same canonical representation for an open-ended `DATE` interval. A serializer must not convert the sentinel to `NULL` on one boundary and back again on another.
- Error messages should identify the invalid endpoint or range. A failed validation produces no partial interval write.

## Ownership map

| Rule family | Shared date rule used | Owning document |
| --- | --- | --- |
| ContractPriceSegment and price-agreement validity | Closed date interval, overlap, open-end sentinel, adjacent-day replacement | The owning price-agreement Domain Model and PRDs |
| PriceAdjustment effective date | Date-only comparison and explicit as-of business date | The owning price-adjustment PRD and Domain Model |
| SettlementPeriod boundaries | Closed date endpoints and calendar-day arithmetic | The owning settlement-period PRD and Domain Model |
| Settlement-month and settlement-cycle derivation | Domain-specific month and fixed-day anchor rules | The owning settlement-period PRD |
| Access-control `valid_until` | Timestamp instant, exclusive cutoff, and authorization expiry | The owning access-control Domain Model and PRD |
| Date-range controls and layout | UI control geometry, paired start/end placement, and query-span limits | [Layout Interaction Spec](../ui-ux/specs/layout_interaction_spec.md) and [Component Usage Spec](../ui-ux/specs/component_usage_spec.md) |

## Examples of correct use

- A price agreement valid from `2027-01-01` with no planned end is stored and returned as `[2027-01-01,9999-12-31]`.
- Replacing that agreement on `2027-07-01` ends the old closed interval on `2027-06-30` when the agreement domain disallows same-day handoff.
- A query for the inclusive date range `2027-07-01` through `2027-07-31` becomes `[2027-07-01T00:00, 2027-08-01T00:00)` in the declared business timezone when querying timestamped records.

These examples illustrate the shared representation. They do not create or change any module-specific lifecycle rule.
