# Outcome-authority batch example

The orchestrator creates this record after the human grants current autonomous outcome authority. The selected IDs do not need a second human review before delivery.

```md
---
id: KI-EXAMPLE-BATCH-002
repository: https://github.com/knowledgeislands/ki-example
approved: true
approved_at: 2026-09-15T06:00:00Z
authority_mode: outcome
authority_evidence: User instructed the agent to deliver the repository's non-contentious Ready roadmap and consolidate acceptance.
approved_payload_sha256: <approved-payload-sha256>
expires_at: 2026-09-15T09:00:00Z
item_ids: [KI-EXAMPLE-003, KI-EXAMPLE-004]
completion_target: done
policy: safe-local-v1
---

# KI-EXAMPLE-BATCH-002

## Run ledger

<!-- ki-batch-run: KI-EXAMPLE-BATCH-002-RUN-001 <approved-payload-sha256> -->

| Item | Result | Baseline | Result commit | Exception |
| --- | --- | --- | --- | --- |
| KI-EXAMPLE-003 | done | `abc1234` | `def5678` | None |
| KI-EXAMPLE-004 | done | `def5678` | `fed4321` | None |
```

`completion_target: done` covers both named items without a duplicate closure list. The canonical items retain their implementation and acceptance evidence; the ledger is only the consolidated account.
