---
name: ki-plan
implies: []
description: >
  Drives the lifecycle of an individual governed plan in a non-KB repository — done / execute / new / promote / status — as an installable process skill (kind: process, ADR-KI-HARNESS-SKILLS-006). It creates and executes plans in a thematic project roadmap, closes them with canonical theme and generated-root sync, and can deliberately promote the current Claude Code Plan Mode scratch plan. The profiles, format, and methodology belong to the governance skill `ki-project-roadmap`, which this skill composes on and never restates. Triggers: "close this plan", "execute plan", "new plan", "promote this Plan Mode plan", "plan status", "/ki-plan". Not for Knowledge Islands KB repos (`repo_type = "kb"`), where planning is a `ki-kb-streams` proposal Checklist.
argument-hint: 'done <theme>/<id> | execute <theme>/<id> | new <theme> <title> | promote | status [theme] | help'
---

# ki-plan

**Kind:** process. Drives one plan's lifecycle; the class-level standard (profiles, format, and methodology) is owned by `ki-project-roadmap` — see [references/lifecycle.md](references/lifecycle.md) for the full procedure this skill carries out.

## What this skill does

Runs the individual-plan lifecycle for a **non-KB repository**: `done` (close a plan, remove its canonical theme item, and regenerate the root projection), `execute` (work its Steps), `new` (write a plan file), `promote` (turn the current Claude Code Plan Mode scratch plan into a governed plan), and `status` (show all active plans or one theme's focused view). It is the process counterpart to `ki-project-roadmap`. It reads the plan format and quality bar from that governance skill rather than restating them.

`ki-plan` operates only on the **thematic profile**. The simple profile deliberately has no plan collection. `new` and `promote` in a simple repository stop without writing and give the concrete expansion route `/ki-project-roadmap expand <theme>`; the user runs `ki-plan` again after expansion.

## Planning is repo-first

In a KI code repo the plan is a governed file under `docs/roadmap/<theme>/plans/`, authored through this skill — never a Claude-native Plan Mode scratch file in `~/.claude/plans/`. When a user asks to plan, including by entering native Plan Mode, treat `docs/roadmap/<theme>/plans/<NNN>-<slug>.md` as the source of truth and create it here with `new`; a `~/.claude/plans/` scratch file, if one exists, is only a draft and is never canonical. Where a native draft exists, prefer to leave in it a pointer to the governed repo plan rather than duplicating content. This keeps planning identical across runtimes — Codex has no Plan Mode, so plans simply live where the repo expects them — and removes any dependency on Plan Mode hooks firing. The `promote` verb, which bridges a native Plan Mode scratch plan into the selected theme via the `ExitPlanMode` hook, is therefore an optional Claude-Code-CLI-only convenience subordinate to `new`, and is unavailable on surfaces that do not fire that hook (e.g. the SDK/editor extension).

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action. With no argument, present the five lifecycle verbs in the order above using the runtime's available interactive choice mechanism; in a non-interactive session, print the same choices and stop. Otherwise dispatch on the first token of the argument per [references/lifecycle.md](references/lifecycle.md).

**Claude Code session token for `promote`:** `${CLAUDE_SESSION_ID}`. Claude Code resolves this always-loaded value before the skill reaches the model. `promote` binds that resolved value as the current session id and fails closed if it remains unresolved or is not filename-safe; do not move this placeholder into the on-demand lifecycle reference. Other lifecycle verbs do not depend on it.

## Preflight (every sub-command)

1. Run `git rev-parse --show-toplevel` to find the git root, then physically resolve it.
2. If `.ki-config.toml` at the git root has `repo_type = "kb"`: **stop** — in a KB, planning is a stream proposal's `## Checklist`, governed by `ki-kb-streams`. This skill creates no KB artifact.
3. Ask `ki-project-roadmap` to identify and validate the repository profile. In the simple profile, `status` reports that profile from the root `ROADMAP.md`; `done` and `execute` report that no governed plan collection exists; `new` and `promote` stop with `/ki-project-roadmap expand <theme>`. In the thematic profile, use only `docs/roadmap/README.md`, `docs/roadmap/<theme>/ROADMAP.md`, and `docs/roadmap/<theme>/plans/`.
4. Resolve and validate every existing path component physically before reading or writing it. Never follow a symlink outside the physical git root, infer an alternative plan tree, or repair governance state as a side effect of a lifecycle command.

## Notes

- No universal AUDIT/CONFORM/EDUCATE/REFRESH modes — this is a process skill (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006); its modes are the lifecycle sub-commands above.
- Installable globally (`ki:skills:link:global`), alongside `ki-bootstrap` — usable in any non-KB repository on the machine, not just this one. Like `ki-bootstrap`, never vendored or declared in a repo's `.ki-config.toml` — no `[ki-plan]` table, ever.
- The thematic roadmap and file-oriented `done`, `execute`, `new`, and `status` procedures are runtime-neutral; adapt interactive prompts to the host runtime. `promote` is Claude-Code-only because it consumes Claude Code's Plan Mode hook state and session substitution.
