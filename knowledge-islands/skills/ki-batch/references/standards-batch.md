# Batch procedure

This is the on-demand procedure for `ki-batch`.

The kind, phases, and relationship boundary live in [the skill](../SKILL.md).

## 1. Prepare a reviewed authorisation

Accept only an explicit candidate set.

Use the normal forward-work cycle for each candidate: `ki-next` for selection and priority and `ki-plan` for plan shape and readiness. Where bounded parallel work is useful, use runtime subagents and retain orchestration, review, and integration. If `ki-delegation` is active in the same scope, read its packet standard before creating a durable delegation packet. Resolve each record through its roadmap or Streams adapter.

Do not start `ki-implement` in this phase.

Check each candidate for a bounded plan, satisfied dependencies, known verification, compatible scope, and a reason it can run independently at its position in the batch.

Prepare one authorisation containing all of the following:

- identifier and purpose;
- named plans in dependency order;
- repositories and files in scope;
- timebox;
- required verification;
- allowed decisions and delegation;
- explicit closure authority, if any;
- completion target; and
- mandatory stops.

Present the complete authorisation for review and require explicit approval before implementation.

An omitted field is not implied authority.

## 2. Validate before implementation

Resolve the approved authorisation and every named canonical work item afresh.

Confirm that each item remains `ready`, its dependencies remain satisfied, its repository and file boundary still match, its required checks are available, and no mandatory stop has already occurred.

Reject an invalid item plainly rather than quietly omitting it.

Stop the whole batch when its dependency order, authority, or completion target is no longer honest.

## 3. Surface known questions

Before starting the first record, collect every known missing decision, external dependency, conflict, or unavailable verification into one concise question set.

Do not start a record whose answer can change its scope, public contract, repository boundary, safety treatment, or completion target. Record the named decision and dependency effect in the batch ledger.

## 4. Run one bounded cycle

Run named items in dependency order.

For each independent record, invoke its normal `ki-implement` cycle and preserve that record's lifecycle transition, baseline, scope, verification, and review packet.

Use delegation only when the authorisation permits it and the item's plan supports it.

Review each completed cycle before starting a dependent one.

Record a ledger entry per item: starting state, resulting state, baseline and resulting evidence, verification, decisions, delegation used, and any park or stop reason.

When an item is ambiguous or blocked, park it with the evidence, named decision needed, and dependency effect.

Continue only items proven independent of the parked item and within the authorisation.

## 5. Review closure and recap

Records reach `awaiting-review` through `ki-implement`; the batch does not self-certify them.

Request named batched closure from `ki-accept` only when the authorisation expressly grants that authority for those records.

Otherwise stop each record at awaiting-review for normal human review.

After the run, produce a concise `ki-recap`-shaped record of delivered items, verification, decisions, parks, failures, deferred work, and proposed learning routes.

Pruning is never implied by batch completion.

## Controlled dry-run model

`scripts/internal/batch-cycle.ts` exposes a pure `evaluateBatchCycle()` helper. Its focused fixture test proves that missing authority, a dirty tree, a failed gate, an unready item, an unsatisfied dependency, and an early decision produce a named no-write outcome.

The model may report `coordinate` only for a clean, approved, same-repository set of named Ready items. It does not invoke any skill, run a command, write a file, or mutate an item.

## Mandatory stops

Stop the affected item and escalate when any of these occurs:

- a public-contract change outside the approved plan;
- material scope expansion;
- destructive or irreversible work;
- a new external dependency or coordination need;
- failed required verification;
- push or release; or
- an unapproved decision.

Do not continue by broadening the authorisation, guessing the decision, or converting a stop into a silent omission.
