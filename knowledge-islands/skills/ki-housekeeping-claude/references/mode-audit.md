# Mode AUDIT — inspect bounded Claude state

_On-demand procedure for `ki-housekeeping-claude` AUDIT. The domain and auto-memory model live in [`SKILL.md`](../SKILL.md) and its standards._

1. Run `ki repo educate --skill ki-housekeeping-claude` once to declare the skill for the repository, then run `ki repo audit --skill ki-housekeeping-claude`. The audit inspects only the selected repository's physical `~/.claude/projects/<selected-repository-slug>/memory/` directory, never arbitrary user paths or foreign project memories. If that selected directory is absent, it reports **NA**.
2. `IDX-6` inspects the selected repository memory only.
3. Apply the **[J]** items in [the rubric](rubric.md) by reading each memory file: Why/How-to-apply structure, absolute dates, CLAUDE.md-duplication candidates, neutral tone, staleness, and semantic index organisation.
4. For sessions, artifacts, backups, plugins, and caches, use the paired `mcp-claude-housekeeping` server's bounded audit tools and apply this skill's judgment to their report.
5. Report one findings table, mechanical evidence first and the judgment pass second.
