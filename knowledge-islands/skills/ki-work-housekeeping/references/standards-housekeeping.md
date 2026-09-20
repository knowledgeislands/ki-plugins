# Housekeeping template standard

## Scope

This standard defines durable recurring-work templates. A template is not a roadmap item: it is the source from which `ki-next` may spawn one due run. The run uses the common forward-work lifecycle and carries the template identifier plus its scheduled date. Partition templates by independently runnable purpose and cost, not by every artifact type.

## Placement and identity

Non-KB repositories use one flat template directory, `docs/housekeeping/`, with filenames `<REPO>-HK-<NNN>-<slug>.md`. Knowledge Bases use the dedicated `Streams/Housekeeping/` operational area, with an orientation note `Housekeeping.md` and templates named `<Name> Housekeeping.md`.

Every template has a stable `id` in `<REPO>-HK-<NNN>` form. Non-KB filenames repeat that identifier followed by a lowercase kebab-case slug. KB filenames follow the base's note naming convention, while frontmatter retains the same identifier and `type: stream-housekeeping`.

## Frontmatter

```yaml
---
id: KI-HARNESS-HK-001
title: Engineering alignment
status: active
cadence: P1M
last-run: null
commit-threshold: 100
last-run-ref: null
grace: P7D
spawn-policy: when-overdue
spawn-horizon: now
active-run: null
---
```

`status` is `active` or `paused`. Retiring a template means deleting it after its future schedule is deliberately ended; do not retain a `retired` marker.

`cadence` and `grace` are ISO-8601 calendar durations using one positive unit: `P<n>D`, `P<n>W`, or `P<n>M`. `last-run` is the evidenced ISO date of the last successfully completed review, or `null` for a template without successful-run evidence. A future `last-run` is invalid completion evidence and blocks evaluation; it cannot postpone calendar review or enable volume-triggered work. `active-run` is `null` or the linked run identity. `spawn-policy` is `manual`, `when-due`, or `when-overdue`; `spawn-horizon` is one of `now`, `next`, `soon`, `future`, `waiting-for`, or `parked`.

Two optional fields enable change-volume scheduling without changing calendar-only templates:

- **`commit-threshold`** is a positive safe integer selected for this particular obligation. The example's 100 is not a global default. Omission disables the volume trigger.
- **`last-run-ref`** is the full lowercase 40- or 64-hexadecimal commit identity actually covered by the last successful review, or `null` when no verified anchor exists. A non-null value requires a non-null `last-run`. It is not the housekeeping run's implementation baseline, current HEAD, or acceptance commit unless the review evidence explicitly establishes that exact revision as reviewed. It may be retained on a calendar-only template for a later opt-in.

An opted-in threshold with an absent or null anchor is valid but its volume is unknown. Do not infer an anchor from a date, silently use current HEAD, or backfill a historical date. Existing `last-run` values recorded under the former scheduled-date convention remain historical evidence; future accepted runs record the actual successful completion date. A broadened template discloses the narrower scope of any retained prior review.

The body has non-empty `## Goal`, `## Procedure`, `## Successful-run evidence`, and `## Obsolescence` sections. It is a concise source record, not a history log.

AUDIT accepts only regular Markdown files below the selected root. It checks required and optional frontmatter fields, valid calendar dates, non-KB filename identity, KB note naming plus `type: stream-housekeeping`, and required body sections. An `active-run` must resolve to exactly one unfinished local roadmap record which names the template in `housekeeping_template` and has a valid `scheduled_for` date. No two templates may name the same active run.

## Due-run procedure

The calendar boundary is `last-run + cadence`; the overdue boundary adds `grace`. Calendar-month arithmetic clamps to the last valid day of the destination month. A template without any successful `last-run` is due immediately: either automatic policy may spawn its initial run, while `manual` still requires confirmation. Do not slide its initial grace window forward on every evaluation.

The optional volume boundary is reached when the number of first-parent integration commits after `last-run-ref` is at least `commit-threshold`. A merge counts once, not once for every commit on its merged branch; linear or fast-forward commits each count once. Either calendar or volume can make a template due. Reached volume bypasses calendar grace, including for `when-overdue`, but never bypasses `manual`, `paused`, or `active-run`.

Volume evidence requires the exact anchor on the current HEAD's first-parent history in the selected working-copy root. Missing, divergent, rewritten, grafted, shallow, incomplete, moving, or unavailable history remains unknown, never zero. Reads use fixed argument arrays, disable optional Git locks, replacement objects and lazy fetch, and never fetch or mutate repository state. An independently reached calendar boundary remains actionable when volume is unknown; report the uncertainty separately.

The read-only callable [schedule evaluator](../scripts/rubric/contexts/schedule.ts), `evaluateHousekeepingSchedule({ repository, schedule, today })`, is the owner implementation used by hosted `HOUSE-2` diagnostics and by the `ki-next` process caller. `today` is an explicit UTC ISO date. Map template keys to `lastRun`, `commitThreshold`, `lastRunRef`, `spawnPolicy`, and `activeRun` in its typed schedule input; status, cadence, and grace retain their names. The result carries `action`, `due`, calendar boundaries, `scheduledFor`, contributing `triggers`, structured `commits` evidence, and `writes: false`. This is a domain capability, not another command, scheduler, or private CLI.

- **`ignore`**: neither trigger permits spawning yet, including an unelapsed calendar grace period.
- **`propose`**: a due manual template requires exact human confirmation.
- **`spawn`**: the declared automatic policy permits one draft; this evaluator itself writes nothing.
- **`blocked`**: paused, already reserved by an active run, or invalid schedule input.
- **`unknown`**: unavailable volume evidence prevents deciding eligibility, with no independently actionable calendar boundary.

After fresh grounding, `ki-next` consumes this result and rechecks the active reservation before any write. For a calendar-due run, `scheduled_for` is the calendar due date; for volume-only or initial runs it is the evaluation date. A non-null `active-run` prevents another spawn. Spawning atomically creates the linked ordinary `draft` at `spawn-horizon` and sets `active-run`, without changing either successful-run field. Manual confirmation authorises only that draft, not implementation or acceptance.

Only `ki-accept`, as part of one coherent approved closure and template-reconciliation commit, changes the run to `done`, records the evidenced actual completion date in `last-run`, records the verified reviewed revision in `last-run-ref`, and clears `active-run`. Do not first commit a `done` run with a stale active reservation; a prior committed `done` state is required only before later pruning. For a commit-triggered template, unavailable reviewed-revision evidence blocks that success reconciliation; never manufacture the anchor. Calendar-only templates may retain a null anchor. The run's original `scheduled_for` remains unchanged and is no longer copied into `last-run`.

Failed, abandoned, or superseded runs do not advance either successful-run field and retain `active-run` until an explicit disposition or replacement. Disposition clears only the link; replacement atomically substitutes a verified linked identity without changing successful-run evidence. This skill owns the template-side state machine; it performs neither process transition.

## KB adapter

`Streams/Housekeeping/` is a visible source area for recurring obligations, not a permanent pile of active work. A due run becomes a linked item in `Streams/Roadmap/`; its delivery horizon is frontmatter metadata. The base's change-management gate applies whenever the run changes a canonical KB zone.

## Retention

Completed runs are retained as `done` records in both adapters until `ki-accept prune` receives an explicit selection. A template retains date and immutable review evidence, not a dependency on the continued presence of an unpruned run file. Lightweight working-area tidying remains subject to each specialist area's retention policy; recurring review does not confer general deletion authority.
