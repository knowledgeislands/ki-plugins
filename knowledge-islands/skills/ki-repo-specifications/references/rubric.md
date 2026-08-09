<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — KI Specifications repository structure

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-specifications --write`.

Line-by-line criteria for auditing ki-repo-specifications. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [SPEC — Repository structure](#spec--repository-structure)
- [SYNC — Standard synchronisation](#sync--standard-synchronisation)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## SPEC — Repository structure

→ [standard](standards-specifications.md)

Repository identity and stable top-level seams.

- **SPEC-1 [M] — Repository identity marker** — `.ki-config.toml` declares a keyless `[skills.ki-repo-specifications]` table. Unknown keys WARN because the marker has no options yet. (standards-specifications.md)
  - _Remediation:_ automatic
- **SPEC-2 [M] — Authority areas** — `proposals/`, `specifications/`, and `schemas/` exist as directories. Their absence FAILs. (standards-specifications.md)
  - _Remediation:_ diagnostic — Create the missing authority area only after confirming that the repository is intended to carry this specification responsibility.
- **SPEC-3 [M] — Supporting areas** — `templates/`, `examples/`, `docs/`, and `tooling/` exist as directories. Their absence WARNs. (standards-specifications.md)
  - _Remediation:_ diagnostic — Create the missing supporting area when its documented responsibility applies, or record why the repository intentionally omits it.
- **SPEC-J1 [J] — Minimal floor** — Every asserted structure has proved stable enough to govern across time. (standards-specifications.md)
  - _Evidence scope:_ Each asserted repository structure and the evidence of its sustained use.
  - _Review prompt:_ Has every asserted structure proved stable enough to govern across time?
  - _Outcomes:_ conforming; reduce the floor; stability evidence required
  - _Conforming guidance:_ Remove speculative structure from the governed floor, or record the sustained repository evidence that makes the assertion stable.
- **SPEC-J2 [J] — Authority boundary** — The skill checks repository shape without claiming canonical ownership of normative specification meaning. (standards-specifications.md)
  - _Evidence scope:_ The skill guidance, rubric criteria, and any proposed repository changes.
  - _Review prompt:_ Does the skill preserve the authority boundary around normative specification meaning?
  - _Outcomes:_ conforming; boundary correction required; authority decision required
  - _Conforming guidance:_ Limit this skill to repository structure and route normative specification meaning to its canonical authority; record an authority decision where the boundary is disputed.

## SYNC — Standard synchronisation

→ [standard](standards-specifications.md)

Alignment across the knowledge chain.

- **SYNC-1 [J] — Knowledge-chain synchronisation** — The standard, rubric, catalogue, tests, and source review agree. (standards-specifications.md)
  - _Evidence scope:_ The standard, structured catalogue, generated rubric, focused tests, and source-review record for this skill.
  - _Review prompt:_ Do the standard, rubric, catalogue, tests, and source review agree?
  - _Outcomes:_ conforming; synchronisation required; source review required
  - _Conforming guidance:_ Update the affected canonical source, catalogue, tests, generated publication, and source record together, or record the outstanding source-review question.
