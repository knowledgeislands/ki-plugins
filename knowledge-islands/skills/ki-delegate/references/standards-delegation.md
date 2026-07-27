# Delegation standard

_On-demand procedure for `ki-delegate`. The kind, scope, and leg summary live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the full procedure._

Throughout, **`(CC)`** marks a mechanism specific to the Claude Code runtime. The method itself — prepare a delegation-ready brief, then classify, assign, sequence, and gate — is runtime-neutral; only the spawning mechanics are `(CC)`. A different runtime substitutes its own spawn primitive at those points and the method is unchanged. This mirrors the SPEC/CC tagging discipline `ki-skills` applies to skill frontmatter.

## Delegation-ready input

Reasoning is the expensive act. Perform it once at the planning or orchestration layer, then bank it in briefs that let workers execute without reconstructing the planner's hidden context. Before dispatch, every unit must state:

- the bounded deliverable and file or system boundary;
- a pass/fail definition of done;
- the decisions that are **locked** and must not be reopened;
- the decisions to **escalate** rather than guess;
- the explicit minimum-viable model selected for that spawn, with a short rationale when it is not self-evident;
- the verification gate the orchestrator will inspect; and
- the expected completion checkpoint.

Apply a cold-agent readiness test: could an agent with no conversation history or planner context execute the unit's first step from the brief alone, while knowing what is fixed and when to stop for a decision? If not, add the missing reasoning, split the unit, or keep it with the orchestrator. The test is a dispatch gate, not a frontmatter field or a separate artifact convention.

Cross-repository transfer is outside this procedure. A receiving repository owns adoption, priority, and planning through its own roadmap lifecycle; `ki-delegate` begins only when work is being assigned to execution agents.

## 1. Classify

Sort every task in the work-list into exactly one class. When a task spans two, split it — a "design then apply" task is one judgment task plus one mechanical task, sequenced.

- **Judgment** — getting the framing wrong is expensive to unwind; the task authors a standard, a decision, or an interface others will build on. _Examples:_ amend a decision record; design a checker's logic; split a standard into portable-core vs runtime-specific.
- **Mechanical** — the spec is precise and the ambiguity low; a competent agent with the spec produces the right diff without further judgment. _Examples:_ reword a README line; add a keyword; loosen a regex; apply a rename across files; a scripted edit with a clear target.
- **Research** — the blocker is an unknown fact, not a decision; later work waits on the answer. _Examples:_ confirm an external tool's config schema; find whether a runtime has a given primitive; verify an API's field names.

Two guards:

- A task you cannot classify usually is not yet understood well enough to delegate — read it into one of the three classes first, or make it a research task about itself.
- Research tasks **gate** — schedule them early (see §3), because judgment and mechanical work downstream of an unknown cannot be trusted until it resolves.
- An escalated decision is a boundary, not executor discretion. Resolve it before dispatch, schedule it as an owner checkpoint, or split the blocked work into a later round.

## 2. Assign

Map each task to an agent and an explicit **per-spawn model**. The governing rule is `ADR-KI-HARNESS-003`'s mechanical-first tenet as `ki-tokenomics` operationalises it: choose the **minimum viable model** — the least capable available model that can safely meet the task's judgment, reliability, and verification needs. In other words: **the cheapest model that suffices, stronger reasoning only where the work requires it.** Do not re-derive the cost policy here — cite `ki-tokenomics`.

- **Judgment** → the domain **specialist** agent whose prompt already encodes the relevant house standard (e.g. `ki-decision-author`, `ki-skills-lead`, `ki-engineering-lead`), or the orchestrator itself, on a model strong enough for the framing risk. The specialist grounds itself in the standard; higher capability is justified where wrong framing is expensive to unwind.
- **Mechanical** → a general worker agent given the exact spec, on the **cheapest sufficient** model. Precise spec plus low ambiguity makes the work safe to delegate, and the orchestrator reviews the diff (§4).
- **Research** → a general-purpose, web-enabled agent on the cheapest model sufficient for source discovery and synthesis. Breadth-first fact-finding, not judgment; require primary-source verification in the brief.

**Record and choose the minimum viable model `(CC)`.** The delegation brief and governed plan name the exact model selected for every worker, with a short reason when it is not self-evident. Do not leave a spawn on an ambient default or choose a stronger model merely from habit. Agents declare `model: inherit` in their frontmatter, so they carry no pinned model — the caller chooses the model **per spawn** via the Agent tool's `model` override. This means the _same_ specialist can use different models as the work demands; the agent encodes the standard, while the model is a dial the orchestrator turns. An agent that hard-pins a model defeats this and should be treated as a defect.

Subagent-type selection `(CC)`: use `Explore` for read-only search, `Plan` for design-only passes, `general-purpose` for research and mechanical edits, and the named governance specialists for judgment in their domain.

## 3. Sequence

Order the assigned tasks into **rounds**. A round is a set of tasks with no dependency on each other that can run concurrently.

### Multi-concern audits

For a repository-wide audit, run `ki repo audit --repo <repo>` first and treat that output as the authoritative mechanical result. Keep cross-skill checks such as collisions and reciprocity with the orchestrator. Only then split independent [J] reviews into bounded concerns; each reviewer receives the relevant mechanical output and must not re-run or reinterpret the whole checker fleet. Synthesise those reviews in dependency order and gate every resulting change. Do not create a tracked runtime-specific workflow for this pattern: substitute the host's available delegation mechanism at execution time.

1. **Round 1 — blockers and citation-targets.** Anything others depend on lands first: research spikes (they gate downstream trust) and any artefact that later work must cite or build on (a decision record, a shared interface). Run the independent ones concurrently `(CC: one message, multiple Agent calls)`.
2. **Round 2+ — fan out the independents.** Once the citation-targets exist, dispatch the mutually-independent mechanical work in parallel. Most mechanical doc/code edits are independent and belong here.
3. **Name write-contention.** Before dispatching a round, check that no two tasks edit the same file — if they do, serialise them or merge them into one task. Two agents editing one file race and clobber.
4. **Keep the orchestrator in the loop.** The orchestrator dispatches a round, gates its results (§4), then dispatches the next — it does not fire every round blind. Background spawns `(CC: run_in_background)` are for concurrency within a round, not for skipping the gate between rounds.
5. **Protect the orchestrator lane.** While workers run, keep the orchestrator available for caller steering, dependency decisions, progress, diff review, gates, and integration. Do not assign it a worker-sized implementation task merely to fill the final concurrency slot. Read-only preparation and small integration edits are appropriate; take an implementation lane only when it cannot be delegated safely or when resolving a worker's blocker requires the orchestrator's judgment.
6. **Dispatch the complete brief and await once.** Give every worker the delegation-ready unit as written: one independently reviewable deliverable, locked and escalated decisions, pass/fail definition of done, explicit file boundary, verification gate, and expected completion checkpoint. Use the runtime's completion or wait mechanism until that checkpoint; do not repeatedly enumerate or poll workers merely to see whether they are still active. If the checkpoint passes, make one purposeful status check, then decide to wait, re-scope, or stop the unit. A worker with an unknown state is not safe to replace: establish that it is terminal before re-dispatching its work.
7. **Drain background work before compaction `(CC)`.** Do not invoke `/compact` while an Agent spawn is outstanding: wait for every background task with `TaskOutput` / `Monitor`, capture its result, and gate any persisted diff first. If compaction happens with a task outstanding, do not trust the compacted summary's claim that the old handle is still live. Query the original handle again; if it is active, wait for it or use `TaskStop`, then confirm terminal / stopped / not-active status. When an in-session handle is no longer recognised, enumerate through the in-session `Monitor`; reserve `claude agents --json` for work originally launched through agent view or `claude --background`. Inspect the target files and `git status`, and re-dispatch a fresh, self-contained prompt only after the relevant surface positively confirms quiescence and only when no usable output persisted. If no relevant surface can confirm termination, do not re-dispatch into the same worktree.
8. **Make progress visible.** The orchestrator owns caller-facing communication; workers report their state to the orchestrator, rather than independently sending user-facing updates. Send a compact update at these points:

   - before dispatching a job likely to outlast a normal interactive turn, stating its expected checkpoint;
   - after a meaningful dispatch, stating what is now in flight and the round's next gate;
   - when a multi-agent round's trajectory materially changes, such as a result landing, a dependency clearing, a worker missing its checkpoint, or the next round becoming ready;
   - after each completed and gated unit, and immediately on a material blocker or changed estimate; and
   - at least every few minutes while work remains open, when the caller has not set a cadence.

   Every update states: **completed** / **current** / **next checkpoint** / **blocker or changed estimate**. A no-change update is useful only when it names the active phase and next expected check-in; do not send empty “still working” chatter. Host-level guidance may require a tighter cadence.

   ```text
   Progress — completed: <completed work>; current: <active work>;
   next: <checkpoint>; blocker/change: <none or concise detail>
   ```

9. **Mark verified implementation complete.** Once the work has passed its stated verification gate and reaches manual acceptance (or is recorded Done where no acceptance gate applies), end the caller-facing completion update with this compact banner. It means the implementation is complete and the next step is acceptance, not that the plan has already been closed. `ki-plan accept` emits the same banner for directly executed plan work. Use it once per completed unit, never for an intermediate round, an unverified diff, or a task merely handed to another agent.

   ```text
   +------------------------------+
   | COMPLETE! \o/                |
   | Ready for acceptance review. |
   +------------------------------+
   ```

For file-mutating work that would otherwise contend, isolate each agent in its own worktree `(CC: isolation: worktree)` — but only when the contention is real, as the isolation carries setup cost.

## 4. Gate

No delegated output lands unreviewed.

- **Every diff is orchestrator-reviewed before commit.** The orchestrator (or a sufficiently capable reviewer) reads the output against the locked decisions, definition of done, bounded scope, and verification gate before it is staged. A worker that "followed the spec" can still have misread it.
- **Auto-executing output gets an adversarial safety-review pass.** Any hook, script, or other artefact that will _run on its own_ — not just be read — gets a dedicated adversarial review that actively tries to find how it misfires (injection, unquoted paths, non-zero exits, destructive edits), regardless of which model produced it. This is the standing rule for hook/script work; it is not optional and not satisfied by a glance at the diff.
- **Verify against the real artefact, not the plan.** Where a task claims a gate passes (a linter, a test, a build), run it and read the output — do not infer success from the edit having been made.

Only after a round's gate is clean does its output commit and the next round dispatch.
