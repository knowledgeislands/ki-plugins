# Activities audit rubric

**[M]** = mechanical (checked by `scripts/audit.ts`). **[J]** = judgment (reader applies during AUDIT).

## Structural

| ID      | Check                                                                         | Level | Type |
| ------- | ----------------------------------------------------------------------------- | ----- | ---- |
| ACT-S-1 | `Activities.md` index exists when any activity note is found                  | WARN  | [M]  |
| ACT-S-2 | Activity notes live under `Admin/Operations/Activities/` (or configured path) | WARN  | [M]  |

## Frontmatter

| ID      | Check                                                     | Level    | Type |
| ------- | --------------------------------------------------------- | -------- | ---- |
| ACT-F-1 | `status` present and one of `active`, `paused`, `retired` | WARN     | [M]  |
| ACT-F-2 | `realization` present                                     | WARN     | [M]  |
| ACT-F-3 | Unrecognised `realization` value flagged as advisory      | ADVISORY | [M]  |

## Realization-specific

| ID      | Check                                                                                     | Level    | Type |
| ------- | ----------------------------------------------------------------------------------------- | -------- | ---- |
| ACT-R-1 | `slash-command`: `skill` field present and names an existing SKILL.md in the harness      | FAIL     | [M]  |
| ACT-R-2 | `slash-command`: skill is absent from the harness (declared but not yet created)          | WARN     | [M]  |
| ACT-R-3 | `scheduled-task`: `schedule_name` present                                                 | WARN     | [M]  |
| ACT-R-4 | `scheduled-task`: advisory that registration must be verified in the external environment | ADVISORY | [M]  |

## Judgment

| ID      | Check                                                                                       | Type |
| ------- | ------------------------------------------------------------------------------------------- | ---- |
| ACT-J-1 | Activity note body describes the activity clearly — what it does, when, and why adopted     | [J]  |
| ACT-J-2 | `Activities.md` index is current — all active activities listed, no stale entries           | [J]  |
| ACT-J-3 | Retired activities are documented with a retirement rationale, not silently deleted         | [J]  |
| ACT-J-4 | `slash-command` activities link to the skill's documentation or trigger description         | [J]  |
| ACT-J-5 | `scheduled-task` activities note the schedule cadence and expected outcome in the note body | [J]  |
