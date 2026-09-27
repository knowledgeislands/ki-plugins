# Paperclip coordination standard

## Contents

- [Position and authority](#position-and-authority)
- [Organisation identity](#organisation-identity)
- [Project ownership and coordination boundary](#project-ownership-and-coordination-boundary)
- [Identity model](#identity-model)
- [Knowledge boundary](#knowledge-boundary)
- [Task-to-work relationship](#task-to-work-relationship)
- [Delivery ownership and local integration](#delivery-ownership-and-local-integration)
- [Remote delivery prerequisite](#remote-delivery-prerequisite)
- [Recovery and visibility](#recovery-and-visibility)
- [Workspace model](#workspace-model)
- [Interaction and skill composition](#interaction-and-skill-composition)
- [Evidence and completion](#evidence-and-completion)

## Position and authority

Paperclip coordinates execution around a Knowledge Island group or archipelago. It may own agent scheduling, operational tasks, run state, and execution-workspace bindings. It does not own the durable knowledge, repository history, KI work lifecycle, acceptance decision, or authority envelope those tasks act within.

A Paperclip assignment grants coordination context, not repository authority. Every mutation still needs the authority already carried by the governing KI work, direct user instruction, and repository rules. A Paperclip status transition cannot push, merge, deploy, accept, close, or prune KI work by implication.

## Organisation identity

Every repository using this skill declares its owning Paperclip company code in its own `.ki.toml`:

```toml
[skills.ki-agent-coordination-paperclip]
organisation_code = "KIS"
```

`organisation_code` is required, non-empty, and uppercase letters or digits beginning with a letter; `ER` is valid. No other keys are recognised in this skill's table. The value identifies the company that owns this repository's Paperclip project, not the repository's `repo_code`, an Agora identifier, or necessarily Paperclip's current issue prefix. A repository may join several Agoras but still declares one owning company code; Agora membership never silently assigns or changes it. Reconcile a company rename or ownership transfer explicitly against existing project and task bindings before changing the declaration.

## Project ownership and coordination boundary

Every repository admitted to a company's scope has exactly one active repository project, including repositories with no current delivery or with work on hold. Name and bind that project to the repository's canonical identity and designated primary checkout. Multiple task worktrees or workspace records do not create additional repository projects. Check existing and archived bindings before creating a project so renamed repositories and aliases do not produce duplicates; preserve historical task links.

A separate Coordination project is workspace-free and only coordinates company-wide scope, sequencing, dependencies, decisions, hand-offs and consolidated evidence links. It performs no repository work: inspection, audits, repository-specific planning, review, implementation, roadmap writes and integration all belong to tasks in the owning repository project. Read-only work is not an exception. Coordination may inspect control-plane metadata and synthesise returned repository evidence, but may not adopt a repository checkout as an execution workspace.

Cross-repository work has a coordination parent and separately scoped repository tasks. Reuse existing tasks where their scope fits; a coordination plan is not a second backlog. Each repository task returns evidence and a next owner to the coordination parent without transferring repository authority or acceptance. When a repository project is missing, establish its identity before dispatching repository work; do not use Coordination as a temporary execution project.

Project ownership and agent roles are distinct. The same role may coordinate in Coordination and perform separately authorised work in a repository project, but it must use the appropriate task and project context for each. Creating a project or assigning its lead does not authorise implementation, integration, publication, agent resumption or lifting a hold. Direct human-agent sessions remain valid; when their work is coordinated through Paperclip, its repository execution evidence belongs in the owning repository project.

## Identity model

Keep these identities separate because they change on different cadences:

- **Agent role** — durable responsibility, selection purpose, and organisational relationship.
- **Run or session** — one bounded execution continuity in a harness.
- **Workspace** — the filesystem view and admitted repository baseline for a task.
- **Worker** — the compute process, VM, container, or host executing a run.

Do not equate an agent with a thread, process, VM, or checkout. A role can have many runs; a run uses a workspace; a worker can host different runs. Replacing any one does not silently replace the others.

## Knowledge boundary

The repository is the durable knowledge source. Paperclip task descriptions, comments, plans, and agent memory are operational context or caches. They may point to repository knowledge and carry short-lived coordination detail, but any decision, learning, specification, or evidence that must survive the task returns to its correct repository-owned artifact.

Ground a run in an explicit repository identity and admitted revision before work begins. If the task depends on a KI context, authority, or work record, resolve that source rather than copying an unversioned paraphrase into an agent prompt.

## Task-to-work relationship

The governing KI work item's own [`task_links`](../../../change-management/ki-work-roadmap/references/standards-work-item-format.md#task-links) is the durable structured association with Paperclip and other task systems. Record a Paperclip delivery task's ordinary-prose backlink near the top of its description: repository identity, governing KI item identifier, admitted repository revision, and task purpose. Do not invent a Paperclip custom field or maintain a shared writable lookup table. One KI item may cite several tasks; one delivery task has at most one governing KI item, although other items may cite it as related context. Reconcile a missing or conflicting backlink against the item's map and repository evidence before assigning or releasing work. An association alone is neither a live claim, KI acceptance, nor proof that a paused or completed task leaves work available.

A Paperclip task may execute all or part of one governing KI work item. Record a durable locator comprising the repository identity, KI work identifier, admitted revision, and task purpose wherever the active Paperclip task model can preserve it without inventing unsupported fields.

One KI work item may fan out into several Paperclip tasks. One Paperclip task has at most one governing KI work item; related items remain links or context so authority and closure do not become ambiguous.

Paperclip and KI lifecycle states remain independent:

- Paperclip `done` means the coordinated execution task ended; it does not accept the KI work item.
- KI acceptance requires its normal human review and evidence gate.
- Newly discovered substantive work is captured through the active KI work adapter, normally as unadopted Triage, rather than hidden in a task comment.
- Paperclip may show a task blocked or awaiting review without rewriting the KI record unless an authorised KI lifecycle action occurs.

## Delivery ownership and local integration

Before implementation, name the repository, governing work or explicit direct authority, admitted baseline, destination branch, implementer, reviewer, integration owner and required checks. The coordinator owns the hand-offs through integration; assigning an implementer does not discharge that responsibility. Reuse the existing KI record and Paperclip task relationship rather than opening a second delivery tracker.

A repository may choose local-only delivery: implementation in an isolated task worktree, independent review of the exact commit, then integration into local `main` under a repository-owned grant. A remote push or pull request is not a prerequisite. `ki-git` owns the grant, merge method, authorship separation and serialised destination write; this standard neither grants integration nor requires another approval for an action already covered by that grant.

The implementation task may finish at a reviewed branch only when an explicitly linked, open integration task has a named owner and the overall delivery remains open. Otherwise the delivery task remains awaiting review or integration. A delivery whose promised result is a repository change is not complete until the reviewed result is reachable from its destination branch, or the responsible authority explicitly dispositions it without integration. KI acceptance remains independent.

Baseline movement requires revalidation, not automatic cancellation of approval. Preserve an existing approval when its scope, authority, review evidence and risk still apply; record the new baseline and verification. A changed diff invalidates review of the previous diff. Scope expansion, conflicting ownership, identifier collisions or a materially changed risk require a concrete escalation stating what changed and which decision remains.

Execution location and delivery destination are separate. In laptop-local operation, the designated primary checkout on the human's laptop is the live destination: delivery updates both its local `main` and the working files the human uses. Record the destination host and checkout as well as the repository and branch, following `ki-git`.

A remote worker may have its own clone, worktrees and `main`. Its local merge does not establish delivery to the human's designated checkout, and publishing to a Git remote does not establish that either. A future remote arrangement must explicitly name its destination and evidence-return path; the current local workflow does not preselect that design or grant remote publication authority.

### Refreshing a delivery branch

Before final review and integration, identify the exact candidate and current destination commits and check ancestry, patch equivalence and retained value. Already-delivered, duplicate, superseded, uncertain or held work must be dispositioned before refresh; a blanket request to bring branches up to date is not permission to replay every retained branch or lift a hold.

For an authorised candidate that diverges from current destination `main`, the implementer refreshes the delivery branch in its isolated worktree, normally by merging that exact `main` commit into it. No extra merge is needed when the candidate already contains current `main`. Record the original branch tip and baseline before changing them, and preserve a recoverable reference to any history a rebase would replace. Rebase requires explicit history-rewrite authority and must not rewrite shared history or imply a force push. Stop on dirty or contested files; do not reset, stash or overwrite another actor's work to make refresh proceed.

Refresh is repository work, not a Coordination-project operation. The implementer resolves conflicts only within the authorised scope; identifier collisions or changed meaning require escalation, not mechanical conflict acceptance. Run required checks on the combined result and obtain independent review of the exact refreshed candidate. Prior review of an older diff is not approval of a changed one.

The integrator rechecks destination `main` in the serialised write window. If it advanced after review, revalidate the proposed combined result; a clean combination preserving the reviewed change need not require fresh scope approval, but conflict resolution or another changed candidate returns to verification and independent review. Record the source, admitted destination and resulting destination commits. Passing this gate does not grant integration authority or KI acceptance.

## Remote delivery prerequisite

Before moving a local arrangement to remote implementation or delivery, demonstrate the local review, integration, evidence-return and retirement cycle. Review the lessons and which responsibilities the coordination platform already fulfils before deciding what additional execution infrastructure remains necessary.

The owning repositories must agree a remote-delivery policy before remote implementation begins. It identifies the authoritative destination host, checkout and branch; how reviewed work reaches it and becomes visible to the human; the owners of review, integration, synchronisation and conflict recovery; and any separate publication authority. A worker's own `main` is not automatically that destination. This prerequisite requires a policy decision, not a speculative remote architecture.

A human-requested programme hold preserves existing commits, uncommitted files and work records. Record the reason, retained results, resume prerequisites and next owner without cancelling or accepting the work. Reaching the prerequisites does not automatically lift the hold: the human decides whether to resume, reshape or retire the work in light of the local evidence.

## Recovery and visibility

When branch output has accumulated, bound new implementation and inventory existing work before expanding concurrency. Classify each result as awaiting review, awaiting integration, integrated, superseded or explicitly abandoned, with its repository, task, branch or commit, destination and next owner. Compare both commit reachability and patch equivalence; neither an old task state nor a missing workspace proves that work is disposable. Inventory evidence belongs with the existing work, not a parallel backlog.

Prove one bounded delivery through review, local integration, evidence reconciliation and safe workspace retirement before increasing concurrency. Admit a current baseline at dispatch and record it for that delivery; an old company-wide pin is not evidence that a new task starts from current repository state. Serialise integration and roadmap writes per repository, independently of per-agent concurrency limits.

Present outcomes to the human as changes delivered to the destination branch, results awaiting integration and decisions needed. Each completed delivery names the resulting destination commit, verification and review evidence, independent KI lifecycle state, and workspace retirement or its explicit remaining blocker. Agent activity and branch commits alone are not delivered outcomes.

## Workspace model

Runs operating on the same island may share repository identity and baseline while using different physical workspaces. Concurrent mutating tasks use separate worktrees, clones, or equivalent isolated writable checkouts. A shared mutable checkout is acceptable only when mutation is serialised explicitly; read-only inspection may share a filesystem view.

An implementation run that will write to a repository works in its own isolated checkout — normally a linked worktree on its own branch, cut from a named commit — whether or not another run happens to be active. Isolation is a standing property of a writing run, not a precaution taken when concurrency is observed, because a run cannot see the runs that start after it. A human's working copy is never an implementation run's working directory: a person must be able to read, build, and edit their own checkout without an agent changing files underneath them. Authorised integration and roadmap writes are bounded exceptions governed below and by `ki-git`; they do not permit implementation in the primary checkout.

Paperclip worktrees use an explicit Paperclip-owned root outside the repository's working tree and outside its Git common directory. The root is outside estate discovery and includes enough company, project or repository, and task identity to prevent collisions. Do not use Paperclip's repository-local default, an ad hoc workspace sibling, or `.git/paperclip-worktrees` for working files.

A writing run may commit verified work to its task branch when the governing KI work or direct instruction authorises that mutation. It does not push or integrate that branch into the primary branch unless explicit current-user or standing repository authority separately grants that action. Paperclip assignment, agent autonomy, and a `done` task state grant none of commit, push, merge, deployment, or KI acceptance by themselves.

A repository's ordinary Paperclip workflow may project the bounded task-branch publication authority defined by `ki-git`: non-force push of only the recorded task branch and creation or update of its draft pull request. It projects no primary-branch, tag, release, deployment, remote-branch deletion, approval, merge, or auto-merge authority.

Selected Paperclip agents may receive the independently scoped review or integration capabilities defined by `ki-git`. Paperclip may enforce or project a repository-owned grant, but assignment, role title, credentials, broad autonomy, and a `done` task state do not originate or widen it. An integration agent acts only within that grant and does not treat local or remote integration as KI acceptance.

Record enough workspace evidence to reproduce what the task saw: repository, baseline revision, local branch or worktree identity when applicable, and any uncommitted starting state admitted into scope. Never infer a clean or current checkout from the agent name.

### Human-readable workspace names

Use human-readable company and repository components beneath the runtime-owned root. A delivery worktree name starts with its governing KI work identifier, with the Paperclip task key only where needed to distinguish subtasks or attempts. For example, `knowledge-islands/ki-agentic-harness/ki-harness-gov-104-KIS-36` exposes both identities without a full task title or date namespace. Case-normalised path components retain an exact link to the canonical work identifier in task evidence.

UUIDs may remain internal identities; they are not the default human-facing worktree name. For explicitly authorised work without a governing KI item, use its readable Paperclip task key rather than inventing a roadmap identifier. Resolve the name using supported provisioning fields; do not invent a roadmap template variable the runtime cannot render. Where automatic provisioning can only render the Paperclip key, use that short fallback and record the governing KI identifier in task evidence until code-first provisioning is supported.

A naming-policy change applies to new workspaces. Existing workspaces keep their current branch, path and execution-workspace binding until a scoped migration verifies retained content and updates Git and Paperclip consistently. Never rename a directory or branch alone, break a restart path, or discard work merely to conform its name.

### Roadmap records are the exception

Work records are the deliberate exception to isolation. Every write to a repository's roadmap records — capture, shaping, a lifecycle transition, acceptance, or a prune — is made in that repository's designated primary checkout, never in a task's isolated worktree.

Isolation and serialisation protect different things. Isolation keeps two deliveries from corrupting each other's working files. Serialisation keeps two runs from allocating the same work-item identifier, which isolation actively defeats: two worktrees that each advance the issue ledger on their own branch both believe they hold the number, and the collision surfaces at the merge rather than at the allocation. The [roadmap standard](../../../change-management/ki-work-roadmap/references/standards-repository-roadmaps.md#roadmap-write-locus) requires exactly one designated writing checkout per repository and owns the committed-advance-before-record ordering; this standard names the primary checkout as that designation for coordinated runs.

A coordinated run therefore crosses back to the primary checkout to take its number and write its record, and returns to its own worktree for delivery. Those are two write boundaries in two checkouts by design, and the task's evidence records both.

## Workspace retirement

An isolated workspace ends through Paperclip's own retirement mechanism and through nothing else. No agent removes a worktree, deletes a branch Paperclip created, or deletes a workspace directory by hand. Paperclip supports an automatic terminal sweep and a person-requested early close; both record the outcome and use guarded cleanup. Hand-removal records nothing and leaves an active workspace record pointing at a path that no longer exists.

The automatic terminal sweep destroys only the artefacts it created, and only when every gate passes:

1. the source task and every task in its subtree are terminal;
2. the working tree is clean, counting untracked entries as dirty;
3. the branch is merged into its base, where neither an unmerged nor an unknown delivery state qualifies;
4. no queued or running run holds the workspace or the source task;
5. the configured cooldown since the most recent terminal transition in the task tree has elapsed.

A person-requested early close has a different readiness decision, not these five automatic gates. Paperclip blocks it when Git status cannot be verified or an isolated workspace remains linked to open tasks; dirty or untracked files and unmerged, ahead, or behind branch state are warnings rather than automatic blockers. The person must inspect the individual workspace's close-readiness assessment and planned cleanup, and explicitly disposition any retained or uncertain work before authorising a warned close. A warning is not permission to discard work, and an agent must not turn early close into a way around a delivery hold or review and integration gate.

A workspace still on disk is therefore not evidence of a leak. A held workspace is the mechanism declining to destroy unlanded work, which is the behaviour this rule wants. An arrangement records the cooldown it is configured with, including a cooldown of zero, where automatic retirement follows immediately once the other four gates pass; an unrecorded cooldown cannot be audited.

A workspace held past its cooldown by a gate that can never pass is neither debris nor the mechanism's problem to solve. It is unlanded work nobody has been asked about, so it is raised as a Triage item in the repository that owns the checkout and decided there: land it, discard it, or record it as a duplicate of work already landed. A detached `HEAD` is the clearest case, because no branch state can satisfy the merge gate.

Read early-close readiness from Paperclip's close-readiness assessment for the individual workspace. A delivery state carried in a workspace list is not evidence, because it may be an unpopulated default rather than a reading.

## Interaction and skill composition

Humans may speak directly to an agent. Direct conversation does not bypass governance: the agent uses this skill to preserve the KI relationship and Paperclip's own skill for control-plane operations. Paperclip remains optional for a conversation and authoritative for the coordination state it actually owns.

This skill does not duplicate Paperclip endpoints, authentication, heartbeat procedures, or task mutation rules. It also does not redefine portable agent roles or KI tracker semantics. Route those concerns to Paperclip's official skill, `ki-subagents`, and the selected `ki-work` adapter respectively.

## Evidence and completion

Before reporting coordinated work complete, apply the delivery completion rule above and reconcile four evidence classes:

- Paperclip task outcome and relevant thread or plan context;
- repository diff, commit, test, and review evidence;
- the governing KI work record and its independent lifecycle state;
- durable learning or decisions promoted to the repository that owns them.

If any class is unavailable, report it as unavailable. Never convert absence of remote access, an agent's recollection, or a task status into evidence that the repository accepted the result.
