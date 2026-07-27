<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands repositories

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-repo --write`.

Line-by-line criteria for auditing ki-repo. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [FILES — Repository files](#files--repository-files)
- [GH — Core GitHub settings](#gh--core-github-settings)
- [PKG — Package metadata](#pkg--package-metadata)
- [MERGE — Merge policy](#merge--merge-policy)
- [TOGGLE — Repository features](#toggle--repository-features)
- [VIS — Visibility](#vis--visibility)
- [TOPICS — Topics](#topics--topics)
- [BP — Branch protection](#bp--branch-protection)
- [DEP — Dependency security](#dep--dependency-security)
- [SEC — Secret protection](#sec--secret-protection)
- [ACT — Actions policy](#act--actions-policy)
- [CHECKS — Check overrides](#checks--check-overrides)
- [COV — Governance coverage](#cov--governance-coverage)
- [STRUCT — Repository structure](#struct--repository-structure)
- [ACCESS — Repository access](#access--repository-access)
- [RUNTIMES — Runtime support](#runtimes--runtime-support)
- [DESCFIT — Description fitness](#descfit--description-fitness)
- [OVR — Override rationale](#ovr--override-rationale)
- [SYNC — Standard synchronisation](#sync--standard-synchronisation)
- [WORK — Working areas](#work--working-areas)

## FILES — Repository files

→ [standard](standards-repository.md)

Required local files and repository document quality.

- **FILES-1 [M] — Required repository files** — README, license, gitignore, editor configuration, Claude orientation, and the exact ki-repo config marker are present. (standards-repository.md)
- **FILES-3 [M] — Authoring baseline** — A governed repository declares ki-authoring explicitly. (standards-repository.md)
- **FILES-J1 [J] — Repository document content** — README and license content is accurate and current. (standards-repository.md)
  - _Review prompt:_ Read the README and license and assess whether they accurately describe and license this repository.

## GH — Core GitHub settings

→ [standard](standards-repository.md)

Default branch, licensing, and repository description.

- **GH-1 [M] — Default branch** — The default branch is main. (standards-repository.md)
- **GH-2 [M] — Declared license alignment** — The declared license agrees with GitHub and package.json. (standards-repository.md)
- **GH-3 [M] — Description presence and synchronisation** — The GitHub description is non-empty and matches package.json when that source exists. (standards-repository.md)

## PKG — Package metadata

→ [standard](standards-repository.md)

Package identity and repository metadata.

- **PKG-1 [M] — Package identity metadata** — package.json carries coherent identity and repository metadata when present. (standards-repository.md)

## MERGE — Merge policy

→ [standard](standards-repository.md)

GitHub merge and branch-cleanup behaviour.

- **MERGE-1 [M] — Merge policy** — The repository permits squash merges only and deletes merged head branches. (standards-repository.md)

## TOGGLE — Repository features

→ [standard](standards-repository.md)

Issues, Wiki, and Projects settings.

- **TOGGLE-1 [M] — Repository feature toggles** — Issues are enabled and Wiki and Projects are disabled unless explicitly overridden. (standards-repository.md)

## VIS — Visibility

→ [standard](standards-repository.md)

Declared and live repository visibility.

- **VIS-1 [M] — Declared visibility** — Live GitHub visibility matches the valid visibility declared in .ki-config.toml. (standards-repository.md)

## TOPICS — Topics

→ [standard](standards-repository.md)

Public repository topic conventions.

- **TOPICS-1 [M] — Public repository topics** — A public repository carries the standard topic set unless explicitly overridden. (standards-repository.md)

## BP — Branch protection

→ [standard](standards-repository.md)

Optional main-branch protection.

- **BP-1 [M] — Branch protection** — Main has the configured branch-protection posture, including required PR, build check, and linear history when enabled. (standards-repository.md)

## DEP — Dependency security

→ [standard](standards-repository.md)

Dependabot and branch freshness.

- **DEP-1 [M] — Dependabot and branch freshness** — Dependabot alerts and updates are enabled and pull-request branches may be updated. (standards-repository.md)

## SEC — Secret protection

→ [standard](standards-repository.md)

Secret scanning and push protection.

- **SEC-1 [M] — Secret scanning protection** — Public repositories enable secret scanning and push protection unless explicitly overridden. (standards-repository.md)

## ACT — Actions policy

→ [standard](standards-repository.md)

GitHub Actions permissions.

- **ACT-1 [M] — Actions policy** — GitHub Actions allowed_actions is all; tighter deliberate policies are reported as warnings. (standards-repository.md)

## CHECKS — Check overrides

→ [standard](standards-configuration.md)

Per-repository override schema.

- **CHECKS-1 [M] — Override keys** — Every ki-repo checks override names a supported overridable concern. (standards-configuration.md)

## COV — Governance coverage

→ [standard](standards-configuration.md)

Detected and declared governance coverage.

- **COV-1 [M] — Governance coverage cascade** — Detected governance applicability and declared opt-in tables agree, subject to explicit coverage overrides. (standards-configuration.md)

## STRUCT — Repository structure

→ [standard](standards-repository.md)

Structural governance identity.

- **STRUCT-1 [M] — Single repository structure** — A repository declares at most one repo-structure governance table. (standards-repository.md)
- **STRUCT-2 [M] — Repository structure presence** — A repository normally declares one repo-structure table unless explicitly exempted. (standards-repository.md)

## ACCESS — Repository access

→ [standard](standards-repository.md)

GitHub reachability and archive state.

- **ACCESS-1 [M] — GitHub access and archive state** — GitHub reachability is reported without manufacturing drift when offline, and archived repositories are skipped. (standards-repository.md)

## RUNTIMES — Runtime support

→ [standard](standards-repository.md)

Declared agent-runtime support and orientation.

- **RUNTIMES-1 [M] — Supported runtime declaration** — ki-repo declares a non-empty, duplicate-free list containing only supported runtimes. (standards-repository.md)
- **RUNTIMES-J1 [J] — Runtime orientation split** — Multi-runtime repositories use a shared AGENTS.md orientation with a thin Claude import unless a justified exception applies. (standards-repository.md)
  - _Review prompt:_ Review whether orientation is shared cleanly across the declared runtimes without duplicated or Claude-only instructions.

## DESCFIT — Description fitness

→ [standard](standards-repository.md)

Human assessment of repository purpose.

- **DESCFIT-1 [J] — Description fit** — The repository description accurately and concisely describes its purpose. (standards-repository.md)
  - _Review prompt:_ Read the repository and judge whether its one-sentence description fits its actual purpose.

## OVR — Override rationale

→ [standard](standards-configuration.md)

Human assessment of exceptions.

- **OVR-J1 [J] — Override rationale** — Every checks override represents a warranted repository-specific decision. (standards-configuration.md)
  - _Review prompt:_ Review each configured override and confirm that it records a real exception rather than hiding drift.

## SYNC — Standard synchronisation

→ [standard](standards-repository.md)

Alignment across the knowledge chain.

- **SYNC-1 [J] — Standard synchronisation** — The standard, structured rubric, and executable behaviour remain aligned. (standards-repository.md)
  - _Review prompt:_ Compare the standard, generated rubric, and checker behaviour for semantic drift.

## WORK — Working areas

→ [standard](standards-repository.md)

Judgment-led review of optional inbound and outbound working material.

- **WORK-J1 [J] — working-area direction and lifecycle** — Optional +/ and -/ working areas distinguish inbound from outbound material, and retained handoffs have an owner, active disposition, reason or request, and named review trigger while resolved copies are removed. (standards-repository.md)
  - _Review prompt:_ Where +/ or -/ exists, review that it remains working material rather than a shadow canonical store or archive: each retained handoff has a receiving owner, active disposition, reason or request, and named review trigger; resolved inbound and outbound copies are removed.
