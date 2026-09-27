<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands Git conventions

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-git --write`.

Line-by-line criteria for auditing ki-git. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [COMMIT — commit shape](#commit--commit-shape)
- [BRANCH — working approach](#branch--working-approach)
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
  - _Evidence scope:_ Each proposed commit, its `git diff --cached` (or explicit patch) evidence, and its proposed subject line.
  - _Review prompt:_ After inspecting the proposed diff and subject line, assess whether the commit type, optional scope, and imperative summary accurately describe one completed unit, using the established vocabulary without combining unrelated changes.
  - _Outcomes:_ conforming; split required; message revision required
  - _Conforming guidance:_ Split unrelated changes into separately reviewable commits, then revise the Conventional Commit type, scope, or imperative summary to describe the completed unit.
- **COMMIT-2 [J] — publication and integration retain separate authority** — Commits, task-branch publication, pull-request review, approval, merge, and primary-branch integration use explicit separable authority. (standards-git.md#commit-publication-and-integration-authority)
  - _Evidence scope:_ The requested change, repository instructions, stable actor identity, selected branch or worktree, proposed commit, push target, pull-request action, integration target, required gates, and any explicit or standing authority.
  - _Review prompt:_ Does the actor have independently evidenced authority for each push, review, approval, merge, or auto-merge action, scoped to the named repository, refs, work domain, gates, and lifetime, without inferring it from assignment, autonomy, credentials, or task completion? A local commit of a verified unit on the authorised branch is the ordinary default and needs no separate grant; withholding it requires a repository instruction that says so.
  - _Outcomes:_ conforming; commit authority required; push authority required; review authority required; integration authority required; authority scope incomplete
  - _Conforming guidance:_ Commit the verified unit to the authorised branch rather than leaving it dirty; flag a commit only where the repository gates commits or the branch is wrong. A bounded unattended workflow may publish its task branch and draft pull request. Review, approval, merge, and auto-merge require separately named capabilities with actor, repository, ref, domain, gate, and revocation scope.

## BRANCH — working approach

→ [standard](standards-git.md)

Working-copy topology and review flow follow local protection, review, and concurrency needs.

- **BRANCH-1 [J] — working approach matches the delivery boundary** — Primary-checkout, branch-with-PR, worktree-with-PR, and local worktree integration approaches follow repository policy, review needs, concurrency, and unattended isolation. (standards-git.md#working-copy-and-review-approaches, standards-git.md#local-integration-write-boundary)
  - _Evidence scope:_ The selected repository, requested change, current `git branch --show-current` and `git worktree list` evidence, protection policy, concurrency, and review boundary.
  - _Review prompt:_ Does the selected approach satisfy isolation and review needs, and does local worktree integration use an authorised owner and serialised destination write without imposing remote publication?
  - _Outcomes:_ conforming; use single-working-copy-on-main; use single-working-copy-on-branch-with-pr; use worktrees-with-pr; use worktrees-with-local-integration
  - _Conforming guidance:_ Use the primary checkout for ordinary interactive work. Isolate unattended implementation. When delivery is local-only, independently review the candidate and integrate through the authorised serialised write boundary without requiring a push or pull request.
- **BRANCH-2 [J] — finished worktrees are integrated or disposed** — Finished linked worktrees are inspected, deliberately integrated or disposed, removed, and pruned without losing unmerged work. (standards-git.md)
  - _Evidence scope:_ Every linked worktree in `git worktree list --porcelain`, its branch, `git status --short`, commits not reachable from the intended integration branch, branch diff, and delivery authority.
  - _Review prompt:_ For each finished linked worktree, is its work deliberately integrated or explicitly disposed before the worktree and any proven-redundant local branch are removed?
  - _Outcomes:_ conforming; integrate worktree; dispose worktree; ownership decision required
  - _Conforming guidance:_ Inspect before removal. Integrate coherent authorised work; dispose only confirmed unwanted work. Delete a branch only after proving reachability or no remaining diff, prune stale metadata, and retain only intentionally active worktrees.
- **BRANCH-3 [J] — linked worktrees use a safe runtime-owned root** — Linked working files stay outside the primary working tree and Git common directory under a collision-safe runtime-owned root. (standards-git.md#worktree-location)
  - _Evidence scope:_ Every linked worktree path, the repository primary working tree, Git common directory, estate discovery roots, and the runtime that owns creation and retirement.
  - _Review prompt:_ Is each linked worktree contained under an explicit runtime-owned root outside the repository and its Git common directory, excluded from estate discovery, and uniquely keyed to avoid collisions?
  - _Outcomes:_ conforming; relocate worktree root; define runtime ownership; collision risk
  - _Conforming guidance:_ Use one runtime-owned application-state or XDG root with repository and task identity. Do not place working files inside the repository, under `.git`, or in an estate-scanned workspace tree.

## HYGIENE — Git working hygiene

→ [standard](standards-git.md)

Git operations preserve shared worktree state and recoverability.

- **HYGIENE-1 [J] — Git working hygiene preserves unrelated state** — Git work preserves a potentially shared working tree through thread-local touched paths, explicit staging, contested-path coordination, and serialized commit windows. (standards-git.md)
  - _Evidence scope:_ The pre-edit and current working tree (`git status --short`), expected `HEAD`, the thread-local touched-path set, touched and staged diffs, contested paths, and Git write operations for the selected work.
  - _Review prompt:_ After recording the pre-edit state and expected `HEAD`, assess whether the thread tracked every path it may have changed, withheld pre-existing or overlapping paths for coordination, staged only enumerated uncontested paths, preserved unrelated staged and unstaged work, and serialised the commit window that advances shared `HEAD`.
  - _Outcomes:_ conforming; state inspection required; staging correction required; operation coordination required
  - _Conforming guidance:_ Maintain a thread-local touched-path set, re-check status, `HEAD`, touched diffs, and staged paths before committing, and use `git add -- <path>...` only for enumerated uncontested paths. Never use `git add -A`, `git add .`, `git add -u`, `git commit -a`, `git commit -am`, or broad wildcard pathspecs in a shared tree. Leave contested and unrelated work untouched, and serialize only the shared-index and commit window.

## LOCK — stale-lock semantics

→ [standard](standards-git.md)

The stale-lock guard remains bounded recovery rather than general cleanup.

- **LOCK-1 [J] — stale-lock recovery preserves the safety boundary** — Stale-lock recovery follows the guard’s worktree, process, containment, and file-type limits. (standards-git.md)
  - _Evidence scope:_ Every stale-lock candidate and its physical-worktree, relevant-process, containment, and regular-file evidence.
  - _Review prompt:_ Assess whether stale-lock recovery remains best-effort: it must not interrupt Git, cross the current physical worktree boundary, remove ambiguous or symlinked candidates, or act when process inspection is inconclusive.
  - _Outcomes:_ conforming; safe removal authorised; leave untouched; investigation required
  - _Conforming guidance:_ Remove only a clearly stale regular lock within the current physical worktree after process checks; otherwise leave it untouched and investigate through the repository owner.
