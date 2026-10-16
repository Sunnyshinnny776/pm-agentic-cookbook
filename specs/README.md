# Specs: Reference Rule Library

This directory is a **reference rule library**: a starter set of product, UI/UX, integration, engineering, security and testing rules for B2B products. Copy it into your project and change it to fit; nothing here is binding on your project until you adopt it.

The skills do not depend on this directory. They find rules through the `host.specMap` section of your project's `cookbook.config.json`, which maps each rule role to your own spec files or directories. These specs are one ready-made way to fill that map.

## Rule Domains

| Directory | Contents | `specMap` role |
| --- | --- | --- |
| [`spec_loading_rule.md`](./spec_loading_rule.md) | Which specs to load before a task, and how to capture new rules afterwards | `loading-rule` |
| [`ui-ux/`](./ui-ux/ui_ux_specification.md) | UI/UX index and modular specs: role navigation, color, components, list query, layout, feedback, action icons, UX writing, diagrams | `ui-ux` |
| [`integration/`](./integration/README.md) | External system integration rules, the external-approval (OA) pattern, and module-level contract patterns | `integration` |
| [`engineering/`](./engineering/) | Frontend module architecture, async contracts, money arithmetic, and date-interval semantics | `engineering` |
| [`security/`](./security/) | Sensitive data export, file encryption, download authorization and audit trail | `security` |
| [`testing/`](./testing/) | Test conventions with the PRD as the oracle, honest reporting and case traceability | `testing` |

Start with [Spec Loading and Capture Rule](./spec_loading_rule.md); it routes each task to the specs it needs.

## Adopting the Library

1. Copy the directories you need into your project and register them in `host.specMap`, for example:

   ```json
   {
     "host": {
       "specMap": {
         "index": ["docs/specs/README.md"],
         "loading-rule": ["docs/specs/spec_loading_rule.md"],
         "ui-ux": ["docs/specs/ui-ux/ui_ux_specification.md", "docs/specs/ui-ux/specs"],
         "integration": ["docs/specs/integration"]
       }
     }
   }
   ```

2. Replace the bracketed examples with your own business terms. Each rule is written generic-first, with examples kept separable, so changing an example never requires rewriting the rule.
3. Drop or adapt the specs that do not match your stack. The UI/UX component and layout rules assume a React + Tailwind component library, and the testing commands assume a Node toolchain; treat those parts as one possible implementation.
4. From then on the specs are yours: update them through the Spec Capture Check in the loading rule.

## Examples Used in These Specs

All business examples describe one fictional retail chain: a group headquarters, regions and stores; an annual purchase-plan task that headquarters distributes, stores compile and regions aggregate; approval in an external OA system; and a monthly supplier settlement run. The names are illustrative and carry no meaning beyond the rule they illustrate.
