# Linear adapter standard

## Configuration and local inspection

Select the adapter, name one current Linear team locator, and make the repository's lifecycle metadata decision inspectable locally.

```toml
[skills.ki-work]
adapter = "linear"

[skills.ki-work-linear]
team = "ENG"
metadata_owner = "team-workflow-owner"
dependencies = "documented Linear relation mapping"
hierarchy = "documented Linear parent/sub-issue mapping"

[skills.ki-work-linear.lifecycle]
queue = "Backlog"
ready = "Todo"
review = "In Review"
done = "Done"
```

`team` is a configured current locator prefix. `ENG-123` is a current team-scoped locator, not durable cross-team identity: a team move produces a new issue identifier and URL, while old locators remain searchable aliases. Do not claim that a Linear model UUID persists through a move without official proof.

The `lifecycle` table names exact remote workflow values for queue, readiness, review, and done. `metadata_owner` names the authority that resolves mapping conflicts; `dependencies` and `hierarchy` are separate non-empty mappings and must never silently be treated as interchangeable. The local rubric checks only declaration shape; it does not contact Linear or prove the remote workflow matches it.

## Lifecycle, migration, and retention

A Linear Issue is the remote record. Its description and comments are the intended locations for plan, delivery, and review evidence. Never infer human acceptance from a workflow state name alone. Completion maps to the declared `done` value.

A team move is an authority-gated migration stop, not a normal lifecycle transition. Before any future authorised operation, `KI-HARNESS-FND-014` must re-resolve the current locator, team, workflow mapping, retained aliases, and fields that Linear may remap or clear, then obtain fresh authority for the new write set. This skill performs none of those reads or writes.

Linear archives closed inactive Issues automatically; it has no manual archive action. Deletion is distinct, recoverable only for Linear's documented retention period, and is not a KI prune operation. This adapter defines no archive, delete, or prune action.

## Execution boundary

Remote discovery, authentication, stale-read checks, conflict handling, and every mutation fail closed pending `KI-HARNESS-FND-014`. A future executor must re-read each Issue immediately before an approved write and stop on changed workflow metadata, concurrent human updates, missing permissions, uncertain current locator/team, or moved-field uncertainty.
