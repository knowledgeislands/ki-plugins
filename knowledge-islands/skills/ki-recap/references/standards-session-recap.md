# Recap procedure

_On-demand procedure for `ki-recap`. The kind, scope, and leg summary live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the full procedure._

## Contents

- [Recap procedure](#recap-procedure)
  - [Contents](#contents)
  - [1. Run the grounding helper](#1-run-the-grounding-helper)
  - [2. Summarise](#2-summarise)
  - [3. Surface what is outstanding](#3-surface-what-is-outstanding)
  - [4. Harvest the learnings, and route each](#4-harvest-the-learnings-and-route-each)
  - [5. Specific actions](#5-specific-actions)
  - [6. Optional handoff to `ki-next`](#6-optional-handoff-to-ki-next)
  - [7. Compress (only when `--compress` is passed)](#7-compress-only-when---compress-is-passed)

**Ground every claim in reality, not memory.** Warm in-session context, compaction summaries, and recalled memory entries are hypotheses about state, not evidence of it — concurrent sessions, background processes, and elapsed time all make them stale. Before the recap asserts a checkable fact — a commit landed, a gate passed, a file contains something, a plan is open — check it now (`git log`, re-run the read-only gate, read the file). What cannot be cheaply re-checked, state as recollection ("as of when it ran"), not as fact.

## 1. Run the grounding helper

```bash
bun skills/process/ki-recap/scripts/recap-grounding.ts --json --runtime detect
```

(From another repo, use the harness-absolute path, per the "Audit script paths" convention: `bun /path/to/ki-agentic-harness/skills/process/ki-recap/scripts/recap-grounding.ts --json`.)

When more than one eligible Claude or Codex session is active for the repository, choose the session explicitly instead of relying on newest modification time:

```bash
bun skills/process/ki-recap/scripts/recap-grounding.ts --json --transcript <session-file>.jsonl
```

`detect` is the default: it selects the newest matching transcript from both supported runtimes. Use `--runtime claude` or `--runtime codex` to force one. Claude transcripts are selected from the repository's derived Claude project directory; Codex transcripts are searched recursively below `~/.codex/sessions/` and qualify only when their `session_meta.payload.cwd` resolves to the target repository.

The selector is a basename, not a path. It must name exactly one eligible regular `.jsonl` candidate; absolute paths, traversal, other extensions, symlinks, files for another repository, and ambiguous duplicate basenames are rejected.

This emits `filesTouched` (git status), `diffStat`, `toolTally`, and `highCostCandidates` (repeated identical calls, large-file re-reads). It is a **helper**, not a checker — treat its output as raw signal to combine with warm in-session context, not a verdict.

## 2. Summarise

Using warm context plus the helper's `filesTouched` / `diffStat`: state what changed, what was decided, and why — in the order it happened, not a topic reshuffle. Keep it to what a reader picking this up cold would need: no blow-by-blow tool narration.

## 3. Surface what is outstanding

**Always check whether everything is committed** — even if the session felt "done", verify the working tree is clean for the files this session touched (staged, unstaged, and untracked). Uncommitted session work is the most common silently-dropped outstanding item. Files dirty from _other_ threads of work are out of scope (per the stay-scoped rule) — note their existence in one line at most, never enumerate or adopt them.

Then look for threads left mid-change: uncommitted edits, a failing gate, a decision still open, work neither done nor parked. **Ground every "uncommitted" or "still dirty" claim in the `filesTouched` from the grounding helper run at the start of _this_ recap, never in a `git status`/`git diff` seen earlier in the conversation** — commits (yours or a concurrent process's) can land between that earlier look and the recap itself, and stale context reads as a false outstanding item. If meaningful time has passed since step 1 ran, re-run it before finalizing this section. Apply the house rule:

- A ROADMAP item **added during this session** counts as **what happened** (parking work on ROADMAP is a completed action — the roadmap is the durable home for deferred work), not as outstanding.
- A `ki-plan` opened this session with unchecked Steps **is** outstanding — cite its id and status.
- If something outstanding warrants a plan or a ROADMAP line and doesn't have one yet, say so and offer to create it (via `ki-plan new` or a ROADMAP edit) rather than silently letting it drop.

## 4. Harvest the learnings, and route each

For each dead-end, workaround, or convention discovered this session, route it to its proper home — **confirm with the user before writing anywhere durable**:

| Learning shape | Route to |
| --- | --- |
| Repeated dead-end, big-file re-read, tool-arg gotcha (mechanical, local) | `CLAUDE.md` learned-pattern entry — hand into `headroom learn`'s `<!-- headroom:learn:start -->` block, **never duplicate it** |
| Checker or rubric gap (a mechanical criterion missing or wrong) | A skill fix, or a new rubric criterion (mind the code-numbering caution: scan both the rubric and the linter for the next code) |
| A recurring task that could be delegated | A new or updated agent |
| An automatable guardrail (something that should block, not just advise) | A hook |
| Deferred work with no home yet | `ROADMAP.md`, or a `ki-plan` if it's multi-step |
| A durable cross-project fact about the user, feedback, or this project | Memory (per the auto-memory system's four types) — never duplicate what's already in a `CLAUDE.md` |

Use `highCostCandidates` from the grounding helper as a starting list, not the full set — warm context surfaces things the helper cannot see (a design dead-end, a rejected approach).

### Per-plan acceptance mini recap

When `ki-plan accept` requests a plan-scoped recap, do not run or imply a full-session recap. Ground only the plan's delivered outputs and verification evidence, then record these H3 parts in its `## Acceptance` section: **Delivered**, **Summary of changes**, **Verification**, **Outstanding concerns**, and **Mini recap**. The summary names the material changes and useful primary paths; verification records concrete commands, outcomes, and the checked evidence revision; concerns hold open questions and further acceptance analysis. The mini recap may name a learning and its proposed route, but it must say that the route is unapproved. User acceptance of the plan closes the plan only; it does not approve a guide, rubric, agent, hook, memory, or other durable learning write.

## 5. Specific actions

Close the recap with a **Specific actions** section: a short, concrete, imperative list of everything actionable that emerged from steps 3 and 4 — each item something that could be done right now, with the exact command, file, or artefact named. Prefix each item with a short, unique, uppercase hyphenated label that names its work (usually two to four words), so the user can respond in chat by label ("do `COMMIT-DOCS` and `FIX-AUTHORING-AUDIT`") instead of restating the action. Do not use arbitrary sequence labels such as `A1`, `A2`, or `A3`; labels are ephemeral recap handles, not roadmap identifiers. Typical entries:

- `COMMIT-SESSION-CHANGES` — Commit (or explicitly discard) the session's uncommitted files — name the paths and suggest the commit message.
- `PARK-DEFERRED-WORK` — Create the offered ROADMAP line or `ki-plan` for outstanding work that has no home.
- `APPLY-LEARNING-ROUTE` — Apply an approved learning route (the `CLAUDE.md` entry, rubric criterion, hook, or memory write from step 4).
- `RERUN-FAILING-GATE` — Re-run a gate that was left failing, or finish a mid-change thread.
- `CHOOSE-NEXT-WORK` — Offer `ki-next` when one or more grounded actions need a roadmap priority or plan decision. Carry only their labels, the grounded outstanding work, and the approval state of any learning routes; `ki-next` re-reads the roadmap before it ranks anything.

If nothing is actionable, say so in one line ("No actions — tree clean, nothing outstanding"). Do **not** perform the actions unprompted — this section is the checklist the user acts on (or asks you to act on); durable writes still require the step-4 confirmation.

## 6. Optional handoff to `ki-next`

Offer this handoff only when the recap has a roadmap-directed action. It is an in-conversation invitation, not a new invocation mode, a persistent transcript, or a dependency:

1. State the candidate action labels and the grounded context available to `ki-next`: outstanding work, learning routes and whether each is approved, and the Specific actions themselves.
2. State the boundary: `ki-next` works without this recap, re-runs the current roadmap audit, and treats every dynamic claim here as a lead rather than fact.
3. Do not create a roadmap entry, promote an item, create a plan, write a learning route, or invoke `ki-next` merely by offering the handoff. The user chooses whether to continue.

Apply these scenario checks when offering it:

| Situation | Required result |
| --- | --- |
| Clean recap | Say “No actions”; do not manufacture a `ki-next` handoff. |
| Repository has no roadmap | Recap still completes; do not offer `ki-next` as a selection route. |
| Deferred work was already parked on the roadmap | Record it as what happened, not outstanding; `ki-next` will re-ground its current state if invoked. |
| Learning route is unapproved | Label it as a proposal; neither recap nor `ki-next` writes it. |
| Generated-footprint rollout has unrelated consumer drift | Report the rollout evidence and the unrelated drift separately; do not let either prove the other. |
| User confirms multi-step next work | `ki-next` re-audits, confirms the exact roadmap transition, calls `ki-plan`, then stops for plan review. |

## 7. Compress (only when `--compress` is passed)

Write a carry-forward digest of the recapped span:

```markdown
## Context

<why this span of work happened>

## Decisions

<decisions made, one line each>

## Files Touched

<paths, from the grounding helper's filesTouched/diffStat>

## Outstanding

<from step 3>

## Learnings Routed

<from step 4, one line per learning: what it was, where it went>

## Keywords

<comma-separated terms for future retrieval>
```

State plainly that this digest is a **carry-forward artefact**, not a context-window reduction — the live window is unchanged. True in-context compression is native compaction or a `PreCompact` hook (`ki-tokenomics`'s domain); this skill does not attempt either.
