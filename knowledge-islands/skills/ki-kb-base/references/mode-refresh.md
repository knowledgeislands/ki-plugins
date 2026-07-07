# Mode REFRESH — keep the structure model current

_On-demand procedure for kb's REFRESH mode. The shared model — the five-zone structure, routing test, memory cascade, project bindings, and Step 1 (Load context) — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

This skill carries the zone model, routing test, and project-bindings table as fixed knowledge; it must not drift from how the bases that use it are really organised - especially once installed into a shared/cloud catalogue, where it is long-lived and far from its author. Run this periodically (monthly, with the other skills), or when someone asks "is the KB skill still current".

1. **Read [the source list](sources.md)** - the canonical structure definition (ki-agentic-harness `docs/knowledge-islands.md`) and the bases actively using this skill, each with a `last reviewed` date.
2. **Re-anchor against reality.** Re-read that structure definition, and sample how the live bases are actually laid out (their root `Admin/MEMORY.md` and top-level folders). Diff against this skill's zone table, routing test, and bindings table. Look for: a zone or convention the bases now use that the model omits; a binding real bases supply that the bindings table doesn't name; a default that no longer matches practice; a tool surface the host MCP server has changed under the skill (it resolves tools at runtime - confirm that assumption still holds).
3. **Separate canonical from local.** A change is only a model change if it traces to the canonical structure or to a pattern shared across bases; a single base's quirk is declared in that base's `.ki-config` / `CLAUDE.md`, not promoted here.
4. **Propose a diff** to the zone table / routing test / bindings, and confirm before writing.
5. **Update [the source list](sources.md)** - bump each `last reviewed` date, add any new source, retire any dead one. The record of what changed is the commit itself - history lives in git, not a changelog. This step is mandatory: the source list is the skill's memory of where its structure model comes from.
