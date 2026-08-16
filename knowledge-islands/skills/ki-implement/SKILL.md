---
name: ki-implement
ki-kind: process
ki-depends-on: []
ki-optional-depends-on: [ki-delegation]
description: >
  Implements one explicitly approved ready work record through the selected locally executable adapter: preflight, immutable baseline, in-progress transition, bounded execution, appropriate delegation, verification, and the canonical six-heading review packet. It stops at awaiting-review and never selects work, reshapes a plan, self-accepts, prunes, pushes, releases, or expands authority. Remote execution fails closed pending KI-HARNESS-FND-014.
argument-hint: 'implement <work-item> | help'
---

# ki-implement

**Kind:** process.

Delivers one approved, ready work record to an evidence-backed awaiting-review boundary.

Read [the implementation procedure](references/standards-implementation.md) and [the local authority notes](references/sources.md) before acting.

## What this skill does

`ki-implement` owns one work record's delivery path from `ready` to `in-progress` to `awaiting-review`.

It does not choose work, create or reshape a plan, close a lifecycle, or delete a record.

1. Resolve the repository's selected adapter, then preflight its exact canonical record, readiness, approval, dependencies, and stated verification. Stop before execution when that adapter is remote pending `KI-HARNESS-FND-014`.
2. Record immutable baseline evidence and transition only that record to `in-progress`.
3. Apply the approved plan within its boundary.
4. When `ki-delegation` is active in the same scope, apply its suitability test and coordinator-first contract. For suitable substantial work, keep the primary agent available as coordinator while bounded subagents execute the approved worker lanes; otherwise continue locally. Create or confirm the durable packet before spawning workers.
5. Review and integrate bounded results, run the required verification, and record the evidence.
6. Create the roadmap-owned required review packet—`Delivered`, `Summary of changes`, `Verification`, `Outstanding concerns`, `Post-change review`, then `Mini recap`—transition the record to `awaiting-review`, and stop.

The caller or `ki-accept` owns the next decision.

## Relationship boundary

`ki-recap` may surface unfinished work and learning routes, but it does not start or close implementation.

`ki-next` selects and prepares forward work; it does not authorise its execution.

`ki-plan` owns plan shape and readiness material; it does not replace this delivery procedure.

Runtime subagents may execute bounded worker lanes when this item's approved plan calls for them; they do not confer execution authority. `ki-delegation`, when active, supplies the suitability decision, coordinator responsibilities, and durable packet standard. The primary agent retains human interaction, authority decisions, dependency ordering, integration, verification, and the final account of the work.

`ki-batch` may coordinate repeated independent runs only under an explicit bounded authorisation.

It does not bypass readiness, baseline, scope, verification, or human-review gates.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

`implement <work>` resolves the selected adapter, then one canonical work record. It may use a roadmap item, including one under `Streams/Roadmap/`, only when the selected local adapter resolves to that record shape. Remote execution stops pending `KI-HARNESS-FND-014`.

With no item, identify that an explicit approved ready item is required and stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- Implementation is not autonomous authority. Stop for a missing approval, an ambiguous plan, a failed required gate, material scope expansion, an external coordination need, an irreversible action, or any decision outside the item's stated authority.
- No KI CLI command, wrapper script, runtime-specific spawning mechanism, push, release, or deletion belongs here.
- `awaiting-review` is evidence for review, never inferred approval.
