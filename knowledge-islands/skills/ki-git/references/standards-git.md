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

- **`single-working-copy-on-main`** — use for small, focused, independently verified changes when local instructions permit direct commits and no isolated review boundary is needed. Human and agent threads may share the working copy when they retain disjoint file-level change boundaries and coordinate Git writes.
- **`single-working-copy-on-branch-with-pr`** — use when one delivery is active in the working copy and protection, the user, or a useful isolated review boundary calls for a branch and pull request. Multiple threads may contribute to that one delivery under the same shared-working-tree hygiene.
- **`worktrees-with-pr`** — use when concurrent or independently isolated deliveries need separate branches, indexes, and working files. Give each branch its own worktree and PR, then integrate through the repository's review and merge policy.

Do not invent a branch, pull-request, or worktree requirement merely because several actors may modify one working copy. Use worktrees when concurrent deliveries require separate branches or isolated working files; do not keep independent branch work in one working copy merely because separate indexes are possible.

## Safe Git hygiene

Treat every working tree as potentially shared by other human and agent threads, even when no concurrent actor is currently visible. Inspect `git status --short` and record the current `HEAD` before editing.

Each thread maintains a thread-local touched-path set containing every file it may have changed. Add paths as work proceeds, including both sides of a rename and any created, deleted, or generated file. This set is a file-level safety boundary, not a claim to individual lines, and it need not be written into the repository.

Record paths already dirty before first touch as pre-existing rather than claiming them. A path is contested when it was pre-existing, appears in another actor's touched-path set, or contains changes the current thread cannot fully account for. Do not stage or commit a contested path until the actors coordinate ownership of the complete file change; file-level tracking does not justify silently taking another actor's hunks.

Editing and read-only Git commands may proceed concurrently across disjoint paths. Serialize the short Git write window that uses the shared index or advances shared `HEAD`; any human or agent thread may take that window and commit its own work. Immediately before staging, re-check `HEAD`, `git status --short`, the touched-path diff, and existing staged paths. If `HEAD` moved, revalidate the touched paths against the new baseline. If the index contains another actor's staged work, leave it untouched and coordinate rather than clearing, replacing, or including it.

Stage only fully enumerated touched paths, using `git add -- <path>...`, and inspect the staged names and diff before committing. Never use whole-tree or implicit collection such as `git add -A`, `git add .`, `git add -u`, `git commit -a`, `git commit -am`, or a broad wildcard pathspec in a shared working tree: each can absorb another actor's work. A commit may include only uncontested paths from the committing thread's touched-path set.

For a delegated worker that must stage outside the shared commit window, a unique temporary `GIT_INDEX_FILE` may isolate its preparatory staging. A separate index does not isolate working files, serialize `HEAD`, or confer commit authority; the worker or coordinator still revalidates the touched paths and takes the same serialized commit window before advancing `HEAD`.

Prefer recoverable, explicit-path commits after independently verified work. A thread must stop and report rather than rebasing, resetting, restoring, or repairing another actor's working files, index, or history.

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

The native rubric exposes these four policy families as **judgment-only** review prompts. A rendered audit therefore leaves them unassessed until a reviewer records an outcome; it must never be interpreted as a Git-state pass. Gather the criterion's focused read-only evidence first: current and pre-edit status, expected `HEAD`, the thread's touched-path set, touched and staged diffs, and any contested paths for hygiene; current branch, worktree, protection, concurrency, and review evidence for the working approach; proposed diff and message for commit shape; and physical-worktree/process/file-type evidence for a lock candidate. The rubric does not execute Git commands or a private wrapper on the reviewer's behalf.

No compatible mechanical enforcement, `.ki.toml` activation, user-skill activation, or commit-message enforcement exists yet.

Any future enforcement must be limited to deterministic rules explicitly added to this standard after its host execution contract is designed.
