---
name: ki-tokenomics
ki-depends-on: []
ki-runtime-binding: true
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Audit, codify, and optimise the tokenomics of a Claude Code environment — the standing context surface paid on every turn, composed across the user-wide (`~/.claude`) and project-local layers and any Knowledge Islands base, plus the runtime levers (caching, model tier, compaction, sub-agent fan-out, verbosity). Measures each layer's CLAUDE.md (+`@imports`), memory, installed-skill descriptions, MCP tool definitions, and settings against budgets, and checks context-compression tooling such as Headroom is set up optimally. Use when context feels heavy or token costs climb. Triggers: "audit my token usage", "why is my context so big", "reduce my token costs", "trim my context", "too many MCP tools", "is Headroom set up right". For the volatile numbers (model ids, prices, cache TTLs, window sizes) use `claude-api`; for a base's structure/content use `ki-kb`; for one skill's quality use `ki-skills`; for an MCP server's code use `ki-mcp`.
argument-hint: 'audit | conform | help | educate | refresh'
---

# Knowledge Islands tokenomics

You are helping hold a Claude Code working environment to one budget for its **tokenomics** — the cost of the context the model carries, paid not once but on **every turn**, and re-paid by every sub-agent. The premise of this skill is that this cost is rarely one file's fault: it is the **composition** of two configuration layers — the **user-wide** `~/.claude` and the **project-local** `.claude` / `CLAUDE.md` — over any **Knowledge Islands base** in play. You measure that composed surface, attribute it to its layers, hold it to a budget, and tune the runtime levers that multiply it.

This is a **standard, base-agnostic Process skill**. `ki repo educate --skill ki-tokenomics` declares its bounded user-home evidence for a repository, then `ki repo audit --skill ki-tokenomics` resolves the durable user layer from physical files under `~/.claude` and `~/.claude.json`; repository-specific attribution remains explicitly unavailable until a native context joins those evidence sources. Its quotable standard is [the tokenomics standard](references/standards-tokenomics.md); the line-by-line criteria are [the rubric](references/rubric.md). [The exemplars](references/exemplars.md) remain a separate file because the composed config, proxy-attribution, compaction, and load-vs-defer patterns are clearer as concrete complete shapes than inline fragments.

## What it governs — two halves

**1. The standing surface** — everything in context before the user types a word, paid every turn:

- **`CLAUDE.md` (+ its `@imports`)** at each layer — global, project, base.
- **Memory** — the `MEMORY.md` index and the memory files the system loads.
- **Installed-skill descriptions** — every skill's `name` + `description` sits in the selection surface, user-wide and project-local.
- **MCP tool definitions** — usually the **largest** standing cost: every configured server's full tool schemas load up front.
- **Settings & output styles** — anything `settings.json` injects (a custom output style, an `env` block, a status line).

**2. The runtime levers** — what each turn and each sub-agent then costs:

- **Prompt caching** — is the stable prefix actually cacheable, and being hit?
- **Model type** — is the work on the right-cost model _type_ (`frontier` / `reasoning` / `standard` / `fast`), whatever concrete model each resolves to per runtime?
- **Compaction** — is a long conversation compacted before it bloats?
- **Sub-agent fan-out** — each sub-agent re-pays the standing surface; is the fan-out worth it? Whether a given unit of work is delegation-ready in the first place is `ki-delegate`'s concern, not this skill's.
- **Tool-result verbosity** — raw logs / JSON dumps re-read every turn; this is where context-**compression** tooling earns its place.

The full catalogue, the budget table, and the rationale (curate context as a finite resource; keep tool sets minimal) are in [the tokenomics standard](references/standards-tokenomics.md). The volatile reference numbers it leans on — model ids, prices, cache TTLs, context-window sizes — are **not** restated here; resolve them through the `claude-api` skill.

## Context-compression tooling (Headroom)

Tool-result bloat is the runtime cost a **context-compression layer** attacks. The house default treats one such layer as a **recommended** best practice and checks that, where configured, it is set up well. The seeded entry is **Headroom** (the chopratejas / extraheadroom compression proxy / MCP server): the checker detects it across both layers — an `mcpServers` `headroom` entry exposing `headroom_compress` / `headroom_retrieve` / `headroom_stats`, a `headroom proxy`, or `HEADROOM_*` env — and reports whether its reversible store and cache-aligned prefixes look sound. The registry is **extensible**: add other projects alongside it. Whether the layer is `required`, `recommended`, or `off` is declared per environment (below).

Headroom's savings ledger, performance logs, live counters, and durable proxy history are separate operational surfaces with different reset mechanics. Use the version-pinned [Headroom operational safety standard](references/standards-headroom-operations.md); do not treat `headroom savings --reset` as a universal dashboard reset. Resets, truncation, moves, deletion, and proxy reconfiguration remain manual.

## The config table — overridable budgets

A target opts in (and tunes) via a `[ki-tokenomics]` table in its `.ki-config.toml`, read **validate-down** (warn on a key it does not recognise; never read another skill's table). It carries the per-component and total token budgets (a `[…budgets]` sub-table), the `headroom` expectation, and an optional `context_window_tokens` to express headroom as a percentage. Omit any to take the default; `educate` scaffolds the keys. A budget overage is a **WARN**, never a FAIL — these are guide-rails, not gates.

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

## Composition

- `ki-mcp` — owns the design of MCP servers (tool surface breadth, resource scope). When the audit reveals an over-broad server is the largest cost item, route the _fix_ there; this skill only measures and names the cost.
- `ki-skills` — owns the skill `description` field and its standing cost. When a bloated or unused skill description is flagged, route the trim there.
- `ki-kb` — owns a base's zone structure and loaded surface. When a base's large CLAUDE.md or memory is the cost driver, route the restructuring there.

## Notes

- `ki repo educate --skill ki-tokenomics` declares the repository scope; `ki repo audit --skill ki-tokenomics` reads only physical files inside its bounded user-home scope **by design** and never follows a symlinked `.claude` root, skill directory, instruction file, import, settings file, or `.claude.json`. `ki skill user add ki-tokenomics` installs it globally only; it never creates a user-wide audit or conform surface. Project-local composition requires a native context that joins that repository to the user layer and is reported as not applicable rather than being guessed.
- Native CONFORM is report-only. It publishes no writes or commands because the measured artifacts belong to other governance skills and changing them can remove agent capabilities; all operational Headroom cleanup is manual.
- Token figures are a **chars/4 estimate for budgeting, not billing** — every figure is marked `~`. For exact accounting use the model's own token counting (the `claude-api` skill).
- This skill measures and tunes cost; it does not own the artifacts that cause it. A finding routes to the owning skill's standard.
