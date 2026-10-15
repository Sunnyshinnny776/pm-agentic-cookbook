---
authority: zh
translation_of: CONTRIBUTING.md
source_version: ff98cef3849ab4445712ed5af0f5ad1d04b49620
---

This is an English translation of [CONTRIBUTING.md](CONTRIBUTING.md); the Chinese original is authoritative.

# Contributing

Contributions of reproducible issues, synthetic cases, Providers and evidence-backed generic rule proposals are welcome.
Read the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues as described in [SECURITY.md](SECURITY.md).

## Changes and validation

External contributors fork the repository and create a focused branch. Agents
explicitly authorized by the maintainer may use repository task branches such as
`codex/<task>`, `claude/<task>` or `antigravity/<task>`. Submit changes through a pull
request to `main`; the maintainer reviews and merges it. Keep commit messages,
branch names, PR titles and Git workflow instructions in English. Use Conventional
Commit messages, preserve the contributor's author identity, and obtain explicit
authorization before committing, pushing or opening a PR on someone else's behalf.

Describe the concrete problem, result, affected artifacts, actual validation and remaining coverage boundaries.
Before committing, run `npm run doc-sync` and `npm run test:gates`. When changing a gate, add regression cases
showing that violations are rejected and valid inputs pass. Successful gates establish only their own checks;
they do not constitute maintainer acceptance.

## Skill and rule responsibilities

The Definition specifies the generic task, inputs, outputs and stop conditions, without domain nouns.
Providers supply explicitly selected domain rules. Consumers supply complete requests, domains and host conventions.
Execution-critical references belong inside the skill's own directory. Optional cookbook process pointers need a
standalone-install fallback. After changing the body or references, run the skill's build script, rebuild `dist/`,
and update its version and CHANGELOG. Run evals from source; do not include them in installation packages.

Shared rules follow “spec-capture proposal → maintainer decision”: provide the triggering scenario, evidence,
applicability boundaries, actual alternatives, smallest owning location and verification method.
Agents do not automatically approve new rules. Changes to audit skills need independent verification;
authors must not audit their own artifacts.

## Chinese authority and English synchronization

Documents with `.en.md` sidecars use the Chinese original as the authority. Change Chinese first when rules or
meaning change, then synchronize English; never change only an English rule. The translation opens with a
Chinese-authority statement and uses these fixed metadata fields:

```yaml
---
authority: zh
translation_of: README.md
source_version: <raw-git-blob-hash>
---
```

`translation_of` names the Chinese file in the same directory. After synchronizing the English content, run from the repository root:

```bash
git hash-object --no-filters README.md
```

Put the result in the corresponding translation's `source_version`, then run `npm run doc-sync`.
`--no-filters` records the original file bytes regardless of local Git filters. Stale translations warn;
missing originals or invalid metadata fail.
Synchronize stale sidecars before distributing documents; a development warning does not establish translation freshness.
`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `AGENT_GUIDE.md` and `llms.txt`
are English-only and have no sidecars. Preserve the standard LICENSE text.

## Agent rulebooks

Contributor registrations are in `.claude/settings.json` and `.codex/hooks.json`, locating scripts from the repository root.
Registration examples in `tools/hooks/` are for embedding the cookbook in another host. They assume a
`pm-agentic-cookbook/` directory under that host's root; adjust path prefixes as the examples describe when the location differs.

`AGENTS.md` is the sole contributor authority. The first line of `CLAUDE.md` and `GEMINI.md` imports it through
host-supported `@AGENTS.md` or `@./AGENTS.md` syntax. The remainder contains only host integration information.
Each adapter is limited to 40 lines and does not repeat shared rules. The gate rejects shared-rule headings
such as rules, permissions and Git workflows. The first paragraph of `AGENTS.md` distinguishes using the toolkit from modifying it.

## Authorization and content boundaries

Submit only material you are entitled to contribute under the project license, and retain existing copyright and license notices.
Contributions do not transfer the original author's copyright. Unless expressly stated otherwise or covered by another agreement,
contributions intentionally submitted for inclusion are licensed under Apache-2.0. Mark modified files when redistributing them
and preserve applicable NOTICE content. Do not submit customer data, credentials, private paths or external reference materials.
Use synthetic data or material explicitly authorized for public use in examples.
