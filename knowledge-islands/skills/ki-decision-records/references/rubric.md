<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric â decision records

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-decision-records --write`.

Line-by-line criteria for auditing ki-decision-records. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC â Generated rubric publication](#rubric--generated-rubric-publication)
- [FILENAME â file and naming checks](#filename--file-and-naming-checks)
- [ROOT â collection-root checks](#root--collection-root-checks)
- [FM â frontmatter checks](#fm--frontmatter-checks)
- [TYPE-FIT â decision classification](#type-fit--decision-classification)
- [BODY â body structure checks](#body--body-structure-checks)
- [INDEX â index checks](#index--index-checks)

## RUBRIC â Generated rubric publication

â [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] â structured catalogue publication is exact** â A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## FILENAME â file and naming checks

â [standard](standards-decision-records.md)

Canonical decision-record filenames and serial namespaces.

- **FILENAME-0 [M] â Every decision-directory Markdown file has a canonical record heading** â Every Markdown file other than the collection index under the selected decisions directory has a parseable `# <PREFIX>-<SCOPE>-NNN: <title>` heading. Files that do not expose an identity are reported rather than silently skipped. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Move supporting material outside the decisions directory or add the canonical Decision Record heading before rerunning the audit.
- **FILENAME-1 [M] â Canonical decision-record filename** â Filename is `<ID>-<title-slug>.md`: the canonical uppercase record ID, a dash, then the title lowercased with each non-alphanumeric run replaced by one dash and leading or trailing dashes removed. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Rename the record to its canonical ID and title slug, then update every affected citation.
- **FILENAME-2 [M] â Unique serial within prefix and scope** â NNN is unique per prefix within its `<SCOPE>` namespace; two files may share the same integer if they carry different prefixes; no two files share the same prefix+scope+serial combination. `XXX` files are exempt from uniqueness. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Choose the canonical record identity, then rename or retire the duplicate and update affected citations.
- **FILENAME-3 [M] â Contiguous serial series** â Within each prefix+scope series the ordinary-record serials start at `001` and are contiguous. A gap is fixed by renumbering the series and sweeping every citation of shifted codes in the same change. `XXX` pending files are exempt. A deliberate verbatim shared-record mirror (`shared_record: true`) is excluded only when its prefix+scope has no ordinary local records; otherwise it remains part of that local series. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Renumber the series contiguously and update every citation of each shifted record ID.

## ROOT â collection-root checks

â [standard](standards-decision-records.md)

The first Decision Record in a newly marked collection adopts the instrument itself.

- **ROOT-1 [M] â Adoption root for a new collection** â An index marked `<!-- ki-decision-records: adoption-root -->` begins with `GDR-<SCOPE>-001: Adopting Decision Records`. Existing unmarked collections are migration cases and are not rewritten automatically. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Create or correct the marked collection root with a human review of its record identity and contents.

## FM â frontmatter checks

â [standard](standards-decision-records.md)

Required universal decision metadata.

- **FM-0 [M] â Decision-record frontmatter** â YAML frontmatter block is present on every decision record. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Add canonical YAML frontmatter using the record body and filename as evidence.
- **FM-3 [M] â No generic type metadata** â Generic `type` and `type_url` fields are absent from a decision record. (standards-decision-records.md)
  - _Remediation:_ automatic
- **FM-4 [M] â Decision type metadata** â `decision_type` and `decision_type_url` fields are present. (standards-decision-records.md)
  - _Remediation:_ automatic
- **FM-5 [M] â Prefix and decision type alignment** â `decision_type` and `decision_type_url` exactly match the canonical values encoded by the filename prefix. This does not prove that the prefix is the right semantic classification. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Align decision-type metadata with the canonical filename prefix after confirming the record classification.
- **FM-6 [M] â Core decision metadata** â `id`, `title`, `date`, and `status` are present; ID and title compose the H1 and date uses YYYY-MM-DD. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Complete the required metadata from the canonical H1, filename, and record type.

## TYPE-FIT â decision classification

â [standard](standards-decision-records.md)

Semantic alignment between a decision and its canonical prefix.

- **TYPE-FIT-1 [J] â Semantic decision classification** â The filename prefix accurately categorises the decision itself; the body makes the type obvious. A mismatch is resolved with a human by choosing the correct canonical record ID or metadata, never by mechanically overwriting either side. (standards-decision-records.md)
  - _Evidence scope:_ The filename prefix, metadata, and body of every active decision record.
  - _Review prompt:_ Assess whether the filename prefix accurately categorises the decision itself without a stretch fit and whether the body makes the type obvious. Resolve a mismatch with a human, never by mechanically overwriting either side.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Agree the canonical classification with the responsible human, record a named Gap, or record an explicit exclusion.

## BODY â body structure checks

â [standard](standards-decision-records.md)

Present-state decision-record structure and writing quality.

- **BODY-1 [M] â Canonical heading** â Heading matches `# <PREFIX>-<SCOPE>-NNN: <title>`; the ID prefix is present and matches the filename. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Align the H1 identifier with the filename and retain the established record identity.
- **BODY-3 [M] â No legacy date line** â A decision record does not carry a legacy bold `**Date:**` line; its date belongs in frontmatter. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Remove the legacy date line after confirming that canonical frontmatter carries the date.
- **BODY-4 [M] â Required decision sections** â `## Context`, `## Decision`, and `## Consequences` sections are all present. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Add the missing canonical section with substantive decision-record content.
- **BODY-5 [J] â Value-neutral context** â Context is value-neutral forces, not advocacy ("the island currently…" not "we need to…"). (standards-decision-records.md)
  - _Evidence scope:_ The Context section of every active decision record.
  - _Review prompt:_ Assess whether Context states value-neutral forces rather than advocacy.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the context to describe observed forces, record a named Gap, or record an explicit exclusion.
- **BODY-6 [J] â Active-voice decision** â Decision is in active voice ("This island adopts…" or "We will…"). (standards-decision-records.md)
  - _Evidence scope:_ The Decision section of every active decision record.
  - _Review prompt:_ Assess whether Decision uses active voice.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Rewrite the decision in active voice, record a named Gap, or record an explicit exclusion.
- **BODY-7 [J] â Substantive sections** â Each section has real, non-placeholder substance. (standards-decision-records.md)
  - _Evidence scope:_ Every required section in every active decision record.
  - _Review prompt:_ Assess whether every required section contains real, non-placeholder substance.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Add substantive content, record a named Gap, or record an explicit exclusion.
- **BODY-8 [J] â Focused length** â Length is one to two pages, roughly 200–500 body words. (standards-decision-records.md)
  - _Evidence scope:_ The body of every active decision record.
  - _Review prompt:_ Assess whether the body is a focused one to two pages, roughly 200–500 words.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Tighten or expand the body while preserving the decision, record a named Gap, or record an explicit exclusion.
- **BODY-9 [J] â Noun-phrase title** â Title is a short noun phrase, not a question or full sentence. (standards-decision-records.md)
  - _Evidence scope:_ The H1 title of every active decision record.
  - _Review prompt:_ Assess whether the title is a short noun phrase rather than a question or full sentence.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Rewrite the title as a concise noun phrase, record a named Gap, or record an explicit exclusion.
- **BODY-10 [J] â Present-state record** â The record is concise, self-contained, and written as now, without historic, superseding, or forward-looking narration. Such content belongs in the ROADMAP or a KB stream, not in a present-state record. (standards-decision-records.md)
  - _Evidence scope:_ The narrative body of every active decision record.
  - _Review prompt:_ Assess whether the record is concise and self-contained, stating the present decision without historic, superseding, forward-looking, parked, or not-yet-started narration.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Move lifecycle narration to its appropriate record, revise to present state, record a named Gap, or record an explicit exclusion.

## INDEX â index checks

â [standard](standards-decision-records.md)

Complete, current, and readable decision-record indexes.

- **INDEX-1 [M] â Decision index exists** â The index file exists (`Decisions.md` in a KB, `README.md` in a code repository). (standards-decision-records.md)
  - _Remediation:_ diagnostic â Create the canonical decision index for this repository or Knowledge Base.
- **INDEX-2 [M] â Exactly one index entry per record** â Every decision-record file has exactly one entry in the index list, linked by ID. (standards-decision-records.md)
  - _Remediation:_ automatic
- **INDEX-3 [M] â No stale index entries** â No index entry references a decision-record file that does not exist. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Remove or correct each stale index entry after confirming the record history.
- **INDEX-4 [M] â Index links resolve to their named record** â Every ordered Decision Record index entry links its displayed record ID to that record’s canonical filename, and decision links are not hidden in unordered bullets or other prose. (standards-decision-records.md)
  - _Remediation:_ automatic
- **INDEX-6 [J] â Reveal order** â Entries are in a sensible reveal order: a from-scratch build narrative with roots first, then dependents, weaving sub-scopes in. (standards-decision-records.md)
  - _Evidence scope:_ The ordered entries of the active decision index.
  - _Review prompt:_ Assess whether index entries form a sensible from-scratch reveal order with roots before dependents.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Reorder the index to improve the reading path, record a named Gap, or record an explicit exclusion.
- **INDEX-7 [J] â Index gloss alignment** â An entry's gloss matches the decision record's heading title, excluding the ID prefix. (standards-decision-records.md)
  - _Evidence scope:_ Every active decision-index entry and its linked record heading.
  - _Review prompt:_ Compare every index gloss with its decision record's heading title, excluding the ID prefix.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Align the gloss with its record heading, record a named Gap, or record an explicit exclusion.
- **INDEX-8 [M] â Ascending serial reveal order** â Within each prefix, serials ascend in reveal order; a higher serial never precedes a lower serial. A violation is fixed by renumbering rather than reordering out of sequence. (standards-decision-records.md)
  - _Remediation:_ diagnostic â Renumber the affected records and citations rather than reordering serials out of sequence.
