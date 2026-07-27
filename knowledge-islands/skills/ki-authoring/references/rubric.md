<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands authoring conventions

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-authoring --write`.

Line-by-line criteria for auditing ki-authoring. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [MD — Markdown authoring](#md--markdown-authoring)
- [OWN — Owned authoring configuration](#own--owned-authoring-configuration)
- [TOML — TOML formatting](#toml--toml-formatting)
- [SYNC — Convention synchronisation](#sync--convention-synchronisation)

## MD — Markdown authoring

→ [standard](standards-markdown.md)

The mechanical Markdown gate and reviewer-applied Markdown conventions.

- **MD-mech [M] — Markdown mechanical gate passes** — `ki repo audit --skill ki-authoring` passes: prose is unwrapped; bullet and quote characters, heading hierarchy, a single H1, spacing, table alignment, resolved links and references, no bare URLs, and descriptive link text satisfy Prettier and markdownlint-cli2, which run directly inside the audit. (standards-authoring.md#markdown-gate, standards-markdown.md#what-to-leave-to-the-linter)
- **MD-table [J] — wide tables are reshaped** — A table with rows that would exceed `printWidth` (160 chars) is reshaped into subheadings or a bulleted definition list; genuinely tabular data with one long column keeps the table and moves that column to footnotes below it. (standards-markdown.md#tables-and-footnotes)
  - _Review prompt:_ Are wide or prose-heavy tables reshaped according to the Markdown convention?
- **MD-footnote [J] — table footnotes use the house marker series** — Footnotes use the marker series `† ‡ § ¶ ‖` (then doubled), reset per table, with a distinct second series `※ ❡ ¤ ¥` where needed; each footnote is a separate paragraph. (standards-markdown.md#footnote-marker-series)
  - _Review prompt:_ Do table footnotes use the documented marker series and paragraph layout?
- **MD-link [J] — house-file links are descriptive and portable** — House-file links are descriptive relative Markdown links rather than wikilinks; paths with spaces use angle brackets. KB note content and agent prompts remain explicitly scoped exceptions. (standards-markdown.md#links)
  - _Review prompt:_ Are the links descriptive, relative Markdown links where this convention applies?
- **MD-cell-prose [J] — tables avoid descriptive prose in cells** — Tables avoid long descriptive prose in cells — that is the footnote’s job. (standards-markdown.md#keeping-tables-skimmable)
  - _Review prompt:_ Do table cells avoid long descriptive prose?
- **MD-callout [J] — callouts use a supported GitHub alert deliberately** — A callout uses the concise GitHub alert form with one supported label (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, or `CAUTION`) and only for a contextual aside, not ordinary prose or a required instruction. (standards-markdown.md#callouts)
  - _Review prompt:_ Are callouts supported GitHub alerts, concise, and reserved for genuine contextual asides?

## OWN — Owned authoring configuration

→ [standard](standards-authoring.md#owned-configuration)

Configuration files wholly owned by the authoring convention.

- **OWN-1 [M] — owned authoring configuration matches the house templates** — The skill owns `.prettierrc.json`, `.editorconfig`, and `.markdownlint-cli2.jsonc` wholly (SHAPE-16 `owns:`): AUDIT warns on drift from the house templates, while CONFORM transactionally scaffolds missing files and overwrites drifted regular files. (standards-authoring.md#owned-configuration)

## TOML — TOML formatting

→ [standard](standards-toml.md)

Reviewer-applied TOML formatting conventions.

- **TOML-keys [J] — TOML keys are concise lowercase nouns** — Keys are lowercase, use `snake_case` for multiple words, and name the noun their value holds (`visibility`, not `repo_visibility_setting`). (standards-toml.md#keys-and-values)
  - _Review prompt:_ Are TOML keys concise lowercase nouns, using snake_case for multiple words?
- **TOML-values [J] — TOML values use the house formatting** — Strings are double-quoted and short lists remain inline (`["a", "b"]`). (standards-toml.md#keys-and-values)
  - _Review prompt:_ Do TOML strings and short lists follow the house formatting?
- **TOML-tables [J] — TOML uses one table per skill** — One table appears per skill, named for that skill, with subtables nested under it; `ki-repo` owns the `.ki-config.toml` contract behind this convention. (standards-toml.md#keys-and-values)
  - _Review prompt:_ Does the TOML use one table per skill with nested subtables where appropriate?
- **TOML-comments [J] — non-obvious TOML keys explain their rationale** — Non-obvious keys carry a preceding `#` comment explaining why they exist. (standards-toml.md#keys-and-values)
  - _Review prompt:_ Do non-obvious TOML keys carry a preceding rationale comment?

## SYNC — Convention synchronisation

→ [standard](standards-authoring.md#synchronisation)

The generated publication and its convention sources remain coherent.

- **SYNC-1 [J] — conventions, rubric, and source record agree** — The convention references, this rubric, and `sources.md` agree; when a convention moves, all three move together. (standards-authoring.md#synchronisation, sources.md)
  - _Review prompt:_ Do the convention references, rubric publication, and source record agree?
