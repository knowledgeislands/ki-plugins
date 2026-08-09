<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands Claude MCP binding

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-binding-claude --write`.

Line-by-line criteria for auditing ki-binding-claude. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [CLAUDEBIND — Claude binding](#claudebind--claude-binding)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## CLAUDEBIND — Claude binding

→ [standard](standards-claude-binding.md)

Claude-native JSON and Cowork plugin evidence.

- **CLAUDEBIND-1 [M] — Claude Code and Desktop surface agreement** — Claude Code and Desktop JSON surfaces contain the canonical servers targeting each client. (standards-claude-binding.md)
  - _Remediation:_ diagnostic — Reconcile the affected Claude JSON surface with the canonical targeted server set, then rerun the audit.
- **CLAUDEBIND-2 [M] — Cowork plugin integrity** — Every safe Cowork workspace registers and enables the KI plugin. (standards-claude-binding.md)
  - _Remediation:_ automatic
- **CLAUDEBIND-J1 [J] — Web convention is intentional** — claude.ai web use is documented as a convention rather than a local render target. (standards-claude-binding.md)
  - _Evidence scope:_ The documented claude.ai web convention and every claimed Claude runtime surface.
  - _Review prompt:_ Is the web convention explicit without claiming a local file or renderer exists?
  - _Outcomes:_ conforming; documentation revision; route to binding owner
  - _Conforming guidance:_ Clarify the convention or route a claimed renderer to its owning binding; do not invent a local web configuration surface.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
