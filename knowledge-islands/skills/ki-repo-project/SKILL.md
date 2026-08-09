---
name: ki-repo-project
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
description: >
  Defines a Project repository as the explicit default Knowledge Islands primary structure: a git repository whose work is governed through a selected change-management adapter and which may compose specialised ki-repo-* structures. Use when declaring, auditing, or converting a non-Knowledge-Base repository, or deciding whether a repository is Project or Knowledge Base. For KBs use ki-repo-kb; for tracker choice use ki-change-management.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI Project repository

`ki-repo-project` is the explicit primary structure for every non-Knowledge-Base KI repository. It supplies the common repository baseline; specialised `ki-repo-*` standards compose with it but do not replace it. A Knowledge Base instead selects `ki-repo-kb` as its primary structure.

Read [the Project repository standard](references/standards-project-repository.md) when declaring or changing primary structure. Read [the generated rubric](references/rubric.md) for the checkable configuration boundary and [the sources](references/sources.md) when refreshing it.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. `help` / `-h` / `?` explains the distinction and stops.

### Mode AUDIT

Run `ki repo audit --skill ki-repo-project --repo <repo>`. It verifies that this repository explicitly declares Project primary structure and does not also declare the mutually exclusive KB primary structure.

### Mode CONFORM

Run `ki repo conform --skill ki-repo-project --repo <repo> --dry-run`. It may propose only an unambiguous missing primary declaration; it never reclassifies a Knowledge Base or removes a conflicting declaration without explicit authority.

### Mode EDUCATE

Explain Project as the default primary structure, the `ki-repo-*` extensions it may compose, and the separate selection of a change-management adapter. Do not infer that a repository is a KB from one incidental directory.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill in `ki-agentic-harness`. From an installed copy, stop and redirect to the Harness. Revisit the standard when a new primary structure, inheritance rule, or mutually exclusive repository classification is introduced.
