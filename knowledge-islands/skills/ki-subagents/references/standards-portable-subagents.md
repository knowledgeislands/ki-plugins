# Portable subagent roles

## Purpose

A portable subagent role is a runtime-neutral delegation contract. It defines a stable identity, a selection description, core instructions, a distinct lane, grounding, hand-offs, intended orchestration, and effectiveness evidence. It deliberately does not define a native serialization.

## Required semantic evidence

- **Identity and selection.** State what role exists and the request cues that select it.
- **Core instructions and lane.** Bound ownership and state what is out of scope.
- **Grounding and hand-offs.** Name evidence to read before action and the receiving capability for adjacent work.
- **Orchestration.** If the role delegates, state the intended coordination boundary without assuming runtime limits or permissions.
- **Outcome.** Retain representative evidence that selection was appropriate and improved the requested result; a syntactically valid file is not such evidence.

## Boundary

Claude Code Markdown/YAML and its fields are owned by `ki-subagents-claude`. Codex standalone TOML and its fields are owned by `ki-subagents-codex`. Installation, publication, activation, effective settings, and runtime execution are host/runtime questions. The current Harness host implements no generic subagent publisher, so neither adapter may claim them.
