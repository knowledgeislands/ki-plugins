---
name: ki-agora
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
description: >
  Governs portable reciprocal Agora membership between Knowledge Islands repositories. An Agora home declares its purpose, permitted local projection targets, and approved canonical repository members with their roles; a member independently consents by naming the same home and role. Use when defining, auditing, or conforming an Agora declaration, deciding whether a repository belongs to an Agora, or preparing local resolution and editor or client projections. ki-agora defines declarations only; ki owns local registry resolution and reciprocal observation, while a user-environment owner renders target-specific state.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# Knowledge Islands Agora membership

This governance skill defines the portable declaration of an **Agora**: a purposeful collection of independently governed repositories. Read [the Agora standard](references/standards-agora.md) before declaring one. [The generated rubric](references/rubric.md) publishes the mechanical criteria, and [the source list](references/sources.md) records the decision that grounds the contract.

## What this skill owns

1. **Agora homes** — a home repository declares a stable Agora identifier, human purpose, permitted target-policy categories, and its approved canonical repository members with their roles.
2. **Member consent** — a member repository independently declares each Agora identifier it joins, the canonical home repository, and the matching role. A repository may join more than one Agora.
3. **Portable boundary** — declarations use canonical HTTPS repository identities only. They contain no local path, installed-harness location, editor database, app setting, user name, or machine-specific state.
4. **Target policy** — a home can permit Zed or VS Code workspace projection and source-root trust for supported clients. An empty policy expressly permits no projection.
5. **Independent authority** — the home approves membership; every member consents for itself. This skill validates declaration shape only. `ki` resolves local registry identities and observes both sides before it reports reciprocal agreement; a user-environment owner renders the permitted target state.

## Operating modes

The skill carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. Invoked as `help` / `-h` / `?`, it emits generated HELP and stops. With no recognised mode, it emits the same HELP and, only in an interactive session, offers the mode choice and prompts for the target shown in `argument-hint`.

### Mode AUDIT

Run `ki repo audit --skill ki-agora --repo <repo>`. The structured catalogue validates the local canonical identity plus every declared home and membership entry. It does not search for peers, infer membership from an editor profile, or treat a local registry record as consent.

### Mode CONFORM

Run AUDIT first. `ki repo conform --skill ki-agora --repo <repo> --dry-run` may regenerate only this skill's readable rubric publication. It never creates an Agora, adds a member, changes peer configuration, resolves a path, or writes target-application state. Correct authored declarations locally, then re-run AUDIT.

### Mode EDUCATE

Run `ki repo educate --skill ki-agora --repo <repo>` to render the concern and rubric. Start with the repository's canonical `ki-repo.repository`, then declare a home or a membership in `.ki-config.toml` using the examples in the standard. EDUCATE grants neither membership nor local projection authority.

### Mode REFRESH

REFRESH writes only this skill's canonical files in `ki-agentic-harness`. When invoked from an installed copy, stop and redirect to the Harness. Reconcile the standard, structured catalogue, generated rubric, sources, and GDR-KI-HARNESS-006 when the portable contract changes; confirm before changing the authority boundary or target-policy vocabulary.

## Notes

- A local repository registry is the complete inventory of registered canonical KI repositories. It is not an Agora declaration and does not grant membership.
- A protected system-managed estate may later be derived from that registry. It is separate from named reciprocal Agoras, which are intentional subsets of that inventory.
- External source stores may appear in a local target alongside a Knowledge Base, but they are never Agora members merely because a client opens them.
