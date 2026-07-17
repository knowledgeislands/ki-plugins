# Authoring Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated illustrations of the Knowledge Islands authoring conventions in practice. Use these when writing or conforming a document, checking whether a table should spill to footnotes, choosing between link styles, or formatting a `.ki-config.toml` entry. The exemplars show the judgment layer — the choices no formatter makes — annotated to make the reasoning visible. Mechanical rules (line width, prose wrap, heading hierarchy) are owned by Prettier + markdownlint-cli2; run `ki:authoring:conform` for the write pass and `ki:authoring:audit` for the read-only gate.

## Collections

| Source                   | Covers                                                             | Last reviewed |
| ------------------------ | ------------------------------------------------------------------ | ------------- |
| [CommonMark spec][cm]    | The Markdown syntax baseline                                       | 2026-06-21    |
| [Prettier options][pr]   | What the formatter normalises — `proseWrap`, `printWidth` (140)    | 2026-06-21    |
| [markdownlint rules][ml] | The `MDxxx` rules enforced (`MD013` off, `MD060`, `MD051`/`MD052`) | 2026-06-21    |
| [TOML spec][toml]        | TOML syntax for the shared `.ki-config.toml`                       | 2026-06-21    |

[cm]: https://spec.commonmark.org/
[pr]: https://prettier.io/docs/options
[ml]: https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md
[toml]: https://toml.io/en/v1.1.0

## Selected patterns

### Footnote marker series and table spill

When a table column's content would force rows past a comfortable reading width (≈ 100 characters in a terminal), move the long content into footnotes below the table. The correct marker series, in order, is `†` `‡` `§` `¶` `‖` (then doubled: `††` `‡‡` …). Never use `*` — it collides with Markdown emphasis. Markers reset per table. A separate second series (`※` `❡` `¤` `¥`) separates two distinct footnote categories in the same table (e.g. a "source" series and a "caveat" series) so they do not collide.

Each footnote must be separated from its neighbours by a blank line — under `proseWrap: never` Prettier joins adjacent footnote lines into one paragraph otherwise.

```markdown
| Repo  | Branch | Notes |
| ----- | ------ | ----- |
| alpha | main   | †     |
| beta  | main   | ‡     |
| gamma | dev    | §     |

† Migration ran cleanly; post-deploy smoke check passed on 2026-06-20.

‡ Failing on the new schema validator — tracked in LIN-1423, assigned to @kris, ETA end of cycle.

§ Branch `dev` is intentional: this repo ships on its own release cadence and the board has approved the divergence.
```

When the long content is a URL rather than prose, convert it to a **reference-style link** so the cell stays narrow:

```markdown
| Tool         | Purpose | Docs  |
| ------------ | ------- | ----- |
| Prettier     | Format  | [†][] |
| markdownlint | Lint    | [‡][] |

[†]: https://prettier.io/docs/options
[‡]: https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md
```

### Correct relative link style (no wikilinks in skill files)

In `SKILL.md` files and all harness documents, use standard relative Markdown links. Obsidian wikilinks (`[[…]]`) break when a file is relocated, symlinked, or read outside the base, and the `[[target|display text]]` form contains a literal `|` that Markdown parsers treat as a column separator, silently corrupting table layout. Refer to another skill by its `name` in backticks, never by a file path — skill locations on disk are not stable.

```markdown
<!-- Correct: relative Markdown link -->

See [the rubric](references/audit-rubric.md) for the line-by-line criteria.

<!-- Correct: path with spaces uses angle-bracket form -->

See [the enactment process](<../Processes/Enactment Process/Enactment Process.md>).

<!-- Correct: cross-skill reference by name, not path -->

For KB note conventions use the `ki-kb` skill.

<!-- Wrong: wikilink — breaks outside Obsidian and corrupts tables -->

See [[audit-rubric|the rubric]].

<!-- Wrong: file path reference for a skill -->

See `skills/repo-structure/ki-kb/SKILL.md` for KB conventions.
```

### Well-formed `.ki-config.toml` table

Keys are lowercase `snake_case`. Strings are double-quoted. Arrays use the inline `["a", "b"]` form for short lists. One table per skill, named for the skill (`[ki-repo]`), with sub-tables nested under it. Comment non-obvious keys with a `#` line above them — the _why_, not the _what_. The contract behind what each table means (the one-table-per-skill model, validate-your-own-table protocol) lives in `ki-repo`'s `ki-config-standard.md`; this pattern covers formatting only.

```toml
[ki-repo]
visibility = "public"

# Branch protection is opt-in; most repos leave this off.
[ki-repo.checks]
branch-protection = true

[ki-engineering]
node_version = "22"
lint_paths = ["src", "scripts"]

[ki-kb]
zones = ["Pillars", "Admin", "Reference"]
# default_zone controls where new notes land when no zone is specified.
default_zone = "Pillars"
```
