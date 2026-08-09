# Linear adapter standard

## Configuration

Select the adapter and name exactly one Linear team key.

```toml
[skills.ki-change-management]
adapter = "linear"

[skills.ki-change-management-linear]
team = "ENG"
```

`team` is the identifier prefix. A canonical record reference is `ENG-123`; Linear allocates the number and it is never reused. Do not substitute a title, URL slug, or local counter as identity.

## Lifecycle mapping

A Linear Issue is the canonical record. The repository documents the exact mapping from its workflow states to queue placement, readiness, in-progress, awaiting review, and done; do not infer it from a state name. Completion is the team workflow's terminal done state. Linear has no general prune operation: closed Issues remain canonical evidence unless a separately authorised retention policy names a reversible archive action.

Use the Issue description and comments for planning, delivery, and review evidence. A process skill never assumes a state conveys human acceptance unless the configured workflow explicitly makes that boundary visible.

## Authority and conflicts

Read-only discovery is allowed when the user asks to inspect configured work. Creating, editing, moving, assigning, changing priority, or completing Issues requires confirmation of the exact remote write set. Re-read each Issue immediately before a write; stop on changed workflow state, concurrent human update, missing permissions, or uncertain team identity.
