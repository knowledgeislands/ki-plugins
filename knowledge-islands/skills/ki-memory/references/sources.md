# Tracked sources

**Refresh:** external-spec · 180d

Tracked source: Headroom's memory-feature behavior — the `MEMORY.md` index format, `memory/*.md` frontmatter schema, and the `headroom:learn` auto-block markers this skill's standard and rubric encode. Update `last reviewed` on every REFRESH, whether or not anything changed.

| Source                                                                  | last reviewed |
| ----------------------------------------------------------------------- | ------------- |
| [extraheadroom.com/reduce-claude-code-costs][headroom-tools]            | 2026-07-04    |
| The auto-memory system prompt injected into this harness's own sessions | 2026-07-04    |

## Notes

- **Headroom** is the proxy this harness runs (per ADR-KI-HARNESS-TOOLCHAIN-002); its `--learn` flag is what writes the `headroom:learn` block into `MEMORY.md`. The index/frontmatter format itself is asserted by the auto-memory system prompt Headroom injects into every session — there is no separate public spec page for the format as of 2026-07-04; this skill's `references/memory-format.md` is the transcribed source of truth pending one.
- If Headroom ships a documented, versioned schema for `MEMORY.md` / frontmatter, replace this row with that URL and re-derive `memory-format.md` and the checker from it directly.

[headroom-tools]: https://extraheadroom.com/reduce-claude-code-costs
