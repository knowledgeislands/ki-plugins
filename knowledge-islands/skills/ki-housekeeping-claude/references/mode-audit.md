# Mode AUDIT — inspect bounded Claude state

_On-demand procedure for `ki-housekeeping-claude` AUDIT. The domain and auto-memory model live in [`SKILL.md`](../SKILL.md) and its standards._

1. Run `ki repo educate --skill ki-housekeeping-claude` once to declare the skill for the repository, then run `ki repo audit --skill ki-housekeeping-claude`. The audit first establishes a selected native directory from readable local settings. Missing, malformed, disabled or unsupported, and out-of-bounds override evidence is a **FAIL**; it never assumes the default. A selected but absent physical directory is **NA**. The audit never traverses arbitrary user paths or foreign project memories.
2. `IDX-6` inspects the selected repository memory only.
3. Apply the **[J]** items in [the rubric](rubric.md) by reading each memory file: Why/How-to-apply structure, absolute dates, CLAUDE.md-duplication candidates, neutral tone, staleness, and semantic index organisation.
4. For sessions, artifacts, backups, plugins, and caches, report server state **unavailable** unless its registration, access exposure, and executed audit report are independently present. A source checkout or inventory declaration alone is not runtime evidence. Apply this skill's judgment only to that obtained report.
5. Report one findings table, mechanical evidence first and the judgment pass second.
