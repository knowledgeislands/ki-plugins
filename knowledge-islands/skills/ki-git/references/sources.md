# Sources — ki-git

**Refresh:** external-spec · quarterly

## Authoritative

| Source                           | Governs                                   | Last reviewed |
| -------------------------------- | ----------------------------------------- | ------------- |
| [Conventional Commits 1.0.0][cc] | commit-message grammar and optional scope  | 2026-08-12    |
| [Git documentation][git]         | Git command and worktree vocabulary        | 2026-08-12    |
| [Git workflows][workflows]       | upstream workflow guidance                 | 2026-08-12    |
| [git-worktree][worktree]         | linked-worktree terminology and boundaries | 2026-08-12    |

[cc]: https://www.conventionalcommits.org/en/v1.0.0/
[git]: https://git-scm.com/docs/git
[workflows]: https://git-scm.com/docs/gitworkflows
[worktree]: https://git-scm.com/docs/git-worktree

## In-house evidence

| Source                                     | Governs                                          | Last reviewed |
| ------------------------------------------ | ------------------------------------------------ | ------------- |
| Harness commit history                     | current type vocabulary and direct-main practice | 2026-08-12    |
| `hooks/git-lock-check.sh` and its run test | stale-lock guard semantics and safety boundary   | 2026-08-12    |
| GDR-KI-HARNESS-003                         | portable ownership boundaries                    | 2026-08-12    |

## Last review

The 2026-08-12 refresh re-checked the primary Git, Git workflow, and worktree documentation. `git-worktree` now supplies the direct terminology source for the guard's linked-worktree boundary; the harness hook and its run test remain the normative local safety contract.

Conventional Commits confirms the `type(scope): summary` shape; the Knowledge Islands type vocabulary is deliberately narrower and records only types established in current practice.

Git and workflow documentation remain supporting source context, while the harness keeps the concrete safety limits for the local hook. The native rubric remains judgment-only: its source-backed prompts name the minimum read-only evidence but do not claim a mechanical Git-state audit.

Refresh quarterly, or earlier when Git behaviour, the commit vocabulary, the hook contract, or a runtime-binding boundary changes.
