# GitHub Issues adapter standard

## Configuration and local inspection

Select the adapter, name one current GitHub repository namespace, and make the repository's lifecycle metadata decision inspectable locally.

```toml
[skills.ki-work]
adapter = "github-issues"

[skills.ki-work-github-issues]
repository = "owner/repository"
metadata_owner = "repository-maintainers"
dependencies = "native Issue blocked-by/blocking relations"
hierarchy = "native sub-issues only; not a blocker relation"

[skills.ki-work-github-issues.lifecycle]
queue = "label: queued"
ready = "label: ready"
review = "label: awaiting-review"
done = "closed"
```

`repository` is the configured Issue namespace. `<owner>/<repository>#<number>` is a current mutable locator, not a durable identity: an open Issue transfer changes its namespace and may change its number. The old URL redirects, but retain the old locator only as historical alias evidence. Do not infer a canonical cross-transfer identifier, including an API ID, without a separately evidenced identity decision.

The `lifecycle` table names exact remote values for queue, readiness, review, and done. `metadata_owner` names the authority that resolves a label, Issue-field, or Project-field conflict; `dependencies` and `hierarchy` are separate non-empty mappings and must never silently be treated as interchangeable. The local rubric checks that this declaration is complete, but it does not contact GitHub or prove that the remote configuration matches it.

## Lifecycle, migration, and retention

An Issue is the remote record. Its body and comments are the intended locations for plan, delivery, and review evidence. Never infer readiness from `open` or acceptance from a merged pull request. `done` maps to the declared closed value; closed Issues are retained evidence. This adapter defines no archive or delete/prune operation.

A transfer is an authority-gated migration stop, not a normal lifecycle transition. Before any future authorised operation, `KI-HARNESS-FND-014` must re-resolve the current repository and locator, verify the Issue is not a pull request, inspect the current lifecycle fields and retained aliases, identify transferred labels/milestones that did not survive, and obtain fresh authority for the new write set. This skill performs none of those reads or writes.

## Execution boundary

Remote discovery, authentication, filtering, stale-read checks, conflict handling, and every mutation fail closed pending `KI-HARNESS-FND-014`. A future executor must re-read each Issue immediately before an approved write and stop on changed lifecycle metadata, conflicting human updates, missing permissions, an uncertain current locator, or an Issue response that represents a pull request.
