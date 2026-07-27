---
name: ki-plan
ki-depends-on: []
description: >
  An installable process skill (kind: process, ADR-KI-HARNESS-SKILLS-006) that drives the governed-plan lifecycle in a non-KB repository — ready / execute / accept / done / prune / new / promote / status. It creates thematic-roadmap plans, preserves transferred detail without implying readiness, transitions explicit readiness and start batches atomically, presents manual acceptance, retains done records until prune, and can promote a runtime-native Plan Mode draft. Profiles, format, and methodology belong to `ki-roadmap`. Triggers: "ready these plans", "start these plans", "accept this plan", "close this plan", "prune done plans", "execute plan", "new plan", "promote this Plan Mode plan", "plan status", "/ki-plan". Not for KB repos (`repo_type = "kb"`), where `ki-kb-streams` proposal Checklists replace plans.
argument-hint: 'ready <THEME>-<NNN>... | execute <THEME>-<NNN>... | accept <THEME>-<NNN> | done <THEME>-<NNN> | prune [theme] | new <theme> <title> | promote | status [theme] | help'
---

# ki-plan

**Kind:** process. Drives one plan's lifecycle; the class-level standard (profiles, format, and methodology) is owned by `ki-roadmap` — see [the plan-lifecycle standard](references/standards-plan-lifecycle.md) for the full procedure this skill carries out.

## What this skill does

Runs the governed-plan lifecycle for a **non-KB repository**: `ready` (record explicit approval to start one or more named plans), `execute` (start one or more ready plans or work a plan's Steps), `accept` (prepare a manual review packet and stop), `done` (record an explicitly accepted plan's completion without deleting it), `prune` (separately remove a user-confirmed batch of committed done records and canonical items), `new` (write a plan file), `promote` (turn a current runtime-native Plan Mode scratch plan into a governed plan), and `status` (show active plans and retained records). A batch is always explicit and all-or-nothing: validate every selected plan before publishing any status change, then commit the transition once. Ordinary plans remain linked to `Blocking` or `Next`; an open plan with a non-empty `transferred-from` origin may preserve transferred detail at another honest horizon but is not eligible for readiness there. It is the process counterpart to `ki-roadmap`. It reads the plan format and quality bar from that governance skill rather than restating them.

`ki-plan` operates only on the **thematic profile**. The simple profile deliberately has no plan collection. `new` and `promote` in a simple repository stop without writing and give the concrete expansion route `/ki-roadmap expand <theme>`; the user runs `ki-plan` again after expansion.

## Planning is repo-first

In a KI code repo the plan is a governed file under `docs/roadmap/<theme>/plans/`, authored through this skill — never a runtime-native Plan Mode scratch file. When a user asks to plan, including by entering native Plan Mode, treat `docs/roadmap/<theme>/plans/<THEME>-<NNN>-<slug>.md` as the source of truth and create it here with `new`; the stable `<THEME>` code comes from that theme's `ROADMAP.md`. A native scratch file, if one exists, is only a draft and is never canonical. Where a native draft exists, prefer to leave in it a pointer to the governed repo plan rather than duplicating content. This keeps planning identical across runtimes — the native Plan Mode convenience is optional and unavailable on surfaces that do not support its hook — and removes any dependency on such hooks firing.

When referring in prose to a specific governed plan, link its canonical document using the host's Markdown-link convention; use a bare identifier only where a structured format requires it, such as `blocks`, `blocked-by`, or a lifecycle command.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action. With no argument, present the eight lifecycle verbs in the order above using the runtime's available interactive choice mechanism; in a non-interactive session, print the same choices and stop. Otherwise dispatch on the first token of the argument per [the plan-lifecycle standard](references/standards-plan-lifecycle.md).

### Runtime binding: promotion session token

The runtime-native `promote` integration receives its session token from the host and fails closed if that value is unresolved or not filename-safe; do not move this runtime binding into the portable lifecycle procedure. Other lifecycle verbs do not depend on it.

## Preflight (every sub-command)

1. Run `git rev-parse --show-toplevel` to find the git root, then physically resolve it.
2. If `.ki-config.toml` at the git root has `repo_type = "kb"`: **stop** — in a KB, planning is a stream proposal's `## Checklist`, governed by `ki-kb-streams`. This skill creates no KB artifact.
3. Ask `ki-roadmap` to identify and validate the repository profile. In the simple profile, `status` reports that profile from the root `ROADMAP.md`; `ready`, `execute`, `accept`, `done`, and `prune` report that no governed plan collection exists; `new` and `promote` stop with `/ki-roadmap expand <theme>`. In the thematic profile, use only `docs/roadmap/<theme>/ROADMAP.md` and `docs/roadmap/<theme>/plans/`.
4. Resolve and validate every existing path component physically before reading or writing it. Never follow a symlink outside the physical git root, infer an alternative plan tree, or repair governance state as a side effect of a lifecycle command.

## Notes

- No universal AUDIT/CONFORM/EDUCATE/REFRESH modes — this is a process skill (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006); its modes are the lifecycle sub-commands above.
- Installed as a core user skill by `ki bootstrap` — usable in any non-KB repository on the machine, not just this one. Like `ki-bootstrap`, it is not a repository-governance root and has no `[ki-plan]` table.
- The thematic roadmap and file-oriented `ready`, `execute`, `accept`, `done`, `prune`, `new`, and `status` procedures are runtime-neutral; `ready` and the initial `execute` transition accept one or more explicit plan identifiers. Adapt interactive prompts to the host runtime. `promote` is runtime-only because it consumes a host Plan Mode hook state and session substitution.
