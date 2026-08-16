# Tokenomics standard

This portable standard governs declared context-cost policy shared by supported agent runtimes. A standing surface is the selected repository's instructions, durable memory, installed-skill descriptions, MCP definitions, and settings or output configuration that a runtime may load before or during work. Runtime adapters may report only documented, directly observed surfaces and their bounded layer. Attribution, measurement, and effective runtime state require separately authorised adapter evidence.

## Budget policy

Budgets are declared guide-rails. Any observed component or total overage is WARN, never FAIL. A portable policy check cannot observe an overage, usage, attribution, or billing. A FAIL is reserved for a malformed selected-repository configuration or a runtime adapter's explicit required integration that is absent. Token estimates, where an adapter is authorised to produce them, are labelled `~` and are not billing figures.

The default component budgets are `instructions = 2500`, `memory_index = 1000`, `skills_surface = 4000`, `mcp_servers = 5`, and `total = 30000`. A runtime adapter reports only categories it can document and measure.

## Selected-repository configuration

Only `[skills.ki-tokenomics]` is read, validate-down. Recognised scalar keys are `headroom` (`required`, `recommended`, or `off`), positive integer `context_window_tokens`, and `preferred_model_type` (`frontier`, `reasoning`, `standard`, or `fast`). `budgets` and `model_tier_bindings`, when present, must be tables. `budgets` may contain only positive numeric values for the default budget categories. `model_tier_bindings` may contain only portable model-type keys with non-empty strings. Unknown keys WARN; malformed recognised values, including non-table nested values, FAIL.

## Model purpose

`fast` is for mechanical or bulk work, `standard` for well-scoped default work, `reasoning` for hard judgement, and `frontier` for long-horizon autonomous work. These are purposes, not provider names. A runtime's concrete effective or default model is evidence owned by its adapter and cannot revise the repository's declared purpose.

## Ownership

The tokenomics report names cost and attribution; it does not silently edit another owner’s artifact. Route MCP-server design to `ki-repo-mcp`, installed-skill description quality to `ki-skills`, and runtime instruction, settings, memory, compaction, or tool evidence to the matching runtime adapter. Runtime adapters are separate capabilities, not compatibility fallbacks.
