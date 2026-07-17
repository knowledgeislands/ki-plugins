# Mode NEW — draft a new Decision Record

_On-demand procedure for decision-records' NEW mode. The prefix table, naming convention, and placement rule live in [`SKILL.md`](../SKILL.md) and are already loaded; the full format with required sections and writing guidance is in [`dr-format.md`](dr-format.md)._

1. Determine the `decision_type` (one of the nine values) and derive the prefix from the table in `SKILL.md`. Determine the `SCOPE` from `.ki-config.toml` (e.g. `ARCADIA`). Derive the next available `NNN` from existing files — serials are **per prefix within the scope**, so scan the `<PREFIX>-<SCOPE>-NNN` files that share this prefix (a `GDR-` and an `SDR-` in the same scope may both be `001`).
2. Write the DR using [the template](dr-format.md#templates) — the Nygard body sections (Title, Context, Decision, Consequences), an optional `**Date:**` line, and an optional `## References` section. KB repos require frontmatter (`type: admin/governance/decision`, `decision_type`, `status`, `author`). There is no Status, Mutability, or Changelog — a DR that exists is in effect.
3. Add an entry to the index list in reveal order.
4. If this decision revises the direction of an existing DR, **edit that record in place** so it reflects the new decision (living-record principle) rather than adding a superseding one; only author a new record for a genuinely distinct decision.
5. Run **AUDIT** to confirm the new file is well-formed.
