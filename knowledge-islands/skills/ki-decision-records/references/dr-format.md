# DR format standard

## Contents

- [Naming convention](#naming-convention)
- [Prefix table](#prefix-table)
- [Placement](#placement)
- [Frontmatter](#frontmatter)
- [Sections](#sections)
- [Templates](#templates)
- [Index](#index)
- [Writing guidance](#writing-guidance)

**Contents:** [Naming convention](#naming-convention) · [Prefix table](#prefix-table) · [Placement](#placement) · [Frontmatter](#frontmatter) · [Sections](#sections) · [Templates](#templates) · [Index](#index) · [Writing guidance](#writing-guidance)

The quotable standard behind [the rubric](audit-rubric.md) and [`../scripts/audit.ts`](../scripts/audit.ts). Grounded in Michael Nygard's original 2011 ADR format (see [sources](sources.md)) with house additions: type-specific prefixes, a `decision_type` frontmatter field (KB repos), and `## References`. Unified from the former `ki-adrs` and `ki-kdrs` instruments. A DR is a **living present-state record** — it states the decision as it stands now and is edited in place; it carries no status lifecycle, mutability marker, supersession chain, or changelog (see [Writing guidance](#writing-guidance)). Mode REFRESH re-reads the sources and proposes diffs here.

## Naming convention

```text
<PREFIX>-<SCOPE>-NNN[-<slug>]
```

- **`<PREFIX>`** is one of nine type-specific prefixes (see the prefix table below). The prefix encodes `decision_type` at the filename level.
- **`<SCOPE>`** is one or more uppercase alpha-leading segments separated by `-`. KB island repos use the island's identifier as the first segment (e.g. `ARCADIA`). A scope segment matches `[A-Z][A-Z0-9]*`; a digit-only segment is invalid. Multi-level scopes are valid for sub-domain decisions (e.g. `ARCADIA-TOOLS`).
- **`NNN`** is a zero-padded decimal serial (≥ 3 digits). Serials in each prefix+scope series **start at `001` and are contiguous** — no gaps, whatever the cause. Numbering is **per prefix within the `<SCOPE>` namespace** — `GDR-KI-ARCADIA-001` and `SDR-KI-ARCADIA-001` may share the integer `001` because they carry different prefixes, and each prefix runs its own unbroken `001…NNN` sequence. The full DR code (prefix + scope + serial) is the globally unique identifier. A pending DR not yet assigned a real serial uses the literal string `XXX` in place of `NNN` (e.g. `GDR-KI-ARCADIA-XXX-pending-decision.md`); it is renamed to the next available per-prefix serial once it is numbered. If a record is **reclassified** to a different prefix (e.g. an ADR that is really a governance decision becomes a GDR), it takes the next serial in its new series and its old serial is **not** left vacant: the remaining records in the old series renumber to close the gap, and every citation of the shifted codes is swept in the same change. Git history and commit messages that mention the old codes are accepted staleness.
- **`<slug>`** (optional, preferable) is a short lowercase hyphenated title summary. Makes the file self-describing when referenced by ID from other records or tools.

Examples: `GDR-KI-ARCADIA-001-adopting-decision-records`, `SDR-KI-ARCADIA-001-knowledge-islands-strategy`, `ADR-KI-HARNESS-001-repository-structure`.

## Prefix table

Each `decision_type` maps to a fixed prefix. The prefix and `decision_type` must agree in KB repos (FAIL check).

| Prefix | `decision_type` | Covers                                          |
| ------ | --------------- | ----------------------------------------------- |
| `SDR-` | `strategy`      | Direction, goals, positioning, scope            |
| `PDR-` | `product`       | Purpose, outputs, scope of the repo or island   |
| `ADR-` | `architecture`  | Structure, topology, component relationships    |
| `DDR-` | `data`          | Schemas, data governance, storage choices       |
| `XDR-` | `security`      | Security posture, trust boundaries, access      |
| `ODR-` | `operations`    | Operational procedures, deployment, maintenance |
| `GDR-` | `governance`    | Processes, authority, change mechanisms         |
| `RDR-` | `research`      | Methodology choices, investigation frameworks   |
| `KDR-` | `knowledge`     | Taxonomy, naming, classification, vocabularies  |

`ADR-` aligns with the established ADR ecosystem (Nygard, adr.github.io). `KDR-` reclaims the former Knowledge Decision Records prefix with a precise `knowledge` scope.

## Placement

| Repo type          | Default decisions directory   | Index file     | Frontmatter          |
| ------------------ | ----------------------------- | -------------- | -------------------- |
| `repo_type = "kb"` | `Admin/Governance/Decisions/` | `Decisions.md` | Required (see below) |
| code / unset       | `docs/decisions/`             | `README.md`    | Optional             |

The repo type is declared in `.ki-config.toml` under `[ki-decision-records]` (or inferred from `[ki-kb]` presence). The checker auto-detects the decisions directory (`docs/decisions/` then `Admin/Governance/Decisions/`) and picks the matching index file by mode; pass an explicit path to override.

## Frontmatter

KB repos require YAML frontmatter on every DR. Code repos may omit it.

**KB repo template:**

```yaml
---
type: admin/governance/decision
decision_type: governance
status: draft - Month YYYY
author: Written with Claude
decision_depends_on: []
---
```

- `type` must be exactly `admin/governance/decision` (per the KI-wide frontmatter standard in `ki-kb`).
- `decision_type` must be one of the nine values in the prefix table above.
- The prefix in the filename must match the `decision_type` value.
- `status` tracks the note's maintenance state (draft/current/outdated/archive) per the KI-wide frontmatter standard — the note's freshness, not a decision lifecycle (DRs have none; a DR that exists is in effect).
- `decision_depends_on` is an optional YAML list of full DR codes that this decision logically depends on (e.g. `["GDR-KI-ARCADIA-001"]`). Cross-scope (cross-repo) references are permitted. Body prose cites only backward — no forward references to higher-numbered DRs of the same type. Omit the field when there are no dependencies.

No instrument tags are required. The `type` field identifies DRs sufficiently.

## Sections

Every DR has exactly these sections, in this order:

### 1. Title (heading)

```markdown
# <PREFIX>-<SCOPE>-NNN: <Short noun phrase>
```

The title is a short noun phrase — not a question, not a full sentence. The heading reproduces the full DR ID so a reader can identify the record from the heading alone.

### 2. Date (optional, immediately after the heading)

```markdown
**Date:** YYYY-MM-DD
```

A single optional freestanding bold-key line recording when the decision was taken or last revised — an "as of" marker, not a lifecycle field. Omit it when a date adds nothing. There is deliberately **no `**Status:**` and no `**Mutability:**` line**: a DR that exists is in effect, and it is kept true by **editing it in place**, not by tracking a lifecycle or freezing-and-superseding. A change of direction edits the live record (see [Writing guidance](#writing-guidance)); there is no supersession chain and no retained history — the record reads as if written today.

### 3. `## Context`

The forces at play — structural, operational, relational, temporal — that made a decision necessary. Value-neutral: state facts, not advocacy. Avoid "we need to" or "the problem is"; prefer "the island currently..." or "two approaches exist...". One to three paragraphs.

### 4. `## Decision`

The team's response to those forces. One paragraph or a short bulleted list. Active voice: "This island adopts..." or "We will...". Not rationale — just what was decided. Rationale belongs in Context and Consequences.

### 5. `## Consequences`

The resulting context after the decision is applied — positive outcomes, trade-offs, and neutral follow-on constraints. Consequences from one DR frequently become the Context of the next.

### 6. `## References` (optional)

```markdown
## References

- [DR-CODE](DR-CODE-slug.md) -- the foundational decision this record builds on.
```

The `## References` section is a list of **followable links only**, of exactly two kinds: **sibling DRs in the same decisions set** (backward in the reading-order layering — the foundations a decision builds on) and **external URLs** (a tool's homepage, a spec, a source). It is not a place for prose or for named internal artefacts. Skills, guides, feature definitions, workflows, KB notes, and the standards a decision grounds in are **named in the body**, where the reader meets them — never listed here — so the record stays self-contained and nothing depends on chasing a link that rots. External links are supplementary: the record must read completely without following them. Omit the section entirely when a record has no such links.

## Templates

### KB repo template

```markdown
---
type: admin/governance/decision
decision_type: governance
status: draft - Month YYYY
author: Written with Claude
---

# GDR-<SCOPE>-NNN: <Title>

**Date:** YYYY-MM-DD

## Context

<The forces at play. Value-neutral. One to three paragraphs.>

## Decision

<What was decided. Active voice. One paragraph or short list.>

## Consequences

<Positive outcomes, trade-offs, and follow-on constraints.>

## References

- [Source title](../path/to/note.md) -- why cited.
```

### Code repo template (bare Markdown, no frontmatter required)

```markdown
# ADR-<SCOPE>-NNN: <Title>

**Date:** YYYY-MM-DD

## Context

<The forces at play.>

## Decision

<What was decided.>

## Consequences

<Outcomes and trade-offs.>
```

## Index

The index file — `Decisions.md` in a KB, `README.md` in a code repo (GitHub renders it as the folder landing) — must carry an **ordered list**, one item per DR, each item linking the record by its ID. A list, not a table: a table earns its overhead only for tabular data or comparison across columns, and an index is neither — it is a single ordered sequence, so a list carries it with less markup. Order the items by **reveal order** — a curated **build narrative**: the records read as if written from scratch, before anything was created, each building on the ones before it, so a concept is introduced at its record and later records may name it explicitly. Weave the sub-scopes into this one sequence where they belong rather than grouping them apart. The order is authorial — a record's dependence on earlier ones is often stated in prose, not only in the `decision_depends_on` field, so the sequence is not mechanically derived. Two constraints hold: roots precede dependents across the whole set (judgment — INDEX-6), and **within any one prefix the serials ascend in reveal order** — a `PREFIX-NNN` never appears before a lower-numbered `PREFIX-MMM`. If the build narrative wants a record earlier than its serial allows, that is a drafting issue fixed by renumbering, not by placing it out of sequence (mechanical — INDEX-8):

```markdown
1. [GDR-ARCADIA-001](GDR-ARCADIA-001-adopting-decision-records.md) — adopting Decision Records (the format these records follow).
2. [GDR-ARCADIA-002](GDR-ARCADIA-002-...) — the next decision in the build sequence.
```

Each item links the record by its ID and gives a short gloss of what it decides. Per-record dates live in each record's own `**Date:**` field, not in the index. There is no status or lifecycle marker — records are living and present-state.

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
