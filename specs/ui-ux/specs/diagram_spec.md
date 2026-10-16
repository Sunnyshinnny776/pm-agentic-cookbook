---
description: Use when authoring or editing any hand-drawn SVG diagram that ships with a PRD — business flow diagrams (overview and node-level) and architecture diagrams (system framework, application architecture, feature-module architecture).
applies_to:
  - business flow diagram
  - architecture diagram
  - SVG diagram style
  - swimlane layout
  - diagram shape semantics
  - edge annotation
related_specs:
  - ./color_system_spec.md
  - ./ux_writing_semantic_spec.md
  - ../../spec_loading_rule.md
---

# Diagram Spec

## Scope

This spec governs every hand-drawn SVG diagram shipped alongside a PRD: business flow diagrams (10.1.3 overview and 10.2.x.1 node-level) and the three architecture diagram types (system framework, application architecture, feature-module architecture). It defines the shape dictionary, lane layout, edge information density, and the project palette.

Carrier selection (which diagram class is SVG versus Mermaid) is owned by the PRD authoring skill; this spec assumes SVG has already been chosen and defines how that SVG must look and what it must carry.

Mermaid diagrams (ER models, state machines) are out of scope.

## Core Principle

A business flow diagram must let a reader reconstruct the **real** business flow — every branch, every rollback, every cross-system handoff, and the exact state the object lands in after each transition. A diagram that only shows the happy path in summarized boxes fails this spec, however clean it looks.

## Shape Dictionary (shape carries meaning)

Shape choice is semantic, not decorative. Do not use one shape for two meanings.

| Shape | Meaning | Style class |
| --- | --- | --- |
| Capsule / rounded ellipse | Start or entry point | `.start` |
| Rectangle, solid fill, white text | **Processing step** — an actor or the system performs an action | `.n` / `.nt` |
| Diamond | **Decision** — must have two or more labelled out-edges | `.dec` / `.dect` |
| **Folded-corner document** (white fill, coloured border, wavy bottom edge) | **State landing point** — the flow deposits a state that a counterpart role or system can observe; no action is performed here | `.doc` / `.doct` |
| Pill, success fill | Terminal success state | `.term` / `.termt` |
| Rectangle, alert fill | Blocked / rejected state awaiting retry, correction, withdrawal, or another explicit next step | `.stop` / `.stopt` |
| Dashed-border box | Side capability, platform band, or explanatory note | `.side` / `.sidet` |
| Rectangle with double side bars | **Subprocess** — control passes into another defined flow | `.sub` / `.subt` |
| Folded-corner card (warm fill) | **Note card** — explanatory text; not part of the flow, carries no edges | `.note-c` / `.notet` |
| Parallelogram | **Data landing point** — data input/output | `.data` / `.datat` |
| Cylinder | **Database** — persistent store | `.db` / `.dbt` |
| Stacked wavy documents | **File landing point** — a set of documents/records produced | `.docs2` / `.docs2t` |

The **processing step versus state landing point** distinction is mandatory. Rendering an observable status as a plain rectangle hides whether a node does work or merely records an outcome.

### One step, one node

**Each node represents exactly one step. Never compress several steps into one node's text with arrows** (e.g. `编制计划 → 校验金额 → 提交区域 → 通知审批人` in a single box). Compressing steps discards each step's own status, validation, and failure branches, and makes the flow untraceable. Split the sequence into one node per step, connected by edges.

## Lane Layout

- Lanes are vertical, with a solid header bar (dark fill, white text) naming the lane.
- **Lane division follows the participating party or system**, not only the human role. A flow that spans systems must give each system its own lane (e.g. `支付平台` / `物流服务商` / `供应商`), so cross-system handoffs become visible lane crossings.
- Where the diagram expresses a specific dimension (functional view, data view), label it with rotated text outside the leftmost lane.
- **The main trunk runs down the lane's centre line** (nodes centred in their lane); only a **side branch** (a block/reject box, a note) is offset horizontally off the centre line. Keeping the trunk centred lets successive trunk nodes connect with straight vertical edges instead of forced dog-legs.
- **Lane width is not uniform — it adapts to content.** A lane holding a decision plus a side-branch block box, or an unusually wide node, is widened so everything fits inside that lane; a lane with only trunk nodes stays at the minimum width. Never shrink or clip a node, and never let a node overflow into the neighbouring lane, to fit a fixed lane width.
- **The lanes together span the same width as the title bar** (uniform left/right margin); the lane band and title are flush.
- Cross-lane interaction and system-triggered links use dashed edges.

### Phase Grouping

- Wrap a multi-lane sub-stage in a **coloured dashed frame** (accent colour, distinct from the main palette) to mark it as one business phase (e.g. the refund phase inside an order payment flow). The frame spans all lanes the phase touches.
- Where several parallel terminal or branch states converge on the same successor, **aggregate them in an accent-bordered group box** and draw one edge out of the group, instead of drawing one crossing edge per state.

## Edge Information Density

This is the section that separates a real flow diagram from a summary sketch.

**Where the state is written — one place, not two.** The state after a transition is carried by the **state landing point node** the edge points into (that node's whole purpose is to hold an observable state). Do not also repeat `状态：…` on the edge — writing it in both places is redundant and, on short horizontal edges, the two labels collide. The edge itself carries the *action*; the node it lands in carries the *resulting state*.

- **Edge into a state landing point** → edge label = action / interface / condition only (e.g. `保存成功`, `确认撤回`); the node states the result (e.g. `状态：WITHDRAWN（已撤回）`).
- **Edge into a processing step or decision** (no landing-point node) and the object changes state there → the edge may carry `状态：{value}` as a second line, since no node holds it.

Rules:

1. **State appears exactly once along each transition** — in the landing-point node if there is one, otherwise on the edge. A reader can still read the state machine off the diagram by reading each landing point.
2. **State values must be exact, including sub-states.** Write the parenthesised sub-state (e.g. `待付款（待补发票）`, `待付款（已补发票）`, `待付款（复核不通过）`); a bare parent state is insufficient when sub-states exist.
3. **Cross-system edges must carry the interface identifier and what is synchronised** (e.g. `接口 3.2 同步结算申请信息`), so the edge is traceable to the integration spec.
4. **Rollback, rejection and supplement-request edges are annotated to the same density as the happy path** — an action label plus a landing point stating the resulting state. Under-annotated exception paths are the most common defect.
5. **Every decision out-edge is labelled with its condition** (`是` / `否`, `通过` / `审核不通过`).
6. State values must match the owning PRD's state machine and Domain Model enumerations verbatim.
7. **A label may not overlap another label or a node it does not belong to.** Short edges (< ~80px) that cannot fit a label without overlapping should push the label to the target node or drop a redundant action word rather than stack text. This is caught by the validator's text-overlap check and, definitively, by rendering to PNG and looking.

## Completeness Rules

- **Exactly one start node and exactly one terminal node per diagram.** Only the terminal shape ends the flow. A blocked/rejected node (`.stop`) remains inside the flow: its outgoing edge must show the next business step, such as correction, retry, withdrawal, or convergence on the single terminal. If a submission sequence ends while the business object remains, show both the sequence result and the business object's next state; do not leave either path at a blocked node.
- Except for the start and terminal nodes, every flow node, including `.stop`, has at least one in-edge and one out-edge. No orphan or dead-end nodes. Note cards are exempt (they are annotations, not flow).
- Every branch of a decision reaches a state landing point or another explicit flow step, then continues or converges on the single terminal. A decision may not leave a branch unresolved.
- **Every diagram carries a legend strip along its bottom edge**, listing each shape used in that diagram with its Chinese name, plus the two edge styles (same-lane flow, cross-lane/system link). A reader must be able to decode every glyph without leaving the image.
- The overview diagram's lanes and trunk nodes must cover the trunks of all node-level diagrams; node-level diagrams add detail, never contradict the overview.
- Each diagram is followed in the document by a prose walkthrough of the flow.

## Edge Routing

### Line-crossing bridge

When two independent flow edges cross inside the diagram without joining, draw a small semicircular bridge on the edge in the upper SVG layer. The bridge replaces a short segment of that upper edge at the crossing; the lower edge continues straight beneath it. Use the upper edge's stroke colour, width, and solid/dashed style for the arc. Keep the arc centred on the crossing, with a consistent 6–8px radius at the SVG's native size: horizontal edges bulge upward, and vertical edges bulge toward the clearer side. Keep the bridge clear of arrowheads, labels, nodes, lane borders, and other bridges; reroute a crowded crossing before adding the bridge.

An endpoint, deliberate merge/split, or shared node is a connection, not a crossing bridge. Parallel overlap is invalid and must be rerouted; a bridge must not disguise it. Render the SVG at both document display size and native size to verify that the reader can follow each edge through the crossing.

Route by the two nodes' relative position; do not hand-place waypoints:

- **Same column** (aligned x) → a straight **vertical** edge, bottom-mid of source to top-mid of target.
- **Same row** (aligned y) → a straight **horizontal** edge, side-mid to side-mid.
- **Different row and column** → a single-elbow orthogonal edge; pick the turn by the dominant direction (mostly-vertical → down then across; mostly-horizontal → across then down). Never a diagonal, never a multi-bend zig-zag.
- The arrowhead lands on the target's border (a rectangle edge mid-point, a diamond vertex), never short of it and never on empty space near a diamond's tip. Do not split one polyline into "a short arrowed segment + a following path" — that strands the arrowhead mid-air.
- **No two edges may run collinear over an overlapping span.** Two edges sharing a horizontal or vertical line make the flow ambiguous — a reader cannot tell which arrow belongs to which path. When one node fans out to several targets in the same direction, stagger the runs (the generator offsets each subsequent branch and drops it out of the node's bottom edge). The validator flags any collinear overlap beyond 12px.

## Palette and Style Classes

Diagrams are version-controlled artifacts. Define styles once in `<defs><style>` and reuse classes; do not inline per-node styling.

Base font: `'PingFang SC','Microsoft YaHei',sans-serif`.

| Purpose | Class | Fill | Stroke | Text |
| --- | --- | --- | --- | --- |
| Lane body | `.lane` | `#F7FAFD` | `#C9D6E8` | — |
| Lane header | `.lanehead` / `.laneheadt` | `#4A6FA5` | — | `#fff`, 14px, 600 |
| Start | `.start` | `#DCEAF9` | `#4A6FA5` | `#25395a` |
| Processing step | `.n` / `.nt` | `#7EA6E0` | `#4A6FA5` | `#fff`, 12.5px |
| Decision | `.dec` / `.dect` | `#DCE8F7` | `#4A6FA5` | `#25395a`, 12px |
| State landing point | `.doc` / `.doct` | `#FFFFFF` | `#4A6FA5` | `#25395a`, 12px |
| Terminal success | `.term` / `.termt` | `#CFE6C9` | `#6BA36B` | `#254a25`, 12.5px, 600 |
| Blocked terminus | `.stop` / `.stopt` | `#F6D9D5` | `#C0625A` | `#7A2E28`, 12px |
| Side / note box | `.side` / `.sidet` | `#EDF1F7` | `#9FB4CE` dashed | `#33405A`, 12.5px |
| Solid edge | `.edge` | — | `#4A6FA5`, 1.6 | — |
| Dashed edge (cross-lane, system-triggered) | `.dash` | — | `#8B98AE`, 1.4, dash `5 4` | — |
| Edge label (solid) | `.lbl` | — | — | `#4A6FA5`, 11px |
| Edge label (dashed) | `.dlbl` | — | — | `#7C889E`, 11px |
| Footnote | `.note` | — | — | `#6A7A95`, 11.5px |
| Phase frame / enum group | `.phase` / `.enumgrp` | none | `#E8944A` dashed | `#B36A22`, 11.5px |

Architecture diagrams reuse the same palette and add band-level classes:

| Purpose | Class | Fill | Stroke |
| --- | --- | --- | --- |
| Layer band | `.band` / `.bandlabel` | `#F5F9FF` | `#C3D4EC` |
| Group inside a band | `.grp` / `.grplabel` | `#E9F1FC` | `#B9CDE8` |
| Platform capability node | `.plat` | `#5E82BE` | `#3F5F94` |
| Data store node | `.db` | `#6C8EBF` | `#45618C` |
| External system node | `.ext` / `.extt` | `#EBEFF6` | `#9FB4CE` |

Colour semantics, fixed across all diagrams: blue = main-flow step, light blue = entry or decision, green = success terminus, red = blocked terminus, dashed grey = side path or system linkage, accent orange = phase grouping.

## Authoring Workflow

1. **Prefer the generator over hand-writing SVG.** The PRD authoring skill's generator (`<cookbook>/skills/create-prd/scripts/flowgen.py`) produces flow diagrams from data — you declare lanes, nodes (lane/row/type/text/state), and edges; it computes coordinates, edge routing, arrowhead-to-border, adaptive lane width, and styling, so most rules in this spec are enforced by construction rather than by hand. Usage: `flowgen_example.py` in the same directory. Hand-written SVG is the fallback for one-off layouts the generator does not yet cover; when you hand-write, you are responsible for every rule below.
2. Before drawing, load this spec and inspect existing SVGs under the module's `assets/` directory as the visual baseline; if hand-writing, reuse the generator's palette and style classes so hand and generated diagrams stay identical.
3. Derive the node set from the owning PRD's flow description and state machine; derive edge state annotations from the Domain Model enumerations. Keep one step per node (see "One step, one node").
4. Place the file in the module's `assets/` directory, named `{模块名}-{图名}.svg`, referenced from the document by relative path.
5. **Run the structural validator** — visual review reliably misses arrowheads that stop a dozen pixels short of their target and branches that were never given a terminus:

   ```bash
   # business flow diagrams
   python3 <cookbook>/skills/create-prd/scripts/validate_flow_svg.py <module-docs>/assets/*流程图.svg
   # architecture diagrams (relaxed: arrows may target a layer band)
   python3 <cookbook>/skills/create-prd/scripts/validate_flow_svg.py --mode arch <module-docs>/assets/*架构图.svg
   ```

   It checks arrowhead landing, orphan nodes, start/terminal presence, and (roughly) text overlap. It does **not** check semantics — edge annotation completeness, state-value fidelity to the Domain Model, and lane-division sense still require human and `check-prd` review.
6. **Render to PNG and look — this is mandatory, not optional.** The validator cannot see whether labels crowd each other, whether a legend block is legible, whether an arrow visually lands on a diamond's tip versus its edge, or whether the whole diagram reads clearly. Only rendering shows these. A diagram that passes the validator but was never rendered is not done.

   ```bash
   qlmanage -t -s 1400 -o /tmp/ <module-docs>/assets/*.svg   # macOS; or rsvg-convert / a browser
   ```

   Fix what the render reveals, then re-run both the validator and the render until both are clean.
7. Confirm the semantic layer by hand: every edge annotated per the density rules, state values matching the PRD verbatim.
8. Edit the SVG file directly for later changes (or, if generated, edit the data and regenerate) — do not regenerate under a new name.

## Text Layout Notes

- Multi-line node text uses `<tspan x="…" dy="…">`; secondary detail takes a smaller font size.
- Keep node labels to a short verb phrase; push detail to the edge annotation or a footnote.
- External nodes may carry a small `.note` line beneath them summarising the contract (e.g. read-only master data, final deliverable).
