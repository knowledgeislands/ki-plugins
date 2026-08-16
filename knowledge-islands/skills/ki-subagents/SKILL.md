---
name: ki-subagents
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: Define or assess a portable subagent role before choosing a runtime projection. Use for identity, delegation purpose, core instructions, lane, grounding, hand-offs, orchestration intent, and outcome evidence. Use ki-subagents-claude for Claude Markdown/YAML or ki-subagents-codex for Codex TOML. This skill does not prescribe a native file format or prove installation, activation, effective settings, or execution.
argument-hint: 'audit | conform | educate | refresh | help'
---

# KI subagents

## Position

This is the runtime-neutral parent for a subagent role. It owns the role's stable identity, selection purpose, core instructions, lane, grounding, hand-offs, orchestration intent, and evidence that selecting the role improves an outcome. It owns no runtime field, file extension, path, installation, activation, effective setting, or execution claim.

Use `ki-subagents-claude` to project an approved role into Claude Code Markdown/YAML. Use `ki-subagents-codex` to project it into Codex standalone TOML. Choose the adapter only after this semantic work is explicit; do not copy one runtime's fields into the other.

## Operating modes

### Mode AUDIT

1. Establish the role's identity, purpose and delegation cues without naming a runtime.
2. Review the core instructions for a bounded lane, grounding-before-action, explicit hand-offs, and intended orchestration.
3. Record evidence from representative work that the role was selected appropriately and improved the result. Source shape alone is not outcome evidence.
4. Route native serialization and source-payload checks to the selected adapter. Route installation, activation, effective configuration, and execution to an authorised host/runtime evidence owner.

### Mode CONFORM

Repair only portable role prose and evidence. Do not add native fields or publish a runtime artifact here. A native projection requires the matching adapter and host authority.

### Mode EDUCATE

Explain the portable semantic boundary and its adapter off-ramps without authoring a native projection.

### Mode REFRESH

**Precondition:** REFRESH writes only in the canonical `ki-agentic-harness` source checkout. From an installed copy, stop and route the source refresh to that Harness.

Refresh this role contract from local decisions and recorded outcome evidence. Runtime specifications belong only to adapter source lists.

### Mode HELP

Explain the parent, its semantic boundary, its adapters, and its modes, then stop.

## References

- [Portable role standard](references/standards-portable-subagents.md)
- [Rubric](references/rubric.md)
- [Sources](references/sources.md)
