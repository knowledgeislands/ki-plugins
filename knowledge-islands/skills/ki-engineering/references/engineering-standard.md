# The Knowledge Islands engineering standard

ADR: [ADR-KI-HARNESS-TOOLCHAIN-001](../../../../docs/decisions/ADR-KI-HARNESS-TOOLCHAIN-001-standard-toolchain.md)

The shared **engineering toolchain** every Knowledge Islands TypeScript/Bun repo conforms to — the common layer the artifact-type skills (`ki-mcp`, and future ones) build on rather than restate. It is the build/test twin of `ki-authoring` (which owns _how we write_); this owns _how we build, lint, and test_.

This file is the **normative, quotable** standard. The checkable items live in [the rubric](audit-rubric.md); the mechanical checks are in [`../scripts/audit.ts`](../scripts/audit.ts); the meta-standard for how this (and any) standard is defined and enforced is [the enforcement framework](enforcement-framework.md).

## Contents

- [Scope, layers, and composition](#scope-layers-and-composition)
- [0. Repo shapes — flat vs monorepo (core)](#0-repo-shapes--flat-vs-monorepo-core)
- [1. package.json & toolchain pinning (core)](#1-packagejson--toolchain-pinning-core)
- [2. The governed script surface (core)](#2-the-governed-script-surface-core)
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
- **Capability conditionals** — common rules that fire only when the repo opts into a capability, detected by a marker in the repo (§6–§8). A repo with no tests is not required to have a test script; a repo that ships tests exposes them through the bare `test` idiom. Vitest is recommended, not mandated; when a repo selects it by carrying `vitest.config.*`, the canonical Vitest scripts and 100% coverage rules apply in full.

**Artifact-specific rules are NOT here.** Anything meaningful only for one artifact type — the MCP coverage-exclude list, `bin → dist/mcp-server/index.js`, `ki:server:mcp:*` scripts, `exports` per `main/<concern>` — lives in that artifact's skill (e.g. `ki-mcp`). A repo is fully audited by **composing** this standard's checker with the artifact skill's checker (run `ki:engineering:audit` for the common layer, then e.g. `audit.ts` for the MCP delta); the checkers compose by being run in sequence, never by importing each other.

The capability markers, and what each unlocks:

| Capability     | Marker in the repo                                              | Adds (this standard)                                        |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Tests          | `vitest.config.*` present, or a `test` script                   | §6 — bare entrypoint; strict Vitest profile when configured |
| Compiled build | `tsconfig.build.json` present, or `build` is a `tsc` invocation | §7 — `build`/`files`/`tsconfig.build.json`                  |
| Env config     | `.env*.example` present, or `process.loadEnvFile` used          | §8 — `.env` discipline + `NODE_ENV`-in-dev                  |
| CLI binary     | `src/cli/` present                                              | §7 — `build` chmods `dist/cli/cli.js`                       |

## 0. Repo shapes — flat vs monorepo (core)

Every KI TS/Bun repo is one of exactly **two shapes**, distinguished by the standard Bun `workspaces` array in the root `package.json`:

| Shape        | Marker                                | Canonical examples                                     |
| ------------ | ------------------------------------- | ------------------------------------------------------ |
| **Flat**     | no `workspaces` key in `package.json` | the `mcp-*` repos (`mcp-kb-fs`, `mcp-gsuite`, …)       |
| **Monorepo** | `workspaces` array in `package.json`  | every 11ty/Cloudflare website (`vallearmonia-website`) |

- **Flat** is the default: all source under one root TS project, one root `tsconfig.json`, scripts unprefixed. A single root `tsc --noEmit` type-checks the whole repo (§2).
- **Monorepo** declares its packages as workspace directories — `"workspaces": ["site", "ingress"]` (or just `["site"]`). Each workspace carries its own `package.json` and `tsconfig.json`. Because two workspaces can carry mutually incompatible `types`/`lib` (e.g. `site/` on Bun types vs `ingress/` on `@cloudflare/workers-types`), one root `tsc --noEmit` cannot span them — so `ki:engineering:audit` type-checks each workspace separately (§2), while repo-specific scripts take the workspace-name prefix (`ki:site:build`, `ki:ingress:dev`).
- **Per-workspace artifacts and test scope.** In a monorepo every build/test artifact and the config globs that produce it are **scoped to the workspace directory that owns them**, never the repo root: each workspace's compiled `dist/` (§7), its Vitest coverage output — the `reportsDirectory`, e.g. `site/coverage` (§6) — and its test files with their `include`/`exclude` globs all sit under `<workspace>/…`. The repo root carries only shared, workspace-spanning config (root `package.json`, Biome/Prettier/markdownlint configuration, root `.gitignore`). In the **flat** shape these same artifacts live at the root because the root _is_ the single package, so `dist/` and `coverage/` at the root are already "under the workspace". This is the one rule behind a site's output at `site/dist` (not root `dist/`) and its coverage at `site/coverage` (not root `coverage/`); when it is violated the artifact escapes its workspace and the root fills with per-package output. Cross-refs: §6 (tests), §7 (build).
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

**`lint-staged` + toolchain `devDependencies`.** The engineering and authoring audit/conform modes invoke a fixed toolchain directly, so that toolchain is **declared**, not merely implied: every repo carries `@biomejs/biome`, `knip`, `prettier`, `husky`, `lint-staged`, `markdownlint-cli2`, `syncpack`, and `typescript` in `devDependencies`. The `lint-staged` block (the husky pre-commit fan-out) is a governed key — present in every repo, running `@biomejs/biome` over staged code and `prettier` + `markdownlint-cli2` over staged Markdown. A root `knip.json` (§5) configures knip — entry points + intentional ignores. **knip replaced `depcheck`** (which false-flagged config-referenced toolchain deps — it would have `bun remove`d biome — and found no dead code); `depcheck` / `node-jq` are no longer dependencies.

**Toolchain pin (`mise.toml`).** Every repo carries a root `mise.toml` with a `[tools]` table pinning both the **node** and **bun** versions — the actual runtimes [mise](https://mise.jdx.dev/) puts on `PATH` when you `cd` in, and that CI installs via `jdx/mise-action`, so the dev shell and CI resolve byte-identically. Two rules:

- The pinned **`bun` MUST equal the `packageManager` Bun version** above. Bun is named in both files, so they are the standing drift pair — the checker compares them. (`node` is pinned _exactly_ here even though `engines.node` only states a `>= 22` floor.)
- `mise.toml` is the **single** toolchain pin. No legacy single-tool file — `.node-version`, `.nvmrc`, `.bun-version` — may linger beside it; each is redundant and can silently diverge, so the checker warns on any it finds.

### CI workflow

Where the repo has CI (`.github/workflows/ci.yml`), it is a single `build` job on `push` to `main` and `pull_request`, running the common gate **in order**: `jdx/mise-action` (installs the toolchain from `mise.toml`, pinning **no** version itself — no `bun-version:` / `node-version:`, which would bypass `mise.toml` and is drift) → `bun install --frozen-lockfile` → **`bun run ki:audit`** → **`bun run test`** when the repo ships self-tests. The aggregate audit fans out over every vendored skill audit; `ki-engineering` runs the code toolchain and `ki-authoring` runs the Markdown gate. A `ki:test:smoke` step that follows in an MCP repo is that artifact's **delta**, owned by `ki-mcp` and asserted by `audit.ts` — not part of this common shape.

## 2. The governed script surface (core)

### The `ki:` naming law (core)

Every entry in `scripts` is **either** one of the six universal lifecycle idioms — `build`, `prepare`, `test`, `test:coverage`, `test:watch`, `clean` — **or** it carries the `ki:` prefix. There is no third option: a bare (non-`ki:`, non-idiom) script name is **drift** (a `FAIL`). The prefix is what makes a script's provenance mechanically decidable — "is this script ours?" is answered by its name, not by grepping a checker — and is the lever that keeps the script surface fully governed. The exempt six are left bare because they are universally recognized package-lifecycle verbs that every Node toolchain, CI runner, and contributor already knows.

### Required governance entrypoints

Every governed repo exposes two aggregate entrypoints that fan out over the vendored skills selected by `.ki-config.toml`:

```jsonc
"ki:audit": "bun .ki-meta/bin/aggregate.ts audit",
"ki:conform": "bun .ki-meta/bin/aggregate.ts conform",
"clean": "rm -rf {dist,node_modules}",
"prepare": "husky"
```

- **`ki:audit`** is the read-only gate; **`ki:conform`** is the write pass. Both use the standalone vendored entrypoint under `.ki-meta`, so the repo remains self-governing without installed skills.
- Each vendored skill also receives derived scoped entrypoints such as `ki:engineering:audit`, `ki:engineering:conform`, `ki:authoring:audit`, and `ki:authoring:conform`. These are useful for focused work; the aggregate remains the repository gate.
- `clean` and `prepare` remain bare lifecycle idioms. A repo with tests exposes the complete suite through bare `test`; a compiled repo exposes bare `build`. Neither is appended to the canonical aggregate entrypoints.
- A repo MAY add governed, repo-specific scripts (`ki:eval`, `ki:skills:*`, `ki:server:auth:*`, `ki:site:dev:css`, …). The owning skill specifies their shape.

### Code tools run inside `ki-engineering`

The code toolchain is implementation detail inside the engineering modes, not a public family of package scripts:

- Audit runs Biome check, TypeScript checking, syncpack check, and knip directly. The authoring sibling runs Prettier and markdownlint for Markdown.
- Conform performs the corresponding dependency refresh and safe fixes directly. Building and testing remain explicit bare lifecycle commands, run after conformance when needed.
- For a flat repo, engineering invokes `tsc --noEmit` at the root. For a monorepo, it derives one `tsc --noEmit -p <workspace>/tsconfig.json` invocation for every declared workspace.
- A root `knip.json` (§5) supplies entry points and intentional ignores; knip covers both dependency and dead-code hygiene.

The former per-tool families and unified verify key are explicitly **retired** by ADR-KI-HARNESS-TOOLCHAIN-001. Any `ki:lint:*`, `ki:deps:*`, `ki:knip`, or `ki:verify` key is drift: those operations now live inside `ki:engineering:audit`/`conform`, `ki-authoring`, and the aggregate `ki:audit`/`ki:conform`.

**Monorepo type-checking (shape-driven).** A monorepo (§0) — e.g. a website with `site/` (Bun-typed Eleventy) plus `ingress/` (a Cloudflare Worker on `@cloudflare/workers-types`) — has per-workspace `tsconfig.json`s whose `types`/`lib` are mutually incompatible, so one root `tsc --noEmit` cannot type-check them all. Such a repo declares its packages in the standard Bun `workspaces` array in `package.json`:

```jsonc
{ "workspaces": ["site", "ingress"] }
```

When `workspaces` is present, the checker validates that every listed directory has a `tsconfig.json` and type-checks each directly. Biome, syncpack, and the authoring tools continue to run from their root configurations, which already span every package. The signal is `workspaces` in `package.json` (standard tooling), not a `.ki-config.toml` key (§9).

## 3. Bun vs Node (core)

Install and dev use **Bun (≥ 1.3)**; the compiled `dist/` runs under **Node (≥ 22)** — that is what a consumer launches. Two standing traps:

- **No `bun test`, anywhere.** `bun run test` invokes the repo's governed `test` script; bare `bun test` bypasses it and silently invokes Bun's own runner. No script value may contain the literal `bun test`. A Vitest-configured repo uses `vitest run`; another runner remains valid behind the same bare `test` idiom (§6).
- **`.env` parity.** Bun auto-loads `.env*`; Node does not, so a repo that loads `.env` files calls `process.loadEnvFile()` (wrapped in try/catch — Bun has no such API and throws `TypeError`). Resolve the path from the module's own location (`import.meta.url`), **not** `process.cwd()` — the compiled server is launched as `node /abs/path/dist/…` from an arbitrary cwd, so a `./`-relative path silently misses. Load `.env.local`, then `.env.${NODE_ENV}` (when set), then `.env`; `loadEnvFile` never overwrites an already-set var, so the launcher's environment wins. `NODE_ENV=development` is set **only** by dev/inspect scripts, so production ignores `.env.*` and config must come from the launcher's environment (§8).

## 4. tsconfig.json (core + profiled)

`tsconfig.json` is present in every repo. Two tiers, because a web/JS repo legitimately differs from a Node/TS-server repo:

- **Universal invariants (core, all 10 repos):** `strict: true`; `module` & `moduleResolution` `nodenext`; `noEmit: true`; `isolatedModules: true`; `esModuleInterop: true`; `skipLibCheck: true`; `forceConsistentCasingInFileNames: true`. These hold even for the 11ty web repo.
- **The shared Node/TS base (compiled-TS profile — §7):** repos that compile TS to `dist/` (they carry `tsconfig.build.json`) additionally match the shared base the `mcp-*` repos use: `target`/`lib` `es2024`, `moduleDetection: force`, `types: ["node"]`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, full `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns` / `noImplicitOverride` / `noFallthroughCasesInSwitch`, `include: ["**/*.ts"]`, `exclude: ["node_modules", "dist"]`. A repo that selects Vitest by carrying `vitest.config.*` adds `vitest/globals` to `types`; a web repo (esnext, `allowJs`, JSX) is exempt from this base.

## 5. biome.json & prettier config (core)

**`biome.json`** present and matching the shared config: git VCS + `useIgnoreFile`; formatter `indentStyle: space`, `indentWidth: 2`, `lineWidth: 140`; JS formatter `quoteStyle: single`, `semicolons: asNeeded`, `trailingCommas: none`; linter `preset: recommended` with `suspicious.noExplicitAny: off`; `assist.source.organizeImports: on`. The `$schema` pins the Biome version — bump it on the house Biome upgrade.

**`.prettierrc.json`** present and byte-identical across repos. Biome formats code; Prettier is used **only** for Markdown (inside `ki-authoring` audit/conform), so the config is small and the Markdown-shaping fields are the point:

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

`proseWrap: never` is the house choice — Prettier joins each Markdown paragraph back to a single line rather than hard-wrapping at `printWidth` (one paragraph per line; the linter enforces no mid-sentence breaks). The Markdown _content_ conventions (tables → footnotes, link style) live in `ki-authoring`; this section owns only the formatter config that governs wrapping.

**`knip.json`** present, backing the knip pass inside engineering audit/conform (§2). It is **per-repo** — its `entry` array names the repo's real entry points so the public surface isn't misread as dead code: the build's `bin`/`exports` source files, plus test/script/eval entries the relevant knip plugin doesn't auto-detect. House defaults: `ignoreExportsUsedInFile: true` (an export referenced within its own file is not dead); `ignore` any generated trees (e.g. `src/generated/**` — **never** hand-edited, regenerated by codegen); `ignoreDependencies` only for packages legitimately provided transitively by a meta-package (e.g. `googleapis` vending `google-auth-library`), with the reason recorded. Because knip gates `ki:engineering:audit`, a stale `knip.json` (missing a new entry point) surfaces immediately as an aggregate-audit failure, not silent rot.

## 6. Testing (capability: the repo ships tests)

When a repo ships tests, it exposes the whole suite through the bare `test` script. The runner behind that idiom is repo-appropriate: Vitest is the recommended default for source-unit tests, while a scripts-only governance repo may chain standalone `bun path/to/*.test.ts` programs. Literal `bun test` remains forbidden (§3) because it bypasses the governed script.

When a repo selects Vitest by carrying `vitest.config.*`, all of the following apply:

- `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, `"test:watch": "vitest"`.
- `vitest.config.ts`: `globals: true`, `environment: 'node'`, `include: ['src/**/*.test.ts']`, `fileParallelism: false`, v8 coverage with **100% thresholds on all four metrics** (lines / functions / branches / statements). Tests are co-located (`src/**/*.test.ts`).
- The coverage `exclude` list always drops `src/**/*.test.ts`; **which other modules are excluded is artifact-specific** (e.g. an MCP excludes `mcp-server/index.ts`, `tools/**`, `utils/annotations.ts`) and is owned by that artifact's skill, not here.
- **Executable helper scripts are operational tooling, not shipped `src/`, and remain outside Vitest's coverage profile.** A repo's `scripts/` (repo tooling, eval harnesses) and a skill's bundled checkers may carry standalone self-tests behind the bare `test` idiom without adding `vitest.config.*`; the 100% source-coverage rules do not apply to that runner-neutral profile. Their absence of self-tests is not automatically a coverage gap.
- **Monorepo variant (§0).** The `src/**` globs above are the **flat-shape** form. In a monorepo each workspace scopes them to its own source root: `include`/`exclude` match that workspace's test files (e.g. `include: ['site/scripts/**/*.test.ts']`), and vitest writes coverage to a `reportsDirectory` **under the workspace** — `site/coverage`, gitignored there — never the repo root. The 100%-threshold rule and the `*.test.ts` exclude are unchanged; only the paths become workspace-relative.

## 7. Compiled build & CLI (capability: the repo compiles to `dist/`)

When a repo ships a compiled `dist/` (it has `tsconfig.build.json`, or `build` is a `tsc` call):

- `"build": "tsc -p tsconfig.build.json"`. `"files": ["dist"]`.
- `tsconfig.build.json` extends `tsconfig.json`: `noEmit: false`, `declaration` + `declarationMap`, `outDir: ./dist`, `rootDir: ./src`, `allowImportingTsExtensions: false`, `noUncheckedIndexedAccess: true`, `exclude: [..., "**/*.test.ts"]`.
- **CLI chmod rule.** `build` appends `&& chmod +x dist/cli/cli.js` **iff** `src/cli/` exists, and chmods **nothing else** — in particular **not** a server/`mcp-server` bin. (Package managers set `+x` on `bin` targets at install, and launchers invoke via `node`, so the entry bin needs no chmod; the executable CLI does.) A `build` that chmods a path with no matching `src/` dir, or omits the chmod while `src/cli/` exists, is drift.
- **Monorepo variant (§0).** In a monorepo the compiled output lands under the owning workspace (`site/dist`, `ingress/dist`), and the workspace's `files`/`clean` entries and the root `.gitignore` reference that workspace-scoped path (`/site/dist`), not a root `dist/`. A website's `dist/` location specifically is owned by `ki-website` (which builds it) and `ki-website-cloudflare` (which serves it); this section governs the `tsc`-compiled case.

A non-`tsc` build (e.g. ki-website's 11ty `build`) is outside this section — the repo compiles by another toolchain; only the governed script surface in §2 and the core (§1–§5) apply.

## 8. .env discipline (capability: the repo reads env config)

When a repo reads environment config (it has `.env*.example`, or calls `process.loadEnvFile`):

- A committed `.env*.example` template; real `.env.*` files are gitignored.
- `NODE_ENV=development` appears **only** in dev/inspect scripts (never in `start`/`build`/`test`).
- The config loader calls `process.loadEnvFile()` inside a try/catch for Node/Bun parity (§3).

The variable **names/prefix** and which vars exist are artifact-specific (e.g. an MCP uses `MCP_<APP>_*` with the shared access-level + audit-log block) and live in that artifact's skill.

### XDG Base Directory paths (capability: the repo resolves a config/data/cache/state directory on the host)

When a script computes a filesystem path for its own or another tool's config, data, cache, or state directory (`~/.config/...`, `~/.local/share/...`, `~/.cache/...`, `~/.local/state/...`), it honours the corresponding [XDG Base Directory](https://specifications.freedesktop.org/basedir/latest/) env var (published by [freedesktop.org](https://www.freedesktop.org/), the cross-desktop-standards project the spec lives under) — `$XDG_CONFIG_HOME`, `$XDG_DATA_HOME`, `$XDG_CACHE_HOME`, `$XDG_STATE_HOME` — falling back to the spec's own default (`~/.config`, `~/.local/share`, `~/.cache`, `~/.local/state` respectively) only when the var is unset. A bare `join(homedir(), '.config', ...)` with no env-var check is the anti-pattern: it silently diverges from a machine that has repointed the var (e.g. a chezmoi-managed dotfiles setup exporting `$XDG_DATA_HOME` for a non-default `chezmoi` source dir). `ki-binding` and `ki-binding-chezmoi` are the reference implementations (see their `references/binding-standard.md`).

This does not license inventing a path a tool doesn't already use — mcporter's `~/.mcporter/mcporter.json`, for instance, is that tool's own fixed convention, not one this standard overrides; the rule applies only where the repo itself is choosing the config/data/cache/state location.

## 9. `.ki-config.toml` — `[ki-engineering]` (core)

A governed repo declares a `[ki-engineering]` table. Presence marks "the engineering standard applies here" (the selector for the common layer). Following the `.ki-config.toml` table-per-skill contract (owned by `ki-repo`), the table is minimal — capabilities are auto-detected from markers (above), so no profile field is needed. A repo that deliberately diverges declares it explicitly:

```toml
[ki-engineering]
# This repo fully conforms, so it declares no overrides. To diverge from a check,
# add a [ki-engineering.checks] table with one boolean per check id
# (false = waive), and say why in a comment.
```

The table carries **no top-level keys**. Repo shape (flat vs monorepo, §0) — which drives engineering's workspace-aware type-checking — is read from the standard Bun `workspaces` array in `package.json`, not from here. Keeping the shape signal in `package.json` means standard tooling (Bun, syncpack) sees it too, rather than hiding it behind a bespoke `.ki-config.toml` extension.

The checker **validates down**: any key under `[ki-engineering]` is drift (the table is a conformance marker; the only allowed sub-structure is a `[ki-engineering.checks]` table), so a typo or a stale override surfaces rather than silently doing nothing.
