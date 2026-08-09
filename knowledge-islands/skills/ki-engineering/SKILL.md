---
name: ki-engineering
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
owns: [mise.toml, tsconfig.json, biome.json, knip.json]
contributes: ['.ki-config.toml', package.json]
description: >
  Use to audit our engineering standards, conform or scaffold a repo's toolchain, or check native audit wiring, tsconfig, or Biome consistency. Owns the shared build/lint/test layer every Knowledge Islands TypeScript/Bun repo conforms to — the twin of `ki-authoring`. Covers the closed `package.json` key-set (toolchain fields here; identity/metadata content in `ki-repo`), the `mise.toml` toolchain pin, direct `ki repo` maintenance, direct code-tool execution, clean-end-state cutovers, the Bun-install/Node-run split, runner-neutral test entrypoint, conditional `vitest` shape with 100% coverage, and the build/cli-chmod rule. Triggers: "audit our engineering standards", "do the repos' scripts match", "why are audit/conform scripts inconsistent". For GitHub settings, security, and the `.ki-config.toml` contract use `ki-repo`; for Markdown/TOML style use `ki-authoring`; for MCP server code use `ki-repo-mcp`.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands engineering standard

You are applying the **Knowledge Islands engineering standard** — the shared software-engineering toolchain every TypeScript/Bun repo in this work builds on. It is the build/test twin of `ki-authoring`: that skill owns _how we write_ (Markdown/TOML style); this one owns _how we build, lint, and test_. `ki-skills` owns the governance-skill enforcement framework that this skill follows.

This is a **standard, base-agnostic Process skill**. It hard-codes no single repo; it applies to any repo carrying a `[skills.ki-engineering]` table in its `.ki-config.toml` (today the 10 TS/Bun repos under `knowledgeislands/` — the seven `mcp-*` servers plus `ki-agentic-harness`, `ki-arcadia-principal`, `ki-repo-website`). How it sits alongside the other skills, and where it must not overlap them, is documented once in the ki-agentic-harness `README.md`.

## What this skill owns

1. **The common toolchain** — the baseline every TS/Bun repo meets, plus capability conditionals that fire only when a repo opts into a capability. The full, quotable standard is [the engineering standard](references/standards-engineering.md); the line-by-line items are in [the rubric](references/rubric.md).
2. **The governance-skill rubric model** — the shared mechanism for turning any standard into structured criteria, focused evidence, phased audit and conform execution, and canonical checker responses. It is owned by `ki-skills` in [the rubric-authoring standard](../../keystone/ki-skills/references/standards-rubric-authoring.md); this skill conforms to it.

**Artifact-specific rules are not here.** Anything meaningful only for one artifact type (an MCP's `bin`, `ki:server:mcp:*` scripts, coverage-exclude list, tool surface) lives in that artifact's skill. A repo is fully audited by running this coverage-detected standard alongside its declared artifact standard — see below.

## The common standard at a glance

- **package.json** — `type:module`, `packageManager:bun@1.3.x`, `engines.node>=22`; no aggregate or derived governance aliases; plus `clean` + `prepare`. `ki repo` invokes the declared native rubrics directly. Code tools run inside `ki-engineering`; Markdown tools run inside `ki-authoring`. Extra repo-specific scripts are fine when an owning skill governs them.
- **Bun vs Node** — install/dev under Bun, `dist/` runs under Node ≥ 22. The bare `test` script may select Bun's runner, but **no other package script may contain `bun test`**: outside the governed entrypoint it bypasses that policy, so use `bun run test`. `NODE_ENV=development` only in dev/inspect scripts; the config loader calls `process.loadEnvFile()` in a try/catch for parity.
- **tsconfig / biome** — the universal `tsconfig.json` invariants (strict, nodenext, noEmit, …) for every repo; the fuller shared base for compiled-TS repos. `biome.json` matching the shared formatter/linter fields.
- **Capability conditionals** — tests ⇒ a bare `test` entrypoint using the repo's chosen runner; `vitest.config.*` ⇒ the canonical Vitest scripts + 100% coverage, justified through supported observable contracts rather than implementation-only seams; compiled build ⇒ `build`/`tsconfig.build.json`/`files` + the **cli-chmod rule** (`build` chmods `dist/cli/cli.js` iff `src/cli/`, and never a server bin); env ⇒ `.env*.example` + `NODE_ENV`-in-dev.

## Layering — how a repo gets fully audited

The checker is the **common layer**; each independently applicable artifact skill audits its own delta. The unscoped host runs all declared layers in a stable dependency-respecting order:

```text
ki repo audit
  ├── ki-engineering  → common toolchain layer
  └── ki-repo-mcp          → MCP delta when declared
```

A repo is "clean" only when **every applicable** skill's audit passes. The `.ki-config.toml` tables are the selector: `[skills.ki-engineering]` marks the common layer; the artifact skill applies by its own convention.

## Operating modes

The installed CLI exposes the repository modes directly: `ki repo educate`, `ki repo audit`, and `ki repo conform`. It resolves the skills declared by the repository, imports each canonical `scripts/rubric/items/index.ts` catalogue, and owns execution, reporting, and transactional repairs. REFRESH remains a maintainer operation over this skill's own sources.

### Mode HELP — describe the engineering boundary

Explain the common TypeScript/Bun toolchain, the direct `ki repo` workflow, the supported modes, and the off-ramps to `ki-authoring`, `ki-repo`, and artifact-specific skills, then stop without inspecting or changing a repository.

### Mode AUDIT — check a repo's common toolchain

1. Run `ki repo audit --skill ki-engineering` for the focused mechanical pass, or `ki repo audit` for the repository's complete declared set. The native host loads [the canonical item catalogue](scripts/rubric/items/index.ts), runs its code-tool checks, checks the script and CI surface, the `bun test` trap, `tsconfig`/`biome`, capability conditionals, and the `[skills.ki-engineering]` table, then reports findings with rubric codes.
2. **Apply the judgment items** in [the rubric](references/rubric.md): no per-repo loosening of `strict`/the `noImplicit*` family, the Node `.env` parity call where env is loaded, Vitest-configured source tests actually reaching the 100% bar, and repo-specific scripts not shadowing governed entrypoints.
3. Ensure the artifact skill is declared in `.ki-config.toml`; the unscoped `ki repo audit` runs every declared layer. Report by location → criterion → fix, grouped by severity (FAIL first).

### Mode CONFORM — bring a repo's toolchain into line

1. Run **AUDIT** first, so you change against a known gap list.
2. Run `ki repo conform --skill ki-engineering`; the host applies the catalogue's bounded writes and commands transactionally. Resolve judgment-only gaps manually, copying repo-specific shapes from the closest healthy sibling rather than inventing.
3. Re-run `ki repo audit`; the full declared set must be clean.

### Mode EDUCATE — scaffold a new TS/Bun repo's toolchain

Run `ki repo educate --skill ki-engineering` to inspect the complete criterion catalogue without executing checks or writing. When establishing a new TypeScript/Bun repository, declare `[skills.ki-engineering]`, run focused CONFORM for safe scaffolding, make repo-shaped decisions for compiled build and test configuration, then run the complete repository AUDIT.

### Mode REFRESH — re-anchor the toolchain pins to their sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-repo-kb`'s IMPROVE mode instead.

The standard pins volatile versions (Bun, Node, Biome, TypeScript, vitest, syncpack, rumdl). Run on its declared cadence (see `references/sources.md`), or when asked "are the engineering standards current".

1. **Read [the source list](references/sources.md)** — each pin with its `last reviewed` date.
2. **Re-fetch each** (WebFetch / WebSearch) and diff against the standard, rubric, and [canonical item catalogue](scripts/rubric/items/index.ts): a bumped Bun or Biome line, a TypeScript option deprecation, a changed default.
3. **Propose a diff**; confirm before writing.
4. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and the `## Last review` block. What changed goes in the commit.

## Boundaries (out of scope, with their homes)

Reciprocal off-ramps — each names this skill back for the engineering layer:

- **A repo's GitHub settings, security, the universal local files (README/LICENSE/.gitignore), and the `.ki-config.toml` _contract_** → `ki-repo`. This skill owns the _engineering_ toolchain inside the repo; `ki-repo` owns the repo's _configuration_ and its `.ki-config.toml` contract (this skill only contributes its own table within it).
- **`.rumdl.toml` and `.editorconfig`** → `ki-authoring`. rumdl backs that skill's own Markdown audit and conform passes, so it owns both files wholly (scaffold, hash-drift check, unconditional overwrite on drift) — this skill no longer scaffolds or content-checks either.
- **Markdown / TOML _formatting_ style** (including what the authoring conform pass produces) → `ki-authoring`. Engineering owns the declared tool dependencies; authoring owns their Markdown execution and the prose/format conventions they enforce.
- **Artifact-specific code and deltas** — MCP `src/` layout, tool naming, the access gate, security invariants, the coverage-exclude list → `ki-repo-mcp` (and future artifact skills). They build on this common layer and add their own.
