# Markdown authoring conventions

The **judgment-layer** rules for the markdown we write across Knowledge Islands repos and bases — the choices a formatter can't make. Everything mechanical (prose wrapping, bullet and quote characters, heading hierarchy, single H1, list spacing) is owned by **Prettier + markdownlint-cli2**; run `bun run ki:lint:md` at the repo root and let it settle those. This file only covers what's left to a person.

## Contents

- [What to leave to the linter](#what-to-leave-to-the-linter)
- [Tables and footnotes](#tables-and-footnotes)
- [Links](#links)
- [Code blocks](#code-blocks)

## What to leave to the linter

Don't hand-apply or document any of these — the toolchain owns them, and restating them here only invites drift when a config changes:

- **Prose wrapping** — Prettier runs with `proseWrap: "never"` and will join any mid-paragraph line break back to a single line. Never insert a line break mid-sentence; the linter will undo it.
- **Bullet, emphasis, and quote characters; trailing commas; blank-line spacing** — Prettier normalises these.
- **Heading hierarchy, single H1, duplicate-heading and list rules** — markdownlint-cli2 flags these.

The one place column width _is_ your job is **tables** — Prettier aligns table columns but will not reflow a row's content. Crucially, Prettier only pads columns when the result fits within `printWidth`; if the widest row would exceed 140 chars, Prettier leaves the table in compact (unpadded) format. So an over-long row blocks column alignment too — that's the first convention below.

## Tables and footnotes

Keep every table **skimmable at a glance**. Prettier pads columns to align them but never breaks a cell across lines, so a cell with too much content forces a very wide row that's unreadable in a terminal or in print. Aim to keep each row within `printWidth` (140 chars — the same limit the formatter enforces on prose).

When a column's content would force the table to wrap awkwardly or demand cryptic abbreviations in the headers, **move the long content into footnotes below the table** and leave a footnote marker in the cell instead.

**Prefer footnotes over** shrinking headers to cryptic abbreviations, wrapping mid-cell, or dropping a useful column. The table stays scannable; the detail sits just below it.

### Footnote marker series

Use these markers in order (Chicago-style, omitting `*` since it collides with markdown emphasis):

1. `†` dagger
2. `‡` double dagger
3. `§` section
4. `¶` pilcrow
5. `‖` parallel
6. then doubled: `††`, `‡‡`, `§§`, `¶¶`, `‖‖`

If a visually distinct **second series** is needed — e.g. to separate "caveats" from "sources" in the same table — use: `※` `❡` `¤` `¥`.

### Example

```markdown
| Repo  | Status | Notes |
| ----- | ------ | ----- |
| alpha | ✅     | †     |
| beta  | ⚠️     | ‡     |

† Migration ran cleanly; post-deploy smoke check still pending review.

‡ Failing on the new schema validator — tracked in LIN-1423, owner @kris.
```

### Gotchas

Learned applying this; bake them in:

1. **Separate every footnote with a blank line.** Adjacent footnote lines without a blank line between them render as a single paragraph — keep each footnote on its own paragraph.
2. **Footnoting a column often isn't enough to reach `printWidth`.** A long `Source` URL still blows the row out; convert such URLs to **reference-style links** (`[text][ref]` in the cell, `[ref]: https://…` definitions collected at the file bottom).
3. **When the long cell is content, not a URL,** reference links don't help — shorten the cell to a short label with a marker and move the full content to a **second-series (`※`) footnote**.
4. **Watch for a pre-existing footnote series.** If a table already uses `†` for something (e.g. a date caveat), give the dominant content series the primary daggers and move the lone caveat to the `※` series so markers don't collide.
5. **Author loosely, then `bun run ki:lint:md`.** Prettier re-aligns table padding (`MD060`) and markdownlint flags `MD052` (undefined reference) until the `[ref]:` defs land — both transient; the pass should end at 0 errors.

## Links

- **Use standard relative markdown links, never Obsidian wikilinks** (`[[…]]`). Wikilinks break the moment a file is relocated, symlinked, or read outside the base; relative markdown links survive it. For a path containing spaces, use the CommonMark angle-bracket form: `[ref](<references/My Detail.md>)`.
- **Never use wikilinks inside table cells.** The display-name form `[[target|Display text]]` contains a `|` that Markdown parsers treat as a column separator, silently breaking the table layout. Use a standard relative markdown link (`[Display text](path/to/file.md)`) instead.
- **Write descriptive link text** — the words you'd skim for, not "click here" or a bare URL. `[the repo standard](…)`, not `[here](…)`.
- **Refer to another skill by its `name`**, never by a file path — "the `ki-kb` skill" — because a skill's location on disk is not stable, but its name is how it loads into the session.
- **In editor / IDE contexts** where the harness asks for clickable references, link files and lines with relative markdown links (`[file.ts:42](src/file.ts#L42)`) rather than bare backtick paths, so the reference is navigable.

## Code blocks

Every fenced code block must carry a **language specifier** — never bare triple backticks.

```bash
# good
echo "hello"
```

Use the closest accurate tag. Common choices: `bash` or `sh` for shell commands; `ts`, `js`, `python`, `go`, etc. for source; `toml`, `yaml`, `json` for config; `text` for literal output that isn't a recognised language. When in doubt, `text` is correct and satisfies the rule — any specifier beats none.

**Why:** language tags enable syntax highlighting in GitHub, rendered docs, and IDE previews; downstream renderers (including the Artifact tool) key off the tag. Bare blocks are the second-most-common authoring friction point after wide tables.
