---
name: ki-project-roadmap
implies: []
vendors: [educate, audit, conform, help]
owns: ['ROADMAP.md', 'docs/roadmap/README.md']
description: >
  Governs project roadmaps and execution plans in non-KB repositories. Use for "audit the roadmap", "split this roadmap by theme", "expand the roadmap", "audit plans", roadmap horizons, thematic roadmaps, qualified roadmap locators, plan dependencies, or generated portfolio drift. Supports a simple root-only ROADMAP and a thematic docs/roadmap tree with plans. Knowledge Bases are out of scope: use ki-kb-streams, where streams and proposal checklists replace project roadmaps and plans. The ki-plan process skill drives individual plan lifecycle operations; ki-decision-records owns durable decisions.
argument-hint: 'audit <repo> | conform <repo> | expand <theme> | help | educate <repo> | refresh'
---

# Knowledge Islands project roadmap standard

This governance skill owns the forward-work model for **non-KB projects**. Small projects use one root roadmap; projects needing focused workstreams use canonical thematic roadmaps and colocated plans. Knowledge Bases use the `ki-kb-streams` skill instead: a stream is the thematic roadmap, its proposals are roadmap items, and proposal checklists are plans.

Read [the project-roadmap standard](references/project-roadmap-standard.md) before changing a roadmap profile or plan structure. Read [the audit rubric](references/audit-rubric.md) for the mechanical and judgment criteria. Plan file details live in [the plan format](references/plan-format.md). Tracked methodology sources and the REFRESH cadence live in [the source list](references/sources.md).

## Shared model

The standard has two profiles, detected from repository shape:

- **Simple** — root `ROADMAP.md` is canonical and carries the five horizons. It has no plan files. A substantial item that needs a plan first moves to the thematic profile through EXPAND.
- **Thematic** — each `docs/roadmap/<theme>/ROADMAP.md` is canonical. Its active plans live in `docs/roadmap/<theme>/plans/`; `docs/roadmap/README.md` is the global plan index and dependency graph; root `ROADMAP.md` is an exact generated portfolio projection.

An item has one authoritative home. Every roadmap carries the standard's exact explanatory blurb immediately beneath each horizon heading so its placement model is understandable in the file itself. In the thematic profile an item's stable locator is `<theme>/<item-slug>`, where the slug derives from the item heading. Numeric plan ids are local to a theme and begin at `001`; the canonical plan reference is the globally unambiguous `<theme>/<NNN>`, also used by dependencies. Plans exist only for `Blocking` and `Next` items.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** plus judgment-led **EXPAND**. Invoked as `help` / `-h` / `?`, it emits generated HELP and stops. With no recognised mode, it emits the same HELP and, only in an interactive session, offers the mode choice and prompts for the target shown in `argument-hint`.

### Mode AUDIT

Run [`scripts/audit.ts`](scripts/audit.ts) against the repository root. It detects the profile and applies the mechanical criteria in [the rubric](references/audit-rubric.md): horizon structure and exact blurbs; theme and item identity; qualified plan linkage; frontmatter, placement, theme-local ids, qualified references, and dependency integrity; exact generated projection and index. It reports KB scope as NA, or FAIL when a KB carries project-roadmap artifacts, and makes no changes.

Then apply the rubric's judgment criteria by reading: item quality and horizon choice, plan quality, honest in-progress state, whether simple still fits, and whether theme boundaries are coherent. Iterate until mechanical findings are clean and judgment findings are resolved.

After changing the scripts, run [`scripts/project-roadmap.test.ts`](scripts/project-roadmap.test.ts) for the focused profile, projection, locator, dependency, KB, and safe-write fixtures.

### Mode CONFORM

Run [`scripts/conform.ts`](scripts/conform.ts) against the repository root. In either profile it inserts any missing canonical horizon blurb immediately beneath its heading, preserving all existing authored content. In a valid thematic profile it also rebuilds the derivable root projection and global index/graph. Every write uses guarded atomic local-file replacement. It never invents themes, moves horizons, removes or rewrites authored prose, repairs ambiguous locators, or changes plan content. Use `--dry-run` to inspect the intended writes. Re-run AUDIT afterward.

### Mode EXPAND

EXPAND is judgment-led because selecting coherent themes and moving prose cannot be derived safely.

1. Read the simple `ROADMAP.md`; choose one kebab-case theme and identify whole items that belong to it without splitting their prose.
2. Create `docs/roadmap/<theme>/ROADMAP.md` with all five horizons and move those items, preserving horizon, heading, and prose byte-for-byte where practical.
3. Repeat until every open item has exactly one thematic home. Create no plan unless a `Blocking` or `Next` item needs multi-file or multi-step execution.
4. Run CONFORM to generate `docs/roadmap/README.md` and replace root `ROADMAP.md` with the portfolio projection.
5. Run AUDIT; confirm no item was lost or duplicated. Commit the migration as one reviewable change.

There is no automatic collapse operation: merging themes back into one authored roadmap requires the same content judgment and is a deliberate migration.

### Mode EDUCATE

Run [`scripts/educate.ts`](scripts/educate.ts) against a non-KB repository. It creates the simple profile, including every canonical horizon blurb, only when `ROADMAP.md` and `docs/roadmap/` are both absent; it never overwrites an existing roadmap. In a KB it reports the `ki-kb-streams` off-ramp and writes nothing.

### Mode REFRESH

**Precondition:** REFRESH writes only the canonical skill files in `ki-agentic-harness`. If invoked from a repo where the skill is vendored, stop and redirect to that harness; route recurring base-specific pressure through the `ki-kb` IMPROVE mode.

On the cadence in [the source list](references/sources.md), compare actual project-roadmap usage with [the standard](references/project-roadmap-standard.md) and [rubric](references/audit-rubric.md). Revisit the horizon model, simple-to-thematic threshold, locator stability, projection usefulness, and plan quality bar. Update the source review dates and explain normative changes in the commit.

## Notes

- Not every change needs a plan. A focused single-file or one-step fix can execute directly.
- Exploration needs no plan; multi-file or multi-step implementation does.
- A plan answers “how”; a Decision Record answers “why”. Use `ki-decision-records` for the latter.
- The `ki-plan` process skill operates plan instances. This skill owns their standard and project-roadmap representation.
- Checker output follows the severity ladder and JSON/report contract in `ki-engineering`.
