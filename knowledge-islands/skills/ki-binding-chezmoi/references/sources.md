# Sources — ki-binding-chezmoi

**Refresh:** canonical · on-change

Provenance only: the record of _what changed_ lives in git (the REFRESH commit), not a changelog here. This skill tracks no external spec on a clock — it is re-anchored when the chezmoi render contract changes (the `mcp-servers-json` template shape, the `.chezmoidata` wiring, or the `chezmoi apply` behaviour), or when either composed sibling's contract moves.

## In-house

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| [BIND] | `ki-binding` skill | The renderer-neutral surface audit this skill composes (surfaces agree with the single source) | 2026-07-13 |
| [CHEZ] | `ki-dotfiles-chezmoi` skill | The generic chezmoi source-repo standard this skill composes (repo is conventional) | 2026-07-13 |
| [SRC] | `~/.config/ki/mcp-servers.yaml` (canonical) + either `.chezmoidata/*mcp*` (data-merge pattern) or a plain managed source file applied verbatim to the canonical path (inverted pattern) | The single source and the chezmoi data the render path reads | 2026-07-14 |
| [ADR] | `ADR-KI-HARNESS-SKILLS-004` (composition-for-backends corollary) | Why the render path is its own composition skill, not a fork or a `--backend` flag | 2026-07-13 |

## Open gates & watch-items

- **Render-template shape** — the `mcp-servers-json` partial and the target `.tmpl` files it feeds. Re-anchor when chezmoi's templating contract or the per-surface `mcpServers` config shape changes.
- **Source location** — the canonical XDG home vs the legacy `.chezmoidata/mcps.yaml` fallback, vs the inverted managed-source-file pattern (BINDCHEZ-3, both shapes now recognised). Re-anchor if the resolution order in `ki-binding` moves, or if a third source shape emerges.
- **Composed siblings** — if `ki-binding`'s recognised surfaces/`clients` tokens or `ki-dotfiles-chezmoi`'s repo-shape criteria change, confirm the BINDCHEZ delta still sits cleanly on top rather than duplicating a sibling criterion.

## Last review

Initial authoring, **2026-07-13** — drafted alongside the renderer-neutral split of `ki-binding` and the `ki-dotfiles-chezmoi` standard.

**REFRESH, 2026-07-14** — BINDCHEZ-3 recognises two source-data shapes: `.chezmoidata/*mcp*` (data-merge), or a plain, non-templated, chezmoi-managed source file applied verbatim to the canonical XDG path and read via chezmoi's `include` from the source tree (inverted). Standard, rubric, and checker updated together (BINDCHEZ-7). Verified: BINDCHEZ-3 PASSes as `inverted` pattern.
