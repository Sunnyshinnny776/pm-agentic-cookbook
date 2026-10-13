---
authority: zh
translation_of: README.md
source_version: 2954431de08cfe967aa29b960bca78e39f0ca6ed
---

# PM Agentic Cookbook

This is an English translation; the [Chinese original](README.md) is authoritative.

An agentic workflow cookbook for product managers.
It currently focuses on enterprise products; other domains are extended through Providers.

## What problem it addresses

A single PRD skill can generate a requirements document. A complete product workflow
also needs business evidence, models, confirmed acceptance criteria, links between
implementation and test evidence, and a way to send gaps back upstream.
This cookbook places workflows, skills, reference rules, templates and executable
gates in one structure, so product teams can integrate these steps into their own work.

Users or maintainers decide confirmation and acceptance. Agents provide artifacts,
evidence and unresolved issues; they do not self-certify delivery. Domain rules are
selected through Providers and kept separate from generic instructions.

## Available content

This checkout contains directory scaffolding, documentation gates, gate regression
tests, and hook registrations for Claude Code and Codex. `skills/`, `specs/`,
`process/`, `templates/` and `examples/` currently contain only placeholders, with no
installable skills or complete workflow text. Gate results do not establish real
business acceptance. DSH bundle configuration does not establish runtime compatibility.

| Directory | Responsibility |
| --- | --- |
| `process/` | Stage transitions, verification loops and executor responsibilities |
| `skills/` | Independent instructions and required references, templates and build scripts |
| `specs/` | A scenario-based reference library selected by the consuming project's spec map |
| `templates/` | Workflow-level document skeletons |
| `examples/` | Synthetic or explicitly public-safe scenarios |
| `tools/` | Executable gates, regression tests and hooks |

## Local checks

Requires Node.js 22 or later, Git and Bash. No npm dependencies need to be installed.

```bash
npm run doc-sync
npm run test:gates
```

The incremental style gate needs complete history and `gates.baseRef` from
`cookbook.config.json`. The default base is `origin/main`. Fetch that branch before
running checks in a clone. A repository without any commits is checked through its
staged and untracked files. On pull requests, CI uses the common ancestor of the base
and HEAD; on pushes to main, it checks the current tree through the other gates,
while the incremental style gate only sees changes relative to its configured base
and local changes.

Hooks provide timely reminders and do not block operations; commands and CI provide
the actual check results. Gates cover directory/frontmatter conventions,
self-containment, domain nouns, private host paths, decision formats, incremental
style, translation metadata and thin agent adapters. The decision-format gate
explicitly skips when no decision directory is configured.

## Contributing and license

Read [CONTRIBUTING](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md)
and [security reporting guidance](SECURITY.md). Agents changing this repository
start with [AGENTS.md](AGENTS.md).

Repository content is licensed under the [Apache License 2.0](LICENSE).
Copyright and attribution information is in [NOTICE](NOTICE). Enterprise use,
adaptation and commercial redistribution are permitted, subject to the license's
notice-retention and modification-marking conditions. Separately licensed
third-party content retains its own terms.
