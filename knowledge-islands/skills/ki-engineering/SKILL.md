---
name: ki-engineering
implies: []
vendors: [educate, audit, conform, help]
owns: [mise.toml, tsconfig.json, biome.json, knip.json]
contributes: ['.ki-config.toml', package.json]
description: >
  Use to audit our engineering standards, conform or scaffold a repo's toolchain, or check audit wiring, tsconfig, or Biome consistency. Owns the shared build/lint/test layer every Knowledge Islands TypeScript/Bun repo conforms to — the twin of `ki-authoring`. Covers the closed `package.json` key-set (toolchain fields here; identity/metadata content in `ki-repo`), the `mise.toml` toolchain pin, aggregate `ki:audit`/`ki:conform` plus derived skill-scoped modes, direct code-tool execution, the Bun-install/Node-run split, runner-neutral test entrypoint, conditional `vitest` shape with 100% coverage, and the build/cli-chmod rule — plus the enforcement framework the governance skills follow. Triggers: "audit our engineering standards", "do the repos' scripts match", "why are audit/conform scripts inconsistent". For GitHub settings, security, and the `.ki-config.toml` contract use `ki-repo`; for Markdown/TOML style use `ki-authoring`; for MCP server code use `ki-mcp`.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands engineering standard

You are applying the **Knowledge Islands engineering standard** — the shared software-engineering toolchain every TypeScript/Bun repo in this work builds on, and the **enforcement framework** every governance skill uses to define and check its own standard. It is the build/test twin of `ki-authoring`: that skill owns _how we write_ (Markdown/TOML style); this one owns _how we build, lint, and test_, and _how a standard is enforced_.

This is a **standard, base-agnostic Process skill**. It hard-codes no single repo; it applies to any repo carrying a `[ki-engineering]` table in its `.ki-config.toml` (today the 10 TS/Bun repos under `knowledgeislands/` — the seven `mcp-*` servers plus `ki-agentic-harness`, `ki-arcadia-principal`, `ki-website`). How it sits alongside the other skills, and where it must not overlap them, is documented once in the ki-agentic-harness `README.md`.

## What this skill owns

1. **The common toolchain** — the baseline every TS/Bun repo meets, plus capability conditionals that fire only when a repo opts into a capability. The full, quotable standard is [the engineering standard](references/engineering-standard.md); the line-by-line items are in [the rubric](references/audit-rubric.md).
2. **The enforcement framework** — the shared mechanism for defining and checking _any_ standard (the mode shape, the mechanical-checker contract, the mechanical/judgment rubric tagging, the `sources.md` cadence, the `.ki-config.toml` validate-down contract). It lives in [the enforcement framework](references/enforcement-framework.md); the other governance skills conform to it.

**Artifact-specific rules are not here.** Anything meaningful only for one artifact type (an MCP's `bin`, `ki:server:mcp:*` scripts, coverage-exclude list, tool surface) lives in that artifact's skill. A repo is fully audited by **composing** this skill's checker with the artifact skill's — see below.

## The common standard at a glance

- **package.json** — `type:module`, `packageManager:bun@1.3.x`, `engines.node>=22`; aggregate `ki:audit`/`ki:conform`, derived skill-scoped audit/conform entrypoints, plus `clean` + `prepare`. Code tools run directly inside `ki-engineering`; Markdown tools run inside `ki-authoring`. Extra repo-specific scripts are fine when an owning skill governs them.
- **Bun vs Node** — install/dev under Bun, `dist/` runs under Node ≥ 22. **No package script value contains the literal `bun test` command**: it bypasses the governed package script and invokes Bun's runner; use `bun run test`. `NODE_ENV=development` only in dev/inspect scripts; the config loader calls `process.loadEnvFile()` in a try/catch for parity.
- **tsconfig / biome** — the universal `tsconfig.json` invariants (strict, nodenext, noEmit, …) for every repo; the fuller shared base for compiled-TS repos. `biome.json` matching the shared formatter/linter fields.
- **Capability conditionals** — tests ⇒ a bare `test` entrypoint using the repo's chosen runner; `vitest.config.*` ⇒ the canonical Vitest scripts + 100% coverage; compiled build ⇒ `build`/`tsconfig.build.json`/`files` + the **cli-chmod rule** (`build` chmods `dist/cli/cli.js` iff `src/cli/`, and never a server bin); env ⇒ `.env*.example` + `NODE_ENV`-in-dev.

## Composition — how a repo gets fully audited

The checker is the **common layer**; each artifact skill audits its own delta. They compose by being **run in sequence**, never by importing each other (so each stays valid when symlinked standalone):

```text
ki:engineering:audit <repo>     →  common toolchain layer (this skill, all 10 TS repos)
  then audit.ts <repo>   →  MCP delta (ki-mcp, the 7 mcp-* repos)
```

A repo is "clean" only when **every applicable** skill's audit passes. The `.ki-config.toml` tables are the selector: `[ki-engineering]` marks the common layer; the artifact skill applies by its own convention.

## Operating modes

Carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** — EDUCATE scaffolds a new TS repo's toolchain. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows. The mode shape itself is defined in [the enforcement framework](references/enforcement-framework.md).

### Mode AUDIT — check a repo's common toolchain

1. **Run the mechanical checker**: `bun <skill>/scripts/audit.ts <repo>` (or `node` after a build). It reports the package.json metadata + aggregate/scoped script surface, runs the code-tool checks, checks the `bun test` trap, `tsconfig`/`biome`, and capability conditionals (tests / compiled build + cli-chmod / env), and validates-down the `[ki-engineering]` table. It grades findings on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / NA / PASS — see [checker-contract.md](references/checker-contract.md)) and exits non-zero on any FAIL; with `--report` it writes its latest report to the target's `.ki-meta/audits/engineering.{md,json}`. Capture its output; don't re-derive the mechanical items.
2. **Apply the judgment items** in [the rubric](references/audit-rubric.md): no per-repo loosening of `strict`/the `noImplicit*` family, the Node `.env` parity call where env is loaded, Vitest-configured source tests actually reaching the 100% bar, and repo-specific scripts not shadowing governed entrypoints.
3. **Name the artifact-skill audit that must also run** for the repo to be fully clean (e.g. `audit.ts` for an MCP repo), and **report** by location → criterion → fix, grouped by severity-ladder level (FAIL first).

### Mode CONFORM — bring a repo's toolchain into line

1. Run **AUDIT** first, so you change against a known gap list.
2. Fix the gaps in place — restore the aggregate and derived skill-scoped audit/conform surface, the `tsconfig`/`biome` shape, the runner-neutral bare `test` entrypoint and (where configured) the canonical Vitest shape, plus the build/cli-chmod rule — **copying from the closest healthy sibling** rather than inventing. Add the `[ki-engineering]` table if missing.
3. Re-run `bun run ki:engineering:audit`; for Markdown changes also run `bun run ki:authoring:audit`.

### Mode EDUCATE — scaffold a new TS/Bun repo's toolchain

Copy the aggregate/scoped `package.json` entrypoints, `tsconfig.json`/`biome.json` (plus `tsconfig.build.json` when it compiles, and `vitest.config.ts` only when selecting Vitest), and the `[ki-engineering]` table from the closest healthy sibling; adapt only names/paths. Then run the checker.

### Mode REFRESH — re-anchor the toolchain pins to their sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

The standard pins volatile versions (Bun, Node, Biome, TypeScript, vitest, syncpack, markdownlint). Run on its declared cadence (see `references/sources.md`), or when asked "are the engineering standards current".

1. **Read [the source list](references/sources.md)** — each pin with its `last reviewed` date.
2. **Re-fetch each** (WebFetch / WebSearch) and diff against the standard + rubric + [`scripts/audit.ts`](scripts/audit.ts): a bumped Bun or Biome line, a TypeScript option deprecation, a changed default.
3. **Propose a diff**; confirm before writing.
4. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and the `## Last review` block. What changed goes in the commit.

## Boundaries (out of scope, with their homes)

Reciprocal off-ramps — each names this skill back for the engineering layer:

- **A repo's GitHub settings, security, the universal local files (README/LICENSE/.gitignore), and the `.ki-config.toml` _contract_** → `ki-repo`. This skill owns the _engineering_ toolchain inside the repo; `ki-repo` owns the repo's _configuration_ and its `.ki-config.toml` contract (this skill only contributes its own table within it).
- **`.prettierrc.json` and `.editorconfig`** → `ki-authoring`. Prettier backs that skill's own Markdown conform pass, so it owns both files wholly (scaffold, hash-drift check, unconditional overwrite on drift) — this skill no longer scaffolds or content-checks either.
- **Markdown / TOML _formatting_ style** (including what the authoring conform pass produces) → `ki-authoring`. Engineering owns the declared tool dependencies; authoring owns their Markdown execution and the prose/format conventions they enforce.
- **Artifact-specific code and deltas** — MCP `src/` layout, tool naming, the access gate, security invariants, the coverage-exclude list → `ki-mcp` (and future artifact skills). They build on this common layer and add their own.
