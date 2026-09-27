# Tracked sources

**Refresh:** external-spec · 180d

Recorded sources cover independent evidence surfaces (see [the Claude-state standard](standards-claude-state.md) §3): native Claude memory selection and loading, Headroom-rendered output and optional database operations, and the `mcp-housekeeping-claude` source payload. A source record never proves a current server registration, access exposure, or executed audit. Update `last reviewed` on every REFRESH, whether or not anything changed.

| Source                                                                  | Last reviewed |
| ----------------------------------------------------------------------- | ------------- |
| [Claude Code memory][claude-memory]                                   | 2026-09-27    |
| [Claude Code settings][claude-settings]                                | 2026-09-27    |
| [Claude Code environment variables][claude-env]                        | 2026-09-27    |
| [extraheadroom.com/reduce-claude-code-costs][headroom-tools]            | 2026-07-04    |
| Recorded Headroom CLI evidence: tracked 0.31.0; installed 0.34.0        | 2026-08-12    |
| `@knowledgeislands/mcp-housekeeping-claude` source README + tool surface | 2026-07-09    |

## Notes

- Claude Code enables auto-memory by default. `autoMemoryEnabled: false` disables it; project and project-local settings can override user settings. `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` disables it, while `=0` forces it on. Managed settings and session overrides require separate runtime evidence.
- Headroom rendered output and native Claude memory are distinct. The recorded version drift (tracked 0.31.0 versus installed 0.34.0) means the local format and database-operation wording are not a claim about the installed runtime. REFRESH rechecks the exact version and documented command behavior before changing those claims.
- The server README and tool surface establish a source payload only. REFRESH must record registration, access exposure, and executed-audit evidence independently if a runtime claim is needed.
- If Headroom ships a documented, versioned schema for `MEMORY.md` / frontmatter, replace this row with that URL and re-derive `standards-auto-memory.md` and the checker from it directly.

[headroom-tools]: https://extraheadroom.com/reduce-claude-code-costs
[claude-memory]: https://code.claude.com/docs/en/memory
[claude-settings]: https://code.claude.com/docs/en/settings
[claude-env]: https://code.claude.com/docs/en/env-vars
