# Mode REFRESH — re-anchor the standard

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

Canonical, on-change: this skill tracks no external spec beyond RFC 2119 (BCP 14), which is stable. Re-anchor when the **format model** changes — the three-doc split, the areas-table shape, the ID scheme, the requirement/`_Verify:_` shape, or the Gaps convention — or when the reference corpus this skill generalizes from ([sources.md](sources.md)) evolves in a way the standard should absorb.

1. **Read [the source list](sources.md)** and re-examine the reference corpus. Confirm the standard, rubric, and [`../scripts/audit.ts`](../scripts/audit.ts) still match how a mature Feature Definitions corpus is actually written.
2. **Diff and propose.** Where the reference practice has moved (a new column convention, a sharper `_Verify:_` style, a change to how deprecation is marked), propose a diff to the standard + rubric + checker together — they must stay in lockstep.
3. **Bump the dates.** Update `last reviewed` in [sources.md](sources.md) and refresh its `## Last review` block. What changed is recorded in the commit, not a changelog.
4. **Confirm RFC 2119** is still the normative-keyword authority; if BCP 14 is ever revised, re-derive the keyword set the checker recognises from it.
