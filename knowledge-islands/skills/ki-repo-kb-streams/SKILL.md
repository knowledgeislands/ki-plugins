---
name: ki-repo-kb-streams
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: []
description: >
  Operates and governs the Streams zone of a Knowledge Islands base — the working copy of work in motion, run as the Enactment Process. It is the KB adapter for the shared forward-work lifecycle: a proposal goes draft → ready → in-progress → awaiting-review → done, while the Enactment gate keeps canonical knowledge changes approved. Use to start or iterate a stream, inspect its queue, or audit Streams structure. For common selection, planning, delivery, review, and closure use ki-next, ki-plan, ki-implement, and ki-accept; for the five-zone model and note CRUD use ki-repo-kb.
argument-hint: 'audit | conform | help | educate | iterate | propose | ready | refresh | rollout'
---

# Knowledge Islands Streams

You are operating the **`Streams` zone** of a Knowledge Islands base. `Streams/` is the base's _working copy_ — the home of work in motion, and what the user thinks of as "plan mode." It is governed by the **Enactment Process**. A stream is one of two weights (chosen per stream): a **full proposal** — a governed change that iterates in place, is submitted for approval, rolled out, and retired — or a **lightweight stream**, a tracker for work that isn't (yet) a formal change to canonical content. **Nothing reaches a canonical zone (`Admin/` — the base's own operating model — `Pillars/`, and `Resources/`) except through an approved proposal** — authority to work in a stream is granted by its presence in the workspace; authority to edit a canonical zone is granted only by approval of a `ready` proposal that specifies the change.

The companion `ki-repo-kb` skill owns the five-zone model and note CRUD / routing, and **delegates the inside of `Streams/` here**; load it for anything outside this zone. This skill carries the structure and process as fixed knowledge; only a couple of store-level **bindings** come from the host base.

The full detail lives in the references (progressive disclosure): the structure in [the Streams structure standard](references/standards-streams-structure.md), the process in [the Enactment Process standard](references/standards-enactment-process.md), and worked shapes in [the exemplars](references/exemplars.md). The line-by-line checkable items live in [the rubric](references/rubric.md); `ki repo audit --skill ki-repo-kb-streams` runs their mechanical evidence and `ki repo conform --skill ki-repo-kb-streams` applies its safe declared repairs.

## The Streams zone at a glance

A stream lives at `Streams/$Focus/$Category?/$Name…`. **Focus** is mandatory — the level of attention the stream is receiving; moving a stream between Focus folders is an explicit act. **Category** is optional grouping within a Focus (pick one pattern per Focus: none / destination-path / status sub-grouping).

| Focus          | Meaning                                           |
| -------------- | ------------------------------------------------- |
| `Now`          | Receiving current delivery attention              |
| `Next`         | The next bounded work to prepare or begin         |
| `Soon`         | Understood work, but not current                  |
| `Waiting for`  | Blocked by a named dependency or condition        |
| `Parked`       | Intentionally paused with a return trigger        |
| `Future`       | Planned or ideated; not yet started               |
| `Housekeeping` | Recurring-work templates that may spawn a due run |

Each Focus folder carries a **same-name index note** whose `## Streams` table lists each stream by Topic / Status / Priority, ordered by status then priority (grouped by category where used). The base also keeps a cross-Focus **proposals index** in the `Streams/` zone index note.

**A full proposal carries the `Proposal` suffix** (filename, `# H1`, `title:`); a **lightweight stream** is a plain tracker note under a Focus folder and carries none (see the Enactment Process standard for the two weights). Folder layout for a full proposal:

```text
Leaf:    Streams/<Focus>/<Category?>/<Name> Proposal/<Name> Proposal.md
Parent:  Streams/<Focus>/<Category?>/<Name>/<Name> Proposal.md          (+ slim <Name>.md index + children)
Multi:   Streams/<Focus>/<Category?>/<Name>/<ProposalName>/<ProposalName> Proposal.md
```

Full structure — Category patterns, leaf/parent/multi, index ordering — in [the Streams structure standard](references/standards-streams-structure.md).

## Status lifecycle and priority

A proposal's `status` is its position in the Enactment Process (distinct from its Focus, which is _attention_):

| Status            | Meaning                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `draft`           | Work in progress; iterating in the proposal document                    |
| `ready`           | Stable; no open questions; prerequisites satisfied; approved to deliver |
| `in-progress`     | Approved rollout underway                                               |
| `awaiting-review` | Checklist executed; required review packet awaits human closure         |
| `done`            | Review accepted; retain the completed proposal until explicit pruning   |

Order: `draft` → `ready` → `in-progress` → `awaiting-review` → `done`. **Priority** is one of `urgent` · `high` · `medium` · `low`, set at creation and raised as context shifts.

## Proposal document anatomy

The stream note _is_ the proposal document — a working tracker, not a knowledge store. Every full proposal carries an explicitly assigned, Knowledge-Base-wide unique `code` in frontmatter, in addition to `status`, `priority`, and `dependencies` (an array of prerequisite proposal filenames — the machine-readable form of the `Prerequisite` rows in Inputs), plus the base's descriptive keys. A code is stable identity: never derive it from the title or path, and never change it for a Focus move, lifecycle transition, or leaf/parent change. Its grammar, allocation, and existing-base migration procedure are in [the Streams structure standard](references/standards-streams-structure.md#proposal-codes).

- **Inputs** — what the change draws on, recorded as labelled `Document`, `Decision`, or `Prerequisite` entries.
- **Outputs** — what it produces, recorded as labelled `Decision` or `Artefact` entries. Complete before `ready`.
- **Checklist** — the concrete create/edit/move/delete operations rollout will perform; doubles as rollout status.
- **Open Questions** — unresolved decisions; each closed with a resolution note before `ready`.
- **Design Sections** — the substance: analysis, drafts, tables. May be extensive.
- **Governance** — a short footer declaring adherence to the process and linking back to it. **Required on every stream note.**

Use labelled bullet lists for proposal Inputs and Outputs. Avoid tables elsewhere in a proposal unless a genuine multi-column comparison makes a grid materially clearer; Focus and zone indexes remain tables.

## Project bindings

Almost everything is fixed above. Only these come from the host base — take declarative overrides from the base's `.ki-config.toml` `[skills.ki-repo-kb-streams]` table (the shared-file contract is owned by `ki-repo`; validate your own table, warn on an unrecognised key, never read another skill's), otherwise from the auto-loaded `CLAUDE.md`.

- **Process note** — the base's local change-process note that streams' `Governance` footers link to: a thin pointer to **this skill** (the canonical definition) plus the base's local specifics. _Default:_ `Enactment Process`. A base may host it under a non-default name or location (e.g. `kit-legal` keeps it under `Admin/Operations/Processes/`); declare it as `process_note = "Admin/Operations/Processes/Enactment Process"`. Resolve every `Governance` link through it.
- **Frontmatter scheme** — the note-type convention for zone / focus / proposal notes. The canonical scheme is the machine-readable **`type:`** key (`type: stream-zone` / `stream-focus` / `stream-proposal`) — `type` is the fundamental note-type marker, and the checker keys on it. A base still carrying the legacy `card/*` tag scheme declares `note_type_scheme = "tags"` as a transitional accommodation (like a zone alias), to be retired as it migrates to `type`.
- **Canonical zones** — the zones the gate protects, where a proposal's output lands. The knowledge **stores** a settled stream migrates into are `Pillars/` (internal; a base that holds it under a legacy folder name resolves it via the `ki-repo-kb` zone alias) and `Resources/` (external knowledge). `Admin/` — the base's operating model (its processes, conventions, configuration) — is equally canonical and equally gated, but receives operating-model changes rather than migrated subject-knowledge.

## Step 1 — Load context

1. Resolve the bindings: read the base's `.ki-config.toml` `[skills.ki-repo-kb-streams]` table and `CLAUDE.md`. **This skill is the canonical definition** of the Enactment Process; load the base's bound **process note** if it has one, for its local specifics (it points back here).
2. For any stream work, load the relevant Focus index and the proposal document **fresh** (never act on a cached version), plus the `Streams/` proposals index.

## Operating modes

Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows. The shared model above — the zone-at-a-glance, the status lifecycle, the proposal anatomy, the bindings, Step 1, and the **Working rules** and **Enactment gate** below — is what every mode needs and stays loaded; each mode's _procedure_ lives in its own on-demand file, so read only the one the request selects. This carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**. EDUCATE explains the canonical Streams model and routes creation of the parent zone to `ki-repo-kb`; it ships no standalone scaffold or runner. Its adapter modes are **ITERATE · PROPOSE · READY · ROLLOUT**. Common review and closure belong to `ki-accept`. Modes are named and alphabetical.

| Mode | Fires on | Read before acting |
| --- | --- | --- |
| AUDIT | "audit my streams" | [mode-audit.md](references/mode-audit.md) |
| CONFORM | "conform my streams / bring them into line" | [mode-conform.md](references/mode-conform.md) |
| EDUCATE | "bootstrap streams governance" (via the `ki-bootstrap` chain) | the EDUCATE sentence above — no procedure file |
| ITERATE | "iterate / develop this proposal" | [mode-iterate.md](references/mode-iterate.md) |
| PROPOSE | "start a stream / create a proposal" | [mode-propose.md](references/mode-propose.md) |
| READY | "mark this ready" | [mode-ready.md](references/mode-ready.md) |
| REFRESH | "is the Streams model still current" (on its declared cadence) | [mode-refresh.md](references/mode-refresh.md) |
| ROLLOUT | "roll out this proposal" (needs explicit authorisation) | [mode-rollout.md](references/mode-rollout.md) |

The Enactment gate (`## Installing the gate` below) and the Working rules apply on every fire, before any mode procedure loads — ROLLOUT in particular must not begin without explicit user authorisation.

## Working rules

These apply to every change (the discipline that keeps the workspace trustworthy):

- **Name and identity-confirmation gate.** Before creating a full proposal or renaming one, propose the name, resulting path, and explicitly allocated code and **wait for confirmation** — renames ripple through links, while codes do not.
- **Keep the proposal and indexes current.** Update immediately on a decision, status change, or priority change; the canonical state must never lag.
- **Load before editing.** Reload the proposal and indexes before resuming work.
- **No `ready` while a prerequisite is below `done`.** No rollout without explicit authorisation.
- **Re-verify each rollout item against the live file** before making the edit.
- **Retain done proposals** until an explicit prune selection removes their reviewed evidence.
- **Out of scope** (no proposal needed): trivial typo / formatting fixes, time-bound `Calendar/` entries, person-file auto-appends, inbound `+/` triage — though when in doubt, prefer a proposal: the cost of a lightweight one is low, the cost of an unauthorised change to canonical content is high.

## Installing the gate

The Enactment gate ("nothing reaches a canonical zone except through a `ready` proposal") only bites if it is _consulted_ — and skills load **on demand**, so this one will not fire on a plain "edit the X note" request that never mentions a proposal. The gate must therefore be **anchored in always-loaded context**:

- A base that runs the Enactment Process carries a standing directive in its **`CLAUDE.md` / `AGENTS.md`**: _substantive changes to a canonical zone (`Admin`, `Pillars`, `Resources`) go through a proposal — load `ki-repo-kb-streams`; do not edit a canonical zone directly_ (trivial fixes, `Calendar/` entries, and `+/` triage exempt).
- `ki-repo-kb`'s UPDATE / SAVE modes defer here when the target is a canonical zone and the base runs the gate, rather than writing directly.
- The checker's **GATE-1** verifies the `CLAUDE.md` directive is present — so a base can't quietly lose the gate.

## Notes

- This skill governs the **inside of the `Streams/` zone**. For the five-zone model, routing into the zones, note CRUD, and session digests, use the `ki-repo-kb` skill — it knows `Streams` is a zone and delegates its internals here.
- When a proposal's `Decision` (an Inputs or Outputs row) warrants a durable, standalone Decision Record rather than an inline note, author it with the `ki-decision-records` skill and reference it from the row.
- If a base does not follow this structure, or a binding cannot be resolved and no default fits, ask rather than guess.
