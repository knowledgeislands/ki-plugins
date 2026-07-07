# Modes AUDIT and CONFORM

_On-demand procedure for live-artifacts' AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The live artifact model — pairing convention, required frontmatter, index note, and project bindings — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

## Mode AUDIT — check the base's artifact pairs

1. **Run the mechanical checker** — `bun scripts/audit-live-artifacts.ts <base-path>` (from this skill's directory). It reports: each `.md` artifact missing a same-stem `.html` (WARN — unpublished), each `.html` with no matching `.md` (WARN — orphaned render), paired artifacts where `.html` is older than `.md` by more than the sync threshold (WARN — stale), `.md` files missing `status` or `renders` frontmatter (WARN), and absence of the index note when any artifact is found (WARN). Exit 0 (no FAILs in this domain).
2. **Apply the judgment layer** — read the **[J]** criteria in [the rubric](audit-rubric.md): whether the index accurately lists all active artifacts (LA-J-1), whether `.md` is the authoritative source (LA-J-2), whether archived artifacts carry a rationale (LA-J-3), and whether names are stable (LA-J-4).
3. **Compose on `ki-kb-base`** — zone and zone-index checks are owned by `ki-kb-base`; run its audit for the base first (the `Admin/Operations/` zone) and note its result rather than re-deriving it here.
4. **Report** by location → criterion → fix, leading with WARNs then ADVISORYs.

## Mode CONFORM — repair structural gaps

1. Run **AUDIT** first for the gap list.
2. Create the index note stub (`Admin/Operations/Live Artifacts/Live Artifacts.md`) if absent.
3. For unpublished artifacts (`.md` with no `.html`): note that HTML must be generated — this skill does not render Markdown to HTML; flag the artifact as needing a render step.
4. For orphaned renders (`.html` with no `.md`): prompt to either create the missing `.md` or delete the stale `.html` — confirm before deleting.
5. For stale pairs: prompt the user to regenerate the HTML.
6. Re-run **AUDIT** until it is clean.
