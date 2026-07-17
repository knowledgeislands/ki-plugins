# Housekeeping audit rubric — the memory area

Used by Mode AUDIT. These are the criteria for the **memory area**, the one area governed locally in full (see [housekeeping-standard.md](housekeeping-standard.md) §2). The **other areas** (sessions, artifacts / outputs, backups, plugins, project cache) are audited through the paired `mcp-claude-housekeeping` server's codified per-surface audits, not by these criteria; the skill applies judgment over the server's findings.

**[M]** = mechanical, checker-enforced (see [`scripts/audit.ts`](../scripts/audit.ts)). **[J]** = judgment, applied by reading; the checker may surface these as ADVISORY but never FAILs or WARNs on them.

## Index/file agreement

- **[M] IDX-1** `MEMORY.md` exists in the resolved memory directory. Missing is a FAIL (a non-empty `memory/` with no index is unusable).
- **[M] IDX-2** Every `MEMORY.md` entry (`- [Title](file.md) — hook`) resolves to a file that exists in the directory. A dangling entry is a FAIL.
- **[M] IDX-3** Every `memory/*.md` file (other than `MEMORY.md` itself) appears as an entry in the index. An unindexed file is a WARN (it's invisible to future recall until indexed).
- **[M] IDX-4** Each index line stays at or under 150 characters. Over is a POLISH.
- **[M] IDX-5** The Headroom auto-generated block, if present, has both `<!-- headroom:learn:start -->` and `<!-- headroom:learn:end -->` markers, in order. A malformed pair is a WARN.
- **[M] IDX-6** Entries _inside_ the `headroom:learn` block are not rooted in another repo. `headroom learn` captures patterns from whatever island the session ran in, so an absolute `knowledgeislands/<repo>` path whose `<repo>` differs from the audited repo is a stale cross-repo capture — dead weight in the always-on prefix. Any such line is a WARN and routes to CONFORM. Do not treat a hand-edit of the generated block as durable: select the Headroom database explicitly, locate the USER-scope record with `headroom memory list --db-path`, verify it with `memory show`, then remove the confirmed source with `memory delete`; re-learn in the correct repo when the pattern remains useful. The full show-before-delete procedure is in [memory-format.md](memory-format.md#repairing-a-regenerated-cross-repo-learned-pattern). Scoped to inside the markers, the heuristic keys on absolute KI-sibling roots and deliberately leaves relative `../sibling` refs alone, because a cross-repo governance repo uses those legitimately.

## Frontmatter

- **[M] FM-1** Frontmatter block (`---` delimited) is present at the top of every `memory/*.md` file. Missing is a FAIL.
- **[M] FM-2** `name` field is present and matches the filename (minus `.md`), kebab-case. Mismatch is a FAIL.
- **[M] FM-3** `description` field is present and non-empty. Missing is a FAIL.
- **[M] FM-4** `metadata.type` is present and is exactly one of `user`, `feedback`, `project`, `reference`. Missing or invalid is a FAIL.
- **[M] FM-5** No two files share the same `name:` slug. A duplicate is a FAIL.

## Explicitly not checked

- **[INFO] LINK-1** `[[wikilink]]` cross-references that don't resolve to another file's `name:` slug are counted and reported as INFO only — the doctrine treats these as intentional forward references, not defects.

## Content doctrine (judgment)

- **[J] DOC-1** `feedback` and `project` memories carry the rule/fact, then a **Why:** line and a **How to apply:** line — not just a bare assertion.
- **[J] DOC-2** `project` memories use absolute dates, not relative ones ("2026-03-05", not "Thursday").
- **[J] DOC-3** No memory duplicates content that belongs in a `CLAUDE.md` (codebase conventions, file layout, architecture, anything derivable from the repo or git history). Flag promotion candidates instead of leaving them to drift from the code.
- **[J] DOC-4** `user`-type memories describe role/preferences/knowledge neutrally — no content that reads as a negative judgment of the user.
- **[J] DOC-5** No memory is stale — a `project` memory whose fact or decision has visibly been superseded by current repo state (check against `git log`/current files, not the memory's own text).
- **[J] DOC-6** `MEMORY.md` entries are organized semantically by topic, not chronologically.
