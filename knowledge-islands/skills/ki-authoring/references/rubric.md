<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands authoring conventions

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-authoring --write`.

Line-by-line criteria for auditing ki-authoring. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [MD — Markdown authoring](#md--markdown-authoring)
- [OWN — Owned authoring configuration](#own--owned-authoring-configuration)
- [TOML — TOML formatting](#toml--toml-formatting)
- [SYNC — Convention synchronisation](#sync--convention-synchronisation)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## MD — Markdown authoring

→ [standard](standards-markdown.md)

The mechanical Markdown gate and reviewer-applied Markdown conventions.

- **MD-mech [M] — Markdown mechanical gate passes** — `ki repo audit --skill ki-authoring` passes: prose is unwrapped; bullet and quote characters, heading hierarchy, a single H1, spacing, resolved references, no bare URLs, and descriptive link text satisfy rumdl, which runs directly inside the audit. Table alignment is not mechanically enforced — no rumdl style reproduces the former conditional padding, so the width conventions in the Markdown standard carry it. (standards-authoring.md#markdown-gate, standards-markdown.md#what-to-leave-to-the-linter)
  - _Remediation:_ automatic
- **MD-frontmatter [M] — frontmatter uses canonical bare-safe scalars** — Markdown frontmatter leaves identifier-like scalar tokens unquoted when their YAML meaning is unchanged; quoted YAML-significant values, dates, numeric-looking values, punctuation, whitespace, and escaped strings remain quoted. (standards-markdown.md#frontmatter)
  - _Remediation:_ automatic
- **MD-table [J] — wide tables are reshaped** — A table with rows that would exceed `printWidth` (120 chars) is reshaped into subheadings or a bulleted definition list; genuinely tabular data with one long column keeps the table and moves that column to footnotes below it. (standards-markdown.md#tables-and-footnotes)
  - _Evidence scope:_ Every authored Markdown table that is wide or contains descriptive prose.
  - _Review prompt:_ Assess whether wide or prose-heavy tables are reshaped according to the Markdown convention.
  - _Outcomes:_ conforming; reshape required; exclusion
  - _Conforming guidance:_ Reshape the table into subheadings or a definition list, move a long column to footnotes, or record why genuinely tabular content is excluded.
- **MD-footnote [J] — table footnotes use the house marker series** — Footnotes use the marker series `† ‡ § ¶ ‖` (then doubled), reset per table, with a distinct second series `※ ❡ ¤ ¥` where needed; each footnote is a separate paragraph. (standards-markdown.md#footnote-marker-series)
  - _Evidence scope:_ Every table footnote in authored Markdown.
  - _Review prompt:_ Assess whether table footnotes use the documented marker series and paragraph layout.
  - _Outcomes:_ conforming; correction required; exclusion
  - _Conforming guidance:_ Use the documented marker series and one paragraph per footnote, or record why the table is excluded.
- **MD-link [J] — house-file links are descriptive and portable** — House-file links are descriptive relative Markdown links rather than wikilinks; paths with spaces use angle brackets. KB note content and agent prompts remain explicitly scoped exceptions. (standards-markdown.md#links)
  - _Evidence scope:_ Every house-file Markdown link outside the explicitly scoped KB-note and agent-prompt exceptions.
  - _Review prompt:_ Assess whether links are descriptive, relative Markdown links where this convention applies.
  - _Outcomes:_ conforming; correction required; scoped exception
  - _Conforming guidance:_ Replace the link with descriptive relative Markdown, use angle brackets for paths with spaces, or record the applicable scoped exception.
- **MD-cell-prose [J] — tables avoid descriptive prose in cells** — Tables avoid long descriptive prose in cells — that is the footnote’s job. (standards-markdown.md#keeping-tables-skimmable)
  - _Evidence scope:_ Every authored Markdown table containing descriptive text.
  - _Review prompt:_ Assess whether table cells avoid long descriptive prose.
  - _Outcomes:_ conforming; move prose required; exclusion
  - _Conforming guidance:_ Move descriptive prose to footnotes or surrounding text, reshape the table, or record why the table is excluded.
- **MD-callout [J] — callouts use a supported GitHub alert deliberately** — A callout uses the concise GitHub alert form with one supported label (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, or `CAUTION`) and only for a contextual aside, not ordinary prose or a required instruction. (standards-markdown.md#callouts)
  - _Evidence scope:_ Every authored Markdown callout.
  - _Review prompt:_ Assess whether callouts use supported GitHub alerts, remain concise, and are reserved for genuine contextual asides.
  - _Outcomes:_ conforming; rewrite required; remove required
  - _Conforming guidance:_ Use a supported concise alert for a genuine aside, rewrite the content as ordinary prose, or remove the callout.

## OWN — Owned authoring configuration

→ [standard](standards-authoring.md#owned-configuration)

Configuration files wholly owned by the authoring convention.

- **OWN-1 [M] — owned authoring configuration matches the house templates** — The skill owns `.editorconfig` and `.rumdl.toml` wholly (SHAPE-16 `owns:`): AUDIT warns on drift from the house templates, while CONFORM transactionally scaffolds missing files and overwrites drifted regular files. A reasoned `owned_file_exceptions` declaration remains a WARN and suppresses only the named regular drifted-file write; it is never a local template. Each template is stored already formatted to the house width so CONFORM output is a fixed point of the governing formatter; a template the repository would reformat leaves every governed repository permanently drifted. (standards-authoring.md#owned-configuration)
  - _Remediation:_ automatic
- **OWN-2 [M] — retired Markdown configuration is absent** — rumdl owns Markdown formatting and linting together, so `.prettierrc.json`, `.prettierignore`, and `.markdownlint-cli2.jsonc` are retired: AUDIT warns while any of them survives and CONFORM removes them. A leftover file is not inert — an editor extension reads it and reformats Markdown against a standard the repository no longer holds, producing drift that the gate then reports without explaining. (standards-authoring.md#owned-configuration)
  - _Remediation:_ automatic

## TOML — TOML formatting

→ [standard](standards-toml.md)

Reviewer-applied TOML formatting conventions.

- **TOML-values [J] — TOML values use the house formatting** — Strings are double-quoted and short lists remain inline (`["a", "b"]`). (standards-toml.md#keys-and-values)
  - _Evidence scope:_ Every authored TOML string and short list in the convention scope.
  - _Review prompt:_ Assess whether TOML strings and short lists follow the house formatting.
  - _Outcomes:_ conforming; reformat required; exception required
  - _Conforming guidance:_ Use double-quoted strings and inline short lists, or record the external-contract exception.
- **TOML-comments [J] — non-obvious TOML keys explain their rationale** — Non-obvious keys carry a preceding `#` comment explaining why they exist. (standards-toml.md#keys-and-values)
  - _Evidence scope:_ Every non-obvious authored TOML key in the convention scope.
  - _Review prompt:_ Assess whether non-obvious TOML keys carry a preceding rationale comment.
  - _Outcomes:_ conforming; comment required; self-evident
  - _Conforming guidance:_ Add a preceding rationale comment or record why the key is self-evident in its local context.

## SYNC — Convention synchronisation

→ [standard](standards-authoring.md#synchronisation)

The generated publication and its convention sources remain coherent.

- **SYNC-1 [J] — conventions, rubric, and source record agree** — The convention references, this rubric, and `sources.md` agree; when a convention moves, all three move together. (standards-authoring.md#synchronisation, sources.md)
  - _Evidence scope:_ The authoring convention references, generated rubric publication, and source record changed by the same concern.
  - _Review prompt:_ Assess whether the convention references, rubric publication, and source record agree.
  - _Outcomes:_ conforming; synchronisation required; review required
  - _Conforming guidance:_ Update the affected canonical source and generated publication together, or record the unresolved source-review question before publishing.
