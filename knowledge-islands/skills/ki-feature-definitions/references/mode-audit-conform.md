# Modes AUDIT and CONFORM

On-demand procedure for this skill's AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The standard is in [feature-format.md](feature-format.md); the criteria are in [audit-rubric.md](audit-rubric.md).

## Mode AUDIT — check a repo's Feature Definitions

1. **Run the checker.** `bun <skill>/scripts/audit-features.ts [docs/features]` (or `bun run ki:feature-definitions:audit` if wired). It reports the **[M]** items on the severity ladder: index and areas-table presence (INDEX-1/2), file↔table agreement (AREA-1/2), requirement IDs (ID-1/2/3), and the RFC-2119 statement and `_Verify:_` line per requirement (REQ-1, VERIFY-1). It exits non-zero on any FAIL. Capture the output verbatim.
2. **Apply the judgment layer by reading** — the **[J]** criteria the checker cannot judge: behaviour-not-rationale (BEHAVIOUR-1), as-built-not-aspirational (AS-BUILT-1), concrete verify hooks (VERIFY-2), over-bundled requirements (SPLIT-1), decision links (DR-LINK-1), and area fit (AREA-FIT-1).
3. **Report** by criterion, most-severe first. A missing index or malformed ID is a FAIL and blocks; a missing `_Verify:_`, an unregistered area file, or a duplicate ID is a WARN.

## Mode CONFORM — bring a spec into line

1. Run **AUDIT** first.
2. **Scaffold if empty.** If `docs/features/` has no `index.md`, write the skeleton: the purpose blurb, the how-to-read example, the ID-scheme and Gaps conventions, and an empty areas table; then create the first area file with its `# <Title> — <PREFIX>` H1. Use the shapes in [exemplars.md](exemplars.md).
3. **Fix the mechanical findings in place** — register unlisted area files in the areas table (or delete stray files), repair malformed heading IDs (**without** renumbering existing IDs — a wrong ID that is already referenced is corrected by adding a note, not by reusing a number), add the missing RFC-2119 keyword or `_Verify:_` line. Confirm before moving or renumbering anything.
4. **Do not invent behaviour.** CONFORM repairs the _form_ of existing requirements; it never fabricates a requirement or a verify hook. Where a statement is aspirational, move it to `## Gaps` rather than assert it as-built. Where a `_Verify:_` cannot be written truthfully, flag it for the author.
5. **Re-run AUDIT** until clean.
