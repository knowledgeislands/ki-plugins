# REFRESH

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for `ki-housekeeping`'s REFRESH mode. Tracked sources are declared in [sources.md](sources.md); the standard being refreshed lives in [memory-format.md](memory-format.md)._

Run when [sources.md](sources.md)'s `last reviewed` date has aged past its cadence, or on request.

1. **Read [sources.md](sources.md)** for the tracked source and its `last reviewed` date.
2. **Re-check the live sources** against [memory-format.md](memory-format.md) and [audit-rubric.md](audit-rubric.md): use WebFetch for the public source (fall back to WebSearch if blocked), then record `headroom --version` and inspect `headroom memory list/show/delete --help` plus `headroom learn --help`. Has Headroom changed the `MEMORY.md` line format, frontmatter schema, four memory types, learned-patterns block markers, default database selection, USER-scope filtering, delete confirmation, or learn dry-run/apply behavior?
3. **Diff and update** [memory-format.md](memory-format.md), [audit-rubric.md](audit-rubric.md), and `SKILL.md` where the live behavior has moved; update [`scripts/audit.ts`](../scripts/audit.ts) to match.
4. **Update [sources.md](sources.md)**: bump the `last reviewed` date and note what changed (or that nothing did).
