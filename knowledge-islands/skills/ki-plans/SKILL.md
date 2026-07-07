---
name: ki-plans
description: >
  Govern the Knowledge Islands planning methodology for code repos: when to write a plan, how it derives from the ROADMAP, dependency discipline, and plan quality. Owns the mandate (plan before code for multi-file or multi-step changes), the near-horizon principle (plans exist only for ROADMAP "Next" items), the blocks/blocked-by dependency graph, and the quality bar for Steps and Verify. AUDIT checks docs/plans for frontmatter, README sync, and dependency integrity; CONFORM fixes mechanical issues; REFRESH revisits the methodology. Does not own the plan lifecycle (new/execute/done/status) — that is the /plan slash command. A code-repo instrument: in a KB, planning is a stream proposal's Checklist (ki-kb-streams). Triggers: "audit plans", "are my plans in order", "should I write a plan for this", "plan methodology". Off-ramps: /plan (lifecycle), ki-kb-streams (KB planning), ki-decision-records (decisions vs. plans), ki-harness (ROADMAP structure and phasing).
argument-hint: 'audit [dir] | conform [dir] | refresh'
---

# Knowledge Islands Plans standard

You are applying the **Knowledge Islands Plans standard** — when to plan, how a plan derives from the ROADMAP, how dependencies flow, and what a good plan looks like. This skill owns the _methodology_. The plan format (frontmatter, sections, filename, index) lives in [references/plan-format.md](references/plan-format.md) as its single source of truth; the `/plan` slash command drives the lifecycle. Neither restates the other.

Plans are a **code-repo instrument.** In a Knowledge Islands KB the plan already exists and is already governed: a stream proposal's `## Checklist` is the ordered rollout plan, `## Open Questions` are the blockers, Focus `Active` is the near-horizon signal, and the Enactment Process is the lifecycle. That is entirely `ki-kb-streams`. This skill owns no KB artifact — run in a KB, it points at `ki-kb-streams` and stops.

## What this skill owns

1. **The mandate** — any multi-file or multi-step change in a code repo requires a plan file before code is touched. A plan is the recoverable, dependency-ordered record that survives context resets and handoffs. Not every change needs one (see Notes).
2. **The near-horizon principle** — plans exist only for the nearest horizon: ROADMAP "Next" items. `Soon` and `Future` are ROADMAP lines with no plan detail. A plan is written when an item enters "Next"; it is deleted when the item lands. This keeps the plans directory small and the ROADMAP the single forward-view — no duplicated phase tables.
3. **Roadmap linkage and closure** — every plan carries a `roadmap:` field naming the item it executes and is filed under that item's theme folder. Because ROADMAP is open-only (removed-when-done, per `ki-harness`), closing a plan also removes its ROADMAP line — one motion.
4. **Dependency discipline** — `blocks` and `blocked-by` are bidirectional and consistent: if A blocks B, B's `blocked-by` lists A. The dependency graph in `README.md` is the authoritative execution order. No plan may move to `in-progress` before its blockers are `done`.
5. **The quality bar** — see [Plan quality bar](#plan-quality-bar). Four non-negotiables: concrete Steps, a checkable Verify, an honest Current state, a minimal Files touched.
6. **Placement** — `docs/plans/<theme>/<NNN>-<slug>.md`, global three-digit ids; theme folder matches a ROADMAP section. Format detail in [references/plan-format.md](references/plan-format.md).
7. **The index rule** — `docs/plans/README.md` is a flat active index (one row per plan on disk) plus a dependency graph, always in sync: every file has a row, every row has a file.
8. **Plans vs. Decision Records** — a plan answers "how do we execute this?" with ordered steps; a DR answers "why did we decide this?" with context and consequences. A DR may precede a plan, or a plan may reference a DR. Use `ki-decision-records` for the latter.

## Plan quality bar

A plan is ready to execute when it passes these four checks:

**Steps are concrete** — each step names a specific action (Read X, Write Y, Run Z). Vague steps like "handle the edge cases" are scope that needs decomposing, not steps. If a step can't be checked off by inspection, rewrite it.

**Verify is checkable** — the Verify section is a pass/fail test, not a description of intent. "Run `bun run ki:verify` and confirm exit 0" is checkable; "make sure everything works" is not.

**Current state is honest** — the Current state section records what is actually true today, gaps included. It is the baseline the steps depart from, not an aspiration.

**Files touched is minimal** — the files the plan expects to change, not every file and not a guess. This anchors scope and makes drift visible during execution.

## Operating modes

Carries the universal **AUDIT · CONFORM · REFRESH**. If invoked without a mode, use `AskUserQuestion` to list each mode with a one-line description; if the chosen mode shows a target in the `argument-hint`, prompt for that too.

### Mode AUDIT

Check that a code repo's plans are methodologically sound and mechanically consistent. In a KB (`repo_type = "kb"` in `.ki-config.toml`), there is no `docs/plans/` — report that KB planning is governed by `ki-kb-streams` and stop.

The mechanical half is [`scripts/audit-plans.ts`](scripts/audit-plans.ts) — run `bun run ki:plans:audit` (or `bun skills/ki-plans/scripts/audit-plans.ts docs/plans`). It checks:

1. **Frontmatter** — each `*.md` under a theme folder (excluding `README.md`) has `id`, `title`, `status`, `roadmap`, `blocks`, `blocked-by`; `status` ∈ {open, in-progress, done}; `id` is a global, zero-padded, three-digit string, unique across themes; **no `phase` field**.
2. **Placement** — files sit at `docs/plans/<theme>/<NNN>-<slug>.md`; the filename id matches the frontmatter `id`.
3. **Index sync** — every plan file has a row in `README.md` (matched by id); every row has a file.
4. **Dependency integrity** — every `blocks` / `blocked-by` id exists; reverse links are consistent; no cycles.

Then apply the judgment half by reading: **roadmap-link validity** (does the `roadmap:` item exist in ROADMAP's "Next"? — near-horizon compliance), **quality bar** on each `in-progress` plan (concrete Steps, checkable Verify), and a **zombie check** (an `in-progress` plan with no recent commits touching it). The checker surfaces these as ADVISORY. Report on the severity ladder in `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).

### Mode CONFORM

Fix mechanical FAIL and WARN found in AUDIT, in order:

1. Add or correct missing frontmatter fields (infer where unambiguous; ask if not). Remove any stray `phase` field.
2. Rebuild `README.md` rows from files on disk (flat index).
3. Repair broken dependency references (add missing reverse links; drop references to non-existent plans).
4. Rebuild the dependency graph from the corrected `blocks` / `blocked-by`.
5. Commit with message `fix(plans): conform to plans standard`.

Do not change plan content (Context, Current state, Steps) — those belong to the author. CONFORM touches only structure and metadata.

### Mode REFRESH

Revisit the methodology against current practice:

1. Check whether the near-horizon principle still matches how work flows from ROADMAP into plans.
2. Review whether the quality bar needs sharpening based on patterns seen in real plans.
3. Confirm the placement and roadmap-linkage rules still hold against `ki-harness`'s ROADMAP standard.
4. Update this `SKILL.md` (and [references/plan-format.md](references/plan-format.md) if the format itself moved). Summarise what changed and why in the commit message.

## Notes

- **Not every change needs a plan.** Single-file fixes, typo corrections, and one-step config tweaks do not warrant a plan file. The mandate is for multi-file or multi-step changes.
- **Plan before commit, not plan before thought.** Exploration and research need no plan. A plan is written when scope is clear and implementation is about to begin.
- **Plans are not tickets.** A plan is a self-contained execution document, not a backlog row. It carries enough context to pick up cold after a context reset.
- **KBs plan through `ki-kb-streams`.** In a KB, the proposal's `## Checklist` is the plan and must meet this skill's quality bar — but the artifact and its lifecycle are `ki-kb-streams`, not a `docs/plans/` file. There is no `Streams/<name>/plans/` directory.
- **The `/plan` command is the tool; this skill is the standard.** "How should I structure this plan?" or "audit my plans" → this skill. `/plan new` → the command doing the mechanical work against [references/plan-format.md](references/plan-format.md).
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).
