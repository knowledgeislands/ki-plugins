# Mode REFRESH — re-anchor the standard to its sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for decision-records' REFRESH mode. The cadence and source list are declared in [`sources.md`](sources.md). The full format standard lives in [`dr-format.md`](dr-format.md)._

Run when asked "is the DR standard current" or when a source appears to have moved.

1. **Read [sources.md](sources.md)** — tracked sources with `last reviewed` dates.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if blocked) and diff against the format standard ([`dr-format.md`](dr-format.md)) and the rubric ([`audit-rubric.md`](audit-rubric.md)).
3. **Propose a diff** to the standard, the rubric, and `SKILL.md`; confirm before writing.
4. **Update [sources.md](sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block. What changed goes in the commit, not a changelog.
