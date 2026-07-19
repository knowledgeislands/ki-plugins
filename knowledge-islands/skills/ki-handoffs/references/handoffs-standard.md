# Handoffs standard — the canonical source

This is the single source of truth for the handoff doctrine: the reasoning-layer split, the opt-in marker contract, the quality bar in full, and the tier-assignment rules. The `ki-handoffs` `SKILL.md` governs the _doctrine_ (why to split reasoning from execution, when to opt in, how the modes run); this file holds the _spec_ that AUDIT and CONFORM check against. Neither restates the other.

Handoffs are a **cross-tier instrument** that rides on a host artifact — a thematic plan file (`ki-repo-roadmap`) in a non-KB repository, or a stream proposal's `## Checklist` (`ki-kb-streams`) in a Knowledge Base. This standard governs only the delegation-readiness delta laid on top; the host artifact's own format and lifecycle are owned by its skill.

**Contents:**

- [The reasoning-layer split](#the-reasoning-layer-split)
- [The opt-in marker contract](#the-opt-in-marker-contract)
- [The quality bar](#the-quality-bar)
- [Tier assignment](#tier-assignment)
- [The readiness test](#the-readiness-test)

## The reasoning-layer split

The premise: **reasoning is the expensive act; execution is not.** The top reasoning tier is spent **once** to think a body of work through — to scope it, resolve the judgement calls, and sequence it — and its output is banked as specs that a cheaper tier, a cold agent, or another person executes without re-reasoning.

This inverts the default of doing the work at whatever tier planned it. The planner's job is to discharge the reasoning so completely that nothing load-bearing is left in its head: every decision recorded, every step made concrete enough for the assigned tier, every acceptance test written down. What remains is mechanical enough to run cheaply and in parallel.

Two consequences follow, and both are enforced below: the planner must **mark which decisions are closed** (so the executor does not re-open them) and **which need the owner** (so they are not silently executed), and must **assign each unit the cheapest tier its spec makes safe** — the whole point is that most execution runs below the planning tier.

## The opt-in marker contract

An artifact opts into handoff-governance with frontmatter:

```yaml
handoff: true
tier: sonnet # cheapest safe tier: haiku | sonnet | opus (semantic; cost/selection per ki-tokenomics)
```

It must then carry, in its body:

- **A decisions section** — a heading matching `decisions` (e.g. `## Decisions`) that distinguishes **locked** from **escalate**: the judgements already made and closed, and the judgements that need the owner. Both labels must be present, even if one list is empty ("Escalate: none").
- **A readiness marker** — one of: a `readiness:` frontmatter field (a date the cold-agent test was run, or `pending`); a `## Readiness` heading; or a `- [ ] Readiness test` / `- [x] Readiness test` checkbox.

Opt-in is deliberate: it keeps the doctrine off artifacts whose author does not want it, and scopes the checker to work that is genuinely being handed down a tier. An artifact without `handoff: true` is not a target and is never flagged.

The `tier` value is **semantic** — the house `haiku` / `sonnet` / `opus` classes, cheapest to most capable. This standard fixes no model ids or prices; they resolve at runtime through the `claude-api` skill, and their per-environment default (`preferred_model`) and cost belong to `ki-tokenomics`.

## The quality bar

A handoff spec is delegable when it passes all four. These **extend** the host artifact's quality bar (`ki-repo-roadmap`: concrete Steps, checkable Verify, honest Current state, minimal Files touched — or the `ki-kb-streams` proposal equivalents); they do not replace it.

| Check                  | Ready                                                            | Failure mode                                             |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| **Decisions resolved** | Every judgement is either locked (closed) or escalated (flagged) | An unmarked open question the executor must reason about |
| **Definition-of-done** | Each unit has a pass/fail acceptance test                        | "Make it good" — a goal, not a test                      |
| **Tier assigned**      | Each unit names the cheapest safe tier, one-line rationale       | No tier, so execution defaults to the planning tier      |
| **Readiness tested**   | The cold-agent test was run and recorded                         | Readiness assumed, not demonstrated                      |

## Tier assignment

Each unit of work names the **cheapest tier that its spec makes safe** — not the tier that planned it. The more completely the reasoning is discharged into the spec, the lower the tier that can execute it. As a rule of thumb, mechanical or deterministic work (reorganisation, filing, index fixes, format changes) runs at the cheap class; structured drafting or analysis against a clear spec runs at the mid class; genuinely hard drafting or judgement runs at the top class. A unit that can only run at the planning tier is a signal the reasoning was not fully banked — decompose it further before handing it off.

Assignment is a **planning act owned here**; cost and the ambient default are owned by `ki-tokenomics`. This standard requires only that a tier be present and carry a one-line rationale tied to the reasoning already discharged. It never restates the `ki-tokenomics` mode→tier table or any model id.

## The readiness test

The test that turns "looks delegable" into "is delegable": hand the spec to a **cold agent at the assigned tier** — no shared context, only the spec — and confirm it can execute the **first phase** from the spec alone. Whatever it cannot do without asking is reasoning that never made it onto the page; write that down and re-test.

Record the result on the artifact via the readiness marker (a date, a ticked checkbox, or a `## Readiness` note). A recorded failure is still a valid state — it says the spec is not yet ready and names why. Fresh-context verification tends to outperform self-review here: the planner is the worst judge of what only lives in the planner's head.
