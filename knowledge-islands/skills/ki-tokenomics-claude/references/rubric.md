<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Bounded Claude Code tokenomics evidence

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-tokenomics-claude --write`.

Line-by-line criteria for auditing ki-tokenomics-claude. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [SURF — Claude standing surfaces](#surf--claude-standing-surfaces)
- [RUN — Claude runtime evidence](#run--claude-runtime-evidence)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## SURF — Claude standing surfaces

→ [standard](standards-claude-tokenomics.md)

Bounded Claude Code context evidence.

- **CLAUDE-SURF-1 [M] — Selected Claude surfaces are bounded** — Instruction, skill, and MCP evidence comes only from the selected repository and bounded physical user layer; out-of-scope imports FAIL. (standards-claude-tokenomics.md)
  - _Remediation:_ diagnostic — Remove out-of-scope imports from the selected evidence set or explicitly narrow the requested repository and physical user-layer boundary.

## RUN — Claude runtime evidence

→ [standard](standards-claude-tokenomics.md)

Model and compression evidence.

- **CLAUDE-RUN-1 [M] — Default and effective models are distinct** — The configured user default and selected-repository effective model are reported separately where documented settings expose them. (standards-claude-tokenomics.md)
  - _Remediation:_ diagnostic — Correct the bounded Claude settings evidence or record the selected repository model explicitly; this audit does not choose or rewrite a model.
- **CLAUDE-RUN-2 [M] — Compression evidence is report-only** — Headroom wiring may be reported, but no compression configuration or operational history is changed. (standards-claude-tokenomics.md)
  - _Remediation:_ diagnostic — Correct the reportable headroom evidence or its scope; do not change compression configuration or operational history through this audit.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
