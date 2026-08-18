<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Specifications

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-specs --write`.

Line-by-line criteria for auditing ki-specs. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [INDEX — specifications index](#index--specifications-index)
- [AREA — area registration](#area--area-registration)
- [ID — requirement identity](#id--requirement-identity)
- [REQ — normative requirement shape](#req--normative-requirement-shape)
- [VERIFY — verification hooks](#verify--verification-hooks)
- [BEHAVIOUR — behavioural altitude](#behaviour--behavioural-altitude)
- [AS-BUILT — as-built truth](#as-built--as-built-truth)
- [SPLIT — requirement focus](#split--requirement-focus)
- [DR-LINK — decision traceability](#dr-link--decision-traceability)
- [AREA-FIT — area fit](#area-fit--area-fit)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## INDEX — specifications index

→ [standard](standards-specs.md)

The corpus has a populated registry that maps prefixes to area files.

- **INDEX-1 [M] — docs/specs/index.md exists** — `docs/specs/index.md` exists. Missing is a FAIL — there is no registry to validate against. (standards-specs.md)
  - _Remediation:_ diagnostic — Create the Specifications index with an authoritative areas table, then rerun the audit.
- **INDEX-2 [M] — index.md contains a populated areas table** — `index.md` contains at least one areas table with `Prefix` and `File` columns and at least one row. (standards-specs.md)
  - _Remediation:_ diagnostic — Add a populated Prefix and File areas table to the index, then rerun the audit.
- **INDEX-3 [M] — each prefix has one registered area-file owner** — A prefix appears in one areas-table file cell only; duplicate registrations are reported rather than silently overwritten. (standards-specs.md)
  - _Remediation:_ diagnostic — Choose the prefix’s one owning area file and remove the duplicate registration before rerunning the audit.

## AREA — area registration

→ [standard](standards-specs.md)

Area-table files and corpus files agree.

- **AREA-1 [M] — every file named in an areas table exists** — Every file named in an areas table exists as a safe physical file. A missing or unsafe file fails closed because the registry cannot establish its corpus. (standards-specs.md)
  - _Remediation:_ diagnostic — Restore the missing safe area file or correct the areas table, then rerun the audit.
- **AREA-2 [M] — every area file is registered** — Every Markdown file in `docs/specs/`, except `index.md`, is registered under at least one prefix in an areas table. (standards-specs.md)
  - _Remediation:_ diagnostic — Add the area file to the appropriate areas table, then rerun the audit.

## ID — requirement identity

→ [standard](standards-specs.md)

Requirement headings, prefixes, and append-only IDs form a coherent registry.

- **ID-1 [M] — requirement headings use canonical IDs** — Every level-3 heading outside a `## Gaps …` section matches `### <PREFIX>-NNN — <title>`: uppercase prefix, at least a three-digit serial, and an em-dash separator. (standards-specs.md)
  - _Remediation:_ automatic
- **ID-2 [M] — requirement prefixes are registered to their file** — Each requirement's prefix is registered in an areas table and assigned to its containing file. (standards-specs.md)
  - _Remediation:_ diagnostic — Register the prefix to its owning file or correct the requirement identifier, then rerun the audit.
- **ID-3 [M] — requirement IDs are sequential per prefix and unique across the corpus** — Requirement IDs are append-only, sequential within each registered prefix, never reused, and unique across the corpus. (standards-specs.md)
  - _Remediation:_ diagnostic — Allocate the next unused serial for the requirement prefix and update the duplicate or gap, then rerun the audit.

## REQ — normative requirement shape

→ [standard](standards-specs.md)

Active requirements state normative behaviour.

- **REQ-1 [M] — requirements carry an RFC-2119 keyword** — Each active requirement contains an uppercase RFC-2119 keyword so its statement is normative and testable. (standards-specs.md)
  - _Remediation:_ diagnostic — Rewrite the affected requirement with the intended RFC-2119 keyword, then rerun the audit.

## VERIFY — verification hooks

→ [standard](standards-specs.md)

Active requirements carry a verification hook whose quality is reviewed.

- **VERIFY-1 [M] — requirements carry a Verify hook** — Each active requirement has a `_Verify:_` line. (standards-specs.md)
  - _Remediation:_ diagnostic — Add a concrete _Verify:_ hook for the requirement, then rerun the audit.
- **VERIFY-2 [J] — Verify hooks are concrete and checkable** — The `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement. (standards-specs.md)
  - _Evidence scope:_ Every active requirement and its _Verify:_ hook in the Specifications corpus.
  - _Review prompt:_ Assess whether each `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the result as a requirement improvement, a named Gap, or an explicit area-level exclusion.

## BEHAVIOUR — behavioural altitude

→ [standard](standards-specs.md)

Requirements specify behaviour rather than rationale or procedure.

- **BEHAVIOUR-1 [J] — requirements describe behaviour** — A requirement describes behaviour rather than rationale or procedure. (standards-specs.md)
  - _Evidence scope:_ Every numbered requirement and its linked Decision Records or guides.
  - _Review prompt:_ Assess whether each requirement describes behaviour rather than rationale or procedure; move reasoning to a Decision Record and operational instruction to a guide.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Rewrite a non-behavioural requirement, move its reasoning or procedure to the appropriate artifact, or record an explicit area-level exclusion.

## AS-BUILT — as-built truth

→ [standard](standards-specs.md)

The numbered contract describes current system behaviour.

- **AS-BUILT-1 [J] — numbered requirements describe the system today** — Numbered requirements are true of the system today; aspirational behaviour belongs in `## Gaps`. (standards-specs.md)
  - _Evidence scope:_ Every numbered requirement and the current system behaviour it claims.
  - _Review prompt:_ Assess whether each numbered requirement is true of the system today and move aspirational or not-yet-built behaviour to `## Gaps`.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Move unbuilt behaviour to a named Gap or record why the area is explicitly excluded from the review.

## SPLIT — requirement focus

→ [standard](standards-specs.md)

Independently verifiable behaviours have independent IDs.

- **SPLIT-1 [J] — unrelated behaviours use separate IDs** — Unrelated behaviours have separate IDs so each verifies independently. (standards-specs.md)
  - _Evidence scope:_ Every numbered requirement and its stated behaviours and verification hooks.
  - _Review prompt:_ Assess whether a requirement bundles unrelated behaviours that should have separate IDs and verification hooks.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Split independently verifiable behaviours into new requirements, record a named Gap, or record an explicit area-level exclusion.

## DR-LINK — decision traceability

→ [standard](standards-specs.md)

Governed behaviours preserve their link from why to what.

- **DR-LINK-1 [J] — governed requirements cite their Decision Record** — A requirement that follows from a recorded decision cites that Decision Record. (standards-specs.md)
  - _Evidence scope:_ Requirements that follow from a recorded Decision Record and their cited links.
  - _Review prompt:_ Assess whether requirements governed by a recorded decision cite it, preserving the audit trail from why to what.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Add the governing Decision Record link, record a named Gap, or record an explicit area-level exclusion.

## AREA-FIT — area fit

→ [standard](standards-specs.md)

Requirements remain in the area their behaviour belongs to.

- **AREA-FIT-1 [J] — requirements fit their area file** — Each requirement sits in the area file its behaviour belongs to. (standards-specs.md)
  - _Evidence scope:_ Every numbered requirement and its containing Specifications area file.
  - _Review prompt:_ Assess whether each requirement sits in the area its behaviour belongs to; when behaviour changes area, allocate a new ID rather than moving the old number.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the selected outcome and allocate a new requirement identifier where a behaviour belongs to another area.
