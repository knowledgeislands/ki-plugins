# Sources — Linear adapter

**Refresh:** external-spec · monthly

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [Issue status][workflow] | team-specific workflow values and automatic archive | 2026-09-26 |
| [Edit issues][move] | mutable locators, aliases, team moves, and affected fields | 2026-09-26 |
| [Delete and archive issues][retention] | automatic archive, deletion, recovery, and retention | 2026-09-26 |

## Local authority

The adapter standard is normative for KI configuration, migration stops, and no-execution boundary. Linear documentation is primary evidence for remote capability and behaviour; it does not prove UUID persistence through a team move or authorise KI process execution.

## Last review

On 2026-09-26, Linear still documented team-specific workflows, a new issue identifier and URL after a team move, old-locator search and redirects, and destination-field remapping or removal. Archiving remains automatic, while deleted items remain recoverable for 30 days. The adapter therefore continues to treat displayed identifiers as mutable locators and remains fail-closed pending `KI-HARNESS-FND-014`.

[workflow]: https://linear.app/docs/configuring-workflows
[move]: https://linear.app/docs/editing-issues
[retention]: https://linear.app/docs/delete-archive-issues
