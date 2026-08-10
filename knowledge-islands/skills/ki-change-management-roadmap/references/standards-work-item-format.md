# Repository work-item format

## Contents

- [Placement and identity](#placement-and-identity)
- [Frontmatter](#frontmatter)
- [Body](#body)
- [Detail by stage](#detail-by-stage)

## Placement and identity

Each work item is one regular Markdown file directly under `docs/roadmap/`:

```text
docs/roadmap/<REPO>-<NNN>-<slug>.md
docs/roadmap/<REPO>-<AREA>-<NNN>-<slug>.md
```

`<REPO>-<NNN>` or `<REPO>-<AREA>-<NNN>` is the identifier described by [the repository-roadmap standard](standards-repository-roadmaps.md). `docs/roadmap/_ISSUES.md` retains the applicable repository or area high-water mark so a pruned record never makes its identifier reusable.

`<slug>` is lowercase kebab-case and no longer than 50 characters.

## Frontmatter

```yaml
---
id: KI-HARNESS-FND-001
area: FND
title: Compact descriptive title
theme: foundation-tooling
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
---
```

`id`, `title`, `theme`, `horizon`, `status`, `blocks`, `blocked_by`, and `baseline_ref` are required. `area` is required only when the repository configures fixed issuing areas, and prohibited otherwise.

`title` contains at most four words. It is a compact human label for lists and reports; put scope and nuance in the Goal and Context rather than extending the title.

`candidate` is required for Future items and must be `true`; it is absent from every other horizon.

`horizon` is one of `now`, `next`, `soon`, `waiting-for`, `parked`, or `future`.

`status` is `draft`, `ready`, `in-progress`, `awaiting-review`, or `done`.

`blocks` and `blocked_by` are arrays of item identifiers and use `[]` when empty.

`waiting-on-trades` is an optional flat array of unique `TRD-<eight-hex>` identities. It is valid only when `horizon: waiting-for` and records observed cross-repository conditions rather than local work-item dependencies. Do not place trade identities in `blocks` or `blocked_by`.

`baseline_ref` is `null` until execution begins, then the immutable full lowercase commit ID.

`theme` is the human-readable kebab-case project grouping.

`area` is the immutable issuing code included in an area-qualified identifier. It is not a theme or mutable group.

An optional non-empty `transferred-from` records a durable handoff origin.

## Body

Every item begins with these sections in order and ends with `## Discussion`:

```markdown
## Goal

The plain-language user or system outcome this work should achieve.

## Context

Why the work exists now, including current evidence and technical background.

## Boundary

What this item deliberately does not include.

## Discussion

### Topic

Decision-useful reasoning, alternatives, or unresolved questions.
```

`Discussion` is topic-oriented rather than chronological.

`Goal` is mandatory and non-empty. State the outcome in one to three plain-language sentences that a reader can understand without implementation detail. It names the change in the world, not a file, command, or internal mechanism. `Context` supplies the supporting evidence and technical rationale; it does not substitute for the Goal.

Use descriptive `###` headings such as `### Authority model`, `### Source analysis`, `### Alternatives`, or `### Open questions`.

Do not turn it into a session log.

Material decisions that outlive the item still belong in a Decision Record.

An item may add concise structured sections between `## Boundary` and `## Discussion`.

A focused one-step item may remain brief.

When an item adopts a material handoff, process design, or architectural proposal, preserve the decision-useful detail rather than reducing it to a prompt: its operating model, sources, meaningful alternatives, authority and safety boundaries, unresolved questions, and intended first deliverable.

Use structured sections where the material has a stable shape and retain exploratory reasoning under topic headings in `Discussion`.

The roadmap item is the durable handoff record until its work is planned; external links alone are insufficient.

## Detail by stage

### Future / draft

`Goal`, `Context`, `Boundary`, and final `Discussion` are sufficient.

They preserve the intended outcome, why the item exists, its deliberate exclusion, and the reasoning needed to shape it later without pretending that it is planned.

### Soon / draft

Add `## Shaping` between `Boundary` and `Discussion`.

It states the intended approach, known dependencies, decisions still needed, and the conditions for promotion.

### Next or Now / draft to ready

Once selected for immediate work, retain the earlier sections and add these sections before `Discussion`, in order:

```markdown
## Current state

The honest baseline, including gaps.

## Steps

- [ ] Concrete, inspectable action.

## Files touched

The minimal expected scope.

## Verify

A pass/fail command or assertion.

## Dependencies / blocks

Narrative dependency context.
```

When delegated work is planned, add `## Delegation` after `## Dependencies / blocks`.

It names bounded worker deliverables and file boundaries, the gate between rounds, and the orchestrator’s final review and verification responsibility.

An immediate item may remain `status: draft` while `ki-plan` shapes these sections.

It becomes `status: ready` only after the sections are concrete, dependencies are satisfied, verification is checkable, and the user approves the plan.

Every Step is a Markdown task-list item. New and Ready plans use `- [ ]`; implementation marks completed work as `- [x]`. In-progress items may contain both states, while Acceptance and Done items require every Step to be `- [x]`.

### In progress

The implementation process records the immutable full `HEAD` commit in `baseline_ref`, sets `status: in-progress`, and marks completed Steps `- [x]` without deleting them.

Record material departures, decisions, and newly discovered constraints under the relevant topic in the final `Discussion`; do not record routine activity.

### Awaiting review

Before setting `status: awaiting-review`, insert `## Review` immediately before `Discussion` with `### Delivered`, `### Summary of changes`, `### Verification`, `### Outstanding concerns`, `### Post-change review`, and `### Mini recap` in that order.

This is the required evidence and review packet for an explicit acceptance decision. `ki-accept` records the interactive review outcome here before closure.

### Done

After explicit acceptance, insert terminal `## Done` immediately before `Discussion` and set `status: done`. Keep the reviewed record until an explicitly selected prune path or glob removes it.

Retain the accepted record until an explicitly selected prune path or glob.

At every stage, `Discussion` remains the final top-level section.

Completed Steps remain `- [x]` rather than being removed.
