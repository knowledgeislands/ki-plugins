---
name: ki-agenda
ki-kind: process
ki-depends-on: []
description: >
  Coordinates one safe human-authorised agenda cycle over named ready roadmap work. Use when asked to "run the agenda", "keep approved work moving", "check what can proceed", or "surface blockers early". It consumes an explicit ki-batch authorisation, asks every known question before delivery, and stops on uncertainty; it never selects priorities, approves plans, accepts work, prunes, pushes, releases, or changes another repository.
argument-hint: 'agenda <batch-authorisation> | help'
---

# KI Agenda

**Kind:** process.

Coordinates one bounded agenda cycle over named ready work. Read [the agenda procedure](references/standards-agenda.md) before running a cycle. Read `scripts/internal/agenda-cycle.ts` only when validating the controlled no-write fixture model.

## What this skill does

`ki-agenda` is the human-in-the-loop layer over a reviewed `ki-batch` authorisation. It re-grounds the named repository and records, reports questions before starting delivery, then coordinates only the already-authorised independent records through their normal lifecycle skills.

The batch authorisation remains the sole durable authority and run ledger. The agenda does not create a queue, tracker, scheduler, daemon, or hidden state.

## Responsibility boundary

```text
ki-next → selects and promotes work
ki-plan → shapes and receives readiness approval
ki-batch → records reviewed named authority
ki-agenda → runs one bounded authorised cycle
ki-implement → delivers each record to awaiting-review
ki-accept → closes or prunes only with human authority
```

An agenda cycle stops on a dirty tree, failed gate, unsatisfied dependency, external coordination need, scope change, expired timebox, push or release, or unapproved decision. It may continue only records proven independent of the stopped item and explicitly named in the same authorisation.

## Invocation

`help` / `-h` / `?` explains this boundary and stops.

`agenda <batch-authorisation>` validates one approved authorisation and runs one cycle. It never treats a clean gate, silence, or an unreviewed draft as authority.

## Notes

- Use `ki-batch` to prepare and obtain approval for the named authority; use `ki-agenda` only after that approval exists.
- A cycle normally ends with each delivered record at `awaiting-review`. Acceptance, Done, and pruning remain separate human gates.
- The fixture model has no filesystem or repository write capability. It is evidence for the stop boundary, not a runtime executor.
