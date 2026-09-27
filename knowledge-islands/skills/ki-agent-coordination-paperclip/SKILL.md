---
name: ki-agent-coordination-paperclip
ki-kind: governance
ki-applicability: declaration-only
ki-depends-on: [ki-git]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Govern how Paperclip coordinates agents around a Knowledge Island group or archipelago while repositories
  remain knowledge and work authority. Use when designing or auditing Paperclip agents, tasks, direct sessions,
  or execution workspaces for KI; not for Paperclip API mechanics.
argument-hint: 'audit <arrangement> | conform <arrangement> | educate <arrangement> | help | refresh'
---

# KI agent coordination — Paperclip

## Position

Paperclip is a coordination plane around Knowledge Islands, not their memory or governance authority. A KI repository and admitted revision remain the durable source for knowledge, work records, authority, and review evidence. Paperclip may schedule agents, hold operational task state, and bind execution workspaces without becoming the place where durable KI meaning lives.

This skill owns the relationship between those systems. Paperclip's own `paperclip` skill owns control-plane API mechanics, authentication, checkout, task updates, comments, and delegation. `ki-git` owns Git topology, commits, publication, review, and integration authority; this skill projects those rules into Paperclip coordination. Use `ki-subagents` when defining a portable agent role and the active `ki-work` adapter when changing a KI work record.

Each participating repository declares its owning company with required `organisation_code` in `[skills.ki-agent-coordination-paperclip]`; see the standard's [organisation identity](references/standards-agent-coordination-paperclip.md#organisation-identity). Agora membership alone does not select a company.

Read the [Paperclip coordination standard](references/standards-agent-coordination-paperclip.md) before designing or assessing an arrangement. Read the [generated rubric](references/rubric.md) for its review criteria and the [source record](references/sources.md) only when refreshing volatile Paperclip claims.

For runtime upgrades, local compatibility repairs, or renamed company and issue codes, resolve the host environment repository's Paperclip operations guide and repair inventory before acting. That owner keeps version-specific patches, installed-payload checks, live regression evidence and retirement decisions; instance snapshots remain runtime state. Preserve stable issue identity when repairing historical links, and follow the host's maintenance procedure so loading a repair does not silently interrupt coordinated work. This skill does not own installation commands or a machine-specific patch catalogue.

## Shared model

Give every repository in the company's admitted scope its own Paperclip project. A separate Coordination project has no repository execution workspace and only coordinates scope, dependencies, decisions and hand-offs. All repository work, including read-only inspection, audits, planning and review, belongs in the owning repository project; the same agent role may act in either context without transferring authority. Apply the standard's [project boundary](references/standards-agent-coordination-paperclip.md#project-ownership-and-coordination-boundary).

Every Paperclip implementation run that can mutate a repository uses a task-specific branch and isolated checkout under a Paperclip-owned root outside the repository and its Git directory. It may commit authorised work on that branch; pushing or integrating it requires separate authority.

Keep four identities distinct:

- an **agent role** is durable organisational identity and responsibility;
- a **run or session** is one execution continuity in an agent harness;
- a **workspace** is the filesystem and admitted baseline available to that run;
- a **worker** is the compute or process executing it.

Rita and Sue may both work on `tools-rig` and start from the same admitted revision. Each writing task gets its own worktree or equivalent isolated checkout, cut from a named commit, and a human's working copy is not one of them. Sharing the logical island does not require sharing one mutable directory.

Work records invert that: both of them write roadmap records in `tools-rig`'s designated primary checkout, because an identifier is reserved by a committed ledger advance and two isolated branches can each advance the same number. The [standard](references/standards-agent-coordination-paperclip.md#roadmap-records-are-the-exception) states the exception and cites the roadmap standard that owns the ordering.

Direct human-agent sessions remain valid. A directly addressed agent may use Paperclip's own skill to inspect assignments, create or update coordinated tasks, and return evidence. Paperclip is a shared coordination plane, not a mandatory conversational gateway.

A repository delivery has a named destination branch, reviewer and integration owner before implementation starts. Branch completion is a hand-off; delivery completion requires evidence in the destination branch. Local-only delivery may use isolated worktrees followed by authorised local integration without a pull request. Apply the standard's delivery and recovery contract; `ki-git` owns the integration grant and safe Git write boundary.

Local execution delivers into the human's designated primary checkout on local `main`, including its working files. A task branch, another clone's `main` and a published remote ref are different destinations. Name the destination host and checkout explicitly.

Use a human-readable company and repository path, preferring the governing roadmap code first in each worktree name and the Paperclip task key as a collision suffix. Apply the standard's supported-field fallback where automatic provisioning cannot render the roadmap code. Preserve existing bindings until a verified migration can update Git and Paperclip together.

Before moving delivery to a remote worker, prove the local delivery cycle, review what the coordination platform already provides, and agree a repository-owned remote-delivery policy. The [remote delivery prerequisite](references/standards-agent-coordination-paperclip.md#remote-delivery-prerequisite) defines the decision boundary without choosing a remote architecture. A programme put on hold stays held until the human explicitly resumes it.

## Operating modes

Before reviewing a candidate for integration, reconcile it with current destination `main`. Refresh a diverged delivery branch in its isolated worktree, normally by merging `main`; rebase only with explicit history-rewrite authority. Verify and independently review the refreshed result. This delivery gate does not authorise bulk branch updates, replay superseded work or lift a programme hold; apply the standard's [branch refresh boundary](references/standards-agent-coordination-paperclip.md#refreshing-a-delivery-branch).

This governance skill carries **AUDIT · CONFORM · EDUCATE · REFRESH**. `help` / `-h` / `?` explains the skill, invocation, modes, and off-ramps, then stops. With no clear mode, provide the same explanation and only in an interactive session ask which mode and arrangement to use.

### Mode AUDIT

→ Read [the AUDIT procedure](references/mode-audit.md) for the `.ki.toml` declaration precondition and the host invocation from inside a Paperclip run.

Run `ki repo audit --skill ki-agent-coordination-paperclip --repo <repo>` when the repository declares this capability. Every COORD item is a judgment criterion, so a mechanical `PASS` proves resolution, not conformance. Apply the judgment criteria in the generated rubric to the supplied Paperclip company, agent, task, workspace, and KI evidence. Report repository facts separately from remote Paperclip facts; an unavailable remote view is unknown, not a pass.

### Mode CONFORM

Bring an explicitly scoped coordination design or local declaration into line with the standard. Preserve repository authority, repair task-to-work links, separate concurrent mutable workspaces, and identify evidence that must return to the island. Use Paperclip's own skill for authorised remote changes; this skill never treats an assignment as permission to mutate a repository, push, merge, deploy, or accept KI work.

### Mode EDUCATE

For an existing set of repositories, follow the [existing-estate onboarding guide](references/standards-existing-estate-onboarding.md) after the coordination standard. It stages inventory, one project per repository, task and work reconciliation, and a verified local delivery pilot without itself granting provisioning or agent resumption.

Explain or draft the smallest arrangement that preserves the shared model. Start with one company or group, named repository identities, agent roles, task-to-work locators, workspace isolation, and evidence return. Do not provision a company, invent remote identifiers, or require every conversation to pass through Paperclip.

### Mode REFRESH

**Precondition:** REFRESH writes only this canonical skill in `ki-agentic-harness`. From an installed copy, stop and redirect to the Harness.

On the cadence in the [source record](references/sources.md), re-read Paperclip's official skill and documentation for task, workspace, chat, identity, and authority changes. Update only the Paperclip-facing delta; KI repository authority and lifecycle semantics remain with their owning KI skills.
