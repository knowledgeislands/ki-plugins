---
name: ki-kb
implies: [ki-kb-activities, ki-kb-live-artifacts, ki-kb-streams]
vendors: [educate, audit, conform, help]
description: >
  Interact with a Knowledge Islands knowledge base: save AI outputs as notes, update existing notes, query the base, distil a conversation into notes, or write a session digest — and audit a base against the structure model, bring it into line, or scaffold a new one. Targets the Knowledge Islands structure (Calendar / Pillars / Resources / Streams, plus inbound `+` and outbound `-`), so it assumes the zone model rather than asking for it; only a few store-level bindings come from the host project. Triggers: "save to my notes", "save to the knowledge base", "add to the KB", "what do my notes say about", "search my notes", "update the note on", "capture this", "write a session digest", "audit my knowledge base", "is my base structured right", "set up a new knowledge base". For the `Streams` zone (proposals, the Enactment Process) use the `ki-kb-streams` skill it delegates to; for general Markdown or TOML house style (not note content) use `ki-authoring`.
argument-hint: 'audit | conform | digest | extract | help | improve | educate | query <question> | refresh | save | update <note>'
---

# Knowledge Islands KB

You are helping the user interact with a **Knowledge Islands** knowledge base - a markdown store organised to the Knowledge Islands structure. This skill carries the operating modes and the structure itself; only a handful of store-level details come from the host project. It assumes the zone model below and does not ask the project to redefine it.

## The Knowledge Islands structure

A Knowledge Islands base is one markdown store with a fixed set of five zones, flanked by an inbound and an outbound staging area. The five zones — `Calendar/`, `Pillars/`, `Resources/`, `Streams/`, `Admin/` — each carry an index note of the same name; `+/` (inbound) and `-/` (outbound) are staging areas, not zones, and carry no such index.

| Folder       | Holds                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `+/`         | Inbound staging - unfiled captures awaiting routing. Exempt from most conventions. Not a zone. |
| `Calendar/`  | Time-stamped records: daily, meeting, session, weekly, monthly notes.                          |
| `Pillars/`   | Internal canonical knowledge - the base's primary subject matter. One folder per pillar.†      |
| `Resources/` | External reference material that exists independently of this base.                            |
| `Streams/`   | Work in motion - active workstreams run as proposals. ※                                        |
| `-/`         | Outbound staging - produced artefacts (session digests, compiled outputs). Not a zone.         |
| `Admin/`     | Base-agnostic governance and operations.                                                       |

† Any zone may be held under a different local folder name — a base mid-migration, or one that simply names a zone differently. That is declared as a **zone alias** in the base's config, not treated as a different zone - see [Project bindings](#project-bindings).

※ Migrates to `Pillars/` once settled. Its internal structure and process are owned by the `ki-kb-streams` skill.

### Admin/ subdivisions

The `Admin/` zone carries two canonical subdivisions:

| Folder              | Holds                                                                             |
| ------------------- | --------------------------------------------------------------------------------- |
| `Admin/Governance/` | Decisions, charters, conformance records, and structural agreements for the base. |
| `Admin/Operations/` | Day-to-day operational artefacts: activities, runbooks, and operational logs.     |

Each subdivision carries an index note of the same name (`Governance.md`, `Operations.md`). The root `Admin/MEMORY.md` remains the memory-cascade anchor and is not replaced by these. Absence of either subdivision is a WARN (not FAIL) — a base may legitimately omit one if that concern is not yet active; presence without an index note is also a WARN.

The specific artefact types under these subdivisions are governed by sibling skills that compose on this one — decision records by `ki-decision-records`, activity notes by `ki-kb-activities`, and live-artifact pairs by `ki-kb-live-artifacts` — each deferring here for the zone structure and the KI-wide frontmatter standard.

### Charter and Conformance baseline

When `Admin/Governance/` is present, two documents are expected there:

| File                              | Holds                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `Admin/Governance/Charter.md`     | Scope, purpose, and owner of the base. Created on EDUCATE; kept current by the base's owner. |
| `Admin/Governance/Conformance.md` | The active skill set governing this base, with adoption dates. Updated when skills change.   |

Both are checked by the mechanical audit and created as stubs by EDUCATE and CONFORM. Absence is a WARN (not FAIL) — a base that has no `Governance/` folder yet is not penalised for missing them.

**Pillars** are the second-level unit of organisation: each whole knowledge base is an "island"; within it, a Pillar is a major strand of its subject matter (a case, a client, a domain, a theme). A base may use one Pillar or many.

### Linking within a base

Notes inside a base link to one another and to their zone index notes with Obsidian `[[wikilinks]]`, not relative markdown paths — the five index-carrying zones are `[[Calendar]]`, `[[Pillars]]`, `[[Resources]]`, `[[Streams]]`, and `[[Admin]]`. Body links use the shortest unique path (bare filename if unique, the minimum disambiguating prefix otherwise); a `## Contents` list uses the full path with an alias (`[[Full/Path/Note|Note Name]]`). This governs **note content inside a base** — it is independent of, and does not conflict with, the relative-markdown-link convention these skill files themselves use (see ki-agentic-harness `docs/installation.md`, "Linking inside skills").

### Routing test

Produced outputs (session digests, compiled artefacts, handoffs) **bypass this test** — they always go to `-/` (see [Mode DIGEST](references/mode-digest.md)).

For all other notes, most-specific match wins:

1. Time-bound record -> `Calendar/`.
2. Active, in-progress work -> `Streams/` (the `ki-kb-streams` skill owns sub-routing within the zone — Focus, the proposal layout, the lifecycle).
3. Settled internal knowledge -> `Pillars/<Pillar>/`.
4. External reference (would exist without this base) -> `Resources/`.
5. Unsure -> `+/<Title>.md` at the most specific applicable level.

### Memory cascade

Root index `Admin/MEMORY.md` lists the active Pillars. Where the base is Pillar-scoped, scope a session to one Pillar and load `Pillars/<Pillar>/MEMORY.md` (and any per-Pillar profile index) before substantive work. Treat other Pillars as off-limits unless the user switches.

## Note templates

The skill ships zone-scoped starter templates in `references/templates/<zone>/`. EDUCATE copies the relevant stubs when scaffolding a new base. QUERY can list available templates when the user asks (`?templates`). A base may override or extend these by declaring a `[ki-kb.templates]` table in its `.ki-config.toml` — keys are zone names, values are paths relative to the base.

| Zone         | Template                        | Use for                                     |
| ------------ | ------------------------------- | ------------------------------------------- |
| `Admin/`     | `templates/admin/activity.md`   | New activity note (see `ki-kb-activities`). |
| `Calendar/`  | `templates/calendar/session.md` | Session notes.                              |
| `Pillars/`   | `templates/pillars/note.md`     | Settled canonical knowledge notes.          |
| `Resources/` | `templates/resources/source.md` | External reference entries.                 |

Templates are stubs — headings, frontmatter keys, and inline `<!-- prompts -->`. They do not carry content; the skill fills in what the user provides during SAVE / EXTRACT / EDUCATE.

## Project bindings

Almost everything is fixed by the structure above. Only these come from the host project - take the narrative bindings from the auto-loaded `CLAUDE.md`, then the root memory index. **Declarative overrides** (the zone alias and the lists below) are read from the base's `.ki-config.toml` `[ki-kb]` table instead — see the `ki-repo` skill for the shared-file contract; validate your own table (warn on an unrecognised key) and never read another skill's. A base never ships a `<base>-kb` skill: what it needs differently is declared here (data) or in its `CLAUDE.md` (prose), never forked into a coupled skill.

- **Notes store** — canonical alias and location of the notes store. _Default:_ the connected base; refer to it as "the base".
- **Sources store** — whether a paired sources store exists, and how note extracts mirror its paths. _Default:_ none.
- **Scope usage** — whether the base is Pillar-scoped (declare an active Pillar) or single-Pillar / flat. _Default:_ Pillar-scoped.
- **Zone names** — the canonical folder per zone, overridable per base. A `[ki-kb.zones]` sub-table maps any canonical zone or staging area to this base's local folder name (e.g. `Pillars = "<local folder>"`); resolve every zone reference through it. Useful for a base mid-migration (drop the entry once the folder is renamed) or one that simply names a zone differently. _Default:_ the canonical names (`Calendar` / `Pillars` / `Resources` / `Streams` / `Admin`, plus the `+` / `-` staging areas).
- **Required frontmatter** — the keys every note carrying frontmatter must include. Declare them with `required_frontmatter = ["tags", "status", "author"]` under `[ki-kb]` to have the checker enforce their presence mechanically (extra keys stay free; keys are always `snake_case`). _Default:_ none declared — required frontmatter stays a judgment call resolved from the host `CLAUDE.md`.
- **Writing standards** — language variant, citation format, structural norms. _Default:_ British English; cite source paths; concise prose.
- **Domain pre-flight** — any extra reads before drafting (profiles, domain context). Declare them as `preflight = ["<path-or-glob>", …]` under `[ki-kb]` — a list of note paths/globs to read before drafting, which the checker validates _down_. _Default:_ none beyond the memory cascade.

## Step 1 - Load context

1. The host `CLAUDE.md` (auto-loaded) is the authority on the bindings above; follow it. Read the root `Admin/MEMORY.md` for active Pillars.
2. If the base is Pillar-scoped, declare or confirm the active Pillar, then load `Pillars/<Pillar>/MEMORY.md` and any profile index. Confirm: "Session scoped to [Pillar]." If the user switches Pillar mid-session, re-scope before proceeding.
3. Pre-flight before writing anything substantive: scope cascade loaded; if the work engages a named person/entity with a profile note, read it first; run any domain pre-flight declared in `.ki-config` (`preflight`) or the host `CLAUDE.md`.

## Operating modes

Step 2 - determine the mode and load its procedure. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows. The shared model above — the five zones, the routing test, the **memory cascade**, the project bindings, and Step 1 — is what every mode needs and stays loaded; each mode's _procedure_ lives in its own on-demand file, so read only the one the request selects. Like every governance skill it carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** (EDUCATE scaffolds a base); its base-specific modes are the session-level **IMPROVE** (continuous improvement) and the note-ops **DIGEST · EXTRACT · QUERY · SAVE · UPDATE**. Modes are named and alphabetical.

| Mode    | Fires on                                                  | Read before acting                                        |
| ------- | --------------------------------------------------------- | --------------------------------------------------------- |
| AUDIT   | "audit my knowledge base / is it structured right"        | [mode-audit-conform.md](references/mode-audit-conform.md) |
| CONFORM | "bring my base into line / fix the structure"             | [mode-audit-conform.md](references/mode-audit-conform.md) |
| DIGEST  | "write a session digest"                                  | [mode-digest.md](references/mode-digest.md)               |
| EXTRACT | "distil this conversation into notes"                     | [mode-extract.md](references/mode-extract.md)             |
| IMPROVE | continuous-improvement sweep (at session end)             | [mode-improve.md](references/mode-improve.md)             |
| EDUCATE | "set up a new knowledge base"                             | [mode-educate.md](references/mode-educate.md)             |
| QUERY   | "what do my notes say / search my notes"                  | [mode-query.md](references/mode-query.md)                 |
| REFRESH | "is the KB skill still current" (on its declared cadence) | [mode-refresh.md](references/mode-refresh.md)             |
| SAVE    | "save to my notes / capture this"                         | [mode-save.md](references/mode-save.md)                   |
| UPDATE  | "update the note on X"                                    | [mode-update.md](references/mode-update.md)               |

The memory cascade and the canonical-zone Enactment gate are part of the shared model above — they apply on every fire, before any mode procedure loads.

## Notes

- This skill assumes the Knowledge Islands structure. If a base does not follow it, or a binding cannot be resolved and no default fits, ask the user rather than guess.
- A base supplies its specifics by **declaration**, not a coupled skill: structured data (zone aliases, required frontmatter, pre-flight reads) in its `.ki-config.toml` `[ki-kb]` table, narrative bindings (store alias, scope, writing standards) in its `CLAUDE.md`. There is no `<base>-kb` extension skill; relationships to sibling skills are composition (e.g. the `Streams` zone delegates to `ki-kb-streams`).

Reference detail: [Knowledge Islands KB Reference](<references/Knowledge Islands KB Reference.md>). Checkable criteria: [the audit rubric](references/audit-rubric.md), enforced mechanically by [`scripts/audit.ts`](scripts/audit.ts).

KI-wide frontmatter standard (universal fields and the `type` taxonomy): [frontmatter-standard.md](references/frontmatter-standard.md).
