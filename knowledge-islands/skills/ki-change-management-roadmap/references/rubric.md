<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — repository roadmaps

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-change-management-roadmap --write`.

Line-by-line criteria for auditing ki-change-management-roadmap. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [SCOPE — scope](#scope--scope)
- [ROAD — roadmaps](#road--roadmaps)
- [ITEM — items](#item--items)
- [INDEX — root orientation](#index--root-orientation)
- [EXEC — execution](#exec--execution)
- [SAFE — safe mechanics](#safe--safe-mechanics)
- [TRADE — trade review](#trade--trade-review)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## SCOPE — scope

→ [standard](standards-repository-roadmaps.md)

Repository-roadmap applicability.

- **SCOPE-1 [M] — KB scope** — KB repositories use `ki-repo-kb-streams`; repository-roadmap artifacts in a KB fail, while a KB without them is not applicable. (standards-repository-roadmaps.md)
  - _Remediation:_ diagnostic — Remove repository-roadmap artifacts from a KB repository or route the concern through ki-repo-kb-streams.

## ROAD — roadmaps

→ [standard](standards-repository-roadmaps.md)

Canonical generated-index structure, placement, and readiness.

- **ROAD-1 [M] — root orientation** — Root ROADMAP.md is a concise orientation that points to canonical work items rather than duplicating their queue. (standards-repository-roadmaps.md)
  - _Remediation:_ diagnostic — Restore the concise root orientation and canonical roadmap structure without reconstructing or prioritizing the work queue.
- **ROAD-2 [J] — honest horizon placement** — Items sit in honest horizons; Waiting-for items name their external condition; speculative Future work carries `candidate: true`. (standards-repository-roadmaps.md)
  - _Evidence scope:_ Every horizon, Waiting-for condition, and Future candidate declaration.
  - _Review prompt:_ Review horizon placement, waiting conditions, and Future candidate marking.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Confirm placement with the owning authority, record a gap, or record an explicit exclusion; do not move work automatically.
- **ROAD-3 [J] — open finite work** — Work-item indexes are open-only and contain finite work rather than continuous practice. (standards-repository-roadmaps.md)
  - _Evidence scope:_ Every roadmap item represented in the open work queue.
  - _Review prompt:_ Review that roadmap items are finite open work, not completed work or ongoing practice.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Split, retain, close, or exclude work only after an owner confirms the intended record; otherwise record a gap.
- **ROAD-4 [M] — horizon vocabulary** — Every work item uses the canonical horizon vocabulary; the root orientation carries no parallel horizon list. (standards-repository-roadmaps.md)
  - _Remediation:_ diagnostic — Use the canonical horizon vocabulary and remove duplicate root-horizon lists without changing any item placement.
- **ROAD-5 [J] — horizon transitions and readiness** — Horizon promotion and deferral meet the readiness contract; execution state remains honest and CONFORM never chooses a move. (standards-repository-roadmaps.md)
  - _Evidence scope:_ Every proposed promotion, deferral, and its readiness evidence.
  - _Review prompt:_ Review each promotion or deferral against its readiness contract and plan state.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Confirm the lifecycle move with its owner, record a gap, or record an explicit exclusion; never choose the move automatically.
- **ROAD-6 [M] — repository work-item code** — The ki-repo table declares a valid stable repository code and the ki-change-management-roadmap table declares its complete theme vocabulary. (standards-repository-roadmaps.md)
  - _Remediation:_ diagnostic — Correct the configured repository code or theme vocabulary from authoritative repository configuration.
- **ROAD-7 [M] — issue-allocation ledger** — docs/roadmap/_ISSUES.md records a project-scoped high-water mark, preventing a pruned issue number from being reused. (standards-repository-roadmaps.md)
  - _Remediation:_ automatic

## ITEM — items

→ [standard](standards-repository-roadmaps.md)

Flat work-item identity, grouping, lifecycle, and dependencies.

- **ITEM-1 [M] — flat work-item identity** — Each canonical item lives directly under docs/roadmap with a unique stable identifier, matching filename, and title of at most four words. (standards-repository-roadmaps.md, standards-work-item-format.md)
  - _Remediation:_ diagnostic — Correct the item filename, frontmatter identity, or title to match the canonical flat work-item contract.
- **ITEM-2 [M] — item state and theme grouping** — Each item has valid theme, horizon, candidate, status, baseline, and dependency fields. (standards-repository-roadmaps.md)
  - _Remediation:_ diagnostic — Correct the item state fields or dependency declarations; do not choose a priority or lifecycle transition automatically.
- **ITEM-3 [M] — item body shape** — Every item has a non-empty Goal, ends with Discussion, carries the deterministic sections required by its horizon and lifecycle state, and uses task-list Steps. (standards-work-item-format.md)
  - _Remediation:_ diagnostic — Restore the lifecycle-appropriate canonical sections and task-list shape from the work-item format standard.
- **ITEM-4 [J] — plain-language goal** — Each work item states a concise user or system outcome before its technical context. (standards-work-item-format.md)
  - _Evidence scope:_ The Goal and Context sections of every active roadmap item.
  - _Review prompt:_ Review that Goal explains the intended user or system outcome in plain language, while Context holds the supporting evidence and technical rationale.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Rewrite the Goal or Context, record a named gap, or record an explicit exclusion in the item discussion.
- **ITEM-5 [M + J] — item dependencies** — Dependencies name existing work items, are reverse-consistent and acyclic, and do not permit active blocked work. (standards-repository-roadmaps.md)
  - _Remediation:_ guarded — Correct only the evidenced dependency declarations after confirming the intended relationship; do not infer or create work dependencies.
  - _Evidence scope:_ Every declared roadmap dependency and its reciprocal work item.
  - _Review prompt:_ Review whether each dependency represents a real execution relationship without hiding a priority or acceptance decision.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Correct the declared relationship with the owning work-item decision, record a gap, or record an explicit exclusion.

## INDEX — root orientation

→ [standard](standards-repository-roadmaps.md)

The exact concise root orientation for flat work items.

- **ROOT-1 [M] — root work-item orientation** — Root `ROADMAP.md` is the canonical concise orientation and does not duplicate the work-item queue. (standards-repository-roadmaps.md)
  - _Remediation:_ automatic

## EXEC — execution

→ [standard](standards-work-item-format.md)

In-place execution shape and lifecycle integrity.

- **EXEC-1 [M] — in-place execution record** — A work item entering execution retains its concise issue context and adds the required execution sections in the same file. (standards-work-item-format.md)
  - _Remediation:_ diagnostic — Restore the required in-place execution sections without changing the item priority, acceptance, or lifecycle decision.
- **EXEC-2 [J] — stage-appropriate work-item detail** — Future items preserve the issue and its discussion; Soon adds useful shaping; immediate and active items have concrete Steps, checkable Verify, honest Current state, and minimal Files touched. (standards-work-item-format.md)
  - _Evidence scope:_ The stage-appropriate detail in every canonical work item.
  - _Review prompt:_ Review whether each work item has useful detail for its stage, including topic-oriented Discussion and concrete, checkable execution detail when immediate.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Add or refine only the detail supported by the work; record a gap or explicit exclusion where evidence is insufficient.
- **EXEC-3 [J] — honest execution status** — Draft awaits readiness approval; ready awaits execution; in-progress reflects live work; awaiting-review carries the required review packet; done is a retained closure record. Every non-draft item is Now or Next. (standards-work-item-format.md)
  - _Evidence scope:_ The declared lifecycle status and retained evidence of every work item.
  - _Review prompt:_ Review whether work-item status honestly reflects its lifecycle gate or retained completion record.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Select or confirm lifecycle transitions with the owning authority; otherwise record a gap or explicit exclusion.

## SAFE — safe mechanics

→ [standard](standards-repository-roadmaps.md)

Regular-file boundaries and host-owned transactional publication.

- **SAFE-1 [M] — safe mechanics** — Governed roadmap inputs and outputs are regular local files; CONFORM changes session-owned drafts and leaves dry-run, validation, atomic publication, and rollback to the host. (standards-repository-roadmaps.md)
  - _Remediation:_ diagnostic — Replace unsafe inputs or outputs with regular local files and preserve host-owned publication controls.

## TRADE — trade review

→ [standard](standards-repository-roadmaps.md)

Read-only judgment guidance for declared cross-repository trade submissions.

- **TRADE-1 [J] — trade review** — Where declared ki-repo-trades records exist, report structural guidance and proposed local roadmap action without setting disposition, inferring adoption, prioritizing work, pruning records, or changing remote state. (standards-repository-roadmaps.md)
  - _Evidence scope:_ Declared inbound and outbound trade records in the local repository.
  - _Review prompt:_ Inspect declared trade records read-only: identify submissions needing receiver review or a separately confirmed local roadmap proposal and outbound progress needing follow-up; report proposals only.
  - _Outcomes:_ conforming; proposal; exclusion
  - _Conforming guidance:_ Record read-only observations and proposals only; the receiver owns disposition, prioritization, adoption, and pruning decisions.
- **TRADE-2 [M + J] — trade-aware waiting and pruning** — Trade waits use one flat canonical identity array only at Waiting for, name the exact observed condition in prose, and retain done work referenced by unresolved completion observation. (standards-repository-roadmaps.md)
  - _Remediation:_ guarded — Correct evidenced wait identities or prose only after confirming the relevant trade state; do not prune or release records automatically.
  - _Evidence scope:_ Every trade-aware wait and candidate for done-work pruning.
  - _Review prompt:_ Review each trade-aware wait and pruning candidate: confirm the trade exists and is relevant, the prose names receipt, terminal decision, or linked-work completion precisely, and no done work is pruned before completion-observation sender release is observable.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Retain the record until the responsible receiver or sender has made and observed the required decision; record a gap or exclusion when evidence is incomplete.
