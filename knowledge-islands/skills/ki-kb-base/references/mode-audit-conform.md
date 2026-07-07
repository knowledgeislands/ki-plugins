# Modes AUDIT and CONFORM

_On-demand procedure for kb's AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The shared model — the five-zone structure, routing test, memory cascade, project bindings, and Step 1 (Load context) — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

## Mode AUDIT — check the base against the structure model

1. **Run the mechanical checker** - `bun scripts/audit-kb.ts <base-path>` (from this skill's directory). It reports the deterministic layer on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / SKIP / PASS — see `ki-engineering`'s enforcement-framework §2) and exits non-zero on any FAIL: the five zones present (resolved through any `[ki-kb-base.zones]` alias), a same-name index note per zone, the root `Admin/MEMORY.md`, the base's own `[ki-kb-base]` table validated _down_, and note frontmatter (well-formed `---` fences, snake_case keys, and any keys declared in `required_frontmatter`). With `--json` / `--report` it emits machine-readable findings and writes the latest report to the base's `.ki-meta/audits/kb.{md,json}`. Capture its output; do not re-derive what it checks.
2. **Apply the judgment layer by reading** - the **[J]** criteria in [the rubric](audit-rubric.md) that the script cannot judge: notes filed in the wrong zone (per the routing test), _whether a note should carry frontmatter at all_ and its naming quality, whether the memory index's active-Pillar list is actually accurate, and fact-vs-analysis labelling where the base distinguishes them.
3. **Compose sibling audits.** A base audit is not just kb's: also run the audit of every other skill that governs this base and is in play — notably `ki-kb-streams` (`ki:kb-streams:audit`, the Streams zone + the Enactment gate) and `ki-authoring` over its markdown. Report them together; a base is "clean" only when each applicable skill's audit is.
4. **Report** drift, leading with FAILs then WARNs: misrouted or mis-zoned notes, missing zones, notes lacking required frontmatter, stale memory-index entries. Cite paths and give the fix.

## Mode CONFORM — bring the base into line

1. Run **AUDIT** first for the gap list.
2. Apply the fixes: refile misrouted notes (per the routing test), create any missing zone, repair note frontmatter and naming, reconcile the memory index. Confirm before moving or rewriting notes. For any `admin` WARN about missing subdivisions, create the missing `Admin/Governance/` or `Admin/Operations/` folder and its stub index note only if the base has notes that belong there — do not create empty structural folders. If `Admin/Governance/` exists but `Charter.md` or `Conformance.md` is absent, create stubs: Charter with headings (Purpose, Scope, Owner, Established); Conformance with a skill-table stub (Skill | Adoption date | Notes). Confirm with the user before creating — these are base-owner documents, not auto-maintained.
3. **Install the memory-cascade anchor if `MEM-2` flagged it missing**: add a standing line to the base's `CLAUDE.md` / `AGENTS.md` naming the root `MEMORY` index and the scope-before-work rule — otherwise the cascade is skipped on a plain request. Likewise apply any sibling skill's CONFORM (e.g. `ki-kb-streams` for the gate anchor), since a base audit composes them.
4. Re-run **AUDIT** until it is clean.
