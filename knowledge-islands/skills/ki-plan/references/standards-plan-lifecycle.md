# Readiness procedure

`ki-plan <work>...` operates only records that `ki-next` has selected into `now` or `next`.

1. Resolve the repository adapter and fresh canonical record. A non-KB repository uses its roadmap item; a KB uses its full Streams proposal.
2. Require a `draft` status, confirmed delivery boundary, understood dependencies, and a checkable verification method.
3. Shape the record in place. A roadmap item gains Current state, Steps, Files touched, Verify, Dependencies / blocks, and Delegation when useful. A proposal gains complete Outputs, a concrete Checklist, resolved Open Questions, and current Inputs / dependencies.
4. When bounded parallel lanes would help, use runtime subagents while retaining orchestration and review. If `ki-delegation` is active in the same scope, read its packet standard before creating a durable delegation packet; it does not create a separate lifecycle command.
5. Re-audit, stop for review, then atomically set every named record to `ready` only after explicit approval.

`ki-plan` never captures a new record, changes queue position, begins delivery, or records closure. `ki-next` owns capture and promotion; `ki-implement` owns `ready` → `in-progress` → `awaiting-review`; `ki-accept` owns `awaiting-review` → `done` and explicit pruning.
