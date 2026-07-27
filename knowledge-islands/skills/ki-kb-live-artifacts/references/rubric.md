<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands live artifacts

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-kb-live-artifacts --write`.

Line-by-line criteria for auditing ki-kb-live-artifacts. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [LA — artifact structure](#la--artifact-structure)
- [LA-F — artifact frontmatter](#la-f--artifact-frontmatter)

## LA — artifact structure

→ [standard](standards-live-artifacts.md)

Artifact pairing, index, freshness, and judgment prompts.

- **LA-S-1 [M] — artifact index** — The index note exists when artifact sources are present and may safely gain omitted source names. (standards-live-artifacts.md)
- **LA-S-2 [M] — published sources** — Every Markdown artifact has a same-stem HTML render. (standards-live-artifacts.md)
- **LA-S-3 [M] — orphaned renders** — Every HTML render has a same-stem Markdown source. (standards-live-artifacts.md)
- **LA-S-4 [M] — render freshness** — Each HTML render is no older than the configured threshold behind its Markdown source. (standards-live-artifacts.md)
- **LA-J-1 [J] — useful index descriptions** — The index accurately lists active artifacts with useful one-line descriptions. (standards-live-artifacts.md)
  - _Review prompt:_ Does the index accurately list every active artifact with a useful one-line description?
- **LA-J-2 [J] — Markdown authority** — Markdown is the authoritative source and no content exists only in HTML. (standards-live-artifacts.md)
  - _Review prompt:_ Is each Markdown artifact authoritative, with no essential content present only in its HTML render?
- **LA-J-3 [J] — archive rationale** — Archived artifacts retain when-and-why context rather than disappearing silently. (standards-live-artifacts.md)
  - _Review prompt:_ Do archived artifacts retain a clear when-and-why rationale rather than disappearing silently?
- **LA-J-4 [J] — stable artifact names** — Artifact names are descriptive and stable for published links. (standards-live-artifacts.md)
  - _Review prompt:_ Are artifact names descriptive and stable enough to preserve published links?

## LA-F — artifact frontmatter

→ [standard](standards-live-artifacts.md)

Required metadata on Markdown artifact sources.

- **LA-F-1 [M] — artifact status** — Each artifact source declares status: active or status: archived. (standards-live-artifacts.md)
- **LA-F-2 [M] — render declaration** — Each frontmatter block includes html in its renders declaration. (standards-live-artifacts.md)
- **LA-F-3 [M] — artifact owner** — Each artifact source declares the author who owns and maintains it. (standards-live-artifacts.md)
