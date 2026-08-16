# Claude Code subagent source projections

`ki-subagents` owns the portable role: identity, selection purpose, core instructions, lane, grounding, hand-offs, orchestration intent, and outcome evidence. This adapter owns only the Claude Code Markdown/YAML projection and candidate source discovery.

## Source format

Candidate source payloads live under a physical repository `subagents/` directory for authoring. Each definition is a Markdown file with a YAML frontmatter mapping at its start and a non-empty instruction body. The checker refuses symbolic links, unreadable paths, non-mapping YAML, and malformed YAML; it never traverses them.

## Required fields

Claude Code requires string `name` and `description` fields. A source name uses lowercase letters and hyphens only; digits and colons are invalid. The source filename is a useful human convention, not native identity authority.

## Supported fields

Current Claude Code supports `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, and `initialPrompt`. The adapter checks that a candidate source uses only this set. It does not infer effective model, permissions, scheduling, nesting, tool availability, or spawned-agent policy from source text.

## Source discovery and host boundary

Within the candidate source tree, declared names must be unique. This is source-payload evidence only. The Harness host advertises Claude subagent path metadata but has no generic publisher that consumes it, so publication, installation, activation, effective settings, and execution are all unavailable. A future authorised host integration must supply those claims and evidence.
