<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Claude Code subagent definitions

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-subagents --write`.

Line-by-line criteria for auditing ki-subagents. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [LAY — File and frontmatter layout](#lay--file-and-frontmatter-layout)
- [NAME — Frontmatter name](#name--frontmatter-name)
- [DESC — Frontmatter description](#desc--frontmatter-description)
- [FM — Frontmatter tools and model](#fm--frontmatter-tools-and-model)
- [PROMPT — System-prompt quality](#prompt--system-prompt-quality)
- [LANE — Lane and delegation](#lane--lane-and-delegation)
- [LINK — Linking](#link--linking)
- [PROC — Process and evaluation](#proc--process-and-evaluation)
- [LONG — Longevity](#long--longevity)
- [COLL — Cross-agent collision](#coll--cross-agent-collision)

## LAY — File and frontmatter layout

→ [standard](standards-subagent-definitions.md)

Agent definition layout and filename identity.

- **LAY-1 [M] — Agent file and frontmatter layout** — The agent is a single .md file with a YAML frontmatter block at the top. (standards-subagent-definitions.md#2-layout, CC)
- **LAY-2 [J] — Path-independent identity** — Grouping subdirectories are for human organisation only; identity is name, not path. (standards-subagent-definitions.md#2-layout, CC, HOUSE)
  - _Review prompt:_ Grouping subdirectories are for human organisation only; identity is name, not path.
- **LAY-3 [M] — Filename and name alignment** — The filename stem matches name. (standards-subagent-definitions.md#2-layout, HOUSE)

## NAME — Frontmatter name

→ [standard](standards-subagent-definitions.md)

Agent name syntax, uniqueness, and role quality.

- **NAME-1 [M] — Name present** — name is present. (standards-subagent-definitions.md#3-frontmatter-name, CC)
- **NAME-2 [M] — Name characters and length** — name uses lowercase letters, digits, and hyphens only and is at most 64 characters. (standards-subagent-definitions.md#3-frontmatter-name, CC, BP)
- **NAME-3 [M] — Name hyphen placement** — name has no leading or trailing hyphen and no consecutive hyphens. (standards-subagent-definitions.md#3-frontmatter-name, CC)
- **NAME-4 [M] — Name safety** — name contains no XML tags and no reserved words (anthropic, claude). (standards-subagent-definitions.md#3-frontmatter-name, BP)
- **NAME-5 [M] — Unique name** — name is unique across the agent set. (standards-subagent-definitions.md#3-frontmatter-name, CC, HOUSE)
- **NAME-6 [J] — Specific role name** — name is a specific role, not a generic helper or assistant. (standards-subagent-definitions.md#3-frontmatter-name, BP)
  - _Review prompt:_ name is a specific role, not generic (engineering-lead, not helper/assistant).

## DESC — Frontmatter description

→ [standard](standards-subagent-definitions.md)

The agent delegation signal.

- **DESC-1 [M] — Description present** — description is present and non-empty. (standards-subagent-definitions.md#4-frontmatter-description, CC)
- **DESC-2 [M] — Description soft length cap** — description is at most approximately 1024 characters. (standards-subagent-definitions.md#4-frontmatter-description, BP)
- **DESC-3 [M] — Description XML safety** — description contains no XML tags. (standards-subagent-definitions.md#4-frontmatter-description, BP)
- **DESC-4 [J] — Ownership and delegation signal** — The description states both what the agent owns and when to delegate to it. (standards-subagent-definitions.md#4-frontmatter-description, CC, BP)
  - _Review prompt:_ States both what the agent owns and when to delegate to it.
- **DESC-5 [J] — Third-person description** — The description is written in the third person, never first or second person. (standards-subagent-definitions.md#4-frontmatter-description, BP)
  - _Review prompt:_ Written in the third person, never first/second person.
- **DESC-6 [J] — Concrete request cues** — The description includes concrete cues a request would carry. (standards-subagent-definitions.md#4-frontmatter-description, CC, BP)
  - _Review prompt:_ Includes concrete cues a request would carry (the role's nouns/verbs).
- **DESC-7 [J] — Specific description** — The description avoids vague phrasing such as helps with engineering. (standards-subagent-definitions.md#4-frontmatter-description, BP)
  - _Review prompt:_ Avoids vague phrasing ("helps with engineering").

## FM — Frontmatter tools and model

→ [standard](standards-subagent-definitions.md)

Optional frontmatter and runtime choices.

- **FM-1 [J] — Least-privilege tools** — tools and disallowedTools are least-privilege for the role. (standards-subagent-definitions.md#5-frontmatter-optional-fields, standards-subagent-definitions.md#8-tools--model, CC, BP)
  - _Review prompt:_ `tools` / `disallowedTools`, if set, is least-privilege — only what the role needs (omitting inherits all, the wrong default for a narrow role). An advisory agent carries no write/exec tools.
- **FM-2 [J] — Deliberate model choice** — model is inherited by default or deliberately pinned to a portable Claude alias with a stated reason. (standards-subagent-definitions.md#5-frontmatter-optional-fields, standards-subagent-definitions.md#8-tools--model, CC, BP)
  - _Review prompt:_ `model` is deliberate: `inherit` by default, a pin (a Claude alias `sonnet` / `opus` / `haiku` / `fable`, not a rot-prone full id) only with a stated reason. The reason should trace to the portable model type the role needs (`fast` / `standard` / `reasoning` / `frontier` — `ki-tokenomics`, ADR-KI-HARNESS-009), of which the alias is this runtime’s resolution.
- **FM-3 [J] — Current frontmatter fields** — Every frontmatter field belongs to the current subagents specification. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC)
  - _Review prompt:_ Every frontmatter field is in the current subagents spec set — `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`. A field outside this set is flagged as a portability risk.
- **FM-4 [J] — Deliberate permission mode** — permissionMode is deliberate and bypassPermissions carries a stated reason. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC)
  - _Review prompt:_ `permissionMode`, if set, is deliberate, and `bypassPermissions` (which skips permission prompts) carries a stated reason.
- **FM-5 [J] — Deliberate skill preload** — skills preloads only standards the role must always have before acting. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC)
  - _Review prompt:_ `skills`, if set, preloads a named skill’s full content at startup — use only when the role must always have that standard before acting and runtime discovery would be fragile. For optional or situational context, prefer grounding-at-runtime.
- **FM-6 [J] — Deliberate memory** — memory is set only when the role genuinely needs cross-session accumulation. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC)
  - _Review prompt:_ `memory`, if set (`user` / `project` / `local`), enables cross-session accumulation — set only when the role genuinely needs state across sessions; the system prompt should describe what to learn and how to apply it.
- **FM-7 [J] — Scoped hooks** — hooks enforce invariants local to the subagent; workspace rules remain project-level. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC, COM2)
  - _Review prompt:_ `hooks`, if set, are scoped to this subagent — use for invariants local to this role. Prefer project-level `settings.json` hooks for workspace-wide rules; state the invariant each scoped hook enforces.
- **FM-8 [J] — Deliberate reasoning effort** — effort is pinned only when the role benefits from a deliberate reasoning level. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC)
  - _Review prompt:_ `effort`, if set, pins reasoning effort for this agent — `low` for mechanical/high-volume roles; `high`+ for deep-analysis roles where extra reasoning is load-bearing. Prefer inheriting when the session effort is appropriate.
- **FM-9 [J] — Deliberate worktree isolation** — isolation: worktree is used only for file-editing roles whose changes could conflict. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC)
  - _Review prompt:_ `isolation: worktree`, if set, runs the agent in a fresh git worktree — use only when the role makes file edits that could conflict with the caller’s working tree; do not use it for read-only or advisory roles.
- **FM-10 [J] — Deliberate background execution** — background: true is used only when the caller need not wait for the result. (standards-subagent-definitions.md#5-frontmatter-optional-fields, CC)
  - _Review prompt:_ `background: true`, if set, always runs the agent as a non-blocking background task — use when the caller does not need to wait for the result; otherwise omit it.
- **FM-11 [M] — Tier-agnostic model** — model is omitted, inherit, or a portable Claude alias rather than a full model ID. (standards-subagent-definitions.md#5-frontmatter-optional-fields, BP, HOUSE)

## PROMPT — System-prompt quality

→ [standard](standards-subagent-definitions.md)

System-prompt presence, structure, and focus.

- **PROMPT-1 [M] — System-prompt body present** — A non-empty system-prompt body follows the frontmatter. (standards-subagent-definitions.md#6-system-prompt-size--focus, CC)
- **PROMPT-2 [J] — Role and lane opening** — The system prompt opens with the role and lane: what it owns and what it does not. (standards-subagent-definitions.md#7-system-prompt-structure--quality, HOUSE)
  - _Review prompt:_ Opens with role & lane — what it owns and, explicitly, what it does not.
- **PROMPT-3 [J] — Grounding before action** — The system prompt names sources to read and cite before acting. (standards-subagent-definitions.md#7-system-prompt-structure--quality, HOUSE)
  - _Review prompt:_ Grounding: names the sources it must read before acting and requires citing them, not reasoning from memory.
- **PROMPT-4 [J] — When-invoked procedure** — The system prompt gives a short ordered clarify, read, reason, produce procedure. (standards-subagent-definitions.md#7-system-prompt-structure--quality, HOUSE)
  - _Review prompt:_ A short ordered when-invoked procedure (clarify → read → reason → produce).
- **PROMPT-5 [J] — Own-versus-defer boundary** — The system prompt explicitly names sibling hand-offs. (standards-subagent-definitions.md#7-system-prompt-structure--quality, HOUSE)
  - _Review prompt:_ An explicit own-vs-defer list naming the siblings it hands work to.
- **PROMPT-6 [J] — Safe write guidance** — A writing agent requires confirm-before-write and explains house conventions. (standards-subagent-definitions.md#7-system-prompt-structure--quality, HOUSE)
  - _Review prompt:_ If it may write, requires confirm-before-write and house conventions, stating the why alongside each rule.
- **PROMPT-7 [J] — Focused prompt** — The system prompt stays focused on one role with consistent, useful terminology. (standards-subagent-definitions.md#6-system-prompt-size--focus, standards-subagent-definitions.md#7-system-prompt-structure--quality, BP)
  - _Review prompt:_ Focused on one role, consistent terminology, no token spent on what Claude already knows.

## LANE — Lane and delegation

→ [standard](standards-subagent-definitions.md)

Agent ownership, boundaries, and orchestration.

- **LANE-1 [J] — Distinct lane** — The agent owns a distinct lane whose boundary prevents sibling overlap. (standards-subagent-definitions.md#9-lane--delegation, HOUSE)
  - _Review prompt:_ The agent owns a distinct lane; its boundary keeps it from overlapping siblings.
- **LANE-2 [J] — Reciprocal hand-offs** — Adjacent sibling agents name each other as hand-offs. (standards-subagent-definitions.md#9-lane--delegation, HOUSE)
  - _Review prompt:_ Where a sibling is genuinely adjacent, each names the other as the hand-off — reciprocal, not one-directional.
- **LANE-3 [J] — Bounded coordinator tools** — A coordinator restricts the agent types it may spawn and declares what it orchestrates. (standards-subagent-definitions.md#9-lane--delegation, CC)
  - _Review prompt:_ A coordinator agent — one that spawns subagents — restricts which agents it may spawn via `Agent(type)` in `tools` (e.g. `tools: Agent(worker, researcher)`). Its own-vs-defer boundary declares which agents it orchestrates and why; an unrestricted coordinator is a blast-radius risk.
- **LANE-4 [J] — Bounded nesting depth** — Subagent nesting is at most five levels and coordinators declare their spawn depth. (standards-subagent-definitions.md#9-lane--delegation, CC)
  - _Review prompt:_ Subagents may nest to a depth of at most five. A coordinator’s system prompt declares its spawn depth so callers can reason about total depth. Avoid nesting unless hierarchical decomposition genuinely helps; flat fan-out is simpler and easier to audit.
- **LANE-5 [J] — Coordinator progress visibility** — A coordinator owns caller-visible progress for long-running and background work. (standards-subagent-definitions.md#9-lane--delegation, HOUSE)
  - _Review prompt:_ A coordinator’s system prompt owns progress visibility for long-running/background work: it announces the next checkpoint, reports phase completion and material blockers, and uses the caller’s cadence or five-minute default. Workers report to the coordinator; the coordinator updates the caller.

## LINK — Linking

→ [standard](standards-subagent-definitions.md)

Resolvable files and name-based composition.

- **LINK-1 [M] — Resolvable relative links** — Relative Markdown links to bundled files resolve on disk. (standards-subagent-definitions.md#10-linking, HOUSE)
- **LINK-2 [J] — Allowed knowledge-base wikilinks** — Wikilinks to knowledge-base notes are allowed in grounded agent prompts. (standards-subagent-definitions.md#10-linking, HOUSE)
  - _Review prompt:_ `[[wikilinks]]` to KB notes are allowed here (a grounded agent cites its notes) and are not a defect, unlike in a `SKILL.md`.
- **LINK-3 [J] — Name-based composition references** — Other agents and skills are referred to by name, never by file path. (standards-subagent-definitions.md#10-linking, HOUSE)
  - _Review prompt:_ Other agents/skills are referred to by name, never by file path.

## PROC — Process and evaluation

→ [standard](standards-subagent-definitions.md)

Representative and cross-model evaluation.

- **PROC-1 [J] — Representative in-lane evaluation** — The agent is exercised on representative in-lane tasks. (standards-subagent-definitions.md#11-process--evaluation, BP, COM1)
  - _Review prompt:_ Exercised on representative in-lane tasks — does it stay in lane, ground itself, and defer correctly?
- **PROC-2 [J] — Cross-model evaluation** — The agent is tested across the models it will run under. (standards-subagent-definitions.md#11-process--evaluation, BP)
  - _Review prompt:_ Tested across the models it will run under.

## LONG — Longevity

→ [standard](standards-subagent-definitions.md)

Runtime grounding and refresh discipline.

- **LONG-1 [J] — Volatile fact handling** — Volatile facts are resolved at runtime or covered by a refresh path. (standards-subagent-definitions.md#12-longevity, BP, HOUSE)
  - _Review prompt:_ Volatile facts (model IDs, tool names, note paths, dated specifics) are resolved at runtime (read the live KB, prefer `model: inherit`) or covered by a refresh path — prefer grounding-at-runtime over baked-in facts.

## COLL — Cross-agent collision

→ [standard](standards-subagent-definitions.md)

Trigger collisions and reciprocal off-ramps.

- **COLL-1 [M] — Distinct quoted trigger phrases** — Within a set of at least two agents, no two descriptions declare the same quoted trigger phrase. (standards-subagent-definitions.md#13-cross-agent-collision, HOUSE)
- **COLL-2 [J] — Reciprocal collision off-ramps** — Agents that could take the same request name each other as off-ramps. (standards-subagent-definitions.md#13-cross-agent-collision, HOUSE)
  - _Review prompt:_ Where two agents could take one request, each names the other as the off-ramp; a one-directional guard is a half-fix.
