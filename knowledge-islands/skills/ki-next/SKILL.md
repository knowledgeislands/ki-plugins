---
name: ki-next
ki-depends-on: []
description: >
  Selects and prepares the most valuable next roadmap work in a non-KB repository: re-grounds the roadmap, triages inbound handoffs, optionally reviews relevance, replenishes an empty immediate queue through user-confirmed horizon promotions, and creates review-first governed plans through `ki-plan`. A process skill (kind: process, ADR-KI-HARNESS-SKILLS-006): it applies the transition rules owned by `ki-roadmap`; it does not hold a separate roadmap standard. Installable globally, cross-repo — usable in any non-KB repository on the machine. Triggers: "what should we do next", "pick the next roadmap item", "plan the next work", "/ki-next". Not a session recap (`ki-recap`), a roadmap checker or horizon authority (`ki-roadmap`), or an individual plan lifecycle (`ki-plan`).
argument-hint: 'next [--review] | help'
---

# ki-next

**Kind:** process. Selects the next portfolio work and orchestrates its confirmed promotion into governed plans. The full procedure and scenarios are in [the next-work standard](references/standards-next-work.md).

## What this skill does

`ki-next` turns a fresh roadmap read into a small, user-confirmed planning queue.

1. **Ground** the current roadmap, profile, active-plan index, dependency graph, and inbound handoff inbox. Stop on mechanical drift; this process never repairs it as a side effect.
2. **Triage** unreviewed or review-triggered incoming handoffs through a separately confirmed local disposition; dormant parked or clarify material is acknowledged and skipped.
3. **Review** relevance when asked or when a stale signal is evident. It may identify obsolete, duplicated, already-planned, or newly-unblocked work, but presents every change as a proposal.
4. **Select** eligible, dependency-ready Blocking and Next work first. If neither horizon supplies work, it evaluates Soon; only after confirmation does it promote selected ready work to Next and evaluate it again there. If Soon supplies none, it scopes a selected Future candidate only enough to enter Soon, confirms that authored move, and then evaluates the new stage before any later promotion.
5. **Plan** only confirmed Blocking or Next work, through `ki-plan`, and stop for review after creating or revising each plan.

## Relationship map

```text
ki-recap (optional, current-session context)
  └─> ki-next (portfolio selection and promotion)
        └─> ki-plan (one plan lifecycle)

ki-roadmap governs horizon meaning, readiness, transitions, profiles, and plan format.
It has no dependency back on any process skill.
```

`ki-recap` is optional: `ki-next` works without it and never mines historical transcripts. The process skills are global invocation surfaces, not `.ki-config.toml` governance roots.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action. With no argument or `next`, run the full procedure. `--review` asks for the optional relevance pass before selection; it does not grant permission to change roadmap content.

## Notes

- No universal AUDIT/CONFORM/EDUCATE/REFRESH modes — this is a process skill (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006), not a roadmap standard or checker.
- No roadmap or plan write occurs until the user explicitly confirms the selected item, order, wording, and horizon transition. Rejected proposals leave the files untouched.
- The transition rules belong to `ki-roadmap`; `ki-next` applies them consistently. `ki-plan` owns individual-plan creation, execution, and closure.
- Installed as a core user skill by `ki bootstrap`, alongside `ki-bootstrap`, `ki-recap`, `ki-plan`, and `ki-delegate`. It is not a repository-governance root and has no `[ki-next]` table.
