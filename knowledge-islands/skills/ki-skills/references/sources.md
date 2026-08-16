# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and community sources behind the [Agent Skills](standards-agent-skills.md), [Knowledge Islands](standards-knowledge-islands.md), and [rubric-authoring](standards-rubric-authoring.md) standards and their [rubric](rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against those standards and the rubric, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where best practice comes from — keep it current.

Abbreviations match the `(SOURCE)` tags in the standards and [rubric](rubric.md).

## Contents

- [Portable Agent Skills contract](#portable-agent-skills-contract)
- [Established authoring practice](#established-authoring-practice)
- [Anthropic practice](#anthropic-practice)
- [Runtime overlay: OpenAI](#runtime-overlay-openai)
- [OpenAI practice](#openai-practice)
- [Knowledge Islands house standard](#knowledge-islands-house-standard)
- [Runtime overlay: Claude Code](#runtime-overlay-claude-code)
- [Last review](#last-review)

## Portable Agent Skills contract

| Tag  | Source                               | Scope                  | Last reviewed |
| ---- | ------------------------------------ | ---------------------- | ------------- |
| SPEC | [Agent Skills specification][spec]   | Format and constraints | 2026-08-12    |
| —    | [`skills-ref validate`][skills-ref]‡ | Demonstration validator | 2026-08-12   |

‡ The reference library explicitly says it is demonstration-only and unsuitable as a production validator; it remains supporting validation evidence subordinate to the specification.

## Established authoring practice

### Agent Skills documentation set

The Agent Skills [documentation index][agentskills-index] is the inventory authority for this set. Every REFRESH fetches it first, reconciles this table with its current pages, then reviews every listed page individually. The index currently lists the nine documentation pages below; the index itself is also tracked because it detects additions and removals.

| Tag | Source                                                     | Scope                 | Last reviewed |
| --- | ---------------------------------------------------------- | --------------------- | ------------- |
| AS  | [Agent Skills documentation index][agentskills-index]      | Page inventory        | 2026-08-12    |
| AS  | [Agent Skills overview][home]                              | Conceptual overview   | 2026-08-12    |
| AS  | [Skill-creator quickstart][quickstart]                     | First-skill workflow  | 2026-08-12    |
| AS  | [Skill-creator best practices][agentskills-best-practices] | Authoring guidance    | 2026-08-12    |
| AS  | [Optimising descriptions][optimizing-descriptions]         | Description quality   | 2026-08-12    |
| AS  | [Evaluating skills][evaluating-skills]                     | Evaluation practice   | 2026-08-12    |
| AS  | [Using scripts][using-scripts]                             | Script execution      | 2026-08-12    |
| AS  | [Client showcase][clients]                                 | Client inventory      | 2026-08-12    |
| AS  | [Adding skills support][adding-skills-support]             | Client implementation | 2026-08-12    |
| BP  | [Skill authoring best practices][bp]                       | Authoring checklist   | 2026-08-12    |
| ENG | [Equipping agents with Agent Skills][eng]†                 | Design rationale      | 2026-08-12    |

† Published 2025-10-16; updated to announce the open standard 2025-12-18.

## Anthropic practice

The Claude blog is a discovery source, not a normative standard. On each REFRESH, scan its landing page for new articles materially relevant to agent skills, agentic practice, or authoring workflows; open and assess only those relevant articles.

| Tag  | Source                     | Scope                                            | Last reviewed |
| ---- | -------------------------- | ------------------------------------------------ | ------------- |
| BLOG | [Claude blog][claude-blog] | Agentic-practice and authoring article discovery | 2026-07-28    |

## Runtime overlay: OpenAI

| Tag | Source | Scope | Last reviewed |
| --- | --- | --- | --- |
| OA | [OpenAI Build skills][openai-skills] | ChatGPT/Codex runtime overlay | 2026-08-12 |

`OA` documents OpenAI runtime discovery, listing, path metadata, implicit invocation, and `agents/openai.yaml`. It qualifies runtime claims but never changes the portable Agent Skills contract.

## OpenAI practice

The OpenAI News page is a discovery source, not a normative standard. On each REFRESH, scan its landing page for new articles materially relevant to agent skills, agentic practice, or authoring workflows; open and assess only those relevant articles.

| Tag    | Source                     | Scope                                            | Last reviewed |
| ------ | -------------------------- | ------------------------------------------------ | ------------- |
| OPENAI | [OpenAI News][openai-news] | Agentic-practice and authoring article discovery | 2026-08-12    |

## Community

| Tag | Source | Scope | Last reviewed |
| --- | --- | --- | --- |
| COMMUNITY | [Skill Authoring Patterns][patterns] | Patterns and feedback | 2026-07-04 |
| COMMUNITY | [obra/superpowers writing-skills][superpowers]† | Convergent conventions | 2026-06-18 |
| COMMUNITY | [skills.sh — Open Agent Skills Ecosystem][skills-sh] | Registry and security | 2026-07-04 |
| GASTOWN | [Gas Town Hall][gastown-hall] | Multi-agent orchestration and harness-practice discovery | 2026-07-29 |
| FAFF | [shftwst/faff][faff] | Claude Code delivery-harness and autonomy-gate discovery | 2026-07-29 |

† Community restatement of the best-practices document.

## Knowledge Islands house standard

| Tag                       | Source                       | Scope            | Last reviewed |
| ------------------------- | ---------------------------- | ---------------- | ------------- |
| ki-agentic-harness README | The repo's own `README.md` | Harness structure | 2026-08-12 |
| ADR-KI-HARNESS-SKILLS-004 | Local decision record | Standalone skills and variation | 2026-08-12 |
| ADR-KI-HARNESS-SKILLS-006 | Local decision record | Kind, taxonomy, and dependencies | 2026-08-12 |

The README is cited only for the harness's five-part structure. Local decision records, rather than the README, support the semantic house claims.

## Runtime overlay: Claude Code

| Tag | Source                     | Scope                   | Last reviewed |
| --- | -------------------------- | ----------------------- | ------------- |
| CC  | [Claude Code — skills][cc] | Claude runtime overlay† | 2026-08-12    |

† Claude Code extensions and runtime behaviour. This overlay may qualify a portable or Knowledge Islands rule for Claude Code, but never weakens the portable contract.

## Last review

REFRESH last run **2026-08-12**. It fetched [the documentation index][agentskills-index] first; it still lists the same nine pages and the specification retains the portable format and budgets. The review corrected authority and runtime-overlay claims without changing capability scope.

- **SPEC:** portable fields and constraints remain current. `allowed-tools` is the only portable tool declaration and remains experimental; `disallowed-tools` is not in the specification.
- **Agent Skills home:** accessible; three-stage progressive disclosure (metadata ~100 tok / instructions < 5000 tok / resources on demand). Spec unchanged.
- **BP (Anthropic platform best-practices):** accessible; full page fetched. No new guidance beyond the standard — confirms third-person description, gerund naming, < 500-line body, progressive disclosure, ToC > 100 lines, ≥ 3 evaluations, Haiku/Sonnet/Opus testing, forward-slash paths, one-default-with-escape-hatch, fully-qualified `ServerName:tool_name`, plan-validate-execute, justified constants, and the authoring checklist.
- **CC:** `disallowed-tools` and `background` remain Claude Code extensions; the former accepts a string or YAML list, while `background` applies only with `context: fork`.
- **OA:** OpenAI documents `.agents/skills` discovery, initial name/description/path listings, `agents/openai.yaml`, and `allow_implicit_invocation`. Description remains the primary signal for implicit matching, not the only listed metadata.
- **ENG:** published 2025-10-16 and updated 2025-12-18; it remains rationale, not a normative source.
- **BLOG (Claude blog):** added as a discovery source. Future REFRESH runs scan it for articles materially relevant to agent skills, agentic practice, or authoring workflows; an article is supporting evidence, not a normative rule by itself.
- **OPENAI (OpenAI News):** added as a discovery source. Future REFRESH runs scan it for articles materially relevant to agent skills, agentic practice, or authoring workflows; an article is supporting evidence, not a normative rule by itself.
- **GASTOWN (Gas Town Hall):** added as a discovery source. Future REFRESH runs scan its announcements and documentation for material multi-agent orchestration or harness-practice lessons; its practice is supporting evidence, not a normative rule by itself.
- **FAFF (shftwst/faff):** added as a discovery source. Future REFRESH runs review its delivery-loop contracts, autonomy levels, and gate design for transferable lessons; its Claude Code-specific implementation is supporting evidence, not a portable rule by itself.
- **COMMUNITY (generativeprogrammer.com Skill Authoring Patterns):** accessible; page dated 2026-04-19, unchanged since last run. 14 named patterns incl. Known Gotchas, Autonomy Calibration, Exclusion Clause; confirms the 1024 / 1536 caps, < 500 lines, third-person "pushy" descriptions. Repeats the soft ~300-line split trigger — compatible with (and below) our 500-line WARN; still not adopted as a separate cap.
- **`skills-ref`:** the repository now explicitly labels the reference library demonstration-only and not for production. Keep it as supporting validation evidence; the specification remains the normative baseline.
- **In-house scan:** the then-current governed skill set passed its skill-quality audit, including `ki-skills` itself. Exact commands and fleet counts are intentionally omitted because both change as the host and skill set evolve.
- **Open watch-items:** re-fetch `superpowers` directly next run (carried forward).

(What past reviews changed in the standard / rubric / linter is in git.)

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
[claude-blog]: https://claude.com/blog
[openai-news]: https://openai.com/news/
[openai-skills]: https://learn.chatgpt.com/docs/build-skills
[gastown-hall]: https://gastownhall.ai/
[faff]: https://github.com/shftwst/faff
[skills-ref]: https://github.com/agentskills/agentskills/tree/main/skills-ref
[patterns]: https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics
[superpowers]: https://github.com/obra/superpowers/blob/main/skills/writing-skills/anthropic-best-practices.md
[skills-sh]: https://www.skills.sh/
