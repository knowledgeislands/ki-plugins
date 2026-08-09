---
name: ki-change-management-github-issues
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
description: >
  Defines GitHub Issues as a Knowledge Islands change-management adapter, mapping GitHub issue identity, labels, review, closure, and explicit remote-write authority to the shared lifecycle. Use when a repository tracks work in GitHub Issues, configures its GitHub issue repository, or maps ki-next, ki-plan, ki-implement, and ki-accept to issues. For local files use ki-change-management-roadmap; for Linear use ki-change-management-linear.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI GitHub Issues change management

This skill maps one GitHub repository's Issues to the shared forward-work lifecycle. It does not mirror Issues into a local roadmap or make remote writes without the user's explicit authority. The stable record reference is `<owner>/<repository>#<number>`; GitHub allocates the number and it is never reused.

Read [the GitHub Issues adapter standard](references/standards-github-issues.md) before configuring or operating the adapter. Read [the generated rubric](references/rubric.md) for the checkable configuration contract.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. `help` / `-h` / `?` describes the adapter and stops.

### Mode AUDIT

Run `ki repo audit --skill ki-change-management-github-issues --repo <repo>`. It verifies the declared GitHub repository and rejects undeclared keys. Confirm authentication and remote access separately; AUDIT never calls GitHub.

### Mode CONFORM

Run `ki repo conform --skill ki-change-management-github-issues --repo <repo> --dry-run`. It may normalise a declared local configuration only. It never creates, edits, closes, or labels a remote issue.

### Mode EDUCATE

Explain the lifecycle mapping and required remote-write confirmation. Use the GitHub CLI or a connected GitHub capability only after confirming the exact issue references and intended write set.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill in `ki-agentic-harness`. From an installed copy, stop and redirect to the Harness. Refresh the adapter contract when GitHub changes its issue or label semantics, or when the common lifecycle gains a state that cannot be mapped without ambiguity.
