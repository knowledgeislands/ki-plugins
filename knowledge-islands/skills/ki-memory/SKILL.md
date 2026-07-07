---
name: ki-memory
description: >
  Governs the Claude Code auto-memory system — the per-project, file-based memory Headroom writes to `~/.claude/projects/<slug>/memory/` plus its `MEMORY.md` index: the four memory types (user/feedback/project/reference), the frontmatter schema, index-file agreement, and the promote-then-delete reconciliation doctrine. Triggers on "audit memory", "memory hygiene", "check MEMORY.md", "auto-memory", "memory frontmatter". Not for a Knowledge Islands base's own memory cascade (`ki-kb-base`'s MEM-2, the root `Admin/MEMORY.md` index of Pillars) — that's KB content read at session start, not the Claude Code session-memory mechanism this skill governs. Not for measuring the token cost of the memory surface — that's `ki-tokenomics`.
argument-hint: 'audit [repo-path] | conform [repo-path] | refresh'
---

# ki-memory

**Standard:** the Claude Code auto-memory convention this harness has standardized on for persistent, cross-session recall — documented in [memory-format.md](references/memory-format.md); line-by-line criteria in [audit-rubric.md](references/audit-rubric.md); tracked sources in [sources.md](references/sources.md).

## What this skill owns

1. **The index/file contract.** Every `memory/*.md` file is listed in `MEMORY.md`, and every `MEMORY.md` entry resolves to a file that exists — the index is a pointer table, not a memory itself.
2. **The frontmatter schema.** `name` (matches the filename slug), `description`, and `metadata.type` ∈ `user` / `feedback` / `project` / `reference`, per [memory-format.md](references/memory-format.md).
3. **The four-type doctrine and reconciliation.** Feedback and project memories carry their **Why** / **How to apply** structure; project memories use absolute dates; content that belongs in a `CLAUDE.md` gets promoted there and the memory deleted, not left to duplicate it.
4. **A mechanical checker** [`scripts/audit-memory.ts`](scripts/audit-memory.ts): resolves a repo's memory directory, checks index/file completeness, frontmatter validity, and duplicate `name:` slugs. Deliberately does **not** flag dangling `[[wikilink]]` cross-references — the auto-memory doctrine treats those as intentional forward references, not errors.

## Operating modes

Carries the universal **AUDIT · CONFORM · REFRESH**. If invoked without a mode, use `AskUserQuestion` to list each with a one-line description.

- **AUDIT** — run the checker, then apply the judgment criteria in [audit-rubric.md](references/audit-rubric.md). Procedure in [mode-audit-conform.md](references/mode-audit-conform.md).
- **CONFORM** — AUDIT, then fix each finding by the rubric, then re-AUDIT. Same procedure file as AUDIT.
- **REFRESH** — re-check [memory-format.md](references/memory-format.md) against Headroom's current memory-feature behavior (an external, versioned spec), per [mode-refresh.md](references/mode-refresh.md).

## Notes

- The memory directory lives **outside the repo tree** (`~/.claude/projects/<repo-absolute-path with "/" → "-">/memory/`), so a repo opts in explicitly via a `[ki-memory]` table in its own `.ki-config.toml` — the usual repo-external-artifact pattern, same as how a KB base is a separate tree from the code repo that governs it.
- A repo with no `memory/` directory yet (never used auto-memory) is a **SKIP**, not a FAIL.
- Composes on `ki-authoring` for the Markdown formatting delta (line wrap, footnote markers) of the memory files themselves; the mechanical-checker contract and severity ladder are `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).
- Does not assume any particular personal `~/.claude/CLAUDE.md` content — the type taxonomy and reconciliation doctrine this skill checks against are the auto-memory system's own universal instructions, not one user's private elaboration of them.
