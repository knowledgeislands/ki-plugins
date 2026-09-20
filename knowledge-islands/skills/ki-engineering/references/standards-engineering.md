# The Knowledge Islands engineering standard

ADR: [ADR-KI-HARNESS-TOOLCHAIN-001](../../../../docs/decisions/ADR-KI-HARNESS-TOOLCHAIN-001-bun-biome-and-knip-standard-toolchain.md)

The shared **engineering toolchain** every Knowledge Islands TypeScript/Bun repo conforms to — the common layer the artifact-type skills (`ki-repo-mcp`, and future ones) build on rather than restate. It is the build/test twin of `ki-authoring` (which owns _how we write_); this owns _how we build, lint, and test_.

This file is the **normative, quotable** standard. The checkable items and their native mechanical execution live in [the canonical catalogue](../scripts/rubric/items/index.ts); [the rubric](rubric.md) is its readable generated publication. The model for turning this (or any) standard into an executable rubric is `ki-skills`' [rubric-authoring standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md).

## Contents

- [Scope and layers](#scope-and-layers)
- [Code design](#code-design)
- [Change-aware consistency review](#change-aware-consistency-review)
- [0. Repo shapes — flat vs monorepo (core)](#0-repo-shapes--flat-vs-monorepo-core)
- [1. package.json & toolchain pinning (core)](#1-packagejson--toolchain-pinning-core)
- [2. The governed script surface (core)](#2-the-governed-script-surface-core)
- [3. Bun vs Node (core)](#3-bun-vs-node-core)
- [4. tsconfig.json (core + profiled)](#4-tsconfigjson-core--profiled)
- [5. biome.json & rumdl config (core)](#5-biomejson--rumdl-config-core)
- [6. Testing (capability: the repo ships tests)](#6-testing-capability-the-repo-ships-tests)
- [7. Compiled build & CLI](#7-compiled-build--cli-capability-the-repo-compiles-to-dist)
- [8. .env discipline](#8-env-discipline-capability-the-repo-reads-env-config)
- [9. .ki.toml](#9-kitoml--skillski-engineering-core)

## Scope and layers

The standard applies to any repo carrying a `[skills.ki-engineering]` table in its `.ki.toml` (§9). The active repository set is discovered from the current configured collection during REFRESH; it is supporting evidence rather than a normative count. The standard is split into:

- **Code design** — judgment-led standards for code structure and tests that preserve comprehension (§Code design and §6).
- **Core** — the baseline every such repo MUST meet, unconditionally (§1–§5).
- **Capability conditionals** — common rules that fire only when the repo opts into a capability, detected by a marker in the repo (§6–§8). A repo with no tests is not required to have a test script; a repo that ships tests exposes them through the bare `test` idiom. Vitest is recommended, not mandated; when a repo selects it by carrying `vitest.config.*`, the canonical Vitest scripts and 100% coverage rules apply in full.

**Artifact-specific rules are NOT here.** Anything meaningful only for one artifact type — the MCP coverage-exclude list, `bin → dist/mcp-server/index.js`, `ki:server:mcp:*` scripts, `exports` per `main/<concern>` — lives in that artifact's skill (e.g. `ki-repo-mcp`). A repository is fully audited when `ki repo audit` resolves every declared compatible operation from the verified active installed collection. Coverage selects this standard alongside each applicable artifact standard; a declared `ki-depends-on` edge instead makes one capability an executable prerequisite of another.

The capability markers, and what each unlocks:

| Capability | Marker in the repo | Adds (this standard) |
| --- | --- | --- |
| Tests | `vitest.config.*` present, or a `test` script | §6 — bare entrypoint; strict Vitest profile when configured |
| Compiled build | `tsconfig.build.json` present, or `build` is a `tsc` invocation | §7 — `build`/`files`/`tsconfig.build.json` |
| Env config | `.env*.example` present, or `process.loadEnvFile` used | §8 — `.env` discipline + `NODE_ENV`-in-dev |
| CLI binary | `src/cli/` present | §7 — `build` chmods `dist/cli/cli.js` |

## Code design

Code is maintained for correct change, not merely compact implementation. These are judgment standards: they guide review and shaping rather than prescribing an arbitrary directory layout or a mechanical complexity threshold.

- **Keep modules cohesive.** Organise a module around one domain concern and split it when unrelated responsibilities, callers, or reasons to change accumulate. Prefer a small explicit seam between domains over a catch-all utility or coordinator. Do not split a coherent flow merely to meet a file-length target.
- **Optimise for comprehension.** Names, module boundaries, data flow, and control flow SHOULD let a maintainer locate the responsible concern and follow the ordinary case without reconstructing hidden abstractions. Make important policies explicit at their boundary; use types and narrow interfaces to reveal, rather than conceal, the contract.
- **Prefer clarity to maximal DRY.** Extract shared code only when it represents a stable concept with the same meaning, lifecycle, and error semantics for every caller. Local, well-named duplication is preferable when an abstraction would hide domain vocabulary, couple unrelated flows, or force conditional behaviour into a generic helper.

Tests remain part of this design discipline: coverage is evidence only when it begins at a supported API, CLI, or other observable contract boundary (§6). A test seam MAY model a documented interface failure that cannot be reproduced deterministically through that boundary, but it MUST NOT become an implementation-only substitute for it.

## Change-aware consistency review

A repository MAY record a completed, focused consistency review when a maintainer judges that accumulated code change warrants one. This standard imposes no calendar cadence, numeric threshold, CI gate, or automatic finding: the reviewer decides whether review is worthwhile after inspecting the actual change. A repository may independently adopt a time- or change-triggered review template through `ki-work-housekeeping`; that schedules a review, not an engineering verdict or automatic remediation.

When completed, the outcome commit carries one final contiguous trailer block in this exact order. Its commit is the reviewed result; `Base` is the exclusive lower boundary of the inspected range.

```text
KI-Consistency-Review-Base: <full-40-character lowercase commit>
KI-Consistency-Review-Scope: repository | <pathspec>, <pathspec>, ...
KI-Consistency-Review-Outcome: consistent | follow-up:<canonical-work-item-id>
```

`Scope` is either `repository` or a non-empty comma-separated pathspec list that states what was examined. `Outcome` is `consistent` or `follow-up:<canonical-work-item-id>`; the follow-up remains an ordinary work item in the repository's selected change-management adapter. A review that is not warranted records nothing.

The rubric selects the newest reachable outcome commit whose block is well formed, whose `Base` resolves to a commit, and whose Base is an earlier ancestor of that outcome commit. Absent, malformed, foreign, or unresolved trailers are unavailable evidence, not a proxy for freshness. The reviewer may inspect ordinary Git history when evidence is unavailable, but must not infer a prior review from commit time, prose, or changed-path heuristics.

Review the explicit range and scope for coherent module structure, naming, ownership, duplication, and treatment of public surfaces and their contract tests. A public API change, cross-cutting rewrite, or repeated local change can justify review; a small isolated change may not. These are examples for judgment, not automatic triggers.

## 0. Repo shapes — flat vs monorepo (core)

Every KI TS/Bun repo is one of exactly **two shapes**, distinguished by the standard Bun `workspaces` array in the root `package.json`:

| Shape | Marker | Canonical examples |
| --- | --- | --- |
| **Flat** | no `workspaces` key in `package.json` | one package rooted at the repository |
| **Monorepo** | `workspaces` array in `package.json` | related libraries, deployables, and authored examples |

- **Flat** is the default: all source under one root TS project, one root `tsconfig.json`, scripts unprefixed. A single root `tsc --noEmit` type-checks the whole repo (§2).
- **Monorepo** groups workspaces by ownership rather than hiding every role under a generic `workspaces/` directory. The standard roots are `packages/*` for independently consumable libraries, `apps/*` for deployable applications (including the canonical website at `apps/site`), and `examples/*` for independently authored examples. A repository declares only the globs it actually uses, for example `"workspaces": ["packages/*", "apps/*", "examples/*"]`; Bun accepts a set of workspace globs, not one prescribed parent directory. An additional root is valid when its ownership meaning is clear and a repository-specific role justifies it. Each resolved workspace carries its own `package.json` and `tsconfig.json`. Because two workspaces can carry mutually incompatible `types`/`lib` (e.g. `apps/site` on browser types and `apps/ingress` on `@cloudflare/workers-types`), one root `tsc --noEmit` cannot span them — so the registered `ki-engineering` rubric type-checks each workspace separately (§2), while repo-specific scripts use the owning role's namespace (`ki:site:build`, `ki:ingress:dev`).
- **Per-workspace artifacts and test scope.** In a monorepo every build/test artifact and the config globs that produce it are **scoped to the workspace directory that owns them**, never the repo root: each workspace's compiled `dist/` (§7), its generated reports under `<workspace>/reports/`, and its test files with their `include`/`exclude` globs all sit under `<workspace>/…`. Coverage therefore writes to `<workspace>/reports/coverage`; browser or integration test artifacts write to `<workspace>/reports/tests`. The repo root carries only shared, workspace-spanning config (root `package.json`, Biome/rumdl configuration, root `.gitignore`). In the **flat** shape the root is the single package, so the equivalent locations are `dist/`, `reports/coverage`, and `reports/tests`. This is the one rule behind a site's output at `apps/site/dist` and its reports at `apps/site/reports/`; when it is violated the artifact escapes its workspace and the root fills with per-package output. Cross-refs: §6 (tests), §7 (build).
- **Websites use the `apps/site` application workspace by default**, selected through `ki-repo-website`. The neutral website core and hosting adapters may support an explicit alternative or flat `dist/` consumer; they do not make one repository topology universal.
- **A stated dependency direction is enforced mechanically, and the enforcement is itself tested.** A boundary holds only while something rejects the import that crosses it; in prose it is a preference, and a preference decays. The tool for this is **dependency-cruiser**: state each boundary as a forbidden rule in `.dependency-cruiser.ts`, carry `dependency-cruiser` in `devDependencies`, and run the cruise over every root the rules mention — either from the suite itself, which keeps the check where its failure is read, or from a `ki:`-prefixed script a capability claims (§2) — a root left out of the cruise is a boundary nothing checks. A monorepo's ownership direction between workspaces is the obvious case, but it is not the only one, and a flat repository is not exempt. Three rules earn their place in any repository whose layers mean something: a **layer rule**, so a domain or schema module cannot import the provider, transport, or store that depends on it; an **artifact-shape rule**, so the thin shells an artifact standard declares logic-free — an MCP's `tools/**/index.ts`, a CLI's command modules — cannot import anything beyond their own entrypoint's `main/` surface; and a **test-seam rule**, so a suite that is supposed to exercise a public contract cannot quietly reach past it into implementation internals (§6). State only the boundaries that carry meaning: a rule nobody would violate is noise, and a rule that half the tree already violates is a finding to route, not a rule to add. A boundary checker's characteristic failure is **silence rather than error**: it reports a clean graph when its imports stopped resolving, and dependency-cruiser's programmatic `cruise()` builds the graph but evaluates no rule at all unless `validate: true` accompanies `ruleSet`, returning `rules: null` on every dependency and an empty violation list that reads exactly like a pass. Every such checker therefore carries a **minimal test that proves it can still fail**: assert that a known import across the boundary resolves to the real module (no `couldNotResolve`), then introduce a deliberate violation in a temporary file and assert the expected rule name appears in the reported violations. Without it, a checker that has quietly stopped seeing the graph is indistinguishable from a repository with no violations, and the boundaries decay unobserved.
- **Resolution is part of the ruleset, because a cruise that resolves nothing passes everything.** Every forbidden rule matches on resolved paths, so an import dependency-cruiser cannot resolve is an import no rule can see. Configure it explicitly rather than by default: `enhancedResolveOptions` with `exportsFields: ['exports']`, the `conditionNames` the repository's imports actually take, and an `extensions` list covering both source and declaration files, because a dependency published through subpath exports — `@modelcontextprotocol/sdk/server/mcp.js`, a workspace package's `./view-model` — does not resolve without them and the rules that name it then pass over an absent edge. `tsConfig: { fileName: 'tsconfig.json' }` so path aliases resolve the way the compiler resolves them; `doNotFollow: { path: 'node_modules' }` so third-party packages stay leaves the rules can still match on; `tsPreCompilationDeps: true` so type-only imports are visible, because a type-only import crosses a boundary exactly as a value import does and the compiler's emit is not the module's own import list. Two rules are the baseline every ruleset starts from — `no-circular`, because a cycle is two owners disagreeing about which is on top, and `no-unresolvable`, which is what converts the silent failure above into a reported violation. Anchor each rule on a package or area root, through small named helpers (`owners('view-model')`, `areas('domain', 'providers')`, `workspace`, `testFile`) rather than regexes spelled out at each use, so that a resolved import landing in a package's built `dist` and a relative import landing in its `src` are matched as the one owner they are. Give each rule a `comment` stating what the boundary means rather than restating the pattern: the comment is what a violation prints, and it is the only explanation the contributor who trips it will read.
- **The boundary checker's own toolchain is the part most likely to lie.** dependency-cruiser declares support for `typescript@>=2 <7`; against a newer compiler it reports the TypeScript transpiler unavailable, cruises **zero modules and reports zero violations**, and exits clean — a repository on the leading edge (§1) therefore gets a gate that passes precisely because it read nothing. Keep the checker in its own install root — `tooling/boundaries/package.json`, private, depending only on `dependency-cruiser` and a supported TypeScript, resolved by nothing else in the repository — and have the gate drive that root's binary rather than a bare `depcruise` against the repository's own install. Then hold the tooling honest from the suite: assert that `getAvailableTranspilers()` reports typescript `available: true`, and assert on the shape of the graph rather than only on the violation count — a **module floor** near the real module count and a non-zero **cross-boundary type-only count**, so a parser that has stopped reading this repository fails instead of agreeing with it. A violation count of zero means nothing on its own; it means something only alongside evidence that the graph it was counted over exists.
- **Turborepo owns the task graph in any repository with a `workspaces` array.** Bun workspaces resolve dependencies; they supply no task graph, no input hashing, and no notion of a target being up to date, so a root script chaining `bun run --cwd <workspace> build` is a fixed sequence that rebuilds the workspaces nobody touched on every gate run, every `dev` start, and every CI job. Turborepo is package-manager agnostic, reads the text `bun.lock` and the declared `packageManager`, and sits over Bun workspaces without replacing them. The threshold is the repository having workspaces at all, not a package or step count: a `turbo.json` for two packages is the same file as one for twenty, and a repository that grows past a threshold has to be migrated at the least convenient moment. Remote caching is a separate decision with an external service attached — set `remoteCache.enabled` explicitly rather than by omission, so turning it on is a visible change.
- **Turborepo's cache unit is a task in a package, so every stage has to be declared per workspace to be cached at all.** A single root `test`, a single root `typecheck`, and a root build chain are one cache entry each for the whole repository, which means one edit anywhere invalidates all of it. Give every workspace its own `build`, `typecheck`, and `test` scripts and generate their configurations from one shared factory rather than hand-maintaining a dozen near-identical files. `dependsOn: ["^typecheck"]` is there for **correctness, not ordering**: once type-checks and suites read siblings' source through `paths` and aliases (§4), a change upstream must move the downstream hash, and only a dependency edge does that. Files that govern every workspace while living outside all of them — the shared config factory, the workspace-resolution helper, the base `tsconfig`s — belong in `globalDependencies`.
- **`inputs` are load-bearing: a task whose `inputs` miss a file it reads reports a green it never earned.** This is the stale-build failure reintroduced through a configuration file instead of a forgotten build, and it is silent. Declare every file the task actually reads — several repository-level checks read `docs/` and site content, not just source — and add the file to `inputs` in the same change that makes the task read it. Prove the miss rather than assuming it: edit each declared input with **random** content and confirm the task reruns. A probe that appends fixed text and repeats will hit on the second run because it recreated byte-identical state the first run already cached, which reads as the tool ignoring the file. Fold the lockfile in (Turborepo does this by default) — a different compiler emits different declarations from identical sources, so an upgrade must invalidate work nobody edited.
- **Cache the intermediate builds; hash a deployable's whole workspace rather than a list of globs.** A website or deployable's bundle is the thing the gate exists to prove, and its input set is large and implicit (content, public assets, routes, every dependency's `dist`, the bundler configuration and its plugins). An explicit `inputs` list there is how a stale site gets published: give the deployable's build `inputs: ["$TURBO_DEFAULT$"]` so everything the workspace owns is hashed. Keep workspace packages out of the **root** manifest's dependencies — Turborepo attributes those to the root package, so a single entry makes the root appear to depend on that package and editing any package invalidates every root task, at which point the graph says nothing. Have repository scripts import workspace packages from source instead, and assert it in a test, because the failure mode is that everything still passes and nothing is ever replayed. Measure before caching anything else: generators and codegen checks are often already in the tens of milliseconds, where there is nothing to detect.
- **Generated Turborepo state stays local.** Turborepo writes its local cache below `.turbo/`; the `ki-engineering` contribution to the root managed `.gitignore` owns `.turbo/`. Vite's default cache remains below `node_modules/`, so the existing dependency-tree rule covers it without a duplicate `.vite/` pattern.

The shape signal is `workspaces` in `package.json` — a standard tooling convention, read directly by the checker. It is **not** a `.ki.toml` key; `.ki.toml`'s `[skills.ki-engineering]` table is a conformance marker only (§9).

## 1. package.json & toolchain pinning (core)

In package.json:

- `"type": "module"`.
- `"packageManager": "bun@1.3.x"` (pinned patch; bump in one place on the house Bun upgrade).
- `"engines": { "node": ">=22.0.0" }` — `dist/` runs under Node ≥ 22 even though install/dev use Bun.

Repos that publish a compiled library/server add `"main"`, `"files": ["dist"]`, `"bin"`, and `"exports"` — but the _shape_ of those is artifact-specific (§7 covers only the build mechanics).

### The coverage manifest — every key is driven by an owning skill (core)

`package.json` is **closed**: every top-level key must appear in the manifest below, mapped to the skill whose standard drives it. The checker enforces this exhaustively — a top-level key not in the manifest is **drift** (a `FAIL`), so a new key can never slip in ungoverned. This is what makes "every element is specified" a property the toolchain holds, not a hope.

- **Identity & metadata** → `ki-repo`: `name`, `version`, `description`, `author`, `license`, `private`, `repository`, `homepage`, `bugs`, `keywords`.
- **Toolchain & structure** → `ki-engineering`: `type`, `packageManager`, `engines`, `scripts`, `devDependencies`, `dependencies`, `workspaces`, `overrides`, `lint-staged`. `overrides` is for resolution pinning a repository genuinely needs (a vendored `file:` mapping, a transitive-dependency fix) — not a home for version policy that belongs in `dependencies`.
- **Published-artifact surface** → the artifact skill (e.g. `ki-repo-mcp`): `main`, `bin`, `exports`, `files`.

The manifest is the **engineering** standard's because engineering owns the closed set; the per-key _content_ rules live in the owning skill (repo's metadata checks, the artifact skill's `bin`/`exports` shape). Adding a genuinely new key means adding it here **and** assigning an owner — never just dropping it into a `package.json`.

**`lint-staged` + toolchain `devDependencies`.** The engineering and authoring audit/conform modes invoke a fixed toolchain directly, so that toolchain is **declared**, not merely implied: every repo carries `@biomejs/biome`, `@commitlint/cli`, `@commitlint/config-conventional`, `knip`, `rumdl`, `husky`, `lint-staged`, `syncpack`, and `typescript` in `devDependencies`. The `lint-staged` block (the Husky pre-commit fan-out) is a governed key — present in every repo, running `@biomejs/biome` over staged code and `rumdl check --fix` over staged authored Markdown. rumdl resolves its own scope from the authoring-owned `.rumdl.toml`, so a staged invocation needs no flag to suppress a repository-wide glob and no `--ignore-path`; the full authoring AUDIT still intentionally scans the repository. A root `knip.json` (§5) configures Knip — entry points + intentional ignores. **Knip replaced `depcheck`** (which false-flagged config-referenced toolchain deps — it would have `bun remove`d Biome — and found no dead code); `depcheck` / `node-jq` are no longer dependencies.

### Common local Git hooks

Every package-backed repository uses Husky for one common local baseline while retaining CI as the authoritative gate. `.husky/pre-commit` begins with `bunx lint-staged || exit 1`, then `bunx syncpack format --check || exit 1`; repository-specific fast checks may follow that prefix. The ordering matters: staged formatters settle supported files first, then Syncpack rejects any remaining manifest-order or dependency-alignment drift. The hook checks rather than silently rewriting package manifests.

`.husky/commit-msg` begins with `bunx commitlint --edit "$1" || exit 1`. The wholly governed `commitlint.config.ts` extends `@commitlint/config-conventional` and restricts types to `chore`, `docs`, `feat`, `fix`, `refactor`, and `test`, with lowercase kebab-case scopes and non-empty subjects without a terminal full stop. `ki-git` owns that vocabulary and the judgment that a message accurately describes one completed unit; engineering owns only the package-backed binding and deterministic shape.

CONFORM repairs the common prefixes and canonical Commitlint configuration while preserving repository-specific commands after each prefix. A symlink or other unsafe hook/configuration file fails closed rather than being replaced. Husky is an immediate-feedback layer, not an unbypassable authority: `git commit --no-verify` and absent local dependencies can skip it, so the repository audit and CI remain required.

Binding these hooks for the first time leaves work the write pass does not do, and the re-audit that follows it reports that work as failure: the Commitlint devDependencies CONFORM adds are appended rather than sorted, so Syncpack fails on manifest order, and they are not installed, so the Knip gate fails on a dependency it cannot resolve. Finish the sequence — `bunx syncpack format`, then `bun install`, then re-audit — before reading the result. The same commit usually carries one more consequence, because a hook invoking a tool is a use of it: a `syncpack` or `lint-staged` entry that sat in Knip's `ignoreDependencies` while nothing referenced it becomes a stale ignore the moment `.husky/pre-commit` calls it, and Knip reports it as a configuration hint rather than an error.

**Toolchain pin (`mise.toml`).** Every repo carries a root `mise.toml` with a `[tools]` table pinning both the **node** and **bun** versions — the actual runtimes [mise](https://mise.jdx.dev/) puts on `PATH` when you `cd` in, and that CI installs via `jdx/mise-action`, so the dev shell and CI resolve byte-identically. Two rules:

- The pinned **`bun` MUST equal the `packageManager` Bun version** above. Bun is named in both files, so they are the standing drift pair — the checker compares them. (`node` is pinned _exactly_ here even though `engines.node` only states a `>= 22` floor.)
- `mise.toml` is the **single** toolchain pin. No legacy single-tool file — `.node-version`, `.nvmrc`, `.bun-version` — may linger beside it; each is redundant and can silently diverge, so the checker warns on any it finds.

### CI workflow

Where the repo has CI (`.github/workflows/ci.yml`), it is a single `build` job on `push` to `main` and `pull_request`, running the common gate **in order**: `jdx/mise-action` (installs the toolchain from `mise.toml`, pinning **no** version itself — no `bun-version:` / `node-version:`, which would bypass `mise.toml` and is drift) → `bun install --frozen-lockfile` → acquire and verify the active KI skill collection → **`ki repo audit --repo .`** → **`bun run test`** when the repo ships self-tests. Native audit resolves registered rubrics from that verified collection; it does not bootstrap a checkout-local executor or invoke a vendored runner. A `ki:test:smoke` step that follows in an MCP repo is that artifact's **delta**, owned by `ki-repo-mcp` — not part of this common shape.

**Verified KI acquisition.** CI installs one immutable, verified `ki` release rather than using a checkout, package alias, vendored executor, or unpinned download. Before the repository gate it proves that exact executable with `command -v`, `ki --version`, and `ki manage diag`; bootstraps the canonical harness into isolated KI/XDG state; and shows the resulting canonical harness inventory. The release must embed the canonical harness revision whose contract the workflow is verifying. When audit runs in a later step, CI persists the isolated executable, man, data, configuration, cache, and state paths through the runner's environment mechanism so that audit consumes the same bootstrapped collection. This is a trust boundary, not setup ceremony: a later default-path CLI or empty state invalidates the proof.

### Clean-end-state cutovers

A repository-footprint replacement prefers the correct clean end state over transitional operability. Replace the old contract directly, remove the superseded implementation in the same bounded change, and run the complete verification appropriate to the repository. Do not retain compatibility shims, dual paths, legacy aliases, or fallback runners merely to preserve an intermediate state. Git history is the recovery mechanism.

### Dependency freshness — leading edge (core)

KI repositories run at the leading edge: when a dependency publishes a newer release, the default is to adopt it, not to defer. A newer release opens a **14-day adoption window**, and the clock is set by the **next version after the one installed** — the first release the repository has not adopted — never by the latest, so a fast-shipping upstream cannot reset it by publishing again. Within the window an available update is informational; beyond it the repository is behind the standard and the audit fails. Updates are applied deliberately — reviewed through `ki repo conform`, or `ki:deps:update` for the blanket `bun update --latest` — and proven by the usual gates rather than assumed safe.

A deliberate hold is recorded, never silent: `dependency_holds` under `[skills.ki-engineering]` (§9) lists each held package as `"<name> — <reason>"`. A held package reports as informational for as long as the hold stands, and a hold whose package has no available update is stale and flagged for removal. When the registry cannot be reached to date a release, freshness is reported as unknown rather than guessed.

## 2. The governed script surface (core)

### Script ownership namespaces (core)

This section governs the repository root `package.json`: the public repository command surface where capability claims compose. A selected application workspace keeps package-local implementation scripts under its owning artifact skill. An artifact skill may require the same capability-owned `ki:` key in that selected package without creating a duplicate root claim; the artifact rubric validates the local occurrence and command shape. Exact artifact-owned local names need no root `script_exclusions`; other repository-specific workspace scripts should still use `self:` so ownership remains visible.

Every entry in `scripts` has one of three ownership shapes: one of the six universal bare lifecycle idioms — `build`, `prepare`, `test`, `test:coverage`, `test:watch`, and `clean`; a capability-owned `ki:` name; or a repository-owned `self:` name. A `self:` key MUST include a non-empty suffix and needs neither a capability claim nor a `script_exclusions` entry. Every `ki:` key is supported only when exactly one resolved capability publishes that exact key in its rubric catalogue's `packageScripts` metadata; the owning rubric mandates the command's required shape. `ki-engineering` claims `ki:deps:update`. The host aggregates claims from resolved skills only: namespace readability never implies a claim, and duplicate, absent, patterned, aliased, or repository-configured claims fail. An externally constrained bare non-idiom MAY instead use one exact, non-overlapping `script_exclusions` entry under `[skills.ki-engineering]`. The six bare names remain exempt because every Node toolchain, CI runner, and contributor recognises those package-lifecycle verbs.

Package scripts MUST NOT invoke a dependency through a hand-written relative path into `node_modules`, such as `../../node_modules/@scope/tool/bin.js`. That path assumes an installer hoisting layout and can pass locally while failing in a hosted build. Root and safely resolved workspace package scripts are checked mechanically. Invoke a package binary with `bunx --bun <package-or-bin>`, or resolve a file API from its owning module with `createRequire(import.meta.url).resolve(...)`. A bare `node_modules` cleanup target remains valid; this rule does not scan arbitrary configuration source.

### Native governance commands

`package.json` must contain no script that invokes `ki repo audit`, `ki repo conform`, or `ki repo educate` — neither for the whole repository nor with `--skill <name>`. This prohibition is command-based, not name-based: `ki:audit`, `ki:engineering:audit`, and an otherwise innocuous `ki:quality` key are all drift when their command delegates to native governance. Repositories invoke the collection-backed native surface directly:

```text
ki repo audit
ki repo conform
```

- **`ki repo audit`** is the read-only gate; **`ki repo conform`** is the write pass. Both resolve the selected repo's declared skills to registered native operations from the verified active installed collection. Missing, incompatible, undeclared, or untrusted skills fail before an operation runs or writes.
- Native rubric registration and focused reporting replace derived package scripts. No `.ki/bin`, generated manifest, standalone `govern.ts`, or child-process fallback participates in the execution path.
- `clean` and `prepare` remain bare lifecycle idioms. A repo with tests exposes the complete suite through bare `test`; a compiled repo exposes bare `build`.
- A repo MAY add a capability-owned `ki:` script only when one resolved capability claims that exact key and audits its shape. The optional repository-local `ki-self` skill may supply such exact claims when a local capability genuinely needs the governed `ki:` surface; ordinary repository operations use `self:` instead, never an inferred `ki:self:*` family.

### Code tools run inside the registered `ki-engineering` rubric

The code toolchain is implementation detail inside the registered native `ki-engineering` rubric, not a public family of package scripts:

- Audit runs Biome check, TypeScript checking, syncpack check, and knip directly. The authoring sibling runs rumdl for Markdown.
- Conform performs the corresponding dependency refresh and safe fixes directly. Building and testing remain explicit bare lifecycle commands, run after conformance when needed.
- For a flat repo, engineering invokes `tsc --noEmit` at the root. For a monorepo, it derives one `tsc --noEmit -p <workspace>/tsconfig.json` invocation for every declared workspace.
- A root `knip.json` (§5) supplies entry points and intentional ignores; knip covers both dependency and dead-code hygiene.

The former per-tool families and unified verify key are explicitly **retired** by ADR-KI-HARNESS-TOOLCHAIN-001. `ki:deps:update` is the one exception: it performs the explicit dependency-maintenance action `bun update --latest`. Any other `ki:lint:*`, `ki:deps:*`, `ki:knip`, `ki:verify`, `ki:audit`, `ki:conform`, or derived scoped key is drift: those operations belong in native rubrics resolved by `ki repo audit`/`conform`.

**Monorepo type-checking (shape-driven).** A monorepo (§0) — e.g. a website with `apps/site` plus a Cloudflare Worker at `apps/ingress`, and reusable libraries under `packages/*` — has per-workspace `tsconfig.json`s whose `types`/`lib` may be mutually incompatible, so one root `tsc --noEmit` cannot type-check them all. Such a repo declares its packages with the applicable ownership globs in the standard Bun `workspaces` array:

```jsonc
{ "workspaces": ["packages/*", "apps/*"] }
```

When `workspaces` is present, the checker expands any `/*` glob entry to the directories that carry a `package.json`, validates that every resulting workspace has a `tsconfig.json`, and type-checks each directly. Biome, syncpack, and the authoring tools continue to run from their root configurations, which already span every package. The signal is `workspaces` in `package.json` (standard tooling), not a `.ki.toml` key (§9).

## 3. Bun vs Node (core)

Install and dev use **Bun (≥ 1.3)**; the compiled `dist/` runs under **Node (≥ 22)** — that is what a consumer launches. Two standing traps:

Repository-authored executable scripts and tool configuration use TypeScript when the consuming tool supports it, and Bun runs source scripts directly (`bun path/to/script.ts`). Do not add tracked `.mjs` files: they create a second authored JavaScript format without adding a capability TypeScript and Bun do not already provide. A third-party command or consumer may still launch compiled JavaScript from `dist/` under Node; that runtime boundary does not justify authoring source or configuration as `.mjs`. Where an external tool genuinely cannot consume TypeScript, use its required format and record the constraint in the owning capability standard rather than treating `.mjs` as the repository default.

- **No test-entrypoint bypass.** `bun run test` invokes the repo's governed `test` script; a non-`test` script that calls bare `bun test` silently bypasses it and invokes Bun's own runner. The bare `test` script may deliberately select `bun test` (for example, to glob a scripts-only suite); every other script must use `bun run test`. A Vitest-configured repo uses `vitest run`; another runner remains valid behind the same bare `test` idiom (§6).
- **`.env` parity.** Bun auto-loads `.env*`; Node does not, so a repo that loads `.env` files calls `process.loadEnvFile()` (wrapped in try/catch — Bun has no such API and throws `TypeError`). Resolve the path from the module's own location (`import.meta.url`), **not** `process.cwd()` — the compiled server is launched as `node /abs/path/dist/…` from an arbitrary cwd, so a `./`-relative path silently misses. Load `.env.local`, then `.env.${NODE_ENV}` (when set), then `.env`; `loadEnvFile` never overwrites an already-set var, so the launcher's environment wins. `NODE_ENV=development` is set **only** by dev/inspect scripts, so production ignores `.env.*` and config must come from the launcher's environment (§8).

## 4. tsconfig.json (core + profiled)

`tsconfig.json` is present in every repo. Two tiers, because a web/JS repo legitimately differs from a Node/TS-server repo:

- **Universal invariants (core, all 10 repos):** `strict: true`; `module` & `moduleResolution` `nodenext`; `noEmit: true`; `isolatedModules: true`; `esModuleInterop: true`; `skipLibCheck: true`; `forceConsistentCasingInFileNames: true`. These hold even for the 11ty web repo.
- **The shared Node/TS base (compiled-TS profile — §7):** repos that compile TS to `dist/` (they carry `tsconfig.build.json`) additionally match the shared base the `mcp-*` repos use: `target`/`lib` `es2024`, `moduleDetection: force`, `types: ["node"]`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, full `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns` / `noImplicitOverride` / `noFallthroughCasesInSwitch`, `include: ["**/*.ts"]`, `exclude: ["node_modules", "dist"]`. A repo that selects Vitest by carrying `vitest.config.*` adds `vitest/globals` to `types`; a web repo (esnext, `allowJs`, JSX) is exempt from this base.

## 5. biome.json & rumdl config (core)

**`biome.json`** present and matching the shared config: git VCS + `useIgnoreFile`; formatter `indentStyle: space`, `indentWidth: 2`, `lineWidth: 120`; JS formatter `quoteStyle: single`, `semicolons: asNeeded`, `trailingCommas: none`; linter `preset: recommended` with `suspicious.noExplicitAny: off`; `assist.source.organizeImports: on`. The `$schema` pins the Biome version — bump it on the house Biome upgrade.

**Generated and managed discovery surfaces stay out of every mechanical tool.** `src/generated/`, `.claude/skills/`, `.claude/agents/`, and `.agents/skills/` are copied or generated artifacts, not local source. Each must be excluded from Biome's `files.includes`, knip's `ignore`, and the Markdown gate's ignores. A parent exclusion such as `.claude/**` is valid for its generated children, but do not exclude the whole directory from Biome when it contains authored material such as `.claude/workflows/`. The Markdown configuration remains wholly owned and automatically conformed by `ki-authoring`; this standard owns the cross-tool agreement and reports a diagnostic rather than rewriting the sibling-owned file or partially repairing one cross-tool criterion. Biome and Knip correction remains deliberate because preserving supported JSON/JSONC comments and unrelated bytes needs a proportionate owned editor capability that the rubric does not currently have. See [ADR-KI-HARNESS-TOOLCHAIN-005](../../../../docs/decisions/ADR-KI-HARNESS-TOOLCHAIN-005-generated-and-vendored-code-is-excluded-from-linting-and-knip.md).

**`.rumdl.toml`** present and byte-identical across repos. Biome formats code; rumdl governs **only** Markdown (inside `ki-authoring` audit/conform), formatting and linting it in one pass:

```json
{
  "printWidth": 160,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "proseWrap": "never",
  "trailingComma": "none",
  "overrides": [{ "files": "*.md", "options": { "parser": "markdown" } }]
}
```

`MD013` with `reflow-mode = "normalize"` at an unbounded width is the house choice — rumdl joins each Markdown paragraph back to a single line rather than hard-wrapping (one paragraph per line; the linter enforces no mid-sentence breaks). The Markdown _content_ conventions (tables → footnotes, link style) live in `ki-authoring`; this section owns only the formatter config that governs wrapping.

**`knip.json`** present, backing the knip pass inside the registered `ki-engineering` operation (§2). It is **per-repo** — its `entry` array names the repo's real entry points so the public surface isn't misread as dead code: the build's `bin`/`exports` source files, plus test/script/eval entries the relevant knip plugin doesn't auto-detect. House defaults: `ignoreExportsUsedInFile: true` (an export referenced within its own file is not dead); `ignore` any active generated or managed discovery tree named above — **never** hand-edited, regenerated by codegen or activation; `ignoreDependencies` only for packages legitimately provided transitively by a meta-package (e.g. `googleapis` vending `google-auth-library`), with the reason recorded. `ignoreBinaries` covers a binary a test or script legitimately shells out to. Knip reports the managed-surface `ignore` entries as unused _configuration hints_, because nothing in `project` matches them; those entries are required by GEN-1 and the hint must not be acted on — removing them turns a passing check into a failing one. When native delivery lands, a stale `knip.json` (missing a new entry point) surfaces immediately through `ki repo audit`, not silent rot.

**Every published export is an entry point.** The `entry` list must reach the source behind every target in the `exports` map — map the built path back (`./dist/X.js` and `./dist/X.d.ts` become `src/X.ts`); `./package.json` is exempt. This is not bookkeeping: the conform repair runs `knip --fix`, which _deletes_ exports it reads as unused, so an entrypoint that is published but unreachable from `entry` loses genuine public API silently. A glob that looks close enough is not enough — `src/main/*/index.ts` does not match `src/main/email/parse.ts`, and `src/cli/cli.ts` does not cover `src/cli/index.ts`. The audit reports the gap; adding the right glob is a judgment call left to the author, because the fix may instead be to correct the `exports` target.

## 6. Testing (capability: the repo ships tests)

When a repo ships tests, it exposes the whole suite through the bare `test` script. The runner behind that idiom is repo-appropriate: Vitest is the recommended default for source-unit tests, while a scripts-only governance repo may chain standalone `bun path/to/*.test.ts` programs or deliberately use `bun test` to glob them. Other scripts must invoke the governed entrypoint with `bun run test` (§3).

When a repo selects Vitest by carrying `vitest.config.*`, all of the following apply:

- `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, `"test:watch": "vitest"`.
- `vitest.config.ts`: `globals: true`, `environment: 'node'`, `include: ['src/**/*.test.ts']`, `fileParallelism: false`, v8 coverage with `reportsDirectory: 'reports/coverage'` and **100% thresholds on all four metrics** (lines / functions / branches / statements). Tests are co-located (`src/**/*.test.ts`).
- The coverage `exclude` list always drops `src/**/*.test.ts`; **which other modules are excluded is artifact-specific** (e.g. an MCP excludes `mcp-server/index.ts`, `tools/**`, `utils/annotations.ts`) and is owned by that artifact's skill, not here.
- **Executable helper scripts are operational tooling, not shipped `src/`, and remain outside Vitest's coverage profile.** A repo's `scripts/` (repo tooling, eval harnesses) and a skill's bundled checkers may carry standalone self-tests behind the bare `test` idiom without adding `vitest.config.*`; the 100% source-coverage rules do not apply to that runner-neutral profile. Their absence of self-tests is not automatically a coverage gap.
- **Monorepo variant (§0).** The `src/**` globs above are the **flat-shape** form. In a monorepo each workspace scopes them to its own source root: `include`/`exclude` match that workspace's test files (e.g. `include: ['apps/site/scripts/**/*.test.ts']`), and Vitest writes coverage to that workspace's `reports/coverage` — for example `apps/site/reports/coverage` — never the repository root. The 100%-threshold rule and the `*.test.ts` exclude are unchanged; only the paths become workspace-relative.

`reports/` is the reserved disposable-report namespace supplied by `ki-repo` and ignored at every workspace depth. Test and analysis tools must be configured to write generated reports there rather than relying on a growing list of tool-default ignore rules. Build artifacts remain in their semantic seams such as `dist/`; source fixtures, snapshots intentionally reviewed in Git, and durable evaluation definitions are not reports and remain committed.

Coverage is evidence of supported behaviour, not a reason to introduce an implementation-only test seam. Start a coverage-gap investigation at the nearest supported API, CLI, or other public boundary and prove every reachable path through an externally observable result. Remove a path that no supported input can reach instead of preserving it solely to satisfy a coverage threshold. Where that seam is worth more than a habit, state it as a dependency-cruiser forbidden rule (§0): a suite that _may not_ import past the boundary is checkable, while a suite that _should not_ is an intention the next contributor will not read.

**Assert the referent, not the reference.** A test that checks output carries a pointer — a `marker-end="url(#arrow)"`, a registry key, an import specifier — proves only that the pointer was written, never that its target exists, resolves, or is the right kind of thing. The gap is silent by construction: the suite stays green while the referenced definition is absent or of the wrong element type entirely, and only inspecting the rendered or executed result reveals it. Where a reference has a resolvable target, assert that target's identity and shape in the same test.

**Take the instruments in order, and annotate last.** An unreached line has four remedies: cover it from the supported boundary, refactor so the arm that cannot be taken stops existing, delete it as dead code, or annotate it with `/* v8 ignore */`. Work down that list, never up it. A refactor is usually available where a branch is an artefact of how the code was written rather than of what it does — a ternary whose second arm an earlier assignment forbids, a wrapper loop whose exit condition is checked twice — and it leaves the file shorter and the intent clearer than an annotation over the same lines. An annotation is legitimate only where no supported input can reach the line and the line still earns its place: a filesystem race between a check and the operation it guards, a cross-check subsumed by a hash no caller can forge, an optional-chain arm the coverage provider counts but the schema forbids. Each one carries a comment **at the line** naming the specific reason, because an ignore whose reason has stopped being true reads as settled and nobody re-derives it. An ignore standing in for a fixture nobody wrote is the same dishonesty as a lowered threshold, and an excluded module must contain no decision about the repository's subject matter. Density is the signal to watch: when one module holds most of a repository's annotations, read that module before trusting the number.

**Coverage mechanics that mislead.** A failed run writes no coverage report at all — the reports directory is absent rather than stale — so residue can only be measured from a passing run, and a measurement taken while a second writer shares the checkout is not evidence either (concurrent runs share `reportsDirectory` and delete each other's temporary files). Read the residue from `reports/coverage/lcov.info` rather than the terminal summary: its `BRDA:<line>,<block>,<branch>,<taken>` records name exactly which arm went untaken, which is what separates a provider artefact from an untested path, and `FN:`/`FNDA:0,` pairs name the uncovered function. v8's ignore directives bind to statement boundaries; one placed on an expression-continuation line silently does nothing, which looks identical to an annotation the provider disagreed with.

**A gate that reports machine load as failure is not a gate.** A suite that drives a real transport, process, or filesystem needs a timeout allowance above the runner's default, set once in the runner configuration rather than scattered per test. Keep it bounded — generous enough that a loaded machine passes, short enough that a genuine hang still fails — and state the reason beside it.

Interface-level fault injection is the narrow exception: it may model a documented boundary failure that the ordinary public entrypoint cannot exercise deterministically. Keep the injection outside implementation internals and record why the supported boundary cannot produce that failure. Do not use fault injection merely to make an internal branch covered.

## 7. Compiled build & CLI (capability: the repo compiles to `dist/`)

When a repo ships a compiled `dist/` (it has `tsconfig.build.json`, or `build` is a `tsc` call):

- `"build": "tsc -p tsconfig.build.json"`. `"files": ["dist"]`.
- `tsconfig.build.json` extends `tsconfig.json`: `noEmit: false`, `declaration` + `declarationMap`, `outDir: ./dist`, `rootDir: ./src`, `allowImportingTsExtensions: false`, `noUncheckedIndexedAccess: true`, `exclude: [..., "**/*.test.ts"]`.
- **CLI chmod rule.** `build` appends `&& chmod +x dist/cli/cli.js` **iff** `src/cli/` exists, and chmods **nothing else** — in particular **not** a server/`mcp-server` bin. (Package managers set `+x` on `bin` targets at install, and launchers invoke via `node`, so the entry bin needs no chmod; the executable CLI does.) A `build` that chmods a path with no matching `src/` dir, or omits the chmod while `src/cli/` exists, is drift.
- **Monorepo variant (§0).** In a monorepo the compiled output lands under the owning workspace (`packages/domain-core/dist`, `apps/ingress/dist`), and the workspace's `files`/`clean` entries and the root `.gitignore` reference that workspace-scoped path, not a root `dist/`. A website's `apps/site/dist/` seam is owned by `ki-repo-website`, its command semantics by the selected content/app implementation, and Cloudflare serving by `ki-repo-website-cloudflare`; this section governs the `tsc`-compiled case.

A non-`tsc` build (for example Eleventy or Vite) is outside this section — the repository compiles by another toolchain; only the governed script surface in §2 and the core (§1–§5) apply.

## 8. .env discipline (capability: the repo reads env config)

When a repo reads environment config (it has `.env*.example`, or calls `process.loadEnvFile`):

- A committed `.env*.example` template; real `.env.*` files are gitignored.
- `NODE_ENV=development` appears **only** in dev/inspect scripts (never in `start`/`build`/`test`).
- The config loader calls `process.loadEnvFile()` inside a try/catch for Node/Bun parity (§3).

The variable **names/prefix** and which vars exist are artifact-specific (e.g. an MCP uses `MCP_<APP>_*` with the shared access-level + audit-log block) and live in that artifact's skill.

### XDG Base Directory paths (capability: the repo resolves a config/data/cache/state directory on the host)

When a script computes a filesystem path for its own or another tool's config, data, cache, or state directory (`~/.config/...`, `~/.local/share/...`, `~/.cache/...`, `~/.local/state/...`), it honours the corresponding [XDG Base Directory](https://specifications.freedesktop.org/basedir/latest/) env var (published by [freedesktop.org](https://www.freedesktop.org/), the cross-desktop-standards project the spec lives under) — `$XDG_CONFIG_HOME`, `$XDG_DATA_HOME`, `$XDG_CACHE_HOME`, `$XDG_STATE_HOME` — falling back to the spec's own default (`~/.config`, `~/.local/share`, `~/.cache`, `~/.local/state` respectively) only when the var is unset. A bare `join(homedir(), '.config', ...)` with no env-var check is the anti-pattern: it silently diverges from a machine that has repointed the var (e.g. a chezmoi-managed dotfiles setup exporting `$XDG_DATA_HOME` for a non-default `chezmoi` source dir). `ki-binding` and `ki-binding-chezmoi` are the reference implementations (see their `references/standards.md`).

This does not license inventing a path a tool doesn't already use — mcporter's `~/.mcporter/mcporter.json`, for instance, is that tool's own fixed convention, not one this standard overrides; the rule applies only where the repo itself is choosing the config/data/cache/state location.

## 9. `.ki.toml` — `[skills.ki-engineering]` (core)

`script_exclusions` applies only to externally constrained bare names in the repository root manifest. It does not enumerate artifact-owned scripts inside a selected workspace package.

A governed repo declares a `[skills.ki-engineering]` table. Presence marks "the engineering standard applies here" (the selector for the common layer). Following the `.ki.toml` table-per-skill contract (owned by `ki-repo`), the table is minimal — capabilities are auto-detected from markers (above), so no profile field is needed. A repo that deliberately diverges declares it explicitly:

```toml
[skills.ki-engineering]
# This repo fully conforms, so it declares no checks. A named check may be recorded
# below with a boolean when a local review needs an explicit exception note.
```

The table accepts two optional direct keys. `script_exclusions` is an array of exact externally constrained bare script names (§2). Every entry MUST be a non-empty unique string, name an existing package script exactly, contain no pattern syntax, remain outside every declared skill's script claims, and use neither the `ki:` nor `self:` namespace. A valid exclusion satisfies the complete-set check and permits that external bare script to remain outside the normal ownership namespaces; malformed, duplicate, stale, patterned, namespace-overlapping, or owner-overlapping entries fail the script contract rather than suppressing it. `dependency_holds` is an array of `"<name> — <reason>"` strings recording deliberate dependency holds (§1): every entry MUST be unique, name the held package exactly, and carry a reason after the ` — ` separator; a hold whose package has no available update is stale and flagged for removal.

Its optional `[skills.ki-engineering.checks]` table accepts only exact mechanical rubric IDs as boolean values. The checker validates both the key set and value type, but a `false` value is an explicit local diagnostic record — it does **not** suppress a finding or turn a judgment criterion into a pass. A reviewer records the reason next to the entry and resolves it through the owning repository's change process.

Repo shape (flat vs monorepo, §0) — which drives engineering's workspace-aware type-checking — is read from the standard Bun `workspaces` array in `package.json`, not from here. Keeping the shape signal in `package.json` means standard tooling (Bun, syncpack) sees it too, rather than hiding it behind a bespoke `.ki.toml` extension.

The checker **validates down**: any key under `[skills.ki-engineering]` is drift (the table is a conformance marker; the only allowed sub-structure is a `[skills.ki-engineering.checks]` table), so a typo or a stale override surfaces rather than silently doing nothing.
