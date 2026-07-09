# The Knowledge Islands engineering standard

ADR: [ADR-KI-HARNESS-TOOLCHAIN-001](../../../docs/decisions/ADR-KI-HARNESS-TOOLCHAIN-001-standard-toolchain.md)

The shared **engineering toolchain** every Knowledge Islands TypeScript/Bun repo conforms to — the common layer the artifact-type skills (`ki-mcp`, and future ones) build on rather than restate. It is the build/test twin of `ki-authoring` (which owns _how we write_); this owns _how we build, lint, and test_.

This file is the **normative, quotable** standard. The checkable items live in [the rubric](audit-rubric.md); the mechanical checks are in [`../scripts/audit-engineering.ts`](../scripts/audit-engineering.ts); the meta-standard for how this (and any) standard is defined and enforced is [the enforcement framework](enforcement-framework.md).

## Contents

- [Scope, layers, and composition](#scope-layers-and-composition)
- [0. Repo shapes — flat vs monorepo (core)](#0-repo-shapes--flat-vs-monorepo-core)
- [1. package.json & toolchain pinning (core)](#1-packagejson--toolchain-pinning-core)
- [2. The script families (core)](#2-the-script-families-core)
- [3. Bun vs Node (core)](#3-bun-vs-node-core)
- [4. tsconfig.json (core + profiled)](#4-tsconfigjson-core--profiled)
- [5. biome.json & prettier config (core)](#5-biomejson--prettier-config-core)
- [6. Testing (capability: the repo ships tests)](#6-testing-capability-the-repo-ships-tests)
- [7. Compiled build & CLI](#7-compiled-build--cli-capability-the-repo-compiles-to-dist)
- [8. .env discipline](#8-env-discipline-capability-the-repo-reads-env-config)
- [9. .ki-config.toml](#9-ki-configtoml--ki-engineering-core)

## Scope, layers, and composition

The standard applies to any repo carrying a `[ki-engineering]` table in its `.ki-config.toml` (§9) — today the 10 TS/Bun repos under `knowledgeislands/`. It is split into:

- **Core** — the baseline every such repo MUST meet, unconditionally (§1–§5).
- **Capability conditionals** — common rules that fire only when the repo opts into a capability, detected by a marker in the repo (§6–§8). A repo with no tests is not required to have a test script; a repo that _does_ ship tests must use vitest with 100% coverage. The conditional is still _common_ engineering policy — it just doesn't apply where the capability is absent.

**Artifact-specific rules are NOT here.** Anything meaningful only for one artifact type — the MCP coverage-exclude list, `bin → dist/mcp-server/index.js`, `ki:server:mcp:*` scripts, `exports` per `main/<concern>` — lives in that artifact's skill (e.g. `ki-mcp`). A repo is fully audited by **composing** this standard's checker with the artifact skill's checker (run `ki:engineering:audit` for the common layer, then e.g. `audit-mcp.ts` for the MCP delta); the checkers compose by being run in sequence, never by importing each other.

The capability markers, and what each unlocks:

| Capability     | Marker in the repo                                              | Adds (this standard)                       |
| -------------- | --------------------------------------------------------------- | ------------------------------------------ |
| Tests          | `vitest.config.*` present, or a `test` script                   | §6 — vitest runner + 100% coverage         |
| Compiled build | `tsconfig.build.json` present, or `build` is a `tsc` invocation | §7 — `build`/`files`/`tsconfig.build.json` |
| Env config     | `.env*.example` present, or `process.loadEnvFile` used          | §8 — `.env` discipline + `NODE_ENV`-in-dev |
| CLI binary     | `src/cli/` present                                              | §7 — `build` chmods `dist/cli/cli.js`      |

## 0. Repo shapes — flat vs monorepo (core)

Every KI TS/Bun repo is one of exactly **two shapes**, distinguished by the standard Bun `workspaces` array in the root `package.json`:

| Shape        | Marker                                | Canonical examples                                     |
| ------------ | ------------------------------------- | ------------------------------------------------------ |
| **Flat**     | no `workspaces` key in `package.json` | the `mcp-*` repos (`mcp-kb-fs`, `mcp-gsuite`, …)       |
| **Monorepo** | `workspaces` array in `package.json`  | every 11ty/Cloudflare website (`vallearmonia-website`) |

- **Flat** is the default: all source under one root TS project, one root `tsconfig.json`, scripts unprefixed. A single root `tsc --noEmit` type-checks the whole repo (§2).
- **Monorepo** declares its packages as workspace directories — `"workspaces": ["site", "ingress"]` (or just `["site"]`). Each workspace carries its own `package.json` and `tsconfig.json`. Because two workspaces can carry mutually incompatible `types`/`lib` (e.g. `site/` on Bun types vs `ingress/` on `@cloudflare/workers-types`), one root `tsc --noEmit` cannot span them — so `ki:lint:types` aggregates a per-workspace check (§2) and scripts take the workspace-name prefix (`ki:site:build`, `ki:ingress:types`).
- **Per-workspace artifacts and test scope.** In a monorepo every build/test artifact and the config globs that produce it are **scoped to the workspace directory that owns them**, never the repo root: each workspace's compiled `dist/` (§7), its vitest coverage output — the `reportsDirectory`, e.g. `site/coverage` (§6) — and its test files with their `include`/`exclude` globs all sit under `<workspace>/…`. The repo root carries only shared, workspace-spanning config (root `package.json`, the `ki:lint:*`/`biome`/`prettier`/`markdownlint` toolchain, root `.gitignore`). In the **flat** shape these same artifacts live at the root because the root _is_ the single package, so `dist/` and `coverage/` at the root are already "under the workspace". This is the one rule behind a site's output at `site/dist` (not root `dist/`) and its coverage at `site/coverage` (not root `coverage/`); when it is violated the artifact escapes its workspace and the root fills with per-package output. Cross-refs: §6 (tests), §7 (build).
- **All house 11ty/Cloudflare website repos are monorepos**, even a single-concern site — it declares `"workspaces": ["site"]` from day one so the shape is explicit and adding a companion workspace (an ingress Worker, an API) is a pure addition, not a migration. See `ki-website` §2 and `ki-website-cloudflare` §1/§3 for the site-specific layout this implies.

The shape signal is `workspaces` in `package.json` — a standard tooling convention, read directly by the checker. It is **not** a `.ki-config.toml` key; `.ki-config.toml`'s `[ki-engineering]` table is a conformance marker only (§9).

## 1. package.json & toolchain pinning (core)

In package.json:

- `"type": "module"`.
- `"packageManager": "bun@1.3.x"` (pinned patch; bump in one place on the house Bun upgrade).
- `"engines": { "node": ">=22.0.0" }` — `dist/` runs under Node ≥ 22 even though install/dev use Bun.

Repos that publish a compiled library/server add `"main"`, `"files": ["dist"]`, `"bin"`, and `"exports"` — but the _shape_ of those is artifact-specific (§7 covers only the build mechanics).

### The coverage manifest — every key is driven by an owning skill (core)

`package.json` is **closed**: every top-level key must appear in the manifest below, mapped to the skill whose standard drives it. The checker enforces this exhaustively — a top-level key not in the manifest is **drift** (a `FAIL`), so a new key can never slip in ungoverned. This is what makes "every element is specified" a property the toolchain holds, not a hope.

- **Identity & metadata** → `ki-repo`: `name`, `version`, `description`, `author`, `license`, `private`, `repository`, `homepage`, `bugs`, `keywords`.
- **Toolchain & structure** → `ki-engineering`: `type`, `packageManager`, `engines`, `scripts`, `devDependencies`, `dependencies`, `workspaces`, `lint-staged`.
- **Published-artifact surface** → the artifact skill (e.g. `ki-mcp`): `main`, `bin`, `exports`, `files`.

The manifest is the **engineering** standard's because engineering owns the closed set; the per-key _content_ rules live in the owning skill (repo's metadata checks, the artifact skill's `bin`/`exports` shape). Adding a genuinely new key means adding it here **and** assigning an owner — never just dropping it into a `package.json`.

**`lint-staged` + toolchain `devDependencies`.** The `ki:lint:*` / `ki:deps:*` / `prepare` families invoke a fixed toolchain, so that toolchain is **declared**, not merely implied: every repo carries `@biomejs/biome`, `knip`, `prettier`, `husky`, `lint-staged`, `markdownlint-cli2`, `syncpack`, and `typescript` in `devDependencies`. The `lint-staged` block (the husky pre-commit fan-out) is a governed key — present in every repo, running `@biomejs/biome` over staged code and `prettier` + `markdownlint-cli2` over staged Markdown. A root `knip.json` (§5) configures knip — entry points + intentional ignores. **knip replaced `depcheck`** (which false-flagged config-referenced toolchain deps — it would have `bun remove`d biome — and found no dead code); `depcheck` / `node-jq` are no longer dependencies.

**Toolchain pin (`mise.toml`).** Every repo carries a root `mise.toml` with a `[tools]` table pinning both the **node** and **bun** versions — the actual runtimes [mise](https://mise.jdx.dev/) puts on `PATH` when you `cd` in, and that CI installs via `jdx/mise-action`, so the dev shell and CI resolve byte-identically. Two rules:

- The pinned **`bun` MUST equal the `packageManager` Bun version** above. Bun is named in both files, so they are the standing drift pair — the checker compares them. (`node` is pinned _exactly_ here even though `engines.node` only states a `>= 22` floor.)
- `mise.toml` is the **single** toolchain pin. No legacy single-tool file — `.node-version`, `.nvmrc`, `.bun-version` — may linger beside it; each is redundant and can silently diverge, so the checker warns on any it finds.

### CI workflow

Where the repo has CI (`.github/workflows/ci.yml`), it is a single `build` job on `push` to `main` and `pull_request`, running the common gate **in order**: `jdx/mise-action` (installs the toolchain from `mise.toml`, pinning **no** version itself — no `bun-version:` / `node-version:`, which would bypass `mise.toml` and is drift) → `bun install --frozen-lockfile` → **`bun run ki:verify`**. The single `ki:verify` step _is_ the gate — it composes `ki:lint:check` → `ki:lint:types` → **`ki:lint:md:check`** (+ `build` / `test:coverage` where those capabilities are present), in order (§2). The Markdown gate is load-bearing: `ki:lint:md` self-heals locally with `--write`, so only its `--check` twin (inside `ki:verify`) stops prose-wrap drift reaching `main`. A `ki:test:smoke` step that follows in an MCP repo is that artifact's **delta**, owned by `ki-mcp` and asserted by `audit-mcp.ts` — not part of this common shape.

## 2. The script families (core)

### The `ki:` naming law (core)

Every entry in `scripts` is **either** one of the six universal lifecycle idioms — `build`, `prepare`, `test`, `test:coverage`, `test:watch`, `clean` — **or** it carries the `ki:` prefix. There is no third option: a bare (non-`ki:`, non-idiom) script name is **drift** (a `FAIL`). The prefix is what makes a script's provenance mechanically decidable — "is this script ours?" is answered by its name, not by grepping a checker — and is the lever that keeps the script surface fully governed: every `ki:*` script is, by construction, asserted by some KI skill (engineering for the families below; the artifact/governance skills for their deltas). The exempt six are left bare because they are universally recognized package-lifecycle verbs that every Node toolchain, CI runner, and contributor already knows.

### Required families

Two prefixed families are **required, verbatim, in every repo** — they are byte-identical across all 10 today, so the checker exact-matches them. Copy, never paraphrase:

```jsonc
"ki:lint:check":   "bunx @biomejs/biome check",
"ki:lint:fix":     "bunx @biomejs/biome check --write --unsafe",
"ki:lint:format":  "bunx @biomejs/biome format --write",
"ki:lint:md":      "bunx prettier --write \"**/*.md\" --ignore-path .gitignore && bunx markdownlint-cli2",
"ki:lint:md:check": "bunx prettier --check \"**/*.md\" --ignore-path .gitignore && bunx markdownlint-cli2",
"ki:lint:package": "bunx syncpack format",
"ki:lint:types":   "tsc --noEmit",
"ki:deps:check":   "bunx knip --dependencies --no-config-hints",
"ki:deps:fix":     "bunx knip --dependencies --fix --no-config-hints",
"ki:deps:refresh": "bun update --force",
"ki:deps:update":  "bun update --latest && bun install",
"ki:knip":         "bunx knip --no-config-hints",
"clean":           "rm -rf {dist,node_modules}",   // a repo with no dist may use "rm -rf node_modules"
"prepare":         "husky"
```

- `ki:lint:*` — the full family. `ki:lint:check`/`ki:lint:fix`/`ki:lint:format` are Biome; `ki:lint:md` (Prettier `--write` + markdownlint-cli2) reflows locally, while its check-mode twin `ki:lint:md:check` (`--check`) is what CI runs so committed Markdown can't drift from `proseWrap`/`printWidth` (see _CI workflow_ in §1); `ki:lint:package` is syncpack; `ki:lint:types` is `tsc --noEmit`.
- `ki:deps:*` + `ki:knip` — **dependency and dead-code hygiene, on [knip](https://knip.dev)** (one tool replacing depcheck + ts-prune). `ki:deps:check` reports unused **and** unlisted dependencies (`--dependencies`-scoped); `ki:deps:fix` auto-removes the unused. Two freshness idioms, split by intent: **`ki:deps:refresh`** (`bun update --force`) is the routine, in-range refresh composed into `ki:conform` — it resolves each dependency to the newest version its `package.json` range allows and forces a fresh registry fetch, so it never crosses a semver major and never writes `latest` into `bun.lock`. **`ki:deps:update`** (`bun update --latest && bun install`) is the deliberate upgrade you run on purpose — `--latest` takes the newest published version (crossing majors, rewriting the `package.json` range), and the trailing `bun install` re-pins `bun.lock`'s specifiers to `package.json` so `--latest`'s transient `latest` markers never survive into a commit. `ki:knip` is the **full** run — dependencies _plus_ dead code (unused files, exports, types, enum/class members) — and it **gates `ki:verify`** (below), so an unused export or phantom dependency fails CI. Every repo carries a `knip.json` (§5) declaring its entry points (so the public surface isn't misread as dead code) and any intentional ignores; `knip` is a required devDependency.
- `clean` and `prepare` are idioms (left bare); the unified `ki:conform` / `ki:verify` entrypoints (below) compose the families above.
- A repo MAY add any number of **repo-specific scripts** (`ki:eval`, `ki:skills:*`, `ki:repo:audit`, `ki:server:auth:*`, `ki:site:dev:css`, …) — all `ki:`-prefixed per the naming law. Extra `ki:*` scripts are never drift; the checker is strict about the required families and the naming law, and permissive about additive `ki:*` scripts.

### The unified conformance entrypoints (core)

Two composed entrypoints give every repo a single command for mechanical conformance — a project never needs to remember the family members:

```jsonc
// ki:conform — the WRITE pass: bring the repo into mechanical conformance, in order.
"ki:conform": "bun run ki:deps:refresh && bun run ki:lint:package && bun run ki:lint:format && bun run ki:lint:fix && bun run ki:lint:md",
// repos with a compiled build append " && bun run build"; repos with tests append " && bun run test".

// ki:verify — the read-only CHECK pass: the exact gate CI runs (no mutation).
"ki:verify": "bun run ki:lint:check && bun run ki:lint:types && bun run ki:lint:md:check && bun run ki:knip",
// repos with a compiled build append " && bun run build"; repos with tests append " && bun run test:coverage".
```

- **`ki:conform`** (write) updates dependencies, then runs the formatters/fixers in dependency order (syncpack → Biome format → Biome fix → Markdown), then builds and tests where those capabilities are present. It is the "make this repo conformant" button.
- **`ki:verify`** (read-only) is the local mirror of the CI gate (§1 _CI workflow_): `ki:lint:check` / `ki:lint:types` / `ki:lint:md:check` / **`ki:knip`** (the dependency + dead-code gate) (+ `build` / `test:coverage`), in order, mutating nothing. CI runs `bun run ki:verify` as its single gate step.

Both are **required in every repo** and assembled from the capability set the repo opts into (build/tests), so the checker validates their shape against the families plus whichever capability tails apply.

**Monorepo `ki:lint:types` (shape-driven).** The canonical `ki:lint:types` above assumes a single root TS project — the **flat** shape (§0). A **monorepo** (§0) — e.g. a website with `site/` (Bun-typed Eleventy) plus `ingress/` (a Cloudflare Worker on `@cloudflare/workers-types`) — has per-workspace `tsconfig.json`s whose `types`/`lib` are mutually incompatible, so one root `tsc --noEmit` cannot type-check them all. Such a repo declares its packages in the standard Bun `workspaces` array in `package.json`:

```jsonc
{ "workspaces": ["site", "ingress"] }
```

and `ki:lint:types` aggregates the per-workspace checks instead — e.g. `bun run ki:site:types && bun run ki:ingress:types`, each a `tsc --noEmit -p <pkg>`. When `workspaces` is present, the checker validates that every listed directory has a `tsconfig.json` and that `ki:lint:types` references each, rather than exact-matching the single-root literal. This relaxation is **`ki:lint:types`-only**: `ki:lint:check` (Biome), `ki:lint:md` (Prettier + markdownlint), and `ki:lint:package` (syncpack) each run from one root config that already spans every package, so they stay canonical. The signal is `workspaces` in `package.json` (standard tooling), not a `.ki-config.toml` key (§9).

## 3. Bun vs Node (core)

Install and dev use **Bun (≥ 1.3)**; the compiled `dist/` runs under **Node (≥ 22)** — that is what a consumer launches. Two standing traps:

- **No `bun test`, anywhere.** `bun run test` runs vitest; bare `bun test` silently invokes Bun's own runner. No script value may contain `bun test`; the test script (where present, §6) is `vitest run`.
- **`.env` parity.** Bun auto-loads `.env*`; Node does not, so a repo that loads `.env` files calls `process.loadEnvFile()` (wrapped in try/catch — Bun has no such API and throws `TypeError`). Resolve the path from the module's own location (`import.meta.url`), **not** `process.cwd()` — the compiled server is launched as `node /abs/path/dist/…` from an arbitrary cwd, so a `./`-relative path silently misses. Load `.env.local`, then `.env.${NODE_ENV}` (when set), then `.env`; `loadEnvFile` never overwrites an already-set var, so the launcher's environment wins. `NODE_ENV=development` is set **only** by dev/inspect scripts, so production ignores `.env.*` and config must come from the launcher's environment (§8).

## 4. tsconfig.json (core + profiled)

`tsconfig.json` is present in every repo. Two tiers, because a web/JS repo legitimately differs from a Node/TS-server repo:

- **Universal invariants (core, all 10 repos):** `strict: true`; `module` & `moduleResolution` `nodenext`; `noEmit: true`; `isolatedModules: true`; `esModuleInterop: true`; `skipLibCheck: true`; `forceConsistentCasingInFileNames: true`. These hold even for the 11ty web repo.
- **The shared Node/TS base (compiled-TS profile — §7):** repos that compile TS to `dist/` (they carry `tsconfig.build.json`) additionally match the byte-identical base the `mcp-*` repos share: `target`/`lib` `es2024`, `moduleDetection: force`, `types: ["node", "vitest/globals"]`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, full `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns` / `noImplicitOverride` / `noFallthroughCasesInSwitch`, `include: ["**/*.ts"]`, `exclude: ["node_modules", "dist"]`. A web repo (esnext, `allowJs`, JSX) is exempt from this base.

## 5. biome.json & prettier config (core)

**`biome.json`** present and matching the shared config: git VCS + `useIgnoreFile`; formatter `indentStyle: space`, `indentWidth: 2`, `lineWidth: 140`; JS formatter `quoteStyle: single`, `semicolons: asNeeded`, `trailingCommas: none`; linter `preset: recommended` with `suspicious.noExplicitAny: off`; `assist.source.organizeImports: on`. The `$schema` pins the Biome version — bump it on the house Biome upgrade.

**`.prettierrc.json`** present and byte-identical across repos. Biome formats code; Prettier is used **only** for Markdown (it backs `ki:lint:md`, §2), so the config is small and the Markdown-shaping fields are the point:

```json
{
  "printWidth": 140,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "proseWrap": "never",
  "trailingComma": "none",
  "overrides": [{ "files": "*.md", "options": { "parser": "markdown" } }]
}
```

`proseWrap: never` is the house choice — Prettier joins each Markdown paragraph back to a single line rather than hard-wrapping at `printWidth` (one paragraph per line; the linter enforces no mid-sentence breaks). The Markdown _content_ conventions (tables → footnotes, link style) live in `ki-authoring`; this section owns only the formatter config that governs wrapping.

**`knip.json`** present, backing knip (the `ki:knip` / `ki:deps:*` tool, §2). It is **per-repo** — its `entry` array names the repo's real entry points so the public surface isn't misread as dead code: the build's `bin`/`exports` source files, plus test/script/eval entries the relevant knip plugin doesn't auto-detect. House defaults: `ignoreExportsUsedInFile: true` (an export referenced within its own file is not dead); `ignore` any generated trees (e.g. `src/generated/**` — **never** hand-edited, regenerated by codegen); `ignoreDependencies` only for packages legitimately provided transitively by a meta-package (e.g. `googleapis` vending `google-auth-library`), with the reason recorded. Because `ki:knip` gates `ki:verify`, a stale `knip.json` (missing a new entry point) surfaces immediately as a CI failure, not silent rot.

## 6. Testing (capability: the repo ships tests)

When a repo has a `vitest.config.*` (or a `test` script):

- `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, `"test:watch": "vitest"`.
- `vitest.config.ts`: `globals: true`, `environment: 'node'`, `include: ['src/**/*.test.ts']`, `fileParallelism: false`, v8 coverage with **100% thresholds on all four metrics** (lines / functions / branches / statements). Tests are co-located (`src/**/*.test.ts`).
- The coverage `exclude` list always drops `src/**/*.test.ts`; **which other modules are excluded is artifact-specific** (e.g. an MCP excludes `mcp-server/index.ts`, `tools/**`, `utils/annotations.ts`) and is owned by that artifact's skill, not here.
- **Executable helper scripts are operational tooling, not shipped `src/`, and are outside this capability.** A repo's `scripts/` (repo tooling, eval harnesses) and a skill's bundled checkers (`scripts/audit-*.ts`, `scripts/lint-*.ts`) are run, not unit-tested — coverage is scoped to `src/**`, which never matches them. So a repo whose only TypeScript is such scripts (no `src/`, no `vitest.config`) does **not** trigger the tests capability, and its absence of tests is conformant by design — not a coverage gap. The harness repo is exactly this case.
- **Monorepo variant (§0).** The `src/**` globs above are the **flat-shape** form. In a monorepo each workspace scopes them to its own source root: `include`/`exclude` match that workspace's test files (e.g. `include: ['site/scripts/**/*.test.ts']`), and vitest writes coverage to a `reportsDirectory` **under the workspace** — `site/coverage`, gitignored there — never the repo root. The 100%-threshold rule and the `*.test.ts` exclude are unchanged; only the paths become workspace-relative.

## 7. Compiled build & CLI (capability: the repo compiles to `dist/`)

When a repo ships a compiled `dist/` (it has `tsconfig.build.json`, or `build` is a `tsc` call):

- `"build": "tsc -p tsconfig.build.json"`. `"files": ["dist"]`.
- `tsconfig.build.json` extends `tsconfig.json`: `noEmit: false`, `declaration` + `declarationMap`, `outDir: ./dist`, `rootDir: ./src`, `allowImportingTsExtensions: false`, `noUncheckedIndexedAccess: true`, `exclude: [..., "**/*.test.ts"]`.
- **CLI chmod rule.** `build` appends `&& chmod +x dist/cli/cli.js` **iff** `src/cli/` exists, and chmods **nothing else** — in particular **not** a server/`mcp-server` bin. (Package managers set `+x` on `bin` targets at install, and launchers invoke via `node`, so the entry bin needs no chmod; the executable CLI does.) A `build` that chmods a path with no matching `src/` dir, or omits the chmod while `src/cli/` exists, is drift.
- **Monorepo variant (§0).** In a monorepo the compiled output lands under the owning workspace (`site/dist`, `ingress/dist`), and the workspace's `files`/`clean` entries and the root `.gitignore` reference that workspace-scoped path (`/site/dist`), not a root `dist/`. A website's `dist/` location specifically is owned by `ki-website` (which builds it) and `ki-website-cloudflare` (which serves it); this section governs the `tsc`-compiled case.

A non-`tsc` build (e.g. ki-website's 11ty `build`) is outside this section — the repo compiles by another toolchain; only the families in §2 and the core (§1–§5) apply.

## 8. .env discipline (capability: the repo reads env config)

When a repo reads environment config (it has `.env*.example`, or calls `process.loadEnvFile`):

- A committed `.env*.example` template; real `.env.*` files are gitignored.
- `NODE_ENV=development` appears **only** in dev/inspect scripts (never in `start`/`build`/`test`).
- The config loader calls `process.loadEnvFile()` inside a try/catch for Node/Bun parity (§3).

The variable **names/prefix** and which vars exist are artifact-specific (e.g. an MCP uses `MCP_<APP>_*` with the shared access-level + audit-log block) and live in that artifact's skill.

## 9. `.ki-config.toml` — `[ki-engineering]` (core)

A governed repo declares a `[ki-engineering]` table. Presence marks "the engineering standard applies here" (the selector for the common layer). Following the `.ki-config.toml` table-per-skill contract (owned by `ki-repo`), the table is minimal — capabilities are auto-detected from markers (above), so no profile field is needed. A repo that deliberately diverges declares it explicitly:

```toml
[ki-engineering]
# This repo fully conforms, so it declares no overrides. To diverge from a check,
# add a [ki-engineering.checks] table with one boolean per check id
# (false = waive), and say why in a comment.
```

The table carries **no top-level keys**. Repo shape (flat vs monorepo, §0) — which is what drives the `ki:lint:types` aggregate — is read from the standard Bun `workspaces` array in `package.json`, not from here. Keeping the shape signal in `package.json` means standard tooling (Bun, syncpack) sees it too, rather than hiding it behind a bespoke `.ki-config.toml` extension.

The checker **validates down**: any key under `[ki-engineering]` is drift (the table is a conformance marker; the only allowed sub-structure is a `[ki-engineering.checks]` table), so a typo or a stale override surfaces rather than silently doing nothing.
