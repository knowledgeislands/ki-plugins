# Plugin-marketplace standard

The quotable standard for a Knowledge Islands **plugin-marketplace repo** — a generated Claude plugin marketplace that projects the harness's skills and agents onto the Claude Cowork surface. The reference instance is `knowledgeislands/ki-plugins`. The [SKILL.md](../SKILL.md) is the operating procedure and carries the canonical shape; this file is the standard it audits against.

## Contents

- [The projection model](#the-projection-model)
- [Repository layout](#repository-layout)
- [The marketplace manifest](#the-marketplace-manifest)
- [The plugin manifest](#the-plugin-manifest)
- [Projected skills and agents](#projected-skills-and-agents)
- [MCP deferred](#mcp-deferred)
- [The repo scaffold](#the-repo-scaffold)
- [Boundary with ki-binding](#boundary-with-ki-binding)

## The projection model

The marketplace repo is a **lossy, per-surface projection** of the `ki-agentic-harness` (`ADR-KI-HARNESS-005`). The harness `skills/` and `agents/governance/` are the single source of truth. The marketplace is **generated** from them by `ki-binding`'s `bun run ki:binding:build-plugin <repo>` and is **never hand-maintained** — re-running the generator reproduces `.claude-plugin/` and `knowledge-islands/` byte-for-byte. Content changes are made at the harness source and then regenerated; the repo scaffold (below) is the repo's own and is left untouched by regeneration.

## Repository layout

```text
ki-plugins/
├── .claude-plugin/
│   └── marketplace.json              # marketplace manifest — exactly one plugin entry
├── knowledge-islands/                # the single plugin — the projection
│   ├── .claude-plugin/plugin.json    # plugin manifest
│   ├── skills/<name>/                # each harness skill, copied verbatim
│   └── agents/<name>.md              # governance agents, flattened
├── .ki-config.toml                   # declares [ki-plugins] (+ [ki-repo])
├── CLAUDE.md  README.md  LICENSE  .gitignore  .editorconfig
```

## The marketplace manifest

`.claude-plugin/marketplace.json` — a single JSON object, 2-space-indented with a trailing newline:

- `name` — the marketplace name (`ki-plugins`).
- `owner.name` — `Knowledge Islands`.
- `plugins` — an array of **exactly one** entry: `{ name, source, description }`, where `source` is `./<name>` and that directory exists on disk.

## The plugin manifest

`<plugin>/.claude-plugin/plugin.json` — same JSON formatting:

- `name` — equals the plugin dir (`knowledge-islands`) and the marketplace entry's `name`.
- `version` — tracks the harness `package.json` version at generation time (semver).
- `description` — matches the marketplace entry's description.
- `author.name` — `Knowledge Islands`.

## Projected skills and agents

- `<plugin>/skills/<name>/` — every harness skill dir that carries a `SKILL.md`, copied **verbatim** (including `references/` and `scripts/`).
- `<plugin>/agents/<name>.md` — the harness `agents/governance/*.md`, **flattened** (the `governance/` layer is dropped). No subdirectories.

A projected set that lags the current harness is a **stale projection** — the most common real finding. It is fixed by regenerating, never by editing the projection.

## MCP deferred

The plugin ships `skills/` and `agents/` only (v1). It carries **no `.mcp.json`**: the KI MCP servers are host-local and do not run in Cowork's gVisor sandbox, so they are deferred, not projected. An `.mcp.json` appearing in the plugin is a finding.

## The repo scaffold

Owned by the repo, not the generator: `LICENSE`, `README.md`, `.gitignore`, `.editorconfig`, `CLAUDE.md`, `.ki-config.toml`. `CLAUDE.md` must state the **generated-not-hand-edited** invariant. `.ki-config.toml` declares `[ki-plugins]` (this standard) and `[ki-repo]`. The reference instance keeps a **public-but-proprietary** LICENSE — a deliberate, documented divergence from `ki-repo`'s public-⇒-MIT default, not a fault to auto-correct.

## Boundary with ki-binding

`ki-binding` owns **generation** (`build-plugin.ts`) and **cross-surface enablement** (BIND-4 checks the machine's `cowork_settings.json` points at the repo and enables the plugin). `ki-plugins` owns the **repo's on-disk shape**. The two do not re-check each other's half. This is composition — each skill runs its own lane and declares the edge (`ADR-KI-HARNESS-001`).
