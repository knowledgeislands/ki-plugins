---
name: ki-tokenomics-claude
ki-kind: governance
ki-depends-on: [ki-tokenomics]
ki-runtime-binding: true
ki-supported-runtimes: [claude-code]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Audit Claude Code’s documented context-cost evidence for the selected repository and its bounded user layer: instructions, settings, skills, MCP configuration, memory, Headroom wiring, and effective versus default model where available. Use when a Claude Code repository has heavy context or needs runtime evidence for portable `ki-tokenomics` policy. Triggers: "audit Claude context", "why is Claude Code context big", "check Claude tokenomics". For portable budgets and model purpose use `ki-tokenomics`; for Codex use `ki-tokenomics-codex`.
argument-hint: 'audit | conform | educate | refresh | help'
---

# Claude Code tokenomics

`ki-tokenomics-claude` composes `ki-tokenomics` with Claude Code evidence only. It reads the selected repository and the bounded physical `~/.claude` / `~/.claude.json` user layer; it never scans another repository's project state and never follows a symlinked evidence root.

The audit inventories instruction files and contained imports, memory, installed-skill descriptions, MCP server names, and Claude settings. It distinguishes a configured user default model from a repository-effective model where the documented settings expose both. It reports Headroom presence and repository attribution without resetting, reconfiguring, or exposing secret values.

CONFORM is report-only unless a future item proves an existing safe, item-owned write. It currently emits no writes or commands.

## Composition

Run `ki-tokenomics` for portable configuration, budgets, and model purpose. Route MCP-server design to `ki-repo-mcp` and skill-description quality to `ki-skills`.

## Operating modes

### Mode AUDIT

→ Read [mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [mode-conform.md](references/mode-conform.md)

### Mode EDUCATE

Declare this adapter only for repositories that support Claude Code; it scaffolds no runtime state.

### Mode REFRESH

→ Read [mode-refresh.md](references/mode-refresh.md)

Refresh only in `ki-agentic-harness`; from an installed copy, stop and redirect to the canonical harness.

### Mode HELP

Explain this Claude-only evidence boundary and stop without changing anything.
