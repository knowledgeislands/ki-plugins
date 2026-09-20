<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Evidence-backed model and model-agent route review

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-model-radar --write`.

Line-by-line criteria for auditing ki-model-radar. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [SCHEMA — Snapshot schema](#schema--snapshot-schema)
- [EVIDENCE — Evidence quality](#evidence--evidence-quality)
- [LIFECYCLE — Review lifecycle](#lifecycle--review-lifecycle)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## SCHEMA — Snapshot schema

→ [standard](standards-model-radar.md#snapshot-schema)

The TOML snapshot has one stable, mechanically valid representation.

- **SCHEMA-1 [M] — snapshot schema and record identities are valid** — The radar parses as TOML schema 1, contains only the required map tables, uses stable lower-case hyphenated record identities, repeats each identity exactly in its record, and includes the required typed fields without unknown keys. (standards-model-radar.md#snapshot-schema)
  - _Remediation:_ diagnostic — Correct the authored radar structure or identity after confirming the intended record; do not infer missing model facts.

## EVIDENCE — Evidence quality

→ [standard](standards-model-radar.md#evidence)

Evidence is linked, classified, applicable, and proportionate to its use.

- **EVIDENCE-1 [M] — evidence records and links are valid** — Every evidence record has a current identity, HTTP(S) source, declared evaluation unit and independence class, while every evidence and counter-evidence reference resolves without duplication. (standards-model-radar.md#evidence)
  - _Remediation:_ diagnostic — Review the intended source and record linkage, then correct the authored evidence without fabricating a replacement.
- **EVIDENCE-2 [J] — evidence supports its declared use** — Evidence is assessed within its declared unit and use case; consequential claims retain materially independent corroboration where available, local-fit evidence proportional to recommendation, and visible uncertainty and counter-evidence. Provider performance claims are not decisive independent evidence. (standards-model-radar.md#evidence-and-movement-review)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does each consequential claim have applicable, sufficiently independent evidence with local fit, uncertainty, and counter-evidence preserved?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## LIFECYCLE — Review lifecycle

→ [standard](standards-model-radar.md#dates-and-freshness)

Dates, classifications, and consequential state combinations remain current and coherent.

- **LIFECYCLE-1 [M] — vocabulary and review dates are valid** — Model, route, benchmark, and evidence classifications use the closed vocabularies; dates are real, non-future ISO calendar dates; reviews older than 9 days warn without invalidating historical evidence. (standards-model-radar.md#dates-and-freshness)
  - _Remediation:_ diagnostic — Refresh stale evidence or correct malformed vocabulary and dates only after checking the authored source and intended classification.
- **LIFECYCLE-2 [M + J] — support and lifecycle combinations are coherent** — Default routes are adopted and use active models; retired models have only hold and not-integrated routes; benchmark retirement and applicability agree; successors resolve. Mechanical contradictions are reported, but their repair requires an explicit recommendation or lifecycle decision. (standards-model-radar.md#executable-routes, standards-model-radar.md#benchmarks)
  - _Remediation:_ guarded — Review the supporting evidence and decide which recommendation, support, retirement, or benchmark state is authoritative before editing.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do recommendation, support, retirement, benchmark lifecycle, and recorded movement express a defensible reviewed decision rather than merely a mechanically consistent tuple?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
