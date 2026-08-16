# KB Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns showing what well-formed Knowledge Islands KB notes, folder structures, and zone layouts look like. Use these as concrete references when authoring notes, running CONFORM, or deciding whether a structural choice is correct. They are drawn from `ki-arcadia-principal` — the canonical live KB — rather than invented examples, so they reflect real decisions made in a conforming base.

## Collections

| Source | URL | What it covers |
| --- | --- | --- |
| ki-arcadia-principal | No public URL — KI repos are the primary exemplars | Zone layout, folder-note, frontmatter, link style † |

† Zone layout, folder-note structure, frontmatter, and internal link style across a live KB conforming to the standard. `ki-arcadia-principal` is at `/Users/krisbrown/kis/knowledgeislands/ki-arcadia-principal/` on this machine; it is the reference base the skill tracks — see `sources.md` for conformance status.

## Selected patterns

### Correct note frontmatter

Every KB note carries `note_type`; the current exemplar also uses `status`, `tags`, and `author`. The `note_type` field drives routing; `status` carries a note-type-specific state where one exists; `tags` carry the topic context; `author` records provenance for curation. The generic `type` field is not valid KB note metadata. The following is the canonical shape for `Admin/Admin.md`, a zone-root index note:

```yaml
---
note_type: admin/zone
tags:
  - card/note
  - topic/knowledge-islands
status: draft - May 2026
author: AI-assisted
---
```

Key points: `note_type` is the sole note-kind classifier and is constrained by the note's location; `tags` is a YAML list, never an inline string; the `status` field uses a freeform date suffix so the age of a status assessment is visible without opening the note body; `author` distinguishes human-authored, AI-authored, and collaborative notes (`AI-assisted` / `Manual` / `Mixed`).

### Folder-note structure (zone root)

Each index-carrying zone has a same-name index note at its root. The note body lists sub-areas as relative markdown links. From `Admin/Admin.md`:

```markdown
# Admin

## Overview

`Admin` is the governance and operations zone …

## Structure

`Admin` organises into two arms:

- **`Governance/`** — artefacts that define what this island IS …
- **`Operations/`** — artefacts that describe how this island RUNS …

## Contents

- [[Admin/MEMORY|MEMORY]] — root memory index: the island's active Admin content.
- [[Admin/Governance/Charter|Charter]] — island identity and adoption position.
- [[Admin/Governance/Governance|Governance]] — governance arm index.
- [[Admin/Operations/Operations|Operations]] — operations arm index.
- [[Admin/Governance/Decisions/Decisions|Decisions]] — the island's Decision Records.
```

The index note's `## Contents` list uses full-path Obsidian wikilinks with readable aliases. Each sub-folder that has a named arm (`Governance/`, `Operations/`) gets its own same-name index note, creating a navigable tree one level at a time.

### Well-structured zone layout

`ki-arcadia-principal` demonstrates the five canonical zones plus the two staging areas:

```text
ki-arcadia-principal/
├── +/                   ← inbound staging (unsettled, not yet routed)
├── -/                   ← outbound staging (leaving the base)
├── Admin/               ← governance and operations (gated by Enactment Process)
│   ├── Admin.md         ← zone root index
│   ├── Governance/
│   └── Operations/
├── Calendar/            ← time-bound records (sessions, reviews)
├── Pillars/             ← stable internal knowledge
│   ├── Pillars.md       ← zone root index
│   ├── Aesthetics/
│   ├── Philosophy/
│   └── Technē/
├── Resources/           ← reference material with external origin
└── Streams/             ← work in motion (see ki-repo-kb-streams)
    ├── Streams.md
    ├── Roadmap/
    └── Housekeeping/
```

The staging areas (`+/`, `-/`) have no zone index note; only the five canonical zones carry one. Pillar folders inside `Pillars/` match the island's topic arms — they are not fixed by the standard; what is fixed is that each carries a same-name index note at its root.

### Internal vs external link style

Internal links use the shortest unique Obsidian wikilink path, while contents lists use full paths with aliases. External links use inline markdown with descriptive anchor text; bare URLs are not written into note bodies.

```markdown
<!-- Internal — shortest unique wikilink or full path with an alias -->

See [[Charter]] for the island identity. See [[Pillars/Philosophy/Knowledge Islands|Knowledge Islands]] for the portable model.

<!-- External — descriptive anchor text -->

See the [Agent Skills standard](https://agentskills.io/) for the published spec.

<!-- Wrong — relative markdown paths are not the base's internal-note convention -->

See [Charter](Governance/Charter.md) for the island identity.
```

The `ki-repo-kb` skill writes Obsidian wikilinks inside the base while keeping its own skill documentation on relative Markdown links.
