# Recap procedure

_On-demand procedure for `ki-recap`. The kind, scope, and leg summary live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the full procedure._

**Ground every claim in reality, not memory.** Warm in-session context, compaction summaries, and recalled memory entries are hypotheses about state, not evidence of it — concurrent sessions, background processes, and elapsed time all make them stale. Before the recap asserts a checkable fact — a commit landed, a gate passed, a file contains something, a plan is open — check it now (`git log`, re-run the read-only gate, read the file). What cannot be cheaply re-checked, state as recollection ("as of when it ran"), not as fact.

## 1. Run the grounding helper

```bash
bun skills/process/ki-recap/scripts/recap-grounding.ts --json
```

(From another repo, use the harness-absolute path, per the "Audit script paths" convention: `bun /path/to/ki-agentic-harness/skills/process/ki-recap/scripts/recap-grounding.ts --json`.)

When more than one Claude session is active for the repository, choose the session explicitly instead of relying on newest modification time:

```bash
bun skills/process/ki-recap/scripts/recap-grounding.ts --json --transcript <session-file>.jsonl
```

The selector is a filename, not a path. It must name an existing regular `.jsonl` file directly inside the repository's derived Claude transcript directory; absolute paths, traversal, other extensions, and symlinks are rejected.

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

## 5. Specific actions

Close the recap with a **Specific actions** section: a short, concrete, imperative list of everything actionable that emerged from steps 3 and 4 — each item something that could be done right now, with the exact command, file, or artefact named. Prefix each item with a short, unique, uppercase hyphenated label that names its work (usually two to four words), so the user can respond in chat by label ("do `COMMIT-DOCS` and `FIX-AUTHORING-AUDIT`") instead of restating the action. Do not use arbitrary sequence labels such as `A1`, `A2`, or `A3`; labels are ephemeral recap handles, not roadmap identifiers. Typical entries:

- `COMMIT-SESSION-CHANGES` — Commit (or explicitly discard) the session's uncommitted files — name the paths and suggest the commit message.
- `PARK-DEFERRED-WORK` — Create the offered ROADMAP line or `ki-plan` for outstanding work that has no home.
- `APPLY-LEARNING-ROUTE` — Apply an approved learning route (the `CLAUDE.md` entry, rubric criterion, hook, or memory write from step 4).
- `RERUN-FAILING-GATE` — Re-run a gate that was left failing, or finish a mid-change thread.

If nothing is actionable, say so in one line ("No actions — tree clean, nothing outstanding"). Do **not** perform the actions unprompted — this section is the checklist the user acts on (or asks you to act on); durable writes still require the step-4 confirmation.

## 6. Compress (only when `--compress` is passed)

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
