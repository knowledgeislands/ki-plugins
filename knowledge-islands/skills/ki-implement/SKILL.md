---
name: ki-implement
ki-kind: process
ki-depends-on: []
ki-optional-depends-on: [ki-delegation]
description: >
  Implements one explicitly approved ready work record through the shared delivery cycle in either repository adapter: preflight, immutable baseline, in-progress transition, bounded execution, appropriate delegation, verification, and a required review packet. It stops at awaiting-review and never selects work, reshapes a plan, self-accepts, prunes, pushes, releases, or expands authority.
argument-hint: 'implement <work-item> | help'
---

# ki-implement

**Kind:** process.

Delivers one approved, ready work record to an evidence-backed awaiting-review boundary.

Read [the implementation procedure](references/standards-implementation.md) before acting.

## What this skill does

`ki-implement` owns one work record's delivery path from `ready` to `in-progress` to `awaiting-review`.

It does not choose work, create or reshape a plan, close a lifecycle, or delete a record.

1. Preflight the repository adapter, exact record, readiness, approval, dependencies, and stated verification.
2. Record immutable baseline evidence and transition only that record to `in-progress`.
3. Apply the approved plan within its boundary.
4. When bounded parallel work would improve delivery, use runtime subagents while retaining orchestration, review, and integration. If `ki-delegation` is active in the same scope, apply its packet standard before creating a durable delegation packet.
5. Review and integrate bounded results, run the required verification, and record the evidence.
6. Create the required review packet, transition the record to `awaiting-review`, and stop.

The caller or `ki-accept` owns the next decision.

## Relationship boundary

`ki-recap` may surface unfinished work and learning routes, but it does not start or close implementation.

`ki-next` selects and prepares forward work; it does not authorise its execution.

`ki-plan` owns plan shape and readiness material; it does not replace this delivery procedure.

Runtime subagents may execute bounded worker lanes when this item's approved plan calls for them; they do not confer execution authority. `ki-delegation`, when active, supplies the additional durable packet standard.

`ki-batch` may coordinate repeated independent runs only under an explicit bounded authorisation.

It does not bypass readiness, baseline, scope, verification, or human-review gates.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

`implement <work>` resolves one canonical roadmap item or Streams proposal and follows the procedure.

With no item, identify that an explicit approved ready item is required and stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- Implementation is not autonomous authority. Stop for a missing approval, an ambiguous plan, a failed required gate, material scope expansion, an external coordination need, an irreversible action, or any decision outside the item's stated authority.
- No KI CLI command, wrapper script, runtime-specific spawning mechanism, push, release, or deletion belongs here.
- `awaiting-review` is evidence for review, never inferred approval.
