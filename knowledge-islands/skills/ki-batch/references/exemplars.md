# Batch authorisation example

Use this as a reviewable record, not as a new tracker or a substitute for the canonical work items.

```md
---
id: KI-EXAMPLE-BATCH-001
repository: https://github.com/knowledgeislands/ki-example
approved: true
approved_at: 2026-07-01T09:00:00Z
approved_payload_sha256: <SHA-256 of the approved frontmatter and body before Run ledger>
run_id: KI-EXAMPLE-BATCH-001-RUN-001
timebox_ends_at: 2026-07-01T11:00:00Z
item_ids: [KI-EXAMPLE-001, KI-EXAMPLE-002]
completion_target: awaiting-review
mandatory_stops: [public-contract-change, unapproved-decision, verification-failure, push-or-release]
---

# KI-EXAMPLE-BATCH-001 — Harden compatible-harness release evidence

## Purpose

Deliver the named independent release-evidence work items before the end of the current maintenance window.

## Named plans and order

1. KI-EXAMPLE-001 — verify hosted release evidence
2. KI-EXAMPLE-002 — protect generated rubric publications

FND-002 may start only after FND-001 has recorded its shared host result.

## Scope

- Repository: `knowledgeislands/ki-example`
- Files: the named plans, their stated implementation files, and generated rubric publications
- Excluded: releases, pushes, website changes, new dependencies, and unrelated refactors

## Timebox and completion target

- Timebox: two hours from explicit approval
- Completion target: every named record reaches `awaiting-review` with its own review packet, or is parked with evidence and a required human decision

## Required verification

- Each plan's stated checks
- Repository TypeScript and focused test gates where the plan changes TypeScript
- Generated rubric publication verification where the plan changes a structured catalogue

## Allowed decisions and delegation

- Delegation: permitted only for the bounded mechanical units named in each plan
- Decisions: apply locked plan decisions; escalate any new interface, external coordination, scope, or safety decision
- Closure: not authorised in this batch; each record stops at `awaiting-review`

## Mandatory stops

- Any public-contract change outside a named plan
- Material scope expansion, destructive or irreversible work, a new external dependency or coordination need
- Required-verification failure, push, release, or an unapproved decision

## Approval

Approved by: <human name and timestamp>
```

The approval must be explicit and cover this exact one-repository record. Calculate `approved_payload_sha256` from every frontmatter field except itself plus this body before `## Run ledger`; do not amend that payload after approval.

If closure authority is intended, name the exact records and state it separately under **Allowed decisions and delegation**.

Pruning needs its own explicit adapter-root path or glob selection even when batch closure is authorised.

## Parked-item and post-gate example

Append the outcome to the approved authorisation; do not create a parallel tracking system. Start the one optional ledger with the approval-bound run marker.

```md
## Run ledger

<!-- ki-batch-run: KI-EXAMPLE-BATCH-001-RUN-001 <approved-payload-sha256> -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| KI-EXAMPLE-001 | ready | awaiting-review | `<baseline>` → `<commit>`; stated checks pass | Review the delivery packet |
| KI-EXAMPLE-002 | ready | parked | KI-EXAMPLE-001 exposed a public API choice outside the plan | Decide the API contract, then re-plan KI-EXAMPLE-002 |

## Batch recap

FND-001 reached awaiting-review with its recorded verification. FND-002 was parked rather than widened because its dependent API decision was not authorised. No independent remaining item was admitted. The batch stopped at its normal review target; no record was closed, marked Done, pruned, pushed, or released.
```

The ledger accounts for every admitted item, including a parked one.

It names the evidence and the exact decision needed rather than recasting a stop as an incomplete success.
