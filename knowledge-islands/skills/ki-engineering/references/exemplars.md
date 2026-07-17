# Engineering Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns from the KI sibling repos that illustrate what the engineering standard looks like in practice. Use these as pattern references when configuring a new repo or auditing an existing one — the goal is to show the standard not as abstract rules but as concrete file contents. The `mcp-*` repos are the primary exemplar set for the compiled-TS profile; `ki-agentic-harness` is the primary exemplar for the scripts-only (no `src/`, no `vitest.config`) profile.

For the full upstream pin list and in-house sources, see [sources.md](sources.md).

## Collections

| Source                        | URL                               | What it covers                                             |
| ----------------------------- | --------------------------------- | ---------------------------------------------------------- |
| mcp-gsuite                    | [github][mcp-gsuite]              | Canonical flat-repo compiled-TS profile with env config    |
| mcp-kb-fs                     | [github][mcp-kb-fs]               | Canonical flat-repo compiled-TS profile, no CLI binary     |
| ki-agentic-harness            | [github][harness]                 | Scripts-only profile; runner-neutral standalone self-tests |
| Biome configuration reference | [biomejs.dev][biome-config]       | The schema the `$schema` pin tracks                        |
| TypeScript compiler options   | [typescriptlang.org][ts-tsconfig] | The invariants and the compiled-TS profile options         |

## Selected patterns

### Canonical `biome.json`

All 10 KI TS/Bun repos carry this config verbatim. The `$schema` pins the Biome version — when the house upgrades Biome, bump this value and the matching devDependency together. `vcs.useIgnoreFile: true` means `.gitignore` is the single ignore source; no separate Biome ignore file is needed. `lineWidth: 140` matches `.prettierrc.json` so Biome-formatted code and Prettier-formatted Markdown use the same column budget. `noExplicitAny: off` is the deliberate house divergence from the recommended preset — KI TypeScript uses `any` sparingly but does not ban it.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.3/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["src/**", "*.ts", "*.json"], "ignoreUnknown": true },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 140 },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "asNeeded", "trailingCommas": "none" }
  },
  "linter": {
    "enabled": true,
    "rules": { "preset": "recommended", "suspicious": { "noExplicitAny": "off" } }
  },
  "assist": { "enabled": true, "actions": { "source": { "organizeImports": "on" } } }
}
```

### `tsconfig.json` — compiled-TS profile (the `mcp-*` base)

Used by every `mcp-*` repo. The universal invariants (`strict`, `nodenext`, `noEmit`, `isolatedModules`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`) must hold in every KI repo, including those that do not compile. The additional fields (`target es2024`, `moduleDetection: force`, `types: ["node"]`, full `noUnused*` / `noImplicit*`) form the compiled-TS profile shared across all repos that ship a `dist/`. A repository that selects Vitest by carrying `vitest.config.*` adds `vitest/globals` to `types`. A `tsconfig.build.json` that extends this adds `noEmit: false`, `outDir: ./dist`, and `rootDir: ./src` — the `include`/`exclude` on the base already match.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "es2024",
    "lib": ["es2024"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "moduleDetection": "force",
    "types": ["node"],
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Aggregate/scoped entrypoints and the conditional Vitest profile

Every governed repo exposes aggregate `ki:audit`/`ki:conform`; vendoring derives the skill-scoped audit/conform entrypoints. The engineering modes run Biome, TypeScript, syncpack, and knip internally, while `ki-authoring` owns the Markdown tool pass. The critical trap is the literal command `bun test`: it bypasses the governed package script and invokes Bun's own runner. Use `bun run test`; a Vitest-configured repo maps that idiom to `vitest run`, while another profile may map it to a different whole-suite command.

```jsonc
{
  "scripts": {
    "ki:audit": "bun .ki-meta/bin/aggregate.ts audit",
    "ki:conform": "bun .ki-meta/bin/aggregate.ts conform",
    "ki:engineering:audit": "bun .ki-meta/skills/ki-engineering/audit.ts .",
    "ki:engineering:conform": "bun .ki-meta/skills/ki-engineering/conform.ts .",
    "ki:authoring:audit": "bun .ki-meta/skills/ki-authoring/audit.ts .",
    "ki:authoring:conform": "bun .ki-meta/skills/ki-authoring/conform.ts .",
    "clean": "rm -rf {dist,node_modules}",
    "prepare": "husky",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

The three Vitest scripts above apply only when the repository carries `vitest.config.*`. A runner-neutral repository keeps the same aggregate/scoped entrypoints and supplies only its appropriate bare `test` script.

The harness's [actual package manifest](../../../../package.json) uses the same bare idiom without a Vitest configuration; each standalone test program remains explicit and the complete entry chains the whole suite. An abbreviated shape:

```jsonc
{
  "scripts": {
    "test": "bun hooks/plan-stamp.test.ts && bun hooks/plan-sync.test.ts && bun skills/keystone/ki-bootstrap/scripts/resolve.test.ts"
  }
}
```

This runner-neutral profile does not opt into `test:coverage`, `test:watch`, or the Vitest threshold checks. It still must not contain the literal `bun test`.

### Monorepo: workspace-scoped vitest coverage (§0, §6)

In a `workspaces` repo (`"workspaces": ["site", "ingress"]`) the flat `src/**` globs and root `coverage/` become **workspace-relative** — artifacts sit under the workspace that owns them, never the repo root. The 100%-threshold rule is unchanged; only the paths move.

```ts
// vitest.config.ts (monorepo — tests + coverage scoped to the site/ workspace)
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['site/scripts/**/*.test.ts'], // under the workspace, not src/**
    coverage: {
      provider: 'v8',
      reportsDirectory: 'site/coverage', // gitignored as /site/coverage, not root /coverage
      include: ['site/scripts/seed-model.ts', 'site/scripts/body-regen.ts'],
      exclude: ['site/scripts/**/*.test.ts'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 }
    }
  }
})
```

### Minimal `[ki-engineering]` table in `.ki-config.toml`

The table is a conformance marker — its presence declares "the engineering standard applies here". It carries no top-level keys because capabilities (tests, compiled build, env config) are auto-detected from repo markers (`vitest.config.*`, `tsconfig.build.json`, `.env*.example`). The only allowed sub-structure is a `[ki-engineering.checks]` table for deliberate waivers. A repo that fully conforms writes the table header and nothing else.

```toml
[ki-engineering]
# This repo fully conforms. Capabilities (tests, compiled build, env config) are auto-detected
# from repo markers — no profile key is needed here.
# To waive a specific check, add:
# [ki-engineering.checks]
# <check-id> = false  # reason: …
```

[mcp-gsuite]: https://github.com/knowledgeislands/mcp-gsuite
[mcp-kb-fs]: https://github.com/knowledgeislands/mcp-kb-fs
[harness]: https://github.com/knowledgeislands/ki-agentic-harness
[biome-config]: https://biomejs.dev/reference/configuration/
[ts-tsconfig]: https://www.typescriptlang.org/tsconfig
