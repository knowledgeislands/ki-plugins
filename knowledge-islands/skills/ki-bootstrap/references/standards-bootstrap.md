# Bootstrap standard

This standard implements the architecture in [ADR-KI-HARNESS-012](../../../../docs/decisions/ADR-KI-HARNESS-012-compatible-harness-publication-and-governed-rubric-boundary.md).

It replaces the former repository-vendored executor model.

## Contents

- [Scope and ownership](#scope-and-ownership)
- [Authoritative installed harnesses](#authoritative-installed-harnesses)
- [Declarative repository selection](#declarative-repository-selection)
- [Explicit activation scopes](#explicit-activation-scopes)
- [Native repository operations](#native-repository-operations)
- [First-time bootstrap](#first-time-bootstrap)
- [Local harness development](#local-harness-development)
- [Guide-led legacy retirement](#guide-led-legacy-retirement)
- [CI and direct automation](#ci-and-direct-automation)
- [Scope and safety separation](#scope-and-safety-separation)

## Scope and ownership

`ki-bootstrap` is guidance for the delivered user setup and capability-activation model. It does not publish a rubric, register a native repository operation, or own public command grammar.

`tools-ki` owns the executable, harness acquisition and inventory, activation, repository resolution, governed-rubric host, transactions, reporting, and diagnostics. Compatible harnesses own their published capability content and domain semantics.

Run `ki help` for the installed command grammar. This standard explains the boundaries those commands preserve.

## Authoritative installed harnesses

One verified, XDG-managed harness set exists per user. The canonical `knowledgeislands/ki-agentic-harness` is always registered and installed by `ki bootstrap`; each additional compatible harness is installed explicitly.

The harness payload, configuration, cache, and mutable state occupy separate XDG-owned locations. `ki diag` reports the effective paths.

`ki harness install <harness-id>` acquires or atomically replaces the selected harness from immutable release evidence verified by the installed `ki` release. `ki harness list` and `ki harness info <harness-id>` inspect the installed set.

Verified installed compatible harnesses are the sole source of registered capabilities and operations.

A local harness checkout, a cached temporary acquisition, a repository `.ki/` directory, or a runtime-discovery link cannot supply a missing capability or substitute for integrity verification.

If a required harness is unavailable, untrusted, or incompatible, the command must fail with recovery guidance before repository or runtime state changes.

The canonical harness cannot be uninstalled. `ki harness uninstall <harness-id>` applies only to an installed non-canonical harness and removes it only after ownership checks pass.

## Declarative repository selection

`.ki-config.toml` declares the governance coverage of one repository through explicit `[ki-<skill>]` tables.

`ki-repo` owns the file's schema, creation, and declared coverage.

The native resolver physically resolves the selected repository, reads those declarations, validates every explicit dependency, and resolves only the selected skills from verified installed compatible harnesses.

Dependencies must be declared explicitly; a resolver must not inject a baseline, infer an undeclared skill, or silently rename a declaration.

Missing, incompatible, undeclared, or untrusted skills are fail-closed errors before an operation writes.

## Explicit activation scopes

Harness installation and skill activation are separate. Installing a harness does not activate all its skills.

`ki skill user add <skill>` and `ki skill user remove <skill>` change only the managed discovery links and configuration for the detected user runtimes.

`ki skill repo add <skill>` and `ki skill repo remove <skill>` change only the selected repository: its `.ki-config.toml` declaration and managed repository-runtime discovery links. They do not alter user activation or uninstall a harness.

Activation resolves a bare skill name only when one installed harness provides it. Ambiguous, missing, foreign, altered, or escaping targets fail closed. Existing KI-managed links are re-pointed only through the command's explicit replacement option.

## Native repository operations

A governance skill may publish a compatible in-process rubric catalogue for its mechanical operations. `ki repo educate`, `ki repo audit`, and `ki repo conform` resolve the selected repository's declarations and execute the applicable catalogues in dependency order through one host-owned model.

Scoped execution may run only a compatible skill declared by that repository. A clean clone therefore needs the verified installed harnesses that provide its declarations before native maintenance can run.

AUDIT is read-only. CONFORM validates the complete proposed write set, preserves the physical repository boundary, honours dry-run, commits safe writes transactionally, and re-audits.

The host never executes `scripts/govern.ts`, `.ki/bin` wrappers, copied checkers, a nearby harness checkout, or an ad hoc child process as a fallback.

## First-time bootstrap

`ki bootstrap` establishes the minimum user environment:

- detect supported local agent runtimes;
- create the KI user configuration when absent;
- install or restore the verified canonical harness; and
- activate the core `ki-bootstrap`, `ki-next`, `ki-plan`, `ki-implement`, `ki-accept`, `ki-batch`, and `ki-recap` skills for each detected runtime.

Repeated bootstrap is idempotent over correctly managed state. `ki bootstrap --refresh` redetects runtimes and rebuilds the recorded installed-harness and managed user-skill inventory from current state.

Bootstrap does not declare governance in any repository and does not activate every skill in the canonical harness.

## Local harness development

Installed verified payloads remain authoritative during ordinary use.

`ki dev on <path>` is the explicit development-only exception for the canonical harness. It validates the local checkout and switches the canonical installed payload to that source. `ki dev off` restores the verified canonical archive.

A nearby checkout is never selected implicitly.

While `ki dev on` is active the selected checkout is live, so every `ki` invocation on the machine resolves governance through its **working tree**, uncommitted edits included. Governance is then no longer a fixed input: editing the harness changes how `ki repo audit` and `ki repo conform` behave everywhere, immediately, including in sessions that did not make the edit. A rubric criterion can appear, change level, or acquire a new dependency underneath work already in progress, and a repository's audit result can move with no change to that repository at all.

The exposure is widest where harness edits and harness-dependent verification overlap in time, which is most likely when either is delegated: a worker editing the harness and a worker auditing repositories against it are, in development mode, sharing one mutable input. Separating them in time removes the interaction, and `ki dev off` removes it entirely by resolving the run against the verified canonical archive, which is what makes a result reproducible or comparable across sessions.

`ki diag` distinguishes the two cases after the fact. `Installation` and `Local source` say whether governance came from a mutable tree, so an audit or conform result that moved while the target repository did not is explained there rather than in the repository.

## Guide-led legacy retirement

Vendored repository execution is retired.

Existing `.ki/bootstrap/`, `.ki/bin/`, and manifest state are examined only through the maintainer [retirement guide](../../../../docs/guides/developer/retiring-repository-vendored-ki.md).

Migration validates the required installed harnesses, repository declaration, target ownership, and complete removal set before writing.

It removes generated legacy material only when it proves ownership of every target; a changed, dangling, linked, partial, unfamiliar, or concurrently changed footprint is left in place and reported as a fail-closed blocker.

Migration never runs legacy material to complete a native operation, never silently cleans up, and never treats legacy state as proof that native operations are available.

The guide replaces a migration command because the remaining estate is private and reviewed repository by repository.

It does not permit broad deletion: unfamiliar or unproven state is retained, and native execution never uses it as a compatibility runner.

## CI and direct automation

CI and direct automation explicitly establish the verified installed harnesses, then invoke the native `ki repo` operation required by the repository declaration.

They must pin or otherwise verify immutable release evidence according to the installed CLI's trust contract.

If acquisition, verification, registry loading, or declared-skill resolution fails, automation fails rather than falling back to vendored files or a checkout-local executor.

Recovery guidance must identify the failed layer: CLI release, harness acquisition, harness integrity, repository declaration, compatibility, or operation availability.

## Scope and safety separation

User state comprises the XDG-owned harness registry and data, configuration, cache, state, and user-runtime activation.

Repository state comprises `.ki-config.toml`, repository-scope activation links, and registered native-operation writes.

No unscoped operation infers or crosses either boundary.

Every mutating operation resolves its selected scope first, calculates and validates its complete write or removal set, and refuses unsafe state before any partial change.
