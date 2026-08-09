# Sources — where the standard comes from

**Refresh:** external-spec · quarterly

The authoritative and in-house sources behind the [tool-repository standard](standards-tool-repositories.md) and [rubric](rubric.md). Mode REFRESH reads this file, re-fetches each source, and diffs it against the standard plus the structured catalogue under `scripts/rubric/items/`. It then **bumps the `Last reviewed` dates** and refreshes the `## Last review` block below; what changed belongs in the commit, not a changelog here.

Two layers feed the standard: the **external specs** (shellcheck, bats, keep-a-changelog, semver, XDG) that a conformant tool repo builds on, and the **in-house reference repos** (`tools-mgit` and `tools-ki`) that fix the opinionated shape. A finding is only "spec-driven" if it traces to an external spec; everything else is house style layered on top and should be labelled as such.

## External specs

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| SHELLCHECK | [ShellCheck][shellcheck] | Shell-tool lint gate (SHELL-LINT) — clean in CI | 2026-07-09 |
| BATS | [bats-core][bats] | Shell-tool test framework (SHELL-TEST) — `*.bats` + CI run | 2026-07-09 |
| CHANGELOG | [Keep a Changelog][keepachangelog] | Optional chronological changelog shape | 2026-07-30 |
| SEMVER | [Semantic Versioning 2.0.0][semver] | `vX.Y.Z` version marker + release tags | 2026-07-09 |
| XDG | [XDG Base Directory Specification][xdg] | Where the tool writes config/state/cache | 2026-07-09 |

## In-house (the reference repo)

The opinionated shape is fixed by the reference tool repo under `knowledgeislands/`. It is the living source of truth for house style; when the standard and the repo diverge, decide which is right and reconcile.

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| MGIT | `tools-mgit` | Bash entrypoint, installer override/link behaviour, workspace/repository command grouping | 2026-07-30 |
| KI | `tools-ki` | Typed command host, owned-syntax diagnostics, completion, signed installer, manual distribution | 2026-07-30 |

## Last review

REFRESH last run **2026-07-30**. The standard now reflects `tools-mgit` and `tools-ki`: semantic-version release baselines, singular completion, owned-syntax diagnostics, installed/linkable manuals, and independent schema-one workspace manifests only where their structure evolves.

**Open watch-items:**

- `tools-mgit` has a physical manual but its current CI does not run `mandoc -T lint man/mgit.1` (MAN-LINT). Restore that source-repository gate; do not weaken the manual capability conditional.
- Homebrew's own audit surface (`brew audit` / `brew style`, the Formula Cookbook) is tracked by the sibling `ki-repo-homebrew-tap` skill, not here — reconcile the tap-facing half there.
- If a second shell-specific concern emerges beyond shellcheck + bats, reconsider a dedicated `ki-shell` skill (deliberately not created at n=1).

[shellcheck]: https://www.shellcheck.net/
[bats]: https://bats-core.readthedocs.io/
[keepachangelog]: https://keepachangelog.com/en/1.1.0/
[semver]: https://semver.org/spec/v2.0.0.html
[xdg]: https://specifications.freedesktop.org/basedir-spec/latest/
