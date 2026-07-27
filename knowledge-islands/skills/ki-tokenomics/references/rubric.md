<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Claude context tokenomics

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-tokenomics --write`.

Line-by-line criteria for auditing ki-tokenomics. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [COMP — Composition and attribution](#comp--composition-and-attribution)
- [SURF — Standing-surface inventory](#surf--standing-surface-inventory)
- [MCP — MCP tool surface](#mcp--mcp-tool-surface)
- [BUDG — Budgets](#budg--budgets)
- [RUN — Runtime levers](#run--runtime-levers)
- [TOOL — Compression tooling](#tool--compression-tooling)
- [CFG — Configuration table](#cfg--configuration-table)

## COMP — Composition and attribution

→ [standard](standards-tokenomics.md)

Layer composition and attribution.

- **COMP-1 [M] — Layers are read and reported** — The bounded user-wide layer is read and repository-selected evidence is reported explicitly when unavailable. (standards-tokenomics.md)
- **COMP-2 [M] — Costs are attributed** — Every measured standing cost is attributed to its configuration layer. (standards-tokenomics.md)
- **COMP-3 [J] — Recommendations land in the right layer** — Recommendations account for where each cost lives. (standards-tokenomics.md)
  - _Review prompt:_ Does each recommendation account for where the cost lives?

## SURF — Standing-surface inventory

→ [standard](standards-tokenomics.md)

Standing context inventory.

- **SURF-1 [M] — Instruction files and imports are measured** — The physical user-wide instruction file resolves only contained physical imports and reports its estimated token size; broken or out-of-scope imports are FAIL. (standards-tokenomics.md)
- **SURF-2 [M] — Memory indices are measured** — Memory indices and locatable memory files are measured when repository-selected evidence is available. (standards-tokenomics.md)
- **SURF-3 [M] — Skill descriptions are measured** — Physical installed-skill descriptions are counted and summed for the user-wide layer. (standards-tokenomics.md)
- **SURF-4 [J] — Standing instruction earns its cost** — Large instruction and memory entries earn their standing token cost. (standards-tokenomics.md)
  - _Review prompt:_ Does each large instruction or memory entry earn its standing token cost?

## MCP — MCP tool surface

→ [standard](standards-tokenomics.md)

MCP standing context.

- **MCP-1 [M] — MCP servers are enumerated** — Configured MCP servers are enumerated from the bounded user-wide Claude configuration. (standards-tokenomics.md)
- **MCP-2 [J] — MCP servers are used** — Each configured server is used by the work done in the environment. (standards-tokenomics.md)
  - _Review prompt:_ Is each configured server used by the work done here?
- **MCP-3 [J] — MCP tool sets are minimal** — Broad server tool sets are curated or dynamically discovered. (standards-tokenomics.md)
  - _Review prompt:_ Are broad server tool sets curated or dynamically discovered?

## BUDG — Budgets

→ [standard](standards-tokenomics.md)

Budget evidence and review.

- **BUDG-1 [M] — Component budgets are compared** — Each measured user-wide component is compared with its default budget. (standards-tokenomics.md)
- **BUDG-2 [M] — Total budget is compared** — The measured user-wide standing total is compared with the total budget. (standards-tokenomics.md)
- **BUDG-3 [J] — Overages are deliberate** — A sustained overage is fixed or deliberately recorded. (standards-tokenomics.md)
  - _Review prompt:_ Is a sustained overage fixed or deliberately recorded?

## RUN — Runtime levers

→ [standard](standards-tokenomics.md)

Runtime token-cost levers.

- **RUN-1 [J] — Prompt caching is effective** — The stable prefix is cacheable and being hit. (standards-tokenomics.md)
  - _Review prompt:_ Is the stable prefix cacheable and being hit?
- **RUN-2 [J] — Model type matches work value** — The declared model type matches the value and difficulty of the work. (standards-tokenomics.md)
  - _Review prompt:_ Does the declared model type match the work value?
- **RUN-3 [J] — Conversation growth is controlled** — Compaction and sub-agent fan-out remain proportionate. (standards-tokenomics.md)
  - _Review prompt:_ Are compaction and sub-agent fan-out proportionate?
- **RUN-4 [J] — Tool verbosity is controlled** — Raw tool results are prevented from bloating context. (standards-tokenomics.md)
  - _Review prompt:_ Are raw tool results prevented from bloating context?
- **RUN-5 [M] — Pinned model is reported** — A default model pinned in user-wide settings is reported as information. (standards-tokenomics.md)

## TOOL — Compression tooling

→ [standard](standards-tokenomics.md)

Context-compression tooling.

- **TOOL-1 [M] — Compression tooling is detected** — Configured user-wide context-compression tooling is detected without changing its configuration. (standards-tokenomics.md)
- **TOOL-2 [M] — Compression expectation is honoured** — The default recommended compression expectation is reported as WARN when absent; a repository-selected required expectation remains a FAIL. (standards-tokenomics.md)
- **TOOL-3 [J] — Compression setup is optimal** — Where present, compression uses a sound reversible store, cache alignment, and deliberate shaping. (standards-tokenomics.md)
  - _Review prompt:_ Where present, is the compression setup optimal?
- **TOOL-4 [M] — Learned captures are local** — The Headroom learned block contains no cross-repository captures when repository evidence is available. (standards-tokenomics.md)
- **TOOL-5 [M] — Proxy traffic is attributed** — Local Headroom proxy traffic is attributed to the selected repository when repository evidence is available. (standards-tokenomics.md)

## CFG — Configuration table

→ [standard](standards-tokenomics.md)

Tokenomics configuration table.

- **CFG-1 [M] — Config validates down** — The repository-local ki-tokenomics configuration table is parsed and validated down when repository evidence is available. (standards-tokenomics.md)
- **CFG-2 [M] — Education emits defaults** — Repository education emits the default configuration keys. (standards-tokenomics.md)
- **CFG-3 [J] — Configuration is warranted** — Budgets and expectations are warranted for the environment. (standards-tokenomics.md)
  - _Review prompt:_ Are budgets and expectations warranted for this environment?
- **CFG-4 [M] — Portable model type is declared** — A portable preferred model type is declared when repository configuration evidence is available. (standards-tokenomics.md)
- **CFG-5 [M] — Model bindings are valid** — Optional model-tier bindings have valid keys and non-empty values when repository configuration evidence is available. (standards-tokenomics.md)
