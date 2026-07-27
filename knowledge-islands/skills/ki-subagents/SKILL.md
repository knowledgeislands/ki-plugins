---
name: ki-subagents
ki-depends-on: []
ki-runtime-binding: true
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Audit, review, and write Claude Code subagent definitions against current best practice. Use when creating a new agent (subagent), reviewing or critiquing an agent's definition, checking an agent before it ships, asking "is this agent any good / well-scoped", or refreshing the agents rubric. Carries a checkable rubric — mechanical checks executed by the `ki` host and judgment checks applied by reading — covering the name and description (the delegation signal), the system-prompt shape (role/lane, grounding, when-invoked, own-vs-defer), least-privilege tools and model choice, and cross-agent lane collisions. Triggers: "audit this agent", "review my subagent", "write a new agent", "is this agent definition good", "scaffold an agent", "refresh the agents rubric", "check the agents". Judges a subagent definition (frontmatter + system prompt) — for authoring a SKILL.md use the `ki-skills` skill instead; for harness-level layout (five-part bundle, `.ki-config.toml` compliance) use `ki-harness`.
argument-hint: 'audit <agent-or-dir> | conform <agent> | help | educate <description> | refresh'
---

# Knowledge Islands Agents

You are helping author or audit **Claude Code subagents** — single Markdown files with YAML frontmatter (`name`, `description`, and optional fields — `model`, `tools`, `color`, and more, per the standard) and a system-prompt body, per the [Claude Code subagents standard](https://code.claude.com/docs/en/sub-agents). This is the house rubric for what a _good_ agent definition looks like, plus the four modes you run over it. It is the agents twin of `ki-skills`, which governs `SKILL.md` files; this skill governs subagent definitions.

## The two-layer model

Every criterion is one of two kinds — never conflate them:

- **Mechanical** — deterministically checkable. The `ki` host runs these from the structured catalogue: frontmatter parses, `name` charset and **uniqueness across the agent set**, `description` presence and length, and relative links resolve.
- **Judgment** — needs a model. Assess these by reading: is the `description` a strong delegation signal (what the agent _owns_ + _when_ to delegate, third person), is the system prompt a focused role with a clear lane, does it ground itself before acting, does its own-vs-defer boundary keep it from colliding with sibling agents, and are its `tools` least-privilege?

The conventions a good agent follows — what each is and why — live in [the subagent-definitions standard](references/standards-subagent-definitions.md). The structured TypeScript items under `scripts/rubric/items/` are the canonical rubric; [the published rubric](references/rubric.md) is generated from them for human review. The `ki` host executes the catalogue directly. Load the standard and published rubric before an AUDIT, CONFORM, or EDUCATE; this body is the routing overview.

A note on linking: unlike a `SKILL.md` (which forbids Obsidian wikilinks), an agent's system prompt **may** use `[[wikilinks]]` to point at knowledge-base notes — that is how an agent grounded in a KB cites its sources. See [the rubric](references/rubric.md) area LINK.

## Operating modes

Like every governance skill it carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** — EDUCATE here writes a new agent. Modes are named and alphabetical. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT — review an existing agent

Review an agent (or every agent in a directory) against the rubric and report.

**Auditing a whole directory? Bound the context.** The host creates one stable subject per physical agent, with a separate set-level collision subject. Review the agent subjects one at a time; they are peers, so the order is free.

1. Run `ki repo audit --skill ki-subagents --repo <path>`. The host audits the repository's complete `subagents/` set so name uniqueness and collision checks include siblings.
2. Read each agent definition and apply the **judgment** ([J]-tagged) criteria from [the rubric](references/rubric.md). Focus on:
   - **Description (the delegation signal)** — does it state both _what the agent owns_ and _when to delegate to it_, in the third person, with concrete cues the orchestrating agent would match on? This is the only signal at selection time.
   - **Role & lane** — is the system prompt a focused role with one clear lane, opening by saying what it owns and what it does **not**?
   - **Grounding** — does it read and cite its sources before acting rather than reasoning from memory?
   - **Own-vs-defer** — is the boundary explicit, and where a sibling agent is adjacent does **each** name the other as the hand-off (reciprocal), not a one-directional guard? See [the rubric](references/rubric.md) areas LANE and COLL.
   - **Tools & model** — are `tools` least-privilege (only what the role needs) and is the `model` choice deliberate?
   - **Longevity** — does it hard-code volatile facts (model IDs, tool names, note paths) without resolving them at runtime or carrying a refresh path? See [the rubric](references/rubric.md) area LONG.
3. **Report** as a table: criterion → verdict (✅ pass / ⚠️ warn / ❌ fail) → the specific fix. Lead with FAILs, then WARNs, then a one-line overall verdict. Cite the rubric criterion number. Offer to apply the fixes.

### Mode CONFORM — bring an existing agent into line

1. Run **AUDIT** first to get the fix list.
2. Run `ki repo conform --skill ki-subagents --repo <path>`. The only automatic repair aligns an existing frontmatter `name` with its physical filename stem; the item requests an in-memory draft and the host publishes one coalesced proposal.
3. Apply judgment fixes — `description`, system-prompt shape, `tools`/`model`, and own-vs-defer boundary — per [the rubric](references/rubric.md), touching only what a criterion calls for and leaving the agent's voice intact.
4. Re-run AUDIT until it is clean.

### Mode EDUCATE — write a new agent

1. **Clarify scope first**: what the agent owns (its lane), what should delegate _to_ it (the description cues), what it must **not** own (the boundary with sibling agents), and which tools/model it needs.
2. **Scaffold** `<name>.md` (the filename stem should match the `name:` frontmatter; group it in a domain subdirectory if the set uses one).
3. **Write to the rubric, not from memory** — open [the rubric](references/rubric.md) and satisfy each criterion as you draft. In particular: a third-person `description` stating owns-+-when; a focused role with an explicit lane and own-vs-defer boundary; grounding before acting; least-privilege `tools`; a deliberate `model`; and `name` unique across the set.
4. **Self-audit before finishing** — run Mode AUDIT on the new agent (over the whole directory, so collision and uniqueness are checked). EDUCATE and AUDIT share one rubric on purpose.

### Mode REFRESH — re-anchor best practice

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

Keep the rubric current — the subagents spec and house practice move, and this is why the skill tracks its own sources. Run on its declared cadence (see `references/sources.md`), or when asked "is the agents rubric current".

1. **Read [the source list](references/sources.md)** — the tracked sources (the Claude Code subagents docs and the house agent conventions), each with a `last reviewed` date.
2. **Re-fetch each source** (WebFetch/WebSearch) and **diff against the current [standard](references/standards-subagent-definitions.md) and canonical TypeScript rubric items**: new/changed frontmatter fields (`model`, `tools`, `color`, invocation control), new constraints, deprecations. Note where sources disagree.
3. **Scan the live agents** in the harness for emergent patterns that work but aren't yet codified — promote the good ones; flag drift.
4. **Propose a diff** to [the standard](references/standards-subagent-definitions.md) and the canonical TypeScript items under `scripts/rubric/items/`. Confirm before writing, then regenerate [the published rubric](references/rubric.md) with `ki skill rubric ki-subagents --write`.
5. **Update [the source list](references/sources.md)** — bump each `last reviewed` date, add/retire sources, and refresh the `## Last review` block. The record of _what changed_ is the commit itself — history lives in git, not a changelog.

### Mode HELP — orient without changing anything

Invoked as `help`, `-h`, or `?`, explain the skill, invocation, modes, runtime binding, and off-ramps, then stop. With no recognisable mode, provide the same explanation and only offer a mode choice in an interactive session.

## Notes

- Run the host audit, then judge. Structured items own the mechanical layer; the model owns the judgment layer.
- A WARN is not a FAIL. Length and the third-person-description heuristic are _recommendations_ — report them, but an agent can ship over a soft cap with a reason.
- This skill audits agents, not skills. To audit or author a `SKILL.md`, use `ki-skills`; the two name each other as off-ramps.
- This skill governs agent definitions; when you change the rubric, re-run Mode AUDIT on the harness's agents.
- This skill intentionally carries no top-level command. Repository audit, conform, and educate operations execute through the direct `ki` host.
