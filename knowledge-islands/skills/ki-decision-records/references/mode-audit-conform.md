# Modes AUDIT and CONFORM

_On-demand procedure for decision-records' AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The format standard, prefix table, naming convention, status lifecycle, index rule, and placement rule live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

## Mode AUDIT — check DRs against the standard

1. **Run the mechanical checker**: `bun <skill>/scripts/audit-drs.ts <dir>` where `<dir>` is the decisions directory (`docs/decisions/` for code repos; `Admin/Governance/Decisions/` for KB repos). It auto-detects KB vs code mode from `.ki-config.toml`. Findings graded on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / SKIP / PASS — see `ki-engineering`'s [checker-contract.md](../../ki-engineering/references/checker-contract.md)); exits non-zero on any FAIL. Capture its output verbatim.
2. **Apply the judgment items** in [the rubric](audit-rubric.md): sections have real substance, Context is value-neutral forces, Decision is in active voice, each DR is one to two pages, prefix correctly reflects the decision type.
3. **Report** by `DR · check · fix`, lead with FAILs.

## Mode CONFORM — bring DRs into line

1. Run **AUDIT** first.
2. **File renames** — if a filename or prefix does not match, confirm with the user before renaming (a rename changes the canonical ID).
3. **Section repairs** — add missing section stubs; leave content for the author.
4. **Index repair** — add missing rows, correct stale statuses, restore filename ordering.
5. **Superseded links** — confirm bidirectional references: the superseded record's `**Status:**` reads `Superseded by <ID>` and the new record carries a `Supersedes <ID>` line.
6. Re-run **AUDIT** to confirm convergence.
