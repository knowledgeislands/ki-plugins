---
name: ki-repo-specifications
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: [.ki-config.toml]
description: >-
  Audits, conforms, and scaffolds the deliberately minimal repository structure for KI Specifications: a keyless `[skills.ki-repo-specifications]` marker plus the top-level proposals, specifications, schemas, templates, examples, docs, and tooling areas. Use when bootstrapping KI Specifications, checking its repository shape, or evolving that shape as the specification system matures. Triggers: "audit KI Specifications", "bootstrap the specifications repo", "check the KIP/KIS repository structure", "conform the specifications repository". It adds only the specifications-specific structural delta; use `ki-repo` for universal repository files and GitHub settings, `ki-decision-records` for decisions, and `ki-work-roadmap` for planning.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI Specifications repository structure

Apply the intentionally small repository-structure standard for KI Specifications. The repository remains a standard `ki-repo` in every general respect; this skill names its structural identity and protects only the stable top-level seams that distinguish a specification authority.

This is a governance skill. It deliberately governs repository structure without taking ownership of normative specification content.

The current floor is deliberately sparse. Detailed KIP/KIS content rules, numbering, lifecycle, conformance semantics, and publication formats remain canonical in the Specifications repository itself and should be promoted into this skill only after they prove stable and reusable.

Read [the standard](references/standards-specifications.md) for the current floor, [the rubric](references/rubric.md) for checkable criteria, and [the source list](references/sources.md) when refreshing it. The `ki` CLI runs the mechanical checker.

## Canonical shape

```text
ki-repo-specifications/
├── proposals/
├── specifications/
├── schemas/
├── templates/
├── examples/
├── docs/
├── tooling/
└── .ki-config.toml  # [skills.ki-repo] + keyless [skills.ki-repo-specifications]
```

## Operating modes

### Mode AUDIT

1. Run `ki repo audit --repo <repo> --skill ki-repo-specifications` and capture its findings.
2. Confirm the repository declares `[skills.ki-repo-specifications]`; only that declaration selects this optional standard. The structural audit then observes the seven top-level areas without judging their evolving internal contents, freshness, or outcomes.
3. Apply the judgment criteria in [the rubric](references/rubric.md), especially whether a proposed new invariant is mature enough to belong here.

### Mode CONFORM

1. Run AUDIT first.
2. The selected repository declaration is owned by `ki-repo`; this structural skill does not add it. Resolve a missing declaration through the repository configuration owner before running this standard.
3. Create a missing top-level area only after confirming its intended contents; an empty directory cannot be governed by git, so the conformer does not manufacture placeholders.
4. Re-run AUDIT.

### Mode EDUCATE

1. Establish a normal `ki-repo` first.
2. Add this skill to the repository through `ki repo skill add ki-repo-specifications --repo <repo>`.
3. Add the seven top-level areas with their first real artefacts, then run AUDIT.

### Mode HELP

Explain the skill's purpose, modes, invocation, and boundaries without changing the target.

### Mode REFRESH

**Precondition:** REFRESH writes only in `ki-agentic-harness`. When invoked from an installed copy, stop and redirect the work to the Harness source repository.

1. Read [the source list](references/sources.md) and inspect the live KI Specifications repository.
2. Promote only stable, repeated structural constraints; leave changing specification-process detail in that repository.
3. Update the standard, structured catalogue, tests, and source review together, then regenerate the rubric publication with `ki dev skill rubric ki-repo-specifications --write`.

## Boundaries

- Universal repository files, licensing, GitHub settings, and security belong to `ki-repo`.
- Markdown/TOML style belongs to `ki-authoring`.
- Decision collections belong to `ki-decision-records`; non-KB planning belongs to `ki-work-roadmap`.
- Normative KIP/KIS meaning remains owned by KI Specifications, not by this structural checker.
