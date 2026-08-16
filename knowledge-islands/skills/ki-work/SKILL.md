---
name: ki-work
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
description: >
  Governs repository selection of a forward-work adapter and the shared lifecycle vocabulary used by change-management processes. Use when choosing or auditing a work tracker, configuring roadmap, KB Streams, GitHub Issues, or Linear change management, or mapping repository work to a common lifecycle. The selected adapter owns its records; use ki-work-roadmap, ki-repo-kb-streams, ki-work-github-issues, or ki-work-linear.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# KI change management

This governance skill selects one configured source of forward work; it never becomes a third tracker. The selected adapter owns record storage, identity allocation, and its local structural rules. Shared process skills use the adapter to locate a record, assess readiness, record delivery or review evidence, and apply an explicitly authorised close or prune selection.

Read [the change-management adapter standard](references/standards-change-management-adapters.md) before selecting an adapter or changing shared lifecycle behaviour. Read [the generated rubric](references/rubric.md) for its checkable contract, and [the sources](references/sources.md) when refreshing it.

## Shared model

`[skills.ki-work]` declares exactly one adapter and the matching adapter table is declared beside it. `roadmap` is the default for an ordinary Project repository; `kb-streams` is the default for a Knowledge Base; `github-issues` and `linear` are explicit alternatives. Resolution has no fallback: an absent, unknown, undeclared, or inapplicable declaration stops the process rather than guessing from a directory. This skill owns abstract lifecycle terms, while the owning adapter retains concrete status mapping, record storage, identity, and structural rules.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. Invoked as `help` / `-h` / `?`, it emits generated HELP and stops. With no recognised mode, it emits the same HELP and, only in an interactive session, offers the mode choice and prompts for the target shown in `argument-hint`.

### Mode AUDIT

Run `ki repo audit --skill ki-work --repo <repo>`. It verifies that the local table selects one supported, declared, applicable adapter mapping. Then run the resolved adapter's own audit; this selector neither interprets nor repairs adapter-specific configuration, and resolution alone is not an adapter audit.

### Mode CONFORM

Run `ki repo conform --skill ki-work --repo <repo> --dry-run`. CONFORM makes no selection, creates no tracker, and changes no work record. It never infers an adapter from repository shape; set the declaration deliberately, then audit the selected adapter.

### Mode EDUCATE

Run `ki repo educate --skill ki-work --repo <repo>` to render the adapter contract. Choose the Project or KB default only after confirming its primary structure; choose GitHub Issues or Linear only after confirming remote authority and the owning adapter configuration.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill under `ki-agentic-harness`. Invoked from an installed copy, stop and redirect to the Harness.

On the cadence in [the sources](references/sources.md), compare supported adapters and process-skill usage with [the adapter standard](references/standards-change-management-adapters.md). Add a new adapter only with an explicit mapping of its stable reference, lifecycle states, authority boundary, and close/prune semantics; record the normative change in the commit.
