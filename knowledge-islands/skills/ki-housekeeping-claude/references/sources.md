# Tracked sources

**Refresh:** external-spec · 180d

Recorded sources cover independent evidence surfaces (see [the Claude-state standard](standards-claude-state.md) §3): native Claude memory selection and loading, Headroom-rendered output and optional database operations, and the `mcp-claude-housekeeping` source payload. A source record never proves a current server registration, access exposure, or executed audit. Update `last reviewed` on every REFRESH, whether or not anything changed.

| Source                                                                  | Last reviewed |
| ----------------------------------------------------------------------- | ------------- |
| Recorded native Claude settings evidence (`autoMemoryDirectory`)         | 2026-08-12    |
| [extraheadroom.com/reduce-claude-code-costs][headroom-tools]            | 2026-07-04    |
| Recorded Headroom CLI evidence: tracked 0.31.0; installed 0.34.0        | 2026-08-12    |
| `@knowledgeislands/mcp-claude-housekeeping` source README + tool surface | 2026-07-09    |

## Notes

- Native Claude owns the selected memory location and effective loading. The local resolver needs readable settings evidence before it selects the default directory; it reports missing, malformed, disabled or unsupported, and out-of-bounds override evidence unavailable rather than assuming a default. This record does not assert a serialized disabled-value syntax.
- Headroom rendered output and native Claude memory are distinct. The recorded version drift (tracked 0.31.0 versus installed 0.34.0) means the local format and database-operation wording are not a claim about the installed runtime. REFRESH rechecks the exact version and documented command behavior before changing those claims.
- The server README and tool surface establish a source payload only. REFRESH must record registration, access exposure, and executed-audit evidence independently if a runtime claim is needed.
- If Headroom ships a documented, versioned schema for `MEMORY.md` / frontmatter, replace this row with that URL and re-derive `standards-auto-memory.md` and the checker from it directly.

[headroom-tools]: https://extraheadroom.com/reduce-claude-code-costs
