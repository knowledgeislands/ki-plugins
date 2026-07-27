---
name: ki-delegate
ki-depends-on: []
description: >
  Prepares and runs execution delegation for a multi-task effort in four legs — classify each task as judgment / mechanical / research, assign it to an agent type and an explicit minimum-viable per-spawn model, sequence the work into dependency-ordered rounds, and gate every result through orchestrator review. Banks the planning reasoning in cold-agent-ready worker briefs with locked-versus-escalate decisions, a definition of done, bounded scope, a verification gate, and a completion checkpoint. A process skill (kind: process, ADR-KI-HARNESS-SKILLS-006): it drives an action, it does not hold a standard. Installable globally and usable in any repo. Triggers: "delegate this", "make this delegable", "is this ready to delegate", "fan this out", "split this across agents", "how should I parallelise this work", "/ki-delegate". Not cross-repository work transfer, the model cost/selection policy itself (that is `ki-tokenomics`), or the plan lifecycle it often runs on top of (that is `ki-plan`).
argument-hint: 'delegate [plan-or-task-list] | help'
---

# ki-delegate

**Kind:** process. Turns a task list or an approved plan into a **delegation-ready, round-sequenced execution** run across sub-agents; the model cost/selection policy it draws on is owned by `ki-tokenomics`. Full procedure in [the delegation standard](references/standards-delegation.md).

## What this skill does

Four legs, always in this order:

1. **Classify** — bank the planning reasoning once, record decisions as **locked** or **escalate**, then sort each task into **judgment** (wrong framing is expensive to unwind), **mechanical** (precise spec, low ambiguity), or **research** (an unknown that gates later work).
2. **Assign** — map each task to an agent type and an explicit **per-spawn model**. Choose the **minimum viable model**: the least capable available model that can safely meet the task's judgment, reliability, and verification needs. Mechanical → the cheapest sufficient model; judgment → the standard-encoding specialist agent (or a stronger model); research → a general-purpose agent. Agents declare `model: inherit`, so the model is the caller's dial per spawn, not baked into the agent.
3. **Sequence** — order into **rounds**: blockers and citation-targets first, then fan out mutually-independent tasks in parallel. Name any write-contention so two agents never edit one file at once.
4. **Gate** — the orchestrator reviews **every** worker result against its definition of done and verification gate before it commits; any auto-executing hook or script gets a dedicated adversarial safety-review pass, regardless of which model produced it.

**Operating invariant — banked reasoning, bounded delegation, protected orchestrator lane.** The planner discharges load-bearing reasoning into the worker brief before dispatch; a cold agent with no shared context must be able to execute its first step from that brief alone. Every worker receives one bounded deliverable, a pass/fail definition of done, file boundary, verification gate, and expected completion checkpoint. The orchestrator remains available for caller steering, decisions, progress, review, and integration while workers own implementation lanes. The full communication and completion cadence lives in the procedure.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action. With no argument, run the four legs over the current task list or the active `ki-plan`. Given a plan file or an explicit task list, classify and sequence that. Before dispatching a governed plan, ensure its `## Delegation` section records locked and escalated decisions, planned rounds, and for each worker the definition of done, explicit minimum-viable per-spawn model, bounded file scope, verification gate, and checkpoint. Apply the cold-agent readiness test from the procedure and refine the brief before dispatch when it fails.

## Notes

- No universal AUDIT/CONFORM/EDUCATE/REFRESH modes — this is a process skill (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006); it has one procedure of four legs.
- The **method** (classify / assign / sequence / gate) is runtime-neutral; the **mechanics** it uses to spawn work (the Agent tool, subagent types, the per-spawn model override, background / worktree isolation) are Claude-Code-specific and tagged `CC` in the procedure — so the skill itself models the portability discipline it helps deliver.
- Draws on `ki-tokenomics` for model cost/selection policy and operationalises `ADR-KI-HARNESS-003` (mechanical-first, cheapest model that suffices) — it restates neither.
- Installed as a core user skill by `ki bootstrap` — usable in any repo on the machine. Like `ki-bootstrap`, it is not a repository-governance root and has no `[ki-delegate]` table.
- Owns execution delegation only. Cross-repository transfer is adopted and prioritised through the receiving repository's roadmap lifecycle, not this skill.
