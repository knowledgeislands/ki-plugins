---
name: ki-repo-plugins
ki-kind: governance
ki-depends-on: []
ki-runtime-binding: true
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Audit, conform, and scaffold a Knowledge Islands **plugin-marketplace** repo — the generated Claude plugin marketplace that projects the harness's skills and agents onto the Cowork surface (`knowledgeislands/ki-plugins`, `ADR-KI-HARNESS-002`). The fifth repo-structure skill (with `ki-repo-harness`, `ki-repo-kb`, `ki-repo-website`, `ki-repo-mcp`), exactly one per repo. Governs the on-disk projection: the `marketplace.json` and `plugin.json` manifests, the verbatim `skills/` copy and flattened `agents/`, the MCP-deferred rule (no `.mcp.json`), and the generated-not-hand-edited invariant. Triggers: "audit the plugin marketplace", "is ki-repo-plugins well-formed", "check marketplace.json", "scaffold a plugin marketplace", "refresh the plugins standard". Generation and Cowork enablement belong to `ki-binding-claude` (`ki:binding:build-plugin` + Cowork wiring); this skill owns only the projection's on-disk correctness. For GitHub config and LICENSE use `ki-repo`; for Markdown/TOML style use `ki-authoring`.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands plugin-marketplace standard

You are helping audit, conform, or scaffold a **plugin-marketplace repo** — a generated Claude plugin marketplace that carries the Knowledge Islands governance skills and agents onto the Claude Cowork surface. The reference instance is `knowledgeislands/ki-plugins`. It is one repo shape with one canonical layout, so a new one is scaffolded to it and an existing one is auditable against it. This skill carries that standard and the audit procedure.

The repo is a **lossy, per-surface projection** of the `ki-agentic-harness` (`ADR-KI-HARNESS-002`): the harness `skills/` and `agents/governance/` are the single source of truth, and the marketplace is generated from them — **never hand-maintained**. This skill audits the **on-disk projection shape**. Generating the projection and enabling it on each surface are `ki-binding`'s job; the repo's GitHub configuration, LICENSE, and standard files are `ki-repo`'s; Markdown/TOML house style is `ki-authoring`'s.

The full, quotable standard lives in [the plugin-marketplace standard](references/standards-plugin-marketplace.md); the criteria live in [the rubric](references/rubric.md). The native `ki repo audit --skill ki-repo-plugins` operation runs the mechanical structural checks. The exact repository tree and both manifest contracts are embedded here and in the standard, so this skill intentionally needs no separate exemplars file.

## The canonical shape at a glance

```text
ki-repo-plugins/                           # a generated Claude plugin marketplace (NOT hand-edited)
├── .claude-plugin/
│   └── marketplace.json              # marketplace manifest — exactly ONE plugin entry
├── knowledge-islands/                # the single plugin — the projection of the harness
│   ├── .claude-plugin/plugin.json    # plugin manifest — name / version / description / author
│   ├── skills/<name>/                # every harness skill, copied VERBATIM (each carries a SKILL.md)
│   └── agents/<name>.md              # governance agents, FLATTENED from harness agents/governance/
├── .ki-config.toml                   # declares [skills.ki-repo-plugins] (+ [skills.ki-repo]); NO TypeScript toolchain
├── CLAUDE.md  README.md  LICENSE  .gitignore  .editorconfig   # repo scaffold — untouched by regen
```

Three rules define the shape — most audit findings are a violation of one:

1. **Projection, not source.** `.claude-plugin/` and `knowledge-islands/` are generated **byte-for-byte** by `ki-binding-claude` through `bun run ki:binding:build-plugin <repo>`; re-running reproduces them exactly. Content is never edited here — you edit the harness source (`skills/`, `agents/governance/`) and regenerate. The repo scaffold (`LICENSE`, `README.md`, `.ki-config.toml`, `.gitignore`, `CLAUDE.md`) is owned by the repo and left untouched by regeneration.
2. **Skills + agents only (v1).** The plugin ships `skills/` and `agents/` and **no `.mcp.json`** — the KI MCP servers are host-local and do not run in Cowork's gVisor sandbox, so they are deferred, not projected.
3. **One marketplace, one plugin.** `marketplace.json` names the marketplace (`ki-repo-plugins`) and lists exactly one plugin (`knowledge-islands`) whose `source` is `./knowledge-islands`; `owner.name` and the plugin's `author.name` are both `Knowledge Islands`, and `plugin.json`'s `version` tracks the harness `package.json` version at generation time.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH**; EDUCATE here scaffolds a new marketplace repo. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode EDUCATE

→ Read [references/mode-educate.md](references/mode-educate.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Notes

- The projection is generated by `ki-binding-claude`. The two skills share one boundary: `ki-binding-claude` owns **generation and Cowork enablement**; `ki-repo-plugins` owns the **repo's on-disk shape**. Neither re-checks the other's half.
- The reference instance keeps a **public-but-proprietary** LICENSE (public visibility ≠ open licence), a deliberate divergence from `ki-repo`'s public-⇒-MIT default. It is documented in the repo's `.ki-config.toml`; do not silently flip it to MIT.
- A **stale projection** (the on-disk skill/agent set lagging the harness) is the most common real finding and is never fixed by editing here — regenerate via `ki-binding-claude`.
- Full detail: [the plugin-marketplace standard](references/standards-plugin-marketplace.md), [the rubric](references/rubric.md), and the tracked [source list](references/sources.md).
- The native session is report-only: it never rewrites generated content, changes scaffold files, invokes the external generator, or publishes commands.
