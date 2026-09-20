---
name: ki-binding-claude
ki-kind: governance
ki-applicability: declaration-only
ki-depends-on: [ki-binding]
ki-runtime-binding: true
ki-supported-runtimes: [claude-code]
ki-shared-dependencies: [ki-binding:binding, ki-skills:rubric]
description: >
  Audit or safely conform Claude-native MCP configuration across Claude Code, Desktop, web conventions, and
  the KI Cowork plugin projection. Use when Claude MCP surfaces drift or Cowork needs rebuilding; `ki-binding`
  owns portable source and `ki-binding-codex` owns Codex.
argument-hint: 'audit [project] | conform [project] | help | educate [project] | refresh'
---

# Knowledge Islands Claude binding

This runtime adapter composes `ki-binding` and owns the Claude-specific delta: Claude Code and Desktop JSON definition comparison, Cowork registration evidence, the intentionally non-rendered claude.ai web convention, and generation of the Cowork plugin marketplace projection. Source projection, registration, installation, activation, and runtime health are reported separately.

## Operating modes

### Mode AUDIT

Run `ki repo audit --skill ki-binding-claude --repo <project>`. The host resolves and runs the declared `ki-binding` prerequisite first; the adapter then reports Code/Desktop evidence and Cowork plugin drift. Web has no local configuration and is a judgment-only convention.

### Mode CONFORM

Run AUDIT first. Cowork settings are report-only until product-specific external-edit and next-launch authority is recorded. Rebuild the marketplace plugin with `bun run ki:binding:claude:build-plugin <ki-repo-plugins-checkout>`; it is a projection, never hand-maintained. This skill's exact package-script claim is limited to that builder command. Registration, installation, activation, and runtime health require separate authorised evidence.

### Mode EDUCATE

Explain the Claude-only surface contract without creating a second MCP source.

### Mode REFRESH

Refresh only in `ki-agentic-harness` when Claude's JSON, Cowork settings, web convention, or plugin manifest contracts change. From an installed copy, stop and redirect to the canonical harness.

### Mode HELP

Explain this Claude adapter boundary and stop without changing anything.
