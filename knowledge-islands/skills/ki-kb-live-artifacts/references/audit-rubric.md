# Live Artifacts audit rubric

**[M]** = mechanical (checked by `scripts/audit-live-artifacts.ts`). **[J]** = judgment (reader applies during AUDIT).

## Structural

| ID     | Check                                                                  | Level | Type |
| ------ | ---------------------------------------------------------------------- | ----- | ---- |
| LA-S-1 | Index note exists when any artifact files are found                    | WARN  | [M]  |
| LA-S-2 | Each `.md` artifact has a same-stem `.html` in the same directory      | WARN  | [M]  |
| LA-S-3 | Each `.html` has a matching `.md` (no orphaned renders)                | WARN  | [M]  |
| LA-S-4 | Paired `.html` is not older than `.md` beyond the sync threshold (24h) | WARN  | [M]  |

## Frontmatter

| ID     | Check                                            | Level | Type |
| ------ | ------------------------------------------------ | ----- | ---- |
| LA-F-1 | `status` present and one of `active`, `archived` | WARN  | [M]  |
| LA-F-2 | `renders` present                                | WARN  | [M]  |

## Judgment

| ID     | Check                                                                                                 | Type |
| ------ | ----------------------------------------------------------------------------------------------------- | ---- |
| LA-J-1 | Index note accurately lists all active artifacts with a useful one-line description                   | [J]  |
| LA-J-2 | `.md` body is the authoritative source — no content exists only in the `.html`                        | [J]  |
| LA-J-3 | Archived artifacts are retained with a note of when and why they were archived, not silently deleted  | [J]  |
| LA-J-4 | Artifact names are descriptive and stable — renaming an artifact breaks its `.html` link if published | [J]  |
