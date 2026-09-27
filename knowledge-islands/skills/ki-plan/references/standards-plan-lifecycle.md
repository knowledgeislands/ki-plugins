# Readiness procedure

`ki-plan` resolves only an already-published identifier. It never allocates or reserves a new one. Re-resolve the named record and its source revision immediately before mutation; stop and reload if either changed after inspection.

For every shaped local record, preserve `created_at` and advance `updated_at` to the later of the current UTC second or one second after its observed value. Compare the observed source revision immediately before publication and refuse absent or malformed timestamps or any source drift. Read-only planning does not advance timestamps; remote adapters project provider-native values.

`ki-plan <work>...` operates only records that `ki-next` has selected into `now` or `next`.

1. Run the base selection audit, then read the configured adapter literal and its required owner table. `roadmap` uses a fresh record in `docs/roadmap/`; `kb-streams` uses a fresh flat record in `Streams/Roadmap/`. Do not infer either from repository shape. `github-issues` and `linear` fail closed before reads or writes because remote process execution is not implemented.
2. Require a `draft` status, confirmed delivery boundary, understood dependencies, and a checkable verification method. Refuse Triage: capture is not adoption, and only adopted Now or Next work may become Ready.
3. Shape the record in place. Every roadmap item gains Current state, Steps, Files touched, Verify, Dependencies / blocks, and Delegation when useful.
4. When bounded parallel lanes would help, use runtime subagents while retaining orchestration and review. If `ki-delegation` is active in the same scope, read its packet standard before creating a durable delegation packet; it does not create a separate lifecycle command.
5. Re-audit, stop for review, and atomically set every named record to `ready` only after explicit approval. Commit that state with the coherent planning change; do not require a standalone lifecycle commit. When capture, shaping, and approval occur in one coherent operation, the item's first committed form may already be `ready`.

`ki-plan` never captures a new record, changes queue position, begins delivery, or records closure. `ki-next` owns capture and adoption; `ki-implement` owns `ready` → `in-progress` → `awaiting-review`; `ki-accept` owns delivery `awaiting-review` → `done`, terminal Triage disposition, and explicit pruning.
