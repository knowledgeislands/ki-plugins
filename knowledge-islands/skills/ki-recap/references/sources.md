# Recap sources

**Refresh:** external-spec · monthly

| Source | Last reviewed | Governs |
| --- | --- | --- |
| [OpenAI Codex developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli) | 2026-09-26 | User-invocable `/compact` and current Codex session controls |
| [OpenAI Codex hooks](https://learn.chatgpt.com/docs/hooks) | 2026-09-26 | Manual/automatic compaction hooks and transcript-format stability boundary |
| [Claude Code sessions](https://code.claude.com/docs/en/sessions) | 2026-09-26 | Session storage, compaction, and transcript parsing boundary |
| [Claude Code hooks](https://code.claude.com/docs/en/hooks) | 2026-09-26 | Manual/automatic compaction events |

## Last review

On 2026-09-26, current official documentation still showed both Codex and Claude Code exposing user-invocable `/compact` alongside automatic compaction. Codex also documents explicit pre- and post-compaction hook events. These controls do not grant an agent standing authority to invoke compaction. Both vendors expose transcript paths or files, but their structured formats remain version-sensitive convenience surfaces; Git remains the authoritative repository-grounding source.
