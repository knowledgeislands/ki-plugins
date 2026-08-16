<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands knowledge bases

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-kb --write`.

Line-by-line criteria for auditing ki-repo-kb. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [ZONE — zone layout](#zone--zone-layout)
- [CONFIG — KB configuration](#config--kb-configuration)
- [ADMIN — Admin zone](#admin--admin-zone)
- [ROUTE — routing and placement](#route--routing-and-placement)
- [NOTE — note conventions](#note--note-conventions)
- [MEM — memory cascade](#mem--memory-cascade)
- [LINK — base linking](#link--base-linking)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## ZONE — zone layout

→ [standard](standards-knowledge-base.md)

Required zones, indexes, staging, and output placement.

- **ZONE-1 [M] — required zone layout** — Calendar/, Pillars/, Resources/, Streams/, and Admin/ are present, resolving each through a declared zone alias. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the required zone layout or placement, then rerun the audit.
- **ZONE-2 [M] — same-name zone indexes** — Each present zone has its same-name index note. (standards-knowledge-base.md)
  - _Remediation:_ automatic
- **ZONE-3 [M] — root memory index** — The resolved Admin zone carries MEMORY.md. (standards-knowledge-base.md)
  - _Remediation:_ automatic
- **ZONE-4 [M] — staging areas are not zones** — +/ and -/ are reported as staging only and are exempt from the zone-index rule. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the required zone layout or placement, then rerun the audit.
- **ZONE-5 [M] — produced outputs use outbound staging** — Notes with note_type session-digest or handoff reside under the resolved -/ staging area. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the required zone layout or placement, then rerun the audit.

## CONFIG — KB configuration

→ [standard](standards-knowledge-base.md)

Validate-down `[skills.ki-repo-kb]` configuration and zone aliases.

- **CONFIG-0 [M] — parseable KB configuration** — When present, .ki-config.toml parses before the KB table is evaluated. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the TOML syntax before relying on KB configuration.
- **CONFIG-1 [M] — known configuration keys** — Only required_frontmatter, preflight, zones, and templates are recognised beneath [skills.ki-repo-kb]. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the selected ki-repo-kb configuration evidence, then rerun the audit.
- **CONFIG-2 [M] — non-redundant zone aliases** — A zone alias does not restate its canonical folder name. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the selected ki-repo-kb configuration evidence, then rerun the audit.
- **CONFIG-3 [M] — canonical zone alias keys** — Every [skills.ki-repo-kb.zones] key names a canonical zone or staging area. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the selected ki-repo-kb configuration evidence, then rerun the audit.
- **CONFIG-4 [M] — KB configuration boundary** — The checker reads and validates only the ki-repo-kb table, leaving every sibling table untouched. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the selected ki-repo-kb configuration evidence, then rerun the audit.
- **CONFIG-5 [M] — declared preflight paths** — Literal preflight paths resolve under the base; globs remain runtime-resolved. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Correct the selected ki-repo-kb configuration evidence, then rerun the audit.

## ADMIN — Admin zone

→ [standard](standards-knowledge-base.md)

Optional Admin subdivisions and their governance baseline.

- **ADMIN-1 [M] — optional Admin subdivisions** — When Governance/ or Operations/ is active, it has its same-name index; absent subdivisions warn only. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Add the required Admin evidence or correct its local structure, then rerun the audit.
- **ADMIN-2 [M] — governance charter** — An active Admin/Governance/ directory carries Charter.md. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Add the required Admin evidence or correct its local structure, then rerun the audit.
- **ADMIN-3 [M] — governance conformance record** — An active Admin/Governance/ directory carries Conformance.md. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Add the required Admin evidence or correct its local structure, then rerun the audit.

## ROUTE — routing and placement

→ [standard](standards-knowledge-base.md)

Judgment review of the knowledge-base routing test.

- **ROUTE-1 [J] — notes follow the routing test** — Notes are placed in the zone selected by their time-bound, active-work, settled-knowledge, or external-reference role. (standards-knowledge-base.md)
  - _Evidence scope:_ Sampled notes, their current zones, and the routing test.
  - _Review prompt:_ Does each sampled note sit in the zone selected by the routing test?
  - _Outcomes:_ conforming; move note; routing clarification
  - _Conforming guidance:_ Move a note only through the base owner’s routing decision; preserve staged records and established owners.

## NOTE — note conventions

→ [standard](standards-frontmatter.md)

Frontmatter mechanics and note-authoring judgment.

- **NOTE-1 [M + J] — declared required frontmatter** — When required_frontmatter is declared, each note with frontmatter carries those keys; otherwise key requirements remain a judgment call. (standards-frontmatter.md, standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Add the declared required frontmatter keys, then rerun the audit.
  - _Evidence scope:_ The base frontmatter convention and its host guidance.
  - _Review prompt:_ When no required_frontmatter list is declared, are the required keys appropriate to this base and its host guidance?
  - _Outcomes:_ conforming; convention revision; not applicable
  - _Conforming guidance:_ Set required keys through the base owner’s convention; do not infer them from a mechanical finding.
- **NOTE-1a [M] — well-formed frontmatter fences** — Every opening frontmatter fence closes. (standards-frontmatter.md)
  - _Remediation:_ diagnostic — Close the affected frontmatter fence, then rerun the audit.
- **NOTE-1b [M] — snake_case frontmatter keys** — Top-level frontmatter keys use snake_case. (standards-frontmatter.md)
  - _Remediation:_ diagnostic — Rename affected top-level frontmatter keys to snake_case, then rerun the audit.
- **NOTE-1c [M] — explicit note type metadata** — Every governed KB note frontmatter uses note_type and never the legacy generic type field. (standards-frontmatter.md)
  - _Remediation:_ diagnostic — Replace the generic type field with note_type, preserving its value, then rerun the audit.
- **NOTE-2 [J] — note naming convention** — Calendar notes are dated and other note names follow the base convention. (standards-knowledge-base.md)
  - _Evidence scope:_ Sampled notes and the base naming convention.
  - _Review prompt:_ Do note names follow the base-specific naming convention?
  - _Outcomes:_ conforming; rename note; convention revision
  - _Conforming guidance:_ Apply the base owner’s naming convention without inventing a new taxonomy.
- **NOTE-3 [J] — source and analysis distinction** — Facts are cited to a source path or reference, and analysis is labelled where the base distinguishes it. (standards-knowledge-base.md)
  - _Evidence scope:_ Sampled factual and analytical note content and the base convention.
  - _Review prompt:_ Are facts sourced and analysis labelled according to the base convention?
  - _Outcomes:_ conforming; note revision; convention revision
  - _Conforming guidance:_ Add evidence or labels according to the base convention; do not manufacture sources.

## MEM — memory cascade

→ [standard](standards-knowledge-base.md)

Memory-index accuracy and its always-loaded anchor.

- **MEM-1 [J] — active-Pillar memory accuracy** — Admin/MEMORY.md lists the Pillars actually active in the base. (standards-knowledge-base.md)
  - _Evidence scope:_ The memory index and active Pillars in the base.
  - _Review prompt:_ Does the memory index accurately list active Pillars?
  - _Outcomes:_ conforming; memory revision; not applicable
  - _Conforming guidance:_ Update the owned memory index from current base evidence; do not infer active status.
- **MEM-2 [M] — always-loaded memory cascade anchor** — Root CLAUDE.md or AGENTS.md anchors the memory cascade before substantive work. (standards-knowledge-base.md)
  - _Remediation:_ diagnostic — Add or correct the root memory cascade anchor, then rerun the audit.

## LINK — base linking

→ [standard](standards-knowledge-base.md)

Judgment review of Obsidian wikilink content.

- **LINK-1 [J] — Obsidian note linking** — Base note content uses shortest-unique Obsidian wikilinks, with aliased full paths for contents lists. (standards-knowledge-base.md)
  - _Evidence scope:_ Sampled base notes and the prescribed linking convention.
  - _Review prompt:_ Do sampled base notes use the prescribed Obsidian wikilink convention?
  - _Outcomes:_ conforming; note revision; convention clarification
  - _Conforming guidance:_ Revise links to the established convention; do not change the convention from a sample alone.
