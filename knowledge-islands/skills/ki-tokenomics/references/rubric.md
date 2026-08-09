<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Portable agent-context tokenomics policy

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-tokenomics --write`.

Line-by-line criteria for auditing ki-tokenomics. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [CFG — Portable configuration](#cfg--portable-configuration)
- [POL — Portable policy and attribution](#pol--portable-policy-and-attribution)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## CFG — Portable configuration

→ [standard](standards-tokenomics.md)

Selected-repository tokenomics configuration.

- **CFG-1 [M] — Selected configuration validates down** — Only the selected repository’s [skills.ki-tokenomics] table is validated; malformed recognised values FAIL and unknown keys WARN. (standards-tokenomics.md)
  - _Remediation:_ diagnostic — Correct the selected repository tokenomics declaration, then rerun the audit.

## POL — Portable policy and attribution

→ [standard](standards-tokenomics.md)

Budget semantics, purpose taxonomy, and owner routing.

- **POL-1 [M] — Budgets remain guide-rails** — A token budget overage is always WARN, never FAIL. (standards-tokenomics.md)
  - _Remediation:_ diagnostic — Revise the selected budget guide-rail or record its intended overage, then rerun the audit.
- **POL-2 [M] — Model purpose is portable** — Model choice uses the portable frontier, reasoning, standard, and fast purpose taxonomy. (standards-tokenomics.md)
  - _Remediation:_ diagnostic — Use a declared portable model purpose rather than a provider-specific model choice, then rerun the audit.
- **POL-3 [M] — Standing-surface findings have an owner** — Selected-repository standing surfaces are attributed and routed to their artifact owner or runtime adapter. (standards-tokenomics.md)
  - _Remediation:_ diagnostic — Route the standing-surface finding to its owning artifact or runtime adapter, then rerun the audit.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
