<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Claude Code Markdown/YAML source projections

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-subagents-claude --write`.

Line-by-line criteria for auditing ki-subagents-claude. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [CLAUDE — Claude source projection](#claude--claude-source-projection)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## CLAUDE — Claude source projection

→ [standard](standards-subagent-definitions.md)

Native Markdown/YAML source shape only; no host publication or activation assurance.

- **CLAUDE-1 [M] — Markdown and parseable YAML** — Each candidate is a physical Markdown file with a parseable mapping frontmatter block. (standards-subagent-definitions.md#source-format, CC)
  - _Remediation:_ diagnostic — Repair the Claude source payload through its owner; do not publish it from this audit.
- **CLAUDE-2 [M] — Required Claude fields and name grammar** — Claude source has string name and description fields; its name uses lowercase letters and hyphens only. (standards-subagent-definitions.md#required-fields, CC)
  - _Remediation:_ diagnostic — Repair required Claude fields through the payload owner.
- **CLAUDE-3 [M] — Supported Claude field set** — The source contains only current Claude Code subagent fields. (standards-subagent-definitions.md#supported-fields, CC)
  - _Remediation:_ diagnostic — Remove or route an unsupported Claude field through the source-payload owner.
- **CLAUDE-4 [M] — Native prompt projection present** — The Markdown source carries a non-empty body; its semantic quality is owned by the portable parent. (standards-subagent-definitions.md#source-format)
  - _Remediation:_ diagnostic — Add the approved portable core instructions through the source-payload owner.
- **CLAUDE-5 [M] — Unique source names** — Physical Claude source files do not duplicate a declared name. (standards-subagent-definitions.md#source-discovery)
  - _Remediation:_ diagnostic — Resolve the duplicate with the source-payload owner; a filename is not authority to rename an agent.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
