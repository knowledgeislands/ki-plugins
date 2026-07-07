# Audit Rubric — the checkable criteria

Line-by-line pass/fail criteria for auditing the **tokenomics** of a Claude Code environment against [the standard](tokenomics-standard.md). Each is tagged **[M] mechanical** (the bundled [checker](../scripts/audit-tokenomics.ts) decides it) or **[J] judgment** (you assess it by reading). The **code** in bold (`COMP-1`, `MCP-2`, …) is the area's short code plus its number within that area; numbering restarts at 1 per area. Each criterion cites the [standard](tokenomics-standard.md) section it verifies.

A criterion's tag is a contract with the checker: if you find yourself eyeballing an **[M]** check, run the checker instead; the moment a **[J]** check becomes deterministic (e.g. Headroom's config keys get documented), move it into the checker and flip its tag.

## Contents

- [COMP — Composition & attribution](#comp--composition--attribution)
- [SURF — Standing-surface inventory](#surf--standing-surface-inventory)
- [MCP — MCP tool surface](#mcp--mcp-tool-surface)
- [BUDG — Budgets](#budg--budgets)
- [RUN — Runtime levers](#run--runtime-levers)
- [TOOL — Compression tooling (Headroom)](#tool--compression-tooling-headroom)
- [CFG — Config table](#cfg--config-table)

## COMP — Composition & attribution

→ [standard §1](tokenomics-standard.md#1-the-composition-model--why-standing-context-dominates)

- **COMP-1 [M]** Both layers are read and reported — the user-wide `~/.claude` and the project-local target (unless `--no-user`); a base adds its `MEMORY.md` cascade.
- **COMP-2 [M]** Every cost figure is **attributed to its layer** (user-wide / project / base), not rolled into one global total.
- **COMP-3 [J]** The finding accounts for _where_ a cost lives — a heavy user-global `CLAUDE.md` is fixed once for every project, a project-local one only here; the recommendation lands in the right layer.

## SURF — Standing-surface inventory

→ [standard §2](tokenomics-standard.md#2-the-standing-surface--the-catalogue)

- **SURF-1 [M]** Every `CLAUDE.md` found (each layer) has its `@imports` resolved and its total size measured; an **unresolved `@import` FAILs** (a broken include).
- **SURF-2 [M]** `MEMORY.md` indices and locatable memory files are measured.
- **SURF-3 [M]** Installed-skill descriptions are counted and summed per layer (the selection surface). The per-skill text the model actually sees is bounded by `maxSkillDescriptionChars` / `skillListingBudgetFraction`, so a large raw set may load lighter than its sum.
- **SURF-4 [J]** A large `CLAUDE.md` / memory entry **earns** its tokens — not restating what a competent model already knows, not stale, not detail that belongs in an on-demand file. This is the altitude call the size check cannot make.

## MCP — MCP tool surface

→ [standard §2](tokenomics-standard.md#2-the-standing-surface--the-catalogue) · [§6](tokenomics-standard.md#6-best-practice--context-as-a-finite-resource)

- **MCP-1 [M]** Configured MCP servers are enumerated across both layers (`~/.claude.json`, project `.mcp.json`, `settings.json`) and the count reported as the deterministic proxy for the tool-definition cost.
- **MCP-2 [J]** Each configured server is actually **used** by the work done here; an unused or over-broad server is the first cut, because tool definitions are usually the largest standing line item.
- **MCP-3 [J]** Where a server exposes many tools, the set is minimal / curated (the three-to-five-always-loaded heuristic; dynamic discovery beyond ~10), rather than every tool loaded up front. Claude Code now implements this natively via **tool search** (default on: only tool names load up front, schemas on demand); `ENABLE_TOOL_SEARCH=false` reverts to loading every schema up front and is worth flagging on a heavy server set.

## BUDG — Budgets

→ [standard §3](tokenomics-standard.md#3-budgets-and-the-config-table)

- **BUDG-1 [M]** Each component is compared to its budget (the defaults, or the `[…budgets]` overrides); an overage is a **WARN**, never a FAIL.
- **BUDG-2 [M]** The total standing surface is summed and compared to the total budget; where `context_window_tokens` is declared, headroom is reported as a **percentage**.
- **BUDG-3 [J]** A sustained overage is either fixed or a **deliberate, recorded** decision — not waved-off drift.

## RUN — Runtime levers

→ [standard §4](tokenomics-standard.md#4-the-runtime-levers)

- **RUN-1 [J]** Prompt caching: the stable prefix is cacheable and being **hit** — not invalidated each turn by volatile content placed high in the prompt.
- **RUN-2 [J]** Model tier matches the work's value — a cheap tier for mechanical / bulk steps, the top tier reserved for the hard ones. Whether `preferred_model` is declared is checked mechanically (CFG-4 [M]); its _appropriateness_ for the work is this judgment item.
- **RUN-3 [J]** Long conversations are compacted before history bloats the window (`autoCompactEnabled` on, unless deliberately off), and sub-agent fan-out is proportionate (each sub-agent re-pays the whole standing surface). Note that the skill-description listing is not re-injected after a compaction — only invoked skills survive.
- **RUN-4 [J]** Tool-result verbosity is controlled — raw logs / JSON not re-read every turn — which is the standing case for compression tooling (TOOL).
- **RUN-5 [M]** A default model pinned in `settings.json` is reported where present, so the tier choice (RUN-2) is visible.

## TOOL — Compression tooling (Headroom)

→ [standard §5](tokenomics-standard.md#5-context-compression-tooling-headroom-and-the-registry)

- **TOOL-1 [M]** The checker detects configured context-compression tooling across both layers — for the seeded **Headroom** entry: an `mcpServers` `headroom` entry (exposing `headroom_compress` / `_retrieve` / `_stats`), a `headroom proxy`, or `HEADROOM_*` env — and any other registry entry the same way.
- **TOOL-2 [M]** The declared expectation is honoured: `headroom = "required"` and absent → **FAIL**; `"recommended"` and absent → **WARN**; `"off"` → skipped, no finding.
- **TOOL-3 [J]** Where present, the setup is **optimal** — the reversible store (CCR) on with a sane TTL, the cache-aligner active so compression still lets prompt-cache prefixes hit, output-shaper / holdout set deliberately. The exact keys are undocumented upstream, so this stays judgment (and a pinned REFRESH watch-item) until they are published, at which point it becomes mechanical.

## CFG — Config table

→ [standard §3](tokenomics-standard.md#3-budgets-and-the-config-table)

- **CFG-1 [M]** The `[ki-tokenomics]` table is parsed and **validated down** — an unrecognised key WARNs; a malformed budget value (non-numeric) **FAILs**; another skill's table is never read.
- **CFG-2 [M]** `--init` emits the table's default keys (the authoritative key list a target scaffolds from).
- **CFG-3 [J]** The declared budgets and `headroom` expectation are **warranted** for this environment, not copied boilerplate that merely restates the defaults.
- **CFG-4 [M]** `preferred_model` is **declared** in the `[ki-tokenomics]` table — its tier value is checked mechanically; whether the chosen tier is appropriate for the work stays judgment (RUN-2).
