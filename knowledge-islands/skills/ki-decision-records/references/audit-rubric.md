# DR audit rubric

Used by Mode AUDIT. Each criterion is tagged **[M]** (mechanical — the checker runs it) or **[J]** (judgment — you assess by reading). Run the checker first; do not eyeball what the script validates better.

## File and naming checks

- **[M] FILENAME-1** — filename matches `^(SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z][A-Z0-9]*(-[A-Z][A-Z0-9]*)*-(XXX|\d{3,})(-[a-z0-9-]+)?\.md$` (`XXX` is the reserved serial for `Draft` DRs not yet assigned a real number)
- **[M] FILENAME-2** — NNN is unique **per prefix within its `<SCOPE>` namespace**; two files may share the same integer if they carry different prefixes (e.g. `GDR-KI-ARCADIA-001` and `SDR-KI-ARCADIA-001` are both valid); no two files share the same prefix+scope+serial combination. `XXX` files are exempt from uniqueness.
- **[M] FILENAME-3** — NNN is monotonically increasing per prefix within its scope; no gaps introduced by deletion. `XXX` files are exempt.

## Frontmatter checks (KB repos only)

- **[M] FM-0** — YAML frontmatter block present (required for KB repos; optional for code repos)
- **[M] FM-3** — `type` field is `admin/governance/decision`
- **[M] FM-4** — `decision_type` field is present
- **[M] FM-5** — `decision_type` is one of the nine valid values: `strategy`, `product`, `architecture`, `data`, `security`, `operations`, `governance`, `research`, `knowledge`
- **[M] PREFIX-TYPE-1** — prefix in filename matches `decision_type` in frontmatter (e.g. `GDR-` ↔ `governance`, `ADR-` ↔ `architecture`)
- **[J] FM-6** — `decision_type` correctly categorises the decision (not a stretch fit; the body makes the type obvious)

## Body structure checks

- **[M] BODY-1** — heading matches `# <PREFIX>-<SCOPE>-NNN: <title>` (ID prefix present and matches filename)
- **[M] BODY-2** — `**Status:**` line present with a valid value (Draft / Proposed / Accepted / Deprecated / Superseded by `<full DR code>`)
- **[M] BODY-2b** — `**Mutability:**` line present with a valid value (`open` / `locked`)
- **[M] BODY-3** — `**Date:**` line present, format `YYYY-MM-DD`
- **[M] BODY-4** — `## Context`, `## Decision`, `## Consequences` sections all present
- **[J] BODY-5** — Context is value-neutral forces, not advocacy ("the island currently…" not "we need to…")
- **[J] BODY-6** — Decision is in active voice ("This island adopts…" or "We will…")
- **[J] BODY-7** — each section has real, non-placeholder substance
- **[J] BODY-8** — length is one to two pages (roughly 200–500 body words)
- **[J] BODY-9** — Title is a short noun phrase, not a question or full sentence

## Mutability checks

- **[M] MUT-1** — `**Mutability:**` aligns with `**Status:**`: `Draft`/`Proposed` → `open`; `Deprecated`/`Superseded` → `locked`; `Accepted` → either (free choice). (`open`/`locked` is a distinct axis from the frontmatter maintenance `status` freshness field — do not conflate.)
- **[J] MUT-2** — an `open` record carries a `## Changelog` (running log of in-place clarifications/realignments); a `locked` record relies on the supersession chain instead
- **[J] MUT-3** — the record contains no roadmap / TODO / "revisit later" narration ("open roadmap item", "parked", "not yet started", "remains open") — such content belongs in the ROADMAP (code) or a stream (KB), not in a decision record

## Superseded checks

- **[M] SUPER-1** — if Status is `Superseded by <ID>`, the referenced DR exists in the same decisions directory
- **[M] SUPER-2** — if DR-A supersedes DR-B, DR-B's Status is `Superseded by DR-A` (bidirectional)

## Index checks

- **[M] INDEX-1** — the index file exists (`Decisions.md` in a KB, `README.md` in a code repo)
- **[M] INDEX-2** — every DR file has exactly one row in the index (ID cell linked or bare)
- **[M] INDEX-3** — no row in the index references a file that does not exist
- **[M] INDEX-4** — row Status matches the DR's `**Status:**` field (Status column located by header label)
- **[M] INDEX-5** — row Date matches the DR's `**Date:**` field (Date column located by header label)
- **[J] INDEX-6** — rows are in a sensible reveal order (dependency chain: roots first, then dependents) — reader-assessed, not mechanically enforced, since code-repo ADRs carry no `decision_depends_on` frontmatter to derive it
- **[J] INDEX-7** — row Title in the index matches the DR's heading title (excluding the ID prefix)

## Severity mapping

| Criterion | Severity |
| --- | --- |
| FILENAME-1, FM-0, FM-3, FM-4, FM-5, PREFIX-TYPE-1, BODY-1, BODY-2, BODY-3, BODY-4, SUPER-1, SUPER-2, INDEX-1, INDEX-2, INDEX-3 | FAIL |
| FILENAME-2, FILENAME-3, INDEX-4, INDEX-5, INDEX-6, BODY-5, BODY-6, BODY-7 | WARN |
| FM-6, BODY-8, BODY-9, INDEX-7 | POLISH |
