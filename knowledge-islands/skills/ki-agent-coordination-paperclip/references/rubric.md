<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands coordination through Paperclip

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-agent-coordination-paperclip --write`.

Line-by-line criteria for auditing ki-agent-coordination-paperclip. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [COORD — KI–Paperclip coordination](#coord--kipaperclip-coordination)
- [ORG — Paperclip organisation identity](#org--paperclip-organisation-identity)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## COORD — KI–Paperclip coordination

→ [standard](standards-agent-coordination-paperclip.md)

Repository authority, identity separation, work linkage, workspace isolation, and evidence return.

- **COORD-1 [J] — Repository authority** — Paperclip coordinates execution without becoming durable KI knowledge or work authority. (standards-agent-coordination-paperclip.md#position-and-authority, standards-agent-coordination-paperclip.md#knowledge-boundary, standards-agent-coordination-paperclip.md#project-ownership-and-coordination-boundary)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does every admitted repository have one owning project, while a workspace-free Coordination project only coordinates and all repository work, knowledge, lifecycle and acceptance retain their owning repository boundary?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-2 [J] — Distinct execution identities** — Agent role, run or session, workspace, and worker remain distinct identities. (standards-agent-coordination-paperclip.md#identity-model)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the arrangement distinguish the durable agent role from each run or session, workspace, and worker?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-3 [J] — Task-to-work linkage** — Each Paperclip task has an unambiguous governing KI work relationship and independent lifecycle. (standards-agent-coordination-paperclip.md#task-to-work-relationship, ../../../change-management/ki-work-roadmap/references/standards-work-item-format.md#task-links, standards-agent-coordination-paperclip.md#delivery-ownership-and-local-integration, standards-agent-coordination-paperclip.md#refreshing-a-delivery-branch)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does each delivery name its authority, repository, current destination, baseline and owners; reconcile the governing item’s task_links with its task-side prose backlink; refresh a diverged candidate without unauthorised history rewriting; verify and independently review that result; and preserve the independent KI lifecycle without treating an association as a live claim or acceptance?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-4 [J] — Workspace isolation** — Implementation uses isolated workspaces; authorised integration and roadmap writes use separately serialised primary-checkout boundaries. (standards-agent-coordination-paperclip.md#workspace-model, standards-agent-coordination-paperclip.md#human-readable-workspace-names)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does implementation use an isolated workspace with a policy-compliant human-readable name and path, explicit baseline and consistent runtime binding, while integration and roadmap writes remain separately serialised?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-5 [J] — Direct interaction and control-plane boundary** — Direct sessions remain valid and Paperclip API mechanics stay with Paperclip’s own skill. (standards-agent-coordination-paperclip.md#interaction-and-skill-composition)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Can a human address an agent directly while control-plane operations remain governed by Paperclip’s official skill and existing authority?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-6 [J] — Evidence return** — Coordination, repository, KI lifecycle, and durable-learning evidence are reconciled explicitly. (standards-agent-coordination-paperclip.md#evidence-and-completion, standards-agent-coordination-paperclip.md#delivery-ownership-and-local-integration, standards-agent-coordination-paperclip.md#recovery-and-visibility)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does completed delivery prove the reviewed result reached its destination branch, with verification, independent KI lifecycle evidence and workspace disposition; and does branch-only completion hand off to a named owner on an open integration task?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-7 [J] — Delegated Git authority** — Paperclip projects task-branch publication and selected-agent review or integration authority owned by `ki-git`. (standards-agent-coordination-paperclip.md#workspace-model, standards-agent-coordination-paperclip.md#delivery-ownership-and-local-integration, standards-agent-coordination-paperclip.md#remote-delivery-prerequisite, ../../../governance/ki-git/references/standards-git.md#commit-publication-and-integration-authority)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the arrangement use only repository-granted Git authority, preserve still-valid approvals, require a reviewed remote-delivery policy before remote expansion, and keep a programme hold until explicit human resumption?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-8 [J] — Roadmap write locus** — Roadmap-record writes are serialised in the repository’s designated primary checkout rather than made in a task’s isolated worktree. (standards-agent-coordination-paperclip.md#roadmap-records-are-the-exception)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does every write to the repository’s roadmap records happen in its designated primary checkout rather than the task’s isolated worktree, and does the task’s evidence record both write boundaries?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **COORD-9 [J] — Workspace retirement** — Isolated workspaces end through Paperclip: the automatic sweep uses five gates, while warned early close requires explicit work disposition. (standards-agent-coordination-paperclip.md#workspace-retirement)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the automatic sweep apply its five gates and recorded cooldown, while a person-requested early close inspects close-readiness and requires explicit authority to disposition retained or uncertain work behind warnings? Are refused workspaces routed to a repository-owned decision rather than left as residue?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## ORG — Paperclip organisation identity

→ [standard](standards-agent-coordination-paperclip.md)

Each repository explicitly declares its owning Paperclip organisation code.

- **ORG-1 [M] — Required organisation code** — The skill declaration requires one stable uppercase organisation_code and no unknown keys. (standards-agent-coordination-paperclip.md#organisation-identity)
  - _Remediation:_ diagnostic — Set organisation_code to the repository’s owning Paperclip company code in .ki.toml.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
