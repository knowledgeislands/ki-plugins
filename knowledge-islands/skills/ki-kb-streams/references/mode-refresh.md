# Mode REFRESH — keep the model current

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for streams' REFRESH mode. The shared model — the zone-at-a-glance, the status lifecycle, the proposal anatomy, the bindings, Step 1, and the working rules + Enactment gate — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

This skill is the **canonical definition** of the Streams structure and the Enactment Process; REFRESH keeps that definition coherent and current against how the live bases actually run it (the bases defer to the skill, so there is no separate canonical Model to re-anchor against). Run it periodically (monthly, with the other skills), or when someone asks "is the Streams model still current".

1. **Read [the source list](sources.md)** — the live bases that run the process, each with a `last reviewed` date.
2. **Re-anchor against practice**: sample how the live bases run their Streams; look for a genuinely shared pattern the skill does not yet carry, a convention that has moved on, or a binding real bases supply that the bindings table doesn't name.
3. **Separate shared from local** — promote a cross-base pattern into the skill (the canonical definition); a single base's quirk stays a binding or its own local note, not a model change.
4. **Propose a diff** and confirm before writing.
5. **Update [the source list](sources.md)** — bump each `last reviewed` date. The record of what changed is the commit itself — history lives in git, not a changelog. Mandatory.
