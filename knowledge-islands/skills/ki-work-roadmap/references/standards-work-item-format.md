# Repository work-item format

## Contents

- [Placement and identity](#placement-and-identity)
- [Frontmatter](#frontmatter)
- [Body](#body)
- [Detail by stage](#detail-by-stage)

## Placement and identity

Each work item is one regular Markdown file directly under its adapter's roadmap directory:

```text
docs/roadmap/<REPO>-<NNN>-<slug>.md
docs/roadmap/<REPO>-<AREA>-<NNN>-<slug>.md
Streams/Roadmap/<REPO>-<NNN>-<slug>.md
Streams/Roadmap/<REPO>-<AREA>-<NNN>-<slug>.md
```

`<REPO>-<NNN>` or `<REPO>-<AREA>-<NNN>` is the identifier described by [the repository-roadmap standard](standards-repository-roadmaps.md). The adapter-local `_ISSUES.md` retains the applicable repository or area high-water mark so a pruned record never makes its identifier reusable.

`<slug>` is lowercase kebab-case and no longer than 50 characters.

## Frontmatter

```yaml
---
id: KI-HARNESS-FND-001
area: FND
title: Compact descriptive title
theme: foundation-tooling
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-08-12T09:30:00Z
updated_at: 2026-08-12T09:30:00Z
---
```

`id`, `title`, `theme`, `horizon`, `status`, `blocks`, `blocked_by`, and `baseline_ref` are required. `area` is required only when the repository configures fixed issuing areas, and prohibited otherwise.

`title` contains at most four words. It is a compact human label for lists and reports; put scope and nuance in the Goal and Context rather than extending the title.

`candidate` is retired and must be absent.

`horizon` is one of `now`, `next`, `soon`, `waiting-for`, `parked`, `future`, or `triage`. Triage is unadopted intake and normally permits only `status: draft`; Future is adopted long-term work. The sole exception is a human-approved terminal intake disposition recorded as Triage / done.

`status` is `draft`, `ready`, `in-progress`, `awaiting-review`, or `done`.

`intake_disposition` and `intake_disposition_target` are optional terminal-intake fields. They are forbidden on open Triage and every adopted delivery record. A Triage / done record requires `intake_disposition: rejected`, `intake_disposition: duplicate`, or `intake_disposition: merged`. `intake_disposition_target` is the identifier of another retained canonical work item and is required for `duplicate` or `merged`, but forbidden for `rejected`; it must use the canonical identifier grammar, differ from the closing record, and resolve in the selected roadmap.

`blocks` and `blocked_by` are arrays of item identifiers and use `[]` when empty.

`blocked_by` states **build order**: this item cannot be executed because something it must build on does not exist yet. It is discharged when that thing exists, not when the record that produced it reaches a particular lifecycle state. An item is therefore not blocked merely because a related record is unreviewed, unaccepted, or unpruned; a blocker whose work has landed is cleared even while its own record is still open. Recording a lifecycle wait as `blocked_by` stalls executable work behind an approval queue and misreports the reason. Where the real constraint is sequencing preference rather than build order, say so in `## Dependencies / blocks` and leave the field empty.

`waiting_on_trades` is an optional flat array of unique `TRD-<eight-hex>` identities. It is valid only when `horizon: waiting-for` and records observed cross-repository conditions rather than local work-item dependencies. Do not place trade identities in `blocks` or `blocked_by`.

`baseline_ref` is `null` until execution begins, then the immutable full lowercase commit ID.

`theme` is the human-readable kebab-case project grouping.

`area` is the immutable issuing code included in an area-qualified identifier. It is not a theme or mutable group.

An optional non-empty `transferred_from` records a durable handoff origin.

## Timestamps

`created_at` and `updated_at` are mandatory for every local work item. Local work-item timestamps use canonical RFC 3339 UTC at second precision: `YYYY-MM-DDTHH:MM:SSZ`. A new record writes the same instant to both fields. `created_at` is immutable. A governed lifecycle or semantic body mutation preserves `created_at` and advances `updated_at` to the later of the current UTC second or one second after its previous value. Read-only inspection and formatting-only normalisation do not advance `updated_at`.

Before publishing a local mutation, the writer compares the record revision it observed with the revision it will replace and stops on drift. Validation requires pair presence, canonical shape, and `created_at <= updated_at`. It deliberately does not compare either value with the auditor's wall clock, so clock skew or a previously recorded future value cannot make an otherwise monotonic record invalid.

Remote adapters project their provider-native creation and update timestamps into the portable work-item view. They do not duplicate those values into provider bodies. Knowledge Base Streams owns validation and mutation of its local projection; the repository-roadmap adapter owns the equivalent contract under `docs/roadmap/`.

The timestamp pair supports age, inactivity, coverage, and stale-active reporting; it does not establish lifecycle event history, cycle time, throughput, or time-in-state evidence.

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

### Triage or Future / draft

`Goal`, `Context`, `Boundary`, and final `Discussion` are sufficient.

They preserve the intended outcome, why the item exists, its deliberate exclusion, and the reasoning needed to shape it later without pretending that it is planned. Triage additionally means the item is captured but not adopted; Future means it has been adopted as long-term work.

### Triage / done

An exact human-approved `rejected`, `duplicate`, or `merged` disposition may close Triage without adopting or implementing the work. Insert `## Intake disposition` after `Boundary`, then terminal `## Done`, then the final `Discussion`. Do not add execution sections or a delivery Review packet merely to close intake.

`## Intake disposition` records the approved Outcome and Rationale. For `duplicate` or `merged`, it also names the retained canonical work-item identifier recorded by `intake_disposition_target`; for `rejected`, it states that no retained target applies. It records the human Approval explicitly. The section must be non-empty and must not claim delivery evidence.

Keep `baseline_ref: null`: no implementation baseline exists. Set `status: done` only in the coherent closure change owned by `ki-accept`.

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

## Documentation impact

### Decision Records

State the impact, or why no decision record is needed.

### Specifications

State the impact, or why no behaviour-level contract changes.

### Guides

State the impact, or why no human guidance changes.

### Roadmap

State the impact on follow-on work, or why no roadmap change is needed.
```

Immediate `Now` and `Next` records MUST retain this exact `Documentation impact` shape. Each concern records its intended change or a concise, justified non-applicability. The parser checks the shape and non-empty statements; review judges whether the claimed impact is truthful. This records documentation consequences without making documentation a fifth work-item category.

When delegated work is planned, add `## Delegation` after `## Dependencies / blocks`.

It names bounded worker deliverables and file boundaries, the gate between rounds, and the orchestrator’s final review and verification responsibility.

An immediate item may remain `status: draft` while `ki-plan` shapes these sections.

It becomes `status: ready` only after the sections are concrete, dependencies are satisfied, verification is checkable, and the user approves the plan.

Every Step is a Markdown task-list item. New and Ready plans use `- [ ]`; implementation marks completed work as `- [x]`. In-progress items may contain both states, while Acceptance and Done items require every Step to be `- [x]`.

### In progress

The implementation process records the immutable full `HEAD` commit in `baseline_ref`, sets `status: in-progress`, and marks completed Steps `- [x]` without deleting them.

Record material departures, decisions, and newly discovered constraints under the relevant topic in the final `Discussion`; do not record routine activity.

### Awaiting review

Before setting `status: awaiting-review`, insert `## Review` immediately before `Discussion` with `### Delivered`, `### Summary of changes`, `### Verification`, `### Outstanding concerns`, `### Post-change review`, and `### Mini recap` in that exact order. The roadmap checker enforces this review-packet shape.

- **Delivered** states the approved boundary and exclusions, plus immutable baseline and resulting evidence.
- **Summary of changes** names concrete changed files, material decisions, and approved deviations.
- **Verification** records exact gates and their outcomes.
- **Outstanding concerns** records unresolved, unchecked, or failing issues, or explicitly says none.
- **Post-change review** freshly assesses goal, scope, regression risk, and acceptance readiness.
- **Mini recap** restates item-scoped delivery, verification, and concerns, then proposes learning routes without promoting them.

Later process skills reuse these producer/consumer semantics; they do not reinterpret heading names or insert parallel review sections.

This is the required evidence and review packet for an explicit acceptance decision. `ki-accept` records the interactive review outcome here before closure.

### Done

After explicit acceptance, insert terminal `## Done` immediately before `Discussion` and set `status: done`. Keep the reviewed record until an explicitly selected prune path or glob removes it.

`## Done` is required, not optional decoration: the checker rejects a `done` record without it, so a record cannot reach the terminal state by changing `status` alone. It records who accepted the work and when, against the review packet above — `Accepted <date> by <name> on the review packet above.` — and nothing else. Evidence belongs in `## Review`, and anything learned during acceptance belongs in `Discussion`.

For terminal Triage, `## Done` instead records who approved the disposition and when — `Disposed <date> by <name> as <intake_disposition> on the intake evidence above.` — and nothing else. Evidence belongs in `## Intake disposition`.

Retain the accepted record until an explicitly selected prune path or glob.

At every stage, `Discussion` remains the final top-level section.

Completed Steps remain `- [x]` rather than being removed.
