<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Feature Definitions

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-feature-definitions --write`.

Line-by-line criteria for auditing ki-feature-definitions. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [INDEX — feature index](#index--feature-index)
- [AREA — area registration](#area--area-registration)
- [ID — requirement identity](#id--requirement-identity)
- [REQ — normative requirement shape](#req--normative-requirement-shape)
- [VERIFY — verification hooks](#verify--verification-hooks)
- [BEHAVIOUR — behavioural altitude](#behaviour--behavioural-altitude)
- [AS-BUILT — as-built truth](#as-built--as-built-truth)
- [SPLIT — requirement focus](#split--requirement-focus)
- [DR-LINK — decision traceability](#dr-link--decision-traceability)
- [AREA-FIT — area fit](#area-fit--area-fit)

## INDEX — feature index

→ [standard](standards-feature-definitions.md)

The corpus has a populated registry that maps prefixes to area files.

- **INDEX-1 [M] — docs/features/index.md exists** — `docs/features/index.md` exists. Missing is a FAIL — there is no registry to validate against. (standards-feature-definitions.md)
- **INDEX-2 [M] — index.md contains a populated areas table** — `index.md` contains at least one areas table with `Prefix` and `File` columns and at least one row. (standards-feature-definitions.md)

## AREA — area registration

→ [standard](standards-feature-definitions.md)

Area-table files and corpus files agree.

- **AREA-1 [M] — every file named in an areas table exists** — Every file named in an areas table exists on disk. A missing file is a WARN because the table is ahead of the corpus. (standards-feature-definitions.md)
- **AREA-2 [M] — every area file is registered** — Every Markdown file in `docs/features/`, except `index.md`, is registered under at least one prefix in an areas table. (standards-feature-definitions.md)

## ID — requirement identity

→ [standard](standards-feature-definitions.md)

Requirement headings, prefixes, and append-only IDs form a coherent registry.

- **ID-1 [M] — requirement headings use canonical IDs** — Every level-3 heading outside a `## Gaps …` section matches `### <PREFIX>-NNN — <title>`: uppercase prefix, at least a three-digit serial, and an em-dash separator. (standards-feature-definitions.md)
- **ID-2 [M] — requirement prefixes are registered to their file** — Each requirement's prefix is registered in an areas table and assigned to its containing file. (standards-feature-definitions.md)
- **ID-3 [M] — requirement IDs are unique across the corpus** — Requirement IDs are append-only, never reused, and unique across the corpus. (standards-feature-definitions.md)

## REQ — normative requirement shape

→ [standard](standards-feature-definitions.md)

Active requirements state normative behaviour.

- **REQ-1 [M] — requirements carry an RFC-2119 keyword** — Each active requirement contains an uppercase RFC-2119 keyword so its statement is normative and testable. (standards-feature-definitions.md)

## VERIFY — verification hooks

→ [standard](standards-feature-definitions.md)

Active requirements carry a verification hook whose quality is reviewed.

- **VERIFY-1 [M] — requirements carry a Verify hook** — Each active requirement has a `_Verify:_` line. (standards-feature-definitions.md)
- **VERIFY-2 [J] — Verify hooks are concrete and checkable** — The `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement. (standards-feature-definitions.md)
  - _Review prompt:_ Assess whether each `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement.

## BEHAVIOUR — behavioural altitude

→ [standard](standards-feature-definitions.md)

Requirements specify behaviour rather than rationale or procedure.

- **BEHAVIOUR-1 [J] — requirements describe behaviour** — A requirement describes behaviour rather than rationale or procedure. (standards-feature-definitions.md)
  - _Review prompt:_ Assess whether each requirement describes behaviour rather than rationale or procedure; move reasoning to a Decision Record and operational instruction to a guide.

## AS-BUILT — as-built truth

→ [standard](standards-feature-definitions.md)

The numbered contract describes current system behaviour.

- **AS-BUILT-1 [J] — numbered requirements describe the system today** — Numbered requirements are true of the system today; aspirational behaviour belongs in `## Gaps`. (standards-feature-definitions.md)
  - _Review prompt:_ Assess whether each numbered requirement is true of the system today and move aspirational or not-yet-built behaviour to `## Gaps`.

## SPLIT — requirement focus

→ [standard](standards-feature-definitions.md)

Independently verifiable behaviours have independent IDs.

- **SPLIT-1 [J] — unrelated behaviours use separate IDs** — Unrelated behaviours have separate IDs so each verifies independently. (standards-feature-definitions.md)
  - _Review prompt:_ Assess whether a requirement bundles unrelated behaviours that should have separate IDs and verification hooks.

## DR-LINK — decision traceability

→ [standard](standards-feature-definitions.md)

Governed behaviours preserve their link from why to what.

- **DR-LINK-1 [J] — governed requirements cite their Decision Record** — A requirement that follows from a recorded decision cites that Decision Record. (standards-feature-definitions.md)
  - _Review prompt:_ Assess whether requirements governed by a recorded decision cite it, preserving the audit trail from why to what.

## AREA-FIT — area fit

→ [standard](standards-feature-definitions.md)

Requirements remain in the area their behaviour belongs to.

- **AREA-FIT-1 [J] — requirements fit their area file** — Each requirement sits in the area file its behaviour belongs to. (standards-feature-definitions.md)
  - _Review prompt:_ Assess whether each requirement sits in the area its behaviour belongs to; when behaviour changes area, allocate a new ID rather than moving the old number.
