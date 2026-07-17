# Feature Definitions — audit rubric

Line-by-line pass/fail items for auditing a `docs/features/` corpus against the [format standard](feature-format.md). Run [`../scripts/audit.ts`](../scripts/audit.ts) for the mechanical items (marked **[M]**), then apply the judgment items (**[J]**) by reading. Findings grade on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / NA / PASS — see `ki-engineering`'s [checker-contract.md](../../../foundations/ki-engineering/references/checker-contract.md)); the checker exits non-zero on any FAIL.

## Mechanical [M]

- **INDEX-1 [M]** `docs/features/index.md` exists. Missing is a **FAIL** — there is no registry to validate against.
- **INDEX-2 [M]** `index.md` contains at least one areas table (a table with `Prefix` and `File` columns) with ≥ 1 row. No table is a **FAIL**.
- **AREA-1 [M]** Every file named in an areas table exists on disk. A missing file is a **WARN** (the table is ahead of the corpus).
- **AREA-2 [M]** Every `*.md` in `docs/features/` (except `index.md`) is registered under at least one prefix in an areas table. An unregistered file is a **WARN**.
- **ID-1 [M]** Every level-3 heading outside a `## Gaps …` section matches `### <PREFIX>-NNN — <title>` (multi-segment uppercase prefix, ≥ 3-digit serial, em-dash separator). A non-conforming H3 is a **FAIL**.
- **ID-2 [M]** Each requirement's prefix is registered in an areas table, and to **this** file. An unregistered prefix, or a prefix registered to a different file, is a **FAIL**.
- **ID-3 [M]** IDs are unique across the corpus (append-only, never reused). A duplicate `<PREFIX>-NNN` is a **WARN**.
- **REQ-1 [M]** Each non-deprecated requirement's body carries an RFC-2119 keyword (`MUST` / `SHOULD` / `MAY` …, uppercase). None is a **FAIL** — a requirement with no normative verb is not testable.
- **VERIFY-1 [M]** Each non-deprecated requirement has a `_Verify:_` line. Missing is a **WARN**.

A `## Gaps …` section and any requirement whose title carries `(deprecated)` or leading `~~` are **exempt** from ID-1, REQ-1, and VERIFY-1.

## Judgment [J]

- **BEHAVIOUR-1 [J]** The statement describes **behaviour**, not rationale (that is a DR) or procedure (that is a guide). A requirement that explains _why_ should move the reasoning to a Decision Record and cite it.
- **AS-BUILT-1 [J]** The numbered requirement is **true of the system today**. Aspirational or not-yet-built behaviour belongs in `## Gaps`, not in the numbered contract.
- **VERIFY-2 [J]** The `_Verify:_` hook is **concrete and checkable** — a built-output assertion, a named test, or a linked source symbol — not a restatement of the requirement.
- **SPLIT-1 [J]** A heading that bundles several unrelated behaviours should split into separate IDs so each verifies independently.
- **DR-LINK-1 [J]** A requirement that follows from a recorded decision **cites its DR**. Absence is not a mechanical failure, but a governed behaviour with no link is a gap in the audit trail from why to what.
- **AREA-FIT-1 [J]** Each requirement sits in the area file its prefix belongs to; a requirement that has drifted to the wrong area should move (and, if its behaviour changed area, take a new ID in the right prefix rather than moving the number).
