---
name: ki-delegation
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Governs durable delegation packets for approved high-risk agent work: explicit locked decisions, authority, isolation, escalation, verification, and return boundaries that survive a runtime handoff. Use when a delegated change needs an auditable cross-agent brief or when designing or auditing that packet. Ordinary runtime subagent task selection and execution stay with the active process and runtime; model-purpose policy belongs to ki-tokenomics; cross-repository work transfer is ki-trades.
argument-hint: 'audit <repo> | conform <repo> | educate <work-item> | help | refresh'
---

# Knowledge Islands delegation standard

`ki-delegation` owns the portable, durable governance delta for an explicit delegation packet embedded in an approved governed work record.

It does not select work, authorise execution, choose a model, spawn a worker, accept results, or transfer work between repositories.

Read [the delegation-packet standard](references/standards-delegation-packets.md) before designing a packet, [the generated rubric](references/rubric.md) for its mechanical and judgment criteria, and [the sources](references/sources.md) when refreshing the standard.

Use a packet only when an approved delegated change has enough mutation risk, cross-agent handoff, or later audit need that its fixed decisions and authority boundaries must be durable. Do not create one for ordinary runtime delegation merely because a task is independent or bounded.

This standard supplies the durable packet contract to an executing process such as `ki-implement`; it is not an execution command. Runtime and process owners decide whether to delegate, create workers, select models, schedule capacity, and integrate results.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes.

Invoked as `help` / `-h` / `?`, it explains this boundary and stops.

### Mode AUDIT

Run `ki repo audit --skill ki-delegation --repo <repo>`.

The native rubric inspects only durable delegation packets: a roadmap record opts in by carrying `## Delegation` with both `### Locked decisions` and `### Escalate` sections plus a worker brief.

It checks the mechanically legible packet shape, then reviews whether packet activation, locked decisions, authority, isolation, escalation boundaries, return contract, and verification gates are actually sound.

Ordinary `## Delegation` plan notes without the packet marker remain under `ki-work-roadmap` and are not a failure here.

### Mode CONFORM

Run `ki repo conform --skill ki-delegation --repo <repo> --dry-run` before applying it.

CONFORM makes no authored packet-content change.

It never creates a packet, chooses a worker or model, invents a locked decision, alters an escalation boundary, or grants execution authority.

### Mode EDUCATE

For one explicitly selected approved work record, explain or add the packet shape from [the delegation-packet standard](references/standards-delegation-packets.md).

Ask the planner to supply every semantic value; EDUCATE never guesses the delegation design.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill under `ki-agentic-harness`.

When invoked from an installed copy, stop and redirect to the harness.

Read [the sources](references/sources.md), compare durable delegation practice and its sources against [the standard](references/standards-delegation-packets.md) and rubric, then update the source review in the same commit as any normative change.

### Mode HELP

Explain the durable-packet activation boundary, the packet shape, runtime and process ownership of ordinary subagent execution, model-purpose policy in `ki-tokenomics`, and cross-repository transfer in `ki-trades`.

## Notes

- A packet makes a high-risk runtime handoff durable, authority-bounded, and reviewable; it is not a separate execution lifecycle or a replacement for ordinary runtime delegation guidance.
- The local rubric is the materialised domain contract; generic execution, reporting, transaction safety, and publication remain owned by `ki`.
