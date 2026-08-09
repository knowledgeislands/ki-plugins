# Recap procedure

_On-demand procedure for `ki-recap`. The kind, scope, and leg summary live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the full procedure._

## Contents

- [Recap procedure](#recap-procedure)
  - [Contents](#contents)
  - [1. Run the grounding helper](#1-run-the-grounding-helper)
  - [2. Summarise](#2-summarise)
  - [3. Surface what is outstanding](#3-surface-what-is-outstanding)
  - [4. Harvest the learnings, and route each](#4-harvest-the-learnings-and-route-each)
  - [5. Discussion coverage](#5-discussion-coverage)
  - [6. Actions](#6-actions)
  - [7. Route future-work selection to `ki-next`](#7-route-future-work-selection-to-ki-next)
  - [8. Preserve the handoff and compact at the boundary](#8-preserve-the-handoff-and-compact-at-the-boundary)

**Ground every claim in reality, not memory.** Warm in-session context, compaction summaries, and recalled memory entries are hypotheses about state, not evidence of it — concurrent sessions, background processes, and elapsed time all make them stale. Before the recap asserts a checkable fact — a commit landed, a gate passed, a file contains something, a plan is open — check it now (`git log`, re-run the read-only gate, read the file). What cannot be cheaply re-checked, state as recollection ("as of when it ran"), not as fact.

## 1. Run the grounding helper

```bash
bun skills/change-management/ki-recap/scripts/recap-grounding.ts --json --runtime detect
```

(From another repo, use the harness-absolute path, per the "Audit script paths" convention: `bun /path/to/ki-agentic-harness/skills/change-management/ki-recap/scripts/recap-grounding.ts --json`.)

When more than one eligible Claude or Codex session is active for the repository, choose the session explicitly instead of relying on newest modification time:

```bash
bun skills/change-management/ki-recap/scripts/recap-grounding.ts --json --transcript <session-file>.jsonl
```

`detect` is the default: it selects the newest matching transcript from both supported runtimes. Use `--runtime claude` or `--runtime codex` to force one. Claude transcripts are selected from the repository's derived Claude project directory; Codex transcripts are searched recursively below `~/.codex/sessions/` and qualify only when their `session_meta.payload.cwd` resolves to the target repository.

The selector is a basename, not a path. It must name exactly one eligible regular `.jsonl` candidate; absolute paths, traversal, other extensions, symlinks, files for another repository, and ambiguous duplicate basenames are rejected.

This emits `filesTouched` (git status), `diffStat`, `toolTally`, `highCostCandidates` (repeated identical calls, large-file re-reads), and the exact `ki-change-management-recap-repository-evidence/v1` marker. The marker records only the resolved repository root, full `HEAD` or `null`, and observed clean/dirty worktree state. On a later run, the helper recovers only a type-valid marker from the selected runtime's helper-output record and reports `transcriptEvidence.status` as `unchanged`, `changed`, or `unavailable`.

The comparison qualifies transcript-derived tool tallies and high-cost suggestions; it never replaces fresh Git checks. A missing, malformed, foreign-repository, unresolvable, or same-commit-dirty marker is `unavailable`, not a guessed result. It is a **helper**, not a checker — treat its output as raw signal to combine with warm in-session context, not a verdict.

## 2. Summarise

Using warm context plus the helper's `filesTouched` / `diffStat`: state what changed, what was decided, and why — in the order it happened, not a topic reshuffle. Keep it to what a reader picking this up cold would need: no blow-by-blow tool narration.

## 3. Surface what is outstanding

**Always check whether everything is committed** — even if the session felt "done", verify the working tree is clean for the files this session touched (staged, unstaged, and untracked). Uncommitted session work is the most common silently-dropped outstanding item. Files dirty from _other_ threads of work are out of scope (per the stay-scoped rule) — note their existence in one line at most, never enumerate or adopt them.

Then look only for threads left mid-change by this session: uncommitted edits, a failing gate, a decision still open, or an explicitly deferred fix. Do not use a recap to inventory repository backlog, peer-repository state, or plausible future work; those are outside the thread and `ki-next` owns future-work selection. **Ground every "uncommitted" or "still dirty" claim in the `filesTouched` from the grounding helper run at the start of _this_ recap, never in a `git status`/`git diff` seen earlier in the conversation** — commits (yours or a concurrent process's) can land between that earlier look and the recap itself, and stale context reads as a false outstanding item. If `transcriptEvidence.status` is `changed` or `unavailable`, describe transcript-derived tool tallies only as historical or omit their recommendation. If meaningful time has passed since step 1 ran, re-run it before finalizing this section. Apply the house rule:

- A roadmap item or Stream **added during this session** counts as **what happened** (placing work in the repository's durable forward-work structure is a completed action), not as outstanding.
- An in-session non-KB `ki-plan` with unchecked Steps or KB proposal with unchecked Checklist entries **is** outstanding — cite its identifier and lifecycle state. An unrelated plan or proposal is not.
- If an explicitly deferred in-session thread has no durable home, offer its correct local route: `ki-next` capture into the shared queue, then `ki-plan` when it is selected; use the roadmap adapter for a non-KB repository and the Streams adapter for a Knowledge Base. Do not manufacture a route for work merely noticed during the recap.

## 4. Harvest the learnings, and route each

For each dead-end, workaround, or convention discovered this session, apply `ki-authoring`'s [knowledge-promotion standard](../../../governance/ki-authoring/references/standards-knowledge-promotion.md) — **confirm with the user before writing anywhere durable**.

The standard owns the placement ladder, promotion evidence, and duplicate-reconciliation rule; this procedure only identifies the likely route:

| Learning shape | Route to |
| --- | --- |
| Stable repository convention | Portable `AGENTS.md`, or a runtime file only when it is genuinely runtime-specific |
| Checker, rubric, shared rule, or reusable operation | Its owning skill, standard, reference, agent, or hook — add a criterion only after scanning the relevant catalogue and linter |
| A bounded procedure | An existing appropriate guide, rather than new standing orientation |
| Durable personal fact or user preference | Runtime memory or synchronised personal configuration, according to its scope |
| Deferred work with no home yet | Non-KB: `ROADMAP.md`, or a `ki-plan` if it is multi-step. KB: Streams, or a proposal Checklist for governed change. |

Use `highCostCandidates` from the grounding helper as a starting list, not the full set — warm context surfaces things the helper cannot see (a design dead-end, a rejected approach).

### Per-record review mini recap

When `ki-accept` requests a record-scoped recap, do not run or imply a full-session recap. Ground only the record's delivered outputs and verification evidence, then record these H3 parts in a roadmap item's `## Review` section or the equivalent proposal review evidence: **Delivered**, **Summary of changes**, **Verification**, **Outstanding concerns**, and **Mini recap**. The summary names the material changes and useful primary paths; verification records concrete commands, outcomes, and the checked evidence revision; concerns hold open questions and further review analysis. The mini recap may name a learning and its proposed route, but it must say that the route is unapproved. User closure of the record sets it Done only; it does not approve a guide, rubric, agent, hook, memory, or other durable learning write.

## 5. Discussion coverage

Add this optional section after the three recap legs and before Actions only when the user asks for coverage or multiple materially distinct discussion points would otherwise be difficult to trace. Omit it for a simple single-thread recap. It is a compact reviewer aid: it summarises conclusions already grounded by the preceding legs; it does not mine unavailable transcripts, classify every conversational turn, or establish transcript completeness.

Immediately before the matrix, state its evidence scope. Rows may draw only on warm in-session context, the selected eligible transcript, and freshly checked repository evidence. Label the matrix **bounded and non-exhaustive** whenever transcript evidence is absent, ambiguous, changed, or otherwise unavailable; do not silently fill gaps from recollection.

Use exactly these short columns, linking canonical records where a durable home exists:

| Discussion point | Owning home | Disposition | Evidence |
| --- | --- | --- | --- |
| <material point> | <canonical record or `—`> | <closed vocabulary> | <fresh check or scoped session evidence> |

Use only this closed disposition vocabulary:

- `delivered` — evidence-backed completed work.
- `captured` — work placed in its durable queue or record. A roadmap item or Stream added during this session is part of what happened, not an Action.
- `deferred` — an explicit deferral with a named durable home or return condition.
- `decision-needed` — an unresolved user-owned choice.

Reconcile the matrix with [Surface what is outstanding](#3-surface-what-is-outstanding) and [Actions](#6-actions): a deferred point without a durable home, and every `decision-needed` row, remains outstanding and has a corresponding final Action. Do not turn a captured record into an Action merely because it is actionable later.

Apply these scenario checks before presenting the matrix:

| Situation | Required result |
| --- | --- |
| Simple single-thread recap | Omit the matrix. |
| Multi-topic recap with grounded evidence | Use the four columns and only the closed dispositions. |
| Transcript evidence absent, ambiguous, changed, or unavailable | State the bounded non-exhaustive scope; omit unsupported rows. |
| Deferred point lacks a durable home or a choice remains unresolved | Keep it outstanding and add a reconciled Action. |

## 6. Actions

Close the recap with an **Actions** section: a short, concrete, imperative list of only the unfinished work that emerged from this session's steps 3–5 — each item something that could be done right now, with the exact command, file, or artefact named. Do not add generic backlog, peer-repository state, a proposed feature, or a future-work choice merely because it is actionable; those are `ki-next` concerns, not recap actions. Prefix each item with a short, unique, uppercase hyphenated label that names the work (usually two to four words), so the user can respond in chat by label ("do `COMMIT-DOCS` and `FIX-AUTHORING-AUDIT`") instead of restating the action. Do not use arbitrary sequence labels such as `A1`, `A2`, or `A3`; labels are ephemeral recap handles, not roadmap identifiers. Typical entries:

- `COMMIT-SESSION-CHANGES` — Commit (or explicitly discard) the session's uncommitted files — name the paths and suggest the commit message.
- `PRESERVE-SESSION-DEFERRAL` — Create the offered roadmap / plan or Stream / proposal Checklist for a thread explicitly deferred during this session that has no home.
- `APPLY-LEARNING-ROUTE` — Apply an approved learning route from the knowledge-promotion standard (for example, a repository rule, skill criterion, hook, memory, or personal configuration update).
- `RERUN-FAILING-GATE` — Re-run a gate that was left failing, or finish a mid-change thread.

If nothing is actionable, say so in one line ("No actions — tree clean, nothing outstanding"). Do **not** perform the actions unprompted — this section is the checklist the user acts on (or asks you to act on); durable writes still require the step-4 confirmation.

## 7. Route future-work selection to `ki-next`

Future-work selection is separate from recap. Route to `ki-next` only when the user asks to choose, rank, or defer future work; it is not a Specific action, a standing recap requirement, or an automatic handoff:

1. State the boundary: `ki-next` re-runs the current roadmap audit and treats any recap context as a lead rather than fact.
2. Do not turn candidate work into a recap action, create a roadmap entry, promote an item, create a plan, write a learning route, or invoke `ki-next` merely by naming the route. The user chooses whether to continue.

Apply these scenario checks when offering it:

| Situation | Required result |
| --- | --- |
| Clean recap | Say “No actions”; do not manufacture a `ki-next` handoff. |
| Future work is merely visible in the repository | Omit it from the recap; it is neither an outstanding thread nor a Specific action. |
| User asks to choose future work | Route to `ki-next`, which re-grounds the roadmap before selection. |
| Deferred work was already parked on the roadmap | Record it as what happened, not outstanding. |
| Learning route is unapproved | Label it as a proposal; neither recap nor `ki-next` writes it. |

## 8. Preserve the handoff and compact at the boundary

The end of a recap is a compaction boundary, not a place to measure headroom. Compaction is the default action there — the recap has just recorded the durable outcome, so the span it summarised is the material the next cycle no longer needs. Do not gate the decision on a context-use percentage or a remaining-headroom figure: no runtime adapter is required to expose one, and a threshold that cannot be read is a rule that never fires.

Identify the next work cycle's scope first. The goal is to reduce active context to the information that cycle needs, not merely to preserve a record of the finished session. Preserve only the scoped digest below, then invoke the documented runtime- or vendor-specific compaction mechanism before beginning `ki-next`, planning, or implementation work. The applicable `ki-tokenomics` runtime adapter owns the mechanism's documented evidence boundary.

Two conditions withhold the default. **Safety:** do not compact in the middle of an active implementation unit, a pending user decision, an unfinished tool operation, or uncommitted work whose recovery information is not yet recorded. **Minimum footprint:** do not compact when no substantive work has entered context since the last compaction. Judge that by work done, not by tokens counted — a recap that runs immediately after a compaction, or a recap followed straight into `ki-next`, compacts once at the later boundary rather than twice across an unchanged span. This floor exists to stop thrashing; it is not licence to defer compaction across real work.

Runtimes differ in what they expose. Claude Code offers an invocable compaction mechanism, so the default action is available at this boundary. Codex compacts automatically around its own `PreCompact` / `PostCompact` events but exposes no equivalent command to invoke, so there the boundary is reached, stated, and passed without invocation. Where no mechanism can be invoked, say so plainly and continue with the digest as the bounded handoff; it is not a substitute for reducing the live context.

Write a carry-forward digest of the recapped span:

```markdown
## Context

<why this span of work happened>

## Next scope

<the next work cycle and the minimum context it needs; omit resolved material that does not inform it>

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

State plainly that this digest is a **carry-forward artefact**, not a context-window reduction. Runtime- or vendor-specific compaction remains the applicable `ki-tokenomics` adapter's boundary; this procedure invokes the documented mechanism at the safe recap-to-new-work boundary, with the aim of retaining only the next cycle's scope.
