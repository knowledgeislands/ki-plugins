<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — repository-local practical guides

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-guides --write`.

Line-by-line criteria for auditing ki-guides. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [GUIDE — guide layout](#guide--guide-layout)
- [ROUTE — documentation routing](#route--documentation-routing)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## GUIDE — guide layout

→ [standard](standards-guides.md#guide-root-and-index)

The controlled guide root has an entry point and identifiable guide documents.

- **GUIDE-1 [M] — docs/guides is a regular directory** — `docs/guides/` exists as a regular directory inside the repository. (standards-guides.md#guide-root-and-index)
  - _Remediation:_ diagnostic — Create a regular `docs/guides/` directory inside the repository, then rerun the audit.
- **GUIDE-2 [M] — docs/guides/README.md is the collection entry point** — `docs/guides/README.md` exists as a regular file and is the collection entry point. (standards-guides.md#guide-root-and-index)
  - _Remediation:_ diagnostic — Add a regular `docs/guides/README.md` collection entry point, then rerun the audit.
- **GUIDE-3 [M] — each guide has exactly one H1** — Every Markdown guide below `docs/guides/`, except its root `README.md`, has exactly one H1. (standards-guides.md#guide-root-and-index)
  - _Remediation:_ diagnostic — Give each affected guide exactly one H1, then rerun the audit.

## ROUTE — documentation routing

→ [standard](standards-guides.md#boundary-and-migration-rules)

Guides are the durable how without creating parallel documentation systems.

- **ROUTE-1 [M] — retired parallel documentation roots are absent** — A repository declaring this skill has no `docs/spec/`, `docs/developer/`, or generic `docs/logs/` root; their durable material is reclassified into the owned documentation concern. (standards-guides.md#boundary-and-migration-rules)
  - _Remediation:_ diagnostic — Reclassify durable material from the retired root into its owning documentation concern, then remove the retired root and rerun the audit.
- **ROUTE-2 [J] — guides are discoverable, actionable, and correctly placed** — The guide index gives each intended reader a useful route, and each guide contains practical procedure rather than duplicated rationale, behaviour specification, or future work. (standards-guides.md#boundary-and-migration-rules)
  - _Evidence scope:_ The Guides index, every guide below `docs/guides/`, and their linked Decision Records, Specifications, and roadmap records where applicable.
  - _Review prompt:_ Can the intended reader find the guide, complete its stated outcome, verify success, and recover from the failures it describes? Are why, what, and when statements held by their Decision Record, Feature Definition, and roadmap owners instead?
  - _Outcomes:_ conforming; guide revision; reclassify material
  - _Conforming guidance:_ Revise the guide for its intended reader and outcome, or move rationale, behaviour, and future work to their owning record. Do not infer a documentation or product decision from the check alone.
