<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — generated Claude plugin marketplace projection

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-plugins --write`.

Line-by-line criteria for auditing ki-plugins. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [PLUG — Plugin marketplace projection](#plug--plugin-marketplace-projection)

## PLUG — Plugin marketplace projection

→ [standard](standards-plugin-marketplace.md)

The marketplace manifest, generated plugin projection, and repository scaffold.

- **PLUG-1 [M] — Marketplace manifest** — `.claude-plugin/marketplace.json` exists and parses. (standards-plugin-marketplace.md)
- **PLUG-2 [M] — Marketplace ownership** — `owner.name` is `Knowledge Islands`; `plugins` lists exactly one entry. (standards-plugin-marketplace.md)
- **PLUG-3 [M] — Plugin entry** — The plugin entry has `name`, `source = ./<name>`, and a description; the physical source directory exists. (standards-plugin-marketplace.md)
- **PLUG-4 [M] — Manifest formatting** — Plugin JSON manifests use two spaces and a trailing newline. (standards-plugin-marketplace.md)
- **PLUG-5 [M] — Plugin manifest** — `<plugin>/.claude-plugin/plugin.json` exists, parses, and its name matches the source directory. (standards-plugin-marketplace.md)
- **PLUG-6 [M] — Plugin author** — `author.name` is `Knowledge Islands`. (standards-plugin-marketplace.md)
- **PLUG-7 [M] — Plugin version and description** — `version` is semver and `description` matches the marketplace entry. (standards-plugin-marketplace.md)
- **PLUG-8 [M] — Projected skills** — `<plugin>/skills/*` each carries a physical `SKILL.md`. (standards-plugin-marketplace.md)
- **PLUG-9 [M] — Flattened agents** — `<plugin>/agents/*.md` are physical flat files. (standards-plugin-marketplace.md)
- **PLUG-10 [M] — MCP deferral** — No `.mcp.json` appears in the plugin. (standards-plugin-marketplace.md)
- **PLUG-11 [J] — Projection freshness** — The projected skill and agent set matches the current harness. (standards-plugin-marketplace.md)
  - _Review prompt:_ Does the projected skill and agent set match the current harness without stale or missing entries?
- **PLUG-12 [J] — Projection reproducibility** — Running the canonical `ki-binding` generator leaves no diff. (standards-plugin-marketplace.md)
  - _Review prompt:_ Is the complete projection byte-for-byte reproducible from the current harness?
- **PLUG-13 [M] — Repository scaffold** — `LICENSE`, `README.md`, `.gitignore`, and `CLAUDE.md` are physical files. (standards-plugin-marketplace.md)
- **PLUG-14 [M] — Generated-content warning** — `CLAUDE.md` states the generated-not-hand-edited invariant. (standards-plugin-marketplace.md)
- **PLUG-15 [M] — Governance declaration** — Applicable repositories declare `[ki-plugins]` and no unknown keys. (standards-plugin-marketplace.md)
- **PLUG-16 [J] — Projection documentation** — `README.md` and `CLAUDE.md` describe the projection model without drift and the licence exception remains deliberate. (standards-plugin-marketplace.md)
  - _Review prompt:_ Do the repository documents accurately describe the projection, generated-content boundary, and deliberate licence exception?
