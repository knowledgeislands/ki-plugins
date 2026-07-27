<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands engineering standards

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-engineering --write`.

Line-by-line criteria for auditing ki-engineering. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [PKG — Package metadata](#pkg--package-metadata)
- [MISE — Toolchain pins](#mise--toolchain-pins)
- [CI — Continuous integration](#ci--continuous-integration)
- [SCR — Package scripts](#scr--package-scripts)
- [BUN — Bun and Node runtime boundary](#bun--bun-and-node-runtime-boundary)
- [TSC — TypeScript](#tsc--typescript)
- [BIO — Biome](#bio--biome)
- [KNIP — Knip](#knip--knip)
- [SYNC — Dependency synchronisation](#sync--dependency-synchronisation)
- [DEPS — Dependency freshness](#deps--dependency-freshness)
- [GEN — Generated surfaces](#gen--generated-surfaces)
- [TEST — Tests](#test--tests)
- [BUILD — Compiled builds](#build--compiled-builds)
- [ENV — Environment configuration](#env--environment-configuration)
- [TOML — Engineering configuration](#toml--engineering-configuration)

## PKG — Package metadata

→ [standard](standards-engineering.md)

The shared package metadata and toolchain dependency surface.

- **PKG-1 [M] — Module package type** — `"type": "module"`. (standards-engineering.md)
- **PKG-2 [M] — Bun package-manager pin** — `"packageManager"` starts with `bun@` (pinned patch). (standards-engineering.md)
- **PKG-3 [M] — Node engine floor** — `"engines.node"` floor is `>= 22`. (standards-engineering.md)
- **PKG-4 [M] — Closed package coverage manifest** — Every top-level `package.json` key is in the engineering coverage manifest; an unknown key is drift. This is also the criterion for an unparseable `package.json`. (standards-engineering.md)
- **PKG-5 [M] — Toolchain dependencies declared** — The toolchain devDependencies `@biomejs/biome`, `knip`, `prettier`, `husky`, `lint-staged`, `markdownlint-cli2`, `syncpack`, and `typescript` are declared rather than implied. (standards-engineering.md)
- **PKG-6 [M] — Lint-staged fan-out** — `lint-staged` is present and fans out to Biome on code and Prettier plus `markdownlint-cli2 --no-globs` on staged Markdown only. (standards-engineering.md)

## MISE — Toolchain pins

→ [standard](standards-engineering.md)

The single root Node and Bun toolchain declaration.

- **MISE-1 [M] — Root toolchain pin** — A root `mise.toml` pins both `node` and `bun` under `[tools]`. (standards-engineering.md)
- **MISE-2 [M] — Bun pin drift pair** — The `mise.toml` Bun version equals the `packageManager` Bun version. (standards-engineering.md)
- **MISE-3 [M] — No legacy tool pins** — No legacy `.node-version`, `.nvmrc`, or `.bun-version` file lingers beside `mise.toml`. (standards-engineering.md)

## CI — Continuous integration

→ [standard](standards-engineering.md)

CI installs the declared toolchain and runs canonical repository gates.

- **CI-1 [M] — CI installs the declared toolchain** — Where `.github/workflows/ci.yml` exists, it uses `jdx/mise-action` and hardcodes no Bun or Node version. (standards-engineering.md)
- **CI-2 [M] — CI runs the canonical gates** — `ci.yml` runs `ki repo audit`, then `bun run test` when tests exist, and does not route governance through package scripts. (standards-engineering.md)

## SCR — Package scripts

→ [standard](standards-engineering.md)

The direct CLI boundary, lifecycle idioms, and clean cutover discipline.

- **SCR-1 [M] — KI script naming law** — Every script is a permitted bare lifecycle idiom or carries the `ki:` prefix; a bare non-idiom name is drift. (standards-engineering.md)
- **SCR-2 [M] — Repository maintenance stays CLI-owned** — Package scripts do not alias `ki repo audit`, `ki repo conform`, or `ki repo educate`; repositories invoke the installed CLI directly. (standards-engineering.md)
- **SCR-3 [M] — Retired script families absent** — Retired `ki:lint:*`, `ki:deps:*`, `ki:knip`, `ki:verify`, and aggregate governance aliases are absent. (standards-engineering.md)
- **SCR-4 [M] — Per-skill wrapper aliases absent** — Package scripts contain no derived `ki:<skill>:<mode>` aliases and no command that invokes `.ki`, `govern.ts`, `educate.ts`, an adapter, or a vendored runtime. (standards-engineering.md)
- **SCR-5 [M] — Lifecycle clean and prepare scripts** — `clean` removes `node_modules` (and `dist` where built), and `prepare` is `husky`. (standards-engineering.md)
- **SCR-6 [M] — No test-entrypoint bypass** — Only the bare `test` script may use `bun test`; every other script uses `bun run test` to invoke the governed entrypoint. (standards-engineering.md)
- **SCR-7 [M] — Runner-neutral test and build entrypoints** — Test-capable repos expose bare `test`; compiled repos expose bare `build`; repository governance remains outside package scripts. (standards-engineering.md)
- **SCR-8 [J] — Repo-specific scripts retain clear ownership** — Repo-specific scripts beyond the governance surface are valid only when an owning skill governs them and they do not shadow a governed entrypoint. (standards-engineering.md)
  - _Review prompt:_ Do repo-specific scripts have a clear owner and avoid divergent shadows of governed entrypoints?
- **SCR-9 [J] — Clean-end-state cutovers** — Repository-footprint replacements cut directly to the intended contract, remove the superseded implementation, and verify the result without compatibility code that exists only for an intermediate state. (standards-engineering.md)
  - _Review prompt:_ Did the cutover reach and verify the correct clean end state without retaining transitional compatibility code?

## BUN — Bun and Node runtime boundary

→ [standard](standards-engineering.md)

Environment loading remains equivalent when built output runs under Node.

- **BUN-1 [J] — Node environment-loading parity** — Where the repo loads `.env`, `loadConfig` (or equivalent) calls `process.loadEnvFile()` in a try/catch for Node parity. (standards-engineering.md)
  - _Review prompt:_ Where `.env` is loaded, does the loader call `process.loadEnvFile()` safely?

## TSC — TypeScript

→ [standard](standards-engineering.md)

The TypeScript gate and universal strict compiler invariants.

- **TSC-1 [M] — Type-check passes** — `tsc --noEmit` exits clean at the root, or each declared workspace has a clean `tsc --noEmit -p <workspace>/tsconfig.json`. (standards-engineering.md)
- **TSC-2 [M] — Universal TypeScript invariants** — `tsconfig.json` exists with strict, NodeNext, noEmit, isolatedModules, esModuleInterop, and skipLibCheck invariants. (standards-engineering.md)
- **TSC-3 [J] — Strictness is not weakened** — No repo loosens `strict` or the `noUnused*` and `noImplicit*` flags. (standards-engineering.md)
  - _Review prompt:_ Does the effective TypeScript configuration preserve the required strictness flags?

## BIO — Biome

→ [standard](standards-engineering.md)

The read-only code-quality gate and shared formatter/linter configuration.

- **BIO-1 [M] — Biome read-only gate passes** — `bunx @biomejs/biome check` exits clean. (standards-engineering.md)
- **BIO-2 [M] — Biome shared configuration** — `biome.json` exists and matches the shared formatter, JavaScript formatter, linter, and import-organisation field set. (standards-engineering.md)

## KNIP — Knip

→ [standard](standards-engineering.md)

The unused-code configuration and gate.

- **KNIP-1 [M] — Knip configuration exists** — `knip.json` exists with per-repo entry points and ignores. (standards-engineering.md)
- **KNIP-2 [M] — Knip gate passes** — `bunx knip` exits clean. (standards-engineering.md)

## SYNC — Dependency synchronisation

→ [standard](standards-engineering.md)

Declared dependency ranges are canonically ordered and aligned.

- **SYNC-1 [M] — Dependency synchronisation passes** — `bunx syncpack format --check` exits clean. (standards-engineering.md)

## DEPS — Dependency freshness

→ [standard](standards-engineering.md)

Available dependency updates are surfaced and deliberately applied.

- **DEPS-1 [M] — Dependencies are current** — `bun outdated` reports no available updates; available updates are reviewed through `ki repo conform`. (standards-engineering.md)

## GEN — Generated surfaces

→ [standard](standards-engineering.md)

Managed discovery surfaces carry consistent tool exclusions.

- **GEN-1 [M] — Managed discovery surfaces share exclusions** — Known generated or managed discovery surfaces have matching Biome, Knip, and Markdown exclusions, and no legacy `.ki` runtime exclusion remains. (standards-engineering.md)

## TEST — Tests

→ [standard](standards-engineering.md)

Runner-neutral tests and the conditional Vitest coverage profile.

- **TEST-1 [M] — Test capability and Vitest profile** — Test-capable repos expose bare `test`; a recognised root Vitest config requires the canonical test, coverage, and watch scripts, while no capability is not applicable. (standards-engineering.md)
- **TEST-2 [M] — Vitest coverage thresholds** — Under the Vitest profile, coverage thresholds are exactly 100% for lines, functions, branches, and statements. (standards-engineering.md)
- **TEST-3 [M] — Vitest test-source exclusion** — Under the Vitest profile, coverage excludes `src/**/*.test.ts`. (standards-engineering.md)
- **TEST-4 [M] — Vitest monorepo scoping** — Under the Vitest profile, workspace repos scope include, exclude, and reportsDirectory to the workspace rather than a flat root. (standards-engineering.md)
- **TEST-5 [M] — Vitest coverage command passes** — Under the Vitest profile, `bun run test:coverage` exits clean when the companion script exists. (standards-engineering.md)
- **TEST-6 [J] — Tests are colocated and genuinely complete** — Under the Vitest profile, tests are colocated with the source they cover and genuinely reach the 100% bar. (standards-engineering.md)
  - _Review prompt:_ Are tests colocated with their source and does their coverage evidence substantiate the 100% claim?

## BUILD — Compiled builds

→ [standard](standards-engineering.md)

The conditional compiled-TypeScript profile and CLI executable bit.

- **BUILD-1 [M] — Compiled-build shape** — `build` is `tsc -p tsconfig.build.json` (optionally with CLI chmod), `files` includes the scoped `dist`, and repos without compiled build are not applicable. (standards-engineering.md)
- **BUILD-2 [M] — Build TypeScript configuration** — `tsconfig.build.json` extends the base with the required emit, declaration, output, import, index-access, and test-exclusion settings. (standards-engineering.md)
- **BUILD-3 [M] — Compiled shared TypeScript base** — Compiled repos set the richer shared TypeScript base: es2024 target, verbatimModuleSyntax, and noUnusedLocals. (standards-engineering.md)
- **BUILD-4 [M] — CLI chmod iff rule** — `build` chmods `dist/cli/cli.js` iff `src/cli/` exists and chmods no other path. (standards-engineering.md)

## ENV — Environment configuration

→ [standard](standards-engineering.md)

Environment templates, development-mode confinement, and portable paths.

- **ENV-1 [M] — Environment example template** — Environment-capable repos commit an `.env*.example` template; no environment capability is not applicable. (standards-engineering.md)
- **ENV-2 [M] — Development NODE_ENV confinement** — `NODE_ENV=development` appears only in dev or inspect scripts, never start, build, or test. (standards-engineering.md)
- **ENV-3 [J] — Real environment files are protected** — Real non-example `.env.*` files are gitignored and the loader has the Node parity call. (standards-engineering.md)
  - _Review prompt:_ Are real environment files ignored and is the loader Node-parity-safe?
- **ENV-4 [J] — XDG paths are honoured** — Config, data, cache, and state paths honour the matching `$XDG_*` variable before falling back to the specification default. (standards-engineering.md)
  - _Review prompt:_ Do config, data, cache, and state paths honour the appropriate XDG environment variable?

## TOML — Engineering configuration

→ [standard](standards-engineering.md)

The repository selector and validate-down configuration boundary.

- **TOML-1 [M] — Engineering selector table** — A `[ki-engineering]` table is present. (standards-engineering.md)
- **TOML-2 [M] — Engineering configuration validates down** — Every key under `[ki-engineering]` is known to the checker; an unknown key is drift. (standards-engineering.md)
