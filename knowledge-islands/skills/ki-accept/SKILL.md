---
name: ki-accept
ki-kind: process
ki-depends-on: []
description: >
  Closes one evidence-backed work record from awaiting-review to done through either forward-work adapter, retains done records, and prunes explicitly selected done records. A process skill: human approval is required by default for closure, and it is the sole owner of lifecycle closure. Use when asked to "accept this work", "mark this work done", "close this review", "prune selected done work", or "remove these completed records". For delivery use ki-implement; for plan shape use ki-plan; for work selection use ki-next; for session findings use ki-recap.
argument-hint: 'accept <work> | prune <work-record-or-glob>... | help'
---

# ki-accept

**Kind:** process.

Reviews the required review packet, records approved closure, retains done records, and prunes explicitly selected done records.

Read [the review-closure procedure](references/standards-acceptance.md) before acting.

## What this skill does

`ki-accept` is the only process skill that closes a work-record lifecycle. It also owns its explicitly selected done-record prune procedure.

1. Confirm the exact roadmap item or Streams proposal is at `awaiting-review` and has its required review packet.
2. Present the review packet and require human approval by default.
3. Record approved closure as `done` and retain the done record.
4. Prune only `done` records resolved from explicit adapter-root paths or globs; the selection is the deletion authority.

It never chooses work, starts implementation, edits plan scope, reconstructs missing verification, or treats a recap or passing command as human approval.

## Relationship boundary

`ki-recap` identifies unfinished work and may recommend a review-closure action; it never closes or deletes a record.

`ki-next` selects forward work and may surface retained records; it never accepts or invokes deletion.

`ki-plan` owns plan shape and the ongoing record, but terminal closure and explicitly selected pruning belong here.

Runtime subagents can help execute bounded review preparation only when separately authorised; they cannot approve or delete. `ki-delegation`, when active, supplies the durable packet standard.

`ki-batch` may request batched closure only when its explicit authorisation grants it for named records.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

`accept <work>` reviews one roadmap item or Streams proposal at `awaiting-review` and stops for the required authority unless an explicit batch authorisation permits that named closure.

`prune <work-record-or-glob>...` resolves each explicit pathname or glob only under the adapter's canonical root (`docs/roadmap/` or `Streams/`), verifies that every resolved regular work record is `done`, then deletes that set. Quote shell globs. The invocation is the deletion authority: do not ask for a second confirmation. Use `ki repo roadmap prune` only for the non-KB deterministic repository-roadmap sweep.

With no target, identify the required exact accepted item or done records and stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- Human approval is the default; it is never inferred from a clean gate, a commit, a recap, or silence.
- Done records are retained history. Process pruning is explicit destructive cleanup in either adapter; native roadmap pruning is an intentionally explicit non-KB selected-repository sweep.
- No KI CLI command, wrapper script, runtime-specific mechanism, push, or release belongs here.
