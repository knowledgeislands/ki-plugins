---
name: ki-tokenomics
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Codify and audit portable agent-context tokenomics: repository-selected standing-surface attribution, budget guide-rails, portable model-purpose taxonomy, and the `[skills.ki-tokenomics]` configuration table. Use when a repository needs a runtime-neutral context-cost policy, model-purpose choice, or token budget. Triggers: "set a context budget", "audit our tokenomics policy", "which model type should this work use", "configure tokenomics". Runtime evidence belongs to `ki-tokenomics-claude` or `ki-tokenomics-codex`; MCP server design belongs to `ki-repo-mcp`; skill-description quality belongs to `ki-skills`.
argument-hint: 'audit | conform | help | educate | refresh'
---

# Knowledge Islands tokenomics

`ki-tokenomics` owns the portable policy for the context a runtime carries on every turn. The policy is deliberately separate from inspecting a vendor's files: `ki-tokenomics-claude` and `ki-tokenomics-codex` compose this skill and supply their documented, bounded runtime evidence.

The standing surface is the selected repository's instructions, memory, installed-skill descriptions, MCP tool definitions, and settings or output configuration. An audit attributes each measured cost to its repository or runtime-user layer and routes an artifact fix to its owner: `ki-repo-mcp` for an MCP server, `ki-skills` for a skill description, and the relevant runtime adapter for runtime configuration.

Budgets are guide-rails, not gates: every measured budget overage is a **WARN**, never a FAIL. FAIL is reserved for a malformed selected-repository `[skills.ki-tokenomics]` table or an explicitly required runtime integration that is missing. Estimates are labelled `~`; they are not billing or provider token counts.

## Portable configuration

The selected repository may declare only this skill's table. It is read validate-down: unknown keys WARN, recognised keys must have the documented shape, and no other skill table is inspected.

```toml
[skills.ki-tokenomics]
headroom = "recommended" # "required" | "recommended" | "off"
context_window_tokens = 200000
preferred_model_type = "standard" # frontier | reasoning | standard | fast

[skills.ki-tokenomics.model_tier_bindings]
frontier = "runtime-specific preference"

[skills.ki-tokenomics.budgets]
instructions = 2500
memory_index = 1000
skills_surface = 4000
mcp_servers = 5
total = 30000
```

Model types express purpose, not a provider product: `fast` for mechanical or bulk work, `standard` for well-scoped default work, `reasoning` for hard judgement, and `frontier` for long-horizon autonomous work. A runtime adapter may report an effective model only where its documented configuration exposes one; it does not change this portable purpose taxonomy.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH**. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode EDUCATE

→ Read [references/mode-educate.md](references/mode-educate.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

Refresh only in `ki-agentic-harness`; from an installed copy, stop and redirect to the canonical harness.

## Composition

- `ki-tokenomics-claude` and `ki-tokenomics-codex` compose this policy with their own documented runtime evidence. They do not share fallback paths or inspect the other runtime.
- `ki-repo-mcp` owns MCP-server design; `ki-skills` owns skill descriptions; a runtime adapter owns its instruction, memory, and settings evidence.

## Notes

- CONFORM is report-only. This skill and its runtime adapters publish no configuration writes or commands.
