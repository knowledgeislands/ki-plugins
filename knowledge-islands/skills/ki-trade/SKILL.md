---
name: ki-trade
ki-kind: process
ki-depends-on: [ki-trades]
description: >
  Operates one repository's side of declared cross-repository trades: prepare an observable proposal, inspect preparation changes, submit or receive an immutable record, manage local routes, and release or prune eligible copies. Use when asked to "prepare a trade", "submit this trade", "receive this trade", "observe a preparation", "check trade routes", or "clean up released trades". Receiver disposition belongs to ki-next; trade shape and authority belong to ki-trades.
argument-hint: 'prepare <receiver> | observe <TRD> | submit <TRD> | abandon <TRD> | receive <TRD> | release <TRD> | prune <TRD> | routes <add|remove|list|check> | list | show <TRD> | help'
---

# ki-trade

**Kind:** process.

Operates the selected repository's local side of a trade without writing a peer checkout or deciding the receiver's response.

Read [the trade-operations procedure](references/standards-trade-operations.md) before running a mutating operation.

## Lifecycle

```text
preparing (mutable and committed)
  ├─ abandon → removed before submission
  └─ submit → submitted (immutable, awaiting receipt)
                 └─ receive → received / unconsidered
                                  └─ ki-next records the receiver decision

sender observation policy: unattended | receipt | decision | completion
```

Preparation, delivery, receiver decision, and sender observation are separate facts. A committed preparation is silently observable; it is not receivable and creates no acknowledgement or receiver copy. Submission freezes the record. Receipt proves only that the receiver created its local immutable copy.

## What this skill does

- **Prepare, observe, submit, or abandon** one sender-owned preparation.
- **Receive** one explicitly identified submitted record, or preview and confirm an explicit `--all` batch.
- **List and show** local records and observable peer state without changing either repository.
- **Release or prune** only copies whose governed eligibility is currently observable.
- **Manage routes** by changing only the selected repository's declaration and preserving every route that still has a dependent local record.

`ki-trades` owns the record, route, authority, and lifecycle contract. The operator must audit before and after a mutation, but this guidance does not claim that the current host makes those audits part of one transaction. Do not infer atomic file publication, preview/write equivalence, or post-write validation from this skill; those are host capabilities and require direct host evidence.

## Responsibility boundary

`ki-trade` never sets a receiver disposition. It hands a validated inbound record to `ki-next`, which records the exact human-confirmed decision and chooses between a direct local application and a separately confirmed roadmap proposal.

It never creates or prioritises roadmap work, retains knowledge, claims local completion, writes another repository, transmits an observation, or keeps a dialogue or revision log. Git history is the only preparation history.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

The remaining invocations map one-to-one to the local `ki trade` surface. Before any mutation, resolve the physical repository root, run the `ki-trades` audit, inspect the host's exact local write or deletion preview, and obtain any confirmation required by [the procedure](references/standards-trade-operations.md). Re-audit afterward. Do not add an all-or-nothing interpretation to the asynchronous `receive --all` convenience operation, or treat this guidance as proof of any separate host capability.

With no recognised operation, show the lifecycle, observation policies, available operations, and the `ki-next` disposition off-ramp, then stop.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- `unattended` means no response is requested; it still retains the submitted copy until receipt is observable.
- `completion` observes the receiver's linked local work; it does not create a generic trade-completed state.
- Installed as a core user skill by `ki bootstrap`; it is not a repository-governance root.
