# Authoring Exemplars

## Contents

- [Selected patterns](#selected-patterns)

Curated illustrations of the Knowledge Islands authoring conventions in practice. Use these when writing or conforming a document, checking whether a table should spill to footnotes, choosing between link styles, or formatting a `.ki.toml` entry. The exemplars show the judgment layer — the choices no formatter makes — annotated to make the reasoning visible. Mechanical rules (prose wrap, heading hierarchy, list and emphasis characters) are owned by rumdl; run `ki repo conform --skill ki-authoring` for the write pass and `ki repo audit --skill ki-authoring` for the read-only gate.

## Selected patterns

### Footnote marker series and table spill

When a table column's content would force rows past a comfortable reading width (≈ 100 characters in a terminal), move the long content into footnotes below the table. The correct marker series, in order, is `†` `‡` `§` `¶` `‖` (then doubled: `††` `‡‡` …). Never use `*` — it collides with Markdown emphasis. Markers reset per table. A separate second series (`※` `❡` `¤` `¥`) separates two distinct footnote categories in the same table (e.g. a "source" series and a "caveat" series) so they do not collide.

Each footnote must be separated from its neighbours by a blank line — otherwise rumdl joins adjacent footnote lines into one paragraph.

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
| Tool  | Purpose            | Docs  |
| ----- | ------------------ | ----- |
| rumdl | Markdown           | [†][] |
| Biome | TypeScript + JSON  | [‡][] |

[†]: https://rumdl.dev/rules
[‡]: https://biomejs.dev/reference/configuration/
```

### Correct relative link style (no wikilinks in skill files)

In `SKILL.md` files and all harness documents, use standard relative Markdown links. Obsidian wikilinks (`[[…]]`) break when a file is relocated, symlinked, or read outside the base, and the `[[target|display text]]` form contains a literal `|` that Markdown parsers treat as a column separator, silently corrupting table layout. Refer to another skill by its `name` in backticks, never by a file path — skill locations on disk are not stable.

```markdown
<!-- Correct: relative Markdown link -->

See [the rubric](references/rubric.md) for the line-by-line criteria.

<!-- Correct: path with spaces uses angle-bracket form -->

See [the enactment process](<../Processes/Enactment Process/Enactment Process.md>).

<!-- Correct: cross-skill reference by name, not path -->

For KB note conventions use the `ki-repo-kb` skill.

<!-- Wrong: wikilink — breaks outside Obsidian and corrupts tables -->

See [[audit-rubric|the rubric]].

<!-- Wrong: file path reference for a skill -->

See `skills/repo-structure/ki-repo-kb/SKILL.md` for KB conventions.
```

### Well-formed `.ki.toml` structure

Keys are lowercase `snake_case`. Strings are double-quoted. Arrays use the inline `["a", "b"]` form for short lists. One explicit table per skill names the owner (`[skills.ki-repo]`); short subordinate maps use dotted keys under that root, while complex records may use nested tables. Comment non-obvious values with their _why_, not their _what_. A substantial file uses only the navigational neighbourhoods it needs and leaves the exact conformance header first. The contract behind table identity, neighbourhood meaning, and the validate-your-own-table protocol belongs to the `ki-repo` skill; this pattern covers presentation.

```toml
# Knowledge Islands repository configuration.
# Its presence declares conformance with the Knowledge Islands repository standard.

# =============================================================================

# -----------------------------------------------------------------------------
# Foundation
# -----------------------------------------------------------------------------

[repo]
harnesses = ["knowledgeislands/ki-agentic-harness"]

[skills.ki-repo]
repository = "https://github.com/owner/repository"
visibility = "public"

# Branch protection is opt-in; most repos leave this off.
checks.branch-protection = true

[skills.ki-authoring]

# -----------------------------------------------------------------------------
# Repository shape
# -----------------------------------------------------------------------------

[skills.ki-repo-project]

# -----------------------------------------------------------------------------
# Change management
# -----------------------------------------------------------------------------

[skills.ki-work]
adapter = "roadmap"

[skills.ki-work-roadmap]
areas.CORE = "foundation-tooling"

# -----------------------------------------------------------------------------
# Relationships
# -----------------------------------------------------------------------------

[skills.ki-agora]
memberships.ki-all = { home = "https://github.com/knowledgeislands/ki-agentic-harness", role = "maintainer" }

[skills.ki-trades]
routes."knowledgeislands/tools-ki" = { export = ["work", "knowledge"], import = ["knowledge"] }
```
