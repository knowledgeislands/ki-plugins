# DR standard — sources

**Refresh:** external-spec · 365d

Tracked sources for Mode REFRESH. Re-fetch before proposing changes to the format standard or rubric. Update `last reviewed` dates and the `## Last review` block after each refresh run.

## Sources

| Source                         | URL                                              | Last reviewed |
| ------------------------------ | ------------------------------------------------ | ------------- |
| Nygard ADR format (original)   | [Documenting architecture decisions][nygard-adr] | 2026-08-12    |
| ADR GitHub community resources | [adr.github.io][adr-github]                      | 2026-08-12    |

## What to look for on refresh

- New section recommendations from the ADR community (e.g. Options, Pros/Cons patterns) — evaluate whether DRs should adopt them
- The house standard deliberately **omits** Nygard's Status section and lifecycle (DRs are living present-state records); on refresh, confirm this divergence is still intended rather than re-importing a status vocabulary
- Community conventions for multi-type DR naming or scoping

## Last review

REFRESH last run **2026-08-12**.

- **Nygard ADR format** — current primary page remains available. It recommends a short single-decision record with Context, active-voice Decision, Status, and Consequences; the house living-record model intentionally diverges from its historical-status treatment.
- **ADR GitHub community** — remains supporting community evidence for optional record patterns, not authority for the house taxonomy, serial scope, or living-record policy.
- **House metadata** — the nine-prefix taxonomy, `decision_type_url`, and living-record policy remain house conventions. Current primary discovery did not verify public `decision_type_url` targets, so the standard labels them non-authoritative house reference metadata rather than published external specifications.

External sources are current. **Internal note:** the house DR format is a **living present-state record** — lifecycle axes, historical narrative, supersession chains, and `## Changelog` are excluded, and `SKILL.md`, the Decision Records standard, the rubric, and the checker align on that form. Serial uniqueness remains per-prefix within scope.

Open watch-items:

- MADR "Considered Options / Pros & Cons" pattern — re-evaluate adoption only if the ecosystem consolidates on it; currently declined by design.
- "eADR" (embedded ADRs in source) surfacing in adr.github.io talks — watch whether a documented convention emerges.
- Nygard's Status section — deliberately not adopted; recheck only that the divergence remains intended.

[nygard-adr]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[adr-github]: https://adr.github.io
