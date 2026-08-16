---
name: ki-bootstrap
ki-kind: process
ki-depends-on: []
description: >
  Explains first-time Knowledge Islands activation through the `ki` CLI: bootstrap a user, select a verified canonical harness, and distinguish user skills from repository-declared governance. Use for guidance on `ki bootstrap`, `ki harness`, `ki skill add/remove`, `ki repo skill add/remove`, and `ki dev local`; the CLI itself owns all mechanics. Triggers: "set up KI", "what does ki bootstrap do", "activate a KI skill", "why won't ki repo audit run". For repository coverage use `ki-repo`; for command behaviour use `ki help`.
argument-hint: 'help | refresh'
---

# Knowledge Islands Bootstrap

The `ki` CLI owns installation, activation, and repository operations. This guidance-only skill explains that command surface; it has no executable catalogue, checker, or alternative executor.

Read [the bootstrap standard](references/standards-bootstrap.md) when the installation, activation, or trust boundary matters. Use [the exemplars](references/exemplars.md) for concrete command sequences.

## First-time user setup

Run `ki bootstrap`.

KI detects supported local agent runtimes, creates its XDG configuration if absent, installs the canonical `knowledgeislands/ki-agentic-harness`, and links the core user skills into each detected agent's user skill directory.

Run `ki bootstrap --refresh` to redetect agents and reconcile the recorded harness and managed user-skill inventory with installed state.

The user configuration and installed harness payloads are separate from a repository's `.ki-config.toml`.

## Harnesses and skills

`ki harness list`, `ki harness info <id>`, `ki harness install <id>`, and `ki harness uninstall <id>` manage compatible installed harnesses. The canonical harness is always retained.

`ki skill add <skill>` and `ki skill remove <skill>` manage a skill in configured user agent spaces.

`ki repo skill add <skill>` and `ki repo skill remove <skill>` manage a skill's repository declaration and runtime link. They affect only the selected repository; they never alter user activation.

Managed activation is fail-closed. If a link, installed payload, or development projection is unfamiliar, altered, escaping, or otherwise unsafe, use the owning `ki` diagnostic and repair command; do not copy or delete files across source, installed, and runtime-discovery surfaces. Start a new agent session after changing activation or the selected development source so the runtime re-scans its discovery directories.

## Repository operations

`.ki-config.toml` declares the skills that govern a repository. `ki repo educate`, `ki repo audit`, and `ki repo conform` resolve only those declarations and their explicit dependencies from installed harnesses.

Missing, incompatible, undeclared, or ambiguous skills fail before an audit or conform operation runs. The CLI executes native rubric catalogues; it never uses repository-vendored runners or `.ki/bin` wrappers.

## Development boundary

An installed verified payload is the authoritative source of capabilities. Local development is explicit: `ki dev local set <path>` validates and records a checkout, `ki dev local on` selects it, and `ki dev local off` restores the verified canonical archive. A selected local checkout is a mutable development source, not a verified installed payload; activation and loaded runtime capability remain separate host evidence.

For command grammar, run `ki help`. For repository coverage, use `ki-repo`.

## Operating modes

### Mode HELP

Explain the first-time bootstrap, installed-harness, user-activation, repository-activation, and native repository-operation boundaries above. Route exact command and option questions to `ki help`; route `.ki-config.toml` coverage questions to `ki-repo`.

### Mode REFRESH

This mode refreshes guidance, not user or repository state.

1. Read [the source list](references/sources.md) and re-check the delivered `tools-ki` command surface, the compatible-harness contract, and the repository declaration contract.
2. Diff them against [the bootstrap standard](references/standards-bootstrap.md), this routing overview, and [the exemplars](references/exemplars.md).
3. Update only this skill's guidance and source review record. Record behavioural history in git rather than adding a changelog.
