# Mode AUDIT — inspect bounded Claude state

_On-demand procedure for `ki-housekeeping` AUDIT. The domain and auto-memory model live in [`SKILL.md`](../SKILL.md) and its standards._

1. Run `ki repo educate --skill ki-housekeeping` once to declare the skill for the repository, then run `ki repo audit --skill ki-housekeeping`. The audit inspects physical `~/.claude/projects/*/memory/` directories within its declared user-home scope, never arbitrary user paths. If none exist, it reports **NA**.
2. The repository subject checks `SELF-*` directly. `IDX-6` inspects the one memory directory whose Claude project slug matches the selected repository and remains **NA** for unrelated project memories.
3. Apply the **[J]** items in [the rubric](rubric.md) by reading each memory file: Why/How-to-apply structure, absolute dates, CLAUDE.md-duplication candidates, neutral tone, staleness, and semantic index organisation.
4. For sessions, artifacts, backups, plugins, and caches, use the paired `mcp-claude-housekeeping` server's bounded audit tools and apply this skill's judgment to their report.
5. Report one findings table, mechanical evidence first and the judgment pass second.
