# Audit Rubric

Pass/fail items for auditing a Knowledge Islands plugin-marketplace repo against the [Plugins Standard](plugins-standard.md). Run [`../scripts/audit-plugins.ts`](../scripts/audit-plugins.ts) for the mechanical items (marked **[M]**), then judge the rest **[J]** by reading.

Severity: **FAIL** (malformed manifest or broken projection contract — ship-stopper), **WARN** (shape divergence or a deferred artifact leaking in), **POLISH** (formatting / consistency) — the shared ladder, defined in `ki-engineering`'s [`enforcement-framework.md`](../../ki-engineering/references/enforcement-framework.md) §2.

## Marketplace manifest

- **[M]** `.claude-plugin/marketplace.json` exists and parses. (FAIL)
- **[M]** `owner.name` is `Knowledge Islands`; `plugins` lists exactly one entry. (FAIL)
- **[M]** the plugin entry has `name`, `source` = `./<name>`, and a `description`; the source dir exists. (FAIL)
- **[M]** 2-space JSON with a trailing newline. (POLISH)

## Plugin manifest

- **[M]** `<plugin>/.claude-plugin/plugin.json` exists, parses, and `name` matches the source dir. (FAIL)
- **[M]** `author.name` is `Knowledge Islands`. (FAIL)
- **[M]** `version` is semver and `description` matches the marketplace entry. (WARN — regenerate)

## Projection

- **[M]** `<plugin>/skills/*` each carry a `SKILL.md`. (FAIL)
- **[M]** `<plugin>/agents/*.md` are flat files (no nested `governance/`). (FAIL if nested)
- **[M]** no `.mcp.json` anywhere in the plugin — MCP deferred. (WARN)
- **[J]** the projected skill/agent set matches the **current** harness — not stale. A stale projection is regenerated via `ki-binding`, never edited here.
- **[J]** the projection is byte-for-byte reproducible: re-running `ki:binding:build-plugin` leaves no diff.

## Repo scaffold

- **[M]** `LICENSE`, `README.md`, `.gitignore`, `CLAUDE.md` present. (FAIL)
- **[M]** `CLAUDE.md` states the generated-not-hand-edited invariant. (WARN)
- **[M]** `.ki-config.toml` declares `[ki-plugins]`; unknown keys under it validate-down (WARN). (WARN if table missing)
- **[J]** `README.md` / `CLAUDE.md` describe the projection model without drift; the LICENSE divergence (public-but-proprietary) is still deliberate and documented.

## Boundary (not this skill's job)

- Cross-surface enablement — the machine's Cowork `extraKnownMarketplaces` / `enabledPlugins` — is `ki-binding` BIND-4, not audited here.
- The repo's GitHub settings and standard-file policy are `ki-repo`; Markdown/TOML house style is `ki-authoring`.
