---
name: ki-housekeeping
implies: []
description: >
  Governs the hygiene of accumulated Claude state on a machine — the files Claude Desktop / Cowork sessions, Claude Code (`~/.claude/`), and VSCode chat sessions leave behind: stored sessions, artifacts and outputs, backups, plugins, project cache, and per-project auto-memory. Owns the standard and the judgment; the paired `mcp-claude-housekeeping` MCP server is its mechanical arm (codified per-area filesystem audits + access-gated cleanup tools). The memory area also carries a local checker (`audit-memory.ts`): the `memory/*.md` + `MEMORY.md` format, the four types (user/feedback/project/reference), index agreement, and promote-then-delete reconciliation. Triggers: "audit memory", "memory hygiene", "clean up Claude storage", "obsolete Cowork sessions", "housekeeping audit", "check ~/.claude". Not a Knowledge Islands base's own memory cascade (`ki-kb`'s MEM-2, the root `Admin/MEMORY.md`) — that is KB content, not machine state. Not the token cost of the context surface — that is `ki-tokenomics`.
argument-hint: 'audit [repo-path] | conform [repo-path] | refresh'
---

# ki-housekeeping

**Standard:** the hygiene of accumulated Claude state across the surfaces where it collects — the areas and the skill↔server pairing in [housekeeping-standard.md](references/housekeeping-standard.md); the memory area's file format in [memory-format.md](references/memory-format.md); line-by-line criteria in [audit-rubric.md](references/audit-rubric.md); tracked sources in [sources.md](references/sources.md).

## What this skill owns

The **standard and judgment** over the state Claude accumulates on a machine, across three surfaces — Claude Desktop / Cowork sessions, Claude Code (`~/.claude/`), and VSCode chat sessions — spanning the areas: **sessions**, **artifacts / outputs**, **backups**, **plugins**, **project cache**, and **auto-memory**. Full model in [housekeeping-standard.md](references/housekeeping-standard.md).

The **mechanical arm** is split by area:

1. **Memory** — governed locally, in full. The index/file contract (every `memory/*.md` listed in `MEMORY.md`, every entry resolving to a file), the frontmatter schema (`name` / `description` / `metadata.type` ∈ `user` / `feedback` / `project` / `reference`), the four-type doctrine and promote-then-delete reconciliation, checked by [`scripts/audit-memory.ts`](scripts/audit-memory.ts). Detail in [memory-format.md](references/memory-format.md).
2. **Every other area** — the mechanical arm is the paired **`mcp-claude-housekeeping`** MCP server (`@knowledgeislands/mcp-claude-housekeeping`): its codified per-surface audits (e.g. the Cowork filesystem audit) and its access-gated read/destructive tools. The skill states what healthy looks like and applies judgment over the server's findings; the server holds the macOS-filesystem tools that gather them. This skill never re-implements those tools — the pairing is skill-as-standard, server-as-tools.

## Operating modes

Carries **AUDIT · CONFORM · REFRESH**. If invoked without a mode, use `AskUserQuestion` to list each with a one-line description.

- **AUDIT** — for the memory area run `audit-memory.ts`; for the other areas run the `mcp-claude-housekeeping` server's codified audits (its audit tools / reports); then apply the judgment criteria in [audit-rubric.md](references/audit-rubric.md). Procedure in [mode-audit-conform.md](references/mode-audit-conform.md).
- **CONFORM** — AUDIT, then fix each finding: memory in place per the rubric; other areas via the server's access-gated cleanup tools (destructive tools require the server's access level). Re-AUDIT until clean. Same procedure file as AUDIT.
- **REFRESH** — re-check the standard against its sources: Headroom's memory-feature behavior for the memory format, and the `mcp-claude-housekeeping` server's tool surface for the other areas, per [mode-refresh.md](references/mode-refresh.md).

## Notes

- The state this skill governs lives **outside the repo tree** — under `~/.claude/`, `~/Library/Application Support/Claude/`, and VSCode's `workspaceStorage/`. A repo opts a machine into the memory-area check via a `[ki-housekeeping]` table in its `.ki-config.toml`; the session / artifact / storage areas are machine-level and audited directly through the server, not per-repo.
- A repo with no `memory/` directory yet (never used auto-memory) is a **SKIP**, not a FAIL.
- Composes on `ki-authoring` for the Markdown formatting delta of the memory files; the mechanical-checker contract and severity ladder are `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).
- Does not assume any particular personal `~/.claude/CLAUDE.md` content — the doctrines checked are the systems' own universal instructions, not one user's private elaboration of them.
