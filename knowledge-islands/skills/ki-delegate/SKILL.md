---
name: ki-delegate
implies: []
description: >
  Decomposes a multi-task effort and fans it out across agent and model tiers in four legs — classify each task as judgment / mechanical / research, assign it to an agent type and a per-spawn model tier (the cheapest that suffices; judgment to a standard-encoding specialist or a stronger model), sequence the work into rounds (blockers and citation-targets first, then a parallel fan-out of the independents), and gate every result (review each cheap-tier diff before commit; adversarially safety-review any auto-executing hook or script). A process skill (kind: process, ADR-KI-HARNESS-SKILLS-006): it drives an action, it does not hold a standard. Installable globally, cross-repo — usable in any repo on the machine, not just this one. Triggers: "delegate this", "fan this out", "split this across agents", "how should I parallelise this work", "/ki-delegate". Not the model-tier cost/selection policy itself (that is `ki-tokenomics`), nor the plan lifecycle it often runs on top of (that is `ki-plan`).
argument-hint: 'delegate [plan-or-task-list] | help'
---

# ki-delegate

**Kind:** process. Turns a task list or an approved plan into a **tiered, round-sequenced execution** run across sub-agents; the model-tier cost/selection policy it draws on is owned by [`ki-tokenomics`](../../environment/ki-tokenomics/SKILL.md). Full procedure in [references/delegation.md](references/delegation.md).

## What this skill does

Four legs, always in this order:

1. **Classify** — sort each task into **judgment** (wrong framing is expensive to unwind), **mechanical** (precise spec, low ambiguity), or **research** (an unknown that gates later work).
2. **Assign** — map each task to an agent type and a **per-spawn model tier**: mechanical → the cheapest model that suffices; judgment → the standard-encoding specialist agent (or a stronger model); research → a general-purpose agent. Agents declare `model: inherit`, so the tier is the caller's dial per spawn, not baked into the agent.
3. **Sequence** — order into **rounds**: blockers and citation-targets first, then fan out mutually-independent tasks in parallel. Name any write-contention so two agents never edit one file at once.
4. **Gate** — the orchestrator reviews **every** cheap-tier diff before it commits; any auto-executing hook or script gets a dedicated adversarial safety-review pass, regardless of which tier produced it.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action. With no argument, run the four legs over the current task list or the active `ki-plan`. Given a plan file or an explicit task list, classify and sequence that.

## Notes

- No universal AUDIT/CONFORM/EDUCATE/REFRESH modes — this is a process skill (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006); it has one procedure of four legs.
- The **method** (classify / assign / sequence / gate) is runtime-neutral; the **mechanics** it uses to spawn work (the Agent tool, subagent types, the per-spawn model override, background / worktree isolation) are Claude-Code-specific and tagged `CC` in the procedure — so the skill itself models the portability discipline it helps deliver.
- Draws on `ki-tokenomics` for model-tier cost/selection policy and operationalises `ADR-KI-HARNESS-003` (mechanical-first, cheapest tier that suffices) — it restates neither.
- Installable globally (`ki:skills:link:global`), alongside `ki-bootstrap` — usable in any repo on the machine. Like `ki-bootstrap`, never vendored or declared in a repo's `.ki-config.toml` — no `[ki-delegate]` table, ever.
