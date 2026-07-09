# Engineering Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns from the KI sibling repos that illustrate what the engineering standard looks like in practice. Use these as pattern references when configuring a new repo or auditing an existing one — the goal is to show the standard not as abstract rules but as concrete file contents. The `mcp-*` repos are the primary exemplar set for the compiled-TS profile; `ki-agentic-harness` is the primary exemplar for the scripts-only (no `src/`, no `vitest.config`) profile.

For the full upstream pin list and in-house sources, see [sources.md](sources.md).

## Collections

| Source                        | URL                               | What it covers                                               |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------ |
| mcp-gsuite                    | [github][mcp-gsuite]              | Canonical flat-repo compiled-TS profile with env config      |
| mcp-kb-fs                     | [github][mcp-kb-fs]               | Canonical flat-repo compiled-TS profile, no CLI binary       |
| ki-agentic-harness            | [github][harness]                 | Scripts-only profile (no `src/`, no tests); the harness repo |
| Biome configuration reference | [biomejs.dev][biome-config]       | The schema the `$schema` pin tracks                          |
| TypeScript compiler options   | [typescriptlang.org][ts-tsconfig] | The invariants and the compiled-TS profile options           |

## Selected patterns

### Canonical `biome.json`

All 10 KI TS/Bun repos carry this config verbatim. The `$schema` pins the Biome version — when the house upgrades Biome, bump this value and the matching devDependency together. `vcs.useIgnoreFile: true` means `.gitignore` is the single ignore source; no separate Biome ignore file is needed. `lineWidth: 140` matches `.prettierrc.json` so Biome-formatted code and Prettier-formatted Markdown use the same column budget. `noExplicitAny: off` is the deliberate house divergence from the recommended preset — KI TypeScript uses `any` sparingly but does not ban it.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.2/schema.json",
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

Used by every `mcp-*` repo. The universal invariants (`strict`, `nodenext`, `noEmit`, `isolatedModules`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`) must hold in every KI repo, including those that do not compile. The additional fields (`target es2024`, `moduleDetection: force`, `types: ["node", "vitest/globals"]`, full `noUnused*` / `noImplicit*`) form the compiled-TS profile shared across all repos that ship a `dist/`. A `tsconfig.build.json` that extends this adds `noEmit: false`, `outDir: ./dist`, and `rootDir: ./src` — the `include`/`exclude` on the base already match.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "es2024",
    "lib": ["es2024"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "moduleDetection": "force",
    "types": ["node", "vitest/globals"],
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

### Required script families in `package.json`

The two families (`ki:lint:*` and `ki:deps:*`) are byte-identical across all 10 repos — the checker exact-matches them. Extras (`ki:skills:*`, `ki:repo:audit`, `ki:engineering:audit`, repo-specific dev scripts) are never drift. The critical trap: the test script is `vitest run`, never `bun test` — `bun test` silently invokes Bun's own runner. Note that `ki:lint:md` is the local-fix variant (writes) and `ki:lint:md:check` is what CI runs (`--check` exits non-zero on violations without writing).

```jsonc
{
  "scripts": {
    "ki:lint:check": "bunx @biomejs/biome check",
    "ki:lint:fix": "bunx @biomejs/biome check --write --unsafe",
    "ki:lint:format": "bunx @biomejs/biome format --write",
    "ki:lint:md": "bunx prettier --write \"**/*.md\" --ignore-path .gitignore && bunx markdownlint-cli2",
    "ki:lint:md:check": "bunx prettier --check \"**/*.md\" --ignore-path .gitignore && bunx markdownlint-cli2",
    "ki:lint:package": "bunx syncpack format",
    "ki:lint:types": "tsc --noEmit",
    "ki:deps:check": "bunx knip --dependencies --no-config-hints",
    "ki:deps:fix": "bunx knip --dependencies --fix --no-config-hints",
    "ki:deps:refresh": "bun update --force",
    "ki:deps:update": "bun update --latest && bun install",
    "ki:knip": "bunx knip --no-config-hints",
    "clean": "rm -rf {dist,node_modules}",
    "prepare": "husky",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

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
