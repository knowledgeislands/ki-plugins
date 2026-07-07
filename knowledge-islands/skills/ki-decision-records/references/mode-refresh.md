# Mode REFRESH — re-anchor the standard to its sources

_On-demand procedure for decision-records' REFRESH mode. The cadence and source list are declared in [`sources.md`](sources.md). The full format standard lives in [`dr-format.md`](dr-format.md)._

Run when asked "is the DR standard current" or when a source appears to have moved.

1. **Read [sources.md](sources.md)** — tracked sources with `last reviewed` dates.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if blocked) and diff against the format standard ([`dr-format.md`](dr-format.md)) and the rubric ([`audit-rubric.md`](audit-rubric.md)).
3. **Propose a diff** to the standard, the rubric, and `SKILL.md`; confirm before writing.
4. **Update [sources.md](sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block. What changed goes in the commit, not a changelog.
