# KI-wide frontmatter standard

**Refresh:** structure · annually

The authoritative definition of frontmatter fields for all notes in a Knowledge Islands base. Any skill that reads or writes KB notes follows this standard. Instrument-specific fields (e.g. `decision_type` for DRs) are defined by the skills that introduce them and documented here only as dependent fields.

## Contents

- [Universal fields](#universal-fields)
- [Type taxonomy](#type-taxonomy) — Admin · Outbound staging · Calendar · Resources · Streams · Pillars
- [Dependent fields](#dependent-fields)

## Universal fields

| Field      | Required (KB repos) | Description                                                                                                        |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `type`     | Yes                 | The note's **kind** (sole classifier); location-constrained — see taxonomy below                                   |
| `updated`  | Recommended         | Timestamp of the last substantive change, `YYYY-MM-DDTHH:MM:SSZ`                                                   |
| `reviewed` | Recommended         | Timestamp of the last human review; a note is **stale** when `reviewed` is absent or earlier than `updated`        |
| `created`  | Optional            | Timestamp set once on creation; never changed                                                                      |
| `status`   | Type-specific       | Set by the note's `type` where it has a lifecycle/state, not universal†                                            |
| `tags`     | Optional            | Topical / temporal / source labels (`topic/*`, `date/*`, `source/*`) — retained, but never the **kind** classifier |
| `author`   | Recommended         | `Written with Claude` / `Manual` / `Mixed`                                                                         |

† For example, `ki-kb-activities` uses `active` / `inactive`.

**Freshness** is carried by the timestamps, not by `status`: a note is current while `reviewed` is at or after its last `updated`, and goes stale once `updated` moves ahead of `reviewed` (or `reviewed` is absent). `status` is reserved for a `type`'s own lifecycle where it has one — for example `ki-kb-activities` uses `active` / `inactive`.

## Type taxonomy

`type` is a note's sole **kind** classifier — what it _is_, not what it is _about_. `tags` carry the _about_ (topical, temporal, and source labels — `topic/*`, `date/*`, `source/*`) and never classify kind; where a base encoded kind in a `card/*` tag (a Collection Card — a person, organisation, concept, or index note), that `card/*` tag maps to `type:`. `type` is **location-constrained**: a registry pairs path-patterns with the types valid at them, so a `type` can be checked against — and often inferred from — where the note lives. The relationship is not strictly one-to-one: a type may be valid at more than one location, and some locations admit more than one type, so the registry expresses _which types are valid where_ rather than a single forced mapping. The fixed contract is the **pattern** — `type` is declared and location-constrained — not any particular slug or notation; the slug vocabulary below is the current taxonomy and may grow.

The slugs use slash-hierarchical notation: `<zone>/<arm>/<leaf>`. The zone prefix identifies the KI zone; subsequent segments identify the structural role within that zone.

### Admin branch (`admin/`)

| Type                          | Path context                                              | Defined by            |
| ----------------------------- | --------------------------------------------------------- | --------------------- |
| `admin/zone`                  | `Admin/Admin.md` (zone root)                              | `ki-kb`               |
| `admin/index`                 | Area index notes (`Admin/Governance/Governance.md`, etc.) | `ki-kb`               |
| `admin/governance/decision`   | `Admin/Governance/Decisions/*.md`                         | `ki-decision-records` |
| `admin/governance/convention` | `Admin/Governance/Conventions/**/*`                       | TBD                   |
| `admin/governance/policy`     | `Admin/Governance/Policies/**/*`                          | TBD                   |
| `admin/governance/template`   | `Admin/Governance/Templates/**/*`                         | TBD                   |
| `admin/operations/process`    | `Admin/Operations/Processes/**/*`                         | TBD                   |
| `admin/operations/activity`   | `Admin/Operations/Activities/**/*`                        | `ki-kb-activities`    |
| `admin/operations/skill`      | `Admin/Operations/Skills/**/*`                            | TBD                   |

`Admin/Operations/Activities/` is governed by `ki-kb-activities` and `Admin/Operations/Live Artifacts/` by `ki-kb-live-artifacts`. Both currently define their notes with skill-specific frontmatter — `status` + `realization` and `status` + `renders` respectively — rather than the `type:` node_type used elsewhere in this table, so Live Artifacts has no row above; bringing them onto a `type:` field (and adding an `admin/operations/live-artifact` row) is an open reconciliation. The remaining `TBD` rows have no governing skill yet.

### Outbound staging (`-/`)

These types are only valid under `-/`. Files carrying them elsewhere are a ZONE-5 FAIL (see audit rubric).

| Type             | Path context       | Lifecycle                                                                | Defined by |
| ---------------- | ------------------ | ------------------------------------------------------------------------ | ---------- |
| `session-digest` | `-/_DIGESTS/*.md`  | Ephemeral. Delete once content is extracted into Pillars/Streams/handoff | `ki-kb`    |
| `handoff`        | `-/_HANDOFFS/*.md` | Ephemeral. Delete once recipient has routed it through their `+/`        | `ki-kb`    |

### Calendar branch (`calendar/`)

Time-stamped records; the kind is the temporal grain. Governed by `ki-kb`.

| Type               | Path context                                          | Defined by |
| ------------------ | ----------------------------------------------------- | ---------- |
| `calendar/index`   | Year / month index notes (`Calendar/<YYYY>/…`)        | `ki-kb`    |
| `calendar/daily`   | A day note (`Calendar/<YYYY>/<month>/<YYYY-MM-DD> …`) | `ki-kb`    |
| `calendar/weekly`  | A weekly review                                       | `ki-kb`    |
| `calendar/monthly` | A monthly summary                                     | `ki-kb`    |
| `calendar/meeting` | A meeting note                                        | `ki-kb`    |
| `calendar/session` | An AI-assisted work-session note                      | `ki-kb`    |

### Resources branch (`resources/`)

External reference material. The kinds below are the cross-base **core**; a base may declare finer entity kinds (`resources/book`, `resources/location`, …) under its own config. Governed by `ki-kb`.

| Type                | Path context                          | Defined by |
| ------------------- | ------------------------------------- | ---------- |
| `resources/index`   | Area index notes (`Resources/…/….md`) | `ki-kb`    |
| `resources/note`    | A general reference note              | `ki-kb`    |
| `resources/person`  | A person reference                    | `ki-kb`    |
| `resources/org`     | An organisation reference             | `ki-kb`    |
| `resources/concept` | A concept reference                   | `ki-kb`    |

### Streams branch (`streams/`)

The `Streams` zone's internal structure is owned by `ki-kb-streams`; these are its note kinds.

| Type               | Path context                                     | Defined by      |
| ------------------ | ------------------------------------------------ | --------------- |
| `streams/zone`     | `Streams/Streams.md` (zone root)                 | `ki-kb-streams` |
| `streams/focus`    | A focus / lifecycle-folder summary (`Active`, …) | `ki-kb-streams` |
| `streams/proposal` | A workstream proposal (the enactment unit)       | `ki-kb-streams` |
| `streams/note`     | A working note within a stream                   | `ki-kb-streams` |

### Pillars branch (`pillars/`) — stub

Defined as the Pillars zone is built out.

## Dependent fields

Some `type` values require additional fields, defined by the skill that owns that type:

| `type`                      | Additional required field | Valid values                                                        | Defined by            |
| --------------------------- | ------------------------- | ------------------------------------------------------------------- | --------------------- |
| `admin/governance/decision` | `decision_type`           | nine decision domains‡                                              | `ki-decision-records` |
| `calendar/daily`            | `day_type`                | work-day / weekend / bank-holiday / annual-leave (open enumeration) | `ki-kb`               |
| `streams/proposal`          | `status`                  | the Streams proposal lifecycle (values owned by `ki-kb-streams`)    | `ki-kb-streams`       |
| `streams/proposal`          | `priority`                | `urgent` / `high` / `medium` / `low`                                | `ki-kb-streams`       |
| `streams/proposal`          | `dependencies`            | list of blocking stream names (`[]` when none)                      | `ki-kb-streams`       |

‡ strategy, product, architecture, data, security, operations, governance, research, knowledge.
