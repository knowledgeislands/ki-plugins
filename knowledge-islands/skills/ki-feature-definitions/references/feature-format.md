# The Feature Definitions format

The quotable standard behind [`../SKILL.md`](../SKILL.md). It defines how a Feature Definition corpus is laid out, how a single requirement is written, and the rules the checker ([`../scripts/audit-features.ts`](../scripts/audit-features.ts)) enforces. The line-by-line criteria are in [audit-rubric.md](audit-rubric.md); worked examples are in [exemplars.md](exemplars.md).

## The three-doc split

A repo's `docs/` separates three concerns, and a Feature Definition is exactly one of them:

| Doc          | Question | Instrument                               |
| ------------ | -------- | ---------------------------------------- |
| `decisions/` | Why      | Decision Records (`ki-decision-records`) |
| `features/`  | What     | Feature Definitions (**this skill**)     |
| `guides/`    | How      | Prose guides                             |

A requirement states **behaviour**, not rationale and not procedure. If a statement starts explaining _why_, that reasoning belongs in a Decision Record the requirement cites; if it explains _how to operate_, it belongs in a guide.

## Layout

- Feature Definitions live in **`docs/features/`**, flat — **one file per area** (e.g. `authentication.md`, `site-seo.md`, `billing.md`). No nesting.
- **`index.md`** is the overview and the registry. It carries, in order: a purpose blurb; a "how this fits with other docs" note; a "how to read a requirement" example; the **ID scheme**; the **Gaps convention**; and one or more **areas tables**.
- Each area file opens with an H1 `# <Title> — <PREFIX>`, a one-paragraph scope blurb linking back to `index.md`, and an optional `> **Status:**` note, then the requirements grouped under `## <sub-area>` H2 sections, and finally a `## Gaps` section.

## The areas table

In `index.md`, a Markdown table registers each area. The checker locates the columns by the header labels **`Prefix`** and **`File`** (any column order; other columns such as `Covers` are free):

```markdown
| File              | Prefix          | Covers                                  |
| ----------------- | --------------- | --------------------------------------- |
| authentication.md | `AUTH`          | Login, sessions, tokens                 |
| site-seo.md       | `SITE-SEO`      | Canonical URLs, robots, structured data |
| bloom.md          | `BLOOM`·`TRUST` | Growth surfaces and trust signals       |
```

- A **prefix belongs to exactly one file**; a **file may host more than one prefix** (list them in the cell, separated by `·`, `,`, or `/`).
- Multiple areas tables are allowed — e.g. one per higher-level Area grouping (`### Public site`, `### Sanctuary`). The checker reads them all.

## The requirement

Each requirement is a **level-3 heading** followed by a normative statement and a verification hook:

```markdown
### SITE-SEO-002 — Absolute canonical URL

An indexable page MUST emit a `<link rel="canonical">` whose href is the absolute URL `site.url` + `page.url`.

_Verify:_ a built page at `/culture/` has `<link rel="canonical" href="{site.url}/culture/">`.
```

- **Heading** — `### <PREFIX>-NNN — <title>`. `PREFIX` is one or more uppercase alpha-leading segments joined by hyphens (`AUTH`, `SITE-SEO`); `NNN` is zero-padded, ≥ 3 digits; the separator before the title is an **em dash** (`—`). `NNN` is sequential within the file (grouped under H2s, but numbered across the whole file, not per H2).
- **Statement** — one paragraph using an **RFC-2119** keyword in uppercase (`MUST`, `MUST NOT`, `SHALL`, `SHOULD`, `SHOULD NOT`, `MAY`, `REQUIRED`, `RECOMMENDED`, `OPTIONAL`). A requirement may pair a `MUST` with a `MUST NOT`; unrelated behaviours split into separate IDs so each verifies independently.
- **`_Verify:_`** — one line, the italic label `_Verify:_` followed by the concrete check: a built-output assertion, a unit test, or a linked source file with the specific symbol/behaviour to inspect. This is the hook a test suite (or a reader) uses to confirm the requirement holds.

## Append-only IDs

IDs are **append-only and never reused**. A retired requirement keeps its number, its title struck through with a `(deprecated)` note (a deprecated entry is exempt from the statement/verify checks). **Never renumber to tidy up** — stable IDs are what let tests, commits, and cross-references point at a requirement over time.

## The Gaps backlog

Each area file may end with a `## Gaps` section (the heading may extend, e.g. `## Gaps & candidate behaviours`). It holds **unnumbered** bullets: known divergences from the contract, or desirable behaviours not yet built. Gaps are deliberately ID-less so they sit **outside** the as-built contract — a backlog to consider, not something to test against. The checker exempts everything under a `## Gaps …` heading from ID and requirement checks. Promote a gap to a numbered requirement only once it is built and true.

## Deciding what is a requirement

- **As-built, behaviour-level** — the numbered contract describes what the system **does** now, at the level of observable behaviour, not implementation detail. Anything aspirational lives in Gaps.
- **Governed by a decision** — where a behaviour follows from a recorded decision, the requirement cites the DR. The corpus need not exhaust this, but the link is the audit trail from why to what.
