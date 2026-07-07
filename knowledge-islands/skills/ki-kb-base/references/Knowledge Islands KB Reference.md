# Knowledge Islands KB Reference

Long-form detail for the [Knowledge Islands KB](../SKILL.md) skill. Loaded on demand (progressive disclosure) so the `SKILL.md` body stays lean.

## Contents

- [The Knowledge Islands model](#the-knowledge-islands-model)
- [Onboarding a base to this skill](#onboarding-a-base-to-this-skill)
- [Zone aliases and the `[ki-kb-base]` config table](#zone-aliases-and-the-ki-kb-base-config-table)
- [Session digest structure](#session-digest-structure)
- [Per-base config, not an extension skill](#per-base-config-not-an-extension-skill)

## The Knowledge Islands model

A Knowledge Islands base is a single markdown store organised into five fixed zones - `Calendar/`, `Pillars/`, `Resources/`, `Streams/`, and `Admin/` - flanked by an inbound staging area (`+/`) and an outbound one (`-/`). The `+/` and `-/` folders are staging, not zones: material lands or leaves through them but is not canonical there. The zone set is part of the standard, so the skill does not ask a base to define it; it only needs a few store-level bindings.

- **Island vs Pillar.** Each whole knowledge base is an "island" (a legal base, a personal base, a research base). Within a base, a **Pillar** is a major strand of subject matter - a case, a client, a domain, a theme. A base that holds a zone under a different local folder name keeps that folder and declares it as a [zone alias](#zone-aliases-and-the-ki-kb-base-config-table) rather than counting as a different zone.
- **Settling.** `Streams/` holds work in motion; once settled it migrates into `Pillars/` (internal) or `Resources/` (external). The discriminating question for internal vs external: _would this knowledge exist without this base?_ If yes, it is a resource. The **internal structure and process of the `Streams/` zone** — its Focus lifecycle, the proposal layout, and the Enactment Process that governs it — are owned by the `ki-kb-streams` skill; this skill knows only that `Streams/` is a zone with a same-name index and routes top-level work into it.

## Linking within a base

Within a base, notes link to one another and to their zone index notes with Obsidian `[[wikilinks]]`, not relative markdown paths. The five index-carrying zones resolve as `[[Calendar]]`, `[[Pillars]]`, `[[Resources]]`, `[[Streams]]`, and `[[Admin]]`; the inbound `+/` and outbound `-/` are staging, not zones, with no same-name index. Body links use the shortest unique path — a bare filename when it is unique, the minimum disambiguating prefix when it is not — and check for filename collisions before writing a bare link; a `## Contents` list always uses the full path with an alias (`[[Full/Path/Note|Note Name]]`).

This is the convention for **note content inside a base**. It is deliberately distinct from how the skill files in this repository link to one another (relative markdown links, per ki-agentic-harness `docs/installation.md` under "Linking inside skills") — the two never meet, so a base using wikilinks does not break the skills that use markdown links.

## Onboarding a base to this skill

Because the zone model is fixed, onboarding is small - resolve only the **project bindings**, ideally in the base's auto-loaded `CLAUDE.md`:

1. **Notes store** - the canonical alias and location of the notes store, and the alias rule (always use the alias, never the raw mount).
2. **Sources store** - whether a paired sources store exists, and how note extracts mirror its paths.
3. **Scope usage** - whether the base is Pillar-scoped (declare an active Pillar each session) or single-Pillar / flat.
4. **Writing standards** - language variant, citation format, structural norms (defaults: British English, cite source paths, concise prose).
5. **Domain pre-flight** - any extra reads before drafting; declared as a `preflight` list in the base's `.ki-config.toml` `[ki-kb-base]` table, not in `CLAUDE.md`.
6. **Zone names** - only if a folder diverges from its canonical name during a migration; declared in `.ki-config.toml`, not `CLAUDE.md` (see [Zone aliases](#zone-aliases-and-the-ki-kb-base-config-table)).

A base that follows the structure and defines the notes store needs nothing more; the rest runs on defaults.

## Zone aliases and the `[ki-kb-base]` config table

The zone set is fixed, but a base may hold a zone under a different local folder name — whether **mid-migration** (renaming toward the canonical name) or as a **standing local naming choice**. Any canonical zone (`Calendar` / `Pillars` / `Resources` / `Streams` / `Admin`) or staging area (`+` / `-`) may be aliased. So that the skill works against the real layout without hard-coding any one base's folders, the local folder name is a declared, reviewable override rather than a model change. (Bases that use an alias are recorded in [the source list](sources.md) for REFRESH.)

It lives in the base's `.ki-config.toml` under the skill's own table (the shared-file contract is owned by `ki-repo`; this skill owns the keys inside its table):

```toml
[ki-kb-base.zones]
# Canonical zone = this base's local folder. For a rename in progress, drop the
# line once the folder reaches its canonical name; omit the table when none diverge.
Pillars = "<local folder name>"
```

Rules, following the `.ki-config.toml` contract:

- **Resolve every zone reference through the alias.** When the table maps a zone to a local folder, read, route, and write that zone at the mapped folder; the routing test, memory cascade, and digest paths all use the resolved folder.
- **Validate down, ignore across.** Warn on an unrecognised key under `[ki-kb-base]` (a typo or stale option should surface) and advise dropping one that merely restates a default (a zone mapped to its own canonical name). Never read or validate another skill's table.
- **Transitional or standing.** A zone alias may record an in-progress rename — removed once the base reaches the canonical folder name — or a permanent local naming choice the base keeps. Either way it is a folder-name mapping, never a change to the zone model itself.

## Session digest structure

Destination `-/_DIGESTS/<UTC timestamp> <Short Topic>.md` (timestamp `YYYY-MM-DDTHHMMSSZ`; topic in Title Case). Frontmatter `type: session-digest` and `retain_until: YYYY-MM-DD` (default 30 days from the write date). Body sections:

- **Context** - what the session was about.
- **Decisions** - choices made and their rationale.
- **Facts Learned** - durable facts surfaced during the session.
- **Related Work** - links to the notes, Pillars, or streams touched.
- **Keywords** - retrieval terms.

## Per-base config, not an extension skill

A base never ships a `<base>-kb` extension skill. What it needs differently is **declared**, so the mode logic stays in one place and the base specifics stay auditable:

- **Structured data** → the base's `.ki-config.toml` `[ki-kb-base]` table, read **validate-down** by this skill: the `[ki-kb-base.zones]` aliases, the `required_frontmatter` array, and the `preflight` array (note paths/globs to read before drafting — the base-specific pre-flight that scope declaration and domain context once justified an extension for).
- **Narrative bindings** (store alias, scope usage, writing standards) → the base's auto-loaded `CLAUDE.md`.

Relationships to sibling skills are **composition**, never extension: this skill runs alongside `ki-kb-streams` (to which it delegates the `Streams` zone) and `ki-authoring` (over a base's markdown), each invoked in sequence, never importing the other. A genuinely base-specific _behaviour_ that no declaration can express is a signal to generalise it into this standard skill (a REFRESH candidate), not to fork a coupled one.
