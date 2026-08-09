# Guides standard

This standard defines the home and minimum navigability of repository-local practical documentation. The hosted structured rubric enforces its mechanical criteria; the generated [rubric](rubric.md) publishes every criterion, and [exemplars](exemplars.md) illustrate representative outcomes.

## The four-doc split

A non-Knowledge-Base repository uses four durable documentation concerns:

| Location          | Question | Instrument                                     |
| ----------------- | -------- | ---------------------------------------------- |
| `docs/decisions/` | Why      | Decision Records (`ki-decision-records`)       |
| `docs/specs/`  | What     | Specifications (`ki-specs`) |
| `docs/guides/`    | How      | Guides (**this skill**)                        |
| `docs/roadmap/`   | When     | Repository work items (`ki-change-management-roadmap`)           |

Each source has one job. A guide may link to a decision, feature, or roadmap item when that helps a reader act, but it does not duplicate the source's authority.

## Guide root and index

- Guides live in **`docs/guides/`**.
- **`docs/guides/README.md`** is the collection entry point. It gives the reader a concise scope statement and links to each guide or guide area with enough description to choose one.
- A guide may live directly under the root in a small collection or below a meaningful concern or audience directory such as `developer/`, `operations/`, or `release/`. Category names are local information architecture, not a KI-wide taxonomy.
- Each guide Markdown file other than the root `README.md` has exactly one H1. It identifies the task, outcome, or operating context; its body gives the conditions, ordered work, verification, and recovery information appropriate to the topic.

## Boundary and migration rules

- **`docs/spec/` is not a durable documentation category.** Behavioural, testable specifications migrate to `docs/specs/` and are governed by `ki-specs`. Other material is reclassified according to its actual concern.
- **`docs/developer/` is not a parallel root.** Contributor and maintainer instructions migrate to `docs/guides/developer/`.
- **A generic `docs/logs/` is not a durable documentation category.** Record a durable conclusion in its governing Decision Record, guide, Feature Definition, or roadmap item. Keep ephemeral logs out of version control unless a specialised operational system owns and governs them.
- Diagram sources and other assets live beside the concern they explain or in a repository-specific asset location. This skill does not impose a graphics format or asset pipeline.

## Judgment boundary

The checker can prove that a root, entry point, headings, and retired roots are present or absent. It cannot truthfully prove that a procedure is safe, complete, current, or placed in the most useful category. During review, ask whether a reader can find the guide, complete its outcome without hidden context, verify success, and recover from known failure states.
