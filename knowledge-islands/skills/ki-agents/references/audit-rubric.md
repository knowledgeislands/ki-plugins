# Audit Rubric — the checkable criteria

Line-by-line pass/fail criteria for auditing a Claude Code subagent against the [Agent Definitions Standard](agent-definitions-standard.md). Each is tagged **[M] mechanical** (the bundled [linter](../scripts/audit.ts) checks it) or **[J] judgment** (you assess it by reading). The **code** in bold (`NAME-1`, `DESC-2`, …) is the area's short code plus its number within that area — what the linter prints and what an audit should cite. Source abbreviations resolve in [the source list](sources.md); each area maps to the like-named standard section.

A criterion's tag is a contract with the linter: if you find yourself eyeballing an **[M]** check, run the linter; if the linter starts enforcing a **[J]** check, move its tag here.

## Contents

- [LAY — File & frontmatter layout](#lay--file--frontmatter-layout)
- [NAME — Frontmatter: name](#name--frontmatter-name)
- [DESC — Frontmatter: description](#desc--frontmatter-description)
- [FM — Frontmatter: tools & model](#fm--frontmatter-tools--model)
- [PROMPT — System-prompt quality](#prompt--system-prompt-quality)
- [LANE — Lane & delegation](#lane--lane--delegation)
- [LINK — Linking](#link--linking)
- [PROC — Process / meta](#proc--process--meta)
- [LONG — Longevity](#long--longevity)
- [COLL — Cross-agent collision](#coll--cross-agent-collision)

## LAY — File & frontmatter layout

→ [standard §2](agent-definitions-standard.md#2-layout)

- **LAY-1 [M]** The agent is a single `.md` file with a YAML frontmatter block (`--- … ---`) at the top. (CC)
- **LAY-2 [J]** Grouping subdirectories are for human organisation only; identity is `name`, not path. (CC, HOUSE)
- **LAY-3 [M]** The filename stem matches `name` (`product-manager.md` → `name: product-manager`) — WARN if not. (HOUSE)

## NAME — Frontmatter: name

→ [standard §3](agent-definitions-standard.md#3-frontmatter-name)

- **NAME-1 [M]** `name` present. (CC)
- **NAME-2 [M]** `name` is lowercase letters, digits, hyphens only. (CC, BP)
- **NAME-3 [M]** `name` has no leading/trailing hyphen and no consecutive hyphens. (CC)
- **NAME-4 [M]** `name` contains no XML tags and no reserved words (`anthropic`, `claude`). (BP)
- **NAME-5 [M]** `name` is **unique across the agent set** — no two agents share it. (CC, HOUSE)
- **NAME-6 [J]** `name` is a specific role, not generic (`engineering-lead`, not `helper`/`assistant`). (BP)

## DESC — Frontmatter: description

→ [standard §4](agent-definitions-standard.md#4-frontmatter-description)

- **DESC-1 [M]** `description` present and non-empty. (CC)
- **DESC-2 [M]** `description` within the soft length cap (≤ ~1024 chars) — WARN over. (BP)
- **DESC-3 [M]** `description` contains no XML tags. (BP)
- **DESC-4 [J]** States **both** what the agent owns **and** when to delegate to it. (CC, BP)
- **DESC-5 [J]** Written in the **third person**, never first/second person. (BP)
- **DESC-6 [J]** Includes concrete cues a request would carry (the role's nouns/verbs). (CC, BP)
- **DESC-7 [J]** Avoids vague phrasing ("helps with engineering"). (BP)

## FM — Frontmatter: tools & model

→ [standard §5](agent-definitions-standard.md#5-frontmatter-optional-fields) · [§8](agent-definitions-standard.md#8-tools--model)

- **FM-1 [J]** `tools` / `disallowedTools`, if set, is **least-privilege** — only what the role needs (omitting inherits all, the wrong default for a narrow role). An advisory agent carries no write/exec tools. (CC, BP)
- **FM-2 [J]** `model` is deliberate: `inherit` by default, a pin (a Claude alias `sonnet` / `opus` / `haiku` / `fable`, not a rot-prone full id) only with a stated reason. The reason should trace to the portable model _type_ the role needs (`fast` / `standard` / `reasoning` / `frontier` — `ki-tokenomics`, ADR-KI-HARNESS-009), of which the alias is this runtime's resolution. (CC, BP)
- **FM-3 [J]** Every frontmatter field is in the current subagents spec set — `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`. A field outside this set is flagged as a portability risk. (CC)
- **FM-4 [J]** `permissionMode`, if set, is deliberate, and `bypassPermissions` (which skips permission prompts) carries a stated reason. (CC)
- **FM-5 [J]** `skills`, if set, preloads a named skill's full content at startup — use only when the role must always have that standard before acting and runtime discovery would be fragile. For optional or situational context, prefer grounding-at-runtime (the agent reads the skill on demand). (CC)
- **FM-6 [J]** `memory`, if set (`user` / `project` / `local`), enables cross-session accumulation — set only when the role genuinely needs state across sessions; the system prompt should describe what to learn and how to apply it. (CC)
- **FM-7 [J]** `hooks`, if set, are scoped to this subagent — use for invariants local to this role (e.g., a `SubagentStop` hook blocking a result if tests fail or secrets are present). Prefer project-level `settings.json` hooks for workspace-wide rules; state the invariant each scoped hook enforces. (CC, COM2)
- **FM-8 [J]** `effort`, if set, pins reasoning effort for this agent — `low` for mechanical/high-volume roles where full reasoning is wasted; `high`+ for deep-analysis roles where the extra reasoning is load-bearing. Prefer inheriting (omit) when the session effort is appropriate. (CC)
- **FM-9 [J]** `isolation: worktree`, if set, runs the agent in a fresh git worktree — use only when the role makes file edits that could conflict with the caller's working tree. The overhead is real; do not use for read-only or advisory roles. (CC)
- **FM-10 [J]** `background: true`, if set, always runs the agent as a non-blocking background task — use when the caller does not need to wait for the result. For roles where the caller needs the result, omit. (CC)
- **FM-11 [M]** `model` is **tier-agnostic** — the mechanical floor under FM-2, per the §5 `model` guidance. `inherit` (or omitted) passes; a Claude alias (`sonnet` / `opus` / `haiku` / `fable`) is an advisory **WARN** (a portable pin, acceptable only with a stated reason the linter cannot see — see FM-2); any other value is a rot-prone **full model id** and **FAILs** (e.g. `claude-opus-4-8` — prefer an alias or `inherit`). The model-tier analogue of a skill hardcoding a runtime. (BP, HOUSE)

## PROMPT — System-prompt quality

→ [standard §6](agent-definitions-standard.md#6-system-prompt-size--focus) · [§7](agent-definitions-standard.md#7-system-prompt-structure--quality)

- **PROMPT-1 [M]** A non-empty system-prompt body follows the frontmatter. (CC)
- **PROMPT-2 [J]** Opens with **role & lane** — what it owns and, explicitly, what it does not. (HOUSE)
- **PROMPT-3 [J]** **Grounding**: names the sources it must read before acting and requires citing them, not reasoning from memory. (HOUSE)
- **PROMPT-4 [J]** A short ordered **when-invoked** procedure (clarify → read → reason → produce). (HOUSE)
- **PROMPT-5 [J]** An explicit **own-vs-defer** list naming the siblings it hands work to. (HOUSE)
- **PROMPT-6 [J]** If it may write, requires confirm-before-write and house conventions, stating the _why_ alongside each rule. (HOUSE)
- **PROMPT-7 [J]** Focused on one role, consistent terminology, no token spent on what Claude already knows. (BP)

## LANE — Lane & delegation

→ [standard §9](agent-definitions-standard.md#9-lane--delegation)

- **LANE-1 [J]** The agent owns a **distinct lane**; its boundary keeps it from overlapping siblings. (HOUSE)
- **LANE-2 [J]** Where a sibling is genuinely adjacent, **each** names the other as the hand-off — reciprocal, not one-directional. (HOUSE)
- **LANE-3 [J]** A **coordinator** agent — one that spawns subagents — restricts which agents it may spawn via `Agent(type)` in `tools` (e.g., `tools: Agent(worker, researcher)`). Its own-vs-defer boundary declares which agents it orchestrates and why; an unrestricted coordinator is a blast-radius risk. (CC)
- **LANE-4 [J]** Subagents may nest to a depth of ≤ 5. A coordinator's system prompt declares its spawn depth so callers can reason about total depth. Avoid nesting unless hierarchical decomposition genuinely helps; flat fan-out is simpler and easier to audit. (CC)

## LINK — Linking

→ [standard §10](agent-definitions-standard.md#10-linking)

- **LINK-1 [M]** Relative markdown links to **bundled files** resolve on disk. (HOUSE)
- **LINK-2 [J]** `[[wikilinks]]` to KB notes are **allowed** here (a grounded agent cites its notes) — they are not a defect, unlike in a `SKILL.md`. (HOUSE)
- **LINK-3 [J]** Other agents/skills are referred to by `name`, never by file path. (HOUSE)

## PROC — Process / meta

→ [standard §11](agent-definitions-standard.md#11-process--evaluation) · not checkable from files alone

- **PROC-1 [J]** Exercised on representative in-lane tasks — does it stay in lane, ground itself, defer correctly? (BP, COM1)
- **PROC-2 [J]** Tested across the models it will run under. (BP)

## LONG — Longevity

→ [standard §12](agent-definitions-standard.md#12-longevity)

- **LONG-1 [J]** Volatile facts (model IDs, tool names, note paths, dated specifics) are resolved at runtime (read the live KB, prefer `model: inherit`) or covered by a refresh path — prefer grounding-at-runtime over baked-in facts. (BP, HOUSE)

## COLL — Cross-agent collision

→ [standard §13](agent-definitions-standard.md#13-cross-agent-collision) · run the linter over the **whole set**, not one agent

- **COLL-1 [M]** Within a set of ≥ 2 agents: no two share a `name` (FAIL), and no two `description`s declare the **same quoted trigger phrase** (WARN). (HOUSE)
- **COLL-2 [J]** Where two agents could take one request, **each** names the other as the off-ramp; a one-directional guard is a half-fix. (HOUSE)
