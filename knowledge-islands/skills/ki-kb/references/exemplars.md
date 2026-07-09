# KB Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns showing what well-formed Knowledge Islands KB notes, folder structures, and zone layouts look like. Use these as concrete references when authoring notes, running CONFORM, or deciding whether a structural choice is correct. They are drawn from `ki-arcadia-principal` — the canonical live KB — rather than invented examples, so they reflect real decisions made in a conforming base.

## Collections

| Source               | URL                                                | What it covers                                      |
| -------------------- | -------------------------------------------------- | --------------------------------------------------- |
| ki-arcadia-principal | No public URL — KI repos are the primary exemplars | Zone layout, folder-note, frontmatter, link style † |

† Zone layout, folder-note structure, frontmatter, and internal link style across a live KB conforming to the standard. `ki-arcadia-principal` is at `/Users/krisbrown/kis/knowledgeislands/ki-arcadia-principal/` on this machine; it is the reference base the skill tracks — see `sources.md` for conformance status.

## Selected patterns

### Correct note frontmatter

Every KB note that is not a pure index carries `type`, `status`, `tags`, and `author`. The `type` field drives routing; `status` signals currency; `tags` carry the topic and zone-arm context; `author` records provenance for curation. The following is taken from `Admin/Admin.md` in `ki-arcadia-principal` — a zone-root index note:

```yaml
---
tags:
  - card/note
  - topic/knowledge-islands
status: draft - May 2026
author: Written with Claude
---
```

Key points: `tags` is a YAML list, never an inline string; the `status` field uses a freeform date suffix so the age of a status assessment is visible without opening the note body; `author` distinguishes human-authored, AI-authored, and collaborative notes (`Written with Claude` / `Manual` / `Mixed`).

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

- [MEMORY](MEMORY.md) — root memory index: the island's active Admin content.
- [Charter](Governance/Charter.md) — island identity and adoption position.
- [Governance](Governance/Governance.md) — governance arm index.
- [Operations](Operations/Operations.md) — operations arm index.
- [Decisions](Governance/Decisions/Decisions.md) — the island's Decision Records.
```

The index note uses relative markdown links — never wikilinks — so it is valid outside Obsidian. Each sub-folder that has a named arm (`Governance/`, `Operations/`) gets its own same-name index note, creating a navigable tree one level at a time.

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
└── Streams/             ← work in motion (see ki-kb-streams)
    ├── Active/
    ├── Background/
    ├── Dormant/
    ├── Future/
    └── Settled/
```

The staging areas (`+/`, `-/`) have no zone index note; only the five canonical zones carry one. Pillar folders inside `Pillars/` match the island's topic arms — they are not fixed by the standard; what is fixed is that each carries a same-name index note at its root.

### Internal vs external link style

Internal links (within the same KB) use relative markdown paths — shortest unique path to the target file. External links use inline markdown with descriptive anchor text; bare URLs are not written into note bodies.

```markdown
<!-- Internal — relative path, no wikilink syntax -->

See [Charter](Governance/Charter.md) for the island identity. See [Knowledge Islands](../Philosophy/Knowledge Islands.md) for the portable model.

<!-- External — descriptive anchor text -->

See the [Agent Skills standard](https://agentskills.io/) for the published spec.

<!-- Wrong — wikilinks are Obsidian-only and break outside that tool -->

See [[Charter]] for the island identity. See [[Knowledge Islands]] for the portable model.
```

The `ki-kb` skill works with relative markdown paths throughout; wikilinks in existing notes are read and understood, but never written by the skill.
