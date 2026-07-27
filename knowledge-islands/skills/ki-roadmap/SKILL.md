---
name: ki-roadmap
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
owns: ['ROADMAP.md']
description: >
  Governs repository roadmaps and execution plans in non-KB repositories. Use for "audit the roadmap", "split this roadmap by theme", "expand the roadmap", "audit plans", roadmap horizons, thematic roadmaps, qualified roadmap locators, transferred plan origins, plan dependencies, or generated portfolio drift. Supports a simple root-only ROADMAP and a thematic docs/roadmap tree with plans. Knowledge Bases are out of scope: use ki-kb-streams, where streams and proposal checklists replace repository roadmaps and plans. The ki-plan process skill drives individual plan lifecycle operations; ki-decision-records owns durable decisions.
argument-hint: 'audit <repo> | conform <repo> | expand <theme> | help | educate <repo> | refresh'
---

# Knowledge Islands repository roadmap standard

This governance skill owns the forward-work model for **non-KB projects**. Small projects use one root roadmap; projects needing focused workstreams use canonical thematic roadmaps and colocated plans. Knowledge Bases use the `ki-kb-streams` skill instead: a stream is the thematic roadmap, its proposals are roadmap items, and proposal checklists are plans. `ki-next` is the separate process skill that applies this skill's user-confirmed transition rules to select the next work; this governance skill has no process-skill dependency.

Read [the repository-roadmap standard](references/standards-repository-roadmaps.md) before changing a roadmap profile or plan structure. Read [the generated rubric](references/rubric.md) for the mechanical and judgment criteria. Plan file details live in [the plan-format standard](references/standards-plan-format.md). Tracked methodology sources and the REFRESH cadence live in [the source list](references/sources.md).

## Shared model

The standard has two profiles, detected from repository shape:

- **Simple** — root `ROADMAP.md` is canonical and carries the five horizons. It has no plan files. A substantial item that needs a plan first moves to the thematic profile through EXPAND.
- **Thematic** — each `docs/roadmap/<theme>/ROADMAP.md` is canonical. Its active and retained done plans live in `docs/roadmap/<theme>/plans/`; root `ROADMAP.md` is an exact generated portfolio projection.

An item has one authoritative home. Every roadmap carries the standard's exact explanatory blurb immediately beneath each horizon heading so its placement model is understandable in the file itself. In the thematic profile an item's stable locator is `<theme>/<item-slug>`, where the slug derives from the item heading. Every theme declares a stable uppercase code, and plan ids use that code plus a serial from `001`: `<THEME>-<NNN>`. That globally unique identifier is also used by dependencies. Ordinary plans exist only for `Blocking` and `Next` items. An open plan with a non-empty `transferred-from` origin may preserve transferred detail at another honest horizon, but it cannot advance there.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** plus judgment-led **EXPAND**. Invoked as `help` / `-h` / `?`, it emits generated HELP and stops. With no recognised mode, it emits the same HELP and, only in an interactive session, offers the mode choice and prompts for the target shown in `argument-hint`.

### Mode AUDIT

Run `ki repo audit --skill ki-roadmap --repo <repo>`. The catalogue detects the profile and applies the mechanical criteria in [the generated rubric](references/rubric.md): horizon structure and exact blurbs; theme and item identity; qualified plan linkage; frontmatter, placement, stable theme-coded ids, identifier references, and dependency integrity; and the exact generated root projection. It reports KB scope as not applicable, or FAIL when a KB carries repository-roadmap artifacts, and makes no changes.

Then apply the rubric's judgment criteria by reading: item quality, horizon placement and transition readiness, plan quality, honest in-progress state, whether simple still fits, and whether theme boundaries are coherent. Where `+/_HANDOFFS/` exists, identify material that needs a local adoption decision; where `-/_HANDOFFS/` exists, identify known receiving-repository progress that needs a local follow-up or closure decision. Report proposed roadmap action only: never infer remote acceptance, move working material, or edit either repository's roadmap. Iterate until mechanical findings are clean and judgment findings are resolved.

After changing the catalogue or contexts, run their colocated Bun tests for the focused profile, projection, locator, dependency, KB, and safe-draft fixtures.

### Mode CONFORM

Run `ki repo conform --skill ki-roadmap --repo <repo> --dry-run` to inspect the proposal. In either profile the ROAD-4 action inserts any missing canonical horizon blurb immediately beneath its heading, preserving all existing authored content. In a valid thematic profile PLAN-2 repairs derivable local plan references and PROJ-1 rebuilds the root projection. Ordered actions update one session-owned draft per file, and the session emits each final replacement once; the host validates and publishes the transaction. Delete the retired `docs/roadmap/README.md` or an empty theme explicitly after review because those removals are not replacement-safe conform actions. CONFORM never invents themes, moves horizons, removes or rewrites authored prose, repairs ambiguous locators, or changes plan content. Re-run AUDIT afterward.

### Mode EXPAND

EXPAND is judgment-led because selecting coherent themes and moving prose cannot be derived safely.

1. Read the simple `ROADMAP.md`; choose one kebab-case theme and identify whole items that belong to it without splitting their prose.
2. Create `docs/roadmap/<theme>/ROADMAP.md` with all five horizons and move those items, preserving horizon, heading, and prose byte-for-byte where practical.
3. Repeat until every open item has exactly one thematic home. Create no ordinary plan unless a `Blocking` or `Next` item needs multi-file or multi-step execution; preserving already-transferred detail is the narrow open-plan exception defined by the plan-format standard.
4. Delete the legacy generated `docs/roadmap/README.md`, then run CONFORM to replace root `ROADMAP.md` with the portfolio projection.
5. Run AUDIT; confirm no item was lost or duplicated. Commit the migration as one reviewable change.

There is no automatic collapse operation: merging themes back into one authored roadmap requires the same content judgment and is a deliberate migration.

### Mode EDUCATE

Run `ki repo educate --skill ki-roadmap --repo <repo>` to render the catalogue's concern and families. To establish a new non-KB repository, scaffold the simple profile only when `ROADMAP.md` and `docs/roadmap/` are both absent; use every canonical horizon and blurb. In a KB, use the `ki-kb-streams` skill and create no repository-roadmap artifact.

### Mode REFRESH

**Precondition:** REFRESH writes only the canonical skill files in `ki-agentic-harness`. If invoked from an installed copy, stop and redirect to that harness; route recurring base-specific pressure through the `ki-kb` IMPROVE mode.

On the cadence in [the source list](references/sources.md), compare actual repository-roadmap usage with [the repository-roadmap standard](references/standards-repository-roadmaps.md), [the plan-format standard](references/standards-plan-format.md), and [the generated rubric](references/rubric.md). Revisit the horizon model, simple-to-thematic threshold, locator stability, projection usefulness, and plan quality bar. Update the source review dates and explain normative changes in the commit.

## Notes

- Not every change needs a plan. A focused single-file or one-step fix can execute directly.
- Exploration needs no plan; multi-file or multi-step implementation does.
- A plan answers “how”; a Decision Record answers “why”. Use `ki-decision-records` for the latter.
- The `ki-plan` process skill operates plan instances. This skill owns their standard and repository-roadmap representation.
- The `ki-next` process skill selects and promotes work through the readiness contract defined here. It gathers confirmation and invokes `ki-plan`; it does not alter this skill's ownership of horizons, profiles, or plan format.
- The local `scripts/shared/rubric.ts` is the materialised compile-time contract from `ki-skills`; generic execution, findings, progress, transaction safety, rollback, and reporting belong to `ki`.
