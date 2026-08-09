# Agenda procedure

`ki-agenda` coordinates one reviewed batch without creating a second lifecycle or authority store.

## Preflight

1. Resolve the physical repository root and one canonical batch authorisation.
2. Confirm the authorisation is explicitly approved, within its timebox, limited to this repository, and names every record in dependency order.
3. Re-read every named record. Each must remain `ready`, have a bounded plan, satisfied dependencies, and available stated checks.
4. Check the worktree and required read-only gates. Stop before a lifecycle write when either is not clean.

An absent, malformed, expired, or cross-repository authorisation is a no-write stop, not an invitation to repair or infer authority.

## Early questions

Before starting the first record, collect every known missing decision, external dependency, conflict, or unavailable verification into one concise question set.

Do not start a record whose answer can change its scope, public contract, repository boundary, safety treatment, or completion target. Record the named decision and dependency effect in the batch ledger.

## One cycle

1. Validate the authorisation and fresh item state.
2. Report early questions and stop affected records.
3. For each remaining independent named record, run its ordinary `ki-implement` cycle.
4. Review each resulting packet before starting a dependent record.
5. Append the per-item start state, result, baseline, verification, decision, and stop or park evidence to the existing batch ledger.
6. End at the authorisation's completion target, normally `awaiting-review`, then produce its concise batch recap.

The agenda never selects a candidate, promotes a horizon, makes a draft Ready, accepts review, prunes, pushes, releases, or adds a repository to scope.

## Stops and continuation

Stop the affected record on a dirty worktree, failed required gate, unsatisfied dependency, scope expansion, destructive operation, external coordination need, unapproved decision, push, or release.

Continue only an item that is explicitly named, still Ready, and proven independent of every stopped item. Do not retry a failed gate destructively or silently omit a stopped item.

## Controlled dry-run model

`scripts/internal/agenda-cycle.ts` exposes a pure `evaluateAgendaCycle()` helper. Its focused fixture test proves that missing authority, a dirty tree, a failed gate, an unready item, an unsatisfied dependency, and an early decision produce a named no-write outcome.

The model may report `coordinate` only for a clean, approved, same-repository set of named Ready items. It does not invoke any skill, run a command, write a file, or mutate an item.
