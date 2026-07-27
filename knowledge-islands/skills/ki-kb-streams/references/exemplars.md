# Streams Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns showing what well-formed Streams zone notes, proposal documents, and Focus dashboards look like. Use these as concrete references when authoring proposals, running CONFORM, or deciding whether a stream is correctly structured. Drawn from `ki-arcadia-principal` — the canonical live base for this skill — and from the normative definitions in the skill's own reference files.

## Collections

| Source               | URL             | What it covers      |
| -------------------- | --------------- | ------------------- |
| ki-arcadia-principal | No public URL ※ | Live Streams zone ‡ |

※ KI repos are the primary exemplars.

‡ Focus dashboards, proposal documents, parent stream layout. †

† `ki-arcadia-principal` is at `/Users/krisbrown/kis/knowledgeislands/ki-arcadia-principal/` on this machine. Its Streams zone carries the canonical structure cleanly. See `sources.md` for the conformance notes (the proposal apparatus is clean; some index frontmatter still carries legacy keys as of the last review).

## Selected patterns

### Well-formed proposal frontmatter

Every full-proposal stream note (a `<Name> Proposal.md` file) carries these lifecycle fields. The following is taken from `Streams/Future/Island MCP/Island MCP Proposal.md` in `ki-arcadia-principal`:

```yaml
---
type: stream-proposal
tags:
  - topic/knowledge-islands
  - topic/tools
status: draft
priority: low
dependencies: []
author: Mixed
---
```

`type: stream-proposal` is the machine-readable marker the checker keys on. `status` is one of `draft` / `ready` / `in-progress` / `rolled-out` / `reviewed` / `rejected`. `dependencies` is a YAML list of prerequisite proposal filenames — empty here because none exist yet, but always present so the checker can validate it. `priority` is `urgent` / `high` / `medium` / `low`. Index notes (`stream-focus`, `stream-zone`, `stream-index`) do not carry `status`, `priority`, or `dependencies` — those fields are for proposals only.

### Proposal document structure

A full proposal has a consistent section sequence. The Governance footer is required on every proposal and must appear as a named section:

```markdown
# Island MCP Proposal

## Overview

A stream to design and propose an MCP server that fronts each Knowledge Island …

---

## Governance

This stream follows the [Enactment Process](../../../Admin/Operations/Processes/Enactment Process.md).

---

## Inputs

| Type         | Detail                                    |
| ------------ | ----------------------------------------- |
| Document     | [Island MCP Design](Island MCP Design.md) |
| Prerequisite | _None yet identified_                     |

## Outputs

| Type     | Detail                                                       |
| -------- | ------------------------------------------------------------ |
| Decision | Ratified design for the island MCP gateway model             |
| Artefact | Tool note under `Pillars/Philosophy/Model/Tools/Island MCP/` |

## Checklist

- [ ] Sketch the tool surface
- [ ] Decide scope — one MCP per island or one shared MCP scoped by island parameter
- [ ] Map the permissions model

## Open Questions

1. **One server or many?** …

## Design

_Analysis, diagrams, and draft content go here._
```

The Governance footer links to the base's bound process note (not to the skill itself). Inputs rows use `Document` / `Decision` / `Prerequisite` tags; Outputs rows use `Decision` / `Artefact`. The Checklist doubles as rollout status — items are ticked as executed.

### Focus dashboard (stream-focus index)

Each Focus folder carries a same-name index note. Its `## Streams` table is the live triage view for that Focus. From `Streams/Active/Active.md` in `ki-arcadia-principal`:

```yaml
---
type: stream-focus
tags:
  - topic/streams
status: current - April 2026
author: AI-assisted
---
```

```markdown
# Active

## Overview

Streams currently receiving active attention — projects being worked on now.

---

## Streams

| Topic                                     | Status        | Priority |
| ----------------------------------------- | ------------- | -------- |
| [[Tooling Rollout Proposal]]              | `in-progress` | `high`   |
| [[Boundary Rules Proposal]]               | `draft`       | `urgent` |
| [[Authoring Layers Proposal]]             | `draft`       | `medium` |
| [[Knowledge Capital Extraction Proposal]] | `draft`       | `medium` |
```

The `## Streams` table is ordered `in-progress` → `ready` → `draft`, then by priority within each group. Topic cells use wikilinks (this is an Obsidian-rendered index; the skill reads and understands them but writes relative markdown paths when creating new notes). Update this table on every status or priority change — it has no value if it lags.

### Parent stream folder layout

When a stream has child notes or sub-folders, it uses the parent layout: a bare-topic folder with a slim same-name index note plus the proposal as a child. From `Streams/Future/Island MCP/` in `ki-arcadia-principal`:

```text
Streams/Future/Island MCP/         ← bare topic folder (NOT "Island MCP Proposal/")
├── Island MCP.md                  ← slim stream-index note; resolves the folder link
├── Island MCP Proposal.md         ← the proposal note (type: stream-proposal)
└── Island MCP Design.md           ← child working note (type: stream-note)
```

The proposal note's name is stable across leaf ↔ parent transitions — only the folder name and the presence of the slim index change. A leaf stream keeps the `Proposal` suffix on its folder; a parent stream drops it.
