# Sources — ki-binding

**Refresh:** canonical · on-change

Provenance only: the record of _what changed_ lives in git (the REFRESH commit), not a changelog here. This skill tracks no external spec on a clock — it is re-anchored when a surface's config contract changes, a surface is added, or the Cowork gate is resolved.

## In-house

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| [DR] | [cross-surface-enablement.md](../../../repo-structure/ki-mcp/references/cross-surface-enablement.md) | Per-surface controllability, home decision, build sequence † | 2026-07-06 |
| [SRC] | `~/.config/ki/mcp-servers.yaml` (canonical; resolution order in [the standard](binding-standard.md)) | The single source this skill reads and audits against ‡ | 2026-07-13 |
| [RDR] | `ki-binding-chezmoi` skill (composes this + `ki-dotfiles-chezmoi`) | The chezmoi render path — templates + `chezmoi apply` — kept out of this renderer-neutral skill | 2026-07-13 |
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
- **New surfaces / `clients` tokens** — if a renderer adds a rendered surface, extend `RECOGNISED` and `SURFACES` in [the checker](../scripts/audit.ts) and the recognised-surfaces table in the standard.
- **Codex CLI surface** — the one surface this skill renders itself (not a chezmoi template): `~/.codex/config.toml` `[mcp_servers.*]` via `codex mcp add|remove`, in [`render-codex.ts`](../scripts/render-codex.ts). Re-anchor if the Codex CLI's `codex mcp` writer shape changes (binary-verified against codex-cli 0.144.4, 2026-07-14).
- **Source location** — this skill is renderer-neutral (canonical source `~/.config/ki/mcp-servers.yaml`, chezmoi data path kept as a transitional fallback). The chezmoi render mechanism now lives in `ki-binding-chezmoi`; re-anchor there when the chezmoi template/apply contract changes.

## Last review

REFRESH last run **2026-07-06** (initial scaffold; internal-model anchor — no external spec). All four in-house sources confirmed against the live chezmoi install: 19 servers, `clients` tokens `{code, desktop, mcporter}` in use, `cowork` not yet present.

**REFRESH, 2026-07-14** — `clients` tokens: explicit literal set `mcporter`, `claude-desktop`, `claude-code`; no other value is recognised. Cowork has no `clients` token — it rides on `claude-desktop` and is checked by BIND-4 against the plugin registration only. Standard, rubric, and checker updated together (BINDCHEZ-7 discipline). Verified: `ki-binding audit --source ~/.config/ki/mcp-servers.yaml` PASSes clean (FAIL=0 WARN=0).

**REFRESH, 2026-07-14 (later same day)** — added the `chatgpt-codex` recognised token (vendor-type, matching `claude-code`/`claude-desktop`) and the Codex CLI surface (`~/.codex/config.toml` `[mcp_servers.*]`, TOML). Unlike the other file-editable surfaces, Codex is rendered by this skill directly (`render-codex.ts`, shelling `codex mcp add|remove`) rather than by a chezmoi template, because the config is a live user file also carrying the ChatGPT app's own servers. Standard, rubric, and checker updated together; verified end-to-end (add / idempotent re-apply / drift-cleanup) against codex-cli 0.144.4.
