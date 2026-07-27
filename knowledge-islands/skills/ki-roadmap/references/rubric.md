<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — repository roadmaps

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-roadmap --write`.

Line-by-line criteria for auditing ki-roadmap. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [SCOPE — scope](#scope--scope)
- [PROFILE — profile](#profile--profile)
- [ROAD — roadmaps](#road--roadmaps)
- [THEME — themes](#theme--themes)
- [ITEM — items](#item--items)
- [PROJ — portfolio projection](#proj--portfolio-projection)
- [PLAN — plans](#plan--plans)
- [SAFE — safe mechanics](#safe--safe-mechanics)
- [EXPAND — expansion](#expand--expansion)
- [HANDOFF — handoff review](#handoff--handoff-review)

## SCOPE — scope

→ [standard](standards-repository-roadmaps.md)

Repository-roadmap profile applicability.

- **SCOPE-1 [M] — KB scope** — KB repositories use `ki-kb-streams`; repository-roadmap artifacts in a KB fail, while a KB without them is not applicable. (standards-repository-roadmaps.md)

## PROFILE — profile

→ [standard](standards-repository-roadmaps.md)

Simple and thematic roadmap profile structure.

- **PROFILE-1 [M] — profile structure** — A non-KB repository has a root `ROADMAP.md`; `docs/roadmap/` selects the thematic profile, otherwise simple. Missing roots or incomplete thematic structure fail. (standards-repository-roadmaps.md)
- **PROFILE-2 [J] — simple-profile suitability** — Simple remains appropriate only while the work is understandable without theme isolation or execution plans. (standards-repository-roadmaps.md)
  - _Review prompt:_ Review whether the simple profile remains appropriate for the repository work.

## ROAD — roadmaps

→ [standard](standards-repository-roadmaps.md)

Canonical horizon structure, placement, and readiness.

- **ROAD-1 [M] — roadmap structure** — Every authored roadmap has one H1 and the five horizons exactly once, in canonical order. (standards-repository-roadmaps.md)
- **ROAD-2 [J] — honest horizon placement** — Items sit in honest horizons; Waiting-for items name their external condition; speculative Future work says `(candidate)`. (standards-repository-roadmaps.md)
  - _Review prompt:_ Review horizon placement, waiting conditions, and Future candidate marking.
- **ROAD-3 [J] — open finite work** — Roadmaps are open-only and contain finite work rather than continuous practice. (standards-repository-roadmaps.md)
  - _Review prompt:_ Review that roadmap items are finite open work, not completed work or ongoing practice.
- **ROAD-4 [M] — canonical horizon blurbs** — Every horizon heading is followed immediately by its exact canonical blurb; CONFORM inserts a missing blurb without removing existing authored content. (standards-repository-roadmaps.md)
- **ROAD-5 [J] — promotion and readiness** — Horizon placement and transitions meet the readiness contract; ordinary and non-open plans require Blocking or Next, while an open plan with a non-empty transferred-from origin may preserve detail at another honest horizon without implying readiness. CONFORM never chooses a move. (standards-repository-roadmaps.md)
  - _Review prompt:_ Review each horizon transition against its readiness contract.

## THEME — themes

→ [standard](standards-repository-roadmaps.md)

Thematic roadmap identity, layout, and coherence.

- **THEME-1 [M] — theme layout** — Theme directories are lowercase kebab-case, contain `ROADMAP.md`, and thematic items are `###` headings under a horizon. (standards-repository-roadmaps.md)
- **THEME-2 [M] — stable theme code** — Every theme roadmap declares exactly one unquoted uppercase `code`, unique across the repository; plan IDs in that theme begin with that stable code. (standards-repository-roadmaps.md)
- **THEME-3 [M] — non-empty themes** — A theme roadmap contains at least one item; an empty theme must be pruned deliberately after confirming it holds no authored content or plans. (standards-repository-roadmaps.md)
- **THEME-4 [J] — coherent themes** — Themes are coherent workstreams, neither catch-alls nor one-item bureaucracy. (standards-repository-roadmaps.md)
  - _Review prompt:_ Review theme boundaries and granularity.

## ITEM — items

→ [standard](standards-repository-roadmaps.md)

Stable thematic roadmap-item identity.

- **ITEM-1 [M] — unique qualified item locator** — Each thematic item has one unique qualified `<theme>/<item-slug>` locator. Duplicate derived locators fail. (standards-repository-roadmaps.md)

## PROJ — portfolio projection

→ [standard](standards-repository-roadmaps.md)

The exact generated root portfolio for a thematic roadmap.

- **PROJ-1 [M] — root portfolio projection** — The thematic root `ROADMAP.md` exactly matches the generated linked portfolio and repeats no item prose. (standards-repository-roadmaps.md)

## PLAN — plans

→ [standard](standards-plan-format.md)

Plan identity, linkage, dependencies, and lifecycle integrity.

- **PLAN-1 [M] — plan placement and shape** — Plans use the canonical thematic path, stable theme code and serial, required frontmatter, an optional non-empty transferred-from origin, matching filename and ID, and an immutable execution baseline commit. (standards-plan-format.md)
- **PLAN-2 [M] — plan roadmap linkage** — `roadmap:` is a qualified locator in the same theme and resolves to a Blocking or Next item, except that an open plan with a non-empty transferred-from origin may preserve detail at another honest horizon; the item carries exactly one matching local plan reference. (standards-plan-format.md)
- **PLAN-3 [M] — plan dependencies** — Dependencies use canonical plan identifiers, exist, are reverse-consistent, and acyclic; a ready, in-progress, or acceptance plan has no non-done blocker. (standards-plan-format.md)
- **PLAN-4 [J] — ready plan content** — Ready, in-progress, and acceptance plans have concrete Steps, checkable Verify, honest Current state, and minimal Files touched. (standards-plan-format.md)
  - _Review prompt:_ Review active plan content for concrete, checkable execution detail.
- **PLAN-5 [J] — honest plan status** — Open awaits readiness approval or preserves transferred detail without implying readiness; ready awaits execution; in-progress reflects live work; acceptance awaits explicit user acceptance; done is a retained closure record. Every non-open plan resolves to Blocking or Next. (standards-plan-format.md)
  - _Review prompt:_ Review whether the plan status honestly reflects its lifecycle gate or retained completion record.

## SAFE — safe mechanics

→ [standard](standards-repository-roadmaps.md)

Regular-file boundaries and host-owned transactional publication.

- **SAFE-1 [M] — safe mechanics** — Governed roadmap inputs and outputs are regular local files; CONFORM changes session-owned drafts and leaves dry-run, validation, atomic publication, and rollback to the host. (standards-repository-roadmaps.md)

## EXPAND — expansion

→ [standard](standards-repository-roadmaps.md)

Judgment-led migration from the simple profile to coherent themes.

- **EXPAND-1 [J] — conservative expansion** — EXPAND conserves every open item exactly once and preserves its horizon and prose. (standards-repository-roadmaps.md)
  - _Review prompt:_ Review expansion conservation against the source roadmap.

## HANDOFF — handoff review

→ [standard](standards-repository-roadmaps.md)

Judgment-led inbound adoption and outbound follow-up review.

- **HANDOFF-1 [J] — handoff review** — Where `+/_HANDOFFS/` or `-/_HANDOFFS/` exists, review incoming adoption and outgoing receiving-repository progress without inferring or changing remote state. (standards-repository-roadmaps.md)
  - _Review prompt:_ Inspect the handoff areas: identify any inbound material that needs a local roadmap decision and any outbound material needing follow-up or closure; report proposals only.
