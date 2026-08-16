# Recap sources

**Refresh:** external-spec · monthly

| Source | Last reviewed | Governs |
| --- | --- | --- |
| [OpenAI Codex developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli) | 2026-08-12 | User-invocable `/compact` and current Codex session controls |
| [OpenAI Codex hooks](https://learn.chatgpt.com/docs/hooks) | 2026-08-12 | Manual/automatic compaction hooks and transcript-format stability boundary |
| [Claude Code sessions](https://code.claude.com/docs/en/sessions) | 2026-08-12 | Session storage, compaction, and transcript parsing boundary |
| [Claude Code hooks](https://code.claude.com/docs/en/hooks) | 2026-08-12 | Manual/automatic compaction events |

## Last review

Current official documentation shows that both Codex and Claude Code expose user-invocable `/compact` alongside automatic compaction. The command does not grant an agent standing authority to invoke it. Both vendors expose transcript paths or files, but their structured formats are version-sensitive convenience surfaces; Git remains the authoritative repository-grounding source.
