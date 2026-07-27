---
name: ki-housekeeping
ki-depends-on: []
ki-runtime-binding: true
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Governs the hygiene of accumulated Claude state on a machine — the files Claude Desktop / Cowork sessions, Claude Code (`~/.claude/`), and VSCode chat sessions leave behind: stored sessions, artifacts and outputs, backups, plugins, project cache, and per-project auto-memory. Owns the standard and the judgment; the paired `mcp-claude-housekeeping` MCP server is its mechanical arm (codified per-area filesystem audits + access-gated cleanup tools). The memory area carries a structured KI rubric: the `memory/*.md` + `MEMORY.md` format, the four types (user/feedback/project/reference), index agreement, and promote-then-delete reconciliation. Triggers: "audit memory", "memory hygiene", "clean up Claude storage", "obsolete Cowork sessions", "housekeeping audit", "check ~/.claude". Not a Knowledge Islands base's own memory cascade (`ki-kb`'s MEM-2, the root `Admin/MEMORY.md`) — that is KB content, not machine state. Not the token cost of the context surface — that is `ki-tokenomics`.
argument-hint: 'audit | conform | help | educate | refresh'
---

# ki-housekeeping

**Standard:** the hygiene of accumulated Claude state across the surfaces where it collects — the areas and the skill↔server pairing in [the Claude-state standard](references/standards-claude-state.md); the memory area's file format in [the auto-memory standard](references/standards-auto-memory.md); line-by-line criteria in [the rubric](references/rubric.md); tracked provenance in [sources](references/sources.md). The standards embed the two exact canonical shapes (directory/index and frontmatter), so this skill intentionally needs no separate exemplars file.

## What this skill owns

The **standard and judgment** over the state Claude accumulates on a machine, across three surfaces — Claude Desktop / Cowork sessions, Claude Code (`~/.claude/`), and VSCode chat sessions — spanning the areas: **sessions**, **artifacts / outputs**, **backups**, **plugins**, **project cache**, and **auto-memory**. Full model in [the Claude-state standard](references/standards-claude-state.md).

The **mechanical arm** is split by area:

1. **Memory** — governed locally, in full. The index/file contract (every `memory/*.md` listed in `MEMORY.md`, every entry resolving to a file), the frontmatter schema (`name` / `description` / `metadata.type` ∈ `user` / `feedback` / `project` / `reference`), the four-type doctrine and promote-then-delete reconciliation, checked by `ki repo audit --skill ki-housekeeping` when the skill is declared in that repository. Detail in [the auto-memory standard](references/standards-auto-memory.md).
2. **Every other area** — the mechanical arm is the paired **`mcp-claude-housekeeping`** MCP server (`@knowledgeislands/mcp-claude-housekeeping`): its codified per-surface audits (e.g. the Cowork filesystem audit) and its access-gated read/destructive tools. The skill states what healthy looks like and applies judgment over the server's findings; the server holds the macOS-filesystem tools that gather them. This skill never re-implements those tools — the pairing is skill-as-standard, server-as-tools.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

| Mode | What it does |
| --- | --- |
| AUDIT | Run `ki repo audit --skill ki-housekeeping` for the bounded Claude project-memory store when the skill is declared in the selected repository; for the other areas run the `mcp-claude-housekeeping` server's codified audits (its audit tools / reports); then apply the judgment criteria in [rubric.md](references/rubric.md). Procedure in [mode-audit.md](references/mode-audit.md). |
| CONFORM | Run `ki repo conform --skill ki-housekeeping`; it performs only safe transactional memory-file repairs. Use the server's access-gated cleanup tools for other areas (destructive tools require the server's access level). It does not invent a repository's local concerns or `ki-self` body; use that repository's local EDUCATE/CONFORM process. Re-AUDIT until clean. Procedure in [mode-conform.md](references/mode-conform.md). |
| EDUCATE | Run `ki repo educate --skill ki-housekeeping` to declare the repository's bounded user-home evidence; add it with `ki skill user add ki-housekeeping` when it should also be installed for every supported agent. User activation installs a skill only — it does not audit or conform it. |
| REFRESH | Re-check the standard against its sources: Headroom's memory-feature behavior for the memory format, and the `mcp-claude-housekeeping` server's tool surface for the other areas, per [mode-refresh.md](references/mode-refresh.md). |

## Notes

- The state this skill governs lives **outside the repo tree** — under `~/.claude/`, `~/Library/Application Support/Claude/`, and VSCode's `workspaceStorage/`. Use `ki repo educate` to declare it where its structured memory evidence belongs; the session / artifact / storage areas are machine-level and audited directly through the server, not per-repo.
- Every governed repository is expected to carry a repo-local `ki-self` governance skill for its **local concerns**. The repository subject checks the canonical `.agents/skills/ki-self/SKILL.md` source directly and, when `[ki-repo].supported_runtimes` declares Claude Code, checks the relative `.claude/skills/ki-self` projection. `ki-self audit` is that repository's local-housekeeping audit; `ki-housekeeping` remains the machine-state audit and does not absorb, install, or author the local skill. The shared taxonomy records the boundary in [The skills](../../../docs/guides/user/skills.md#ki-self-local-governance-for-local-concerns).
- A repo with no `memory/` directory yet (never used auto-memory) is an **NA**, not a FAIL.
- Composes on `ki-authoring` for the Markdown formatting delta of the memory files and on the `ki-skills` rubric contract for execution and severity.
- Does not assume any particular personal `~/.claude/CLAUDE.md` content — the doctrines checked are the systems' own universal instructions, not one user's private elaboration of them.
