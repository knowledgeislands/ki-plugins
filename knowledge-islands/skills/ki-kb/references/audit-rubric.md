# Audit Rubric — the checkable criteria

Line-by-line pass/fail criteria for auditing a **Knowledge Islands base** against the structure model carried in [the SKILL body](../SKILL.md) and [the reference](<Knowledge Islands KB Reference.md>). Each is tagged **[M] mechanical** (the bundled [checker](../scripts/audit-kb.ts) enforces it) or **[J] judgment** (you assess it by reading). The **code** in bold (`ZONE-1`, `CONFIG-2`, …) is the area's short code plus its number within that area — it is what an audit should cite.

A criterion's tag is a contract with the checker: an **[M]** check is run by `audit-kb.ts` (do not eyeball it); a **[J]** check needs a model and is applied by reading in Mode AUDIT step 2. This is the kb half of the shared governance-skill shape (`<standard>` + `audit-rubric.md` + `references/sources.md` + a checker); its standard is the zone model itself, not a separate `*-standard.md`.

## ZONE — zone layout

→ [SKILL: The Knowledge Islands structure](../SKILL.md)

- **ZONE-1 [M]** The five zones — `Calendar/`, `Pillars/`, `Resources/`, `Streams/`, `Admin/` — are present, each **resolved through any `[ki-kb.zones]` alias** (a base mid-rename is audited at its real folder). A missing zone is a FAIL.
- **ZONE-2 [M]** Each zone carries a **same-name index note** (`Calendar/Calendar.md`, …). A missing one is a WARN.
- **ZONE-3 [M]** The root memory index `Admin/MEMORY.md` exists (the memory cascade reads it for the active Pillars). Missing is a FAIL.
- **ZONE-4 [J]** `+/` (inbound) and `-/` (outbound) are **staging, not zones** — exempt from the same-name index rule; the checker reports their presence informationally only.
- **ZONE-5 [M]** Any note carrying `type: session-digest` or `type: handoff` in frontmatter must reside under `-/`. A file with either type found under `Calendar/`, `Streams/`, `Pillars/`, or `Resources/` is a FAIL (misrouted produced artefact).

## CONFIG — the `[ki-kb]` config table

→ [SKILL: Project bindings](../SKILL.md) · contract owned by `ki-repo` (validate down, ignore across)

- **CONFIG-1 [M]** A key the table does not recognise warns. The only recognised keys are `required_frontmatter` (an array, see **NOTE-1**) directly under `[ki-kb]` and the zone aliases under `[ki-kb.zones]`; any other scalar key warns.
- **CONFIG-2 [M]** A zone alias mapping a zone to its **own canonical name** (`Pillars = "Pillars"`) is redundant — advise dropping it.
- **CONFIG-3 [M]** A key under `[ki-kb.zones]` that is **not a canonical zone name** (a typo, a stale entry) warns.
- **CONFIG-4 [M]** Only this skill's own table is read; another skill's `[table]` is never inspected. (A declared alias whose folder is absent surfaces via **ZONE-1**, since zones resolve through the alias.)

## ROUTE — routing & placement

→ [SKILL: Routing test](../SKILL.md)

- **ROUTE-1 [J]** Notes sit in the zone the routing test selects — time-bound in `Calendar/`, active work in `Streams/`, settled internal knowledge in `Pillars/<Pillar>/`, external reference in `Resources/`. A misrouted note is drift.

## NOTE — note conventions

→ [SKILL: Mode SAVE / UPDATE](../SKILL.md)

- **NOTE-1 [M, base-declared]** Where the base declares `required_frontmatter = [...]` in its `[ki-kb]` table, every note that **has** a frontmatter block carries those keys (extra keys are free). Undeclared, this is **[J]** — required keys are base-specific (resolved from the host `CLAUDE.md`), and _whether a given note should carry frontmatter at all_ stays judgment regardless.
- **NOTE-1a [M]** A note's `---` frontmatter fence is **well-formed** — an opening fence has a closing `---`. (base-agnostic)
- **NOTE-1b [M]** Frontmatter **keys are snake_case** (the house convention); a non-conforming key warns. (base-agnostic)
- **NOTE-2 [J]** Naming follows the base's convention: dated for `Calendar/`, descriptive title elsewhere, mirroring the paired sources-store path for source extracts.
- **NOTE-3 [J]** Facts are cited to a source path or reference; analysis is labelled where the base distinguishes fact from analysis.

## MEM — memory-index accuracy

→ [SKILL: Memory cascade](../SKILL.md)

- **MEM-1 [J]** `Admin/MEMORY.md`'s active-Pillar list matches the Pillars actually present — no stale or missing entries. (Presence is **ZONE-3**; accuracy is judgment.)
- **MEM-2 [M]** The memory cascade is **anchored in always-loaded context**: the base's root `CLAUDE.md` (or `AGENTS.md`) names the `MEMORY` index / the scope-before-work rule (or the `ki-kb` skill). Because skills load on demand, an unanchored cascade is silently skipped on a plain request. A missing anchor warns. (The Streams equivalent is `ki-kb-streams`' **GATE-1**; the general principle is **SHAPE-7** in `ki-skills`.)

## LINK — linking within a base

→ [SKILL: Linking within a base](../SKILL.md)

- **LINK-1 [J]** Note content links with Obsidian `[[wikilinks]]` (shortest unique path; a `## Contents` list uses the full path with an alias) — distinct from the relative-markdown-link convention the skill _files_ use.
