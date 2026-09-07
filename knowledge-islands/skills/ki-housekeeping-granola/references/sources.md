# Sources

**Refresh:** external-spec · quarterly

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [Granola MCP documentation][granola-mcp] | Official endpoint, OAuth, scopes, current tool descriptions | 2026-08-27 |
| [mcporter configuration][mcporter-config] | HTTP transport, OAuth credential boundary, schema and CLI access | 2026-08-27 |

## Last review

On 2026-08-27, the official MCP was registered and authenticated through the chezmoi-managed mcporter binding. Read-only live schema and representative calls established six tools, custom historical date windows, folder listing, UUID detail lookup, summaries, participants, and transcripts. The surface did not establish native pagination, completeness indicators, update versions, source URLs, tags, media, or deletion tombstones. The acquisition standard records these as explicit mechanics or omissions rather than inferred capabilities.

Refresh must inspect only schemas and privacy-minimised structural evidence. Never retain account identifiers, meeting identifiers, notes, summaries, transcripts, credentials, or media in this skill.

[granola-mcp]: https://docs.granola.ai/help-center/sharing/integrations/mcp
[mcporter-config]: https://github.com/openclaw/mcporter/blob/main/docs/config.md
