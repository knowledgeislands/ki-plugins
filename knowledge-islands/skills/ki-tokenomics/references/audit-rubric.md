# Audit Rubric — the checkable criteria

Line-by-line pass/fail criteria for auditing the **tokenomics** of a Claude Code environment against [the standard](tokenomics-standard.md). Each is tagged **[M] mechanical** (the bundled [checker](../scripts/audit.ts) decides it) or **[J] judgment** (you assess it by reading). The **code** in bold (`COMP-1`, `MCP-2`, …) is the area's short code plus its number within that area; numbering restarts at 1 per area. Each criterion cites the [standard](tokenomics-standard.md) section it verifies.

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
- **RUN-2 [J]** Model type matches the work's value — a `fast` type for mechanical / bulk steps, a `reasoning` / `frontier` type reserved for the hard ones. Whether `preferred_model_type` is declared is checked mechanically (CFG-4 [M]); its _appropriateness_ for the work — and whether any `model_tier_bindings` name a sensible model for each type — is this judgment item.
- **RUN-3 [J]** Long conversations are compacted before history bloats the window (`autoCompactEnabled` on, unless deliberately off), and sub-agent fan-out is proportionate (each sub-agent re-pays the whole standing surface). Note that the skill-description listing is not re-injected after a compaction — only invoked skills survive.
- **RUN-4 [J]** Tool-result verbosity is controlled — raw logs / JSON not re-read every turn — which is the standing case for compression tooling (TOOL).
- **RUN-5 [M]** A default model pinned in `settings.json` is reported where present, so the type choice (RUN-2) is visible.

## TOOL — Compression tooling (Headroom)

→ [standard §5](tokenomics-standard.md#5-context-compression-tooling-headroom-and-the-registry)

- **TOOL-1 [M]** The checker detects configured context-compression tooling across both layers — for the seeded **Headroom** entry: an `mcpServers` `headroom` entry (exposing `headroom_compress` / `_retrieve` / `_stats`), a `headroom proxy`, or `HEADROOM_*` env — and any other registry entry the same way.
- **TOOL-2 [M]** The declared expectation is honoured: `headroom = "required"` and absent → **FAIL**; `"recommended"` and absent → **WARN**; `"off"` → skipped, no finding.
- **TOOL-3 [J]** Where present, the setup is **optimal** — the reversible store (CCR) on with a sane TTL, the cache-aligner active so compression still lets prompt-cache prefixes hit, output-shaper / holdout set deliberately. The exact keys are undocumented upstream, so this stays judgment (and a pinned REFRESH watch-item) until they are published, at which point it becomes mechanical.
- **TOOL-4 [M]** The `headroom:learn` block Headroom writes into the project `CLAUDE.md` carries no cross-repo captures. `headroom --learn` mines whatever island the session ran in, so an absolute `knowledgeislands/<repo>` path _inside the markers_ whose `<repo>` differs from the audited repo is stale noise paid for on every turn in the always-on prefix. Any such line is a WARN; the fix is judgment (re-learn here, or prune), so it routes to CONFORM. Scoped inside the markers, keyed on absolute KI-sibling roots (relative `../sibling` refs left alone — a governance repo uses them legitimately). Mirrors `ki-housekeeping` IDX-6, which applies the same check to `MEMORY.md`.
- **TOOL-5 [M]** Effective project-local Claude settings that already route `ANTHROPIC_BASE_URL` through a recognised loopback Headroom proxy attribute traffic to the repository name through `/p/<repo-name>` or a matching `X-Headroom-Project` custom header. `settings.local.json` takes precedence when it declares the value, and Headroom gives the header precedence over the path. Missing or mismatched attribution is a WARN; malformed project settings WARN because the scope cannot be inspected. CONFORM rewrites only the tracked `settings.json` URL string token when no local override or explicit header owns it, preserves all unrelated bytes, and is idempotent. The checker recognises the canonical loopback port `8787`, or an already `/p/…`-scoped loopback URL on a custom port; remote and ambiguous gateways are out of scope and never mutated.

## CFG — Config table

→ [standard §3](tokenomics-standard.md#3-budgets-and-the-config-table)

- **CFG-1 [M]** The `[ki-tokenomics]` table is parsed and **validated down** — an unrecognised key WARNs; a malformed budget value (non-numeric) **FAILs**; another skill's table is never read.
- **CFG-2 [M]** `--educate` emits the table's default keys (the authoritative key list a target scaffolds from).
- **CFG-3 [J]** The declared budgets and `headroom` expectation are **warranted** for this environment, not copied boilerplate that merely restates the defaults.
- **CFG-4 [M]** `preferred_model_type` is **declared** in the `[ki-tokenomics]` table with a value in the portable set (`frontier` / `reasoning` / `standard` / `fast`); whether the chosen type is appropriate for the work stays judgment (RUN-2). A lingering pre-ADR-KI-HARNESS-009 `preferred_model` (a Claude alias) is a FAIL with a migration hint — conform maps the alias to its type.
- **CFG-5 [M]** `[ki-tokenomics.model_tier_bindings]`, if present, rebinds each type to the concrete model(s) this runtime supports. Keys are strict — each must be one of the four types (an unknown key is a FAIL); values are open, comma-separated ordered preference lists resolved first-match per runtime, requiring ≥1 non-empty entry (an empty value is a FAIL). Individual model names stay open (runtime-specific, volatile) — an unrecognised name is judgment (RUN-2), never a mechanical FAIL. Resolved bindings surface as INFO.
