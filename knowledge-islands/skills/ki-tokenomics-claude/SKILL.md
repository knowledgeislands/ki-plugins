---
name: ki-tokenomics-claude
ki-kind: governance
ki-applicability: declaration-only
ki-depends-on: [ki-tokenomics]
ki-runtime-binding: true
ki-supported-runtimes: [claude-code]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Audit non-secret Claude Code repository evidence—instructions, rules, settings, imports, and MCP
  declarations—for portable tokenomics. Use `ki-tokenomics` for policy and `ki-tokenomics-codex` for Codex
  evidence; effective session state is outside this filesystem audit.
argument-hint: 'audit | conform | educate | refresh | help'
---

# Claude Code tokenomics

`ki-tokenomics-claude` composes `ki-tokenomics` with direct Claude Code filesystem observations from the selected repository only. It does not read user-home state, another repository's state, live session state, or symlinked evidence roots.

The audit inventories project instruction files and contained imports, `.claude/CLAUDE.md`, project rules, parseable project settings, and parseable project MCP declarations. It reports structural presence only and never emits configuration values. Effective model, loaded context, active MCP tools, trust, approvals, memory use, transcript, compaction, billing, and token measurements remain unavailable.

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
