# Contributor instructions

If your goal is to use this toolkit in another project, read `AGENT_GUIDE.md`.
If that guide is absent, report that the usage guide is unavailable and do not infer
installation support. The instructions below govern agents modifying this repository.

## Repository map

- `process/`: workflow stages, verification loops and executor responsibilities.
- `skills/`: independently usable instructions, references, templates and build scripts.
- `specs/`: a reference rule library selected through the consuming project's spec map.
- `templates/`: workflow-level document skeletons.
- `examples/`: synthetic or explicitly public-safe scenarios.
- `tools/`: gates, regression tests and advisory hooks.

## Skill changes

Resolve the Definition, Provider and Consumer roles before changing a skill.
Keep domain nouns out of the Definition; put domain-specific rules in an explicitly
selected Provider. Consumers supply complete requests and host conventions.
Keep execution-critical references inside each skill. Optional cookbook pointers
must include a standalone-install fallback. Rebuild the skill's `dist/` after
changing its body or references, and record the version in its CHANGELOG.
Run evals from the source directory, not from installation packages.

## Validation and decisions

Before committing, run `npm run doc-sync` and `npm run test:gates` and inspect the
exact diff. Report each command's numeric exit code and every failure or skipped
check; if the tool output omits the exit code, capture it instead of inferring it.
Gates do not certify business acceptance. Hooks are advisory.
Propose reusable rules through spec-capture; the maintainer decides whether to
adopt them. Do not self-certify approval. Use an independent reviewer for changes
to audit skills: authors must not audit their own artifacts.

## Language and translations

Reply in the user's language. Chinese documents are authoritative where an English
sidecar exists. Change Chinese first, synchronize the English text and update
`source_version` using `git hash-object --no-filters`. Never change only an English
rule. Agent-facing files are English-only and do not have sidecars.

## Contribution and licensing

External contributors use a fork and a focused branch, then submit a PR to `main`.
Agents explicitly authorized by the maintainer may use task branches in this
repository, such as `codex/<task>`, `claude/<task>` or `antigravity/<task>`.
Only the maintainer merges. Use English Conventional Commit messages and English
branch names and PR text. Preserve human author identity. Obtain explicit user
authorization before commit, push or PR actions performed on their behalf.
Keep changes surgical. Do not commit private data, credentials, external reference
materials, or identifiable customer content. Preserve applicable copyright,
license and NOTICE information; mark modifications to redistributed files.
This repository uses Apache-2.0; separately licensed material retains its terms.
When authority, permissions, license ownership or scope is unclear, stop and ask.

## Host adapters

`CLAUDE.md` and `GEMINI.md` import this file and contain only host integration
information. Keep each adapter at or below 40 lines and omit shared-rule headings.
