# Delegation procedure

_On-demand procedure for `ki-delegate`. The kind, scope, and leg summary live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the full procedure._

Throughout, **`(CC)`** marks a mechanism specific to the Claude Code runtime. The method itself — classify, assign, sequence, gate — is runtime-neutral; only the spawning mechanics are `(CC)`. A different runtime substitutes its own spawn primitive at those points and the method is unchanged. This mirrors the SPEC/CC tagging discipline `ki-skills` applies to skill frontmatter.

## 1. Classify

Sort every task in the work-list into exactly one tier. When a task spans two, split it — a "design then apply" task is one judgment task plus one mechanical task, sequenced.

- **Judgment** — getting the framing wrong is expensive to unwind; the task authors a standard, a decision, or an interface others will build on. _Examples:_ amend a decision record; design a checker's logic; split a standard into portable-core vs runtime-specific.
- **Mechanical** — the spec is precise and the ambiguity low; a competent agent with the spec produces the right diff without further judgment. _Examples:_ reword a README line; add a keyword; loosen a regex; apply a rename across files; a scripted edit with a clear target.
- **Research** — the blocker is an unknown fact, not a decision; later work waits on the answer. _Examples:_ confirm an external tool's config schema; find whether a runtime has a given primitive; verify an API's field names.

Two guards:

- A task you cannot classify usually is not yet understood well enough to delegate — read it into one of the three tiers first, or make it a research task about itself.
- Research tiers **gate** — schedule them early (see §3), because judgment and mechanical work downstream of an unknown cannot be trusted until it resolves.

## 2. Assign

Map each task to an agent and a **per-spawn model tier**. The governing rule is `ADR-KI-HARNESS-003`'s mechanical-first tenet as `ki-tokenomics` operationalises it: **the cheapest tier that suffices, judgment to the strongest.** Do not re-derive the cost policy here — cite `ki-tokenomics`.

- **Judgment** → the domain **specialist** agent whose prompt already encodes the relevant house standard (e.g. `ki-decision-author`, `ki-skills-lead`, `ki-engineering-lead`), or the orchestrator itself, on a **strong** model tier (e.g. Opus). The specialist grounds itself in the standard; the strong tier is where wrong framing is cheapest to avoid.
- **Mechanical** → a general worker agent given the exact spec, on the **cheapest sufficient** tier (e.g. Sonnet). Precise spec plus low ambiguity means the cheap tier lands it, and the orchestrator reviews the diff (§4).
- **Research** → a `general-purpose` agent, web-enabled, on a **mid / cheapest sufficient** tier. Breadth-first fact-finding, not judgment; verify claims against primary sources in the brief.

**Model-agnostic agents `(CC)`.** Agents declare `model: inherit` in their frontmatter, so they carry no pinned tier — the caller chooses the model **per spawn** via the Agent tool's `model` override. This means the _same_ specialist runs on the cheap tier for lighter judgment and the strong tier for the hardest calls; the agent encodes the standard, the model tier is a dial the orchestrator turns. An agent that hard-pins a tier defeats this and should be treated as a defect, the model-tier analogue of a skill that hardcodes a runtime.

Subagent-type selection `(CC)`: use `Explore` for read-only search, `Plan` for design-only passes, `general-purpose` for research and mechanical edits, and the named governance specialists for judgment in their domain.

## 3. Sequence

Order the assigned tasks into **rounds**. A round is a set of tasks with no dependency on each other that can run concurrently.

### Multi-concern audits

For a repository-wide audit, run the repository's aggregate `ki:audit` entrypoint first and treat that output as the authoritative mechanical result. Keep cross-skill checks such as collisions and reciprocity with the orchestrator. Only then split independent [J] reviews into bounded concerns; each reviewer receives the relevant mechanical output and must not re-run or reinterpret the whole checker fleet. Synthesise those reviews in dependency order and gate every resulting change. Do not create a tracked runtime-specific workflow for this pattern: substitute the host's available delegation mechanism at execution time.

1. **Round 1 — blockers and citation-targets.** Anything others depend on lands first: research spikes (they gate downstream trust) and any artefact that later work must cite or build on (a decision record, a shared interface). Run the independent ones concurrently `(CC: one message, multiple Agent calls)`.
2. **Round 2+ — fan out the independents.** Once the citation-targets exist, dispatch the mutually-independent mechanical work in parallel. Most mechanical doc/code edits are independent and belong here.
3. **Name write-contention.** Before dispatching a round, check that no two tasks edit the same file — if they do, serialise them or merge them into one task. Two agents editing one file race and clobber.
4. **Keep the orchestrator in the loop.** The orchestrator dispatches a round, gates its results (§4), then dispatches the next — it does not fire every round blind. Background spawns `(CC: run_in_background)` are for concurrency within a round, not for skipping the gate between rounds.
5. **Drain background work before compaction `(CC)`.** Do not invoke `/compact` while an Agent spawn is outstanding: wait for every background task with `TaskOutput` / `Monitor`, capture its result, and gate any persisted diff first. If compaction happens with a task outstanding, do not trust the compacted summary's claim that the old handle is still live. Query the original handle again; if it is active, wait for it or use `TaskStop`, then confirm terminal / stopped / not-active status. When an in-session handle is no longer recognised, enumerate through the in-session `Monitor`; reserve `claude agents --json` for work originally launched through agent view or `claude --background`. Inspect the target files and `git status`, and re-dispatch a fresh, self-contained prompt only after the relevant surface positively confirms quiescence and only when no usable output persisted. If no relevant surface can confirm termination, do not re-dispatch into the same worktree.

For file-mutating work that would otherwise contend, isolate each agent in its own worktree `(CC: isolation: worktree)` — but only when the contention is real, as the isolation carries setup cost.

## 4. Gate

No cheap-tier output lands unreviewed.

- **Every diff is orchestrator-reviewed before commit.** The cheap tier produces the diff; the orchestrator (or a strong-tier reviewer) reads it against the spec before it is staged. A mechanical agent that "followed the spec" can still have misread it.
- **Auto-executing output gets an adversarial safety-review pass.** Any hook, script, or other artefact that will _run on its own_ — not just be read — gets a dedicated adversarial review that actively tries to find how it misfires (injection, unquoted paths, non-zero exits, destructive edits), regardless of which tier produced it. This is the standing rule for hook/script work; it is not optional and not satisfied by a glance at the diff.
- **Verify against the real artefact, not the plan.** Where a task claims a gate passes (a linter, a test, a build), run it and read the output — do not infer success from the edit having been made.

Only after a round's gate is clean does its output commit and the next round dispatch.
