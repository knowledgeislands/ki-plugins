<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Safe complete Granola meeting acquisition and later housekeeping

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-housekeeping-granola --write`.

Line-by-line criteria for auditing ki-housekeeping-granola. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [ACQUIRE — Granola acquisition fidelity](#acquire--granola-acquisition-fidelity)
- [ROUTING — Granola receiver routing](#routing--granola-receiver-routing)
- [RETIRE — Granola source retirement](#retire--granola-source-retirement)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## ACQUIRE — Granola acquisition fidelity

→ [standard](standards-granola-acquisition.md)

Complete enumeration, faithful source projections, immutable checkpoints.

- **ACQUIRE-1 [J] — complete identity enumeration** — Global and every folder history use saturation-aware date-window splitting, UUID reconciliation, and fail-closed completeness evidence. (standards-granola-acquisition.md#complete-identity-enumeration)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the evidence prove every global and folder window complete, unsaturated, deduplicated, and resumable?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **ACQUIRE-2 [J] — faithful read and checkpoint** — Exact meeting-detail and transcript projections are hashed separately from identity evidence, retained immutably, and accompanied by explicit omissions. (standards-granola-acquisition.md#acquisition-fidelity, standards-granola-acquisition.md#checkpoint)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does runtime evidence preserve exact returned projections, content hashes, immutable versions, provenance, and explicit omissions?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **ACQUIRE-3 [J] — amendment revalidation honest** — Routine and exhaustive content revalidation are distinguished because identity listing cannot prove existing notes or transcripts unchanged. (standards-granola-acquisition.md#incremental-acquisition-and-amendments)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the checkpoint evidence name its revalidation coverage and avoid claiming unchanged content from identity listing alone?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## ROUTING — Granola receiver routing

→ [standard](standards-granola-acquisition.md)

Folder evidence, inferred unfoldered coverage, visible receiver conflicts.

- **ROUTING-1 [J] — folder evidence reconciled** — Folder membership comes from complete query context and unfoldered identity is inferred only from the complete global-minus-folder union. (standards-granola-acquisition.md#folder-unfoldered-and-receiver-evidence)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the routing evidence distinguish provider fields from query-derived folder and unfoldered inference?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **ROUTING-2 [J] — receiver conflicts fail closed** — Conflicting folder mappings require human selection; multi-repository acquisition requires explicit intentional duplication. (standards-granola-acquisition.md#folder-unfoldered-and-receiver-evidence)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are unmatched, overlapping, excluded, and conflicting identities visible without silent precedence or duplication?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## RETIRE — Granola source retirement

→ [standard](standards-granola-retirement.md)

Separate release authority, complete evidence gate, manual fallback.

- **RETIRE-1 [J] — retirement separately authorised** — Acquisition remains read-only and retirement requires every evidence gate, a current exact manifest, and immediate human approval. (standards-granola-retirement.md#retirement-evidence-gate)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the proposed retirement refuse every missing or stale gate and fall back to a manual manifest when no safe API exists?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
