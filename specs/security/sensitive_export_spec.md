---
description: Use when exporting sensitive business data to downloadable files and defining encryption, authorization, link, retention, audit, and failure rules.
applies_to:
  - sensitive data export
  - password protected file
  - one-time download link
  - export audit
  - export permission recheck
related_specs:
  - ../integration/external_integration_spec.md
  - ../testing/testing_spec.md
---

# Sensitive Export Security Spec

## Scope

This spec defines reusable security rules for downloadable exports containing sensitive data. Module PRDs own exportable fields, business permissions, row limits, and approval thresholds; this spec owns file-content encryption, authorization timing, temporary plaintext, download links, retention, audit, and failure behavior.

## Content Encryption

- A password-protected export must use password-to-open file-content encryption. Worksheet, workbook, PDF permission, or archive-structure protection alone does not satisfy this requirement.
- The selected format and library must support an approved modern encryption mode. Project implementations should document the exact algorithm and compatibility target (for example, OOXML Agile Encryption with AES-256).
- The service must verify that the produced artifact cannot expose content without the password before making it downloadable.
- Plaintext may exist only in memory or on an encrypted temporary volume. Persistent object storage receives only the encrypted artifact.
- Failed generation, encryption, verification, or password delivery must destroy plaintext, incomplete artifacts, links, and server-side key material.

## Authorization And Data Scope

- Recheck base export permission, sensitive-field permission, organization/data scope, and current user identity when the task is created and again immediately before download.
- Permission revocation after file generation invalidates the link. Previously generated data must not bypass the current authorization decision.
- Export fields use an allowlist. Prohibited fields and out-of-scope rows must never enter the intermediate dataset.
- Sensitive-field permission is additive to base export permission and cannot operate independently.

## Password And Download Delivery

- Generate passwords with a cryptographically secure random number generator; do not derive them from personal data, usernames, timestamps, or business IDs.
- Deliver the password through a channel separated from the file link and visible only to the requesting identity.
- Download links are time-limited and, for high-sensitivity exports, single-use.
- Used, expired, revoked, or cleaned links return an explicit non-sensitive status and never reveal whether unauthorized data existed.

## Retention And Cleanup

- Each module defines the shortest practical retention window. The same deadline applies to encrypted files, links, password-verification material, and server-side key material.
- Cleanup jobs are idempotent and auditable. Retry cleanup failures and alert administrators after exhaustion.
- Regeneration creates a new task, artifact, password, link, and audit record; it does not reactivate an expired link.

## Audit And Monitoring

Record requester, task ID, time, query/data-scope summary, field codes, sensitive-field flag, row count, artifact hash, encryption result, permission checks, download result, cleanup result, and failure category. Logs must not contain plaintext exported values or passwords.

Monitor export failure rate, repeated large exports, abnormal per-user frequency, repeated denied downloads, password-delivery failures, and cleanup backlog. Thresholds belong to the module PRD or security operations configuration.

## Acceptance Baseline

- Opening the file without the password cannot reveal any workbook, document, or archive content.
- Structure protection without content encryption fails validation.
- Permission revocation between generation and download blocks access.
- Expired or used links cannot be reactivated.
- Plaintext and key material are absent after success-window expiry and after any failed task.
- Audit evidence can reconcile the encrypted artifact hash without recording sensitive values.
