---
name: ki-plugins
implies: []
description: >
  Audit, conform, and scaffold a Knowledge Islands **plugin-marketplace** repo — the generated Claude plugin marketplace that projects the harness's skills and agents onto the Cowork surface (`knowledgeislands/ki-plugins`, `ADR-KI-HARNESS-005`). The fifth repo-structure skill (with `ki-harness`, `ki-kb`, `ki-website`, `ki-mcp`), exactly one per repo. Governs the on-disk projection: the `marketplace.json` and `plugin.json` manifests, the verbatim `skills/` copy and flattened `agents/`, the MCP-deferred rule (no `.mcp.json`), and the generated-not-hand-edited invariant. Triggers: "audit the plugin marketplace", "is ki-plugins well-formed", "check marketplace.json", "scaffold a plugin marketplace", "refresh the plugins standard". Generation and cross-surface enablement belong to `ki-binding` (`ki:binding:build-plugin` + Cowork wiring); this skill owns only the projection's on-disk correctness. For GitHub config and LICENSE use `ki-repo`; for Markdown/TOML style use `ki-authoring`.
argument-hint: 'audit <repo> | conform <repo> | init <repo> | refresh'
---

# Knowledge Islands plugin-marketplace standard

You are helping audit, conform, or scaffold a **plugin-marketplace repo** — a generated Claude plugin marketplace that carries the Knowledge Islands governance skills and agents onto the Claude Cowork surface. The reference instance is `knowledgeislands/ki-plugins`. It is one repo shape with one canonical layout, so a new one is scaffolded to it and an existing one is auditable against it. This skill carries that standard and the audit procedure.

The repo is a **lossy, per-surface projection** of the `ki-agentic-harness` (`ADR-KI-HARNESS-005`): the harness `skills/` and `agents/governance/` are the single source of truth, and the marketplace is generated from them — **never hand-maintained**. This skill audits the **on-disk projection shape**. Generating the projection and enabling it on each surface are `ki-binding`'s job; the repo's GitHub configuration, LICENSE, and standard files are `ki-repo`'s; Markdown/TOML house style is `ki-authoring`'s.

The full, quotable standard lives in [Plugins Standard](references/plugins-standard.md); the pass/fail items live in [Audit Rubric](references/audit-rubric.md). A mechanical structural checker is [`scripts/audit-plugins.ts`](scripts/audit-plugins.ts). Read those when you need detail; this file is the operating procedure.

## The canonical shape at a glance

```text
ki-plugins/                           # a generated Claude plugin marketplace (NOT hand-edited)
├── .claude-plugin/
│   └── marketplace.json              # marketplace manifest — exactly ONE plugin entry
├── knowledge-islands/                # the single plugin — the projection of the harness
│   ├── .claude-plugin/plugin.json    # plugin manifest — name / version / description / author
│   ├── skills/<name>/                # every harness skill, copied VERBATIM (each carries a SKILL.md)
│   └── agents/<name>.md              # governance agents, FLATTENED from harness agents/governance/
├── .ki-config.toml                   # declares [ki-plugins] (+ [ki-repo]); NO TypeScript toolchain
├── CLAUDE.md  README.md  LICENSE  .gitignore  .editorconfig   # repo scaffold — untouched by regen
```

Three rules define the shape — most audit findings are a violation of one:

1. **Projection, not source.** `.claude-plugin/` and `knowledge-islands/` are generated **byte-for-byte** by `ki-binding`'s `bun run ki:binding:build-plugin <repo>`; re-running reproduces them exactly. Content is never edited here — you edit the harness source (`skills/`, `agents/governance/`) and regenerate. The repo scaffold (`LICENSE`, `README.md`, `.ki-config.toml`, `.gitignore`, `CLAUDE.md`) is owned by the repo and left untouched by regeneration.
2. **Skills + agents only (v1).** The plugin ships `skills/` and `agents/` and **no `.mcp.json`** — the KI MCP servers are host-local and do not run in Cowork's gVisor sandbox, so they are deferred, not projected.
3. **One marketplace, one plugin.** `marketplace.json` names the marketplace (`ki-plugins`) and lists exactly one plugin (`knowledge-islands`) whose `source` is `./knowledge-islands`; `owner.name` and the plugin's `author.name` are both `Knowledge Islands`, and `plugin.json`'s `version` tracks the harness `package.json` version at generation time.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · INIT · REFRESH**; INIT here scaffolds a new marketplace repo. If invoked without a mode, use `AskUserQuestion` to list each mode with a one-line description; if the chosen mode shows a target in the `argument-hint`, prompt for that too.

### Mode AUDIT

1. **Identify the target.** Confirm the repo path (default: the cwd repo).
2. **Run the mechanical checker.** `bun skills/ki-plugins/scripts/audit-plugins.ts <repo>` (or `node` after a build) checks the projection shape: `marketplace.json` / `plugin.json` field values and agreement, the one-plugin invariant, that each `skills/*` carries a `SKILL.md`, that `agents/*.md` are flat, that no `.mcp.json` leaked in, that the scaffold files are present, that `CLAUDE.md` carries the generated-not-hand-edited invariant, and the `[ki-plugins]` opt-in marker. Findings grade on the shared ladder (FAIL / WARN / POLISH / ADVISORY / INFO / SKIP / PASS); `--json` / `--report` emit machine-readable output under `.ki-meta/audits/plugins.{md,json}`.
3. **Do the semantic pass** — walk [Audit Rubric](references/audit-rubric.md): confirm the projected skill/agent set actually matches the current harness (a **stale projection** is the common finding — regenerate), the `CLAUDE.md`/`README.md` describe the projection without drift, and the known LICENSE divergence (public-but-proprietary) is still a deliberate, documented exception rather than a silent one.

### Mode CONFORM

Run AUDIT first. Then bring the repo into line:

1. **Regenerate the projection**, don't hand-fix it — the projected halves are owned by the generator. Run `bun run ki:binding:build-plugin <repo>` from the harness (`ki-binding`'s CONFORM step), which rewrites `.claude-plugin/` and `knowledge-islands/` byte-for-byte from the current source, then commit. This is the only correct fix for any projected-content finding.
2. **Fix the repo scaffold by hand** where AUDIT flagged it (missing `[ki-plugins]` table, a drifted `CLAUDE.md` invariant, a missing standard file) — the scaffold is the repo's own, not generated.
3. **Re-run AUDIT** to confirm clean (bar the acknowledged LICENSE divergence).

### Mode INIT

Scaffold a new marketplace repo:

1. **Create the repo scaffold** — `LICENSE`, `README.md` documenting the projection model, `.gitignore`, `.editorconfig`, a `CLAUDE.md` stating the generated-not-hand-edited invariant, and a `.ki-config.toml` declaring `[ki-plugins]` (and `[ki-repo]`). Onboard it with `ki-repo` for the GitHub side.
2. **Generate the content** by delegating to `ki-binding`: `bun run ki:binding:build-plugin <repo>` writes the marketplace and plugin. Do not author `.claude-plugin/` or `knowledge-islands/` by hand.
3. **Enable the surface** via `ki-binding` (Cowork `extraKnownMarketplaces` + `enabledPlugins`), then run AUDIT.

### Mode REFRESH

Re-anchor the standard to the current Claude plugin/marketplace spec:

1. **Read [the source list](references/sources.md)** — the authoritative Claude plugin + marketplace manifest spec, each with a `last reviewed` date.
2. **Re-fetch each source** and diff it against the [standard](references/plugins-standard.md) + [rubric](references/audit-rubric.md) + [`scripts/audit-plugins.ts`](scripts/audit-plugins.ts): changed `marketplace.json` / `plugin.json` fields, new plugin capabilities (e.g. `.mcp.json` becoming viable in the sandbox), changed source/owner semantics.
3. **Separate spec-driven from house style** — a change is a new requirement only if it traces to the authoritative source; the one-plugin shape, `agents/governance` flattening, and MCP-deferred rule are house projection choices.
4. **Propose a diff** to the standard, rubric, and (where a check became mechanical) the checker; confirm before writing. **Bump the `last reviewed` dates** in the source list.

## Notes

- The projection is generated by [`ki-binding/scripts/build-plugin.ts`](../ki-binding/scripts/build-plugin.ts). This skill and `ki-binding` share one boundary: `ki-binding` owns **generation and cross-surface enablement** (BIND-4 checks the machine's Cowork settings point at the repo and enable the plugin); `ki-plugins` owns the **repo's on-disk shape**. Neither re-checks the other's half.
- The reference instance keeps a **public-but-proprietary** LICENSE (public visibility ≠ open licence), a deliberate divergence from `ki-repo`'s public-⇒-MIT default. It is documented in the repo's `.ki-config.toml`; do not silently flip it to MIT.
- A **stale projection** (the on-disk skill/agent set lagging the harness) is the most common real finding and is never fixed by editing here — regenerate via `ki-binding`.
- Full detail: [Plugins Standard](references/plugins-standard.md), [Audit Rubric](references/audit-rubric.md), and the tracked [source list](references/sources.md).
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).
