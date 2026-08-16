---
name: ki-work-linear
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
description: >
  Defines the configuration and safety guidance for Linear as a Knowledge Islands change-management adapter: mutable team-scoped locators, workflow metadata, review, closure, archive/delete semantics, and remote-write authority. Use when a repository configures Linear as its tracker or needs guidance for a future authorised remote operation. Remote process execution fails closed pending KI-HARNESS-FND-014. For local files use ki-work-roadmap; for GitHub use ki-work-github-issues.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI Linear change management

This skill configures and explains one Linear team's Issues as a future forward-work adapter. It does not mirror Issues to a local tracker, resolve remote work for a process, or make remote writes. Until `KI-HARNESS-FND-014` delivers selected-adapter resolution and authorised remote execution, a shared process selecting this adapter stops rather than guessing a local path or Linear operation.

`ENG-123` is a **current team-scoped locator**, not durable cross-team identity. A team move creates a new identifier and URL; retain the old locator as historical alias evidence and re-resolve the current locator, team, workflow mapping, and affected fields before any future operation. No UUID persistence claim is made without official evidence.

Read [the Linear adapter standard](references/standards-linear.md) before configuring or operating the adapter. Read [the generated rubric](references/rubric.md) for its checkable configuration contract.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. `help` / `-h` / `?` describes the adapter and stops.

### Mode AUDIT

Run `ki repo audit --skill ki-work-linear --repo <repo>`. It verifies the declared team locator, required lifecycle mapping, and rejects undeclared keys. It cannot confirm remote team identity, current issue locator, workflow configuration, permissions, or field preservation after a move; AUDIT never calls Linear.

### Mode CONFORM

Run `ki repo conform --skill ki-work-linear --repo <repo> --dry-run`. It has no remote operation and proposes no remote mutation. It never creates, edits, moves, closes, archives, or deletes a Linear Issue.

### Mode EDUCATE

Explain the configuration, workflow mapping, mutable-locator migration stop, archive/delete semantics, and no-remote-execution boundary. Do not route a shared process through Linear until `KI-HARNESS-FND-014` supplies the authorised resolver and executor.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill in `ki-agentic-harness`. From an installed copy, stop and redirect to the Harness. Re-fetch every primary source in [the source record](references/sources.md) when Linear changes team locators, move, workflow, archive/delete, permissions, or API semantics, or when the common lifecycle gains a state that cannot be mapped without ambiguity.
