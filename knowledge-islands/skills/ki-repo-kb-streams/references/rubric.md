<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands Streams zones

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-kb-streams --write`.

Line-by-line criteria for auditing ki-repo-kb-streams. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [STREAM — Streams structure](#stream--streams-structure)
- [GATE — always-loaded gate](#gate--always-loaded-gate)
- [CONFIG — Streams configuration](#config--streams-configuration)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## STREAM — Streams structure

→ [standard](standards-streams-structure.md)

Operational-area layout, legacy migration, and adapter routing.

- **STREAM-1 [M] — operational areas** — Streams contains the Roadmap and Housekeeping operational areas, with Trades reserved for later explicit adoption. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Establish Roadmap and Housekeeping, then classify any legacy or unexpected folders with the receiving base owner.
- **STREAM-2 [M] — legacy state folders** — Legacy state and Focus folders are migration inputs, not target Streams structure. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Classify each retained legacy record before removing or replacing a legacy navigation folder.
- **STREAM-4 [J] — adapter-owned records** — Roadmap and housekeeping records follow their owning adapters rather than a generic Streams record model. (standards-streams-structure.md)
  - _Evidence scope:_ Roadmap and housekeeping records sampled from the two Streams areas.
  - _Review prompt:_ Does each sampled record follow its owning roadmap or housekeeping adapter?
  - _Outcomes:_ conforming; adapter migration required; classification decision required
  - _Conforming guidance:_ Route the record to the correct area and apply its owning adapter’s format; record any unresolved classification decision.
- **STREAM-5 [J] — legacy migration disposition** — Each retained legacy Stream has a deliberate roadmap, housekeeping, canonical-knowledge, or prune disposition. (standards-streams-structure.md)
  - _Evidence scope:_ Sampled legacy Streams records and their owner-approved migration decisions.
  - _Review prompt:_ Does each sampled legacy record have an appropriate explicit disposition?
  - _Outcomes:_ conforming; migration required; owner decision required
  - _Conforming guidance:_ Record the owner-approved destination before moving, retaining, or pruning the legacy record; never infer it from the former path.

## GATE — always-loaded gate

→ [standard](standards-enactment-process.md)

The canonical-change gate anchor.

- **GATE-1 [M] — always-loaded change-management gate** — A base with governed work anchors its canonical-change routing in root CLAUDE.md or AGENTS.md. (standards-enactment-process.md)
  - _Remediation:_ diagnostic — Add the appropriate canonical change-management anchor only after confirming the base carries governed work and the always-loaded instruction surface.
- **GATE-2 [J] — imperative gate directive** — The anchor is imperative and routes canonical changes through the relevant adapter. (standards-enactment-process.md)
  - _Evidence scope:_ The always-loaded gate anchor and its stated exceptions.
  - _Review prompt:_ Is the anchor a genuine imperative directive with the appropriate exemptions?
  - _Outcomes:_ conforming; directive revision required; exception decision required
  - _Conforming guidance:_ Rewrite the anchor as a clear imperative directive and document only the process-approved exemptions.

## CONFIG — Streams configuration

→ [standard](standards-streams-structure.md)

The skill-owned ki-repo-kb-streams table.

- **CONFIG-0 [M] — parseable Streams configuration** — The shared configuration file parses before Streams bindings are used. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Correct the TOML syntax before relying on Streams configuration.
- **CONFIG-1 [M] — known Streams configuration** — Only documented Streams container bindings are recognised under ki-repo-kb-streams. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Remove or document unsupported configuration keys after confirming the Streams behaviour they were intended to express.
- **CONFIG-2 [M] — contained process note binding** — When process_note is declared, it resolves to a regular file beneath the base without symlink traversal. (standards-streams-structure.md)
  - _Remediation:_ diagnostic — Correct or remove the process_note binding; do not follow a link or substitute a local authority note.
