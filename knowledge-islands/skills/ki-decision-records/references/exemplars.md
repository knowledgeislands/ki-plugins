# Decision Record Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated illustrations of well-formed Decision Records. Use these when authoring a new DR, checking a draft against the format standard, or explaining the format to a new contributor. Each pattern is drawn from real DRs in the `ki-arcadia-principal` base — the primary reference implementation — and annotated to make the convention visible. The exemplars demonstrate shape, not topic: the subject matter of a DR is incidental; the structure is the point.

## Collections

| Source                                                 | Covers                                                      | Last reviewed |
| ------------------------------------------------------ | ----------------------------------------------------------- | ------------- |
| [Nygard (original)][nygard]                            | The section format and rationale style                      | 2026-06-25    |
| [ADR GitHub community resources][adr-gh]               | Community patterns: Options, Pros/Cons, multi-type variants | 2026-06-25    |
| `ki-arcadia-principal` `Admin/Governance/Decisions/` † | The canonical KI KB-repo implementation of the DR format    | 2026-06-25    |

† The `ki-arcadia-principal` base is not publicly hosted; the DRs are the primary exemplars for the KB-repo shape.

[nygard]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[adr-gh]: https://adr.github.io

## Selected patterns

### Well-formed KB-repo GDR (Governance Decision Record)

`GDR-KI-ARCADIA-001-adopting-decision-records.md` is the reference implementation of the KB-repo shape. Note: frontmatter `decision_type` matches the `GDR-` prefix; `status` tracks maintenance state (freshness), not a decision lifecycle — DRs have none; `decision_depends_on` is a YAML list of full DR codes; the body sections appear in canonical order; voice is active present tense; the References section uses relative Markdown links only.

```markdown
---
type: admin/governance/decision
decision_type: governance
status: current - June 2026
author: Written with Claude
decision_depends_on: ['SDR-KI-ARCADIA-001']
---

# GDR-KI-ARCADIA-001: Adopting Decision Records

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

### Decisions index list

The index — `Decisions.md` in a KB, `README.md` in a code repo — is an **ordered list**, one item per DR, each linking the record by its ID and glossing what it decides, in **reveal order** (a from-scratch build narrative: roots first, then dependents, weaving the sub-scopes in). It is a list, not a table: an index is a single ordered sequence, not tabular or comparison data, so a list carries it with less markup. Per-record dates live in each record's own `**Date:**` field, not the index; there is no status or lifecycle marker — records are living and present-state.

```markdown
1. [GDR-KI-ARCADIA-001](GDR-KI-ARCADIA-001-adopting-decision-records.md) — adopting Decision Records (the format these records follow).
2. [SDR-KI-ARCADIA-001](SDR-KI-ARCADIA-001-knowledge-islands-strategy.md) — Knowledge Islands, the strategy the model serves.
```

### Code-repo ADR (bare Markdown, no frontmatter)

Code repos (non-KB) may omit YAML frontmatter entirely. The `ADR-` prefix aligns with the established Nygard / adr.github.io ecosystem. The body sections (Context, Decision, Consequences) are required; a `**Date:**` line is optional; the `## References` section is optional but encouraged when the decision codifies an existing standard.

```markdown
# ADR-HARNESS-001: Adopting Bun as the Package Manager

**Date:** 2026-01-15

## Context

The harness requires a fast, reliable package manager for skill development. npm and yarn both work but carry legacy overhead that slows the install-run loop in a monorepo of small independent skills.

## Decision

We adopt Bun as the sole package manager and script runner for this repo. `bun install` and `bun run <script>` replace npm equivalents in all documentation and CI.

## Consequences

- Contributors need Bun installed; the README documents the install step.
- `bun.lockb` is committed and binary-diffed in PRs.
- The husky pre-commit hook invokes the relevant governance audits for staged content.

## References

- [Bun documentation](https://bun.sh/docs) -- install, script runner, and lockfile reference.
```
