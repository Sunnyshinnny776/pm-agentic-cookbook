---
authority: zh
translation_of: CHANGELOG.md
source_version: 5d4fd1a670e3ee228260256ffabd717fdb35cc5f
---

This is an English translation of [CHANGELOG.md](CHANGELOG.md); the Chinese original is authoritative.

# Changelog

## Unreleased

- Route audits through Allow / Ask / Deny based on the current goal and adopted workflow, preserving the complete workflow, independent audits and relevant open findings; add 12 audit-routing evaluation requests.
- Clarify repairs and rechecks under existing task authorization and restore English context budgets. check-prd, consistency-audit, journey-audit and source-intake are v0.2.1; test-authoring is v0.1.1. Distribution packages match their sources.
- Extend the reference library with business timezones, persistence and recovery, view invalidation, cross-module references, account navigation and resource tabs, shared overlays and list controls.

## v0.1.0 (2026-10-19)

First public release.

- Provide eleven independently distributable skills: source intake, domain modeling, business acceptance criteria, requirements document generation, requirements document quality audit, complex table design, prototype generation, test authoring from requirements, end-to-end journey audit, consistency audit and spec capture. Each skill's version is in the `CHANGELOG.md` in its directory.
- Provide the workflow overview, verification loops, architecture conventions, agent execution protocol, decision archive mechanism and versioning rules.
- Provide a reference rule library: UI/UX, integration, engineering, security and testing specs, plus the spec loading and capture rule.
- Provide workflow document templates.
- Provide the agent usage guide `AGENT_GUIDE.md`, the `llms.txt` index and two agent onboarding evaluation cases.
- Provide three examples: a spec capture example, how to write a domain Provider, and an audit baseline structure example.
- Provide documentation gates with no npm dependencies, regression tests and agent hook registrations.
- Provide contributor instructions, Chinese-authoritative translation conventions and Apache-2.0 license notices.
