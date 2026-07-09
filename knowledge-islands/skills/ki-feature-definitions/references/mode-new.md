# Mode NEW — draft a new requirement or area

On-demand procedure for adding to a Feature Definitions corpus. The standard is in [feature-format.md](feature-format.md); shapes to copy are in [exemplars.md](exemplars.md).

## Adding a requirement to an existing area

1. **Pick the area file** by prefix from the `index.md` areas table. The requirement lives in the file its prefix belongs to.
2. **Allocate the next serial** — the highest existing `NNN` for that prefix **+ 1**, zero-padded to ≥ 3 digits. Never reuse a retired number, even if a gap exists in the sequence.
3. **Write the heading** — `### <PREFIX>-NNN — <short title>` under the appropriate `## <sub-area>` H2.
4. **Write one normative statement** — behaviour only, an uppercase RFC-2119 keyword (`MUST` / `SHOULD` / `MAY`), no rationale. If the behaviour follows from a decision, cite the DR inline.
5. **Write the `_Verify:_` line** — a concrete, checkable hook: a built-output assertion, a named test, or a linked source symbol. If you cannot state a truthful verification, the behaviour is probably not as-built yet — put it in `## Gaps` instead.
6. **Run the checker** — `bun run ki:feature-definitions:audit` (or the script directly) and confirm clean.

## Adding a new area

1. **Choose a prefix** — one or more uppercase alpha-leading segments, unique across the corpus (not already in the areas table).
2. **Create the area file** `docs/features/<area>.md` with an H1 `# <Title> — <PREFIX>`, a one-paragraph scope blurb linking back to `index.md`, then the requirements.
3. **Register it** — add a row to the appropriate areas table in `index.md` (`File`, `Prefix`, and any `Covers` column). A file may host several prefixes; list each.
4. **Seed the first requirements** as above, and add a `## Gaps` section for the backlog.
5. **Run the checker** and confirm clean.

## Promoting a gap

A `## Gaps` bullet becomes a numbered requirement **only once the behaviour is built and true**. Move it out of Gaps, give it the next serial for its prefix, write the normative statement and `_Verify:_` hook, and delete the bullet.
