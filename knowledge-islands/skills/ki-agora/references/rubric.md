<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Portable reciprocal Agora membership

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-agora --write`.

Line-by-line criteria for auditing ki-agora. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [CONFIG — Agora home declaration](#config--agora-home-declaration)
- [MEMBERSHIP — Member declaration](#membership--member-declaration)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## CONFIG — Agora home declaration

→ [standard](standards-agora.md)

Home identity, purpose, target policy, and approved member roles are explicit and portable.

- **CONFIG-1 [M] — Agora homes are canonical** — A declared Agora home uses a stable identifier and records only its non-empty purpose, duplicate-free permitted target-policy categories, and canonical HTTPS GitHub member repositories with lower-case hyphenated roles. The home itself is never an implicit member. (standards-agora.md)
  - _Remediation:_ diagnostic — Correct the local ki-agora home declaration, then rerun the audit.

## MEMBERSHIP — Member declaration

→ [standard](standards-agora.md)

Every membership is a local, portable consent declaration.

- **MEMBERSHIP-1 [M] — member consent is canonical** — Each declared membership names one stable Agora identifier, canonical HTTPS GitHub home, and lower-case hyphenated role. A repository may declare multiple memberships; local shape never infers peer agreement. (standards-agora.md)
  - _Remediation:_ diagnostic — Correct the local ki-agora membership declaration, then rerun the audit.
