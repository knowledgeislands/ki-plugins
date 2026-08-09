---
name: ki-housekeeping-claude
ki-kind: governance
ki-depends-on: []
ki-runtime-binding: true
ki-supported-runtimes: [claude-code]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Governs accumulated Claude state from Desktop, Cowork, Claude Code (`~/.claude/`), and VSCode chat: sessions, artifacts, backups, plugins, project cache, and the selected repository's auto-memory. Owns the standard and judgment; the paired `mcp-claude-housekeeping` server provides per-area audits and access-gated cleanup tools. Its memory rubric covers `memory/*.md`, `MEMORY.md`, the four memory types, index agreement, and promote-then-delete reconciliation. Triggers: "audit Claude memory", "Claude memory hygiene", "clean up Claude storage", "obsolete Cowork sessions", "Claude housekeeping audit", "check ~/.claude". Not a Knowledge Islands base memory cascade (`ki-repo-kb`) or context cost (`ki-tokenomics`).
argument-hint: 'audit | conform | help | educate | refresh'
---

# ki-housekeeping-claude

**Standard:** the hygiene of accumulated Claude state across the surfaces where it collects — the areas and the skill↔server pairing in [the Claude-state standard](references/standards-claude-state.md); the memory area's file format in [the auto-memory standard](references/standards-auto-memory.md); line-by-line criteria in [the rubric](references/rubric.md); tracked provenance in [sources](references/sources.md). The standards embed the two exact canonical shapes (directory/index and frontmatter), so this skill intentionally needs no separate exemplars file.

## What this skill owns

The **standard and judgment** over the state Claude accumulates on a machine, across three surfaces — Claude Desktop / Cowork sessions, Claude Code (`~/.claude/`), and VSCode chat sessions — spanning the areas: **sessions**, **artifacts / outputs**, **backups**, **plugins**, **project cache**, and **auto-memory**. Full model in [the Claude-state standard](references/standards-claude-state.md).

The **mechanical arm** is split by area:

1. **Memory** — governed locally, in full, for the selected repository's physical `~/.claude/projects/<selected-repository-slug>/memory/` directory only. The index/file contract (every `memory/*.md` listed in `MEMORY.md`, every entry resolving to a file), the frontmatter schema (`name` / `description` / `metadata.type` ∈ `user` / `feedback` / `project` / `reference`), the four-type doctrine and promote-then-delete reconciliation, checked by `ki repo audit --skill ki-housekeeping-claude` when the skill is declared in that repository. It never enumerates, reports, or writes another repository's memory. Detail in [the auto-memory standard](references/standards-auto-memory.md).
2. **Every other area** — the mechanical arm is the paired **`mcp-claude-housekeeping`** MCP server (`@knowledgeislands/mcp-claude-housekeeping`): its codified per-surface audits (e.g. the Cowork filesystem audit) and its access-gated read/destructive tools. The skill states what healthy looks like and applies judgment over the server's findings; the server holds the macOS-filesystem tools that gather them. This skill never re-implements those tools — the pairing is skill-as-standard, server-as-tools.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

| Mode | What it does |
| --- | --- |
| AUDIT | Run `ki repo audit --skill ki-housekeeping-claude` for the selected repository's bounded Claude project-memory store; for the other areas run the `mcp-claude-housekeeping` server's codified audits (its audit tools / reports); then apply the judgment criteria in [rubric.md](references/rubric.md). Procedure in [mode-audit.md](references/mode-audit.md). |
| CONFORM | Run `ki repo conform --skill ki-housekeeping-claude`; it performs only safe transactional memory-file repairs in the selected repository's memory. Use the server's access-gated cleanup tools for other areas (destructive tools require the server's access level). Re-AUDIT until clean. Procedure in [mode-conform.md](references/mode-conform.md). |
| EDUCATE | Run `ki repo educate --skill ki-housekeeping-claude` to declare the repository's bounded user-home evidence; add it with `ki skill user add ki-housekeeping-claude` when it should also be installed for every supported Claude Code agent. User activation installs a skill only — it does not audit or conform it. |
| REFRESH | Re-check the standard against its sources: Headroom's memory-feature behavior for the memory format, and the `mcp-claude-housekeeping` server's tool surface for the other areas, per [mode-refresh.md](references/mode-refresh.md). |

## Notes

- The state this skill governs lives **outside the repo tree** — under `~/.claude/`, `~/Library/Application Support/Claude/`, and VSCode's `workspaceStorage/`. Its structured session is restricted to the selected repository's Claude project memory; the session / artifact / storage areas are machine-level and audited directly through the server, not by repository audit.
- A repo with no `memory/` directory yet (never used auto-memory) is an **NA**, not a FAIL.
- Route Markdown formatting to the separately applicable `ki-authoring` standard. The local `ki-skills:rubric` shared module is compile-time packaging, not a governance dependency.
- Does not assume any particular personal `~/.claude/CLAUDE.md` content — the doctrines checked are the systems' own universal instructions, not one user's private elaboration of them.
