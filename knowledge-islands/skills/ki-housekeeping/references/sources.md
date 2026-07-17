# Tracked sources

**Refresh:** external-spec · 180d

Four tracked sources cover the two mechanical arms (see [housekeeping-standard.md](housekeeping-standard.md) §3): **Headroom's memory-feature behavior** — the `MEMORY.md` index format, `memory/*.md` frontmatter schema, `headroom:learn` auto-block markers, and installed memory-database CLI contract the memory-area standard and rubric encode — and the **`mcp-claude-housekeeping` server's tool surface**, the mechanical arm for the session / artifact / storage areas, whose per-surface audits and area coverage the standard's area table tracks. Update `last reviewed` on every REFRESH, whether or not anything changed.

| Source                                                                  | last reviewed |
| ----------------------------------------------------------------------- | ------------- |
| [extraheadroom.com/reduce-claude-code-costs][headroom-tools]            | 2026-07-04    |
| The auto-memory system prompt injected into this harness's own sessions | 2026-07-04    |
| Installed Headroom 0.31.0 CLI help (`memory`, `learn`)                  | 2026-07-16    |
| `@knowledgeislands/mcp-claude-housekeeping` — README + tool surface     | 2026-07-09    |

## Notes

- **Headroom** is the proxy this harness runs (per ADR-KI-HARNESS-TOOLCHAIN-002); its `--learn` flag is what writes the `headroom:learn` block into `MEMORY.md`. The index/frontmatter format itself is asserted by the auto-memory system prompt Headroom injects into every session — there is no separate public spec page for the format as of 2026-07-04; this skill's `references/memory-format.md` is the transcribed source of truth pending one.
- The installed CLI is the primary source for the operational memory-store procedure. REFRESH records `headroom --version` and rechecks `headroom memory list/show/delete --help` plus `headroom learn --help`; do not assume default database selection, confirmation, or dry-run behavior stays stable across versions.
- If Headroom ships a documented, versioned schema for `MEMORY.md` / frontmatter, replace this row with that URL and re-derive `memory-format.md` and the checker from it directly.

[headroom-tools]: https://extraheadroom.com/reduce-claude-code-costs
