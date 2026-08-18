<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — portable subagent role semantics

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-subagents --write`.

Line-by-line criteria for auditing ki-subagents. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [PORTABLE — Portable role semantics](#portable--portable-role-semantics)
- [HOST — Host/runtime boundary](#host--hostruntime-boundary)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## PORTABLE — Portable role semantics

→ [standard](standards-portable-subagents.md)

Runtime-neutral identity, instructions, lane, grounding, hand-offs, orchestration, and outcome evidence.

- **PORTABLE-1 [J] — Selection and identity** — The role has stable identity and concrete selection cues without a runtime claim. (standards-portable-subagents.md#required-semantic-evidence)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ The role has a stable identity and concrete selection cues without describing a native serialization.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **PORTABLE-2 [J] — Bounded instructions** — Instructions state lane, grounding, and hand-offs. (standards-portable-subagents.md#required-semantic-evidence)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Core instructions bound the lane, require grounding before action, and name explicit hand-offs.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **PORTABLE-3 [J] — Orchestration and outcome** — Orchestration is bounded and continued selection has outcome evidence. (standards-portable-subagents.md#required-semantic-evidence)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Orchestration intent is bounded and representative outcome evidence justifies selecting the role.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## HOST — Host/runtime boundary

→ [standard](standards-portable-subagents.md)

No source-only false assurance.

- **HOST-1 [J] — No false runtime assurance** — Source evidence is not activation or execution evidence. (standards-portable-subagents.md#boundary)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ The role and adapters do not report source conformance as installation, publication, activation, effective settings, or execution.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
