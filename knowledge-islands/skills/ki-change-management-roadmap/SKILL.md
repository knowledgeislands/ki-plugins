---
name: ki-change-management-roadmap
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
owns: ['ROADMAP.md']
description: >
  Governs flat repository work items and their concise root orientation in non-KB repositories. Use for "audit the roadmap", "audit plans", roadmap horizons, theme grouping, work-item identity, lifecycle detail, plan dependencies, or root-orientation drift. Every repository work item lives directly under docs/roadmap and gains detail in place as it moves from draft through readiness, delivery, required review, and retained completion. Knowledge Bases use ki-repo-kb-streams as the matching adapter. Process skills apply the shared lifecycle; ki-decision-records owns durable decisions.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands repository roadmap standard

This governance skill owns the forward-work model for **non-KB projects**. Every repository has flat canonical work items directly under `docs/roadmap/` and one concise root orientation file. Each work item carries a theme field so related work can form a coherent project without needing its own physical subtree. Knowledge Bases use `ki-repo-kb-streams` instead: a stream is the thematic roadmap and proposal checklists are plans. `ki-next` is the separate process skill that applies this skill's user-confirmed transition rules to select the next work; this governance skill has no process-skill dependency.

Read [the repository-roadmap standard](references/standards-repository-roadmaps.md) before changing a roadmap shape or lifecycle. Read [the generated rubric](references/rubric.md) for the mechanical and judgment criteria. Work-item details live in [the work-item-format standard](references/standards-work-item-format.md). Tracked methodology sources and the REFRESH cadence live in [the source list](references/sources.md).

## Shared model

`ROADMAP.md` is a concise orientation: it points to `docs/roadmap/` and deliberately repeats no queue information. Each canonical item is a single file at `docs/roadmap/<REPO>-<NNN>-<slug>.md`, beginning with a mandatory plain-language Goal before its technical context. `docs/roadmap/_ISSUES.md` retains the project-scoped issue-number high-water mark, so an issued number is never reused after pruning. The item’s `theme` field groups related work for CLI reporting; the `horizon` field establishes queue position; and `status` records the common `draft` → `ready` → `in-progress` → `awaiting-review` → `done` lifecycle. A concise item becomes an execution plan by gaining task-list plan sections in the same file: new work starts `- [ ]`, and completed work becomes `- [x]`. The `ki-repo` table declares the stable uppercase `repo_code`; the `ki-change-management-roadmap` table declares the allowed theme names. The globally unique identifier is also used by dependencies.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. Invoked as `help` / `-h` / `?`, it emits generated HELP and stops. With no recognised mode, it emits the same HELP and, only in an interactive session, offers the mode choice and prompts for the target shown in `argument-hint`.

### Mode AUDIT

Run `ki repo audit --skill ki-change-management-roadmap --repo <repo>`. The catalogue applies the mechanical criteria in [the generated rubric](references/rubric.md): concise root orientation; configured theme vocabulary; work-item placement, frontmatter, identity, theme grouping, lifecycle, and dependency integrity. It reports KB scope as not applicable, or FAIL when a KB carries repository-roadmap artifacts, and makes no changes.

Then apply the rubric's judgment criteria by reading: item quality, horizon placement and transition readiness, stage-appropriate detail, final topic-oriented Discussion, honest lifecycle state, and theme coherence. Where declared `ki-repo-trades` records exist, identify inbound submissions that need receiver review, outbound records with observable receiver progress that may warrant local follow-up, trade-aware Waiting-for conditions, and completion-observation references that prevent pruning a done item. Report structural or proposed local roadmap action only: never set a trade disposition, infer adoption or acceptance, move or prune a record, prioritize work, or edit another repository's state. Iterate until mechanical findings are clean and judgment findings are resolved.

After changing the catalogue or contexts, run their colocated Bun tests for item identity, frontmatter, horizon, dependency, root orientation, KB, and safe-draft fixtures.

### Mode CONFORM

Run `ki repo conform --skill ki-change-management-roadmap --repo <repo> --dry-run` to inspect the proposal. In a valid repository, CONFORM repairs the concise root orientation and scaffolds a missing `docs/roadmap/_ISSUES.md` ledger from the highest retained issue number. It never overwrites a malformed ledger, invents work items, moves horizons, removes or rewrites authored prose, reallocates identifiers, or changes lifecycle content. Re-run AUDIT afterward.

### Mode EDUCATE

Run `ki repo educate --skill ki-change-management-roadmap --repo <repo>` to render the catalogue's concern and families. To establish a new non-KB repository, scaffold the root orientation only when `ROADMAP.md` and `docs/roadmap/` are both absent. In a KB, use the `ki-repo-kb-streams` skill and create no repository-roadmap artifact.

### Mode REFRESH

**Precondition:** REFRESH writes only the canonical skill files in `ki-agentic-harness`. If invoked from an installed copy, stop and redirect to that harness; route recurring base-specific pressure through the `ki-repo-kb` IMPROVE mode.

On the cadence in [the source list](references/sources.md), compare actual repository-roadmap usage with [the repository-roadmap standard](references/standards-repository-roadmaps.md), [the work-item-format standard](references/standards-work-item-format.md), and [the generated rubric](references/rubric.md). Revisit the horizon model, item identity, theme grouping, CLI reporting, and execution quality bar. Update the source review dates and explain normative changes in the commit.

## Notes

- Not every change needs a plan. A focused single-file or one-step fix can execute directly.
- Exploration needs no plan; multi-file or multi-step implementation enriches its item before execution.
- A plan answers “how”; a Decision Record answers “why”. Use `ki-decision-records` for the latter.
- The `ki-next` process skill selects and promotes work through the readiness contract defined here.
- The `ki-plan` process skill shapes an immediate draft through Ready.
- `ki-implement` owns Ready → In progress → Awaiting review; `ki-accept` owns Awaiting review → Done and pruning by explicit work-record path or glob.
- `ki-recap` and `ki-next` may recommend pruning; they never delete canonical work-item records.
- The local `scripts/shared/rubric.ts` is the materialised compile-time contract from `ki-skills`; generic execution, findings, progress, transaction safety, rollback, and reporting belong to `ki`.
