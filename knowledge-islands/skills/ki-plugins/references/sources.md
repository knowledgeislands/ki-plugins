# Sources — where the standard comes from

**Refresh:** external-spec · quarterly

The authoritative sources behind the [Plugins Standard](plugins-standard.md) and [Audit Rubric](audit-rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + [`scripts/audit-plugins.ts`](../scripts/audit-plugins.ts), then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

Two layers feed the standard: the **Claude plugin / marketplace manifest spec** (what every conformant marketplace and plugin must do) and the **in-house projection convention** (the opinionated shape the harness projects — one plugin, `agents/governance` flattening, MCP deferred). A finding is only "spec-driven" if it traces to the Authoritative table; everything else is a house projection choice and should be labelled as such.

## Authoritative (Claude plugin + marketplace spec)

| Tag         | Source                                     | Governs | Last reviewed |
| ----------- | ------------------------------------------ | ------- | ------------- |
| MARKETPLACE | [Plugin marketplaces][marketplace]         | †       | 2026-07-09    |
| PLUGIN      | [Plugin reference — `plugin.json`][plugin] | ‡       | 2026-07-09    |
| PLUGINS     | [Plugins overview / components][plugins]   | §       | 2026-07-09    |

† `marketplace.json` shape — `name`, `owner`, `plugins[]` entries (`name` / `source` / `description`). ‡ `plugin.json` shape — `name`, `version`, `description`, `author`; the `skills/` and `agents/` component dirs. § Which components a plugin may ship (commands, agents, skills, MCP servers) — bears on the MCP-deferred rule.

[marketplace]: https://docs.claude.com/en/docs/claude-code/plugin-marketplaces
[plugin]: https://docs.claude.com/en/docs/claude-code/plugins-reference
[plugins]: https://docs.claude.com/en/docs/claude-code/plugins

## In-house (projection convention)

The one-plugin marketplace, the verbatim `skills/` copy, the `agents/governance` → flat `agents/` flattening, the MCP-deferred rule, and the byte-for-byte-reproducible invariant are house choices, defined by the generator [`ki-binding/scripts/build-plugin.ts`](../../ki-binding/scripts/build-plugin.ts) and recorded in `ADR-KI-HARNESS-005`. They are not spec requirements — a REFRESH must not promote them to "MUST" against the authoritative table.

## Last review

- **2026-07-09** — Initial standard. Spec confirmed: marketplace `name`/`owner`/`plugins[]` and plugin `name`/`version`/`description`/`author`. Open watch-item: whether `.mcp.json` becomes viable in the Cowork sandbox (would retire the MCP-deferred rule).
