<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands engineering standards

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-engineering --write`.

Line-by-line criteria for auditing ki-engineering. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
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

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## PKG — Package metadata

→ [standard](standards-engineering.md)

The shared package metadata and toolchain dependency surface.

- **PKG-1 [M] — Module package type** — `"type": "module"`. (standards-engineering.md)
  - _Remediation:_ automatic
- **PKG-2 [M] — Bun package-manager pin** — `"packageManager"` starts with `bun@` (pinned patch). (standards-engineering.md)
  - _Remediation:_ automatic
- **PKG-3 [M] — Node engine floor** — `"engines.node"` floor is `>= 22`. (standards-engineering.md)
  - _Remediation:_ automatic
- **PKG-4 [M] — Closed package coverage manifest** — Every top-level `package.json` key is in the engineering coverage manifest; an unknown key is drift. This is also the criterion for an unparseable `package.json`. (standards-engineering.md)
  - _Remediation:_ diagnostic — Correct the package manifest structure or declare the missing ownership before rerunning the audit.
- **PKG-5 [M] — Toolchain dependencies declared** — The toolchain devDependencies `@biomejs/biome`, `knip`, `rumdl`, `husky`, `lint-staged`, `syncpack`, and `typescript` are declared rather than implied. (standards-engineering.md)
  - _Remediation:_ automatic
- **PKG-6 [M] — Lint-staged fan-out** — `lint-staged` is present and fans out to Biome on staged code and `rumdl check --fix` on staged authored Markdown. (standards-engineering.md)
  - _Remediation:_ automatic

## MISE — Toolchain pins

→ [standard](standards-engineering.md)

The single root Node and Bun toolchain declaration.

- **MISE-1 [M] — Root toolchain pin** — A root `mise.toml` pins both `node` and `bun` under `[tools]`. (standards-engineering.md)
  - _Remediation:_ automatic
- **MISE-2 [M] — Bun pin drift pair** — The `mise.toml` Bun version equals the `packageManager` Bun version. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the declared toolchain pins and remove obsolete pin files, then rerun the audit.
- **MISE-3 [M] — No legacy tool pins** — No legacy `.node-version`, `.nvmrc`, or `.bun-version` file lingers beside `mise.toml`. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the declared toolchain pins and remove obsolete pin files, then rerun the audit.

## CI — Continuous integration

→ [standard](standards-engineering.md)

CI installs the declared toolchain and runs canonical repository gates.

- **CI-1 [M] — CI installs the declared toolchain** — Where `.github/workflows/ci.yml` exists, it uses `jdx/mise-action` and hardcodes no Bun or Node version. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the CI workflow with the declared toolchain and canonical repository gates, then rerun the audit.
- **CI-2 [M] — CI runs the canonical gates** — `ci.yml` runs `ki repo audit --repo .`, then `bun run test` when tests exist, and does not route governance through package scripts. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the CI workflow with the declared toolchain and canonical repository gates, then rerun the audit.

## SCR — Package scripts

→ [standard](standards-engineering.md)

The direct CLI boundary, lifecycle idioms, and clean cutover discipline.

- **SCR-1 [M] — KI script naming law** — Every script is a permitted bare lifecycle idiom or carries the `ki:` prefix; a bare non-idiom name is drift. (standards-engineering.md)
  - _Remediation:_ diagnostic — Revise the package scripts to meet the governed script surface, then rerun the audit.
- **SCR-2 [M] — Repository maintenance stays CLI-owned** — Package scripts do not invoke `ki repo audit`, `ki repo conform`, or `ki repo educate`, whether for the whole repository or a focused skill; repositories invoke the installed CLI directly. (standards-engineering.md)
  - _Remediation:_ automatic
- **SCR-3 [M] — Retired script families absent** — Every `ki:` script belongs to a declared owning capability and `ki:deps:update` is present; retired tool families and aggregate governance aliases are absent. (standards-engineering.md)
  - _Remediation:_ automatic
- **SCR-4 [M] — Per-skill wrapper aliases absent** — Package scripts contain no derived `ki:<skill>:<mode>` aliases and no command that invokes `.ki`, `govern.ts`, `educate.ts`, an adapter, or a vendored runtime. (standards-engineering.md)
  - _Remediation:_ automatic
- **SCR-5 [M] — Lifecycle clean and prepare scripts** — `clean` removes `node_modules` (and `dist` where built), and `prepare` is `husky`. (standards-engineering.md)
  - _Remediation:_ automatic
- **SCR-6 [M] — No test-entrypoint bypass** — Only the bare `test` script may use `bun test`; every other script uses `bun run test` to invoke the governed entrypoint. (standards-engineering.md)
  - _Remediation:_ diagnostic — Revise the package scripts to meet the governed script surface, then rerun the audit.
- **SCR-7 [M] — Runner-neutral test and build entrypoints** — Test-capable repos expose bare `test`; compiled repos expose bare `build`; repository governance remains outside package scripts. (standards-engineering.md)
  - _Remediation:_ diagnostic — Revise the package scripts to meet the governed script surface, then rerun the audit.
- **SCR-8 [J] — Repo-specific scripts retain clear ownership** — Repo-specific scripts beyond the governance surface are valid only when an owning skill governs them and they do not shadow a governed entrypoint. (standards-engineering.md)
  - _Evidence scope:_ Every repo-specific script outside the governed lifecycle and `ki:` surface.
  - _Review prompt:_ Do repo-specific scripts have a clear owner and avoid divergent shadows of governed entrypoints?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Assign the script to an owning capability, remove a divergent shadow, record a named Gap, or record an explicit exclusion.
- **SCR-9 [J] — Clean-end-state cutovers** — Repository-footprint replacements cut directly to the intended contract, remove the superseded implementation, and verify the result without compatibility code that exists only for an intermediate state. (standards-engineering.md)
  - _Evidence scope:_ Every current or recently completed repository-footprint replacement.
  - _Review prompt:_ Did the cutover reach and verify the correct clean end state without retaining transitional compatibility code?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Complete the clean cutover, record a named Gap with its owner, or record an explicit exclusion.

## BUN — Bun and Node runtime boundary

→ [standard](standards-engineering.md)

Environment loading remains equivalent when built output runs under Node.

- **BUN-1 [J] — Node environment-loading parity** — Where the repo loads `.env`, `loadConfig` (or equivalent) calls `process.loadEnvFile()` in a try/catch for Node parity. (standards-engineering.md)
  - _Evidence scope:_ Every repository configuration loader that reads `.env` files.
  - _Review prompt:_ Where `.env` is loaded, does the loader call `process.loadEnvFile()` safely?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Add the guarded Node parity call, record a named Gap, or record an explicit capability exclusion.

## TSC — TypeScript

→ [standard](standards-engineering.md)

The TypeScript gate and universal strict compiler invariants.

- **TSC-1 [M] — Type-check passes** — `tsc --noEmit` exits clean at the root, or each declared workspace has a clean `tsc --noEmit -p <workspace>/tsconfig.json`. (standards-engineering.md)
  - _Remediation:_ diagnostic — Resolve the reported TypeScript errors in the affected project, then rerun the type-check.
- **TSC-2 [M] — Universal TypeScript invariants** — `tsconfig.json` exists with strict, NodeNext, noEmit, isolatedModules, esModuleInterop, and skipLibCheck invariants. (standards-engineering.md)
  - _Remediation:_ automatic
- **TSC-3 [J] — Strictness is not weakened** — No repo loosens `strict` or the `noUnused*` and `noImplicit*` flags. (standards-engineering.md)
  - _Evidence scope:_ The effective root and workspace TypeScript configurations.
  - _Review prompt:_ Does the effective TypeScript configuration preserve the required strictness flags?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Restore the required strictness flags, record a named Gap, or record an explicit capability exclusion.

## BIO — Biome

→ [standard](standards-engineering.md)

The read-only code-quality gate and shared formatter/linter configuration.

- **BIO-1 [M + J] — Biome read-only gate passes** — `bunx @biomejs/biome check` exits clean. (standards-engineering.md)
  - _Remediation:_ guarded — Review the reported Biome findings and apply the appropriate source changes, then rerun the gate.
  - _Evidence scope:_ Every reported Biome finding and its proposed source change.
  - _Review prompt:_ Would the proposed formatting, lint, or unsafe correction preserve the intended behaviour and public surface?
  - _Outcomes:_ apply; manual-fix; exclusion
  - _Conforming guidance:_ Apply only a reviewed safe correction, make the intended manual fix, or record an explicit exclusion.
- **BIO-2 [M] — Biome shared configuration** — `biome.json` exists and matches the shared formatter, JavaScript formatter, linter, and import-organisation field set. (standards-engineering.md)
  - _Remediation:_ automatic

## KNIP — Knip

→ [standard](standards-engineering.md)

The unused-code configuration and gate.

- **KNIP-1 [M] — Knip configuration exists** — `knip.json` exists with per-repo entry points and ignores. (standards-engineering.md)
  - _Remediation:_ automatic
- **KNIP-2 [M + J] — Knip gate passes** — `bunx knip` exits clean. (standards-engineering.md)
  - _Remediation:_ guarded — Review each reported unused symbol or dependency and make the intended source or configuration change, then rerun Knip.
  - _Evidence scope:_ Every unused-code or dependency finding reported by Knip.
  - _Review prompt:_ Is each finding genuinely unused, or does it represent a runtime, generated, or public surface that needs configuration rather than deletion?
  - _Outcomes:_ remove; configure; exclusion
  - _Conforming guidance:_ Remove genuinely unused code, protect a valid surface in configuration, or record an explicit exclusion.
- **KNIP-3 [M] — Knip entry points cover every package export** — Every target in the `exports` map of `package.json` is reachable from at least one glob in the `entry` list of `knip.json`, mapping the built path back to its source (`./dist/X.js` and `./dist/X.d.ts` map to `src/X.ts`); `./package.json` is exempt. An unreachable published entrypoint is invisible to knip as a public surface, so the KNIP-2 repair deletes genuine public API. Audit only — which entry glob to add is a judgment call, so there is no conform action. (standards-engineering.md)
  - _Remediation:_ diagnostic — Add the intended source entry glob to `knip.json` so the published export is protected, then rerun the audit.

## SYNC — Dependency synchronisation

→ [standard](standards-engineering.md)

Declared dependency ranges are canonically ordered and aligned.

- **SYNC-1 [M] — Dependency synchronisation passes** — `bunx syncpack format --check` exits clean. (standards-engineering.md)
  - _Remediation:_ automatic

## DEPS — Dependency freshness

→ [standard](standards-engineering.md)

Available dependency updates are surfaced and deliberately applied.

- **DEPS-1 [M + J] — Dependencies are current** — `bun outdated` reports no available updates; available updates are reviewed through `ki repo conform`. (standards-engineering.md)
  - _Remediation:_ guarded — Review each available dependency update and apply the selected versions deliberately, then rerun the audit.
  - _Evidence scope:_ Every available dependency update and its release notes, compatibility impact, and lockfile change.
  - _Review prompt:_ Should each available update be adopted now without violating repository compatibility or release commitments?
  - _Outcomes:_ adopt; defer; exclusion
  - _Conforming guidance:_ Apply the approved update, record a deliberate deferral with its owner, or record an explicit exclusion.

## GEN — Generated surfaces

→ [standard](standards-engineering.md)

Managed discovery surfaces carry consistent tool exclusions.

- **GEN-1 [M] — Managed discovery surfaces share exclusions** — Known generated or managed discovery surfaces have matching Biome, Knip, and Markdown exclusions, and no legacy `.ki` runtime exclusion remains. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the generated-surface exclusions with the managed paths and remove the legacy runtime exclusion, then rerun the audit.

## TEST — Tests

→ [standard](standards-engineering.md)

Runner-neutral tests and the conditional Vitest coverage profile.

- **TEST-1 [M] — Test capability and Vitest profile** — Test-capable repos expose bare `test`; a recognised root Vitest config requires the canonical test, coverage, and watch scripts, while no capability is not applicable. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the test runner or Vitest coverage configuration with the declared test capability, then rerun the audit.
- **TEST-2 [M] — Vitest coverage thresholds** — Under the Vitest profile, coverage thresholds are exactly 100% for lines, functions, branches, and statements. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the test runner or Vitest coverage configuration with the declared test capability, then rerun the audit.
- **TEST-3 [M] — Vitest test-source exclusion** — Under the Vitest profile, coverage excludes `src/**/*.test.ts`. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the test runner or Vitest coverage configuration with the declared test capability, then rerun the audit.
- **TEST-4 [M] — Vitest monorepo scoping** — Under the Vitest profile, workspace repos scope include, exclude, and reportsDirectory to the workspace rather than a flat root. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the test runner or Vitest coverage configuration with the declared test capability, then rerun the audit.
- **TEST-5 [M] — Vitest coverage command passes** — Under the Vitest profile, `bun run test:coverage` exits clean when the companion script exists. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the test runner or Vitest coverage configuration with the declared test capability, then rerun the audit.
- **TEST-6 [J] — Tests are colocated and genuinely complete** — Under the Vitest profile, tests are colocated with the source they cover and genuinely reach the 100% bar. (standards-engineering.md)
  - _Evidence scope:_ The Vitest test files, covered source files, and coverage evidence.
  - _Review prompt:_ Are tests colocated with their source and does their coverage evidence substantiate the 100% claim?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Colocate or strengthen the tests, record a named Gap, or record an explicit capability exclusion.
- **TEST-7 [J] — Coverage follows observable contracts** — Coverage evidence starts from supported observable behaviour: reachable paths are proven through their public boundary, unreachable paths are removed, and fault injection stays at a documented interface boundary. (standards-engineering.md#testing-capability-the-repo-ships-tests)
  - _Evidence scope:_ The supported public contract, covered implementation paths, tests, and any documented interface-level fault injection.
  - _Review prompt:_ Does each reachable path have evidence through the nearest supported public boundary, with unsupported paths removed rather than preserved for coverage, and is any fault injection a documented interface failure that cannot be exercised deterministically through that boundary?
  - _Outcomes:_ conforming; gap; exception
  - _Conforming guidance:_ Add or strengthen an observable-contract case, remove unsupported unreachable code, or document why a necessary interface-level fault injection cannot be exercised through the ordinary public entrypoint.

## BUILD — Compiled builds

→ [standard](standards-engineering.md)

The conditional compiled-TypeScript profile and CLI executable bit.

- **BUILD-1 [M] — Compiled-build shape** — `build` is `tsc -p tsconfig.build.json` (optionally with CLI chmod), `files` includes the scoped `dist`, and repos without compiled build are not applicable. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the compiled-build configuration and package surface with the declared build capability, then rerun the audit.
- **BUILD-2 [M] — Build TypeScript configuration** — `tsconfig.build.json` extends the base with the required emit, declaration, output, import, index-access, and test-exclusion settings. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the compiled-build configuration and package surface with the declared build capability, then rerun the audit.
- **BUILD-3 [M] — Compiled shared TypeScript base** — Compiled repos set the richer shared TypeScript base: es2024 target, verbatimModuleSyntax, and noUnusedLocals. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the compiled-build configuration and package surface with the declared build capability, then rerun the audit.
- **BUILD-4 [M] — CLI chmod iff rule** — `build` chmods `dist/cli/cli.js` iff `src/cli/` exists and chmods no other path. (standards-engineering.md)
  - _Remediation:_ diagnostic — Align the compiled-build configuration and package surface with the declared build capability, then rerun the audit.

## ENV — Environment configuration

→ [standard](standards-engineering.md)

Environment templates, development-mode confinement, and portable paths.

- **ENV-1 [M] — Environment example template** — Environment-capable repos commit an `.env*.example` template; no environment capability is not applicable. (standards-engineering.md)
  - _Remediation:_ diagnostic — Add an appropriately redacted environment example template for the declared capability, then rerun the audit.
- **ENV-2 [M] — Development NODE_ENV confinement** — `NODE_ENV=development` appears only in dev or inspect scripts, never start, build, or test. (standards-engineering.md)
  - _Remediation:_ diagnostic — Confine `NODE_ENV=development` to development or inspection scripts, then rerun the audit.
- **ENV-3 [J] — Real environment files are protected** — Real non-example `.env.*` files are gitignored and the loader has the Node parity call. (standards-engineering.md)
  - _Evidence scope:_ Real environment files and every loader that reads them.
  - _Review prompt:_ Are real environment files ignored and is the loader Node-parity-safe?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Protect the files and loader, record a named Gap, or record an explicit capability exclusion.
- **ENV-4 [J] — XDG paths are honoured** — Config, data, cache, and state paths honour the matching `$XDG_*` variable before falling back to the specification default. (standards-engineering.md)
  - _Evidence scope:_ All repository-owned config, data, cache, and state path resolution.
  - _Review prompt:_ Do config, data, cache, and state paths honour the appropriate XDG environment variable?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Use the matching XDG variable before its specification default, record a named Gap, or record an explicit exclusion.

## TOML — Engineering configuration

→ [standard](standards-engineering.md)

The repository selector and validate-down configuration boundary.

- **TOML-1 [M] — Engineering selector table** — A `[skills.ki-engineering]` table is present. (standards-engineering.md)
  - _Remediation:_ automatic
- **TOML-2 [M] — Engineering configuration validates down** — Every key under `[skills.ki-engineering]` is known to the checker; an unknown key is drift. (standards-engineering.md)
  - _Remediation:_ diagnostic — Remove or correct the unknown engineering configuration key, then rerun the audit.
