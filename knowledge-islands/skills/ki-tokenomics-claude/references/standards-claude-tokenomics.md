# Claude Code tokenomics evidence

The selected repository's Claude evidence consists only of physical repository `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/`, `.claude/settings.json`, and `.mcp.json` surfaces. The audit does not read user-home state, another repository, live session data, or symbolic links.

The resolver counts only directly observed instruction source text and resolves `@` imports relative to their importing file, rejecting cycles, depth overflow, out-of-repository targets, and symbolic links. It ignores code fences. It reports only parseable settings and MCP-source presence, never their values.

Effective model, loaded context hierarchy, active MCP tools, approvals, trust, memory use, Headroom execution, billing, tool-schema weights, transcript, and compaction totals are not inferred from filesystem evidence. They remain unavailable absent separately authorised session evidence.
