---
authority: zh
translation_of: README.md
source_version: 4fb63218fe7752d35a49e2119eca6d59f4802a23
---

# PM Agentic Cookbook

This is an English translation; the [Chinese original](README.md) is authoritative.

> 🚀 An end-to-end agentic methodology cookbook for product managers.
>
> It currently focuses on enterprise (B2B) products; other domains are extended through domain Providers.

## What is it?

A standardized toolkit that helps **product managers** work with AI agents across the **whole product design lifecycle**.

You do not need deep programming experience. With a method for working with AI, you can independently handle:

1. 📊 Source material intake, business research and domain modeling
2. 📝 Business acceptance criteria, PRD generation and quality audit
3. 🎨 Front-end code prototype demos for quick validation, and complex tables
4. 🧪 Tests derived from requirements, end-to-end journey audits and consistency audits
5. 📚 Capturing reusable rules into specs at the end of each stage

## What's new in v0.1.0

- **End-to-end workflow and eleven skills** — covers the complete workflow from source intake to requirements acceptance and final verification, advancing each stage only after user confirmation. Each of the eleven skills is distributed on its own: a universal prompt for any LLM and a `.skill` package for agents that support skills.
- **Domain Providers and a reference rule library** — generic instructions are kept apart from domain rules, and `create-prd` and `check-prd` ship with an HR domain Provider. Reference specs cover UI/UX, integration, engineering, security and testing.
- **Executable gates and agent onboarding** — documentation gates and regression tests with no npm dependencies, hook registration samples for Claude Code and Codex, and the agent usage guide `AGENT_GUIDE.md` with its `llms.txt` index.
- **Examples and upstream licensing** — three examples cover spec capture, writing a Provider and an audit baseline. The two PRD skills derive from pmYangKun's upstream repositories and are distributed under Apache-2.0 with the original notices retained.

See the [changelog](CHANGELOG.en.md) and [release notes](https://github.com/Sunnyshinnny776/pm-agentic-cookbook/releases) for the full list.

## What problem it addresses

A single PRD skill can generate a requirements document. A complete product workflow
also needs business evidence, models, confirmed acceptance criteria, links between
implementation and test evidence, and a way to send gaps back upstream.
This cookbook places workflows, skills, reference rules, templates and executable
gates in one structure, so these steps connect and each gap returns to the stage
that produced it.

Users or maintainers decide confirmation and acceptance. Agents provide artifacts,
evidence and unresolved issues; they do not self-certify delivery. Domain rules are
selected through Providers and kept separate from generic instructions.

## Repository layout

```
pm-agentic-cookbook/
├── process/                      # Workflow documents
│   ├── overview.md               # Workflow overview and stage navigation (for PMs)
│   ├── loop-engineering.md       # Verification loops, gates and hooks, stop and audit boundaries, eval interface
│   ├── kit-architecture.md       # Architecture conventions: capability seam, directory and frontmatter standards, host contract
│   ├── agent-execution-protocol.md # Agent execution protocol: stage executor matrix and subagent dispatch
│   └── decision-archive.md       # Decision archive: records why things are this way, and what was rejected
├── skills/                       # Agent instructions; each skill is self-contained and distributable on its own
│   ├── source-intake/            # Stage 0: source material intake and requirements research
│   ├── domain-modeling/          # Stage 1: domain modeling
│   ├── acceptance-criteria/      # After stage 1: business acceptance criteria, confirmed item by item before the requirements document
│   ├── create-prd/               # Stage 2: requirements document generation (with a flowchart generator and an HR domain Provider)
│   ├── check-prd/                # Stage 3: requirements document quality audit (14 dimensions, with an HR domain Provider)
│   ├── table-template-designer/  # Stage 4: complex table design
│   ├── ui-generator/             # Stage 4: prototype generation (with design tokens and default UI/UX rules)
│   ├── test-authoring/           # Stage 5: tests derived from the requirements document
│   ├── journey-audit/            # Stage 5: end-to-end journey audit
│   ├── consistency-audit/        # Any stage: consistency audit between artifacts
│   └── spec-capture/             # End of a stage: capture reusable rules into specs
├── specs/                        # Reference rule library: UI/UX, integration, engineering, security, testing
├── templates/                    # Templates used by workflow documents
├── evals/                        # Agent onboarding evaluations: usage and contribution scenarios
├── tools/
│   ├── gates/                    # Executable gates and regression tests, run together by `doc-sync.mjs`
│   └── hooks/                    # Agent hook scripts with Claude Code and Codex registration samples
└── examples/                     # Synthetic or sanitized usage cases
```

Every skill directory has the same structure: `SKILL.md` (instructions for the agent), `README.md`
(for people), `references/` (details loaded on demand), `scripts/build.py` and `dist/`
(the universal prompt and the `.skill` package), `evals/` (quality evaluation cases) and
`CHANGELOG.md`. See the [architecture conventions](process/kit-architecture.md).

## Who it is for

- B2B product managers, especially in rule-heavy domains such as HR, finance and ERP
- Product teams that want AI to raise their output
- Technical product managers who design products and prototypes with AI agents

## How to use it

1. Get the repository: `git clone https://github.com/Sunnyshinnny776/pm-agentic-cookbook.git`.
2. Follow the [workflow overview](process/overview.md) stage by stage, using the matching skill in any of three ways:
   - **Any LLM**: paste the skill's `dist/<skill>-universal-prompt.md`, then provide the input;
   - **Agents that support skills** (such as Claude Code and Codex): install `dist/<skill>.skill`, or place the skill directory in the agent's skill directory;
   - **When domain rules are needed**: packages contain only the generic part; provide the domain's `references/providers/<domain>/` through the Provider interface in the [architecture conventions](process/kit-architecture.md), and state which domain to apply. `create-prd` and `check-prd` ship with an HR domain Provider, loaded when you name the `hrm` domain; without a named domain they run only the generic framework.
3. For long-term use in your own project, put a `cookbook.config.json` in the project root to tell skills, gates and hooks about the project layout (see below).
4. When you need a starting set of rules, copy the specs you need from the [reference rule library](specs/README.md) into your project and adapt them.

## For AI agents

Agents that **use** this repository in a user's project start with [AGENT_GUIDE.md](AGENT_GUIDE.md): which skill fits which user intent, how to install, how to read the host configuration, and which actions need the user's consent first. [llms.txt](llms.txt) is an index following the llms.txt convention. Agents that **change** this repository start with [AGENTS.md](AGENTS.md).

## Connecting your project: `cookbook.config.json`

Skill instructions contain no project paths. Which specs to read, where artifacts go and
which directories the gates scan all come from `cookbook.config.json` in the project root.
Each of its three sections has one job:

| Section | Purpose |
| --- | --- |
| `host` | Host contract: specs registered by role (`specMap`), the module documentation directory (`moduleDocs`), test and process-record directories inside a module, and agent rule files. A skill that cannot read a field it needs stops and asks you instead of guessing |
| `gates` | Gates: skill directories, scan scope, the exemption list, domain word lists, private project path fragments and project-specific gates |
| `hooks` | Hooks: which path changes trigger checks or reminders, and the commands run at the end of a session |

Minimal example (the cookbook sits in `pm-agentic-cookbook/` under the project root):

```json
{
  "gates": {
    "styleScanRoots": ["specs"]
  },
  "host": {
    "specMap": { "ui-ux": ["specs/ui"], "testing": ["specs/test-rules.md"] },
    "moduleDocs": "product/<module>",
    "testsDir": "qa",
    "processRecordsDir": "records"
  }
}
```

Without a configuration file, the gates check only the cookbook itself. Field meanings and
constraints are in sections 6 (gates and hooks) and 9 (host contract) of the
[architecture conventions](process/kit-architecture.md); hook registration samples are in `tools/hooks/`.

The domain-noun gate scans the generic layer of each skill. The cookbook has one known false positive: the "typical products" column of the product-type table in create-prd lists HRM alongside ERP and CRM as a software category, not a business domain. This repository registers the exemption in `.verify-baseline.json`; when you run the gates in your project, register the same entry in the exemption list that `gates.baselineFile` points to, with the path adjusted to where the cookbook sits in your project.

## Stage gates

The default workflow is gated by stage: Source Intake → Domain Model → Acceptance Criteria →
PRD Draft → PRD Audit → UI Prototype → Test → Requirements Acceptance & Final Verification.
After each stage the AI reviews its own output, then the user reviews it;
the next stage does not start until the user explicitly confirms. When an AI agent runs the
workflow, audits and journey walkthroughs must be done by an independent subagent (authors
never audit their own work); see the [agent execution protocol](process/agent-execution-protocol.md)
for the executor matrix and dispatch rules.

## Local checks

Requires Node.js 22 or later, Git and Bash. No npm dependencies need to be installed.

```bash
npm run doc-sync
npm run test:gates
```

The incremental style gate needs complete history and `gates.baseRef` from
`cookbook.config.json`. The default base is `origin/main`; fetch that branch before
running checks in a clone. A repository without any commits is checked through its
staged and untracked files. On pull requests, CI uses the common ancestor of the base
and HEAD; on pushes to main, the other gates check the current tree, while the
incremental style gate only sees changes relative to its configured base and local changes.

Hooks provide timely reminders and do not block operations; commands and CI provide
the actual check results. Gates cover directory/frontmatter conventions,
self-containment, domain nouns, private host paths, decision formats, incremental
style, translation metadata, package-to-source consistency, the agent routing table and index,
CHANGELOG version format and thin agent adapters. The decision-format gate
explicitly skips when no decision directory is configured. Gate results do not establish
real business acceptance. The `dsh` field in `package.json` and `cordis.patch.yml` are packaging configuration
for a compatible agent harness and do not establish runtime compatibility.

## Versions

The repository and each skill use semantic versions separately: the repository version is in
the [CHANGELOG](CHANGELOG.md) and Git tags, and each skill's version is in the `CHANGELOG.md`
in its directory.

## From real project work

The workflow, rules and skills in this cookbook were distilled from a real B2B compensation
system project for a large enterprise group: source intake, domain modeling, requirements
documents, prototypes, tests and audits were all used and repeatedly revised in that project.
The project's own business materials, requirements documents and code are not published with
this repository, and the examples in `examples/` are sanitized. The verified scope of each skill
is defined by the cases under its `evals/`.

## A note from the author

I'm Sunny, the author of this repository and a B2B product manager.
This cookbook comes from business system work I did with Claude and Codex: through round after round of rework, we kept validating the agent workflow and distilling rules, and finally organized them into a workflow for product managers.
Into this workflow I have put some modest hopes for how product management can change in the AI era, and I'm sharing them here.

- **Output can be delegated to agents; someone still has to own the basis for judgment.** The business rules you answer offhand when a colleague asks are invisible to an agent unless they are written down.
- **The problem with a PRD is not its length but its density.** Give every business rule a source, conditions and an outcome, and describe exception branches as fully as the normal path; every paragraph should remove one ambiguity downstream.
- **Move clarification and verification earlier.** Business questions that must be answered sooner or later are worth answering early. This workflow stops to ask you when materials are missing or rules conflict, and it needs you to read reports and make calls; measure it by whether the work at hand involved a little less guessing and one less round of rework.
- **It is a heavy workflow.** It suits systems or major releases with complex business rules, states and collaboration; for small everyday changes, use individual skills as needed.
- **The stronger the models, the less scaffolding we should need, and the clearer the remaining business criteria should become.** I hope this project's progress will show in how many of its own rules it can "iterate away".

> The model's instructions will fade, but your criteria will remain.

## Contributing and license

Read [CONTRIBUTING](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md)
and [security reporting guidance](SECURITY.md). Agents changing this repository
start with [AGENTS.md](AGENTS.md).

Repository content is licensed under the [Apache License 2.0](LICENSE).
Copyright and attribution information is in [NOTICE](NOTICE). Enterprise use,
adaptation and commercial redistribution are permitted, subject to the license's
notice-retention and modification-marking conditions.

The two PRD skills are derived from pmYangKun's upstream repositories and are used and distributed under Apache-2.0. Original copyright and contributor notices are retained in each skill's LICENSE and NOTICE and this repository's [NOTICE](NOTICE). Our modifications do not imply endorsement by the upstream author.

## Sources and acknowledgements

- **PRD methodology**: this repository was inspired by the [create-prd](https://github.com/pmYangKun/create-prd-skill) and [check-prd](https://github.com/pmYangKun/check-prd-skill) skills open-sourced by product manager pmYangKun. Building on them, refined through my own work and reflection, they grew into a PM agentic workflow covering requirements review and planning, PRD generation and checking, system design, test design and prototype generation. Since becoming a product manager, I have read pmYangKun's books [决胜B端 and 决胜体验设计](https://book.douban.com/subject/36436108/), which have deeply inspired and influenced me; the requirements methodology in this repository also learns from and benefits from pmYangKun's public articles and works. Many thanks to pmYangKun for the dedicated work in the industry; you are welcome to follow and learn from more of pmYangKun's work.
- **Skill structure and the decision archive**: the capability seam roles and directory/frontmatter standards in the
  [architecture conventions](process/kit-architecture.md), and the directory and format of the
  [decision archive](process/decision-archive.md), follow conventions borrowed from a public open-source agent harness.
  Each document's "Sources" section states what was borrowed and what this cookbook added.
