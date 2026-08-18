<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — GitHub Issues change-management adapter

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-work-github-issues --write`.

Line-by-line criteria for auditing ki-work-github-issues. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [SELECT — GitHub Issues configuration](#select--github-issues-configuration)
- [MAP — GitHub Issues lifecycle mapping](#map--github-issues-lifecycle-mapping)

## SELECT — GitHub Issues configuration

→ [standard](standards-github-issues.md)

One declared GitHub Issues repository with matching shared selection.

- **SELECT-1 [M] — explicit GitHub Issues adapter** — The repository selects and configures one GitHub Issues namespace. (standards-github-issues.md)
  - _Remediation:_ diagnostic — Select github-issues and declare one owner/repository namespace.

## MAP — GitHub Issues lifecycle mapping

→ [standard](standards-github-issues.md)

Inspectable local lifecycle metadata, conflict owner, and separate relationship meanings.

- **MAP-1 [M] — inspectable GitHub lifecycle mapping** — The local configuration names exact queue, ready, review, and done values, a metadata conflict owner, and distinct dependency and hierarchy mappings; it does not assert remote verification. (standards-github-issues.md)
  - _Remediation:_ diagnostic — Declare the exact metadata mapping and owner locally, then have an authorised future resolver verify it remotely before any process execution.
