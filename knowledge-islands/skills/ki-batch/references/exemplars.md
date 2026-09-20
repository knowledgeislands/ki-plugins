# Reviewed-item batch example

The items already contain their plans and evidence. The batch records only the reviewed authority envelope and concise run account.

```md
---
id: KI-EXAMPLE-BATCH-001
repository: https://github.com/knowledgeislands/ki-example
approved: true
approved_at: 2026-09-15T06:00:00Z
authority_mode: reviewed-items
approved_payload_sha256: <approved-payload-sha256>
expires_at: 2026-09-15T09:00:00Z
item_ids: [KI-EXAMPLE-001, KI-EXAMPLE-002]
completion_target: awaiting-review
policy: safe-local-v1
---

# KI-EXAMPLE-BATCH-001

## Run ledger

<!-- ki-batch-run: KI-EXAMPLE-BATCH-001-RUN-001 <approved-payload-sha256> -->

| Item | Result | Baseline | Result commit | Exception |
| --- | --- | --- | --- | --- |
| KI-EXAMPLE-001 | awaiting-review | `abc1234` | `def5678` | None |
| KI-EXAMPLE-002 | parked | `def5678` | — | Public API choice requires human decision |
```

The hash covers the frontmatter except itself and the H1 before `## Run ledger`. The parked item remains accounted for; its canonical record carries the detailed decision need. No item is closed, pruned, pushed, or released by this `awaiting-review` envelope.
