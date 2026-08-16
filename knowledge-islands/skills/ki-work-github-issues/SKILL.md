---
name: ki-work-github-issues
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
description: >
  Defines the configuration and safety guidance for GitHub Issues as a Knowledge Islands change-management adapter: mutable issue locators, lifecycle metadata, review, closure, hierarchy, dependencies, and remote-write authority. Use when a repository configures GitHub Issues as its tracker or needs guidance for a future authorised remote operation. Remote process execution fails closed pending KI-HARNESS-FND-014. For local files use ki-work-roadmap; for Linear use ki-work-linear.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI GitHub Issues change management

This skill configures and explains one GitHub repository's Issues as a future forward-work adapter. It does not mirror Issues into a local roadmap, resolve remote work for a process, or make remote writes. Until `KI-HARNESS-FND-014` delivers selected-adapter resolution and authorised remote execution, a shared process selecting this adapter stops rather than guessing a local path or GitHub operation.

`<owner>/<repository>#<number>` is the **current mutable locator**, not durable cross-transfer identity. GitHub can transfer an open Issue, changing its repository namespace and potentially its number; retain the prior locator as historical alias evidence and re-resolve the current locator before any future operation.

Read [the GitHub Issues adapter standard](references/standards-github-issues.md) before configuring or operating the adapter. Read [the generated rubric](references/rubric.md) for the checkable configuration contract.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. `help` / `-h` / `?` describes the adapter and stops.

### Mode AUDIT

Run `ki repo audit --skill ki-work-github-issues --repo <repo>`. It verifies the declared GitHub repository, required lifecycle metadata mapping, and rejects undeclared keys. It cannot confirm remote authentication, repository access, Issue-versus-pull-request filtering, current locators, or remote metadata; AUDIT never calls GitHub.

### Mode CONFORM

Run `ki repo conform --skill ki-work-github-issues --repo <repo> --dry-run`. It has no remote operation and proposes no remote mutation. It never creates, edits, closes, labels, transfers, archives, or deletes an Issue.

### Mode EDUCATE

Explain the configuration, lifecycle metadata mapping, mutable-locator migration stop, and no-remote-execution boundary. Do not route a shared process through GitHub until `KI-HARNESS-FND-014` supplies the authorised resolver and executor.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill in `ki-agentic-harness`. From an installed copy, stop and redirect to the Harness. Re-fetch every primary source in [the source record](references/sources.md) when GitHub changes Issue identity, transfer, fields, hierarchy, dependency, closure, permissions, or API semantics, or when the common lifecycle gains a state that cannot be mapped without ambiguity.
