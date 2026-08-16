---
name: ki-housekeeping-claude
ki-kind: governance
ki-depends-on: []
ki-runtime-binding: true
ki-supported-runtimes: [claude-code]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Governs accumulated Claude state from Desktop, Cowork, Claude Code (`~/.claude/`), and VSCode chat: sessions, artifacts, backups, plugins, project cache, and selected native auto-memory. It owns the standard and judgment; native Claude settings establish memory location, Headroom output is separate rendered evidence, and any paired server's source, registration, exposure, and executed audit remain distinct. Its bounded memory rubric covers selection evidence, `memory/*.md`, `MEMORY.md`, the four memory types, index agreement, and promote-then-delete reconciliation. Triggers: "audit Claude memory", "Claude memory hygiene", "clean up Claude storage", "obsolete Cowork sessions", "Claude housekeeping audit", "check ~/.claude". Not a Knowledge Islands base memory cascade (`ki-repo-kb`) or context cost (`ki-tokenomics`).
argument-hint: 'audit | conform | help | educate | refresh'
---

# ki-housekeeping-claude

**Standard:** the hygiene of accumulated Claude state across the surfaces where it collects — the areas and the skill↔server pairing in [the Claude-state standard](references/standards-claude-state.md); the memory area's file format in [the auto-memory standard](references/standards-auto-memory.md); line-by-line criteria in [the rubric](references/rubric.md); tracked provenance in [sources](references/sources.md). The standards embed the two exact canonical shapes (directory/index and frontmatter), so this skill intentionally needs no separate exemplars file.

## What this skill owns

The **standard and judgment** over the state Claude accumulates on a machine, across three surfaces — Claude Desktop / Cowork sessions, Claude Code (`~/.claude/`), and VSCode chat sessions — spanning the areas: **sessions**, **artifacts / outputs**, **backups**, **plugins**, **project cache**, and **auto-memory**. Full model in [the Claude-state standard](references/standards-claude-state.md).

The **mechanical arm** is split by area:

1. **Native memory** — governed locally when a readable native settings record establishes a selected contained directory. An absent or malformed settings record, disabled or unsupported override, or out-of-bounds override is reported unavailable; the rubric never silently falls back to its default path. Once selection is established, the index/file contract (every `memory/*.md` listed in `MEMORY.md`, every entry resolving to a file), frontmatter schema, four-type doctrine, and promote-then-delete reconciliation are checked by `ki repo audit --skill ki-housekeeping-claude`. It never enumerates, reports, or writes another repository's memory. Detail in [the auto-memory standard](references/standards-auto-memory.md).
2. **Headroom output and every other area** — a `headroom:learn` block is rendered-file evidence only; it does not prove a Headroom database, version, installation, or executed learn action. The paired **`mcp-claude-housekeeping`** server is a separate tool source: a source checkout or inventory declaration does not prove registration, access exposure, or an executed audit. The skill applies judgment only to independently obtained server audit evidence; it never re-implements those tools.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

| Mode | What it does |
| --- | --- |
| AUDIT | Run `ki repo audit --skill ki-housekeeping-claude` for selected native-memory evidence and its bounded store. Report non-memory server state unavailable unless registration, access exposure, and an executed server audit are separately evidenced; then apply the judgment criteria in [rubric.md](references/rubric.md). Procedure in [mode-audit.md](references/mode-audit.md). |
| CONFORM | Run `ki repo conform --skill ki-housekeeping-claude`; it proposes only safe transactional repairs in an already selected bounded memory directory. Any non-memory cleanup requires independently established server access and authority. Re-AUDIT until the local evidence is clean. Procedure in [mode-conform.md](references/mode-conform.md). |
| EDUCATE | Run `ki repo educate --skill ki-housekeeping-claude` to declare the repository's bounded user-home evidence; add it with `ki skill add ki-housekeeping-claude` when it should also be installed for every supported Claude Code agent. User activation installs a skill only — it does not audit or conform it. |
| REFRESH | Re-check the standard against its sources: Headroom's memory-feature behavior for the memory format, and the `mcp-claude-housekeeping` server's tool surface for the other areas, per [mode-refresh.md](references/mode-refresh.md). |

## Notes

- The state this skill governs lives **outside the repo tree** — under `~/.claude/`, `~/Library/Application Support/Claude/`, and VSCode's `workspaceStorage/`. Its structured session is restricted to the selected repository's Claude project memory; the session / artifact / storage areas are machine-level and audited directly through the server, not by repository audit.
- A selected native directory with no `memory/` directory yet is an **NA**, not a FAIL. Uncertain selection is a **FAIL**, not an NA.
- Route Markdown formatting to the separately applicable `ki-authoring` standard. The local `ki-skills:rubric` shared module is compile-time packaging, not a governance dependency.
- Does not assume any particular personal `~/.claude/CLAUDE.md` content — the doctrines checked are the systems' own universal instructions, not one user's private elaboration of them.
