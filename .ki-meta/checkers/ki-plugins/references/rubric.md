# Audit Rubric

Pass/fail items for auditing a Knowledge Islands plugin-marketplace repo against the [Plugins Standard](standards.md). Run [`../scripts/audit.ts`](../scripts/audit.ts) for the mechanical items (marked **[M]**), then judge the rest **[J]** by reading.

Severity: **FAIL** (malformed manifest or broken projection contract — ship-stopper), **WARN** (shape divergence or a deferred artifact leaking in), **POLISH** (formatting / consistency) — the shared ladder, defined in `ki-engineering`'s [`enforcement-framework.md`](../../../foundations/ki-engineering/references/enforcement-framework.md) §2.

Each criterion carries a stable code (`PLUG-N`) the checker emits as the finding `area`; **[M]** codes are enforced by `audit.ts`, **[J]** codes are judged by reading. The reference pointer in parentheses is the finding `ref` the cited-finding output attaches — the standard section a reader consults ([`standards.md`](standards.md)), or this rubric for judgment-only codes.

Applicability: `[ki-plugins]` or `.claude-plugin/marketplace.json` activates the complete audit. With neither, **PLUG-15 [M]** emits exactly one `NA` and stops; either signal retains all existing marketplace and projection findings.

## Marketplace manifest

- **[M] PLUG-1** `.claude-plugin/marketplace.json` exists and parses. (FAIL) (standards.md)
- **[M] PLUG-2** `owner.name` is `Knowledge Islands`; `plugins` lists exactly one entry. (FAIL) (standards.md)
- **[M] PLUG-3** the plugin entry has `name`, `source` = `./<name>`, and a `description`; the source dir exists. (FAIL) (standards.md)
- **[M] PLUG-4** 2-space JSON with a trailing newline. (POLISH) (standards.md)

## Plugin manifest

- **[M] PLUG-5** `<plugin>/.claude-plugin/plugin.json` exists, parses, and `name` matches the source dir. (FAIL) (standards.md)
- **[M] PLUG-6** `author.name` is `Knowledge Islands`. (FAIL) (standards.md)
- **[M] PLUG-7** `version` is semver and `description` matches the marketplace entry. (WARN — regenerate) (standards.md)

## Projection

- **[M] PLUG-8** `<plugin>/skills/*` each carry a `SKILL.md`. (FAIL) (standards.md)
- **[M] PLUG-9** `<plugin>/agents/*.md` are flat files (no nested `governance/`). (FAIL if nested) (standards.md)
- **[M] PLUG-10** no `.mcp.json` anywhere in the plugin — MCP deferred. (WARN) (standards.md)
- **[J] PLUG-11** the projected skill/agent set matches the **current** harness — not stale. A stale projection is regenerated via `ki-binding`, never edited here. (rubric.md)
- **[J] PLUG-12** the projection is byte-for-byte reproducible: re-running `ki:binding:build-plugin` leaves no diff. (rubric.md)

## Repo scaffold

- **[M] PLUG-13** `LICENSE`, `README.md`, `.gitignore`, `CLAUDE.md` present. (FAIL) (standards.md)
- **[M] PLUG-14** `CLAUDE.md` states the generated-not-hand-edited invariant. (WARN) (standards.md)
- **[M] PLUG-15** on an applicable marketplace, `.ki-config.toml` declares `[ki-plugins]`; unknown keys under it validate-down (WARN). (WARN if table missing) (standards.md)
- **[J] PLUG-16** `README.md` / `CLAUDE.md` describe the projection model without drift; the LICENSE divergence (public-but-proprietary) is still deliberate and documented. (rubric.md)

## Boundary (not this skill's job)

- Cross-surface enablement — the machine's Cowork `extraKnownMarketplaces` / `enabledPlugins` — is `ki-binding` BIND-4, not audited here.
- The repo's GitHub settings and standard-file policy are `ki-repo`; Markdown/TOML house style is `ki-authoring`.
