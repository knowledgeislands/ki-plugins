---
name: ki-batch
ki-kind: process
ki-depends-on: []
ki-optional-depends-on: [ki-delegation]
description: >
  Prepares and runs a bounded, single-repository batch of independent work records under either reviewed exact-item authority or explicit human outcome authority such as "crack on with the roadmap". Outcome authority lets the orchestrator select, deliver, and consolidate acceptance without another pre-run gate while recording exact scope, evidence, stops, and remedial follow-ups. A process skill: it does not infer authority, bypass lifecycle or verification, prune, push, release, or introduce a tracker. Remote execution fails closed pending KI-HARNESS-FND-014. Use when asked to "prepare a work batch", "run this approved batch", "crack on autonomously", "coordinate several ready work items", or "record this batch run". For ordinary selection use ki-next; for plan shape use ki-plan; for single-item delivery use ki-implement; for closure use ki-accept.
argument-hint: 'batch <work>... | batch outcome <outcome> | run <batch-authorisation> | help'
---

# ki-batch

**Kind:** process.

Coordinates a bounded set of independent implementation cycles under reviewed-item or explicit outcome authority.

Read [the batch procedure](references/standards-batch.md) before acting and [the outcome-authority procedure](references/standards-outcome-authority.md) when autonomous delivery is requested. Read [the reviewed-item example](references/exemplars.md) or [the outcome-authority example](references/standards-outcome-authority-example.md) when preparing that authority mode, and [the source notes](references/sources.md) only for their bounded ideas. Read `scripts/internal/batch-cycle.ts` only when validating the controlled no-write fixture model.

## What this skill does

`ki-batch` has two distinct phases.

### Reviewed-item preparation

Use the normal forward-work cycle over an explicit candidate set, resolving each named record through the selected adapter.

`ki-next` selects and prioritises work; `ki-plan` shapes it; `ki-implement` does not begin during preparation.

The phase produces a reviewed, single-repository authorisation that names exactly what may run and what must stop.

### Outcome-authorised preparation

When a human affirmatively grants current autonomous delivery authority and names a repository or roadmap outcome, the orchestrator may use `ki-next` and `ki-plan` to select eligible non-contentious local records, then create the exact batch contract without a second approval checkpoint. The contract records the human authority evidence, selected items, scope, checks, stops, completion target, and named consolidated-acceptance set.

Outcome authority is not silence, a clean gate, ordinary implementation permission, historic standing preference, or permission to make contentious decisions. It authorizes bounded selection and delivery; every admitted item retains its own lifecycle, verification, review packet, and acceptance evidence.

### Implementation

Under that authorisation, resolve the selected adapter, re-ground the one repository and named canonical records, surface known questions before delivery, then coordinate one bounded cycle of independent `ki-implement` cycles in dependency order.

Every record retains its own `ready` → `in-progress` → `awaiting-review` lifecycle, baseline, verification, and review packet.

Park ambiguity the authority does not cover rather than resolving it by inference, take the decisions a record's own plan asks for and record them in that record, then record a per-item ledger and concise `ki-recap`-shaped batch recap.

`ki-accept` remains the only closure owner.

`ki-batch` may request batched closure only when the authorisation expressly grants it for named records.

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

`batch <work>...` prepares named candidates through the normal shared cycle and produces a reviewed proposed authorisation.

`batch outcome <outcome>` requires current explicit human authority. It selects eligible local work through `ki-next`, shapes admitted drafts through `ki-plan`, creates an outcome-authorised contract, and may run it immediately without another approval gate. When the authority asks the agent to finish autonomously, name every admitted item in `closure_item_ids`, use completion target `done`, and invoke evidence-backed `ki-accept` after each review packet passes.

When `ki-delegation` is active, read its packet standard before creating a durable delegation packet.

`run <batch-authorisation>` resolves one regular authority record directly below `+/_AUTHORISATIONS/`, validates its approval-bound payload and run record, one local repository identity, selected-adapter support, active timebox, completion target, mandatory stops, duplicate-free IDs, and named canonical work records, then reports known questions before delivery and coordinates one bounded cycle in dependency order. It never treats a clean gate, silence, or an unreviewed draft as authority.

With no target, identify whether a candidate set or an approved authorisation is required and stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- A batch authorisation is bounded authority. Outcome authority must be affirmative, current, and recorded; it never arises from standing preference or silence.
- Stop on any mandatory stop rather than widening the batch or silently skipping a concern.
- The sources offer the useful ideas of eligibility, parking, review, and clear scope; their trackers, autonomy frameworks, and runtime machinery are not imported.
