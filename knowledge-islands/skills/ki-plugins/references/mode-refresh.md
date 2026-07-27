# Mode REFRESH — re-anchor the plugin contract

**Precondition:** REFRESH edits this skill's canonical files in `ki-agentic-harness`. An installed copy stops and names the harness as the place to run it.

1. Read [the source list](sources.md) and its review dates.
2. Re-fetch the authoritative Claude plugin and marketplace specifications. Diff them against [the plugin-marketplace standard](standards-plugin-marketplace.md), [the rubric](rubric.md), and the structured family under `scripts/rubric/items/`.
3. Keep specification requirements distinct from house projection choices: the one-plugin shape, governance-agent flattening, and MCP deferral remain KI conventions unless the source specification changes their feasibility.
4. Update the standard and family definitions where evidence changed, regenerate with `ki skill rubric ki-plugins --write`, and bump the source review dates.
