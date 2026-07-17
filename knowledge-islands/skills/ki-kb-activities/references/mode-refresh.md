# Mode REFRESH — keep the activity model current

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for activities' REFRESH mode. The cadence marker (`canonical · on-change`) is declared in [`sources.md`](sources.md)._

The realization type list and required frontmatter are canonical to this skill; they have no external spec. Run REFRESH when the realization model changes — a new environment type is adopted, a field is added, or a realization type is retired.

1. **Read [`sources.md`](sources.md)** — the reference implementation (ki-arcadia-principal Activities/) and the sibling skills this one composes with, each with a `last reviewed` date.
2. **Re-anchor against reality.** Sample the live bases' activity notes for realization types in actual use. Check whether any new `realization` values appear that should be promoted to the known list, or whether any known type is obsolete.
3. **Check the harness.** Confirm the `slash-command` resolution path (`skills/<name>/SKILL.md`) still matches the harness layout.
4. **Propose a diff** to the realization type table or frontmatter requirements, and confirm before writing.
5. **Update [`sources.md`](sources.md)** — bump each `last reviewed` date. The record of what changed is the commit itself.
