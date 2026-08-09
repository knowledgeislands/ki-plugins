---
name: ki-binding-claude
ki-kind: governance
ki-depends-on: [ki-binding]
ki-runtime-binding: true
ki-supported-runtimes: [claude-code]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Codify, audit, and safely conform Claude-native MCP binding: Claude Code and Desktop JSON surfaces, Claude Cowork marketplace/plugin enablement, the claude.ai web convention, and the KI Cowork plugin projection. Use when Claude MCP surfaces disagree, Cowork lacks the KI plugin, or the Cowork plugin must be rebuilt. The portable source belongs to `ki-binding`; Codex belongs to `ki-binding-codex`.
argument-hint: 'audit [project] | conform [project] | help | educate [project] | refresh'
---

# Knowledge Islands Claude binding

This runtime adapter composes `ki-binding` and owns the Claude-specific delta: Claude Code and Desktop JSON surfaces, Cowork's safe settings draft, the intentionally non-rendered claude.ai web convention, and generation of the Cowork plugin marketplace projection.

## Operating modes

### Mode AUDIT

Run `ki repo audit --skill ki-binding-claude --repo <project>`. The host resolves and runs the declared `ki-binding` prerequisite first; the adapter then reports Code/Desktop evidence and Cowork plugin drift. Web has no local configuration and is a judgment-only convention.

### Mode CONFORM

Run AUDIT first. `ki repo conform --skill ki-binding-claude --repo <project>` drafts only safe regular Cowork settings files, preserving unrelated keys. Relaunch Cowork after publication. Rebuild the marketplace plugin with `bun skills/environment/ki-binding-claude/scripts/build-plugin.ts <ki-repo-plugins-checkout>`; it is a projection, never hand-maintained.

### Mode EDUCATE

Explain the Claude-only surface contract without creating a second MCP source.

### Mode REFRESH

Refresh only in `ki-agentic-harness` when Claude's JSON, Cowork settings, web convention, or plugin manifest contracts change. From an installed copy, stop and redirect to the canonical harness.

### Mode HELP

Explain this Claude adapter boundary and stop without changing anything.
