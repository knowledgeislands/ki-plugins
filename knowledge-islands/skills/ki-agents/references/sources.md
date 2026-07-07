# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The sources behind [the standard](agent-definitions-standard.md) and its [rubric](audit-rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where best practice comes from — keep it current.

Abbreviations match the `(SOURCE)` tags in [the standard](agent-definitions-standard.md) and [rubric](audit-rubric.md).

## Authoritative

| Tag | Source                               | Governs                                                                 | Last reviewed |
| --- | ------------------------------------ | ----------------------------------------------------------------------- | ------------- |
| CC  | [Claude Code — subagents][cc]        | Subagent file format, the frontmatter spec set,[^cc] invocation control | 2026-07-04    |
| BP  | [Skill authoring best practices][bp] | Description, conciseness, least-privilege, evaluation-first †           | 2026-07-04    |

[^cc]: Full set: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`.

† Description writing, conciseness, least-privilege, and evaluation-first — all applied to agents.

## Community / practitioner

| Tag  | Source                                          | Governs                            | Last reviewed |
| ---- | ----------------------------------------------- | ---------------------------------- | ------------- |
| COM1 | [awesome-claude-code-subagents (VoltAgent)][c1] | Example agent definitions (100+) ‡ | 2026-06-26    |
| COM2 | [Sub-agent best practices (PubNub)][c2]         | Production patterns §              | 2026-06-26    |

‡ Patterns for tool scoping, model routing, and description quality.

§ SubagentStop hooks, the skills+hooks+subagents trinity, and concurrent agent limits.

## In-house

| Tag   | Source                                                 | Governs                                   | Last reviewed |
| ----- | ------------------------------------------------------ | ----------------------------------------- | ------------- |
| HOUSE | The harness `agents/README.md` + the role-prompt shape | Layout and the role/lane prompt pattern ¶ | 2026-06-26    |

¶ Grounding, lane disambiguation, and KB-note wikilinks.

## Last review

**REFRESH last run 2026-07-04 — prior action items now closed; sources re-verified, no spec drift.** The 2026-06-26 pass raised open action items and applied nothing; a subsequent CONFORM pass folded them all into the rubric and standard. This re-anchor records that closure and re-verifies the authoritative sources live.

- **CC (Claude Code subagents docs):** re-fetched live 2026-07-04. Frontmatter field set unchanged — the 16-field set in FM-3 still stands. `Agent(type)` spawn-allowlist, nested subagents, and depth ≤ 5 still documented (LANE-3/LANE-4 current). The doc now cross-links two adjacent-but-distinct surfaces — **background agents** (`/en/agent-view`) and **agent teams** (`/en/agent-teams`); both sit outside a single-session subagent definition, so no criterion changes. `last reviewed` bumped to 2026-07-04.
- **BP:** re-fetched live 2026-07-04. Third-person description (explicit warning), specific/key-term discoverability, least-privilege, evaluation-first, and the caps (name ≤ 64, description ≤ 1024) all unchanged — DESC-2/DESC-5, FM-1, PROC-1 remain accurate. `last reviewed` bumped to 2026-07-04.
- **COM1 (awesome-claude-code-subagents):** not re-fetched — reviewed 2026-06-26, within monthly cadence. Now cited by PROC-1.
- **COM2 (PubNub best practices):** not re-fetched — within cadence. Its `SubagentStop`-hook pattern is now cited by FM-7.
- **HOUSE:** not re-read this pass — within cadence. The role/lane prompt shape and KB-wikilink divergence stand; the 5 governance agents in `agents/governance/` remain the reference set (linter green, 0 fail / 0 warn on 2026-07-04).
- **Closed since 2026-06-26 (was: Open action items):** FM criteria added for `skills` (FM-5), `memory` (FM-6), `hooks` (FM-7), `effort` (FM-8), `isolation` (FM-9), `background` (FM-10); `Agent(type)` coordinator allowlist (LANE-3) and spawn depth (LANE-4) added; standard §2 now addresses directory-per-agent and companion-file guidance; COM1/COM2 tags wired into PROC-1 and FM-7.
- **Open watch-items:**
  - **Adjacent surfaces (agent-view / agent-teams).** CC now frames background agents and agent teams as siblings of subagents. Watch whether house practice starts authoring these and whether they warrant their own governance surface — out of scope for the subagent-definition rubric today.
  - **`SubagentStop`-hook enforcement (COM2).** FM-7 codifies the field; no live governance agent yet uses a scoped hook. Re-examine once one does, to confirm the guidance matches real usage.
  - **BP/community cadence.** COM1, COM2, HOUSE due for re-fetch at the next monthly pass (target ~2026-07-26).

[cc]: https://code.claude.com/docs/en/sub-agents
[bp]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
[c1]: https://github.com/VoltAgent/awesome-claude-code-subagents
[c2]: https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/
