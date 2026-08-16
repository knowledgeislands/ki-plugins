# Readiness procedure

`ki-plan <work>...` operates only records that `ki-next` has selected into `now` or `next`.

1. Run the base selection audit, then read the configured adapter literal and its required owner table. `roadmap` uses a fresh record in `docs/roadmap/`; `kb-streams` uses a fresh flat record in `Streams/Roadmap/`. Do not infer either from repository shape. `github-issues` and `linear` fail closed before reads or writes because remote process execution is not implemented.
2. Require a `draft` status, confirmed delivery boundary, understood dependencies, and a checkable verification method.
3. Shape the record in place. Every roadmap item gains Current state, Steps, Files touched, Verify, Dependencies / blocks, and Delegation when useful.
4. When bounded parallel lanes would help, use runtime subagents while retaining orchestration and review. If `ki-delegation` is active in the same scope, read its packet standard before creating a durable delegation packet; it does not create a separate lifecycle command.
5. Re-audit, stop for review, then atomically set every named record to `ready` only after explicit approval.

`ki-plan` never captures a new record, changes queue position, begins delivery, or records closure. `ki-next` owns capture and promotion; `ki-implement` owns `ready` → `in-progress` → `awaiting-review`; `ki-accept` owns `awaiting-review` → `done` and explicit pruning.
