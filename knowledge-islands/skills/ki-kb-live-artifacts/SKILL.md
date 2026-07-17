---
name: ki-kb-live-artifacts
implies: []
vendors: [educate, audit, conform, help]
description: >
  Author, audit, and manage Live Artifact pairs in a Knowledge Islands base — dynamic operational documents that reflect the current state of the island (dashboards, status boards, queues, trackers). Governs the pairing convention between a Markdown source (.md) and its rendered HTML output (.html), the Live Artifacts index in Admin/Operations/Live Artifacts/, and the sync rules between the two halves of each pair. Triggers: "add a live artifact", "audit live artifacts", "check artifact sync", "what live artifacts does this base have", "create a dashboard", "update the artifact index". For the KB zone structure use `ki-kb`; for Markdown or TOML style use `ki-authoring`.
argument-hint: 'audit | conform | help | educate | new <name> | refresh'
---

# Knowledge Islands Live Artifacts

You are helping the user author, audit, and manage **Live Artifacts** in a Knowledge Islands base. A Live Artifact is a named, intentional operational document that reflects the current state of the island — a dashboard, status board, queue, or tracker. Unlike notes in `Pillars/`, live artifacts are **intentionally mutable**: they are updated in place as the island's state changes.

## The Live Artifact model

Each live artifact consists of a **pair**:

| File          | Role                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| `<Name>.md`   | The Markdown source — the authoritative, human-readable version of the artifact.   |
| `<Name>.html` | The rendered HTML output — co-located with the `.md` file, same stem, same folder. |

Both halves live under `Admin/Operations/Live Artifacts/` (or a configured path) and are tracked by the same index note, `Admin/Operations/Live Artifacts/Live Artifacts.md`. The `.md` is the source of truth; the `.html` is a render of it. The pair is in sync when the `.html` is not older than the `.md` by more than the configured threshold (default: 24 hours).

### Pairing convention

- Same stem, same directory: `Status Board.md` + `Status Board.html`.
- Both files must exist for the pair to be considered complete; a lone `.md` with no `.html` is an unpublished artifact; a lone `.html` with no `.md` is an orphan.
- The `.md` carries frontmatter; the `.html` does not.

### Required frontmatter (on the .md)

| Key       | Value                                              |
| --------- | -------------------------------------------------- |
| `status`  | `active` \| `archived`                             |
| `renders` | `html` (or a comma-separated list of render types) |
| `author`  | Who owns and maintains this artifact.              |

### Live Artifacts index

`Admin/Operations/Live Artifacts/Live Artifacts.md` lists every artifact pair with its status and a one-line description. The audit checks this file exists when any artifact is found; its contents are a judgment check.

## Operating modes

Modes: **AUDIT · CONFORM · EDUCATE · NEW · REFRESH** (named, alphabetical). Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode CONFORM

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode EDUCATE

→ Reached through the bootstrap chain — `ki-bootstrap` vendors this skill's checker and wires `ki:kb-live-artifacts:audit`. To establish the collection itself, scaffold `Admin/Operations/Live Artifacts/` with its `Live Artifacts.md` index; **NEW** then authors individual artifact pairs into it.

### Mode NEW

→ Read [references/mode-new.md](references/mode-new.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Composition

- `ki-kb` — owns the Admin/Operations/ zone and the base-level zone audit. This skill composes on it for zone checks; run `ki-kb` AUDIT first when auditing a full base.
- `ki-authoring` — Markdown style for the `.md` source files.

## Project bindings

Declare in the base's `.ki-config.toml` `[ki-kb-live-artifacts]` table:

```toml
[ki-kb-live-artifacts]
# Directory holding artifact pairs, relative to the base.
# Default: Admin/Operations/Live Artifacts
# artifacts_dir = "Admin/Operations/Live Artifacts"

# Maximum age difference (in hours) between .html and .md before the pair is flagged stale.
# Default: 24
# sync_threshold_hours = 24
```

## Audit rubric

See [references/audit-rubric.md](references/audit-rubric.md) for the full rubric (mechanical + judgment).
