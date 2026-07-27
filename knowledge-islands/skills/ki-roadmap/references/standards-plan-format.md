# Plan format standard

## Contents

- [Placement](#placement)
- [Frontmatter](#frontmatter)
- [Local roadmap reference](#local-roadmap-reference)
- [Body](#body)

Plans exist only in the thematic profile. Ordinary plans resolve only to `Blocking` or `Next` items. An open plan with a non-empty `transferred-from` origin may resolve to any other honest horizon solely to preserve transferred detail; it cannot become `ready`, `in-progress`, `acceptance`, or `done` there.

## Placement

```text
docs/roadmap/<theme>/plans/<THEME>-<NNN>-<slug>.md
```

`<theme>` matches the canonical roadmap directory. `<THEME>` is that roadmap's authored uppercase `code`; `<NNN>` is a zero-padded serial of at least three digits, allocated within that code from `001`. Together they form the quoted, globally unique canonical plan identifier `<THEME>-<NNN>`. `<slug>` is lowercase kebab-case and no longer than 50 characters.

## Frontmatter

```yaml
---
id: 'HOK-004'
title: Short descriptive title
status: open
roadmap: hooks/promote-plan-mode-plans
blocks: —
blocked-by: —
baseline-ref: —
---
```

- `status` is `open`, `ready`, `in-progress`, `acceptance`, or `done`. `open` awaits explicit approval to start; `ready` is approved and unblocked; `acceptance` means planned work and verification are complete and the plan awaits the user's explicit acceptance; `done` is a retained completion record awaiting an explicit later prune. Explicitly named plans may transition from `open` to `ready` together under one approval, and from `ready` to `in-progress` together under one coordinated start; each batch is all-or-nothing and committed once.
- `roadmap` is a qualified `<theme>/<item-slug>` locator whose theme matches the plan directory. It resolves to a `Blocking` or `Next` item unless the plan is both `status: open` and carries a non-empty `transferred-from`; that exception may resolve to any other honest horizon.
- `blocks` and `blocked-by` are comma-separated canonical `<THEME>-<NNN>` plan identifiers or `—`, and are reverse-consistent.
- `baseline-ref` is `—` while a plan is `open` or `ready`. The initial `execute` transition replaces it with the full lowercase commit object ID at `HEAD` immediately before work starts. The immutable ID remains unchanged through `in-progress`, `acceptance`, and `done`, providing the recoverable comparison baseline without requiring a tag or release.
- `transferred-from` is an optional non-empty string naming the origin of transferred execution detail, for example `knowledgeislands/tools-ki:CLI-006`. Outside `Blocking` or `Next`, it is valid only with `status: open`; moving the item to a near horizon is a separate authored priority decision required before `ready`.
- There is no `phase` field; the canonical roadmap horizon is authoritative.

## Local roadmap reference

The plan's canonical roadmap item carries this final, standalone derived line after its authored prose:

```markdown
**Plan:** [HOK-004](plans/HOK-004-short-description.md)
```

`HOK-004` is the plan's `id`; the relative link names its own file below that theme's `plans/` directory. The line is owned by `ki-roadmap` CONFORM and the `ki-plan` lifecycle, not by the item's prose. It is absent when no active plan resolves to the item.

## Body

Use these sections in order:

```markdown
## Context

Why the work exists and its intended outcome.

## Current state

The honest baseline, including gaps.

## Steps

1. Concrete, inspectable action.

## Files touched

The minimal expected scope.

## Verify

A pass/fail command or assertion.

## Dependencies / blocks

Narrative dependency context.
```

When the plan intends to use delegated workers, append one `## Delegation` section after `## Dependencies / blocks` and before acceptance. It is not required for work the plan's orchestrator will complete directly. State the planned rounds, classify each worker task as judgment, mechanical, or research, name each worker's bounded deliverable and exclusive file boundary, and name the gate between rounds. State the orchestrator's final review and verification responsibility; call out an adversarial review when a worker changes a hook, script, or other automatically executing artefact.

```markdown
## Delegation

- Round 1 — research: resolve <unknown>; files: <read-only scope>; gate: <evidence needed before Round 2>.
- Round 2 — mechanical: apply <settled change>; files: <exclusive write scope>; gate: <focused verification>.
- Orchestrator: review every worker diff, run final verification, and commit only gated work.
```

During execution, mark completed steps without deleting their instructions. Before acceptance, append one non-empty `## Acceptance` section after the optional `## Delegation` section, or after `## Dependencies / blocks` when delegation is absent, using these H3 subsections, once and in order:

```markdown
## Acceptance

### Delivered

The material outcome in reviewable terms.

### Summary of changes

- The meaningful implementation or documentation changes, with primary paths where useful.

### Verification

- The concrete commands and outcomes, plus the checked commit or other evidence revision.

### Outstanding concerns

Open questions, limitations, and proposed acceptance analysis; write `None` when there are none.

### Mini recap

What was learned and any proposed route. The route remains a proposal until the user approves it separately.
```

After explicit acceptance, retain the packet and append one non-empty terminal `## Done` H2 recording the outcome. Re-run a plan's implementation checks when entering acceptance and after any material implementation, verification, or environment change. An editorial refinement to the acceptance packet instead runs the relevant documentation and roadmap checks; it retains the earlier evidence revision rather than needlessly repeating unrelated full gates. `done` plans remain visible in the completed-plan index until an explicit `ki-plan prune` removes a selected committed batch.

Additional H2 sections must preserve the six core sections exactly once and in the order above. `## Delegation` remains the optional execution-delegation surface defined by this standard.
