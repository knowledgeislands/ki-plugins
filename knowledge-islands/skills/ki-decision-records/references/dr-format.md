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

The quotable standard behind [the rubric](audit-rubric.md) and [`../scripts/audit-drs.ts`](../scripts/audit-drs.ts). Grounded in Michael Nygard's original 2011 ADR format (see [sources](sources.md)) with house additions: type-specific prefixes, a `decision_type` frontmatter field (KB repos), and `## References`. Unified from the former `ki-adrs` and `ki-kdrs` instruments. A DR is a **living present-state record** — it states the decision as it stands now and is edited in place; it carries no status lifecycle, mutability marker, supersession chain, or changelog (see [Writing guidance](#writing-guidance)). Mode REFRESH re-reads the sources and proposes diffs here.

## Naming convention

```text
<PREFIX>-<SCOPE>-NNN[-<slug>]
```

- **`<PREFIX>`** is one of nine type-specific prefixes (see the prefix table below). The prefix encodes `decision_type` at the filename level.
- **`<SCOPE>`** is one or more uppercase alpha-leading segments separated by `-`. KB island repos use the island's identifier as the first segment (e.g. `ARCADIA`). A scope segment matches `[A-Z][A-Z0-9]*`; a digit-only segment is invalid. Multi-level scopes are valid for sub-domain decisions (e.g. `ARCADIA-TOOLS`).
- **`NNN`** is a zero-padded decimal serial (≥ 3 digits). Monotonically increasing **per prefix within the `<SCOPE>` namespace** — `GDR-KI-ARCADIA-001` and `SDR-KI-ARCADIA-001` may share the integer `001` because they carry different prefixes. The full DR code (prefix + scope + serial) is the globally unique identifier. A pending DR not yet assigned a real serial uses the literal string `XXX` in place of `NNN` (e.g. `GDR-KI-ARCADIA-XXX-pending-decision.md`); it is renamed to the next available per-prefix serial once it is numbered.
- **`<slug>`** (optional, preferable) is a short lowercase hyphenated title summary. Makes the file self-describing when referenced by ID from other records or tools.

Examples: `GDR-KI-ARCADIA-001-adopting-decision-records`, `SDR-KI-ARCADIA-001-knowledge-islands-strategy`, `ADR-KI-HARNESS-003-adopting-adrs`.

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

- [Title](../path/to/note.md) -- one-line note on why it is cited.
```

Expected when the decision codifies an existing standard or cites a prior source. Relative Markdown links only. Omit entirely if there are genuinely no relevant references.

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

The index file — `Decisions.md` in a KB, `README.md` in a code repo (GitHub renders it as the folder landing) — must carry a Markdown table with one row per DR. The first column holds the DR ID, as a relative link or bare; the checker locates an optional **Date** column by its header label, so extra columns (e.g. **Type**) are fine. Order rows by **reveal order** — the logical reading sequence derived from the `decision_depends_on` dependency graph (roots first, then dependents), filename within a level. This surfaces the story the DRs collectively tell rather than an arbitrary filename sort (a judgment item — the checker does not enforce a mechanical sort):

```markdown
| DR ID           | Title                                                                     | Type       | Date       |
| --------------- | ------------------------------------------------------------------------- | ---------- | ---------- |
| GDR-ARCADIA-001 | [Adopting Decision Records](GDR-ARCADIA-001-adopting-decision-records.md) | governance | 2026-06-25 |
```

The Title cell is a relative link. A **Date** column (if present) must match the DR's own `**Date:**` field. There is no **Status** column — records are living and present-state, not lifecycle-tracked.

## Writing guidance

- **Length**: one to two pages (roughly 200-500 words of body). A DR is a decision record, not a design document.
- **Voice**: active, present tense. "This island adopts X" not "X was adopted".
- **Scope**: one decision per DR. If a decision has multiple independently-reconsidered parts, split them.
- **Edit in place**: a DR is a living record — clarifications, realignments, and changes of direction all **edit the existing record** so it always reads as written today. There is no supersession chain and no changelog; superseded wording simply goes. A significant change of direction is worth flagging to the human before applying, but it still lands as an in-place edit, not a new superseding record.
- **No roadmap or TODO inside a DR**: a record states the decision as it currently stands. Forward-looking, still-to-do, or "revisit later" work is lifted to the repo's ROADMAP (code repo) or a stream (KB) — never narrated in the record as an "open roadmap item", "parked", or "not yet started".
- **Chaining**: the Consequences of one DR become the Context of the next. Write each as if handing off to a future author.
- **Language**: follow the island's language convention (British English for KI islands).
- **Prefix choice**: if you are uncertain which `decision_type` fits, prefer the broader category. A governance DR is about how the island is run; an architecture DR is about how it is structured.
