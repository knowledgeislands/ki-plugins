# Sources — where the standard comes from

**Refresh:** external-spec · quarterly

The authoritative and in-house sources behind the [tool-repo standard](tools-standard.md) and [audit-rubric.md](audit-rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + [`scripts/audit.ts`](../scripts/audit.ts), then **bumps the `Last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

Two layers feed the standard: the **external specs** (shellcheck, bats, keep-a-changelog, semver, XDG) that a conformant tool repo builds on, and the **in-house reference repo** (`tools-mgit`) that fixes the opinionated shape. A finding is only "spec-driven" if it traces to an external spec; everything else is house style layered on top and should be labelled as such.

## External specs

| Tag        | Source                                  | Governs                                                    | Last reviewed |
| ---------- | --------------------------------------- | ---------------------------------------------------------- | ------------- |
| SHELLCHECK | [ShellCheck][shellcheck]                | Shell-tool lint gate (SHELL-LINT) — clean in CI            | 2026-07-09    |
| BATS       | [bats-core][bats]                       | Shell-tool test framework (SHELL-TEST) — `*.bats` + CI run | 2026-07-09    |
| CHANGELOG  | [Keep a Changelog][keepachangelog]      | `CHANGELOG.md` shape (Unreleased head, dated versions)     | 2026-07-09    |
| SEMVER     | [Semantic Versioning 2.0.0][semver]     | `vX.Y.Z` version marker + release tags                     | 2026-07-09    |
| XDG        | [XDG Base Directory Specification][xdg] | Where the tool writes config/state/cache                   | 2026-07-09    |

## In-house (the reference repo)

The opinionated shape is fixed by the reference tool repo under `knowledgeislands/`. It is the living source of truth for house style; when the standard and the repo diverge, decide which is right and reconcile.

| Tag  | Source                            | Governs                                                                      | Last reviewed |
| ---- | --------------------------------- | ---------------------------------------------------------------------------- | ------------- |
| REPO | `tools-mgit` (the reference repo) | `bin/<tool>` + exec bit, `install.sh` overrides/verify/idempotence, CI shape | 2026-07-09    |

## Last review

REFRESH last run **2026-07-09** (initial authoring alongside ADR-KI-HARNESS-SKILLS-009). Standard, rubric, and `audit.ts` established against `tools-mgit` as the reference shape and the external specs above. No open watch-items yet.

**Open watch-items:**

- Homebrew's own audit surface (`brew audit` / `brew style`, the Formula Cookbook) is tracked by the sibling `ki-homebrew-tap` skill, not here — reconcile the tap-facing half there.
- If a second shell-specific concern emerges beyond shellcheck + bats, reconsider a dedicated `ki-shell` skill (deliberately not created at n=1).

[shellcheck]: https://www.shellcheck.net/
[bats]: https://bats-core.readthedocs.io/
[keepachangelog]: https://keepachangelog.com/en/1.1.0/
[semver]: https://semver.org/spec/v2.0.0.html
[xdg]: https://specifications.freedesktop.org/basedir-spec/latest/
