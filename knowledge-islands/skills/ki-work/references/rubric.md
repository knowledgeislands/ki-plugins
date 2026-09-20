<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — change-management adapter selection

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-work --write`.

Line-by-line criteria for auditing ki-work. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [SELECT — adapter selection](#select--adapter-selection)
- [SCAFFOLD — Batch scaffold](#scaffold--batch-scaffold)

## SELECT — adapter selection

→ [standard](standards-change-management-adapters.md)

One declared, locally resolvable, applicable forward-work adapter, with no implicit fallback.

- **SELECT-1 [M] — explicit adapter** — The repository selects exactly one supported adapter, declares its owning skill, and uses it for the declared repository kind. (standards-change-management-adapters.md)
  - _Remediation:_ diagnostic — Declare one supported adapter, its owning skill table, and a compatible repository kind.

## SCAFFOLD — Batch scaffold

→ [standard](standards-change-management-adapters.md)

The selected work capability retains its temporary batch-input boundary.

- **SCAFFOLD-1 [M] — owned batch scaffold is canonical** — A repository declaring ki-work retains the exact +/_BATCHES/README.md capability scaffold; ki-batch owns records inside it. (standards-change-management-adapters.md)
  - _Remediation:_ automatic
