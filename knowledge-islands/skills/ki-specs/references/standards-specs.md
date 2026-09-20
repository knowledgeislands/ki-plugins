# Specifications standard

This standard defines how a Specifications corpus is laid out and how each accepted requirement is written. The hosted structured rubric enforces its mechanical criteria; the generated [rubric](rubric.md) publishes every criterion, and [exemplars](exemplars.md) illustrate representative shapes.

## The four-document split

`ki-repo` owns the repository-wide documentation topology. This skill owns only the behaviour-level Specifications concern:

| Location          | Question | Instrument                               |
| ----------------- | -------- | ---------------------------------------- |
| `docs/decisions/` | Why      | Decision Records (`ki-decision-records`) |
| `docs/specs/`     | What     | Specifications (this skill)              |
| `docs/guides/`    | How      | Guides (`ki-guides`)                     |
| `docs/roadmap/`   | When     | Work records (`ki-work-roadmap`)         |

A requirement states an accepted contract, not rationale or operating procedure. Reasoning belongs in a Decision Record; instructions belong in a guide.

Specifications distinguish two reader-facing forms:

- **User-observable behaviours** describe outcomes a person or integrating system can observe through the supported product surface.
- **Quality properties** describe measurable or reviewable characteristics of those outcomes, such as accessibility, compatibility, determinism, performance, reliability, security, and visual fidelity.

Use those names as H2 sections where they fit. A narrower H2 may be used when its opening text explicitly identifies which form it contains. Internal implementation detail belongs in a Decision Record unless it defines a necessary product quality or integration contract.

## Layout

- Applicability is declaration-led. A repository that does not declare `[skills.ki-specs]` has no Specifications obligation. Once declared, missing, malformed, symlinked, or otherwise unsafe corpus evidence fails closed.
- Specifications live flat in **`docs/specs/`**, with **one file per comprehensible feature area** rather than one file per implementation package.
- **`index.md`** explains the corpus, ID scheme, conformance states, Gaps convention, and registers every area in an areas table.
- Each area file opens with `# <Title> — <PREFIX>`, a one-paragraph scope linking to `index.md`, optional status context, then requirements grouped under H2 sections, and finally an optional `## Gaps` section.

## Areas table

In `index.md`, a Markdown table registers each area. The checker locates columns by the header labels **`Prefix`** and **`File`**; other columns such as `Covers` are free-form.

```markdown
| File              | Prefix     | Covers                                  |
| ----------------- | ---------- | --------------------------------------- |
| authentication.md | `AUTH`     | Login, sessions, tokens                 |
| site-seo.md       | `SITE-SEO` | Canonical URLs, robots, structured data |
```

A prefix belongs to exactly one file. One file may host more than one prefix, separated in the table by `·`, `,`, or `/`. Multiple areas tables are permitted.

## Requirement shape

Each accepted requirement is a level-3 heading followed by one normative statement and its lifecycle fields:

```markdown
### SITE-SEO-002 — Absolute canonical URL

An indexable page MUST emit a `<link rel="canonical">` whose href is the absolute page URL.

_Conformance:_ conforming

_Verify:_ inspect the built `/culture/` page for its canonical link.

_Evidence:_ `site-output.test.ts` asserts the absolute canonical URL for `/culture/`.
```

- **Heading** — `### <PREFIX>-NNN — <title>`. `PREFIX` is one or more uppercase alpha-leading segments joined by hyphens; `NNN` is zero-padded to at least three digits; the separator is an em dash.
- **Statement** — one paragraph with an uppercase **BCP 14** keyword (`MUST`, `MUST NOT`, `SHALL`, `SHALL NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, `REQUIRED`, `RECOMMENDED`, `NOT RECOMMENDED`, or `OPTIONAL`). Split unrelated behaviours so they can be verified independently.
- **`_Conformance:_`** — exactly one of `conforming`, `pending`, or `divergent`. This is the current relationship between the accepted contract and the system.
- **`_Verify:_`** — the planned check: a concrete built-output assertion, test, inspection, or source symbol capable of deciding conformance.
- **`_Evidence:_`** — current proof. It is required when conformance is `conforming`, optional when `divergent`, and normally absent when `pending`. Evidence names an actual result or implementation source rather than merely repeating the verification plan.

A numbered requirement remains part of the accepted contract whether conforming, pending, or divergent. Do not hide accepted unfinished behaviour in Gaps.

## Append-only IDs

IDs are append-only, sequential per registered prefix, and never reused. A retired requirement keeps its number, with its title struck through and a `(deprecated)` note; deprecated entries are exempt from statement and lifecycle checks. Never renumber merely to tidy an established corpus.

When behaviour moves wholesale into an upstream tool or library, an area file may retire IDs under `## Retired tool` using `- <ID>[, <ID>…] — <where the contract now lives>`. IDs on the left remain claimed.

## Gaps

An optional `## Gaps` section holds unnumbered candidate behaviours or quality properties that have not been accepted into the contract. Gaps may be unbuilt, uncertain, or intentionally awaiting a product decision. They remain ID-less and are exempt from requirement checks.

Promoting a Gap is a contract decision: move it into the appropriate classification section, allocate the next ID, add its normative statement, declare truthful conformance, and provide a verification plan. It need not already conform.

## Deciding what to require

- Prefer small feature-oriented areas that a reviewer can comprehend independently.
- Phrase user-observable behaviour at the supported product surface, not in terms of implementation machinery.
- Make quality properties measurable or reviewable and identify the surface they qualify.
- Cite a Decision Record when the requirement follows a recorded decision, preserving the path from why to what.
