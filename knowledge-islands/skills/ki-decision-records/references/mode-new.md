# Mode NEW — draft a new Decision Record

_On-demand procedure for decision-records' NEW mode. The prefix table, naming convention, status lifecycle, and placement rule live in [`SKILL.md`](../SKILL.md) and are already loaded; the full format with required sections and writing guidance is in [`dr-format.md`](dr-format.md)._

1. Determine the `decision_type` (one of the nine values) and derive the prefix from the table in `SKILL.md`. Determine the `SCOPE` from `.ki-config.toml` (e.g. `ARCADIA`). Derive the next available `NNN` from existing files — serials are **per prefix within the scope**, so scan the `<PREFIX>-<SCOPE>-NNN` files that share this prefix (a `GDR-` and an `SDR-` in the same scope may both be `001`).
2. Write the DR using [the template](dr-format.md#template) — all five Nygard sections (Title, Status/Mutability/Date, Context, Decision, Consequences) plus an optional `## References` section and, for `open` records, a `## Changelog`. KB repos require frontmatter (`type: admin/governance/decision`, `decision_type`, `status`, `author`). Status starts as `Proposed` and Mutability as `open`.
3. Add a row to the index (`Decisions.md`) in filename order.
4. If this DR supersedes an existing one, update the old DR's `**Status:**` line to `Superseded by <ID>` and add a `Supersedes <ID>` line in the new DR.
5. Run **AUDIT** to confirm the new file is well-formed.
