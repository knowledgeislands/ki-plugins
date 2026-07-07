# Audit rubric — the common engineering layer

Line-by-line criteria for auditing a Knowledge Islands TS/Bun repo against [the engineering standard](engineering-standard.md). Each is tagged **[M] mechanical** (enforced by [`../scripts/audit-engineering.ts`](../scripts/audit-engineering.ts) — capture its output, don't re-derive) or **[J] judgment** (assess by reading). Run the checker first, then apply the judgment items. Severity: **FAIL** (ship-stopper) · **WARN** (should-fix divergence) · **POLISH** (minor / cosmetic) — the shared ladder, defined in `ki-engineering`'s [`enforcement-framework.md`](enforcement-framework.md) §2.

Capability conditionals only apply when the repo has the marker (tests / compiled build / env / CLI); a repo without the capability is not graded on it, and the checker reports it as N/A, not a failure.

## Contents

- [Core — package.json & toolchain pinning (§1)](#core--packagejson--toolchain-pinning-1)
- [Core — script families (§2)](#core--script-families-2)
- [Core — Bun vs Node (§3)](#core--bun-vs-node-3)
- [Core — tsconfig.json (§4)](#core--tsconfigjson-4)
- [Core — biome.json & prettier config (§5)](#core--biomejson--prettier-config-5)
- [Capability: tests (§6)](#capability-tests-6--marker-vitestconfig-or-a-test-script)
- [Capability: compiled build & CLI (§7)](#capability-compiled-build--cli-7--marker-tsconfigbuildjson-or-a-tsc-build)
- [Capability: env config (§8)](#capability-env-config-8--marker-envexample-or-processloadenvfile)
- [Core — .ki-config.toml (§9)](#core--ki-configtoml-9)
- [Reporting](#reporting)

## Core — package.json & toolchain pinning (§1)

- [ ] [M] WARN — `"type": "module"`.
- [ ] [M] WARN — `"packageManager"` starts with `bun@` (pinned patch).
- [ ] [M] WARN — `"engines.node"` floor is `>= 22`.
- [ ] [M] FAIL — **coverage manifest (exhaustive)**: every top-level `package.json` key is in the manifest (§1) — `name`, `version`, `description`, `author`, `license`, `private`, `repository`, `homepage`, `bugs`, `keywords`, `type`, `packageManager`, `engines`, `scripts`, `devDependencies`, `dependencies`, `workspaces`, `lint-staged`, `main`, `bin`, `exports`, `files`. An unknown key is drift.
- [ ] [M] FAIL — toolchain `devDependencies` present: `@biomejs/biome`, `knip`, `prettier`, `husky`, `lint-staged`, `markdownlint-cli2`, `syncpack`, `typescript` (the tools the families invoke — declared, not implied). `depcheck` / `node-jq` are gone (replaced by knip).
- [ ] [M] FAIL/WARN — `lint-staged` block present (FAIL if missing) and fans out to `@biomejs/biome` on code + `prettier` + `markdownlint` on Markdown (WARN otherwise).
- [ ] [M] WARN — a root `mise.toml` pins both `node` and `bun` under `[tools]`.
- [ ] [M] WARN — the `mise.toml` `bun` version **equals** the `packageManager` Bun version (the drift pair).
- [ ] [M] POLISH — no legacy single-tool pin file (`.node-version`, `.nvmrc`, `.bun-version`) lingers beside `mise.toml` (warn).
- [ ] [M] WARN — where the repo has `.github/workflows/ci.yml`, it installs the toolchain via `jdx/mise-action` and hardcodes no `bun-version:` / `node-version:`.
- [ ] [M] WARN — that `ci.yml` runs the common gate steps `bun run ki:lint:check`, `bun run ki:lint:types`, and `bun run ki:lint:md:check` (plus `bun run test:coverage` where the repo has tests). `ki:lint:md:check` is the Markdown gate; a following `ki:test:smoke` step is the MCP delta (asserted by `audit-mcp.ts`, not here).

## Core — script families (§2)

- [ ] [M] FAIL — **the `ki:` naming law (exhaustive)**: every `scripts` entry is one of the six bare lifecycle idioms (`build`, `prepare`, `test`, `test:coverage`, `test:watch`, `clean`) **or** carries the `ki:` prefix. A bare non-idiom name is drift.
- [ ] [M] WARN — both unified entrypoints are present: `ki:conform` (write pass) and `ki:verify` (read-only CI mirror), composed from the families plus the build/test capability tails the repo opts into.
- [ ] [M] WARN — the full `ki:lint:*` family is present and **exact-matches** the canonical values: `ki:lint:check`, `ki:lint:fix`, `ki:lint:format`, `ki:lint:md`, `ki:lint:md:check`, `ki:lint:package`, `ki:lint:types`. **Exception:** when `package.json` declares a `workspaces` array (monorepo shape, §0/§2), `ki:lint:types` is instead validated as a per-workspace aggregate — each listed workspace dir must have a `tsconfig.json` and `ki:lint:types` must reference each — not the single-root `tsc --noEmit` literal.
- [ ] [M] WARN — the `ki:deps:*` family + `ki:knip` are present and exact-match their canonical values (standard §2): `ki:deps:check` (knip, deps-scoped), `ki:deps:fix` (same `+ --fix`), `ki:deps:refresh` (`bun update --force` — in-range refresh, composed into `ki:conform`), `ki:deps:update` (`bun update --latest && bun install` — deliberate cross-major upgrade), `ki:knip` (full knip).
- [ ] [M] FAIL — `ki:verify` includes `bun run ki:knip` (the dependency + dead-code gate); `knip` exits clean on the repo.
- [ ] [M] ADVISORY — `bun outdated` reports no available updates; if any, review and run `bun run ki:deps:update`.
- [ ] [M] WARN — `clean` and `prepare` are present (`prepare` = `husky`; `clean` removes `node_modules`, and `dist` where the repo builds).
- [ ] [J] POLISH — repo-specific scripts beyond the families are fine; the checker must not flag them. Just confirm none shadow a family name with a divergent definition.

## Core — Bun vs Node (§3)

- [ ] [M] FAIL — **no script value contains `bun test`** (it would invoke Bun's runner, not vitest).
- [ ] [J] WARN — where the repo loads `.env`, `loadConfig` (or equivalent) calls `process.loadEnvFile()` in a try/catch for Node parity.

## Core — tsconfig.json (§4)

- [ ] [M] WARN — `tsconfig.json` present.
- [ ] [M] WARN — base compiler options match the shared set (es2024 target/lib, nodenext module & resolution, full `strict` + the `noUnused*`/`noImplicit*`/`noFallthrough*` family, `verbatimModuleSyntax`, `isolatedModules`, `skipLibCheck`, `noEmit`).
- [ ] [J] WARN — no per-repo loosening of `strict` or the `noUnused*`/`noImplicit*` flags.

## Core — biome.json & prettier config (§5)

- [ ] [M] WARN — `biome.json` present.
- [ ] [M] WARN — matches the shared config (formatter 2-space / lineWidth 140; JS single quotes, `semicolons: asNeeded`, no trailing commas; `preset: recommended` with `noExplicitAny: off`; `organizeImports: on`; git VCS + `useIgnoreFile`).
- [ ] [M] WARN — `.prettierrc.json` present (Prettier backs `ki:lint:md`).
- [ ] [M] FAIL — `knip.json` present (per-repo entry points + ignores; backs `ki:knip` / `ki:deps:*`). See §5.
- [ ] [M] WARN — it matches the shared shape: `proseWrap: never`, `printWidth: 140`, `semi: false`, `singleQuote: true`, `trailingComma: none`, and the `*.md` markdown override.

## Capability: tests (§6) — marker: `vitest.config.*` or a `test` script

> Executable helper scripts (`scripts/`, eval harnesses, a skill's bundled `audit-*.ts` / `lint-*.ts` checkers) are tooling, not shipped `src/` — coverage is scoped to `src/**` and never matches them. A repo whose only TypeScript is such scripts does not trigger this capability; its lack of tests is conformant, not a gap. Do not flag it. (§6)

- [ ] [M] WARN — `test` = `vitest run`; `test:coverage` = `vitest run --coverage`; `test:watch` = `vitest`.
- [ ] [M] FAIL — vitest coverage thresholds are **100%** on all four metrics (lines/functions/branches/ statements).
- [ ] [M] WARN — coverage `include` is `src/**/*.ts` and `exclude` drops `src/**/*.test.ts`. (The _additional_ excludes are artifact-specific — not graded here; the artifact skill grades them.) **Monorepo exception (§0):** when `package.json` declares a `workspaces` array, `include`/`exclude` and the vitest `reportsDirectory` are **workspace-scoped** (e.g. `include: ['site/scripts/**/*.test.ts']`, `reportsDirectory: 'site/coverage'`) rather than the flat `src/**` / root `coverage/` — the paths sit under the owning workspace, not the repo root.
- [ ] [J] WARN — tests are co-located with the source they cover (`src/**/*.test.ts` in the flat shape; under the owning workspace, e.g. `site/scripts/**/*.test.ts`, in a monorepo) and actually reach the 100% bar.

## Capability: compiled build & CLI (§7) — marker: `tsconfig.build.json` or a `tsc` build

- [ ] [M] WARN — `build` = `tsc -p tsconfig.build.json` (optionally `&& chmod …`); `files` includes `dist`. **Monorepo exception (§0):** in a `workspaces` repo the compiled output and its `files`/`clean`/`.gitignore` references are workspace-scoped (`site/dist`), not a root `dist/`.
- [ ] [M] WARN — `tsconfig.build.json` extends the base and sets `noEmit:false`, `declaration` + `declarationMap`, `outDir`/`rootDir`, `allowImportingTsExtensions:false`, `noUncheckedIndexedAccess:true`, excludes `**/*.test.ts`.
- [ ] [M] WARN — **CLI chmod rule**: `build` chmods `dist/cli/cli.js` **iff** `src/cli/` exists; it chmods **no other path** (in particular not a server/mcp-server bin). No dangling chmod, no missing chmod.

## Capability: env config (§8) — marker: `.env*.example` or `process.loadEnvFile`

- [ ] [M] WARN — a committed `.env*.example` template exists.
- [ ] [M] WARN — `NODE_ENV=development` appears only in dev/inspect scripts, never in `start`/`build`/`test`.
- [ ] [J] WARN — real `.env.*` (non-`.example`) is gitignored; the loader has the Node parity call.

## Core — `.ki-config.toml` (§9)

- [ ] [M] WARN — a `[ki-engineering]` table is present (the selector for this layer).
- [ ] [M] WARN — every key under it is one the checker knows (validate-down); an unknown key is drift.

## Reporting

Produce findings grouped by severity, each row `severity · file:line-or-field · what · fix`. Lead with any **FAIL** (a `bun test`, a sub-100% coverage threshold). Close with a one-line verdict (compliant / minor drift / blockers) and name the **artifact-skill audit that must also run** for the repo to be fully clean (e.g. "+ `audit-mcp.ts` for the MCP delta").
