# Claude Code tokenomics evidence

The selected repository's Claude evidence consists only of physical repository `CLAUDE.md`, `.claude/`, and `.mcp.json` surfaces plus the bounded physical user `~/.claude` and `~/.claude.json` surfaces. The audit does not enumerate `~/.claude/projects` or inspect another repository.

Measure instruction and contained `@import` content, memory where documented and present, installed skill names and descriptions, and configured MCP server names. Report settings keys or model names only when their values are not secret; never report environment, headers, tokens, or credentials. A user default model and effective repository model are distinct: project settings override a user default where configured.

Headroom detection and repository attribution are evidence only. Compression configuration, proxy routing, logs, ledgers, resets, and deletion remain manual. Billing, tool-schema weights, and transcript/compaction totals are not inferred from filesystem evidence.
