# Audit Rubric

Line-by-line pass/fail items for auditing a Knowledge Islands `tools-*` repo against the [tool-repo standard](tools-standard.md). Run [`../scripts/audit.ts`](../scripts/audit.ts) for the mechanical items (marked **[M]**), then judge the rest ( **[J]** ) by reading.

Every **[M]** item corresponds to a check in the checker (per `ki-skills`' SHAPE-9 + the checker-contract). Severity uses the shared ladder, defined in `ki-engineering`'s [`enforcement-framework.md`](../../../foundations/ki-engineering/references/enforcement-framework.md) §2: **FAIL** (ship-stopper), **WARN** (expected-but-missing / divergence), **POLISH** (consistency), **ADVISORY** (needs a human/out-of-band check), **INFO** (context).

Applicability: `[ki-tools]` or `bin/` activates the complete audit. With neither, **CONFIG [M]** emits exactly one `NA` and stops; either signal retains all existing findings. ([standard](tools-standard.md#scope-container-not-contents))

## Contents

- [Layout & executable](#layout--executable)
- [Distribution & versioning](#distribution--versioning)
- [Capability conditionals](#capability-conditionals)
- [Config table](#config-table)
- [Releases](#releases)

## Layout & executable

- [ ] [M] FAIL — `TOOL-BIN`: `bin/` exists and holds ≥1 file. Absent ⇒ FAIL (no tool). (references/tools-standard.md#repository-layout)
- [ ] [M] FAIL — `TOOL-EXEC`: every `bin/<file>` carries the executable bit (`statSync(mode) & 0o111`). Git tracks the exec bit; a bin file without it breaks the installer and formula. (references/tools-standard.md#the-executable--bintool)
- [ ] [J] WARN — the tool is genuinely **one** tool; a repo shipping two distinct commands is two repos.
- [ ] [J] POLISH — the tool follows the XDG Base Directory spec for any config/state/cache it writes (no stray `$HOME` dotfiles).

## Distribution & versioning

- [ ] [M] WARN — `TOOL-INSTALL`: `install.sh` is present at the repo root and executable (the `curl | bash` contract). (references/tools-standard.md#the-distribution-contract)
- [ ] [J] WARN — `install.sh` is POSIX-ish, honours env overrides (target dir + version/ref), verifies the download, and is idempotent.
- [ ] [M] WARN — `TOOL-VERSION`: the primary bin file contains `--version` handling (grep). ADVISORY when the file can't be read. (references/tools-standard.md#versioning--releases)
- [ ] [J] WARN — the version marker is a single literal (one source of truth) that `--version` prints; it agrees with the latest tag and CHANGELOG entry.
- [ ] [M] WARN — `TOOL-CHANGELOG`: `CHANGELOG.md` is present. (README / LICENSE are `ki-repo`'s — not checked here.) (references/tools-standard.md#versioning--releases)
- [ ] [J] WARN — `CHANGELOG.md` follows keep-a-changelog + semver (an `## [Unreleased]` head, dated `## [X.Y.Z]` sections, Added/Changed/Fixed/Removed groups).
- [ ] [M] WARN — `TOOL-CI`: at least one `.github/workflows/*.yml` is present. (references/tools-standard.md#repository-layout)
- [ ] [J] WARN — a companion Homebrew formula exists in the tap (`Formula/<name>.rb`) as the second delivery channel. The tap itself is `ki-homebrew-tap`'s to audit.

## Capability conditionals

- [ ] [M] WARN — `TOOL-TESTS`: a `tests/` directory is present (the executable test suite). (references/tools-standard.md#repository-layout)
- [ ] [M] WARN — `SHELL-LINT` (capability): **if** the primary bin has a `bash`/`sh` shebang, a CI workflow references `shellcheck`. (references/tools-standard.md#capability-conditionals)
- [ ] [M] WARN — `SHELL-TEST` (capability): **if** shell, `tests/` holds a `*.bats` file **and** a CI workflow references `bats`. (references/tools-standard.md#capability-conditionals)
- [ ] [M] INFO — `LANG-DEFER`: **if** a `package.json` is present, the repo is a TS/Bun tool — it defers lint/test to `ki-engineering` and MUST also declare `[ki-engineering]`. (references/tools-standard.md#capability-conditionals)
- [ ] [J] WARN — a `package.json`-bearing repo actually declares `[ki-engineering]` (the checker notes the requirement; confirm the table is there).
- [ ] [J] POLISH — a non-shell, non-JS tool (Python, Go, …) wires its own language toolchain into CI (lint + test).

## Config table

- [ ] [M] WARN — `CONFIG`: a `[ki-tools]` table is present in `.ki-config.toml` (the opt-in marker). Missing file or table ⇒ WARN. (references/tools-standard.md#the-ki-tools-marker)
- [ ] [M] WARN — `CONFIG`: validate-down — any key inside `[ki-tools]` is unknown today and WARNs. (references/tools-standard.md#the-ki-tools-marker)

## Releases

- [ ] [J] ADVISORY — `RELEASE`: releases are `vX.Y.Z` git tags, each with a GitHub release; the marker, tag, and CHANGELOG top entry agree. Not checkable from a path — the checker emits an ADVISORY; verify tags/releases by hand (`git tag`, `gh release list`). (references/tools-standard.md#versioning--releases)
