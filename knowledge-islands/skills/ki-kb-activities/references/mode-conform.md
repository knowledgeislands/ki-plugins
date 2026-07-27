# Mode CONFORM — bring activity notes into line

**Precondition:** run [AUDIT](mode-audit.md) first and retain its gap list.

1. Run `ki repo conform --skill ki-kb-activities`. The hosted action proposes one safe `Activities.md` create or update when activity notes exist and index entries are missing; the host owns dry-run, publication, rollback, and post-conform audit.
2. Prompt for missing frontmatter fields. Do not guess a note's `realization` or `status`.
3. When a `slash-command` activity names an absent skill, offer to author it with the `ki-skills` EDUCATE mode and wait for confirmation before creating it.
4. When a `scheduled-task` activity lacks `schedule_name`, obtain the name and direct the user to register it in the external scheduling environment; this skill cannot verify that external state.
5. Re-run AUDIT until the mechanical findings are clean, then report the remaining judgment review.
