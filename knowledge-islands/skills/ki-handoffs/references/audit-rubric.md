# Handoffs audit rubric

Used by Mode AUDIT. Each criterion is tagged **[M]** (mechanical — the checker runs it) or **[J]** (judgment — you assess by reading). Run the checker first; do not eyeball what the script validates better. Each criterion cites the [handoffs standard](handoffs-standard.md) section it verifies.

Scope: only artifacts that opt in with `handoff: true` frontmatter are targets. Run the host artifact's audit first — `ki-plans` in a code repo, `ki-kb-streams` in a KB — this rubric adds the delegation-readiness delta only, and never re-checks plan/proposal structure.

## Marker checks (opt-in contract)

- **[M] HAND-1** — an artifact with `handoff: true` carries a `tier` field whose value is one of `haiku` / `sonnet` / `opus` (the opt-in marker contract). Missing or out-of-set → FAIL.
- **[M] HAND-2** — an artifact with `handoff: true` has a body section whose heading matches `decisions`, and that section names both `locked` and `escalate` (the opt-in marker contract; the quality bar's "Decisions resolved"). Missing section or either label → FAIL.
- **[M] HAND-3** — an artifact with `handoff: true` carries a readiness marker: a `readiness:` frontmatter field, a `## Readiness` heading, or a `Readiness test` checkbox (the readiness test). Missing → WARN.

## Doctrine checks (judgment)

- **[J] HAND-4** — the locked decisions are genuinely closed: no residual reasoning, hedging, or open questions parked under "locked" (the reasoning-layer split; quality bar "Decisions resolved").
- **[J] HAND-5** — each unit carries a definition-of-done that is a pass/fail acceptance test, not a goal (quality bar "Definition-of-done").
- **[J] HAND-6** — the assigned `tier` is appropriate to how concrete the steps are: mechanical work at the cheap class, spec-driven drafting at the mid class, hard judgement at the top class; a unit that could only run at the planning tier signals under-decomposed reasoning (tier assignment).
- **[J] HAND-7** — the readiness test would actually pass: a cold agent at the assigned tier could execute the first phase from the spec alone (the readiness test).
- **[J] HAND-8** — cost and tier-selection reasoning are not restated here but deferred to `ki-tokenomics`; no model ids or prices are hard-coded on the artifact (composition boundary).

## Severity mapping

| Criterion                              | Severity |
| -------------------------------------- | -------- |
| HAND-1, HAND-2                         | FAIL     |
| HAND-3                                 | WARN     |
| HAND-4, HAND-5, HAND-6, HAND-7, HAND-8 | ADVISORY |

The `[J]` criteria are surfaced by the checker as ADVISORY — it cannot decide them; a reviewer assesses them by reading the artifact.
