<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands Git conventions

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-git --write`.

Line-by-line criteria for auditing ki-git. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [COMMIT — commit shape](#commit--commit-shape)
- [BRANCH — branch choice](#branch--branch-choice)
- [HYGIENE — Git working hygiene](#hygiene--git-working-hygiene)
- [LOCK — stale-lock semantics](#lock--stale-lock-semantics)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## COMMIT — commit shape

→ [standard](standards-git.md)

Commit messages express one completed unit through the portable convention.

- **COMMIT-1 [J] — commit shape expresses the completed unit** — A commit uses the portable Conventional Commit shape and accurately represents one completed unit of work. (standards-git.md)
  - _Evidence scope:_ Each proposed commit and the changes it contains.
  - _Review prompt:_ Assess whether the commit type, optional scope, and imperative summary accurately describe one completed unit, using the established vocabulary without combining unrelated changes.
  - _Outcomes:_ conforming; split required; message revision required
  - _Conforming guidance:_ Split unrelated changes into separately reviewable commits, then revise the Conventional Commit type, scope, or imperative summary to describe the completed unit.

## BRANCH — branch choice

→ [standard](standards-git.md)

Branch use follows local protection and review needs without invented ceremony.

- **BRANCH-1 [J] — branch choice matches the change boundary** — Direct main and branch work each follow the repository policy and the change’s review needs. (standards-git.md)
  - _Evidence scope:_ The selected repository, requested change, protection policy, and review boundary.
  - _Review prompt:_ Assess whether direct main or a branch is appropriate for this repository’s protection policy, the user’s request, and the value of an isolated review boundary.
  - _Outcomes:_ conforming; branch required; direct-main rationale required
  - _Conforming guidance:_ Create an isolated branch where review or repository policy requires it, or record why a focused direct-main change is appropriate.

## HYGIENE — Git working hygiene

→ [standard](standards-git.md)

Git operations preserve shared worktree state and recoverability.

- **HYGIENE-1 [J] — Git working hygiene preserves unrelated state** — Git work preserves shared state through explicit paths, worker-local indexes, and serialized commits. (standards-git.md)
  - _Evidence scope:_ The shared working tree, worker-local Git indexes, staged paths, and Git write operations for the selected work.
  - _Review prompt:_ Assess whether the working tree was inspected, each delegated worker used its assigned Git index, staging is limited to intended paths, unrelated changes remain untouched, and shared-HEAD commits are safely serialised.
  - _Outcomes:_ conforming; state inspection required; staging correction required; operation coordination required
  - _Conforming guidance:_ Inspect the working tree, pass the assigned `GIT_INDEX_FILE` on every worker Git write, stage only explicit intended paths, leave unrelated work untouched, and have the orchestrator serialize commits after re-checking HEAD.

## LOCK — stale-lock semantics

→ [standard](standards-git.md)

The stale-lock guard remains bounded recovery rather than general cleanup.

- **LOCK-1 [J] — stale-lock recovery preserves the safety boundary** — Stale-lock recovery follows the guard’s worktree, process, containment, and file-type limits. (standards-git.md)
  - _Evidence scope:_ Every stale-lock candidate and its repository, process, containment, and filesystem evidence.
  - _Review prompt:_ Assess whether stale-lock recovery remains best-effort: it must not interrupt Git, cross the current physical worktree boundary, remove ambiguous or symlinked candidates, or act when process inspection is inconclusive.
  - _Outcomes:_ conforming; safe removal authorised; leave untouched; investigation required
  - _Conforming guidance:_ Remove only a clearly stale regular lock within the current physical worktree after process checks; otherwise leave it untouched and investigate through the repository owner.
