# Delegation-packet standard

## Scope

A delegation packet is an explicit, durable brief for bounded agent work inside one approved roadmap record.

It translates a runtime subagent brief into a reviewable artifact before workers are dispatched.

It is not required for a focused task that remains with the orchestrator, and it does not replace the work item’s plan, authority, baseline, review packet, or acceptance decision.

## Packet shape

An opted-in packet uses this structure inside the work item’s `## Delegation` section:

```markdown
## Delegation

### Locked decisions

- Decision that workers must not reopen.

### Escalate

- Decision that workers must return to the orchestrator.

### Rounds

- Round 1: `research-sources`.
- Round 2: `apply-contract` after Round 1 is gated.

### Worker: research-sources

- **Deliverable:** Primary-source evidence for the named unknown.
- **Files:** None; read-only research.
- **Definition of done:** Findings cite the source and state remaining uncertainty.
- **Model:** fast — bounded factual discovery.
- **Verify:** Orchestrator checks every source and conclusion.
- **Checkpoint:** Return after the source set is complete.
```

The packet contains non-empty `Locked decisions`, `Escalate`, and `Rounds` sections and at least one `Worker:` subsection.

Each worker subsection names a bounded deliverable, file or system boundary, pass/fail definition of done, explicit model choice, verification gate, and completion checkpoint.

When a worker will run Git write commands in a shared worktree, its brief also names a unique temporary Git index path. The worker passes it explicitly on every Git write command, for example `GIT_INDEX_FILE=<worker-index> git add -- <paths>`. The path is a worker-local staging boundary, not authority to commit concurrently; `ki-git` owns the matching shared-`HEAD` serialization rule.

The rounds record genuine ordering and dependency boundaries; no two workers may be assigned overlapping write scope in the same round. They are not a batch barrier: once the orchestrator verifies and integrates a completed worker result, it should assign that worker the next independent bounded lane without waiting for every worker named in the current round.

## Rolling worker utilisation

Independent delegation uses a rolling worker pool. Dispatch the currently safe non-overlapping lanes up to available capacity, then replenish a freed worker immediately with the next independent lane after its result has been reviewed and integrated. This matters especially when capacity is small, such as three worker slots: do not leave a slot idle while an independent lane is ready. Report each completion, verification result, and atomic commit as it lands.

Use a later round only when one lane genuinely depends on another's result or would otherwise overlap its write scope. Do not use rounds to make independent work wait for a nominal batch to finish.

`ki-batch` is different: it coordinates an explicitly authorised, synergistic set of separate Ready work records. A delegation packet may support an individual member's implementation, but ordinary replenishment of a worker slot does not create or require a `ki-batch` batch.

## Quality bar

The packet must be cold-agent ready: a worker with no hidden conversation context can begin from the brief, knows what is fixed, and knows when to stop.

Choose the minimum viable model for each worker; stronger reasoning responds to decision risk, not habit or retained context.

Split a task that mixes research, judgment, and mechanical implementation when the split makes ownership and gates clearer. Keep the next independent lane ready so a completed worker can be replenished without reopening a completed boundary.

The orchestrator reviews every result and the stated verification before integrating or committing it.

## Mechanical boundary

The native rubric checks only the opt-in marker, required headings, and non-empty labeled worker fields.

It cannot decide whether a model is actually sufficient, a split is sensible, a decision is truly locked, or a verification gate is adequate; those are judgment review.

CONFORM does not rewrite authored packet content.

It never supplies semantic packet content.
