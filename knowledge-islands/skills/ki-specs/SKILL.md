---
name: ki-specs
ki-kind: governance
ki-applicability: detected
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Create or audit repository Specifications: accepted behaviour and quality requirements with conformance
  state, verification plans, and evidence. Use `ki-decision-records` for why, `ki-guides` for procedures, and
  `ki-work-roadmap` for future delivery.
argument-hint: 'audit [dir] | conform [dir] | help | educate [dir] | new <area> "<title>" | refresh'
---

# Knowledge Islands Specifications standard

You are applying the **Knowledge Islands Specifications standard** — how accepted behaviour and quality properties are written as a testable, append-only contract. A specification is the **what**. Its conformance state says whether the built system currently meets it; its verification plan and evidence make that claim reviewable. It sits between the **why** (Decision Records, `ki-decision-records`) and the **how** (guides).

Read [Specifications standard](references/standards-specs.md) completely before authoring, auditing, or conforming a corpus. The [rubric](references/rubric.md) publishes its checkable criteria, [exemplars](references/exemplars.md) illustrate representative shapes, and [sources](references/sources.md) records provenance.

## What this skill owns

`ki-repo` owns the repository-wide documentation topology. This skill owns the `docs/specs/` concern within it.

1. **The layout** — Specifications live flat in `docs/specs/`, one file per comprehensible feature area. `index.md` explains the purpose, ID scheme, conformance states, Gaps convention, and areas table.
2. **The table** — rows map each area file to one or more prefixes and a short scope. A prefix belongs to exactly one file.
3. **The ID scheme** — each requirement heading is `### <PREFIX>-NNN — <title>`. Serials are zero-padded, append-only, and sequential within their prefix; complete IDs are unique. Retired IDs remain claimed and are never reused.
4. **The requirement shape** — one BCP-14 normative statement describing a user-observable behaviour or quality property, followed by `_Conformance:_ conforming | pending | divergent`, `_Verify:_` naming the planned check, and `_Evidence:_` naming current proof when conforming.
5. **The Gaps backlog** — optional unnumbered bullets hold candidate requirements not yet accepted into the contract. A Gap may be promoted before implementation when its truthful conformance state is pending or divergent.
6. **The decision link** — a requirement governed by a recorded decision cites its Decision Record. This remains judgment rather than a mandatory link count.
7. **The mechanical checker** — `ki repo audit --skill ki-specs` validates registry shape, IDs, prefixes, serial continuity, normative keywords, conformance states, verification plans, and evidence for conforming requirements. Gaps and deprecated entries are exempt.

Applicability is declaration-led. Once a repository declares `ki-specs`, missing, malformed, or unsafe corpus evidence fails closed.

## Audience-aware judgment

- **User-observable behaviours** name outcomes a person or integrating system can verify through the supported product surface.
- **Quality properties** name measurable or reviewable characteristics such as accessibility, compatibility, determinism, performance, reliability, security, and visual fidelity.
- Both use the same corpus, IDs, lifecycle fields, and checker. Classification changes authoring and review, not identity mechanics.

## Operating modes

The skill carries universal **AUDIT · CONFORM · EDUCATE · REFRESH**, plus **NEW** for drafting a requirement area.

When invoked as `help`, `-h`, or `?`, explain the skill and stop. With no mode, do the same and then, only in an interactive session, offer the mode choice with `AskUserQuestion`.

### Mode EDUCATE

Activate with `ki repo skill add ki-specs`; hosted EDUCATE renders the concern rubric. Use [NEW](references/mode-new.md) to author the first area and index from the exemplars.

### Mode AUDIT

Read [references/mode-audit.md](references/mode-audit.md).

### Mode CONFORM

Read [references/mode-conform.md](references/mode-conform.md).

### Mode NEW

Read [references/mode-new.md](references/mode-new.md).

### Mode REFRESH

Read [references/mode-refresh.md](references/mode-refresh.md).

## Notes

- Requirements state what is accepted. Decision Records explain why; guides explain how; work records plan when.
- A numbered requirement stays in the contract when pending or divergent. Gaps are unaccepted candidates, not a hiding place for unfinished accepted behaviour.
- Prefer one independently verifiable normative clause per requirement.
- Serials are per prefix and never reused.
- The `ki` host owns findings, dry-run publication, rollback, reporting, and post-conform verification.
