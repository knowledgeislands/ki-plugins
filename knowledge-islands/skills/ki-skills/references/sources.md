# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and community sources behind the [Agent Skills](standards-agent-skills.md), [Knowledge Islands](standards-knowledge-islands.md), and [rubric-authoring](standards-rubric-authoring.md) standards and their [rubric](rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against those standards and the rubric, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where best practice comes from — keep it current.

Abbreviations match the `(SOURCE)` tags in the standards and [rubric](rubric.md).

## Contents

- [Portable Agent Skills contract](#portable-agent-skills-contract)
- [Established authoring practice](#established-authoring-practice)
- [Knowledge Islands house standard](#knowledge-islands-house-standard)
- [Runtime overlay: Claude Code](#runtime-overlay-claude-code)
- [Last review](#last-review)

## Portable Agent Skills contract

| Tag  | Source                               | Scope                  | Last reviewed |
| ---- | ------------------------------------ | ---------------------- | ------------- |
| SPEC | [Agent Skills specification][spec]   | Format and constraints | 2026-07-19    |
| —    | [`skills-ref validate`][skills-ref]‡ | Validator baseline     | 2026-07-04    |

‡ Mechanical baseline for frontmatter and naming criteria B, C, and D; subordinate to the specification it implements.

## Established authoring practice

### Agent Skills documentation set

The Agent Skills [documentation index][agentskills-index] is the inventory authority for this set. Every REFRESH fetches it first, reconciles this table with its current pages, then reviews every listed page individually. The index currently lists the nine documentation pages below; the index itself is also tracked because it detects additions and removals.

| Tag | Source                                                     | Scope                 | Last reviewed |
| --- | ---------------------------------------------------------- | --------------------- | ------------- |
| AS  | [Agent Skills documentation index][agentskills-index]      | Page inventory        | 2026-07-19    |
| AS  | [Agent Skills overview][home]                              | Conceptual overview   | 2026-07-19    |
| AS  | [Skill-creator quickstart][quickstart]                     | First-skill workflow  | 2026-07-19    |
| AS  | [Skill-creator best practices][agentskills-best-practices] | Authoring guidance    | 2026-07-19    |
| AS  | [Optimising descriptions][optimizing-descriptions]         | Description quality   | 2026-07-19    |
| AS  | [Evaluating skills][evaluating-skills]                     | Evaluation practice   | 2026-07-19    |
| AS  | [Using scripts][using-scripts]                             | Script execution      | 2026-07-19    |
| AS  | [Client showcase][clients]                                 | Client inventory      | 2026-07-19    |
| AS  | [Adding skills support][adding-skills-support]             | Client implementation | 2026-07-19    |
| BP  | [Skill authoring best practices][bp]                       | Authoring checklist   | 2026-07-04    |
| ENG | [Equipping agents with Agent Skills][eng]†                 | Design rationale      | 2026-07-04    |

† Anthropic Engineering, 2025-12-18.

## Community

| Tag       | Source                                               | Scope                  | Last reviewed |
| --------- | ---------------------------------------------------- | ---------------------- | ------------- |
| COMMUNITY | [Skill Authoring Patterns][patterns]                 | Patterns and feedback  | 2026-07-04    |
| COMMUNITY | [obra/superpowers writing-skills][superpowers]†      | Convergent conventions | 2026-06-18    |
| COMMUNITY | [skills.sh — Open Agent Skills Ecosystem][skills-sh] | Registry and security  | 2026-07-04    |

† Community restatement of the best-practices document.

## Knowledge Islands house standard

| Tag                       | Source                       | Scope            | Last reviewed |
| ------------------------- | ---------------------------- | ---------------- | ------------- |
| ki-agentic-harness README | The repo's own `README.md`   | House structure† | 2026-06-21    |
| `ki-kb`                   | The reference standard skill | Worked example‡  | 2026-06-21    |

† Linking convention (no wikilinks), standard vs base-coupled-extension, the house toolchain, Knowledge Islands structure.

‡ Worked example of a trigger-rich description and the standard-skill shape.

## Runtime overlay: Claude Code

| Tag | Source                     | Scope                   | Last reviewed |
| --- | -------------------------- | ----------------------- | ------------- |
| CC  | [Claude Code — skills][cc] | Claude runtime overlay† | 2026-07-04    |

† Claude Code extensions and runtime behaviour. This overlay may qualify a portable or Knowledge Islands rule for Claude Code, but never weakens the portable contract.

## Last review

REFRESH last run **2026-07-19** against the tracked Agent Skills documentation set and the existing sources below. It fetched [the documentation index][agentskills-index] first, which listed nine current documentation pages; this table now tracks all nine individually, plus the index itself. The skill-creator pages confirmed the existing standard's guidance on progressive disclosure, reusable scripts, script documentation and `--help`, description tuning, and evaluation-driven iteration. The client pages provide the runtime-facing counterpart: discovery at user and project scope, activation, and bounded context loading. The top-level script help contract is now codified as `SCRIPT-8` with adjacent test coverage.

- **SPEC (agentskills.io/specification):** accessible. Fields and constraints unchanged: `name` (required, 1–64 chars, lowercase letters/digits/hyphens, no leading/trailing/consecutive hyphen, matches directory), `description` (required, 1–1024 chars, non-empty), `license`, `compatibility` (1–500), `metadata` (string→string map), `allowed-tools` (Experimental). Body budget restated as "< 5000 tokens recommended", "under 500 lines", references "one level deep". No new fields, no deprecations.
- **Agent Skills home:** accessible; three-stage progressive disclosure (metadata ~100 tok / instructions < 5000 tok / resources on demand). Spec unchanged.
- **BP (Anthropic platform best-practices):** accessible; full page fetched. No new guidance beyond the standard — confirms third-person description, gerund naming, < 500-line body, progressive disclosure, ToC > 100 lines, ≥ 3 evaluations, Haiku/Sonnet/Opus testing, forward-slash paths, one-default-with-escape-hatch, fully-qualified `ServerName:tool_name`, plan-validate-execute, justified constants, and the authoring checklist.
- **CC runtime overlay (Claude Code skills docs):** accessible; full frontmatter table confirms every CC-only field the standard lists. Confirms the 1,536-char `description`+`when_to_use` listing cap (~1% of context, configurable via `skillListingBudgetFraction` / `SLASH_COMMAND_TOOL_CHAR_BUDGET`; the per-skill desc-char cap is now documented as **`skillListingMaxDescChars`** — last run named it `maxSkillDescriptionChars`; the standard does not pin the setting name, so no standard drift), the post-compaction 5,000-tok-per-skill / 25,000-tok combined budgets, and the commands→skills merge. New since last run is runtime/settings, not authoring standard: `disable-model-invocation: true` now also blocks scheduled-task firing and subagent preload (v2.1.196), and `skillOverrides` gained an `"off"` state (v2.1.199) — neither changes a rubric criterion.
- **ENG (Anthropic Engineering blog):** accessible. Confirms the two required fields, three-level progressive-disclosure model, evaluation-first authoring, and name/description as the trigger signal. No numeric caps — cited for rationale only.
- **COMMUNITY (generativeprogrammer.com Skill Authoring Patterns):** accessible; page dated 2026-04-19, unchanged since last run. 14 named patterns incl. Known Gotchas, Autonomy Calibration, Exclusion Clause; confirms the 1024 / 1536 caps, < 500 lines, third-person "pushy" descriptions. Repeats the soft ~300-line split trigger — compatible with (and below) our 500-line WARN; still not adopted as a separate cap.
- **`skills-ref` validator:** `validate` CLI documented but internals not fetchable; the frontmatter + naming rules it enforces are fully specified on the SPEC page (which links skills-ref as the validator), so the mechanical baseline (NAME / DESC / OPT) is confirmed there.
- **In-house scan:** the then-current governed skill set passed its skill-quality audit, including `ki-skills` itself. Exact commands and fleet counts are intentionally omitted because both change as the host and skill set evolve.
- **No standard, rubric, or linter change this run.**
- **Open watch-items:** (1) re-fetch `superpowers` directly next run (carried forward). (2) The canonical dependency order in `ADR-KI-HARNESS-SKILLS-003` (mirrored in SKILL.md line 27) still lists 12 skills and omits `activities`, `bootstrap`, `decision-records`, `handoffs`, `live-artifacts`, `plans` — flag for the ADR owner; SKILL.md re-mirrors once the ADR is refreshed. (3) Confirm the `skills-ref` validator source if its repo layout becomes fetchable.

(What past reviews changed in the standard / rubric / linter — the `disallowed-tools` behavioural note in §6, the CC runtime-extension fields, MCP fully-qualified tool naming, the CC post-compaction budget row, the migration to area-scoped codes — is in git.)

[spec]: https://agentskills.io/specification
[agentskills-index]: https://agentskills.io/llms.txt
[home]: https://agentskills.io/
[quickstart]: https://agentskills.io/skill-creation/quickstart
[agentskills-best-practices]: https://agentskills.io/skill-creation/best-practices
[optimizing-descriptions]: https://agentskills.io/skill-creation/optimizing-descriptions
[evaluating-skills]: https://agentskills.io/skill-creation/evaluating-skills
[using-scripts]: https://agentskills.io/skill-creation/using-scripts
[clients]: https://agentskills.io/clients
[adding-skills-support]: https://agentskills.io/client-implementation/adding-skills-support
[bp]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
[cc]: https://code.claude.com/docs/en/skills
[eng]: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
[skills-ref]: https://github.com/agentskills/agentskills/tree/main/skills-ref
[patterns]: https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics
[superpowers]: https://github.com/obra/superpowers/blob/main/skills/writing-skills/anthropic-best-practices.md
[skills-sh]: https://www.skills.sh/
