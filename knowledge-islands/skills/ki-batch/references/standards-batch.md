# Batch procedure

This is the on-demand procedure for `ki-batch`. The skill owns the process boundary; this reference owns the authorisation shape and execution rules.

## Contents

- [1. Select and freeze the set](#1-select-and-freeze-the-set)
- [2. Prepare the lean authorisation](#2-prepare-the-lean-authorisation)
- [3. Validate before implementation](#3-validate-before-implementation)
- [4. Run the exact set](#4-run-the-exact-set)
- [5. Verify and close](#5-verify-and-close)
- [Safe-local policy](#safe-local-policy)
- [Batch retention](#batch-retention)
- [Legacy storage transition](#legacy-storage-transition)
- [Pure validation model](#pure-validation-model)

## 1. Select and freeze the set

Use `ki-next` to select candidates and `ki-plan` to make every admitted record honestly Ready. For reviewed-item authority, admit only the exact approved set. For outcome authority, scan the eligible repository queue first, prepare the complete non-contentious set that fits the instruction and window, record exclusions, then freeze the set once.

Every item must be canonical to the selected local adapter, in the same repository, independently deliverable or correctly dependency-ordered, and equipped with an executable plan and verification. Findings discovered after freezing are capture-only inputs to a later batch.

## 2. Prepare the lean authorisation

Create one regular Markdown file directly beneath `+/_BATCHES/`, named `<REPO>-BATCH-<NNN>.md`, with the same `id` in frontmatter:

```yaml
---
id: KI-EXAMPLE-BATCH-001
repository: https://github.com/knowledgeislands/ki-example
approved: true
approved_at: 2026-09-15T06:00:00Z
authority_mode: reviewed-items
approved_payload_sha256: <sha256>
expires_at: 2026-09-15T09:00:00Z
item_ids: [KI-EXAMPLE-001, KI-EXAMPLE-002]
completion_target: awaiting-review
policy: safe-local-v1
---
```

Outcome mode additionally requires a non-empty `authority_evidence` value. Reviewed-item mode must omit it. `completion_target` is either `awaiting-review` or `done`; `done` grants consolidated closure for every `item_ids` entry and needs no duplicate closure list.

The run ID is derived as `<batch-id>-RUN-001`. The body contains only the matching H1 and, once execution starts, the append-only `## Run ledger`. Plans, boundaries, files, checks, decisions, review packets, and remedial work stay in canonical items.

The approval hash covers every frontmatter value except `approved_payload_sha256` plus the authored body before `## Run ledger`, in exact canonical form. Append at most one ledger beginning with:

```md
## Run ledger

<!-- ki-batch-run: KI-EXAMPLE-BATCH-001-RUN-001 <approved-payload-sha256> -->
```

The marker binds the ledger to the approved payload. Ledger entries record only item ID, result, baseline, result commit, and material exception. They do not amend authority or repeat item evidence.

The repository may keep already-completed pre-change authorisations readable until normal retention cleanup so their hashes remain verifiable. That compatibility is not an alternative authoring contract; new batches use the shape above.

## 3. Validate before implementation

Resolve one approved regular local authorisation and reject unsupported or retired fields in a newly authored record. Confirm repository identity, approval, current expiry, payload hash, run binding, policy, duplicate-free exact IDs, completion target, canonical Ready records, dependency order, and locally executable adapter.

Apply `ki-git` shared-working-tree hygiene: record expected `HEAD`, pre-existing dirty paths, thread-local touched paths, contested paths, and staged paths. Unrelated pre-existing unstaged paths do not block an independent batch. A moved `HEAD`, untracked touched-path set, contested touched path, or another actor's staged path requires no-write stop and revalidation.

Surface all known missing decisions, external dependencies, conflicts, and unavailable verification before the first implementation. Do not start an item whose answer could change its authority boundary.

## 4. Run the exact set

Run named items in dependency order through their ordinary `ki-implement` cycles. Keep each item's baseline, implementation, focused verification, and six-heading review packet in that item. The operational `in-progress` transition does not require a separate commit; Ready may land as `awaiting-review` with the implementation.

Prefer this commit topology when repository state permits:

1. one preparation and authorisation commit;
2. one delivery commit for each of the `N` named items;
3. one consolidated closure commit after the aggregate gate.

This produces `N + 2` commits without weakening per-item evidence. Stop or park only the affected item, and continue solely where independence is proven. Append a concise ledger row for every admitted item, including a park or stop.

## 5. Verify and close

Run focused checks during each item cycle. After all deliverable items reach `awaiting-review`, run one aggregate repository gate. `completion_target: awaiting-review` stops there for normal human review.

For `completion_target: done`, recheck every item's current review packet and aggregate evidence, then invoke `ki-accept` once for consolidated acceptance of the full named set. Partial closure is not covered by the authorisation: park the unresolved item and stop closure, or prepare a later separately authorised batch.

Record non-blocking improvements as receiver-owned candidates for the next wave. Do not reopen delivered records or widen the active set. Pruning is never implied.

## Safe-local policy

`policy: safe-local-v1` fixes these mandatory stops:

- an unapproved public-contract decision;
- material scope expansion;
- destructive or irreversible work;
- external coordination;
- verification failure or unavailable required verification;
- push or release.

Outcome authority may cover a public-contract decision only when the current human instruction or an admitted approved item explicitly decides it. The policy name centralises common stops; it does not weaken a stricter item-level stop.

## Batch retention

`+/_BATCHES/` holds temporary authority and run-account inputs. `_AUTHORISATIONS` is retired and has no discovery fallback.

Batch records are temporary authority and run-account inputs, not durable follow-up stores. Regular `ki-next` and `ki-recap` housekeeping may remove an inactive batch as soon as every named item's useful outcome or follow-up has been dispositioned in its canonical work record, committed history, or an explicit no-follow-up finding. Do not retain a completed record merely to satisfy a seven-day minimum.

Seven days is the cleanup deadline for an inactive record whose disposition remains incomplete. Activity is the latest of the last Git commit changing the exact path, last recorded run activity, approval time, and expiry. At or after seven days, housekeeping must report the record as overdue, route any still-useful follow-up to its canonical owner, record explicit evidence when nothing useful remains, and then prune the batch in the same maintenance cycle. Filesystem modification time is not evidence and incidental formatting or housekeeping must not restart the relevance clock.

The caller must prove the exact flat path is a regular file within the physical Git root with no symlinked ancestor, committed with identical HEAD, index, and working-copy bytes. It must inspect the full ledger, prove the batch inactive, and provide canonical outcome or follow-up disposition evidence for every item. Active, malformed, unbound, uncommitted, or unknown batches remain retained with a reason. Incomplete disposition before seven days remains visible for routing; incomplete disposition at or after seven days is overdue maintenance, not permission for indefinite retention.

`scripts/internal/batch-retention.ts` is a pure selector and never reads or deletes files. Immediately before deletion, revalidate all evidence. Delete only the selected exact paths, commit only owned deletions under `ki-git`, and report Git-history recovery. This policy never authorises work-item pruning.

## Legacy storage transition

`+/_AUTHORISATIONS/` is retired storage, not a discovery fallback. Classify each legacy entry from fresh caller-supplied filesystem, Git, lifecycle, canonical-outcome, destination, and age evidence before any mutation:

- **Relocate** a committed, unchanged, contained regular record whose useful outcome or follow-up is not yet dispositioned. Preserve its exact filename and bytes beneath `+/_BATCHES/`, stop on an existing or unknown destination, verify the whole-file hash after moving, and re-parse it as `retained-legacy` non-executable evidence.
- **Prune** a completed record as soon as `selectRetirableBatches` selects its byte-identical canonical-path projection under the ordinary inactivity, disposition, containment, and commit rules. A verified empty exact `+/_AUTHORISATIONS` directory contains no evidence and may also be pruned.
- **Reauthorise** valid active or resumable legacy work through a newly approved lean exact-set record. Never translate an old approval, policy, run identity, or closure scope into current authority.
- **Retain** malformed, uncommitted, symlinked, misplaced, destination-colliding, unknown, or incompletely evidenced entries at their existing path with the classifier's reason.

The pure `scripts/internal/legacy-batch-migration.ts` classifier performs no reads or writes. Native filesystem mechanics belong to the existing tools-ki batch automation owner; a receiving repository retains authority for its own relocate, prune, retain, or fresh-authorisation action and must revalidate immediately before mutation.

The transition was motivated by observed legacy records in Techne, KI Website, tools-ki, mcp-acquire-whatsapp, mcp-git-audit, mcp-gsuite, and mcp-m365. This inventory is migration evidence, not authority to write those repositories.

## Pure validation model

`scripts/internal/authorisation.ts`, `batch-cycle.ts`, `batch-retention.ts`, and `legacy-batch-migration.ts` expose no-write helpers. Their fixtures prove payload integrity, current-shape validation, narrow retained-record readability, derived run and closure scope, adapter and work-item eligibility, dependency order, working-tree hygiene, stop handling, conservative retention, and the four legacy transition outcomes. A pure helper may report coordination or migration eligibility; it never invokes a skill, runs a command, writes a file, accepts work, moves evidence, or removes a record.
