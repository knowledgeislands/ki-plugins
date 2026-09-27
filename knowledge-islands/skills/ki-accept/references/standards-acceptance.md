# Review closure and pruning procedure

This is the on-demand procedure for `ki-accept`.

The kind, authority boundary, and relationship map live in [the skill](../SKILL.md).

## 1. Resolve the record and closure evidence

1. Resolve the physical Git root and the selected adapter through `ki-work`; never infer an adapter from a filesystem shape.
2. Stop before reading or writing an operational record when the adapter is unresolved or remote. Remote discovery, stale-read checks, and every mutation remain unavailable pending `KI-HARNESS-FND-014`.
3. Resolve one canonical regular local record under the selected adapter's exact root. `roadmap` uses `docs/roadmap/`; `kb-streams` uses `Streams/Roadmap/`.
4. Classify the proposed closure as delivery acceptance or terminal Triage disposition.
5. For delivery, confirm that the record is `awaiting-review`, every planned Step is complete, and its immutable delivery evidence is present. Confirm `## Review` occurs immediately before `## Discussion` and contains, exactly once and in order, `### Delivered`, `### Change Summary`, `### Verification`, `### Outstanding concerns`, `### Post-change review`, and `### Mini recap`.
6. For terminal Triage, confirm that the record is `horizon: triage`, `status: draft`, and `baseline_ref: null`. Present exactly one proposed `rejected`, `duplicate`, or `merged` outcome and its rationale. A duplicate or merge must name another retained canonical work-item identifier that resolves in the selected roadmap; a rejection must not name a target. Do not require execution Steps, delivery evidence, or a Review packet.
7. Re-check current repository evidence that materially affects the proposed closure decision.

Do not repair missing delivery or review evidence by inference. Return a record to implementation only through an explicit new decision; this procedure does not silently reopen or reshape it.

## 2. Obtain closure authority

Present the exact canonical record, its six-part delivery review packet or exact intake disposition, known concerns, and proposed terminal state.

Require explicit human approval before writing `done`.

The sole exception is an approved `ki-batch` authority whose payload and run binding are still valid and which explicitly grants delivery closure for this exact record. Batch authority never closes Triage intake. An authority that merely permits execution, delegation, reporting, or a different named record is not closure authority.

## 3. Record, retain, and reconcile completion

Append the terminal closure evidence required by the selected local adapter and set the approved record to `done` in one coherent change.

For delivery, append `## Done` against the six-part Review packet. For terminal Triage, append `## Intake disposition` and `## Done`, set the approved `intake_disposition` and any required `intake_disposition_target`, retain `horizon: triage` and `baseline_ref: null`, and do not fabricate delivery evidence or adoption. This is the only direct Triage `draft` → `done` path.

Retain the done record as recoverable history. Do not delete it as part of closure.

The closure transition does not require a standalone commit and may land with its coherent acceptance evidence or directly coupled reconciliation. It must, however, land as a committed `done` record before any later prune commit.

For a linked housekeeping run, verify that the template's `active-run` names this exact work-record identity and that the run's `housekeeping_template` and `scheduled_for` evidence agree. Only after the accepted completion is recorded, atomically set the template's `last-run` to the evidenced actual successful completion date, set `last-run-ref` to the verified full commit covered by that review, and clear `active-run`. Keep the original `scheduled_for` unchanged. This intentionally replaces the former scheduled-date advancement rule; do not backfill old dates. Follow `ki-work-housekeeping` for anchor validity: a commit-triggered template requires verified reviewed-revision evidence, not an inferred implementation baseline, current HEAD, or closure commit. Calendar-only templates may retain a null anchor.

Failed, abandoned, and superseded runs do not advance successful-run evidence and retain their `active-run` link until a separate explicit template disposition or replacement. A disposition clears the old link without changing `last-run` or `last-run-ref`. A replacement atomically substitutes the already-created, verified new linked identity without changing `last-run` or `last-run-ref`; `ki-next` alone creates that new linked draft. Never infer a disposition or replacement from a failed gate, missing evidence, or silence.

When recording local acceptance, preserve `created_at` and advance `updated_at` to the later of the current UTC second or one second after its observed value. Compare the observed source revision immediately before publication and stop on source drift, a absent or malformed timestamps. Review and prune-only reads do not advance timestamps; remote adapters project provider-native values.

## 4. Prune explicitly selected done records

1. Accept one or more explicit canonical work-record paths or filename globs. Resolve their complete matching set only beneath the selected local adapter root: `docs/roadmap/` for `roadmap` or `Streams/Roadmap/` for `kb-streams`. Reject absolute paths, parent traversal, an empty or incomplete match, symlinks, directories, and files outside the canonical work-record shape. The caller should quote a shell glob so the procedure receives it.
2. Resolve the full matching set before deleting anything. Confirm every result is a regular canonical record with `status: done`.
3. For each candidate, inspect declared trade evidence. Refuse to prune a done record linked from an adopted completion-observation trade until sender release is observable. Missing or uncertain trade evidence is a stop, not permission.
4. The explicit paths or globs are the deletion authority. Do not ask for a second confirmation merely because the complete resolved set contains more than one done item.
5. Before deleting anything, search the repository for inbound references to every record in the set. A pruned record orphans each Markdown link that resolves to its path, and it may also be the only document correcting a claim that other documents still make. Repair those references, and any statement that depended on the record to stay true, in a separate commit ahead of the prune. That keeps the prune-only commit to deletions and never leaves the tree carrying a dangling link.
6. Confirm repository history contains every selected record as `done` in a commit earlier than the proposed deletion. Delete only the complete resolved regular eligible set, then run the applicable repository gates. Commit the removal of one or more eligible records as a dedicated prune-only commit containing no lifecycle transition or unrelated work. Do not broaden the supplied glob, prune an accepted-but-not-done item, follow a symlink, or delete a record merely because it looks old.

`ki repo roadmap prune` is a separate native non-KB host operation: it sweeps every selected repository's canonical regular `done` roadmap items after validating the complete selected set. It does not approve closure, choose records by inference, delete a non-terminal or retained-trade record, or replace this procedure when an explicit path or glob selection is required.

## Controlled acceptance models

`scripts/internal/acceptance-cycle.ts` and `scripts/internal/prune-selection.ts` expose pure no-write models. Their focused fixtures cover adapter resolution, remote refusal, canonical-root lifecycle evidence, exact review headings, human approval-bound batch authority, terminal Triage disposition evidence and human-only authority, housekeeping success and non-success dispositions, traversal, symlink, incomplete-set, non-terminal, prior committed-`done`, retained-trade, and eligible selected-prune paths with a prune-only commit boundary. The models do not read a live adapter, alter lifecycle state, update a template, delete a file, run a command, or contact an external system.
