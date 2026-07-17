# Mode REFRESH — keep the artifact model current

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for live-artifacts' REFRESH mode. The cadence marker (`canonical · on-change`) is declared in [`sources.md`](sources.md)._

The pairing convention and required frontmatter are canonical to this skill. Run REFRESH when the artifact model changes — a new render type is added, a new required field is declared, or the artifacts directory convention moves.

1. **Read [`sources.md`](sources.md)** — the reference implementation and sibling skills, each with a `last reviewed` date.
2. **Re-anchor against reality.** Sample the live bases' artifact directories for render types and frontmatter in actual use. Check whether any new convention has emerged that the model omits.
3. **Propose a diff** to the pairing convention or required frontmatter table, and confirm before writing.
4. **Update [`sources.md`](sources.md)** — bump each `last reviewed` date. The record of what changed is the commit itself.
