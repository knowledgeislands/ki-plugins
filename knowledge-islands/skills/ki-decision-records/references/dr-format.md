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

The quotable standard behind [the rubric](audit-rubric.md) and [`../scripts/audit-drs.ts`](../scripts/audit-drs.ts). Grounded in Michael Nygard's original 2011 ADR format (see [sources](sources.md)) with house additions: type-specific prefixes, a `decision_type` frontmatter field (KB repos), and `## References`. Unified from the former `ki-adrs` and `ki-kdrs` instruments. Mode REFRESH re-reads the sources and proposes diffs here.

## Naming convention

```text
<PREFIX>-<SCOPE>-NNN[-<slug>]
```

- **`<PREFIX>`** is one of nine type-specific prefixes (see the prefix table below). The prefix encodes `decision_type` at the filename level.
- **`<SCOPE>`** is one or more uppercase alpha-leading segments separated by `-`. KB island repos use the island's identifier as the first segment (e.g. `ARCADIA`). A scope segment matches `[A-Z][A-Z0-9]*`; a digit-only segment is invalid. Multi-level scopes are valid for sub-domain decisions (e.g. `ARCADIA-TOOLS`).
- **`NNN`** is a zero-padded decimal serial (≥ 3 digits). Monotonically increasing **per prefix within the `<SCOPE>` namespace** — `GDR-KI-ARCADIA-001` and `SDR-KI-ARCADIA-001` may share the integer `001` because they carry different prefixes. The full DR code (prefix + scope + serial) is the globally unique identifier. A `Draft` DR not yet assigned a real serial uses the literal string `XXX` in place of `NNN` (e.g. `GDR-KI-ARCADIA-XXX-pending-decision.md`); it is renamed to the next available per-prefix serial when promoted to `Proposed` or `Accepted`.
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

The repo type is declared in `.ki-config.toml` under `[ki-decision-records]` (or inferred from `[ki-kb-base]` presence). The checker auto-detects the decisions directory (`docs/decisions/` then `Admin/Governance/Decisions/`) and picks the matching index file by mode; pass an explicit path to override.

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

- `type` must be exactly `admin/governance/decision` (per the KI-wide frontmatter standard in `ki-kb-base`).
- `decision_type` must be one of the nine values in the prefix table above.
- The prefix in the filename must match the `decision_type` value.
- `status` tracks the note's maintenance state (draft/current/outdated/archive); the **decision lifecycle** (Draft/Proposed/Accepted/etc.) lives in the body.
- `decision_depends_on` is an optional YAML list of full DR codes that this decision logically depends on (e.g. `["GDR-KI-ARCADIA-001"]`). Cross-scope (cross-repo) references are permitted. Body prose cites only backward — no forward references to higher-numbered DRs of the same type. Omit the field when there are no dependencies.

No instrument tags are required. The `type` field identifies DRs sufficiently.

## Sections

Every DR has exactly these sections, in this order:

### 1. Title (heading)

```markdown
# <PREFIX>-<SCOPE>-NNN: <Short noun phrase>
```

The title is a short noun phrase — not a question, not a full sentence. The heading reproduces the full DR ID so a reader can identify the record from the heading alone.

### 2. Status, Mutability, and Date (bold fields, immediately after the heading)

```markdown
**Status:** Proposed | Accepted | Deprecated | Superseded by <PREFIX>-<SCOPE>-NNN

**Mutability:** open | locked

**Date:** YYYY-MM-DD
```

Freestanding bold-key lines, not a table or code block. `**Date:**` records when the Status last changed.

`**Status:**` is the decision **lifecycle**:

| Value                | Meaning                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `Draft`              | Being written; not yet ready for consideration. Serial is `XXX`.    |
| `Proposed`           | Under discussion; not yet agreed                                    |
| `Accepted`           | Agreed and in effect                                                |
| `Deprecated`         | Being phased out but not replaced by a single successor             |
| `Superseded by <ID>` | Replaced by the named DR; include the full DR code of the successor |

Lifecycle stages may be skipped where appropriate. Many governance DRs move directly `Proposed → Accepted`. A `Draft` receives a per-prefix serial when promoted out of that state.

`**Mutability:**` is a **second, orthogonal axis** — whether the record's content may be edited in place, or is frozen and changed only by supersession:

| Value    | Meaning                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `open`   | Present-focused living record. Clarifications and realignments are edited **in place**, each logged in `## Changelog`. |
| `locked` | Content frozen. Any change requires a **superseding** record.                                                          |

The marker is **always present and aligned to `Status`**, and is a free choice only in `Accepted`:

| Status                     | Mutability                   |
| -------------------------- | ---------------------------- |
| `Draft`, `Proposed`        | `open`                       |
| `Accepted`                 | `open` (default) or `locked` |
| `Deprecated`, `Superseded` | `locked`                     |

The audit asserts this alignment for every non-`Accepted` status, and asserts presence for `Accepted`. `Mutability` is distinct from the frontmatter maintenance `status` (freshness: draft/current/outdated/archive, §Frontmatter) — the value `open` deliberately avoids the word `current` so the two axes never read as one.

**Direction-change gate (human in the loop).** When a proposed edit is a _significant change of direction_ rather than a clarification or realignment, it is **never applied silently and never auto-superseded**. The agent flags the change to the human, who decides: edit the `open` record in place (logging it in `## Changelog`) or spawn a superseding record. A `## Changelog` that is accumulating direction-changing entries is itself the signal that a supersession is due.

When a DR is superseded: (1) update its Status to `Superseded by <ID>` (and its Mutability to `locked`); (2) add a `Supersedes <ID>` line in the successor. Both records are retained — the history is the point.

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

### 7. `## Changelog` (open records only)

```markdown
## Changelog

- YYYY-MM-DD — one-line description of the clarification or realignment.
```

Present on `open` records; the running log of in-place clarifications and realignments. Each entry is one dated line. A `locked` record has no live `## Changelog` (its history is carried by the supersession chain instead). Direction-changing entries do not belong here — they trigger the human-in-the-loop gate (§2) and, if taken, a supersession rather than a log line.

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

**Status:** Proposed

**Mutability:** open

**Date:** YYYY-MM-DD

## Context

<The forces at play. Value-neutral. One to three paragraphs.>

## Decision

<What was decided. Active voice. One paragraph or short list.>

## Consequences

<Positive outcomes, trade-offs, and follow-on constraints.>

## References

- [Source title](../path/to/note.md) -- why cited.

## Changelog

- YYYY-MM-DD — created.
```

### Code repo template (bare Markdown, no frontmatter required)

```markdown
# ADR-<SCOPE>-NNN: <Title>

**Status:** Proposed

**Mutability:** open

**Date:** YYYY-MM-DD

## Context

<The forces at play.>

## Decision

<What was decided.>

## Consequences

<Outcomes and trade-offs.>

## Changelog

- YYYY-MM-DD — created.
```

## Index

The index file — `Decisions.md` in a KB, `README.md` in a code repo (GitHub renders it as the folder landing) — must carry a Markdown table with one row per DR. The first column holds the DR ID, as a relative link or bare; the checker locates the **Status** and **Date** columns by their header labels, so an optional **Type** column is fine. Order rows by **reveal order** — the logical reading sequence derived from the `decision_depends_on` dependency graph (roots first, then dependents), filename within a level. This surfaces the story the DRs collectively tell rather than an arbitrary filename sort (a judgment item — the checker does not enforce a mechanical sort):

```markdown
| DR ID           | Title                                                                     | Type       | Status   | Date       |
| --------------- | ------------------------------------------------------------------------- | ---------- | -------- | ---------- |
| GDR-ARCADIA-001 | [Adopting Decision Records](GDR-ARCADIA-001-adopting-decision-records.md) | governance | Accepted | 2026-06-25 |
```

The Title cell is a relative link. Status and Date must match the DR's own `**Status:**` and `**Date:**` fields. Rows are added in filename order; superseded DRs' Status cells are updated when the superseding DR lands.

## Writing guidance

- **Length**: one to two pages (roughly 200-500 words of body). A DR is a decision record, not a design document.
- **Voice**: active, present tense. "This island adopts X" not "X was adopted".
- **Scope**: one decision per DR. If a decision has multiple independently-reconsidered parts, split them.
- **Mutability**: an `Accepted` record's editability is governed by its `**Mutability:**` marker (§2), not by an absolute rule. An `open` record is edited in place for clarifications and realignments (logged in `## Changelog`); a `locked` record is frozen and changed only by supersession. A significant change of direction is escalated to the human-in-the-loop gate (§2), never applied silently.
- **No roadmap or TODO inside a DR**: a record states the decision as it currently stands. Forward-looking, still-to-do, or "revisit later" work is lifted to the repo's ROADMAP (code repo) or a stream (KB) — never narrated in the record as an "open roadmap item", "parked", or "not yet started".
- **Chaining**: the Consequences of one DR become the Context of the next. Write each as if handing off to a future author.
- **Language**: follow the island's language convention (British English for KI islands).
- **Prefix choice**: if you are uncertain which `decision_type` fits, prefer the broader category. A governance DR is about how the island is run; an architecture DR is about how it is structured.
