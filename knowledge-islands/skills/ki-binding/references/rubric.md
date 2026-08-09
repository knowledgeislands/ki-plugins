<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands cross-surface binding

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-binding --write`.

Line-by-line criteria for auditing ki-binding. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [BIND — Canonical MCP binding](#bind--canonical-mcp-binding)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## BIND — Canonical MCP binding

→ [standard](standards-cross-surface-binding.md)

Portable source validity, client targeting, and mcporter drift evidence.

- **BIND-1 [M] — mcporter agrees with the source** — The vendor-neutral mcporter target contains exactly the KI servers targeting `mcporter`. (standards-cross-surface-binding.md)
  - _Remediation:_ diagnostic — Reconcile the canonical source and mcporter target through the binding workflow; do not infer client exposure from the target alone.
- **BIND-2 [M] — Single MCP source is valid** — The canonical source exists, parses, and gives each entry a valid client target. (standards-cross-surface-binding.md)
  - _Remediation:_ diagnostic — Correct the canonical MCP source so every server has one transport and valid, intentional client targets before regenerating bindings.
- **BIND-J1 [J] — Client targeting is right for use** — The clients set reflects intended, least-surprising client availability. (standards-cross-surface-binding.md)
  - _Evidence scope:_ Every canonical MCP server and its intended client availability.
  - _Review prompt:_ Does each server target the clients that need it, without exposing it on clients that do not?
  - _Outcomes:_ conforming; target adjustment required; authority decision required
  - _Conforming guidance:_ Adjust the canonical clients set to the least-surprising intended availability, or record the owning authority decision before changing exposure.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
