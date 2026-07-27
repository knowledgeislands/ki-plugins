# REFRESH

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for `ki-housekeeping`'s REFRESH mode. Tracked sources are declared in [sources.md](sources.md); the memory standard being refreshed lives in [standards-auto-memory.md](standards-auto-memory.md)._

Run when [sources.md](sources.md)'s `last reviewed` date has aged past its cadence, or on request.

1. **Read [sources.md](sources.md)** for the tracked source and its `last reviewed` date.
2. **Re-check the live sources** against [standards-auto-memory.md](standards-auto-memory.md) and [rubric.md](rubric.md): consult the public source, then record `headroom --version` and inspect `headroom memory list/show/delete --help` plus `headroom learn --help`. Has Headroom changed the `MEMORY.md` line format, frontmatter schema, four memory types, learned-patterns block markers, default database selection, USER-scope filtering, delete confirmation, or learn dry-run/apply behavior?
3. **Diff and update** [standards-auto-memory.md](standards-auto-memory.md), `SKILL.md`, and the canonical TypeScript items under `scripts/rubric/items/` where the live behavior has moved; regenerate [rubric.md](rubric.md) with `ki skill rubric ki-housekeeping --write`.
4. **Update [sources.md](sources.md)**: bump the `last reviewed` date and note what changed (or that nothing did).
