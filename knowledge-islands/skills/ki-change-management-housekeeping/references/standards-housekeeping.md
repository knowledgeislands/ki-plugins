# Housekeeping template standard

## Scope

This standard defines durable recurring-work templates. A template is not a roadmap item or a Stream proposal: it is the source from which `ki-next` may spawn one due run. The run uses the common forward-work lifecycle and carries the template identifier plus its scheduled date.

## Placement and identity

Non-KB repositories use one flat template directory:

```text
docs/housekeeping/
  <REPO>-HK-<NNN>-<slug>.md
```

Knowledge Bases use the dedicated Streams operational area:

```text
Streams/Housekeeping/
  Housekeeping.md
  <Name> Housekeeping.md
```

Every template has a stable `id` in `<REPO>-HK-<NNN>` form. Non-KB filenames repeat that identifier followed by a lowercase kebab-case slug. KB filenames follow the base's note naming convention, while their frontmatter retains the same identifier and `type: stream-housekeeping`.

## Frontmatter

```yaml
---
id: KI-HARNESS-HK-001
title: Monthly skills refresh
status: active
cadence: P1M
last-run: 2026-08-01
grace: P7D
spawn-policy: when-overdue
spawn-horizon: now
active-run: null
---
```

`status` is `active` or `paused`. Retiring a template means deleting it after its future schedule is deliberately ended; do not retain a `retired` marker.

`cadence` and `grace` are ISO-8601 calendar durations using one positive unit: `P<n>D`, `P<n>W`, or `P<n>M`. `last-run` is an ISO date or `null` for a newly introduced template. `active-run` is `null` or the linked run identity. `spawn-policy` is `manual`, `when-due`, or `when-overdue`; `spawn-horizon` is one of `now`, `next`, `soon`, `future`, `waiting-for`, or `parked`.

The body states the Goal, the check or maintenance Procedure, the evidence a successful run must record, and the condition that makes the template obsolete. It is a concise source record, not a history log.

## Due-run procedure

`ki-next` calculates `due = last-run + cadence`, and `overdue = due + grace`. A template with a non-null `active-run` remains ineligible until that linked run reaches `done` or is explicitly replaced.

| Condition               | `ki-next` action                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Not due                 | Ignore during ordinary selection.                                                          |
| Due, `manual`           | Present the proposed run and wait for confirmation.                                        |
| Due, `when-due`         | Create the linked `draft` run at `spawn-horizon`.                                          |
| Overdue, `when-overdue` | Create the linked `draft` run at `spawn-horizon`; use `now` when the template declares it. |
| Paused                  | Never create a run.                                                                        |

The new run records `housekeeping-template` and `scheduled-for`. It is otherwise an ordinary roadmap item. `ki-accept` updates `last-run` and clears `active-run` only after the run has completed review, become `done`, and been committed.

## KB adapter

`Streams/Housekeeping/` is a visible source area for recurring obligations. It contains templates, not a permanent pile of active work. A due run becomes a linked roadmap item in `Streams/Roadmap/`; its delivery horizon is frontmatter metadata. The base's change-management gate applies whenever the run changes a canonical KB zone.

## Retention

Completed runs are retained as `done` records in both adapters until `ki-accept prune` receives an explicit selection. A template retains date and immutable run evidence, not a dependency on the continued presence of an unpruned run file.
