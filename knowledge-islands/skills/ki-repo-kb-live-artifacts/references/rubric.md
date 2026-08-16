<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands live artifacts

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-kb-live-artifacts --write`.

Line-by-line criteria for auditing ki-repo-kb-live-artifacts. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [LA — artifact structure](#la--artifact-structure)
- [LA-F — artifact frontmatter](#la-f--artifact-frontmatter)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## LA — artifact structure

→ [standard](standards-live-artifacts.md)

Artifact pairing, index, freshness, and judgment prompts.

- **LA-S-0 [M] — safe artifact configuration** — The artifact table parses and any configured directory remains beneath the base without symlink traversal. (standards-live-artifacts.md)
  - _Remediation:_ diagnostic — Correct the artifact configuration before auditing or proposing changes.
- **LA-S-1 [M] — artifact index** — The index note exists when artifact sources are present and may safely gain omitted source names. (standards-live-artifacts.md)
  - _Remediation:_ automatic
- **LA-S-2 [M] — published sources** — Every Markdown artifact has a same-stem HTML render. (standards-live-artifacts.md)
  - _Remediation:_ diagnostic — Render or correct the artifact source through the responsible owner.
- **LA-S-3 [M] — orphaned renders** — Every HTML render has a same-stem Markdown source. (standards-live-artifacts.md)
  - _Remediation:_ diagnostic — Restore or retire the orphaned render through the responsible owner.
- **LA-S-4 [M] — render freshness** — Each HTML render is no older than the configured threshold behind its Markdown source. (standards-live-artifacts.md)
  - _Remediation:_ diagnostic — Refresh the rendered artifact through the responsible owner.
- **LA-J-1 [J] — useful index descriptions** — The index accurately lists active artifacts with useful one-line descriptions. (standards-live-artifacts.md)
  - _Evidence scope:_ The live-artifact index and every active artifact.
  - _Review prompt:_ Does the index accurately list every active artifact with a useful one-line description?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Correct the index, record a named gap, or record an explicit justified exclusion.
- **LA-J-2 [J] — Markdown authority** — Markdown is the authoritative source and no content exists only in HTML. (standards-live-artifacts.md)
  - _Evidence scope:_ Every Markdown live artifact and its rendered representation.
  - _Review prompt:_ Is each Markdown artifact authoritative, with no essential content present only in its HTML render?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Restore Markdown authority, record a named gap, or record an explicit justified exclusion.
- **LA-J-3 [J] — archive rationale** — Archived artifacts retain when-and-why context rather than disappearing silently. (standards-live-artifacts.md)
  - _Evidence scope:_ Every archived live artifact and its retained rationale.
  - _Review prompt:_ Do archived artifacts retain a clear when-and-why rationale rather than disappearing silently?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Add the retained rationale, record a named gap, or record an explicit justified exclusion.
- **LA-J-4 [J] — stable artifact names** — Artifact names are descriptive and stable for published links. (standards-live-artifacts.md)
  - _Evidence scope:_ Every active and archived artifact filename and its published links.
  - _Review prompt:_ Are artifact names descriptive and stable enough to preserve published links?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Rename only with responsible-owner approval and preserve links; otherwise record a gap or explicit exclusion.

## LA-F — artifact frontmatter

→ [standard](standards-live-artifacts.md)

Required metadata on Markdown artifact sources.

- **LA-F-1 [M] — artifact status** — Each artifact source declares status: active or status: archived. (standards-live-artifacts.md)
  - _Remediation:_ diagnostic — Correct the artifact status from authoritative live-artifact evidence.
- **LA-F-2 [M] — render declaration** — Each frontmatter block includes html in its renders declaration. (standards-live-artifacts.md)
  - _Remediation:_ automatic
- **LA-F-3 [M] — artifact owner** — Each artifact source declares the author who owns and maintains it. (standards-live-artifacts.md)
  - _Remediation:_ diagnostic — Correct the artifact owner through the responsible author.
