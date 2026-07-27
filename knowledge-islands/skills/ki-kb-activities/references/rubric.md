<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands activities

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-kb-activities --write`.

Line-by-line criteria for auditing ki-kb-activities. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [ACT — knowledge-base activities](#act--knowledge-base-activities)

## ACT — knowledge-base activities

→ [standard](standards-activities.md)

Activity note structure, frontmatter, realization-specific declarations, and safe index maintenance.

- **ACT-S-1 [M + J] — activity index** — `Activities.md` exists when one or more activity notes exist and lists every note. (standards-activities.md)
  - _Review prompt:_ Is the index current, well ordered, and informative rather than merely mechanically complete?
- **ACT-S-2 [M] — activity collection location** — The configured activity collection resolves safely beneath an existing base. (standards-activities.md)
- **ACT-S-3 [M] — known Activity configuration** — Only activities_dir and harness are recognized under [ki-kb-activities]. (standards-activities.md)
- **ACT-F-1 [M] — activity status** — Frontmatter-bearing activity notes declare `status` as `active`, `paused`, or `retired`. (standards-activities.md)
- **ACT-F-2 [M] — activity realization** — Frontmatter-bearing activity notes declare a `realization`. (standards-activities.md)
- **ACT-F-3 [M] — recognized realization** — Unknown realization values are surfaced for environment documentation without blocking extension. (standards-activities.md)
- **ACT-F-4 [M] — activity author** — Frontmatter-bearing activity notes declare who authored or adopted the activity. (standards-activities.md)
- **ACT-R-1 [M] — slash-command skill field** — A `slash-command` activity declares its `skill` field. (standards-activities.md)
- **ACT-R-2 [M] — slash-command skill resolution** — A declared slash-command skill resolves when a harness path is supplied. (standards-activities.md)
- **ACT-R-3 [M] — scheduled-task name** — A `scheduled-task` activity declares its `schedule_name`. (standards-activities.md)
- **ACT-R-4 [M] — scheduled-task registration** — Scheduled-task registrations are surfaced for verification in their external environment. (standards-activities.md)
- **ACT-J-1 [J] — activity note clarity** — Each activity note body explains what the activity does, when it runs, and why it was adopted. (standards-activities.md)
  - _Review prompt:_ Does each activity note clearly explain what it does, when it runs, and why it was adopted?
- **ACT-J-2 [J] — activity index quality** — The activity index is current, ordered, and useful to a reader. (standards-activities.md)
  - _Review prompt:_ Is the activity index current, ordered, and useful rather than just mechanically complete?
- **ACT-J-3 [J] — retirement rationale** — Retired activities document why they were retired rather than disappearing silently. (standards-activities.md)
  - _Review prompt:_ Do retired activities document a clear retirement rationale?
- **ACT-J-4 [J] — slash-command documentation** — Slash-command activities link to their skill documentation or trigger description. (standards-activities.md)
  - _Review prompt:_ Does every slash-command activity link to useful skill documentation or trigger guidance?
- **ACT-J-5 [J] — scheduled-task narrative** — Scheduled-task activities document cadence and expected outcome. (standards-activities.md)
  - _Review prompt:_ Does every scheduled-task note state its cadence and expected outcome?
