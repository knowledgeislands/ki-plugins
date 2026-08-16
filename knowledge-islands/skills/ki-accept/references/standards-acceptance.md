# Review closure and pruning procedure

This is the on-demand procedure for `ki-accept`.

The kind, authority boundary, and relationship map live in [the skill](../SKILL.md).

## 1. Resolve the record and review packet

1. Resolve the physical Git root and the selected adapter through `ki-work`; never infer an adapter from a filesystem shape.
2. Stop before reading or writing an operational record when the adapter is unresolved or remote. Remote discovery, stale-read checks, and every mutation remain unavailable pending `KI-HARNESS-FND-014`.
3. Resolve one canonical regular local record under the selected adapter's exact root. `roadmap` uses `docs/roadmap/`; `kb-streams` uses `Streams/Roadmap/`.
4. Confirm that the record is `awaiting-review`, every planned Step is complete, and its immutable delivery evidence is present.
5. Confirm `## Review` occurs immediately before `## Discussion` and contains, exactly once and in order, `### Delivered`, `### Summary of changes`, `### Verification`, `### Outstanding concerns`, `### Post-change review`, and `### Mini recap`.
6. Re-check current repository evidence that materially affects the proposed acceptance decision.

Do not repair missing delivery or review evidence by inference. Return a record to implementation only through an explicit new decision; this procedure does not silently reopen or reshape it.

## 2. Obtain closure authority

Present the exact canonical record, its six-part review packet, known concerns, and proposed terminal state.

Require explicit human approval before writing `done`.

The sole exception is an approved `ki-batch` authority whose payload and run binding are still valid and which explicitly grants closure for this exact record. An authority that merely permits execution, delegation, reporting, or a different named record is not closure authority.

## 3. Record, retain, and reconcile completion

Append the terminal closure evidence required by the selected local adapter and set the approved record to `done` in one coherent change.

Retain the done record as recoverable history. Do not delete it as part of closure.

For a linked housekeeping run, verify that the template's `active-run` names this exact work-record identity and that the run's `housekeeping_template` and `scheduled_for` evidence agree. Only after the accepted completion is recorded, atomically set the template's `last-run` to the run's scheduled date and clear `active-run`.

Failed, abandoned, and superseded runs do not advance successful-run evidence and retain their `active-run` link until a separate explicit template disposition or replacement. A disposition clears the old link without changing `last-run`. A replacement atomically substitutes the already-created, verified new linked identity without changing `last-run`; `ki-next` alone creates that new linked draft. Never infer a disposition or replacement from a failed gate, missing evidence, or silence.

## 4. Prune explicitly selected done records

1. Accept one or more explicit canonical work-record paths or filename globs. Resolve their complete matching set only beneath the selected local adapter root: `docs/roadmap/` for `roadmap` or `Streams/Roadmap/` for `kb-streams`. Reject absolute paths, parent traversal, an empty or incomplete match, symlinks, directories, and files outside the canonical work-record shape. The caller should quote a shell glob so the procedure receives it.
2. Resolve the full matching set before deleting anything. Confirm every result is a regular canonical record with `status: done`.
3. For each candidate, inspect declared trade evidence. Refuse to prune a done record linked from an adopted completion-observation trade until sender release is observable. Missing or uncertain trade evidence is a stop, not permission.
4. The explicit paths or globs are the deletion authority. Do not ask for a second confirmation merely because the complete resolved set contains more than one done item.
5. Delete only the complete resolved regular eligible set, then run the applicable repository gates and record the cleanup coherently.

Do not broaden a supplied glob, prune an accepted-but-not-done item, follow a symlink, or delete a record because it looks old.

`ki repo roadmap prune` is a separate native non-KB host operation: it sweeps every selected repository's canonical regular `done` roadmap items after validating the complete selected set. It does not approve closure, choose records by inference, delete a non-terminal or retained-trade record, or replace this procedure when an explicit path or glob selection is required.

## Controlled acceptance models

`scripts/internal/acceptance-cycle.ts` and `scripts/internal/prune-selection.ts` expose pure no-write models. Their focused fixtures cover adapter resolution, remote refusal, canonical root and lifecycle evidence, exact review headings, human and approval-bound batch authority, housekeeping success and non-success dispositions, traversal, symlink, incomplete-set, non-terminal, retained-trade, and eligible selected-prune paths.

The models do not read a live adapter, alter a lifecycle, update a template, delete a file, run a command, or contact an external system.
