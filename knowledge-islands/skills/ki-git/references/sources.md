# Sources — ki-git

**Refresh:** external-spec · quarterly

## Authoritative

| Source                           | Governs                                   | Last reviewed |
| -------------------------------- | ----------------------------------------- | ------------- |
| [Conventional Commits 1.0.0][cc] | commit-message grammar and optional scope | 2026-07-27    |
| [Git documentation][git]         | Git command and worktree vocabulary       | 2026-07-27    |
| [Git workflows][workflows]       | upstream workflow guidance                | 2026-07-27    |

[cc]: https://www.conventionalcommits.org/en/v1.0.0/
[git]: https://git-scm.com/docs/git
[workflows]: https://git-scm.com/docs/gitworkflows

## In-house evidence

| Source                                     | Governs                                          | Last reviewed |
| ------------------------------------------ | ------------------------------------------------ | ------------- |
| Harness commit history                     | current type vocabulary and direct-main practice | 2026-07-27    |
| `hooks/git-lock-check.sh` and its run test | stale-lock guard semantics and safety boundary   | 2026-07-27    |
| GDR-KI-HARNESS-003                         | portable ownership boundaries                    | 2026-07-27    |

## Last review

The initial review established the current portable surface from the harness's recent committed history and the tested stale-lock guard.

Conventional Commits confirms the `type(scope): summary` shape; the Knowledge Islands type vocabulary is deliberately narrower and records only types established in current practice.

Git and workflow documentation remain source context, while the harness keeps the concrete safety limits for the local hook.

Refresh quarterly, or earlier when Git behaviour, the commit vocabulary, the hook contract, or a runtime-binding boundary changes.
