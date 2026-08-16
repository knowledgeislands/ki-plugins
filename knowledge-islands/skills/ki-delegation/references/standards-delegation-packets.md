# Delegation-packet standard

## Contents

- [Scope](#scope)
- [Packet shape](#packet-shape)
- [Authority and isolation](#authority-and-isolation)
- [Quality bar](#quality-bar)
- [Mechanical boundary](#mechanical-boundary)

## Scope

A delegation packet is an explicit, durable brief for high-risk delegated work inside one approved roadmap record.

It translates a runtime subagent brief into a reviewable artifact before workers are dispatched.

Use it only when mutation risk, cross-agent handoff, or later audit need makes durable authority and escalation evidence valuable. It is not required for routine runtime delegation, and it does not replace the work item’s plan, authority, baseline, review packet, or acceptance decision. The standard defines the durable packet; the executing runtime and process supply worker creation, task selection, sandbox, permissions, model choice, scheduling, and result integration.

## Packet shape

An opted-in packet uses this structure inside the work item’s `## Delegation` section:

```markdown
## Delegation

### Locked decisions

- Decision that workers must not reopen.

### Escalate

- Decision that workers must return to the orchestrator.

### Worker: research-sources

- **Deliverable:** Primary-source evidence for the named unknown.
- **Inputs:** The named questions and authoritative source locators.
- **Scope:** Named primary sources only; no repository or external writes.
- **Authority:** Read the named sources; perform no repository or external writes.
- **Isolation:** Read-only worker context with no write-capable tools.
- **Verify:** Coordinator checks every source and conclusion.
- **Return:** Concise findings, source links, and unresolved conflicts; no raw browsing transcript.
- **Checkpoint:** Return after the source set is complete.
```

The packet contains non-empty `Locked decisions` and `Escalate` sections and at least one `Worker:` subsection.

Each worker subsection contains these non-empty fields:

- **Deliverable:** one bounded outcome;
- **Inputs:** source artifacts, locators, conventions, and decisions the cold worker needs;
- **Scope:** the exact file or external-system boundary and excluded side effects, including `None` for read-only research;
- **Authority:** allowed actions and prohibited side effects;
- **Isolation:** the runtime-neutral sandbox or worktree boundary;
- **Verify:** the check the coordinator will apply;
- **Return:** the concise result and evidence format;
- **Checkpoint:** the condition at which the worker stops and returns control.

## Authority and isolation

Grant the least authority and tool access that can complete the lane. The worker brief may narrow inherited runtime permissions but never expands the work record’s authority. State external effects explicitly; filesystem scope alone does not govern network calls, messages, deployments, or other systems.

Choose the strongest practical isolation for the lane: read-only for research, an exclusive non-overlapping write boundary in a shared worktree, or an isolated worktree or sandbox when writes could interfere. If the runtime cannot enforce the required boundary, reduce the lane to a safer read-only task or keep it with the coordinator.

When a worker will run Git write commands in a shared worktree, its brief also names a unique temporary Git index path. The worker passes it explicitly on every Git write command, for example `GIT_INDEX_FILE=<worker-index> git add -- <paths>`. The path is a worker-local staging boundary, not authority to commit concurrently; `ki-git` owns the matching shared-`HEAD` serialization rule.

## Quality bar

The packet must be cold-agent ready: a worker with no hidden conversation context can begin from the brief, knows what is fixed, and knows when to stop.

The packet makes only its durable governance boundaries explicit. Runtime and process guidance owns model selection, orchestration, worker capacity, and result integration.

## Mechanical boundary

The native rubric checks only the opt-in marker, exact required headings, and non-empty labelled worker fields.

It cannot decide whether the durable-packet threshold is met, authority is appropriately narrow, isolation is enforceable, a decision is truly locked, or a verification gate is adequate; those are judgment review.

CONFORM does not rewrite authored packet content.

It never supplies semantic packet content.
