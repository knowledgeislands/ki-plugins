<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — generator-neutral website seam

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-website --write`.

Line-by-line criteria for auditing ki-repo-website. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [SITE — Website core](#site--website-core)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## SITE — Website core

→ [standard](standards-website.md)

Generator-neutral selection, lifecycle, and dist seam.

- **SITE-1 [M] — Website opt-in** — The neutral website table is present. (standards-website.md)
  - _Remediation:_ diagnostic — Align the shared website declaration and lifecycle seam, then rerun the audit.
- **SITE-2 [M] — Website opt-in validation** — The neutral marker table is keyless. (standards-website.md)
  - _Remediation:_ diagnostic — Align the shared website declaration and lifecycle seam, then rerun the audit.
- **SITE-3 [M] — Package manifest** — The root package manifest is safely parseable. (standards-website.md)
  - _Remediation:_ diagnostic — Align the shared website declaration and lifecycle seam, then rerun the audit.
- **SITE-4 [M] — ki:site:build** — The root package exposes ki:site:build. (standards-website.md)
  - _Remediation:_ diagnostic — Align the shared website declaration and lifecycle seam, then rerun the audit.
- **SITE-5 [M] — ki:site:dev** — The root package exposes ki:site:dev. (standards-website.md)
  - _Remediation:_ diagnostic — Align the shared website declaration and lifecycle seam, then rerun the audit.
- **SITE-6 [M] — ki:site:clean** — The root package exposes ki:site:clean. (standards-website.md)
  - _Remediation:_ diagnostic — Align the shared website declaration and lifecycle seam, then rerun the audit.
- **SITE-7 [M] — Generated output ignored** — The local dist output is ignored by Git. (standards-website.md)
  - _Remediation:_ diagnostic — Align the shared website declaration and lifecycle seam, then rerun the audit.
