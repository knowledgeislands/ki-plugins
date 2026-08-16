---
name: ki-accept
ki-kind: process
ki-depends-on: []
description: >
  Closes one evidence-backed canonical local work record from awaiting-review to done, retains done records, and prunes explicitly selected eligible done records. A process skill: human approval is required by default for closure, and it is the sole owner of lifecycle closure. Remote execution fails closed pending KI-HARNESS-FND-014. Use when asked to "accept this work", "mark this work done", "close this review", "prune selected done work", or "remove these completed records". For delivery use ki-implement; for plan shape use ki-plan; for work selection use ki-next; for session findings use ki-recap.
argument-hint: 'accept <work> | prune <work-record-or-glob>... | help'
---

# ki-accept

**Kind:** process.

Reviews the required review packet, records approved closure, retains done records, and prunes explicitly selected done records.

Read [the review-closure procedure](references/standards-acceptance.md) and [the local authority notes](references/sources.md) before acting.

## What this skill does

`ki-accept` is the only process skill that closes a work-record lifecycle. It also owns its explicitly selected done-record prune procedure.

1. Resolve the selected adapter and confirm one exact canonical local record at its physical root is `awaiting-review` with the roadmap-owned six-heading review packet. Remote adapters stop pending `KI-HARNESS-FND-014`.
2. Present the review packet and require human approval by default.
3. Record approved closure as `done` and retain the done record.
4. Prune only fully resolved regular `done` records selected beneath the exact adapter root, excluding records retained by an unresolved completion-observation trade; the selection is the deletion authority.

It never chooses work, starts implementation, edits plan scope, reconstructs missing verification, or treats a recap or passing command as human approval.

## Relationship boundary

`ki-recap` identifies unfinished work and may recommend a review-closure action; it never closes or deletes a record.

`ki-next` selects forward work and may surface retained records; it never accepts or invokes deletion.

`ki-plan` owns plan shape and the ongoing record, but terminal closure and explicitly selected pruning belong here.

Runtime subagents can help execute bounded review preparation only when separately authorised; they cannot approve or delete. `ki-delegation`, when active, supplies the durable packet standard.

`ki-batch` may request batched closure only when its approval-bound explicit authorisation grants it for the named record. It never grants pruning authority.

`ki-work-housekeeping` owns template shape and `ki-next` owns spawning. After a linked run is accepted, this skill alone advances `last-run` and clears `active-run`. Failed, abandoned, and superseded runs retain the active link until an explicit disposition clears it or a replacement atomically substitutes a new linked identity; neither advances successful-run evidence.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

`accept <work>` resolves the selected adapter, then reviews one canonical local work record at `awaiting-review`. It stops for human authority unless an approval-bound batch authorisation explicitly permits that named closure. Remote execution stops pending `KI-HARNESS-FND-014`.

`prune <work-record-or-glob>...` resolves each explicit pathname or glob only under the selected local adapter's canonical root (`docs/roadmap/` or `Streams/Roadmap/`), rejects traversal, symlinks, incomplete resolution, and retained trade-linked records, verifies every resolved regular work record is `done`, then deletes exactly that set. Quote shell globs. The invocation is the deletion authority: do not ask for a second confirmation. Remote execution stops pending `KI-HARNESS-FND-014`. Use `ki repo roadmap prune` only for the non-KB deterministic repository-roadmap sweep.

With no target, identify the required exact accepted item or done records and stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- Human approval is the default; it is never inferred from a clean gate, a commit, a recap, or silence.
- Done records are retained history. Process pruning is explicit destructive cleanup in either adapter; native roadmap pruning is an intentionally explicit non-KB selected-repository sweep.
- No KI CLI command, wrapper script, runtime-specific mechanism, push, or release belongs here.
