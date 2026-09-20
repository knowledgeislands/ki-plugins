<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Evidence-backed agentic standards, structures, and adoption review

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-agentic-radar --write`.

Line-by-line criteria for auditing ki-agentic-radar. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [SCHEMA — Snapshot schema](#schema--snapshot-schema)
- [EVIDENCE — Evidence quality](#evidence--evidence-quality)
- [CLASSIFICATION — Subject classification](#classification--subject-classification)
- [LIFECYCLE — Review lifecycle](#lifecycle--review-lifecycle)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## SCHEMA — Snapshot schema

→ [standard](standards-agentic-radar.md#snapshot-schema)

The TOML snapshot has one stable, attributable, mechanically valid representation.

- **SCHEMA-1 [M] — snapshot schema and owners are valid** — The radar parses as schema 1 TOML with only declared maps and fields, stable lower-case hyphenated identities, complete subject records, and explicit non-empty owner, uncertainty, and return-trigger values. (standards-agentic-radar.md#snapshot-schema)
  - _Remediation:_ diagnostic — Correct authored structure only after confirming intended subject identity, owner, uncertainty, and return trigger.

## EVIDENCE — Evidence quality

→ [standard](standards-agentic-radar.md#evidence)

Evidence is linked, classified, applicable, and proportionate to how it is used.

- **EVIDENCE-1 [M] — evidence links and source roles are coherent** — Every evidence record has a current identity, HTTP(S) source, evidence class and source role; all references resolve without duplication or support/counter overlap; provider claims are not primary, and discovery or counter-evidence records are not used as direct support. (standards-agentic-radar.md#evidence)
  - _Remediation:_ diagnostic — Review the source claim and intended role before correcting authored evidence or links; do not invent replacements.
- **EVIDENCE-2 [J] — evidence is applicable and proportionate** — Consequential claims use evidence applicable to the precise subject and claim, distinguish steward from independent evidence, retain uncertainty and counter-evidence, and do not infer interoperability or adoption from package count or vendor assertion. (standards-agentic-radar.md#evidence-and-movement-review)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does each consequential classification or movement have sufficiently applicable and independent evidence, with uncertainty and material counter-evidence preserved?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## CLASSIFICATION — Subject classification

→ [standard](standards-agentic-radar.md#subjects)

Maturity, implementation, interoperability, and structural terms retain precise evidence-backed meaning.

- **CLASSIFICATION-1 [M + J] — maturity and implementation claims are supported** — Closed subject, stewardship, maturity, implementation, and interoperability vocabularies are used; non-specification subjects remain not-applicable; versioned or stable maturity, implementation breadth, conformance, and demonstrated interoperability each have their required evidence class. (standards-agentic-radar.md#subjects)
  - _Remediation:_ guarded — Review primary evidence and decide whether the classification or supporting record is authoritative before editing.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do maturity, implementation, and interoperability labels accurately describe the bounded evidence without promoting patterns, research, or vendor terms into formal standards?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **CLASSIFICATION-2 [J] — structural terms remain meaningfully distinct** — Agent loops, branching supervisor trees, graph-orchestrated control flow, knowledge graphs, and provenance graphs are classified by the aspect being observed rather than collapsed by shared graph terminology. (standards-agentic-radar.md#structural-distinctions)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are control loops, delegation hierarchy, executable control flow, semantic knowledge, and evidence lineage kept distinct wherever structural subjects are described?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## LIFECYCLE — Review lifecycle

→ [standard](standards-agentic-radar.md#dates-and-refresh)

Dates, Knowledge Islands stance, movement, ownership, and return triggers remain current and coherent.

- **LIFECYCLE-1 [M + J] — dates, stances, and movements are coherent** — Review dates are real non-future ISO calendar dates and warn after 9 days; stance and movement use closed vocabularies; inward movement cannot accompany Hold, outward movement cannot accompany Adopt, and Trial or Adopt requires local-evaluation evidence. (standards-agentic-radar.md#dates-and-refresh, standards-agentic-radar.md#subjects)
  - _Remediation:_ guarded — Refresh evidence and decide the authoritative stance, movement, or date; do not infer a recommendation from mechanical consistency.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does each stance and movement express a defensible Knowledge Islands decision, concrete use case, explicit uncertainty, owner, and actionable return trigger?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
