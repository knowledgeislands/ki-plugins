<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands activities

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-kb-activities --write`.

Line-by-line criteria for auditing ki-repo-kb-activities. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [ACT — knowledge-base activities](#act--knowledge-base-activities)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## ACT — knowledge-base activities

→ [standard](standards-activities.md)

Activity note structure, frontmatter, realization-specific declarations, and safe index maintenance.

- **ACT-S-1 [M + J] — activity index** — `Activities.md` exists when one or more activity notes exist and lists every note. (standards-activities.md)
  - _Remediation:_ automatic
  - _Evidence scope:_ The Activities index, its note entries, ordering, and reader-facing descriptions.
  - _Review prompt:_ Is the index current, well ordered, and informative rather than merely mechanically complete?
  - _Outcomes:_ conforming; index revision required; index structure decision required
  - _Conforming guidance:_ Revise the index ordering or descriptions so a reader can understand and navigate the active activity set; record a structure decision for a material reorganisation.
- **ACT-S-2 [M] — activity collection location** — The configured activity collection resolves safely beneath an existing base. (standards-activities.md)
  - _Remediation:_ diagnostic — Correct activities_dir so it resolves safely beneath the selected base, or repair the unsafe collection entry without following links.
- **ACT-S-3 [M] — known Activity configuration** — Only activities_dir and harness are recognized under [skills.ki-repo-kb-activities]. (standards-activities.md)
  - _Remediation:_ diagnostic — Remove or document unsupported configuration keys after confirming the activity collection contract they were intended to express.
- **ACT-F-1 [M] — activity status** — Frontmatter-bearing activity notes declare `status` as `active`, `paused`, or `retired`. (standards-activities.md)
  - _Remediation:_ diagnostic — Add a valid activity status that reflects the activity’s actual lifecycle state.
- **ACT-F-2 [M] — activity realization** — Frontmatter-bearing activity notes declare a `realization`. (standards-activities.md)
  - _Remediation:_ diagnostic — Declare the activity realization that accurately describes how the activity is invoked or operated.
- **ACT-F-3 [M] — recognized realization** — Unknown realization values are surfaced for environment documentation without blocking extension. (standards-activities.md)
  - _Remediation:_ diagnostic — Document an unknown realization in the agentic environment or select a known realization only when it accurately describes the activity.
- **ACT-F-4 [M] — activity author** — Frontmatter-bearing activity notes declare who authored or adopted the activity. (standards-activities.md)
  - _Remediation:_ diagnostic — Declare the person or agent that authored or adopted the activity according to its actual provenance.
- **ACT-R-1 [M] — slash-command skill field** — A `slash-command` activity declares its `skill` field. (standards-activities.md)
  - _Remediation:_ diagnostic — Declare the owning SKILL.md for the slash-command activity after confirming the command’s intended capability.
- **ACT-R-2 [M] — slash-command skill resolution** — A declared slash-command skill resolves when a harness path is supplied. (standards-activities.md)
  - _Remediation:_ diagnostic — Correct the declared skill or configure the intended harness path; do not infer a substitute capability automatically.
- **ACT-R-3 [M] — scheduled-task name** — A `scheduled-task` activity declares its `schedule_name`. (standards-activities.md)
  - _Remediation:_ diagnostic — Declare the external scheduler’s actual task name for the scheduled activity.
- **ACT-R-4 [M] — scheduled-task registration** — Scheduled-task registrations are surfaced for verification in their external environment. (standards-activities.md)
  - _Remediation:_ diagnostic — Verify the named task in its external scheduler and update the activity note or scheduler registration through the owning environment.
- **ACT-J-1 [J] — activity note clarity** — Each activity note body explains what the activity does, when it runs, and why it was adopted. (standards-activities.md)
  - _Evidence scope:_ Every activity note body and its stated purpose, trigger, and adoption rationale.
  - _Review prompt:_ Does each activity note clearly explain what it does, when it runs, and why it was adopted?
  - _Outcomes:_ conforming; narrative revision required; rationale required
  - _Conforming guidance:_ Add a concise explanation of behaviour, trigger or cadence, and adoption rationale while retaining the note’s operational focus.
- **ACT-J-2 [J] — activity index quality** — The activity index is current, ordered, and useful to a reader. (standards-activities.md)
  - _Evidence scope:_ The Activities index and its ordering, descriptions, and current activity coverage.
  - _Review prompt:_ Is the activity index current, ordered, and useful rather than just mechanically complete?
  - _Outcomes:_ conforming; index revision required; organisation decision required
  - _Conforming guidance:_ Revise ordering and descriptions to aid a reader, or record the organisation decision that explains a non-obvious index structure.
- **ACT-J-3 [J] — retirement rationale** — Retired activities document why they were retired rather than disappearing silently. (standards-activities.md)
  - _Evidence scope:_ Every retired activity note and its lifecycle history.
  - _Review prompt:_ Do retired activities document a clear retirement rationale?
  - _Outcomes:_ conforming; rationale required; status correction required
  - _Conforming guidance:_ Record why the activity was retired and the relevant replacement or cessation context, or correct a status that does not reflect retirement.
- **ACT-J-4 [J] — slash-command documentation** — Slash-command activities link to their skill documentation or trigger description. (standards-activities.md)
  - _Evidence scope:_ Every slash-command activity and its linked skill documentation or trigger guidance.
  - _Review prompt:_ Does every slash-command activity link to useful skill documentation or trigger guidance?
  - _Outcomes:_ conforming; documentation link required; trigger guidance required
  - _Conforming guidance:_ Link the activity to its authoritative skill documentation or add clear trigger guidance that explains how it is invoked.
- **ACT-J-5 [J] — scheduled-task narrative** — Scheduled-task activities document cadence and expected outcome. (standards-activities.md)
  - _Evidence scope:_ Every scheduled-task activity note, its cadence, and expected outcome.
  - _Review prompt:_ Does every scheduled-task note state its cadence and expected outcome?
  - _Outcomes:_ conforming; cadence required; outcome required
  - _Conforming guidance:_ State the scheduler cadence and the expected observable outcome so operators can distinguish normal execution from drift.
