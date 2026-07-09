# Mode QUERY — answer from the base

_On-demand procedure for kb's QUERY mode. The shared model — the five-zone structure, routing test, memory cascade, project bindings, and Step 1 (Load context) — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

1. Search and read the relevant notes (memory index, profile notes, the topical zones).
2. Answer, citing the path to the source note or paired source document.
3. If the base cannot answer it, capture the researched answer as a new note (fall through to Mode SAVE).

**Special query: `?templates`** — list the available note templates for this base. Read `references/templates/` in the skill, then any overrides declared in `[ki-kb.templates]` in the base's config. Return the zone, template name, and a one-line description of what each template is for. Do not create any files.
