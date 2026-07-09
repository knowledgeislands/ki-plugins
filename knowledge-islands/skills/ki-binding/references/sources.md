# Sources — ki-binding

**Refresh:** canonical · on-change

Provenance only: the record of _what changed_ lives in git (the REFRESH commit), not a changelog here. This skill tracks no external spec on a clock — it is re-anchored when a surface's config contract changes, a surface is added, or the Cowork gate is resolved.

## In-house

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| [DR] | [cross-surface-enablement.md](../../ki-mcp/references/cross-surface-enablement.md) | Per-surface controllability, home decision, build sequence † | 2026-07-06 |
| [CZ] | `~/.local/share/chezmoi/.chezmoidata/mcps.yaml` + `.chezmoitemplates/mcp-servers-json` | The single source and the render to Code / Desktop / mcporter ‡ | 2026-07-06 |
| [KB] | `ki-bootstrap` skill | The project-local skill half (BIND-3 composes its `--check`) | 2026-07-06 |
| [KM] | `ki-mcp` skill | Each server's own code; hosts the design record [DR] | 2026-07-06 |

† The operating rationale this skill implements. ‡ Render output shape, recognised `clients` tokens, rendered config paths.

## External

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| [CP] | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | Plugin packaging shape (`.claude-plugin/plugin.json`) that `build-plugin.ts` generates | 2026-07-07 |
| [CM] | [code.claude.com/docs/en/plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) | Marketplace manifest shape (`.claude-plugin/marketplace.json`) that `build-plugin.ts` generates | 2026-07-07 |
| [CS] | [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) | Native `/skill-name` invocation — confirms skills projected into the plugin need no separate command wiring | 2026-07-07 |

## Open gates & watch-items

- **The Cowork external-edit gate — RESOLVED (PASSED) 2026-07-06.** `local-agent-mode-sessions/<account>/<workspace>/cowork_settings.json` (`enabledPlugins`, `extraKnownMarketplaces`). Verified: Cowork honours an external edit on next launch ([DR] Verification log). What remains for Cowork is the plugin/marketplace packaging (plan 007 step 6), not the enablement mechanism.
- **Claude plugin-marketplace format** — the packaging the Cowork surface toggles. Re-anchor when the `enabledPlugins` schema or marketplace registration changes.
- **New surfaces / `clients` tokens** — if chezmoi adds a rendered surface, extend `RECOGNISED` and `SURFACES` in [the checker](../scripts/audit-binding.ts) and the recognised-surfaces table in the standard.

## Last review

REFRESH last run **2026-07-06** (initial scaffold; internal-model anchor — no external spec). All four in-house sources confirmed against the live chezmoi install: 19 servers, `clients` tokens `{code, desktop, mcporter}` in use, `cowork` not yet present.
