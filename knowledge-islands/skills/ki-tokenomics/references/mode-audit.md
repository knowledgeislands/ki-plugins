# Mode AUDIT — measure the bounded user layer

_On-demand procedure for `ki-tokenomics` AUDIT. The composition model, budgets, and Headroom registry live in [`SKILL.md`](../SKILL.md) and [the tokenomics standard](standards-tokenomics.md)._

1. Run `ki repo audit --skill ki-tokenomics`. The structured session reads only physical evidence inside the declared user-home `.claude` and `.claude.json` scope, does not follow symlinks, and reports repository-selected evidence as **NA** rather than guessing it.
2. Apply the **[J]** criteria in [the rubric](rubric.md): whether standing instruction earns its cost, MCP servers and tool sets are useful, overages are deliberate, runtime levers are proportionate, and compression setup is sound.
3. Compose sibling audits without re-owning their standards: `ki-mcp` for server design, `ki-skills` for skill descriptions, and `ki-kb` for a base's loaded structure.
4. Report by layer, component, estimated cost, and owning fix. Mark every `chars / 4` figure as approximate and distinguish user-wide evidence from unavailable repository evidence.
