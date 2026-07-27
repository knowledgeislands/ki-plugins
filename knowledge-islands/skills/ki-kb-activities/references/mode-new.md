# Mode NEW — author a new activity note

Read the [Activity standard](standards-activities.md) first; this file contains only the NEW procedure.

1. Prompt for **Name** (becomes the filename and the `# Heading`).
2. Prompt for **Realization type** — offer the known list (`slash-command`, `scheduled-task`, `conversational`, `manual`, `workflow`); accept free text for new types.
3. Prompt for **realization-specific fields**:
   - `slash-command` → `skill:` (skill name as it appears in `skills/<name>/SKILL.md`)
   - `scheduled-task` → `schedule_name:` and `schedule_env:`
4. Prompt for **initial status** — default `active` unless otherwise stated.
5. Write `Admin/Operations/Activities/<Name>.md` with the required frontmatter and a stub body.
6. Add an entry to `Admin/Operations/Activities/Activities.md` (create the index stub if absent).
