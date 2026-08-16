---
name: ki-work-housekeeping
ki-kind: governance
ki-depends-on: []
contributes: ['.ki-config.toml']
description: >
  Governs recurring repository housekeeping templates: their placement, identity, cadence, last-run evidence, and safe due-run spawning through ki-next. Use for "add recurring maintenance", "define housekeeping", "audit housekeeping", or "create a monthly repository check". In a non-KB repository templates live in docs/housekeeping; in a Knowledge Base they live in Streams/Housekeeping. It does not perform runtime-specific state cleanup, which is ki-housekeeping-claude.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# Knowledge Islands housekeeping standard

**Kind:** governance. `ki-work-housekeeping` owns recurring-work templates, not the delivery of a particular run. The shared forward-work lifecycle is owned by `ki-work-roadmap`; `ki-repo-kb-streams` places KB records under `Streams/Roadmap/`. Read [the housekeeping template standard](references/standards-housekeeping.md) before creating or changing a template, [the generated rubric](references/rubric.md) for checkable criteria, and [the sources](references/sources.md) when refreshing this standard.

## Shared model

A housekeeping template is a durable instruction to create ordinary work when its cadence becomes due. It has a small lifecycle: `active` templates are evaluated, `paused` templates are retained but never spawn work, and a retired template is deleted. Due and overdue are calculated from `cadence`, `last-run`, and `grace`; they are not stored states.

In a non-KB repository templates live directly below `docs/housekeeping/`. In a KB, the equivalent template notes live at `Streams/Housekeeping/`; it is an operational area, not a delivery state. `ki-next` reads active templates and atomically creates a linked `draft` run at the template's declared horizon while setting `active-run`. The run then follows the common `draft` → `ready` → `in-progress` → `awaiting-review` → `done` lifecycle.

`ki-accept` records successful run evidence on the template only after the run is `done`. It never marks a template as run merely because a draft was created. An unfinished linked run prevents a duplicate spawn.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. `help` / `-h` / `?` explains the skill and stops; no recognised mode offers the same explanation and, only interactively, asks for a mode and target.

### Mode AUDIT

Run `ki repo audit --skill ki-work-housekeeping --repo <repo>`. It checks placement, safe regular-file shape, stable template identity, controlled state and scheduling fields, and the absence of a duplicate active run. Then review whether cadences, grace periods, spawn horizons, and procedures remain proportionate to the work they create.

### Mode CONFORM

Run `ki repo conform --skill ki-work-housekeeping --repo <repo> --dry-run`. CONFORM makes no schedule decision, creates no run, and never changes `last-run`; it may only apply a declared safe normalisation. Re-run AUDIT afterwards.

### Mode EDUCATE

Run `ki repo educate --skill ki-work-housekeeping --repo <repo>` to explain the local template root and the template format. It never invents a recurring obligation or creates a schedule without an explicit request.

### Mode REFRESH

**Precondition:** REFRESH writes only this skill's canonical files in `ki-agentic-harness`. From an installed copy, stop and redirect to that harness.

On the cadence in [the sources](references/sources.md), compare observed template use with [the housekeeping template standard](references/standards-housekeeping.md), the shared `ki-work-roadmap` lifecycle, and the `ki-repo-kb-streams` adapter. Update the source review and explain any normative change in the commit.

## Boundaries

- `ki-next` selects, promotes, defers, and spawns due work; this skill only defines its inputs.
- `ki-plan`, `ki-implement`, and `ki-accept` own the spawned run's readiness, delivery, review, closure, and later pruning.
- Runtime-specific state-hygiene skills may be named by a recurring template, but they do not own this template model.
- `Housekeeping` is a KB Streams operational area. It does not replace horizon metadata on the due roadmap run.

## Runtime binding

The portable template model does not inspect runtime state. The `ki-housekeeping-claude` off-ramp is explicitly Claude Code-specific and may be named by a template when its separate safety contract applies.
