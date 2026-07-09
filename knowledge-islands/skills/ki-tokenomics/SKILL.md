---
name: ki-tokenomics
implies: []
description: >
  Audit, codify, and optimise the tokenomics of a Claude Code environment — the standing context surface paid on every turn, composed across the user-wide (`~/.claude`) and project-local layers and any Knowledge Islands base, plus the runtime levers (caching, model tier, compaction, sub-agent fan-out, verbosity). Measures each layer's CLAUDE.md (+`@imports`), memory, installed-skill descriptions, MCP tool definitions, and settings against budgets, and checks context-compression tooling such as Headroom is set up optimally. Use when context feels heavy or token costs climb. Triggers: "audit my token usage", "why is my context so big", "reduce my token costs", "trim my context", "too many MCP tools", "is Headroom set up right". For the volatile numbers (model ids, prices, cache TTLs, window sizes) use `claude-api`; for a base's structure/content use `ki-kb`; for one skill's quality use `ki-skills`; for an MCP server's code use `ki-mcp`.
argument-hint: 'audit | conform | init | refresh'
---

# Knowledge Islands tokenomics

You are helping hold a Claude Code working environment to one budget for its **tokenomics** — the cost of the context the model carries, paid not once but on **every turn**, and re-paid by every sub-agent. The premise of this skill is that this cost is rarely one file's fault: it is the **composition** of two configuration layers — the **user-wide** `~/.claude` and the **project-local** `.claude` / `CLAUDE.md` — over any **Knowledge Islands base** in play. You measure that composed surface, attribute it to its layers, hold it to a budget, and tune the runtime levers that multiply it.

This is a **standard, base-agnostic Process skill**: it hard-codes no single environment, resolving the user layer from `~/.claude` at runtime and taking the project or base as its target. Its quotable standard is [the standard](references/tokenomics-standard.md); the line-by-line criteria (each tagged mechanical/judgment) are [the rubric](references/audit-rubric.md); the mechanical checker is [`scripts/audit-tokenomics.ts`](scripts/audit-tokenomics.ts). How it sits beside the other skills is documented once in the ki-agentic-harness `README.md`, not repeated here.

## What it governs — two halves

**1. The standing surface** — everything in context before the user types a word, paid every turn:

- **`CLAUDE.md` (+ its `@imports`)** at each layer — global, project, base.
- **Memory** — the `MEMORY.md` index and the memory files the system loads.
- **Installed-skill descriptions** — every skill's `name` + `description` sits in the selection surface, user-wide and project-local.
- **MCP tool definitions** — usually the **largest** standing cost: every configured server's full tool schemas load up front.
- **Settings & output styles** — anything `settings.json` injects (a custom output style, an `env` block, a status line).

**2. The runtime levers** — what each turn and each sub-agent then costs:

- **Prompt caching** — is the stable prefix actually cacheable, and being hit?
- **Model tier** — is the work on the right-cost model?
- **Compaction** — is a long conversation compacted before it bloats?
- **Sub-agent fan-out** — each sub-agent re-pays the standing surface; is the fan-out worth it? Whether a given unit of work is delegation-ready in the first place is `ki-handoffs`'s concern, not this skill's.
- **Tool-result verbosity** — raw logs / JSON dumps re-read every turn; this is where context-**compression** tooling earns its place.

The full catalogue, the budget table, and the rationale (curate context as a finite resource; keep tool sets minimal) are in [the standard](references/tokenomics-standard.md). The volatile reference numbers it leans on — model ids, prices, cache TTLs, context-window sizes — are **not** restated here; resolve them through the `claude-api` skill.

## Context-compression tooling (Headroom)

Tool-result bloat is the runtime cost a **context-compression layer** attacks. The house default treats one such layer as a **recommended** best practice and checks that, where configured, it is set up well. The seeded entry is **Headroom** (the chopratejas / extraheadroom compression proxy / MCP server): the checker detects it across both layers — an `mcpServers` `headroom` entry exposing `headroom_compress` / `headroom_retrieve` / `headroom_stats`, a `headroom proxy`, or `HEADROOM_*` env — and reports whether its reversible store and cache-aligned prefixes look sound. The registry is **extensible**: add other projects alongside it. Whether the layer is `required`, `recommended`, or `off` is declared per environment (below).

## The config table — overridable budgets

A target opts in (and tunes) via a `[ki-tokenomics]` table in its `.ki-config.toml`, read **validate-down** (warn on a key it does not recognise; never read another skill's table). It carries the per-component and total token budgets (a `[…budgets]` sub-table), the `headroom` expectation, and an optional `context_window_tokens` to express headroom as a percentage. Omit any to take the default; `init` scaffolds the keys. A budget overage is a **WARN**, never a FAIL — these are guide-rails, not gates.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · INIT · REFRESH**. If invoked without a mode, use `AskUserQuestion` to list each mode with a one-line description; if the chosen mode shows a target in the `argument-hint`, prompt for that too.

### Mode AUDIT

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode CONFORM

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode INIT

→ Read [references/mode-init.md](references/mode-init.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Composition

- `ki-mcp` — owns the design of MCP servers (tool surface breadth, resource scope). When the audit reveals an over-broad server is the largest cost item, route the _fix_ there; this skill only measures and names the cost.
- `ki-skills` — owns the skill `description` field and its standing cost. When a bloated or unused skill description is flagged, route the trim there.
- `ki-kb` — owns a base's zone structure and loaded surface. When a base's large CLAUDE.md or memory is the cost driver, route the restructuring there.

## Notes

- The checker reads `~/.claude` as the user-wide layer **by design** — the standard _is_ the composition of user-wide and project-local config. `--no-user` audits the project layer alone; `--user <dir>` points elsewhere (for testing).
- Token figures are a **chars/4 estimate for budgeting, not billing** — every figure is marked `~`. For exact accounting use the model's own token counting (the `claude-api` skill).
- This skill measures and tunes cost; it does not own the artifacts that cause it. A finding routes to the owning skill's standard.
