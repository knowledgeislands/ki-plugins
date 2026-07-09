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
- The house standard deliberately **omits** Nygard's Status section and lifecycle (DRs are living present-state records); on refresh, confirm this divergence is still intended rather than re-importing a status vocabulary
- Community conventions for multi-type DR naming or scoping

## Last review

REFRESH last run **2026-07-04**.

- **Nygard ADR format** — confirmed unchanged upstream (page live, footer copyright 2025, Cognitect/Nu Holdings). Nygard's original carries five sections including a Status line; the house standard deliberately keeps only Title/Context/Decision/Consequences and **drops Status**, treating DRs as living present-state records (see [dr-format.md](dr-format.md)). An intentional divergence, not drift.
- **ADR GitHub community (adr.github.io)** — confirmed unchanged for anything the standard depends on. MADR's optional "Considered Options + Pros/Cons" pattern is unchanged and still deliberately not adopted (the house standard keeps the Nygard five-section shape). Only new signal is a non-actionable JavaLand-2026 "ADR, MADR, eADR" talk (2026-03-10). No new multi-type naming or scoping convention has been published.

External sources are current. **Internal note:** the house DR format moved to a **living present-state record** — the former Status lifecycle, Mutability axis, supersession chain, and `## Changelog` were dropped, and SKILL.md, dr-format.md, the rubric, and the checker were realigned together. Serial uniqueness remains per-prefix within scope.

Open watch-items:

- MADR "Considered Options / Pros & Cons" pattern — re-evaluate adoption only if the ecosystem consolidates on it; currently declined by design.
- "eADR" (embedded ADRs in source) surfacing in adr.github.io talks — watch whether a documented convention emerges.
- Nygard's Status section — deliberately not adopted; recheck only that the divergence remains intended.

[nygard-adr]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[adr-github]: https://adr.github.io
