<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — command-line tool repository structure

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-tools --write`.

Line-by-line criteria for auditing ki-repo-tools. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [TOOL — tool repository](#tool--tool-repository)
- [SHELL — shell capabilities](#shell--shell-capabilities)
- [LANG — language capabilities](#lang--language-capabilities)
- [COMP — completion capabilities](#comp--completion-capabilities)
- [MAN — manual capabilities](#man--manual-capabilities)
- [CONFIG — configuration](#config--configuration)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## TOOL — tool repository

→ [standard](standards-tool-repositories.md)

Layout, executable, distribution, versioning, and judgment criteria.

- **TOOL-BIN [M] — Tool executable** — `bin/` exists and holds at least one physical file. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Correct the evidenced tool-repository issue through the responsible maintainer; hosted conform does not infer tool, release, or documentation semantics.
- **TOOL-EXEC [M] — Executable bit** — Every physical `bin/<file>` carries the executable bit. (standards-tool-repositories.md)
  - _Remediation:_ automatic
- **TOOL-SCOPE [J] — One command** — The repository contains genuinely one tool rather than distinct commands. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ The repository contains genuinely one tool rather than distinct commands.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-XDG [J] — XDG storage** — The tool follows the XDG Base Directory specification for config, state, and cache. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ The tool follows the XDG Base Directory specification for config, state, and cache.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-SCHEMA [J] — Persisted manifest schema** — Each evolving persisted structural format declares and strictly validates its own integer schema, provides migration or clear rejection for incompatible forms, and does not add a ceremonial schema to stable leaf metadata. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ Each evolving persisted structural format declares and strictly validates its own integer schema, provides migration or clear rejection for incompatible forms, and does not add a ceremonial schema to stable leaf metadata.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-INSTALL [M] — Installer executable** — `install.sh` is a physical executable file. (standards-tool-repositories.md)
  - _Remediation:_ automatic
- **TOOL-INSTALL-QUALITY [J] — Installer quality** — The installer is POSIX-ish, honours overrides, verifies downloads, and is idempotent. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ The installer is POSIX-ish, honours overrides, verifies downloads, and is idempotent.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-VERSION [M] — Version flag** — Runtime `--version` execution is an explicit, isolated diagnostic outside this static audit. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Correct the evidenced tool-repository issue through the responsible maintainer; hosted conform does not infer tool, release, or documentation semantics.
- **TOOL-VERSION-SOURCE [J] — Version source** — The version marker has one source of truth aligned with the latest tag and changelog. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ The version marker has one source of truth aligned with the latest tag and changelog.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-RELEASE-MARKERS [M] — Release marker alignment** — From package version 1.0.0 onward, package.json and CHANGELOG.md current local release markers agree. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Correct the evidenced tool-repository issue through the responsible maintainer; hosted conform does not infer tool, release, or documentation semantics.
- **TOOL-CHANGELOG [M] — Changelog presence** — `CHANGELOG.md` is a physical regular file. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Correct the evidenced tool-repository issue through the responsible maintainer; hosted conform does not infer tool, release, or documentation semantics.
- **TOOL-CHANGELOG-FORMAT [J] — Changelog format** — The changelog identifies the current semantic-versioned release through either Keep a Changelog entries or a declared current-release baseline. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ The changelog identifies the current semantic-versioned release through either Keep a Changelog entries or a declared current-release baseline.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-CLI [J] — Shared CLI conventions** — The CLI keeps help, completion, errors, exit status, README, and changelog aligned: help succeeds; success, operational errors, and invalid owned syntax use 0, 1, and 2; completion is singular; invalid owned syntax reports a namespaced error with usage before help. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ The CLI keeps help, completion, errors, exit status, README, and changelog aligned: help succeeds; success, operational errors, and invalid owned syntax use 0, 1, and 2; completion is singular; invalid owned syntax reports a namespaced error with usage before help.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-CI [M] — CI workflow** — At least one physical workflow YAML file is present. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Correct the evidenced tool-repository issue through the responsible maintainer; hosted conform does not infer tool, release, or documentation semantics.
- **TOOL-TAP [J] — Companion formula** — A companion Homebrew formula exists in the governed tap. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ A companion Homebrew formula exists in the governed tap.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-TESTS [M] — Test directory** — A physical `tests/` or `src/tests/` directory is present. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Correct the evidenced tool-repository issue through the responsible maintainer; hosted conform does not infer tool, release, or documentation semantics.
- **TOOL-ENGINEERING [J] — Engineering declaration** — A package.json-bearing repository declares ki-engineering. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ A package.json-bearing repository declares ki-engineering.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-LANGUAGE [J] — Other-language toolchain** — A non-shell, non-JavaScript tool wires its own lint and test toolchain into CI. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ A non-shell, non-JavaScript tool wires its own lint and test toolchain into CI.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TOOL-RELEASE-CHECK [J] — Release alignment** — Version markers, tags, releases, and changelog entries agree. (standards-tool-repositories.md)
  - _Evidence scope:_ The target command-line tool repository and the evidence named by this criterion.
  - _Review prompt:_ Version markers, tags, releases, and changelog entries agree.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tool repository through its responsible maintainer, record a named gap, or record an explicit justified exclusion.

## SHELL — shell capabilities

→ [standard](standards-tool-repositories.md)

Shell-specific CI requirements.

- **SHELL-LINT [M] — Shell lint CI** — Shell entrypoints have a physical CI workflow that references shellcheck. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Add or correct the shellcheck CI evidence through the repository’s maintained workflow.
- **SHELL-TEST [M] — Shell test CI** — Shell entrypoints have a physical Bats suite referenced by CI. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Add or correct the Bats suite and CI evidence through the repository’s maintained test workflow.

## LANG — language capabilities

→ [standard](standards-tool-repositories.md)

Language toolchain deferral.

- **LANG-DEFER [M] — JavaScript toolchain deferral** — A package.json-bearing tool defers lint and test to ki-engineering. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Route package toolchain concerns to ki-engineering; this tool rubric does not infer language-specific lint or test changes.

## COMP — completion capabilities

→ [standard](standards-tool-repositories.md)

Portable Bash and Zsh completion output, integration, and ownership.

- **COMP-SURFACE [J] — Completion command surface** — The CLI exposes exactly one documented completion <shell> action at a stable command path; it accepts bash and zsh, prints only the selected definition to standard output, and rejects unsupported shells as owned invalid syntax. (standards-tool-repositories.md)
  - _Evidence scope:_ The CLI completion command, its supported shells, output, and invalid-input behaviour.
  - _Review prompt:_ The CLI exposes exactly one documented completion <shell> action at a stable command path; it accepts bash and zsh, prints only the selected definition to standard output, and rejects unsupported shells as owned invalid syntax.
  - _Outcomes:_ conforming; surface revision required; compatibility decision required
  - _Conforming guidance:_ Revise the documented completion surface and its validation tests, or record the owning compatibility decision before changing command behaviour.
- **COMP-INTEGRATION [J] — Completion integration** — The Bash definition registers the executable with complete; the Zsh definition is an autoloadable _<tool> artifact with #compdef and compdef registration that does not invoke itself while loading. Tests cover both emitted forms and Zsh registration under compinit. (standards-tool-repositories.md)
  - _Evidence scope:_ The emitted Bash and Zsh completion definitions and their integration tests.
  - _Review prompt:_ The Bash definition registers the executable with complete; the Zsh definition is an autoloadable _<tool> artifact with #compdef and compdef registration that does not invoke itself while loading. Tests cover both emitted forms and Zsh registration under compinit.
  - _Outcomes:_ conforming; definition revision required; test evidence required
  - _Conforming guidance:_ Correct the emitted definition and add or update the shell integration evidence without changing user persistence ownership.
- **COMP-OWNERSHIP [J] — Completion persistence ownership** — The tool does not edit shell startup files or personal completion directories. A shell configuration, package manager, or configuration manager persists the generated artifact and arranges fpath before compinit for Zsh. (standards-tool-repositories.md)
  - _Evidence scope:_ The tool installer and the shell, package-manager, or configuration-manager persistence boundary.
  - _Review prompt:_ The tool does not edit shell startup files or personal completion directories. A shell configuration, package manager, or configuration manager persists the generated artifact and arranges fpath before compinit for Zsh.
  - _Outcomes:_ conforming; ownership correction required; integration decision required
  - _Conforming guidance:_ Keep persistent shell configuration outside the tool installer and route any integration change to its owning shell or configuration layer.

## MAN — manual capabilities

→ [standard](standards-tool-repositories.md)

Man-page linting requirements.

- **MAN-LINT [M] — Manual lint CI** — A physical man/<tool>.1 page has CI that runs mandoc -T lint, directly or through the native task runner. (standards-tool-repositories.md)
  - _Remediation:_ diagnostic — Add or correct the mandoc CI gate through the repository’s maintained release workflow.
- **MAN-INSTALL [J] — Manual distribution** — A shipped physical man page is installed by the release installer and linked with the executable by its --link mode. (standards-tool-repositories.md)
  - _Evidence scope:_ The shipped manual page, release installer, and executable link mode.
  - _Review prompt:_ A shipped physical man page is installed by the release installer and linked with the executable by its --link mode.
  - _Outcomes:_ conforming; installer revision required; distribution decision required
  - _Conforming guidance:_ Align the installer and link behaviour with the shipped manual, or record the release-distribution decision that changes the supported path.
- **MAN-SURFACE [J] — Manual command surface** — A physical manual stays aligned with CLI help and uses the tool’s command-group vocabulary in its SYNOPSIS. (standards-tool-repositories.md)
  - _Evidence scope:_ The physical manual, CLI help, and documented command-group vocabulary.
  - _Review prompt:_ A physical manual stays aligned with CLI help and uses the tool’s command-group vocabulary in its SYNOPSIS.
  - _Outcomes:_ conforming; manual revision required; CLI vocabulary decision required
  - _Conforming guidance:_ Revise the manual or CLI help so the SYNOPSIS and command vocabulary agree, or record the governing vocabulary decision.
- **MAN-GUIDANCE [J] — Manual installation and completion guidance** — A physical manual documents the supported release and local-development installation paths, including manual installation or linking, and identifies the canonical completion action without assigning shell-startup mutation to the tool installer. (standards-tool-repositories.md)
  - _Evidence scope:_ The physical manual’s installation and completion guidance.
  - _Review prompt:_ A physical manual documents the supported release and local-development installation paths, including manual installation or linking, and identifies the canonical completion action without assigning shell-startup mutation to the tool installer.
  - _Outcomes:_ conforming; guidance revision required; ownership decision required
  - _Conforming guidance:_ Update the manual’s supported installation and completion guidance while retaining the shell-startup ownership boundary.
- **MAN-STYLE [J] — Manual source and layout** — A physical manual uses portable roff macros, documents each configuration format canonically in FILES, uses a literal \& after each .SH / .SS followed by .PP before prose or a structural macro, and receives a rendered-spacing inspection after mandoc lint. (standards-tool-repositories.md)
  - _Evidence scope:_ The physical manual source, its roff macros, FILES section, and rendered spacing inspection.
  - _Review prompt:_ A physical manual uses portable roff macros, documents each configuration format canonically in FILES, uses a literal \& after each .SH / .SS followed by .PP before prose or a structural macro, and receives a rendered-spacing inspection after mandoc lint.
  - _Outcomes:_ conforming; manual layout revision required; rendered inspection required
  - _Conforming guidance:_ Correct the roff source and FILES documentation, then inspect rendered spacing in addition to passing mandoc lint.

## CONFIG — configuration

→ [standard](standards-tool-repositories.md)

Applicability marker and validate-down keys.

- **CONFIG-1 [M] — Opt-in marker and keys** — A keyless qualified `ki-repo-tools` marker is present and validated down. (standards-tool-repositories.md)
  - _Remediation:_ automatic
