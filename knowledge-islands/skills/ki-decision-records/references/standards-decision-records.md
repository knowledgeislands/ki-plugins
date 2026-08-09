# Decision Records standard

## Contents

- [Naming convention](#naming-convention)
- [Prefix table](#prefix-table)
- [Placement](#placement)
- [Frontmatter](#frontmatter)
- [Sections](#sections)
- [Templates](#templates)
- [Collection root](#collection-root)
- [Index](#index)
- [Writing guidance](#writing-guidance)

The normative standard behind [the generated rubric](rubric.md). Grounded in Michael Nygard's original 2011 ADR format (see [the source list](sources.md)) with house additions: universal decision metadata, type-specific prefixes, and `## References`. Unified from the former `ki-adrs` and `ki-kdrs` instruments. A DR is a **living present-state record** — it states the decision as it stands now and is edited in place; its metadata status records document currency, never a decision lifecycle, mutability marker, supersession chain, or changelog (see [Writing guidance](#writing-guidance)). Mode REFRESH re-reads the sources and proposes diffs here.

## Naming convention

```text
<ID>-slugify(<title>).md
```

- The filename is **`<ID>-<title-slug>.md`**: the canonical uppercase ID, a dash, then the title lowercased with every run of non-ASCII-alphanumeric characters replaced by one `-`, and leading or trailing dashes removed.
- The H1 is **`<ID>: <title>`**. **`<PREFIX>`** is one of nine type-specific prefixes (see the prefix table below); it begins the ID and encodes `decision_type` at the filename level.
- **`<SCOPE>`** is one or more uppercase alpha-leading segments separated by `-`. KB island repos use the island's identifier as the first segment (e.g. `ARCADIA`). A scope segment matches `[A-Z][A-Z0-9]*`; a digit-only segment is invalid. Multi-level scopes are valid for sub-domain decisions (e.g. `ARCADIA-TOOLS`).
- **`NNN`** is a zero-padded decimal serial (≥ 3 digits). Serials in each prefix+scope series **start at `001` and are contiguous** — no gaps, whatever the cause. Numbering is **per prefix within the `<SCOPE>` namespace** — `GDR-KI-ARCADIA-001` and `SDR-KI-ARCADIA-001` may share the integer `001` because they carry different prefixes, and each prefix runs its own unbroken `001…NNN` sequence. The full DR code (prefix + scope + serial) is the globally unique identifier. A pending DR not yet assigned a real serial uses the literal string `XXX` in place of `NNN` (e.g. `GDR-KI-ARCADIA-XXX-pending-decision.md`); it is renamed to the next available per-prefix serial once it is numbered. If a record is **reclassified** to a different prefix (e.g. an ADR that is really a governance decision becomes a GDR), it takes the next serial in its new series and its old serial is **not** left vacant: the remaining records in the old series renumber to close the gap, and every citation of the shifted codes is swept in the same change. Git history and commit messages that mention the old codes are accepted staleness. A deliberately verbatim shared record declares `shared_record: true` in every approved copy. It retains its canonical ID. Where the receiving collection has no ordinary record in that prefix+scope, the mirror is excluded from local serial-continuity calculation; where it does, the mirror stays in the series. This narrow exception never applies to an ordinary local record. Examples: `GDR-KI-ARCADIA-001-adopting-decision-records.md`, `SDR-KI-ARCADIA-001-knowledge-islands-strategy.md`, `ADR-KI-HARNESS-001-repository-structure-the-five-part-bundle.md`.

## Prefix table

Each type maps to a fixed prefix, a human-readable record type, and a durable public specification URL. Required metadata must duplicate the canonical values encoded by the H1 prefix (FAIL check). Whether that prefix actually fits the decision is a human judgement, not a value the checker can derive.

| Prefix | `type` | `decision_type` | `type_url` | Covers |
| --- | --- | --- | --- | --- |
| `SDR-` | Strategy Decision Record | `strategy` | `.../sdr` | Direction, goals, positioning, scope |
| `PDR-` | Product Decision Record | `product` | `.../pdr` | Purpose, outputs, scope of the repo or island |
| `ADR-` | Architecture Decision Record | `architecture` | `.../adr` | Structure, topology, component relationships |
| `DDR-` | Data Decision Record | `data` | `.../ddr` | Schemas, data governance, storage choices |
| `XDR-` | Security Decision Record | `security` | `.../xdr` | Security posture, trust boundaries, access |
| `ODR-` | Operations Decision Record | `operations` | `.../odr` | Operational procedures, deployment, maintenance |
| `GDR-` | Governance Decision Record | `governance` | `.../gdr` | Processes, authority, change mechanisms |
| `RDR-` | Research Decision Record | `research` | `.../rdr` | Methodology choices, investigation frameworks |
| `KDR-` | Knowledge Decision Record | `knowledge` | `.../kdr` | Taxonomy, naming, classification, vocabularies |

Each `type_url` expands from `https://knowledgeislands.info/specifications/decision-records/{prefix-lowercase}`. The URLs are stable metadata now, so the future public pages do not require a repository migration. `ADR-` aligns with the established ADR ecosystem (Nygard, adr.github.io). `KDR-` reclaims the former Knowledge Decision Records prefix with a precise `knowledge` scope.

## Placement

| Repo type          | Default decisions directory   | Index file     | Frontmatter          |
| ------------------ | ----------------------------- | -------------- | -------------------- |
| `repo_type = "kb"` | `Admin/Governance/Decisions/` | `Decisions.md` | Required (see below) |
| code / unset       | `docs/decisions/`             | `README.md`    | Required (see below) |

The repo type is declared in `.ki-config.toml` under `[skills.ki-decision-records]` (or inferred from `[skills.ki-repo-kb]` presence). The checker auto-detects the decisions directory (`docs/decisions/` then `Admin/Governance/Decisions/`) and picks the matching index file by mode; pass an explicit path to override.

## Frontmatter

Every Decision Record begins with YAML frontmatter. `id`, `title`, `date`, `status`, `type`, `type_url`, and `decision_type` are required in every repository. This makes the identifier and kind immediately legible without relying on an acronym alone, while retaining stable machine and public-reference values for tooling.

**Universal template:**

```yaml
---
id: GDR-<SCOPE>-NNN
title: '<Title>'
date: YYYY-MM-DD
status: current
type: Governance Decision Record
type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_type: governance
---
```

- `id` exactly repeats the H1 identifier and its canonical prefix/scope/serial value.
- `title` exactly repeats the H1 title after `:`.
- `date` uses `YYYY-MM-DD` and records the decision's current as-of date.
- `status` tracks the note's maintenance state (for example `draft`, `current`, `outdated`, or `archive`) — never a decision lifecycle.
- `type` exactly matches the human-readable prefix type in the table above (for example `Architecture Decision Record`).
- `type_url` exactly matches the durable public specification URL in the table above.
- `decision_type` must exactly match the canonical value encoded by the filename prefix in the table above.
- Choose the prefix by what the decision is actually about. If the filename and metadata disagree, a human resolves whether the canonical ID or the metadata is wrong; CONFORM never chooses by overwriting either side.
- `decision_depends_on` is an optional YAML list of full DR codes that this decision logically depends on (e.g. `["GDR-KI-ARCADIA-001"]`). Cross-scope (cross-repo) references are permitted. Body prose cites only backward — no forward references to higher-numbered DRs of the same type. Omit the field when there are no dependencies.
- `shared_record: true` is an optional, narrow marker for a deliberately byte-identical record mirrored across approved repositories. The record keeps its canonical foreign ID. It is excluded from a receiving collection’s serial series only when that prefix+scope has no ordinary local records; otherwise it remains part of the local sequence. Use it in every copy, including the canonical source copy, so the record remains identical and reviewers can recognise the exception. It does not make ordinary local records shareable or relax any other metadata, body, index, or identity rule.

## Sections

Every DR has exactly these sections, in this order:

### 1. Title (heading)

```markdown
# <PREFIX>-<SCOPE>-NNN: <Short noun phrase>
```

The title is a short noun phrase — not a question, not a full sentence. The heading reproduces the full DR ID so a reader can identify the record from the heading alone.

### 2. Frontmatter (before the heading)

The required frontmatter carries the ID, title, date, maintenance status, human-readable type, type URL, and machine decision type. There is deliberately **no bold `Date`, `Status`, or `Mutability` line**: a DR is kept true by **editing it in place**, not by tracking a decision lifecycle or freezing-and-superseding. A change of direction edits the live record (see [Writing guidance](#writing-guidance)); there is no supersession chain and no retained history — the record reads as if written today.

### 3. `## Context`

The forces at play — structural, operational, relational, temporal — that made a decision necessary. Value-neutral: state facts, not advocacy. Avoid "we need to" or "the problem is"; prefer "the island currently..." or "two approaches exist...". One to three paragraphs.

### 4. `## Decision`

The team's response to those forces. One paragraph or a short bulleted list. Active voice: "This island adopts..." or "We will...". Not rationale — just what was decided. Rationale belongs in Context and Consequences.

### 5. `## Consequences`

The resulting context after the decision is applied — positive outcomes, trade-offs, and neutral follow-on constraints. Consequences from one DR frequently become the Context of the next.

### 6. `## References` (optional)

```markdown
## References

- [DR-CODE](DR-CODE-title-slug.md) -- the foundational decision this record builds on.
```

The `## References` section is a list of **followable links only**, of exactly two kinds: **sibling DRs in the same decisions set** (backward in the reading-order layering — the foundations a decision builds on) and **external URLs** (a tool's homepage, a spec, a source). It is not a place for prose or for named internal artefacts. Skills, guides, feature definitions, workflows, KB notes, and the standards a decision grounds in are **named in the body**, where the reader meets them — never listed here — so the record stays self-contained and nothing depends on chasing a link that rots. External links are supplementary: the record must read completely without following them. Omit the section entirely when a record has no such links.

## Templates

### Universal template

```markdown
---
id: GDR-<SCOPE>-NNN
title: '<Title>'
date: YYYY-MM-DD
status: current
type: Governance Decision Record
type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_type: governance
---

# GDR-<SCOPE>-NNN: <Title>

## Context

<The forces at play. Value-neutral. One to three paragraphs.>

## Decision

<What was decided. Active voice. One paragraph or short list.>

## Consequences

<Positive outcomes, trade-offs, and follow-on constraints.>

## References

- [Source title](../path/to/note.md) -- why cited.
```

## Collection root

A collection created under this standard begins by adopting the instrument itself: **`GDR-<SCOPE>-001: Adopting Decision Records`** is the first indexed record.

The index carries this non-rendered provenance marker immediately before its ordered list so AUDIT can distinguish a collection created under the rule from an established migration case:

```markdown
<!-- ki-decision-records: adoption-root -->

1. [GDR-<SCOPE>-001](GDR-<SCOPE>-001-adopting-decision-records.md) — adopting Decision Records.
```

An established collection without the marker is valid as-is: do not automatically insert, rename, renumber, or reposition records merely to adopt this later convention.

## Index

The index file — `Decisions.md` in a KB, `README.md` in a code repo (GitHub renders it as the folder landing) — must carry an **ordered list**, one item per DR, each item linking the record by its ID. A list, not a table: a table earns its overhead only for tabular data or comparison across columns, and an index is neither — it is a single ordered sequence, so a list carries it with less markup. Order the items by **reveal order** — a curated **build narrative**: the records read as if written from scratch, before anything was created, each building on the ones before it, so a concept is introduced at its record and later records may name it explicitly. Weave the sub-scopes into this one sequence where they belong rather than grouping them apart. The order is authorial — a record's dependence on earlier ones is often stated in prose, not only in the `decision_depends_on` field, so the sequence is not mechanically derived. Two constraints hold: roots precede dependents across the whole set (judgment — INDEX-6), and **within any one prefix the serials ascend in reveal order** — a `PREFIX-NNN` never appears before a lower-numbered `PREFIX-MMM`. If the build narrative wants a record earlier than its serial allows, that is a drafting issue fixed by renumbering, not by placing it out of sequence (mechanical — INDEX-8):

```markdown
1. [GDR-ARCADIA-001](GDR-ARCADIA-001-adopting-decision-records.md) — adopting Decision Records (the format these records follow).
2. [GDR-ARCADIA-002](GDR-ARCADIA-002-next-decision.md) — the next decision in the build sequence.
```

Each item links the record by its ID and gives a short gloss of what it decides. Per-record dates and maintenance status live in each record's frontmatter, not in the index. There is no decision lifecycle marker — records are living and present-state.

## Writing guidance

- **Length**: one to two pages (roughly 200-500 words of body). A DR is a decision record, not a design document.
- **Voice**: active, present tense. "This island adopts X" not "X was adopted".
- **Scope**: one decision per DR. If a decision has multiple independently-reconsidered parts, split them.
- **Edit in place**: a DR is a living record — clarifications, realignments, and changes of direction all **edit the existing record** so it always reads as written today. There is no supersession chain and no changelog; superseded wording simply goes. A significant change of direction is worth flagging to the human before applying, but it still lands as an in-place edit, not a new superseding record.
- **No roadmap or TODO inside a DR**: a record states the decision as it currently stands. Forward-looking, still-to-do, or "revisit later" work is lifted to the repo's ROADMAP (code repo) or a stream (KB) — never narrated in the record as an "open roadmap item", "parked", or "not yet started".
- **State the decision, not the enforcement detail**: a DR records what was decided and names the concept or standard that carries it — never the volatile identifiers the enforcing skill owns. Do not cite rubric or checker criterion IDs (a `SHAPE-N`, `SCRIPT-N`, `MEM-N` tag) or a standard's section numbers (`§4`): the enforcing skill renumbers them without the decision changing, silently staling the record. Say "the skills rubric enforces this" or "the ki-tokenomics standard covers model-tier selection", and let the skill own the specifics.
- **Chaining**: the Consequences of one DR become the Context of the next. Write each as if handing off to a future author.
- **Language**: follow the island's language convention (British English for KI islands).
- **Prefix choice**: if you are uncertain which `decision_type` fits, prefer the broader category. A governance DR is about how the island is run; an architecture DR is about how it is structured.
