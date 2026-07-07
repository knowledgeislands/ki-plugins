# REFRESH

_On-demand procedure for `ki-memory`'s REFRESH mode. Tracked sources are declared in [sources.md](sources.md); the standard being refreshed lives in [memory-format.md](memory-format.md)._

Run when [sources.md](sources.md)'s `last reviewed` date has aged past its cadence, or on request.

1. **Read [sources.md](sources.md)** for the tracked source and its `last reviewed` date.
2. **Re-check the live source** (WebFetch; fall back to WebSearch if blocked) against [memory-format.md](memory-format.md) and [audit-rubric.md](audit-rubric.md) — has Headroom changed the `MEMORY.md` line format, the frontmatter schema, the four memory types, or the learned-patterns block markers?
3. **Diff and update** [memory-format.md](memory-format.md), [audit-rubric.md](audit-rubric.md), and `SKILL.md` where the live behavior has moved; update [`scripts/audit-memory.ts`](../scripts/audit-memory.ts) to match.
4. **Update [sources.md](sources.md)**: bump the `last reviewed` date and note what changed (or that nothing did).
