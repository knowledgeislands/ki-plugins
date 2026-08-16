# Git standard

## Scope and ownership

`ki-git` is the sole owner of portable Knowledge Islands Git and commit policy.

It governs commit messages, branch-selection guidance, safe working hygiene, and the stale-lock guard's semantic contract.

`ki-repo` owns each repository's GitHub configuration and branch-protection choice.

The harness owns hook payload sources under `hooks/`, and `ki-repo-dotfiles-chezmoi` owns runtime-specific Claude Code settings registration.

Neither owner transfers Git policy or hook-install authority to `ki-git`.

## Commit messages

Use Conventional Commit subject lines in the form `type(scope): summary`, or `type: summary` when a scope does not clarify the change.

The current portable type vocabulary is `chore`, `docs`, `feat`, `fix`, `refactor`, and `test`.

Use a lowercase kebab-case scope that names the changed concern when one helps, and write a short imperative summary without terminal punctuation.

Choose the narrowest type that describes the committed unit rather than combining unrelated changes.

Historic messages are not rewritten merely to conform to this current convention.

Other skills MAY define a narrowly-scoped trailer block as durable evidence for their own concern. For example, `ki-engineering` owns the `KI-Consistency-Review-*` block for an advisory code-consistency review. That block is portable commit metadata, not a new Git-hygiene policy: `ki-git` neither interprets its engineering outcome nor requires it on ordinary commits.

## Working-copy and review approaches

`main` is open by default in Knowledge Islands repositories.

Select one of three approaches from repository policy, the requested review boundary, and whether work must proceed concurrently:

- **`single-working-copy-on-main`** — use for a small, focused, independently verified change when local instructions permit direct commits and no isolated review boundary is needed.
- **`single-working-copy-on-branch-with-pr`** — use when one delivery is active in the working copy and protection, the user, or a useful isolated review boundary calls for a branch and pull request.
- **`worktrees-with-pr`** — use when concurrent or independently isolated deliveries need separate branches, indexes, and working files. Give each branch its own worktree and PR, then integrate through the repository's review and merge policy.

Do not invent a branch or pull-request requirement where protection, the user, the review boundary, or concurrent isolation does not call for one. Conversely, do not keep concurrent branch work in one working copy merely because separate indexes are possible.

## Safe Git hygiene

Treat the working tree as shared state: inspect it before staging, stage only the intended paths, and keep unrelated changes out of a commit.

Read-only Git commands may run independently. Worktrees are the clear approach when concurrent deliveries need separate working files and PRs. If explicitly coordinating concurrent delegated work in one worktree instead, assign each worker a unique temporary index path and pass it on every Git write command: `GIT_INDEX_FILE=<worker-index> git <write-command>`. This isolates staging but does not isolate working files or branches.

Separate indexes do not serialize shared `HEAD`. The orchestrator must serialize commits, re-check the expected `HEAD` before each commit, and integrate one verified explicit-path commit at a time. A worker must stop and report if its expected baseline changes; it must not rebase, reset, or repair another worker's index or history.

Prefer recoverable, explicit-path commits after independently verified work.

Do not remove a lock merely because it exists, interrupt a live Git process to clear one, or use destructive history or worktree operations without explicit authority.

Separate pathspecs with `--` whenever a path begins with `-`, because Git parses a leading `-` as an option: `git add '-/README.md'` fails with `unknown switch`, while `git add -- '-/README.md'` succeeds.

This affects every KI-conformant repository, not an unusual corner case: the repo standard scaffolds a top-level `-/` working area (`ki-repo` WORK-1), so any `add`, `restore`, `checkout`, `diff`, `log`, or `rm` naming a path inside it needs the separator.

## Stale-lock guard

`hooks/git-lock-check.sh` is a best-effort recovery guard for a trusted user account, not a general cleanup command.

It may remove a real `*.lock` file only from the current worktree's physical Git directory, only after it has found no relevant Git process, and only after rechecking containment and file type immediately before removal.

It must leave state unchanged outside a worktree, when process inspection is inconclusive, for symlinked or non-regular candidates, and for linked-worktree or submodule administration directories outside the current worktree boundary.

The guard recovers locks left by interrupted commands; it never authorises interruption of a write-mode Git operation and does not claim protection against a same-UID adversary replacing administration paths concurrently.

The adjacent run test proves this semantic contract.

## Runtime binding and enforcement

The harness publishes hook payload sources; `ki-repo-dotfiles-chezmoi` may register a selected compatible payload in Claude Code settings.

`ki-git` neither installs hooks nor writes runtime settings.

The native rubric exposes these four policy families as **judgment-only** review prompts. A rendered audit therefore leaves them unassessed until a reviewer records an outcome; it must never be interpreted as a Git-state pass. Gather the criterion's focused read-only evidence first: current status and intended paths for hygiene, current branch, worktree, protection, concurrency, and review evidence for the working approach, proposed diff and message for commit shape, and physical-worktree/process/file-type evidence for a lock candidate. The rubric does not execute Git commands or a private wrapper on the reviewer's behalf.

No compatible mechanical enforcement, `.ki-config.toml` activation, user-skill activation, or commit-message enforcement exists yet.

Any future enforcement must be limited to deterministic rules explicitly added to this standard after its host execution contract is designed.
