# Streams structure standard

This standard defines `Streams/` as the operational container of a Knowledge Islands base. It does not define a second Focus-based work queue. The applicable change-management adapter owns each area’s records, lifecycle, and allocation details.

## Contents

- [Operational container](#operational-container)
- [Roadmap](#roadmap)
- [Housekeeping](#housekeeping)
- [Future trades](#future-trades)
- [Legacy migration](#legacy-migration)
- [Canonical knowledge and retention](#canonical-knowledge-and-retention)

## Operational container

`Streams/` is the Knowledge Base counterpart to a project repository’s operational `docs/` surface: it holds work-management records, never the settled knowledge they produce.

```text
Streams/
  Roadmap/
  Housekeeping/
  Trades/          # only when a future KB trade placement is adopted
```

`Roadmap/` and `Housekeeping/` are the initial fixed areas. They are neither horizons nor lifecycle states. A future `Trades/` area needs an explicit contract; do not create it merely because generic `ki-trades` working areas exist elsewhere in the repository.

The container does not prescribe a topical-folder or `groups` vocabulary. Where an owning adapter supports topical metadata, the receiving base chooses its vocabulary. That metadata never replaces an operational area or changes an identifier.

## Roadmap

`Streams/Roadmap/` is the KB placement equivalent of a project repository’s `docs/roadmap/`. It contains flat finite work records and its `_ISSUES.md` allocation ledger. The [repository roadmap standard](../../../change-management/ki-change-management-roadmap/references/standards-repository-roadmaps.md) owns the record format, lifecycle, identifier grammar, and horizon metadata.

Roadmap horizons and lifecycle are frontmatter fields. Do not represent `Now`, `Next`, `Soon`, `Waiting for`, `Parked`, or `Future` with paths below `Streams/Roadmap/`.

## Housekeeping

`Streams/Housekeeping/` is the KB placement equivalent of `docs/housekeeping/`. It contains recurring-work templates, not a permanent set of delivery work. The [housekeeping template standard](../../../change-management/ki-change-management-housekeeping/references/standards-housekeeping.md) owns template identity, cadence, due-run spawning, and retained run evidence.

A due run is a linked ordinary roadmap record in `Streams/Roadmap/`. Its horizon and lifecycle remain record metadata; it is not moved into a Streams state folder.

## Future trades

`Streams/Trades/` is reserved, not yet a required part of the structure. If adopted, it must be defined by a KB-specific extension of `ki-trades`; the generic `+` and `-` repository working areas remain outside this standard.

## Legacy migration

`Active`, `Background`, `Dormant`, and the former Focus folders are legacy navigation and state labels. They are not target paths and must not be reintroduced as topical groups.

For each retained legacy record, the receiving base decides deliberately whether it is:

1. finite forward work → a flat `Streams/Roadmap/` record;
2. a recurring obligation → a `Streams/Housekeeping/` template;
3. durable knowledge → a canonical `Admin/`, `Pillars/`, or `Resources/` note; or
4. obsolete working material → retained or pruned through explicit owner approval.

The base also decides its own repository code, fixed roadmap area codes, issue-ledger high-water marks, retained-ID map, and any optional topical metadata. Never derive identities or historic topical membership from a legacy path.

## Canonical knowledge and retention

Streams records are working evidence, not a knowledge store. Durable outputs belong in `Admin/`, `Pillars/`, `Resources/`, or a Decision Record. A completed roadmap record remains until an explicitly selected prune; template and trade retention follow their owning standards.
