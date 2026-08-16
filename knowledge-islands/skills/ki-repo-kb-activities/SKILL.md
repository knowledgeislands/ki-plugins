---
name: ki-repo-kb-activities
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: []
description: >
  Author, audit, and manage Activity notes in a Knowledge Islands base — the operational record of what automation, scheduling, and agentic work a base has adopted. Governs the naming convention, required frontmatter, realization types, and the Activities.md index in Admin/Operations/Activities/. Checks that activities declared as slash commands have a corresponding skill, and that those declared as scheduled tasks are flagged for registration in an external scheduling system. The realization model is runtime-neutral and accepts new environment types. Triggers: "add an activity", "audit activities", "what activities does this base have", "register this as a scheduled task", "create a skill for this activity", "list my activities", "check activity conformance". For the KB zone structure use `ki-repo-kb`; for skill authoring use `ki-skills`; for the harness bundle layout use `ki-repo-harness`.
argument-hint: 'audit | conform | help | educate | new <name> | refresh'
---

# Knowledge Islands Activities

You are helping the user author, audit, and manage **Activity notes** in a Knowledge Islands base. An Activity is a named, intentional behaviour the base has adopted — automation, a scheduled task, an agentic capability, or a recurring manual process. This skill governs the Activity note format and `Activities.md` index; the activity note and its execution environment define what the behaviour does.

## The Activity model

Activity notes live at `Admin/Operations/Activities/<Activity Name>.md` and describe a single named behaviour the base has adopted. They are indexed by `Admin/Operations/Activities/Activities.md`.

Read the [Activity standard](references/standards-activities.md) before authoring, auditing, or conforming a collection. It owns the location and configuration boundary, frontmatter vocabulary, realization-specific fields, index contract, and safe index-conform boundary. [The exemplars](references/exemplars.md) show representative notes.

## Operating modes

Modes: **AUDIT · CONFORM · EDUCATE · NEW · REFRESH** (named, alphabetical). Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode EDUCATE

→ Activate this skill with `ki repo skill add ki-repo-kb-activities`; `ki repo audit` and `ki repo conform` then execute its native rubric. To establish the collection itself, scaffold `Admin/Operations/Activities/` with its `Activities.md` index; **NEW** then authors individual activity notes into it.

### Mode NEW

→ Read [references/mode-new.md](references/mode-new.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Delegated boundary

- `ki-repo-kb` — owns the Admin/Operations/ zone and the base-level audit. Its declared dependency edge delegates Activity-note governance here, so selecting `ki-repo-kb` runs this capability first. A focused `ki-repo-kb-activities` audit remains limited to the collection.
- `ki-skills` — authors a missing skill when a `slash-command` activity names one that does not exist.
- `ki-repo-harness` — the harness bundle layout; the checker resolves `skills/<name>/SKILL.md` relative to the harness root declared in the base's `.ki-config.toml`.

## Project bindings

Declare in the base's `.ki-config.toml` `[skills.ki-repo-kb-activities]` table:

```toml
[skills.ki-repo-kb-activities]
# Path to a harness root (absolute or relative to the base). Used to resolve skill names.
# harness = "../ki-agentic-harness"
#
# Folder holding activity notes, relative to the base (default: Admin/Operations/Activities).
# activities_dir = "Admin/Operations/Activities"
```

## Audit rubric

See [references/rubric.md](references/rubric.md) for the full rubric (mechanical + judgment).
