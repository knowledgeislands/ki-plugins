# Sources — where the tokenomics standard comes from

**Refresh:** external-spec · weekly

The authoritative and community sources behind [the standard](tokenomics-standard.md), [the rubric](audit-rubric.md), and [`../scripts/audit.ts`](../scripts/audit.ts). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + checker, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This area moves fast — model windows, prices, cache TTLs, Headroom's config surface, Anthropic's guidance, and Claude Code's own context surface — so this list is the skill's memory of where the standard comes from; keep it current.

The volatile **numbers** themselves (model ids, prices, cache TTLs, context-window sizes) are not held here or in the standard — they live in the `claude-api` skill and are resolved at runtime (standard §7). This list tracks the sources for the budget's _shape_ and the tooling.

## Authoritative

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [Effective context engineering for AI agents][ctx-eng] | context-engineering principles※ | 2026-06-21 |
| [Claude context windows][ctx-win] | window mechanics; the volatile sizes (deferred to `claude-api`) | 2026-06-21 |
| [Prompt caching][caching] | cache prefix / TTL mechanics behind the caching lever (§4) | 2026-06-21 |
| [Claude Code memory & `CLAUDE.md`][cc-memory] | what auto-loads + `@import` resolution; auto memory (§2) | 2026-06-21 |
| [Claude Code context window][cc-ctxwin] | startup composition, tool search, what survives compaction (§2,§4) | 2026-06-21 |
| [Claude Code settings][cc-settings] | `settings.json` keys: model, compaction, skill-listing caps (§2,§4) | 2026-07-04 |
| [Claude Code MCP][cc-mcp] | where MCP servers are configured; tool search defers schemas (§2) | 2026-06-21 |
| [Agent Skills standard][skills-std] | skill `description` loads in the selection surface (§2) | 2026-07-04 |
| [Prompting guides — model-type resolution][prompt-guides] | which concrete model each portable type resolves to per runtime (§3, ADR-008); the Claude column | 2026-07-13 |
| [GPT-5.6 Codex tiers (preview)][gpt56] | the Codex column of the type resolution — **preview, volatile; reconfirm each REFRESH** | 2026-07-13 |

※ Governs the finite-resource framing, minimal tool sets, and context ordering (§1, §6).

## Community / tooling

| Source                                         | Governs                                                             | Last reviewed |
| ---------------------------------------------- | ------------------------------------------------------------------- | ------------- |
| [Headroom — chopratejas/headroom][hr]          | the seeded compression-layer registry entry; detection + setup (§5) | 2026-07-04    |
| [Headroom app — extraheadroom.com][hra]        | the menu-bar proxy variant of the same engine (§5)                  | 2026-06-21    |
| Installed Headroom 0.31.0 CLI + package source | reset and per-project proxy contracts (§5)                          | 2026-07-16    |

## Last review

REFRESH last run **2026-07-04** (prior: 2026-06-21). Re-verified live this run: Headroom's GitHub repo, the Claude Code settings doc, and the Agent Skills specification. The standard, rubric, and checker still hold — no drift in any asserted behaviour; the only stale fact was Headroom's pinned version. All volatile figures remain deferred to `claude-api` (standard §7).

Targeted operational verification **2026-07-16**: installed Headroom 0.31.0 `savings`, `perf`, and `install` help plus `headroom.paths`, `headroom.cli.savings`, `headroom.perf.analyzer`, `headroom.proxy.helpers`, `headroom.proxy.server`, `headroom.proxy.savings_tracker`, and `headroom.install.runtime` establish the independent reset surfaces and safety constraints recorded in [the operations procedure](headroom-operations.md). This corrected the staged assumption that `headroom savings --reset` clears all dashboard state: it deletes only the CLI environment's resolved `savings_events.jsonl`; `/stats` uses separate runtime counters and a separately resolved `proxy_savings.json` history.

The same installed-source verification establishes the proxy's URL-encoded `/p/<name>` project-context path, `X-Headroom-Project` header precedence, default `127.0.0.1:8787` endpoint, and the `savings.per_project` breakdown returned by `/stats`. The standard therefore scopes an existing project-local loopback override mechanically, while leaving remote or ambiguous gateways untouched.

- **Headroom** (chopratejas/headroom + extraheadroom.com): the 2026-07-04 full upstream REFRESH found **v0.30.0** (was v0.26.0), still `headroom-ai` on PyPI/npm and `ghcr.io/chopratejas/headroom` Docker, Apache-2.0, Python 3.10+. Same three MCP tools (`headroom_compress` / `headroom_retrieve` / `headroom_stats`), canonical install still `headroom mcp install`; `headroom proxy` / `headroom wrap` modes unchanged. Headline **60–95%** savings confirmed, with new per-workload figures (92% code search, 92% SRE incident debug, 73% GitHub issue triage, 47% codebase exploration); budget ~20–30% on mixed work. New env key `HEADROOM_TLS_STRICT` seen (TLS/runtime knob — **not** a detection or optimal-setup signal); `HEADROOM_OUTPUT_SHAPER` / `HEADROOM_OUTPUT_HOLDOUT` and the offload knobs unchanged. No §5 or checker change beyond the version stamp. The targeted local operational verification above used installed v0.31.0; the next full REFRESH must reconcile the upstream version row.
- **Claude Code settings** (code.claude.com/docs/en/settings): `autoCompactEnabled` (default **true**, v2.1.119+) and `claudeMdExcludes` both confirmed live — matches §4/RUN-3 and the CONFORM lever. New model-restriction keys observed (`availableModels`, `enforceAvailableModels` v2.1.175+, `modelOverrides`, `fallbackModel`, `advisorModel`) bear only on RUN-2/CFG-4 `preferred_model` and need no standard change. The page truncated before the skill-listing / tool-search rows this fetch, so `maxSkillDescriptionChars` / `skillListingBudgetFraction` / `ENABLE_TOOL_SEARCH` were **not** re-confirmed — they stand from the 2026-06-21 verification; re-confirm next run.
- **Agent Skills specification** (agentskills.io/specification): confirms `name` max 64 chars and `description` max **1024** chars (non-empty), description in the ~100-token selection surface via progressive disclosure. This spec cap is distinct from Claude Code's `maxSkillDescriptionChars` (1536) cited in §2‡ — different mechanisms, both intact. No change needed.
- **Open watch-items:**
  - **Pin Headroom's exact config surface.** The `mcpServers` JSON entry shape, the CCR store path + TTL key (`claude_analysis_ttl.py` present but unexplained), and the cache-aligner toggle are still **not documented** upstream (CLI/env-driven). TOOL-3 (optimal-setup) stays judgment; promote to a mechanical check the moment those keys are published. Re-fetch the repo next run.
  - **Re-check Headroom's reset surface.** Re-run the installed `savings`, `perf`, and `install` help and inspect path resolution, raw-runtime shutdown, `/stats/reset`, log discovery/rotation, and both savings stores. Replace the version-pinned procedure when a supported universal or durable proxy-history reset appears.
  - **Promote `ENABLE_TOOL_SEARCH` to a mechanical check?** Still a concrete env signal bearing on the MCP-schema standing cost — consider teaching the checker to read it so MCP-3's tool-search clause becomes [M]. Re-confirm the key still exists (this run's settings fetch truncated before it).
  - **Re-confirm the Claude Code config surface each run** — it shifts under the skill, which is why the skill resolves it at runtime. This run added new model-restriction keys (immaterial to tokenomics) and could not re-verify the skill-listing/tool-search rows.
  - The **"Netflix Headroom" attribution** remains uncorroborated by the repo — do not assert a Netflix origin.
  - Watch for a **second registry entry** worth seeding so the compression-tooling registry is plural in fact.

[ctx-eng]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[ctx-win]: https://platform.claude.com/docs/en/build-with-claude/context-windows
[caching]: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
[cc-memory]: https://code.claude.com/docs/en/memory
[cc-ctxwin]: https://code.claude.com/docs/en/context-window
[cc-settings]: https://code.claude.com/docs/en/settings
[cc-mcp]: https://code.claude.com/docs/en/mcp
[skills-std]: https://agentskills.io/specification
[prompt-guides]: ../../../../docs/guides/prompting/README.md
[gpt56]: https://codex.danielvaughan.com/2026/06/26/gpt-5-6-sol-terra-luna-preview-codex-cli-model-tiers-pricing-ultra-mode-configuration/
[hr]: https://github.com/chopratejas/headroom
[hra]: https://extraheadroom.com/
