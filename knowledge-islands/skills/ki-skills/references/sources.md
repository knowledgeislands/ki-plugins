# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and community sources behind [the standard](agent-skills-standard.md) and its [rubric](audit-rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where best practice comes from — keep it current.

Abbreviations match the `(SOURCE)` tags in [the standard](agent-skills-standard.md) and [rubric](audit-rubric.md).

## Authoritative

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| SPEC | [Agent Skills specification][spec] | Frontmatter fields, layout, hard caps, progressive-disclosure budget | 2026-07-04 |
| — | [Agent Skills home][home] | The standard's overview, examples, ecosystem | 2026-07-04 |
| BP | [Skill authoring best practices][bp] | Description writing, conciseness, scripts, anti-patterns, the checklist | 2026-07-04 |
| CC | [Claude Code — skills][cc] | CC frontmatter, runtime listing/compaction budgets, commands→skills | 2026-07-04 |
| ENG | [Equipping agents with Agent Skills][eng] ※ | Rationale, progressive disclosure, evaluation-first, under-triggering | 2026-07-04 |
| — | [`skills-ref validate`][skills-ref] | Mechanical baseline for frontmatter + naming (criteria B, C, D) | 2026-07-04 |

※ Anthropic Engineering, 2025-12-18.

## Community

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| COMMUNITY | [Skill Authoring Patterns][patterns] | Distilled patterns: terminology, feedback loops, gotchas sections | 2026-07-04 |
| COMMUNITY | [obra/superpowers writing-skills][superpowers] | Community restatement ※ | 2026-06-18 |
| COMMUNITY | [skills.sh — Open Agent Skills Ecosystem][skills-sh] | Cross-agent skill registry: discovery, install convention, security-audit signals, ecosystem trends | 2026-07-04 |

※ Community restatement of the best-practices doc; convergent conventions.

## In-house

| Tag                       | Source                       | Governs          | Last reviewed |
| ------------------------- | ---------------------------- | ---------------- | ------------- |
| ki-agentic-harness README | The repo's own `README.md`   | †                | 2026-06-21    |
| `ki-kb`                   | The reference standard skill | Worked example ※ | 2026-06-21    |

† Linking convention (no wikilinks), standard vs base-coupled-extension, the house toolchain, Knowledge Islands structure.

※ Worked example of a trigger-rich description and the standard-skill shape.

## Last review

REFRESH last run **2026-07-04** against the tracked sources above. The four primary authoritative sources (SPEC, home, BP, CC) plus ENG, COMMUNITY/patterns, and the `skills-ref` baseline (re-confirmed via the SPEC page it is linked from) were re-fetched via WebFetch this run; `superpowers` (a community restatement of BP, which was re-fetched and confirmed unchanged) carries its 2026-06-18 date; the in-house README and `ki-kb` rows were not re-audited this run and keep their 2026-06-21 dates. No drift: nothing in the standard, rubric, or linter changed.

- **SPEC (agentskills.io/specification):** accessible. Fields and constraints unchanged: `name` (required, 1–64 chars, lowercase letters/digits/hyphens, no leading/trailing/consecutive hyphen, matches directory), `description` (required, 1–1024 chars, non-empty), `license`, `compatibility` (1–500), `metadata` (string→string map), `allowed-tools` (Experimental). Body budget restated as "< 5000 tokens recommended", "under 500 lines", references "one level deep". No new fields, no deprecations.
- **Agent Skills home:** accessible; three-stage progressive disclosure (metadata ~100 tok / instructions < 5000 tok / resources on demand). Spec unchanged.
- **BP (Anthropic platform best-practices):** accessible; full page fetched. No new guidance beyond the standard — confirms third-person description, gerund naming, < 500-line body, progressive disclosure, ToC > 100 lines, ≥ 3 evaluations, Haiku/Sonnet/Opus testing, forward-slash paths, one-default-with-escape-hatch, fully-qualified `ServerName:tool_name`, plan-validate-execute, justified constants, and the authoring checklist.
- **CC (Claude Code skills docs):** accessible; full frontmatter table confirms every CC-only field the standard lists. Confirms the 1,536-char `description`+`when_to_use` listing cap (~1% of context, configurable via `skillListingBudgetFraction` / `SLASH_COMMAND_TOOL_CHAR_BUDGET`; the per-skill desc-char cap is now documented as **`skillListingMaxDescChars`** — last run named it `maxSkillDescriptionChars`; the standard does not pin the setting name, so no standard drift), the post-compaction 5,000-tok-per-skill / 25,000-tok combined budgets, and the commands→skills merge. New since last run is runtime/settings, not authoring standard: `disable-model-invocation: true` now also blocks scheduled-task firing and subagent preload (v2.1.196), and `skillOverrides` gained an `"off"` state (v2.1.199) — neither changes a rubric criterion.
- **ENG (Anthropic Engineering blog):** accessible. Confirms the two required fields, three-level progressive-disclosure model, evaluation-first authoring, and name/description as the trigger signal. No numeric caps — cited for rationale only.
- **COMMUNITY (generativeprogrammer.com Skill Authoring Patterns):** accessible; page dated 2026-04-19, unchanged since last run. 14 named patterns incl. Known Gotchas, Autonomy Calibration, Exclusion Clause; confirms the 1024 / 1536 caps, < 500 lines, third-person "pushy" descriptions. Repeats the soft ~300-line split trigger — compatible with (and below) our 500-line WARN; still not adopted as a separate cap.
- **`skills-ref` validator:** `validate` CLI documented but internals not fetchable; the frontmatter + naming rules it enforces are fully specified on the SPEC page (which links skills-ref as the validator), so the mechanical baseline (NAME / DESC / OPT) is confirmed there.
- **In-house scan:** `bun run ki:skills:lint` — all **eighteen** `ki-*` skills PASS, 0 fail, 0 warn (including `ki-skills` itself).
- **No standard, rubric, or linter change this run.**
- **Open watch-items:** (1) re-fetch `superpowers` directly next run (carried forward). (2) The canonical dependency order in `ADR-KI-HARNESS-SKILLS-003` (mirrored in SKILL.md line 27) still lists 12 skills and omits `activities`, `bootstrap`, `decision-records`, `handoffs`, `live-artifacts`, `plans` — flag for the ADR owner; SKILL.md re-mirrors once the ADR is refreshed. (3) Confirm the `skills-ref` validator source if its repo layout becomes fetchable.

(What past reviews changed in the standard / rubric / linter — the `disallowed-tools` behavioural note in §5, the CC runtime-extension fields, MCP fully-qualified tool naming, the CC post-compaction budget row, the migration to area-scoped codes — is in git.)

[spec]: https://agentskills.io/specification
[home]: https://agentskills.io/
[bp]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
[cc]: https://code.claude.com/docs/en/skills
[eng]: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
[skills-ref]: https://github.com/agentskills/agentskills/tree/main/skills-ref
[patterns]: https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics
[superpowers]: https://github.com/obra/superpowers/blob/main/skills/writing-skills/anthropic-best-practices.md
[skills-sh]: https://www.skills.sh/
