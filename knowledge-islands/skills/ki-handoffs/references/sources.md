# Sources — ki-handoffs

**Refresh:** canonical · on-change

The doctrine this skill governs is an in-house methodology, not a tracked external specification, so it carries no clock cadence: it is re-anchored **on change** — when the reasoning-layer split, the quality bar, or the composition boundary with `ki-tokenomics` moves in practice. The record of _what_ changed is the REFRESH commit, not a changelog here.

| Source | Tag | Governs | Last reviewed |
| --- | --- | --- | --- |
| [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5) | BP | The reasoning-layer split; self-verification; tiered execution | 2026-07-02 |
| `ki-project-roadmap` — non-KB roadmaps and plan format | IN-HOUSE | The host artifact in a non-KB repository; the base quality bar | 2026-07-16 |
| `ki-kb-streams` — Enactment Process & proposal Checklist | IN-HOUSE | The host artifact in a KB | 2026-07-04 |
| `ki-tokenomics` — model-tier lever (standard §4, §8) | IN-HOUSE | Tier cost and selection (the boundary this skill defers to) | 2026-07-04 |

## Last review

- **Pinned:** initial authoring, 2026-07-02.
- **REFRESH last run 2026-07-04** — internal-model pass (no web research), skill audited against itself.
  - _Confirmed_ `ki-tokenomics`: standard §4 (runtime levers + mode→tier table), §8 (multi-model flows), and §3 `preferred_model` all still present and cited correctly; the composition boundary (this skill owns delegability, `ki-tokenomics` owns tier cost/selection) is still clean.
  - _Confirmed_ `ki-project-roadmap`: a thematic plan is still the dependency-ordered record that survives context resets and handoffs — host-artifact role in a non-KB repository unchanged.
  - _Confirmed_ `ki-kb-streams`: the stream proposal's `## Checklist` is still the KB host artifact this skill's delta rides on.
  - _Not re-verified_ the Fable-5 BP source — external, and this REFRESH ran internal-only. Left at 2026-07-02.
- **Confirmed (standing):** the split owns _how to make work delegable_; `ki-tokenomics` owns _which tier costs what_. Tiers are named semantically; concrete model ids defer to `claude-api`.
- **Open watch-items:**
  - The Fable-5 prompting guidance is external and may move — on the next REFRESH that permits web access, re-fetch it and diff the split / self-verification advice against this standard. If it starts driving the standard continuously, reconsider the `canonical · on-change` class.
  - Tier-vocabulary consistency: keep SKILL.md prose (cheap / mid / top narration) aligned with the `tier:` frontmatter enum (haiku / sonnet / opus) that HAND-1 enforces, so authors are not misled into a spurious FAIL.
  - Root README skill-map and the harness CLAUDE.md skill count do not yet list `ki-handoffs` — a shared-surface gap to close centrally, not in this skill.
