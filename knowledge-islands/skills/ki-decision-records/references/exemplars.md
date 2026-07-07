# Decision Record Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated illustrations of well-formed Decision Records. Use these when authoring a new DR, checking a draft against the format standard, or explaining the format to a new contributor. Each pattern is drawn from real DRs in the `ki-arcadia-principal` base — the primary reference implementation — and annotated to make the convention visible. The exemplars demonstrate shape, not topic: the subject matter of a DR is incidental; the structure is the point.

## Collections

| Source                                                 | Covers                                                          | Last reviewed |
| ------------------------------------------------------ | --------------------------------------------------------------- | ------------- |
| [Nygard (original)][nygard]                            | The five-section format, status vocabulary, immutability stance | 2026-06-25    |
| [ADR GitHub community resources][adr-gh]               | Community patterns: Options, Pros/Cons, multi-type variants     | 2026-06-25    |
| `ki-arcadia-principal` `Admin/Governance/Decisions/` † | The canonical KI KB-repo implementation of the DR format        | 2026-06-25    |

† The `ki-arcadia-principal` base is not publicly hosted; the DRs are the primary exemplars for the KB-repo shape.

[nygard]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[adr-gh]: https://adr.github.io

## Selected patterns

### Well-formed KB-repo GDR (Governance Decision Record)

`GDR-KI-ARCADIA-001-adopting-decision-records.md` is the reference implementation of the KB-repo shape. Note: frontmatter `decision_type` matches the `GDR-` prefix; `status` tracks maintenance state, not the decision lifecycle (the lifecycle lives in the `**Status:**` body field); `decision_depends_on` is a YAML list of full DR codes; the five sections appear in canonical order; voice is active present tense; the References section uses relative Markdown links only.

```markdown
---
type: admin/governance/decision
decision_type: governance
status: current - June 2026
author: Written with Claude
decision_depends_on: ['SDR-KI-ARCADIA-001']
---

# GDR-KI-ARCADIA-001: Adopting Decision Records

**Status:** Accepted

**Date:** 2026-06-25

## Context

Knowledge Islands produces decisions — about structure, tooling, governance, and direction — but had no mechanism for recording them permanently. The Enactment Process produces `Decision` output rows in proposal documents, but proposals are deleted once settled. Decision rationale disappears with them, leaving only the artefact, not the reasoning.

Two legacy skills existed to partially address this: `ki-adrs`, governing Architecture Decision Records for code repos with the `ADR-` prefix at `docs/decisions/`, and `ki-kdrs`, governing Knowledge Decision Records for KB repos with the `KDR-` prefix at `Admin/Decisions/`. Both used the same Nygard five-section format; the split served domain placement, not any meaningful difference in format or purpose. Maintaining two instruments for an identical format added friction without benefit.

## Decision

Knowledge Islands adopts **Decision Records (DRs)** as the standard instrument for recording significant standalone decisions. The unified `ki-decision-records` skill governs the format across all repo types. DRs use the Nygard five-section format with a `decision_type` field drawn from a nine-value taxonomy.

## Consequences

- `Admin/Decisions/` is the canonical decision store for Knowledge Islands KB repos.
- Significant Enactment Process proposals may produce a DR as a named `Decision` output.
- The nine-value `decision_type` taxonomy covers the full decision surface of a knowledge island.

## References

- [Enactment Process](../../../Pillars/Knowledge%20Islands/Model/Processes/Enactment%20Process/Enactment%20Process.md) -- the process that generates Decision output rows this instrument records.
```

### Well-formed KB-repo SDR (Strategy Decision Record)

`SDR-KI-ARCADIA-001-knowledge-islands-strategy.md` shows the `strategy` type. The frontmatter has no `decision_depends_on` (it is a root decision, so the field is omitted rather than set to `[]`). The Context section is value-neutral — it states structural forces, not advocacy. The Decision section uses active voice and includes a table where a compact tabular form aids comprehension; such tables are permitted within body sections and must follow the standard table conventions (relative links in cells, skimmable rows). The Consequences section seeds the context for successor DRs.

```markdown
---
type: admin/governance/decision
decision_type: strategy
status: current - June 2026
author: Written with Claude
---

# SDR-KI-ARCADIA-001: Knowledge Islands — The Strategy

**Status:** Accepted

**Date:** 2026-06-25

## Context

Knowledge accumulates, but accumulation alone is not understanding. The prevailing approaches to personal and organisational knowledge management treat knowledge as a storage problem. They answer "where does this go?" but not "how does this relate to everything else?", "who holds authority over it?", or "how does it endure beyond any single person?". The result is isolated silos.

## Decision

Knowledge Islands is adopted as the organising strategy. The strategic intent is an archipelago of Knowledge Islands, each owning a distinct domain of human concern:

| Domain    | Island  | Concern                            |
| --------- | ------- | ---------------------------------- |
| Knowledge | Arcadia | Cultivation, integration, learning |
| Justice   | Equitas | Fairness, equity, proportionality  |

Each island is introduced independently when its time comes.

## Consequences

- The Knowledge Islands model governs how all islands are structured, governed, and evolved.
- Arcadia holds the canonical, portable definition of the model. New islands derive from Arcadia, not from one another.
- The strategy is long-horizon and directional.
```

### Decisions index table

The index — `Decisions.md` in a KB, `README.md` in a code repo — carries one row per DR ordered by **reveal order** (the logical reading sequence derived from the `decision_depends_on` dependency graph, roots first). The KB style below links the ID cell; a code repo may instead keep a bare ID in column 0 and link the Title (as the harness `docs/decisions/README.md` does) — the checker accepts either and finds Status and Date by their header labels. Status and Date must match the DR body exactly. Do not use wikilinks in table cells: the `|` in `[[target|Display text]]` breaks the column boundary.

```markdown
| DR ID                                                                  | Title                            | Status   | Date       |
| ---------------------------------------------------------------------- | -------------------------------- | -------- | ---------- |
| [SDR-KI-ARCADIA-001](SDR-KI-ARCADIA-001-knowledge-islands-strategy.md) | Knowledge Islands — The Strategy | Accepted | 2026-06-25 |
| [GDR-KI-ARCADIA-001](GDR-KI-ARCADIA-001-adopting-decision-records.md)  | Adopting Decision Records        | Accepted | 2026-06-25 |
```

### Code-repo ADR (bare Markdown, no frontmatter)

Code repos (non-KB) may omit YAML frontmatter entirely. The `ADR-` prefix aligns with the established Nygard / adr.github.io ecosystem. The five sections and the bold `**Status:**` / `**Date:**` fields are still required; the `## References` section is optional but encouraged when the decision codifies an existing standard.

```markdown
# ADR-HARNESS-001: Adopting Bun as the Package Manager

**Status:** Accepted

**Date:** 2026-01-15

## Context

The harness requires a fast, reliable package manager for skill development. npm and yarn both work but carry legacy overhead that slows the install-run loop in a monorepo of small independent skills.

## Decision

We adopt Bun as the sole package manager and script runner for this repo. `bun install` and `bun run <script>` replace npm equivalents in all documentation and CI.

## Consequences

- Contributors need Bun installed; the README documents the install step.
- `bun.lockb` is committed and binary-diffed in PRs.
- The husky pre-commit hook wires through `bun run ki:lint:check`.

## References

- [Bun documentation](https://bun.sh/docs) -- install, script runner, and lockfile reference.
```
