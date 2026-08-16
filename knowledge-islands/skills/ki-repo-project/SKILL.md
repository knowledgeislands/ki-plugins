---
name: ki-repo-project
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Explains the Project repository baseline for a non-Knowledge-Base Knowledge Islands repository and its composable ki-repo-* structures. Primary-kind declaration and mutual exclusion belong to ki-repo; forward-work adapter selection belongs to ki-work. Use when orienting a Project migration or its relationship to a specialised repository structure. For KBs use ki-repo-kb; for tracker choice use ki-work.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI Project repository

`ki-repo-project` describes the common baseline for a non-Knowledge-Base KI repository. `ki-repo` is the sole owner of primary-kind declaration and Project/KB mutual exclusion; specialised `ki-repo-*` standards compose with that baseline but do not replace it. A Knowledge Base instead uses the `ki-repo-kb` structure contract.

Read [the Project repository standard](references/standards-project-repository.md) when declaring or changing primary structure. Read [the generated rubric](references/rubric.md) for the checkable configuration boundary and [the sources](references/sources.md) when refreshing it.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. `help` / `-h` / `?` explains the distinction and stops.

### Mode AUDIT

Run `ki repo audit --skill ki-repo --repo <repo>` for the declared primary kind, then `ki repo audit --skill ki-work --repo <repo>` for the selected forward-work adapter. This skill adds no duplicate primary-kind audit.

### Mode CONFORM

Run the owner audits in AUDIT first. This skill proposes no primary declaration, adapter selection, or migration mutation; those remain owner- and user-authority-bound.

### Mode EDUCATE

Explain Project as the default primary structure, the `ki-repo-*` extensions it may compose, and the separate selection of a change-management adapter. Do not infer that a repository is a KB from one incidental directory.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill in `ki-agentic-harness`. From an installed copy, stop and redirect to the Harness. Revisit the standard when a new primary structure, inheritance rule, or mutually exclusive repository classification is introduced.
