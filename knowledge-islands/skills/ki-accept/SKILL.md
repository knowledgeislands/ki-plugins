---
name: ki-accept
ki-kind: process
ki-applicability: invocation-only
ki-depends-on: []
description: >
  Close a reviewed local work record as done, record an approved terminal Triage disposition, or prune
  explicitly selected eligible done records. Use only with human approval; use `ki-implement` for delivery,
  `ki-plan` for readiness, and `ki-next` for selection or adoption.
argument-hint: 'accept <work> | prune <work-record-or-glob>... | help'
---

# ki-accept

**Kind:** process.

Reviews the required delivery or intake-disposition evidence, records approved closure, retains done records, and prunes explicitly selected done records.

Read [the review-closure procedure](references/standards-acceptance.md) and [the local authority notes](references/sources.md) before acting.

## What this skill does

`ki-accept` is the only process skill that closes a work-record lifecycle. It also owns its explicitly selected done-record prune procedure.

1. Resolve the selected adapter and confirm one exact canonical local record at its physical root is either `awaiting-review` with the roadmap-owned six-heading review packet or open Triage with an exact proposed rejected, duplicate, or merged disposition. Remote adapters stop pending `KI-HARNESS-FND-014`.
2. Present the delivery review packet or proposed intake disposition and require human approval. Batch closure authority may close only the named delivery record, never Triage intake.
3. Record approved closure as `done`, retain the done record, and ensure that state lands before any later pruning.
4. Prune only fully resolved regular `done` records selected beneath the exact adapter root, excluding records retained by an unresolved completion-observation trade; selection is deletion authority. A prune-only commit may remove several eligible records together but contains no lifecycle transition or unrelated work.

It never chooses work, starts implementation, edits plan scope, reconstructs missing verification, or treats a recap or passing command as human approval.

## Relationship boundary

`ki-recap` identifies unfinished work and may recommend a review-closure action; it never closes or deletes a record.

`ki-next` captures and adopts forward work and may surface retained records. It routes an approved rejected, duplicate, or merged Triage disposition here; it never closes or invokes deletion.

`ki-plan` owns plan shape and the ongoing record, but terminal closure and explicitly selected pruning belong here.

Runtime subagents can help execute bounded review preparation only when separately authorised; they cannot approve or delete. `ki-delegation`, when active, supplies the durable packet standard.

`ki-batch` may request batched closure only when its approval-bound explicit authorisation grants it for the named record. It never grants pruning authority.

`ki-work-housekeeping` owns template shape and `ki-next` owns spawning. After a linked run is accepted, this skill alone advances the evidenced completion date `last-run` and reviewed revision `last-run-ref`, then clears `active-run`. Failed, abandoned, and superseded runs retain the active link until an explicit disposition clears it or a replacement atomically substitutes a new linked identity; neither advances successful-run evidence.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

`accept <work>` resolves the selected adapter, then reviews one canonical local work record. Delivery closure requires `awaiting-review` and stops for human authority unless an approval-bound batch authorisation explicitly permits that named closure. Terminal Triage closure requires exact human approval of `rejected`, `duplicate`, or `merged`, with the retained canonical target named for duplicate or merged; batch authority never substitutes. Remote execution stops pending `KI-HARNESS-FND-014`.

`prune <work-record-or-glob>...` resolves each explicit pathname or glob only under the selected local adapter's canonical root (`docs/roadmap/` or `Streams/Roadmap/`), rejects traversal, symlinks, incomplete resolution, and retained trade-linked records, verifies every resolved regular work record is `done`, then deletes exactly that set. Quote shell globs. The invocation is the deletion authority: do not ask for a second confirmation. Remote execution stops pending `KI-HARNESS-FND-014`. Use `ki repo roadmap prune` only for the non-KB deterministic repository-roadmap sweep.

With no target, identify the required exact accepted item or done records and stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- Human approval is the default; it is never inferred from a clean gate, a commit, a recap, or silence.
- Done records are retained history until their committed state precedes a dedicated prune-only commit. Process pruning is explicit destructive cleanup in either local adapter; native roadmap pruning is an intentionally explicit non-KB selected-repository sweep.
- No KI CLI command, wrapper script, runtime-specific mechanism, push, or release belongs here.
