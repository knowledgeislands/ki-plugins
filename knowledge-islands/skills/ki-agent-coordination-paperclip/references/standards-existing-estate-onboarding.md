# Onboard an existing repository estate into Paperclip

This is a staged guide for an existing Knowledge Islands group, not permission to start agents or migrate repositories. Apply the [coordination standard](standards-agent-coordination-paperclip.md) for authority and the `ki-git` skill for Git grants. Use Paperclip's own skill for current project, task, workspace, and API mechanics. Keep the first pass local unless the repositories already have an approved remote-delivery policy.

## 1. Inventory before provisioning

For each repository, identify its canonical repository identity, current name and aliases, designated primary checkout, destination branch and host, active work adapter, held programmes, and the owner who can approve review and integration. Read the repository's work records and Git state; do not infer the backlog from Paperclip tasks alone. Separately list existing Paperclip companies, projects, tasks, agents, execution workspaces, and their repository bindings. Check archived projects and renamed issue keys before creating anything: a name change must not make a second project or orphan historical links.

Classify each retained branch or workspace as integrated, awaiting review, awaiting integration, superseded, held, or uncertain. Record exact commits, dirty or untracked content, task identity, and next owner. An old `done` task, a clean worktree, or absence of a task link is not proof that repository work is delivered or available. Preserve uncertain work until its owning repository dispositions it.

## 2. Establish ownership boundaries

Register `ki-agent-coordination-paperclip` in every admitted repository's `.ki.toml` with its required `organisation_code` before relying on that repository's company binding.

Use one Paperclip company for the intended KI group. Give every admitted repository exactly one active repository project, including repositories with no current delivery or with work on hold. Bind the project to the canonical repository identity and designated primary checkout. Reconcile an existing project rather than creating a replacement solely because its display name or issue code changed. Project colour and icon help navigation; they are not authority signals.

Keep a separate workspace-free Coordination project for company-wide sequencing, dependencies, decisions, hand-offs, and consolidated evidence. It never performs repository work, including read-only inspection or planning of one repository. Put every repository-specific task in that repository's project. A cross-repository effort may have a Coordination parent, with separately scoped tasks in each owning repository project. Do not treat project creation or assignment of a lead as permission to implement, integrate, publish, resume an agent, or lift a programme hold.

Map agent roles to responsibilities after project ownership is clear. A role may coordinate on one task and perform separately authorised repository work on another; role, run, workspace, and worker remain different identities. Keep agents paused while reconciling an inherited queue unless a bounded run has its own current authority.

## 3. Reconcile work and task identities

For each existing task, decide whether it governs one KI work item, merely relates to several items, or has no repository delivery role. Put verified provider-qualified associations in each owning item's [`task_links`](../../../change-management/ki-work-roadmap/references/standards-work-item-format.md#task-links), written through that repository's designated primary checkout. A delivery task has at most one governing item; one item may have several tasks, and related links may cross items. Near the top of a Paperclip delivery task's ordinary description, name the canonical repository, governing item, admitted revision, and bounded purpose. Do not invent a custom Paperclip field or shared writable lookup table.

Keep task lifecycle and KI lifecycle separate. A link preserves association history; it is not a live claim, available-work signal, or KI acceptance. Resolve a conflicting or missing backlink against the item, task, retained worktree, and repository evidence before assigning work. Capture new substantive work through the repository's normal work adapter, normally unadopted Triage, rather than growing a second Paperclip backlog.

## 4. Prove one local delivery path

Choose one bounded, already-authorised repository item with a reviewable retained result. Name the destination as the human's designated primary checkout and local `main`, plus implementer, independent reviewer, integration owner, baseline, and checks. Keep implementation in a task-specific isolated worktree under a Paperclip-owned root outside the repository, its `.git` directory, and estate-discovery roots. Prefer a readable worktree name beginning with the KI item identifier and, where needed, the Paperclip task key. Do not rename existing bound worktrees just for appearance; migrate them only with verified Git and Paperclip binding preservation.

Before integration, compare the candidate with current destination `main` for ancestry, patch equivalence, and retained value. Do not blanket-rebase all old branches. Refresh an authorised diverged candidate in its isolated worktree, normally by merging exact current `main`; rebase needs separate history-rewrite authority. Re-run checks and independent review on the resulting commit. Integrate under the repository's Git grant in a serialised primary-checkout window. The human should then see the change on local `main`. No remote push or pull request is required for this local path, and neither Paperclip `done` nor a merged branch accepts the KI work item.

Return the destination commit, review and verification evidence, independent KI item state, and workspace disposition to the repository project and any Coordination parent. Let Paperclip retire its own workspaces only after its close-readiness rules and retained-work decisions are satisfied; do not remove its worktrees or branches by hand. A cooldown or refused retirement can be correct evidence of work still held.

## 5. Expand only from evidence

Review the pilot with the human: what reached local `main`, what remains in review or integration, what decisions are still needed, and which old tasks or workspaces remain held. Reconcile stale decision cards against repository decisions; close or refresh only the exact cards whose authority and current need are established. Reallocate misplaced repository tasks to their owning projects without changing their work authority. Finish retained work before starting more concurrency, and keep any separately held programme held until the human explicitly resumes it.

Repeat the proven path repository by repository, serialising each repository's roadmap and integration writes. Before any move to remote workers, agree a repository-owned [remote-delivery policy](standards-agent-coordination-paperclip.md#remote-delivery-prerequisite) identifying the authoritative destination host and checkout, evidence-return path, review and integration owners, synchronisation and conflict recovery, and publication authority. A worker's remote `main` is not the human's local live `main` by default.

The onboarding pass is complete only when each admitted repository has one unambiguous project and primary-checkout destination; existing tasks and retained work have an owner or explicit hold; at least one bounded local delivery has been independently reviewed and reached its destination; task/item associations are reconciled without false live claims; and remaining decisions and workspace dispositions are visible to the human. This does not require clearing every backlog item or resuming every agent.
