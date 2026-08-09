<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Claude state housekeeping

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-housekeeping-claude --write`.

Line-by-line criteria for auditing ki-housekeeping-claude. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [IDX — Index/file agreement](#idx--indexfile-agreement)
- [FM — Frontmatter](#fm--frontmatter)
- [LINK — Explicitly not checked](#link--explicitly-not-checked)
- [DOC — Content doctrine](#doc--content-doctrine)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## IDX — Index/file agreement

→ [standard](standards-auto-memory.md)

Memory index and file agreement.

- **IDX-1 [M] — Memory index exists** — `MEMORY.md` exists in each discovered physical memory directory. Missing is a FAIL because a non-empty memory directory without an index is unusable. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Add the required memory index, then rerun the audit.
- **IDX-2 [M] — Index entries resolve** — Every `MEMORY.md` entry in the `- [Title](file.md) — hook` shape resolves to a physical file in the same memory directory. A dangling entry is a FAIL. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Correct the dangling index entry, then rerun the audit.
- **IDX-3 [M] — Memory files are indexed** — Every `memory/*.md` file other than `MEMORY.md` appears in the index. An unindexed file is a WARN because it is invisible to future recall. (standards-auto-memory.md)
  - _Remediation:_ automatic
- **IDX-4 [M-heuristic] — Index line length** — Each index entry stays at or under 150 characters so it is not truncated in context. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Shorten the index entry, then rerun the audit.
- **IDX-5 [M] — Headroom block markers** — A Headroom auto-generated block, if present, has both `<!-- headroom:learn:start -->` and `<!-- headroom:learn:end -->` markers in order. A malformed pair is a WARN. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Correct the memory index entry, then rerun the audit.
- **IDX-6 [M-heuristic] — Headroom learned entries are local** — Entries inside a `headroom:learn` block are not rooted in another repository. A foreign absolute `knowledgeislands/<repo>` path in the selected repository memory is stale cross-repo capture and a WARN. Repair the Headroom database source through the explicit list/show/delete procedure in the standard before clearing rendered output; relative sibling references remain valid. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Correct the index ordering, then rerun the audit.

## FM — Frontmatter

→ [standard](standards-auto-memory.md)

Memory frontmatter requirements.

- **FM-1 [M] — Frontmatter is present** — A `---`-delimited frontmatter block is present at the top of every `memory/*.md` file. Missing is a FAIL. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Add valid frontmatter, then rerun the audit.
- **FM-2 [M] — Frontmatter name matches filename** — The `name` field is present and matches the kebab-case filename without its `.md` suffix. Mismatch is a FAIL. (standards-auto-memory.md)
  - _Remediation:_ automatic
- **FM-3 [M] — Frontmatter description is present** — The `description` field is present and non-empty. Missing is a FAIL. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Add a non-empty description, then rerun the audit.
- **FM-4 [M] — Frontmatter type is valid** — `metadata.type` is present and is exactly one of `user`, `feedback`, `project`, or `reference`. Missing or invalid is a FAIL. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Correct the metadata type, then rerun the audit.
- **FM-5 [M] — Frontmatter names are unique** — No two files share the same `name:` slug. A duplicate is a FAIL. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Resolve duplicate memory names, then rerun the audit.

## LINK — Explicitly not checked

→ [standard](standards-auto-memory.md)

Informational link treatment.

- **LINK-1 [M-heuristic] — Unresolved wikilinks are informational** — `[[wikilink]]` cross-references that do not resolve to another file’s `name:` slug are counted and reported as INFO only because the memory doctrine permits intentional forward references. (standards-auto-memory.md)
  - _Remediation:_ diagnostic — Review the unresolved link and correct it when it is not an intentional forward reference.

## DOC — Content doctrine

→ [standard](standards-auto-memory.md)

Judgment-applied memory content doctrine.

- **DOC-1 [J] — Content doctrine** — `feedback` and `project` memories carry the rule/fact, then a **Why:** line and a **How to apply:** line — not just a bare assertion. (standards-auto-memory.md)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do feedback and project memories carry their rule or fact, Why, and How to apply?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DOC-2 [J] — Content doctrine** — `project` memories use absolute dates, not relative ones ("2026-03-05", not "Thursday"). (standards-auto-memory.md)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do project memories use absolute rather than relative dates?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DOC-3 [J] — Content doctrine** — No memory duplicates content that belongs in a `CLAUDE.md` (codebase conventions, file layout, architecture, anything derivable from the repo or git history). Flag promotion candidates instead of leaving them to drift from the code. (standards-auto-memory.md)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do memories avoid duplicating content that belongs in CLAUDE.md or is derivable from current repository evidence?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DOC-4 [J] — Content doctrine** — `user`-type memories describe role/preferences/knowledge neutrally — no content that reads as a negative judgment of the user. (standards-auto-memory.md)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do user memories describe role, preferences, and knowledge neutrally?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DOC-5 [J] — Content doctrine** — No memory is stale — a `project` memory whose fact or decision has visibly been superseded by current repo state (check against `git log`/current files, not the memory’s own text). (standards-auto-memory.md)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do project memories remain current against repository state and history?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DOC-6 [J] — Semantic index ordering** — `MEMORY.md` entries are organized semantically by topic, not chronologically. (standards-auto-memory.md)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are MEMORY.md entries organised semantically rather than chronologically?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
