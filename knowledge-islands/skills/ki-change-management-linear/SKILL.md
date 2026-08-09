---
name: ki-change-management-linear
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
description: >
  Defines Linear as a Knowledge Islands change-management adapter, mapping team-scoped issue identity, workflow state, review, closure, and explicit remote-write authority to the shared lifecycle. Use when a repository tracks work in Linear, configures its Linear team, or maps ki-next, ki-plan, ki-implement, and ki-accept to Linear issues. For local files use ki-change-management-roadmap; for GitHub use ki-change-management-github-issues.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI Linear change management

This skill maps one Linear team's Issues to the shared forward-work lifecycle. It never mirrors issues to a local tracker or writes remotely without the user's explicit authority. The stable record reference is Linear's team-scoped identifier, such as `ENG-123`; Linear allocates the numeric portion and it is never reused.

Read [the Linear adapter standard](references/standards-linear.md) before configuring or operating the adapter. Read [the generated rubric](references/rubric.md) for its checkable configuration contract.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. `help` / `-h` / `?` describes the adapter and stops.

### Mode AUDIT

Run `ki repo audit --skill ki-change-management-linear --repo <repo>`. It verifies the declared Linear team and rejects undeclared keys. AUDIT does not contact Linear.

### Mode CONFORM

Run `ki repo conform --skill ki-change-management-linear --repo <repo> --dry-run`. It may normalise a declared local configuration only. It never creates, edits, moves, or closes a Linear issue.

### Mode EDUCATE

Explain the lifecycle mapping and require confirmation of the exact remote write set before using a connected Linear capability.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill in `ki-agentic-harness`. From an installed copy, stop and redirect to the Harness. Refresh the adapter contract when Linear changes identifiers or workflow semantics, or when the common lifecycle gains a state that cannot be mapped without ambiguity.
