# Knowledge Islands frontmatter standard

**Refresh:** structure · annually

The authoritative definition of frontmatter fields for all notes in a Knowledge Islands base. Any skill that reads or writes KB notes follows this standard. Instrument-specific fields (e.g. `decision_type` for DRs) are defined by the skills that introduce them and documented here only as dependent fields.

## Contents

- [Universal fields](#universal-fields)
- [Note-type taxonomy](#note-type-taxonomy) — Admin · Outbound staging · Calendar · Resources · Streams · Pillars
- [Dependent fields](#dependent-fields)

## Universal fields

| Field | Required (KB repos) | Description |
| --- | --- | --- |
| `note_type` | Yes | The note's **kind** (sole classifier); location-constrained — see taxonomy below |
| `updated` | Recommended | Timestamp of the last substantive change, `YYYY-MM-DDTHH:MM:SSZ` |
| `reviewed` | Recommended | Timestamp of the last human review; a note is **stale** when `reviewed` is absent or earlier than `updated` |
| `created` | Optional | Timestamp set once on creation; never changed |
| `status` | Note-type-specific | Set by the note's `note_type` where it has a lifecycle/state, not universal† |
| `tags` | Optional | Topical / temporal / source labels (`topic/*`, `date/*`, `source/*`) — retained, but never the **kind** classifier |
| `author` | Recommended | `AI-assisted` / `Manual` / `Mixed` |

† Component-specific status values remain under their component owners while KB-wide metadata reconciliation is pending.

**Freshness** is carried by the timestamps, not by `status`: a note is current while `reviewed` is at or after its last `updated`, and goes stale once `updated` moves ahead of `reviewed` (or `reviewed` is absent). `status` is reserved for a `note_type`'s own lifecycle where it has one — for example `ki-repo-kb-activities` uses `active` / `inactive`.

The generic `type` field is forbidden in governed KB note frontmatter. Every metadata field carries its explicit domain prefix: `note_type` classifies notes, and instrument-specific fields such as `decision_type` remain owned by their instrument skill.

## Note-type taxonomy

`note_type` is a note's sole **kind** classifier — what it _is_, not what it is _about_. `tags` carry the _about_ (topical, temporal, and source labels — `topic/*`, `date/*`, `source/*`) and never classify kind; where a base encoded kind in a `card/*` tag (a Collection Card — a person, organisation, concept, or index note), that `card/*` tag maps to `note_type:`. `note_type` is **location-constrained**: a registry pairs path-patterns with the note types valid at them, so a `note_type` can be checked against — and often inferred from — where the note lives. The relationship is not strictly one-to-one: a note type may be valid at more than one location, and some locations admit more than one note type, so the registry expresses _which note types are valid where_ rather than a single forced mapping. The fixed contract is the **pattern** — `note_type` is declared and location-constrained — not any particular slug or notation; the slug vocabulary below is the current taxonomy and may grow.

The slugs use slash-hierarchical notation: `<zone>/<arm>/<leaf>`. The zone prefix identifies the KI zone; subsequent segments identify the structural role within that zone.

### Admin branch (`admin/`)

| Note type                     | Path context                                              | Defined by            |
| ----------------------------- | --------------------------------------------------------- | --------------------- |
| `admin/zone`                  | `Admin/Admin.md` (zone root)                              | `ki-repo-kb`               |
| `admin/index`                 | Area index notes (`Admin/Governance/Governance.md`, etc.) | `ki-repo-kb`               |
| `admin/governance/decision`   | `Admin/Governance/Decisions/*.md`                         | `ki-decision-records` |
| `admin/governance/convention` | `Admin/Governance/Conventions/**/*`                       | TBD                   |
| `admin/governance/policy`     | `Admin/Governance/Policies/**/*`                          | TBD                   |
| `admin/governance/template`   | `Admin/Governance/Templates/**/*`                         | TBD                   |
| `admin/operations/process`    | `Admin/Operations/Processes/**/*`                         | TBD                   |
| `admin/operations/activity`   | `Admin/Operations/Activities/**/*`                        | `ki-repo-kb-activities`    |
| `admin/operations/skill`      | `Admin/Operations/Skills/**/*`                            | TBD                   |

`Admin/Operations/Activities/` is governed by `ki-repo-kb-activities` and `Admin/Operations/Live Artifacts/` by `ki-repo-kb-live-artifacts`. Their component-specific frontmatter and the universal metadata contract are not yet reconciled; this standard therefore does not treat a clean component or aggregate structural audit as proof of a universal metadata schema. The remaining `TBD` rows have no governing skill yet.

### Outbound staging (`-/`)

These note types are only valid under `-/`. Files carrying them elsewhere are a ZONE-5 FAIL (see audit rubric).

| Note type | Path context | Lifecycle | Defined by |
| --- | --- | --- | --- |
| `session-digest` | `-/_DIGESTS/*.md` | Ephemeral. Delete once content is extracted into Pillars/Streams/handoff | `ki-repo-kb` |
| `handoff` | `-/_TRADES/*.md` | Ephemeral. Delete once recipient has routed it through their `+/` | `ki-repo-kb` |

### Calendar branch (`calendar/`)

Time-stamped records; the kind is the temporal grain. Governed by `ki-repo-kb`.

| Note type          | Path context                                          | Defined by |
| ------------------ | ----------------------------------------------------- | ---------- |
| `calendar/index`   | Year / month index notes (`Calendar/<YYYY>/…`)        | `ki-repo-kb`    |
| `calendar/daily`   | A day note (`Calendar/<YYYY>/<month>/<YYYY-MM-DD> …`) | `ki-repo-kb`    |
| `calendar/weekly`  | A weekly review                                       | `ki-repo-kb`    |
| `calendar/monthly` | A monthly summary                                     | `ki-repo-kb`    |
| `calendar/meeting` | A meeting note                                        | `ki-repo-kb`    |
| `calendar/session` | An AI-assisted work-session note                      | `ki-repo-kb`    |

### Resources branch (`resources/`)

External reference material. The kinds below are the cross-base **core**; a base may declare finer entity kinds (`resources/book`, `resources/location`, …) under its own config. Governed by `ki-repo-kb`.

| Note type           | Path context                          | Defined by |
| ------------------- | ------------------------------------- | ---------- |
| `resources/index`   | Area index notes (`Resources/…/….md`) | `ki-repo-kb`    |
| `resources/note`    | A general reference note              | `ki-repo-kb`    |
| `resources/person`  | A person reference                    | `ki-repo-kb`    |
| `resources/org`     | An organisation reference             | `ki-repo-kb`    |
| `resources/concept` | A concept reference                   | `ki-repo-kb`    |

### Streams branch (`streams/`)

The `Streams` zone's internal structure is owned by `ki-repo-kb-streams`; these are its note kinds.

| Note type          | Path context                                     | Defined by      |
| ------------------ | ------------------------------------------------ | --------------- |
| `streams/zone`     | `Streams/Streams.md` (zone root)                 | `ki-repo-kb-streams` |
| _pending reconciliation_ | Roadmap and housekeeping record metadata is owned by their selected adapters | respective adapter owners |

### Pillars branch (`pillars/`)

Canonical internal knowledge. Governed by `ki-repo-kb`.

| Note type       | Path context                        | Defined by |
| --------------- | ----------------------------------- | ---------- |
| `pillars/index` | Pillar and area index notes         | `ki-repo-kb`    |
| `pillars/note`  | Canonical knowledge within a Pillar | `ki-repo-kb`    |

## Dependent fields

Some `note_type` values require additional fields, defined by the skill that owns that note type:

| `note_type` | Additional required field | Valid values | Defined by |
| --- | --- | --- | --- |
| `admin/governance/decision` | `decision_type` | nine decision domains‡ | `ki-decision-records` |
| `calendar/daily` | `day_type` | work-day / weekend / bank-holiday / annual-leave (open enumeration) | `ki-repo-kb` |
| _pending reconciliation_ | Roadmap and housekeeping dependent fields | adapter-defined | selected adapter owner |

‡ strategy, product, architecture, data, security, operations, governance, research, knowledge.
