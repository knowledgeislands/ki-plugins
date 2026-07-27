<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — command-line tool repository structure

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-tools --write`.

Line-by-line criteria for auditing ki-tools. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [TOOL — tool repository](#tool--tool-repository)
- [SHELL — shell capabilities](#shell--shell-capabilities)
- [LANG — language capabilities](#lang--language-capabilities)
- [CONFIG — configuration](#config--configuration)

## TOOL — tool repository

→ [standard](standards-tool-repositories.md)

Layout, executable, distribution, versioning, and judgment criteria.

- **TOOL-BIN [M] — Tool executable** — `bin/` exists and holds at least one physical file. (standards-tool-repositories.md)
- **TOOL-EXEC [M] — Executable bit** — Every physical `bin/<file>` carries the executable bit. (standards-tool-repositories.md)
- **TOOL-SCOPE [J] — One command** — The repository contains genuinely one tool rather than distinct commands. (standards-tool-repositories.md)
  - _Review prompt:_ The repository contains genuinely one tool rather than distinct commands.
- **TOOL-XDG [J] — XDG storage** — The tool follows the XDG Base Directory specification for config, state, and cache. (standards-tool-repositories.md)
  - _Review prompt:_ The tool follows the XDG Base Directory specification for config, state, and cache.
- **TOOL-INSTALL [M] — Installer executable** — `install.sh` is a physical executable file. (standards-tool-repositories.md)
- **TOOL-INSTALL-QUALITY [J] — Installer quality** — The installer is POSIX-ish, honours overrides, verifies downloads, and is idempotent. (standards-tool-repositories.md)
  - _Review prompt:_ The installer is POSIX-ish, honours overrides, verifies downloads, and is idempotent.
- **TOOL-VERSION [M] — Version flag** — The primary executable contains `--version` handling. (standards-tool-repositories.md)
- **TOOL-VERSION-SOURCE [J] — Version source** — The version marker has one source of truth aligned with the latest tag and changelog. (standards-tool-repositories.md)
  - _Review prompt:_ The version marker has one source of truth aligned with the latest tag and changelog.
- **TOOL-CHANGELOG [M] — Changelog presence** — `CHANGELOG.md` is a physical regular file. (standards-tool-repositories.md)
- **TOOL-CHANGELOG-FORMAT [J] — Changelog format** — The changelog follows Keep a Changelog and semantic versioning. (standards-tool-repositories.md)
  - _Review prompt:_ The changelog follows Keep a Changelog and semantic versioning.
- **TOOL-CI [M] — CI workflow** — At least one physical workflow YAML file is present. (standards-tool-repositories.md)
- **TOOL-TAP [J] — Companion formula** — A companion Homebrew formula exists in the governed tap. (standards-tool-repositories.md)
  - _Review prompt:_ A companion Homebrew formula exists in the governed tap.
- **TOOL-TESTS [M] — Test directory** — A physical `tests/` directory is present. (standards-tool-repositories.md)
- **TOOL-ENGINEERING [J] — Engineering declaration** — A package.json-bearing repository declares ki-engineering. (standards-tool-repositories.md)
  - _Review prompt:_ A package.json-bearing repository declares ki-engineering.
- **TOOL-LANGUAGE [J] — Other-language toolchain** — A non-shell, non-JavaScript tool wires its own lint and test toolchain into CI. (standards-tool-repositories.md)
  - _Review prompt:_ A non-shell, non-JavaScript tool wires its own lint and test toolchain into CI.
- **TOOL-RELEASE-CHECK [J] — Release alignment** — Version markers, tags, releases, and changelog entries agree. (standards-tool-repositories.md)
  - _Review prompt:_ Version markers, tags, releases, and changelog entries agree.

## SHELL — shell capabilities

→ [standard](standards-tool-repositories.md)

Shell-specific CI requirements.

- **SHELL-LINT [M] — Shell lint CI** — Shell entrypoints have a physical CI workflow that references shellcheck. (standards-tool-repositories.md)
- **SHELL-TEST [M] — Shell test CI** — Shell entrypoints have a physical Bats suite referenced by CI. (standards-tool-repositories.md)

## LANG — language capabilities

→ [standard](standards-tool-repositories.md)

Language toolchain deferral.

- **LANG-DEFER [M] — JavaScript toolchain deferral** — A package.json-bearing tool defers lint and test to ki-engineering. (standards-tool-repositories.md)

## CONFIG — configuration

→ [standard](standards-tool-repositories.md)

Applicability marker and validate-down keys.

- **CONFIG-1 [M] — Opt-in marker and keys** — A keyless `[ki-tools]` marker is present and validated down. (standards-tool-repositories.md)
