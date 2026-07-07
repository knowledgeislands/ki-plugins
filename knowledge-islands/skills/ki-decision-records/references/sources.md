# DR standard — sources

**Refresh:** external-spec · 365d

Tracked sources for Mode REFRESH. Re-fetch before proposing changes to the format standard or rubric. Update `last reviewed` dates and the `## Last review` block after each refresh run.

## Sources

| Source                         | URL                                              | Last reviewed |
| ------------------------------ | ------------------------------------------------ | ------------- |
| Nygard ADR format (original)   | [Documenting architecture decisions][nygard-adr] | 2026-07-04    |
| ADR GitHub community resources | [adr.github.io][adr-github]                      | 2026-07-04    |

## What to look for on refresh

- New section recommendations from the ADR community (e.g. Options, Pros/Cons patterns) — evaluate whether DRs should adopt them
- Changes to the Nygard status vocabulary (Proposed/Accepted/Deprecated/Superseded) — these are stable but worth checking
- Community conventions for multi-type DR naming or scoping

## Last review

REFRESH last run **2026-07-04**.

- **Nygard ADR format** — confirmed unchanged. Page live (footer copyright 2025, Cognitect/Nu Holdings). Five sections (Title, Context, Decision, Status, Consequences) and the status vocabulary (proposed/accepted/deprecated/superseded) are as the standard asserts. No change warranted.
- **ADR GitHub community (adr.github.io)** — confirmed unchanged for anything the standard depends on. MADR's optional "Considered Options + Pros/Cons" pattern is unchanged and still deliberately not adopted (the house standard keeps the Nygard five-section shape). Only new signal is a non-actionable JavaLand-2026 "ADR, MADR, eADR" talk (2026-03-10). No new multi-type naming or scoping convention has been published.

External sources are current; **the drift this run is internal** — SKILL.md's body contradicts dr-format.md, the rubric, and the shipping checker on (a) serial uniqueness (SKILL says global-per-scope; standard/checker enforce per-prefix) and (b) accepted-record immutability (SKILL says never-modify; standard adds the open/locked Mutability axis with in-place Changelog edits). Fixes proposed against SKILL.md, not the sources.

Open watch-items:

- MADR "Considered Options / Pros & Cons" pattern — re-evaluate adoption only if the ecosystem consolidates on it; currently declined by design.
- "eADR" (embedded ADRs in source) surfacing in adr.github.io talks — watch whether a documented convention emerges.
- Nygard status vocabulary — stable; low-priority recheck.

[nygard-adr]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[adr-github]: https://adr.github.io
