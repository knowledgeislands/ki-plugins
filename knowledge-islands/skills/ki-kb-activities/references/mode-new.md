# Mode NEW — author a new activity note

_On-demand procedure for activities' NEW mode. The activity model — required frontmatter, realization types, and realization-specific fields — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

1. Prompt for **Name** (becomes the filename and the `# Heading`).
2. Prompt for **Realization type** — offer the known list (`slash-command`, `scheduled-task`, `conversational`, `manual`, `workflow`); accept free text for new types.
3. Prompt for **realization-specific fields**:
   - `slash-command` → `skill:` (skill name as it appears in `skills/<name>/SKILL.md`)
   - `scheduled-task` → `schedule_name:` and `schedule_env:`
4. Prompt for **initial status** — default `active` unless otherwise stated.
5. Write `Admin/Operations/Activities/<Name>.md` with the required frontmatter and a stub body.
6. Add an entry to `Admin/Operations/Activities/Activities.md` (create the index stub if absent).
