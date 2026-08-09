---
name: ki-batch
ki-kind: process
ki-depends-on: []
ki-optional-depends-on: [ki-delegation]
description: >
  Prepares and coordinates an explicitly authorised batch of independent work records in either repository adapter: plan the named candidates up front, then use bounded parallel delivery where it is safe. A process skill: it does not select work, reshape plans, bypass lifecycle gates, infer closure, prune, push, release, or introduce a tracker. Use when asked to "prepare a work batch", "run this approved batch", "coordinate several ready work items", or "record a batch run". For selection use ki-next; plan shape use ki-plan; single-item delivery use ki-implement; closure use ki-accept.
argument-hint: 'batch <work>... | implement <batch-authorisation> | help'
---

# ki-batch

**Kind:** process.

Coordinates a reviewed, explicitly authorised set of independent implementation cycles.

Read [the batch procedure](references/standards-batch.md) before acting, [the authorisation example](references/exemplars.md) when preparing a record, and [the source notes](references/sources.md) only for their bounded ideas.

## What this skill does

`ki-batch` has two distinct phases.

### Preparation

Use the normal forward-work cycle over an explicit candidate set, resolving each named record through the roadmap or Streams adapter.

`ki-next` selects and prioritises work; `ki-plan` shapes it; `ki-implement` does not begin during preparation.

The phase produces a reviewed batch authorisation that names exactly what may run and what must stop.

### Implementation

Under that authorisation, coordinate repeated independent `ki-implement` cycles in dependency order.

Every record retains its own `ready` → `in-progress` → `awaiting-review` lifecycle, baseline, verification, and review packet.

Park ambiguity rather than resolving it by inference, then record a per-item ledger and concise `ki-recap`-shaped batch recap.

`ki-accept` remains the only closure owner.

`ki-batch` may request batched closure only when the authorisation expressly grants it for named records.

`ki-agenda` may run one bounded cycle from the same approved authorisation. It adds fresh grounding and early-question handling; it neither broadens the batch nor replaces this skill's authorisation and ledger contract.

Pruning always requires separate explicit destructive authority.

## Relationship boundary

`ki-recap` grounds delivered work, outstanding concerns, and learning routes; it does not grant authority.

`ki-next` owns selection, promotion, and deferral.

`ki-plan` owns work-item shape, planning detail, and readiness material.

`ki-implement` owns each single-item delivery cycle.

`ki-accept` owns human-approved closure and pruning.

Runtime subagents may execute bounded work where the authorisation permits delegation; the orchestrator retains preparation, integration, and gates. `ki-delegation`, when active in the same scope, supplies the additional durable packet standard.

This skill coordinates these siblings; it does not duplicate their procedures or create a tracker, plugin, worktree scheme, runtime-specific mechanic, wrapper, or KI CLI command.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

`batch <work>...` prepares only the named candidates through the normal shared cycle: shape every draft to Ready, decide whether safe parallel lanes exist, and produce a reviewed proposed authorisation. When `ki-delegation` is active, read its packet standard before creating a durable delegation packet.

`implement <batch-authorisation>` validates one approved authorisation and coordinates its named items in dependency order.

With no target, identify whether a candidate set or an approved authorisation is required and stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- A batch authorisation is bounded authority, not a standing permission for autonomous work.
- Stop on any mandatory stop rather than widening the batch or silently skipping a concern.
- The sources offer the useful ideas of eligibility, parking, review, and clear scope; their trackers, autonomy frameworks, and runtime machinery are not imported.
