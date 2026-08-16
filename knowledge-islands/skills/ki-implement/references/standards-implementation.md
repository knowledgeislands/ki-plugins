# Implementation procedure

This is the on-demand procedure for `ki-implement`.

The kind, boundary, and relationship map live in [the skill](../SKILL.md).

## 1. Preflight

1. Resolve the physical git root and the selected adapter through `ki-work`; never infer an adapter from filesystem shape.
2. Stop before execution if the adapter is unresolved or remote: remote discovery, authentication, stale-read checks, and every write remain unavailable pending `KI-HARNESS-FND-014`.
3. Resolve exactly one canonical record through the selected local adapter. For the roadmap adapter, it is one regular work-item file under `docs/roadmap/` or `Streams/Roadmap/`.
4. Confirm that the item is `ready`, is explicitly approved for implementation, has satisfied dependencies, and contains a bounded plan with stated verification.
5. Confirm the repository's applicable read-only gates are clean before changing lifecycle state.
6. Read the item boundary, locked decisions, escalation points, delegation instruction, and stop conditions.

Stop if any precondition is missing or ambiguous.

Do not select another candidate, promote a horizon, invent plan detail, or treat a recap as approval.

## 2. Start one delivery

1. Record the full current `HEAD` commit ID as the immutable baseline.
2. Transition only the approved item to `in-progress`.
3. Commit the coherent lifecycle start before implementation where repository practice requires it.

The baseline describes the starting evidence; it is not a substitute for verification.

## 3. Execute the approved plan

Follow the checked plan steps in order and preserve its boundary.

Use runtime subagents only when the plan explicitly calls for delegation, or when an explicit authority record permits it. Delegation never supplies that authority.

When `ki-delegation` is active in the same scope, apply its suitability test before spawning a worker. For suitable substantial work, the primary agent becomes the coordinator: it keeps the human-interaction channel available, issues the approved bounded packets, sequences dependencies, replenishes ready independent lanes, resolves escalations, and retains integration and final verification. It does not duplicate an active worker's bounded task merely to appear busy.

Create or confirm the durable delegation packet before spawning. Every delegated unit must retain the packet's inputs, bounded file or system scope, authority, isolation, locked decisions, escalation boundary, definition of done, verification gate, return contract, and checkpoint.

Use the runtime's available sandbox, tool, permission, context, or worktree controls to enforce the packet as narrowly as practical. If the work is quick, tightly coupled, context-heavy, unsafe to isolate, more expensive to brief than execute, or unsupported by the available runtime, continue locally or serially without claiming governed delegation.

Review and integrate every result before the next dependent unit.

Stop rather than infer authority when scope must expand, a decision is escalated, verification fails, external coordination is needed, or an irreversible action is proposed.

## 4. Verify and prepare review

Run the item's stated verification after integration and inspect its actual results.

For a roadmap record, insert `## Review` immediately before `## Discussion`, with these exact `###` headings in this order. The roadmap work-item format owns this schema; do not create a parallel version.

1. `Delivered` — approved boundary and exclusions, with immutable baseline and resulting evidence.
2. `Summary of changes` — concrete changed files, material decisions, and approved deviations.
3. `Verification` — exact gates and outcomes.
4. `Outstanding concerns` — unresolved, unchecked, or failing issues, or an explicit none.
5. `Post-change review` — a fresh assessment of goal, scope, regression risk, and acceptance readiness.
6. `Mini recap` — item-scoped delivery, verification, concerns, and proposed learning routes without automatic promotion.

Set the record to `awaiting-review` only when all required steps are marked complete, all required checks pass, the approved scope has held, required delegation is authorised and integrated, and the canonical review packet is complete. Add the packet under `## Review` in the canonical roadmap item only when the resolved local adapter uses that record shape.

Then stop.

`ki-accept` owns human review, terminal closure, retention, and explicit pruning.

## Batch authority

`ki-batch` may authorise a named item to enter this procedure only when its bounded authorisation expressly grants that execution.

It never makes a vague plan executable, and it does not make closure automatic unless the authorisation explicitly grants batched closure for the named record.

## Controlled preflight model

`scripts/internal/implementation-cycle.ts` exposes a pure no-write preflight model. Its focused fixtures cover selected-adapter resolution, the remote stop, one canonical ready record, immutable baseline, the `ready` → `in-progress` → `awaiting-review` transitions, completed steps, scope and gate stops, delegated-work authority, verification, and the exact acceptance handoff headings. It does not resolve a live adapter, edit a record, run a command, or contact a remote system.
