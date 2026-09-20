---
name: ki-repo-kb-live-artifacts
ki-kind: governance
ki-applicability: declaration-only
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: []
description: >
  Create, audit, and maintain KI Live Artifact pairs: a Markdown source and rendered HTML view for dashboards,
  queues, trackers, or status boards. Use for pair naming, index, or sync; `ki-repo-kb` owns zones and
  `ki-authoring` Markdown style.
argument-hint: 'audit | conform | help | educate | new <name> | refresh'
---

# Knowledge Islands Live Artifacts

You are helping the user author, audit, and manage **Live Artifacts** in a Knowledge Islands base. A Live Artifact is a named, intentional operational document that reflects the current state of the island — a dashboard, status board, queue, or tracker. Unlike notes in `Pillars/`, live artifacts are **intentionally mutable**: they are updated in place as the island's state changes.

The normative model lives in [the Live Artifact standard](references/standards-live-artifacts.md), with concrete shapes in [the exemplars](references/exemplars.md). The checkable publication lives in [the rubric](references/rubric.md).

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

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode EDUCATE

→ Explain the pairing, frontmatter, index, and sync model. Creation of the parent `Admin/Operations/` structure belongs to `ki-repo-kb`; this skill ships no standalone scaffold or runner. **NEW** authors individual artifact sources once the collection location exists.

### Mode NEW

→ Read [references/mode-new.md](references/mode-new.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Delegated boundary

- `ki-repo-kb` — owns the Admin/Operations/ zone and the base-level audit. Its declared dependency edge delegates Live Artifact governance here, so selecting `ki-repo-kb` runs this capability first. A focused `ki-repo-kb-live-artifacts` audit remains limited to the collection.
- `ki-authoring` — the separately applicable Markdown style for `.md` source files.

## Project bindings

Declare in the base's `.ki.toml` `[skills.ki-repo-kb-live-artifacts]` table:

```toml
[skills.ki-repo-kb-live-artifacts]
# Directory holding artifact pairs, relative to the base.
# Default: Admin/Operations/Live Artifacts
# artifacts_dir = "Admin/Operations/Live Artifacts"

# Maximum age difference (in hours) between .html and .md before the pair is flagged stale.
# Default: 24
# sync_threshold_hours = 24
```

## Audit rubric

See [references/rubric.md](references/rubric.md) for the full rubric (mechanical + judgment), enforced mechanically by `ki repo audit --skill ki-repo-kb-live-artifacts`. After changing the family definitions under `scripts/rubric/items/`, regenerate the published catalogue with `ki dev skill rubric ki-repo-kb-live-artifacts --write`.
