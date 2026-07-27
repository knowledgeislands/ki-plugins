<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Claude state housekeeping

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-housekeeping --write`.

Line-by-line criteria for auditing ki-housekeeping. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [SELF — Repository-local companion](#self--repository-local-companion)
- [IDX — Index/file agreement](#idx--indexfile-agreement)
- [FM — Frontmatter](#fm--frontmatter)
- [LINK — Explicitly not checked](#link--explicitly-not-checked)
- [DOC — Content doctrine](#doc--content-doctrine)

## SELF — Repository-local companion

→ [standard](standards-claude-state.md)

Repository-local ki-self companion requirements.

- **SELF-1 [M] — Repository-local ki-self source** — The selected repository owns one regular `ki-self` source at `.agents/skills/ki-self/SKILL.md`. Missing is a WARN; a symlink or non-regular source is a FAIL. (standards-claude-state.md)
- **SELF-2 [M] — ki-self source name** — The repository-local source declares `name: ki-self`. A mismatch is a FAIL. (standards-claude-state.md)
- **SELF-3 [M] — Claude runtime projection** — When `claude-code` is declared, `.claude/skills/ki-self` is a relative link to the canonical source. A missing or divergent projection is a FAIL. (standards-claude-state.md)
- **SELF-4 [J] — Local-concerns contract** — The local skill gives its repository an intelligible local-concerns contract: regular work has a repeatable check or procedure; semi-regular human review has a ledger; one-off work remains on the roadmap; cross-repository patterns graduate to a named shared skill. (standards-claude-state.md)
  - _Review prompt:_ Does the local skill distinguish repeatable procedures, semi-regular review, one-off roadmap work, and patterns that should graduate to a shared skill?

## IDX — Index/file agreement

→ [standard](standards-auto-memory.md)

Memory index and file agreement.

- **IDX-1 [M] — Memory index exists** — `MEMORY.md` exists in each discovered physical memory directory. Missing is a FAIL because a non-empty memory directory without an index is unusable. (standards-auto-memory.md)
- **IDX-2 [M] — Index entries resolve** — Every `MEMORY.md` entry in the `- [Title](file.md) — hook` shape resolves to a physical file in the same memory directory. A dangling entry is a FAIL. (standards-auto-memory.md)
- **IDX-3 [M] — Memory files are indexed** — Every `memory/*.md` file other than `MEMORY.md` appears in the index. An unindexed file is a WARN because it is invisible to future recall. (standards-auto-memory.md)
- **IDX-4 [M-heuristic] — Index line length** — Each index entry stays at or under 150 characters so it is not truncated in context. (standards-auto-memory.md)
- **IDX-5 [M] — Headroom block markers** — A Headroom auto-generated block, if present, has both `<!-- headroom:learn:start -->` and `<!-- headroom:learn:end -->` markers in order. A malformed pair is a WARN. (standards-auto-memory.md)
- **IDX-6 [M-heuristic] — Headroom learned entries are local** — Entries inside a `headroom:learn` block are not rooted in another repository. A foreign absolute `knowledgeislands/<repo>` path in the selected repository memory is stale cross-repo capture and a WARN. Repair the Headroom database source through the explicit list/show/delete procedure in the standard before clearing rendered output; relative sibling references remain valid. (standards-auto-memory.md)

## FM — Frontmatter

→ [standard](standards-auto-memory.md)

Memory frontmatter requirements.

- **FM-1 [M] — Frontmatter is present** — A `---`-delimited frontmatter block is present at the top of every `memory/*.md` file. Missing is a FAIL. (standards-auto-memory.md)
- **FM-2 [M] — Frontmatter name matches filename** — The `name` field is present and matches the kebab-case filename without its `.md` suffix. Mismatch is a FAIL. (standards-auto-memory.md)
- **FM-3 [M] — Frontmatter description is present** — The `description` field is present and non-empty. Missing is a FAIL. (standards-auto-memory.md)
- **FM-4 [M] — Frontmatter type is valid** — `metadata.type` is present and is exactly one of `user`, `feedback`, `project`, or `reference`. Missing or invalid is a FAIL. (standards-auto-memory.md)
- **FM-5 [M] — Frontmatter names are unique** — No two files share the same `name:` slug. A duplicate is a FAIL. (standards-auto-memory.md)

## LINK — Explicitly not checked

→ [standard](standards-auto-memory.md)

Informational link treatment.

- **LINK-1 [M-heuristic] — Unresolved wikilinks are informational** — `[[wikilink]]` cross-references that do not resolve to another file’s `name:` slug are counted and reported as INFO only because the memory doctrine permits intentional forward references. (standards-auto-memory.md)

## DOC — Content doctrine

→ [standard](standards-auto-memory.md)

Judgment-applied memory content doctrine.

- **DOC-1 [J] — Content doctrine** — `feedback` and `project` memories carry the rule/fact, then a **Why:** line and a **How to apply:** line — not just a bare assertion. (standards-auto-memory.md)
  - _Review prompt:_ `feedback` and `project` memories carry the rule/fact, then a **Why:** line and a **How to apply:** line — not just a bare assertion.
- **DOC-2 [J] — Content doctrine** — `project` memories use absolute dates, not relative ones ("2026-03-05", not "Thursday"). (standards-auto-memory.md)
  - _Review prompt:_ `project` memories use absolute dates, not relative ones ("2026-03-05", not "Thursday").
- **DOC-3 [J] — Content doctrine** — No memory duplicates content that belongs in a `CLAUDE.md` (codebase conventions, file layout, architecture, anything derivable from the repo or git history). Flag promotion candidates instead of leaving them to drift from the code. (standards-auto-memory.md)
  - _Review prompt:_ No memory duplicates content that belongs in a `CLAUDE.md` (codebase conventions, file layout, architecture, anything derivable from the repo or git history). Flag promotion candidates instead of leaving them to drift from the code.
- **DOC-4 [J] — Content doctrine** — `user`-type memories describe role/preferences/knowledge neutrally — no content that reads as a negative judgment of the user. (standards-auto-memory.md)
  - _Review prompt:_ `user`-type memories describe role/preferences/knowledge neutrally — no content that reads as a negative judgment of the user.
- **DOC-5 [J] — Content doctrine** — No memory is stale — a `project` memory whose fact or decision has visibly been superseded by current repo state (check against `git log`/current files, not the memory’s own text). (standards-auto-memory.md)
  - _Review prompt:_ No memory is stale — a `project` memory whose fact or decision has visibly been superseded by current repo state (check against `git log`/current files, not the memory’s own text).
- **DOC-6 [J] — Semantic index ordering** — `MEMORY.md` entries are organized semantically by topic, not chronologically. (standards-auto-memory.md)
  - _Review prompt:_ `MEMORY.md` entries are organized semantically by topic, not chronologically.
