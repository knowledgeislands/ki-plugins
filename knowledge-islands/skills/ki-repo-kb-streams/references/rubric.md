<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands Streams zones

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-kb-streams --write`.

Line-by-line criteria for auditing ki-repo-kb-streams. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [STREAM — Streams structure](#stream--streams-structure)
- [ENACT — Enactment Process](#enact--enactment-process)
- [GATE — always-loaded gate](#gate--always-loaded-gate)
- [CONFIG — Streams configuration](#config--streams-configuration)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## STREAM — Streams structure

→ [standard](standards-streams-structure.md)

Focus layout, indexes, proposal suffixes, and placement.

- **STREAM-1 [M] — Focus folders** — Folders directly under Streams are canonical Focus folders. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Reshape the Streams tree only after confirming the intended Focus ownership and canonical location for each entry.
- **STREAM-2 [M] — Focus indexes** — Each present Focus carries a same-name index note. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Add or repair the matching Focus index after confirming the Focus and stream ownership relationship.
- **STREAM-3 [M] — proposal suffix** — Full proposal filenames, H1 headings, and titles use the Proposal suffix while lightweight streams do not. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Correct the filename, H1, and title suffix only after confirming whether the note is a full proposal or lightweight stream.
- **STREAM-4 [J] — Focus index ordering** — Focus indexes carry correctly ordered Streams tables and one category convention. (standards-streams-structure.md)
  - _Evidence scope:_ Focus index tables, their current streams, ordering, and category convention.
  - _Review prompt:_ Are index tables current, ordered, and consistently categorised?
  - _Outcomes:_ conforming; index revision required; category decision required
  - _Conforming guidance:_ Update rows and ordering from the current streams, and apply one documented category convention or record a deliberate exception.
- **STREAM-5 [J] — Focus placement** — Each stream sits under its real attention Focus. (standards-streams-structure.md)
  - _Evidence scope:_ Sampled streams, their stated purpose, and parent Focus placement.
  - _Review prompt:_ Do sampled streams match their actual attention Focus?
  - _Outcomes:_ conforming; relocation required; focus decision required
  - _Conforming guidance:_ Move the stream to the Focus that owns its present attention, or record the deliberate cross-Focus rationale.

## ENACT — Enactment Process

→ [standard](standards-enactment-process.md)

Proposal frontmatter, lifecycle, and settlement.

- **ENACT-1 [M] — proposal frontmatter** — Each proposal declares status, priority, and dependencies in closed frontmatter. (standards-enactment-process.md)
  - _Remediation:_ diagnostic — Add or correct closed proposal frontmatter to reflect the proposal’s actual status, priority, and dependencies.
- **ENACT-2 [M] — lifecycle status and priority** — Proposal status and priority are bare tokens from the controlled vocabularies. (standards-enactment-process.md)
  - _Remediation:_ automatic
- **ENACT-3 [J] — Governance section** — Every stream note declares and links its bound process note. (standards-enactment-process.md)
  - _Evidence scope:_ Sampled stream notes and their bound process-note links.
  - _Review prompt:_ Do sampled stream notes carry an appropriate Governance section?
  - _Outcomes:_ conforming; governance link required; process-boundary decision required
  - _Conforming guidance:_ Add the appropriate bound process-note link, or record the governing decision where the note intentionally follows a different process boundary.
- **ENACT-4 [J] — index accuracy** — Focus and proposal indexes match the live streams and statuses. (standards-enactment-process.md)
  - _Evidence scope:_ Focus and proposal indexes, live streams, and their lifecycle statuses.
  - _Review prompt:_ Do indexes accurately reflect live streams and statuses?
  - _Outcomes:_ conforming; index update required; lifecycle correction required
  - _Conforming guidance:_ Update the index from the canonical live stream or correct the stream lifecycle state before publishing an index claim.
- **ENACT-5 [J] — done-proposal retention** — Done proposals retain their reviewed evidence until an explicit prune selection removes them. (standards-enactment-process.md)
  - _Evidence scope:_ Done proposals, their reviewed evidence, canonical outputs, and any prune selection.
  - _Review prompt:_ Do done proposals retain their review evidence and canonical outputs until an explicit prune selection?
  - _Outcomes:_ conforming; retain evidence; explicit prune selection required
  - _Conforming guidance:_ Restore or retain the reviewed evidence and canonical outputs until an explicit owner-approved prune selection names the proposal.
- **ENACT-6 [M] — proposal codes** — Each proposal declares a well-formed code unique across the Knowledge Base. (standards-enactment-process.md)
  - _Remediation:_ diagnostic — Assign an explicit owner-approved code, or resolve the duplicate without deriving, allocating, renumbering, or rewriting a proposal identity.

## GATE — always-loaded gate

→ [standard](standards-enactment-process.md)

The canonical-change gate anchor.

- **GATE-1 [M] — always-loaded Enactment gate** — A base with proposals anchors the Enactment Process and proposal gate in root CLAUDE.md or AGENTS.md. (standards-enactment-process.md)
  - _Remediation:_ diagnostic — Add the appropriate canonical Enactment Process anchor only after confirming the base carries proposals and the always-loaded instruction surface.
- **GATE-2 [J] — imperative gate directive** — The anchor is imperative and states the gate exemptions. (standards-enactment-process.md)
  - _Evidence scope:_ The always-loaded gate anchor and its stated exceptions.
  - _Review prompt:_ Is the anchor a genuine imperative directive with the appropriate exemptions?
  - _Outcomes:_ conforming; directive revision required; exception decision required
  - _Conforming guidance:_ Rewrite the anchor as a clear imperative directive and document only the process-approved exemptions.

## CONFIG — Streams configuration

→ [standard](standards-enactment-process.md)

The skill-owned ki-repo-kb-streams table.

- **CONFIG-1 [M] — known Streams configuration** — Only process_note and note_type_scheme are recognised under ki-repo-kb-streams. (standards-enactment-process.md)
  - _Remediation:_ diagnostic — Remove or document unsupported configuration keys after confirming the Streams behaviour they were intended to express.
- **CONFIG-2 [M] — note type scheme** — note_type_scheme is type or tags when declared. (standards-enactment-process.md)
  - _Remediation:_ diagnostic — Use the documented `type` or `tags` scheme, or record the governing decision for a different note classification.
