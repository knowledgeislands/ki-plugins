# Outcome-authority example

The orchestrator creates this form after a current human instruction grants autonomous outcome authority. The human does not separately review the generated item set before delivery.

```md
---
id: KI-EXAMPLE-BATCH-002
repository: https://github.com/knowledgeislands/ki-example
approved: true
approved_at: 2026-08-29T05:00:00Z
authority_mode: outcome
authority_evidence: User instructed the agent to deliver roughly 80% of the local roadmap and consolidate acceptance.
approved_payload_sha256: <SHA-256 generated contract>
run_id: KI-EXAMPLE-BATCH-002-RUN-001
timebox_ends_at: 2026-08-29T08:00:00Z
item_ids: [KI-EXAMPLE-003, KI-EXAMPLE-004]
completion_target: done
mandatory_stops: [public-contract-change, destructive-or-irreversible-work, external-coordination, verification-failure, push-or-release]
closure_item_ids: [KI-EXAMPLE-003, KI-EXAMPLE-004]
---

# KI-EXAMPLE-BATCH-002 — Deliver the non-contentious roadmap

## Outcome authority

Select and deliver stable local work while the human is unavailable. Keep contentious choices, external coordination, pushes, releases, and failed verification outside the run.

## Selected plans

1. KI-EXAMPLE-003 — repair a declared audit-level mismatch
2. KI-EXAMPLE-004 — add already-approved authoring guidance

## Excluded candidates

- KI-EXAMPLE-005 — requires a public API decision not covered by the outcome authority

## Completion and remedial policy

Each admitted item reaches `awaiting-review`, passes its review recheck, then closes through `ki-accept`. Non-blocking improvements become scoped follow-up records and do not prevent viable verified delivery.

## Run ledger

<!-- ki-batch-run: KI-EXAMPLE-BATCH-002-RUN-001 <approved-payload-sha256> -->
```

The generated hash binds selection and delivery evidence to the recorded human outcome authority. It does not represent a second human review.
