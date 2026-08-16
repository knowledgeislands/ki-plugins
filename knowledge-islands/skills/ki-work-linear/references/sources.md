# Sources — Linear adapter

**Refresh:** external-spec · monthly

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [Issue status][workflow] | team-specific workflow values and automatic archive | 2026-08-12 |
| [Edit issues][move] | mutable locators, aliases, team moves, and affected fields | 2026-08-12 |
| [Delete and archive issues][retention] | automatic archive, deletion, recovery, and retention | 2026-08-12 |

## Local authority

The adapter standard is normative for KI configuration, migration stops, and no-execution boundary. Linear documentation is primary evidence for remote capability and behaviour; it does not prove UUID persistence through a team move or authorise KI process execution.

## Last review

On 2026-08-12, Linear confirmed workflows are team-specific, a team move makes a new issue identifier and URL while preserving old locator search/redirect behaviour, and some destination fields may change or clear. It also confirmed archiving is automatic, while deletion has a bounded recovery period. The adapter therefore treats displayed identifiers as mutable locators and remains fail-closed pending `KI-HARNESS-FND-014`.

[workflow]: https://linear.app/docs/configuring-workflows
[move]: https://linear.app/docs/editing-issues
[retention]: https://linear.app/docs/delete-archive-issues
