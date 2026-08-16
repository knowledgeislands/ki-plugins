# Skill Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated illustrations of well-formed `SKILL.md` files. Use these when writing a new skill, checking an existing one against the rubric, or explaining what a good skill looks like. The exemplars are drawn from the `ki-*` governance skills in this repo — the reference implementation set for the Agent Skills standard — and annotated to surface the conventions rather than the subject matter. Each pattern isolates one concern so it can be studied on its own.

## Collections

| Source | Covers | Last reviewed |
| --- | --- | --- |
| [Agent Skills specification][spec] | Frontmatter fields, hard caps, layout | 2026-06-21 |
| [Agent Skills best practices][bp] | Description writing, progressive disclosure, scripts, authoring rubric | 2026-06-21 |
| [Claude Code — skills docs][cc] | CC-only frontmatter fields including `argument-hint`, `allowed-tools` | 2026-06-21 |
| [Skill Authoring Patterns][patterns] | Terminology discipline, feedback loops, gotchas sections | 2026-06-21 |
| `ki-subagents` SKILL.md † | Reference implementation: full frontmatter + skill-specific EDUCATE mode | 2026-06-21 |
| `ki-repo` SKILL.md ‡ | Reference implementation: argument-hint, standard-skill mode structure | 2026-06-21 |

† Located at `skills/agentic-systems/ki-subagents/SKILL.md` in the harness.

‡ Located at `skills/keystone/ki-repo/SKILL.md` in the harness.

[spec]: https://agentskills.io/specification
[bp]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
[cc]: https://code.claude.com/docs/en/skills
[patterns]: https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics

## Selected patterns

### Runtime binding: well-formed frontmatter block

The frontmatter of `ki-subagents` shows the governance-skill contract plus the most important Claude Code extensions. `name` is all-lowercase with hyphens, matches the directory name exactly, and carries no generic words like `helper` or `utils`. `ki-depends-on: []` makes an intentionally standalone skill explicit. `description` is written in the third person ("Audit, review, and write…" — never "Can audit…"), names concrete trigger phrases, and ends with off-ramp declarations so the skill does not silently absorb adjacent work. `argument-hint` lists the discrete modes a user can pass at the `/` prompt.

```yaml
---
name: ki-subagents
ki-depends-on: []
description: >
  Audit, review, and write Claude Code subagent definitions against current best practice. Use when creating a new agent (subagent), reviewing or critiquing an agent's definition, checking an agent before it ships, asking "is this agent any good / well-scoped", or refreshing the agents rubric. Carries a checkable rubric — mechanical checks a bundled linter runs, judgment checks applied by reading — covering the name and description (the delegation signal), the system-prompt shape (role/lane, grounding, when-invoked, own-vs-defer), least-privilege tools and model choice, and cross-agent lane collisions. Triggers: "audit this agent", "review my subagent", "write a new agent", "is this agent definition good", "scaffold an agent", "refresh the agents rubric", "check the agents". Judges a subagent definition (frontmatter + system prompt) — for authoring a SKILL.md use the `ki-skills` skill instead; for harness-level layout (five-part bundle, `.ki-config.toml` compliance) use `ki-repo-harness`.
argument-hint: 'audit <agent-or-dir> | conform <agent> | help | educate <description> | refresh'
---
```

### Well-formed operating modes

Every governance skill carries the universal AUDIT, CONFORM, EDUCATE, REFRESH, and HELP behaviour. Put them under `## Operating modes`, with a `### Mode <NAME>` heading for each non-generated mode (or an equivalent permitted table). HELP is generated from the skill metadata: `help`, `-h`, `?`, or no mode explains the skill and stops; an interactive no-mode invocation may offer a mode choice. A mode definition opens with a one-sentence statement of what it does, then lists numbered concrete steps. Steps invoke the repository-root checker first so the model runs the linter before reading — never re-derive what the script checks. Judgment criteria are applied only after the checker output is captured. The rubric file is referenced by relative link from the step that applies it, not re-stated in-line.

```markdown
## Operating modes

HELP explains this skill's purpose, invocation, modes, and off-ramps without taking action.

### Mode AUDIT — review an existing agent

Review an agent (or every agent in a directory) against the rubric and report.

1. **Run the host.** From the repository root, run `ki repo audit --skill ki-subagents`. It reports mechanical findings with `FAIL`, `WARN`, `INFO`, `NOT_APPLICABLE`, and `PASS`, and exits non-zero on any FAIL. Capture its output verbatim — do not re-derive what it found.
2. **Read the agent definition** and apply the **judgment** ([J]-tagged) criteria from [the rubric](references/rubric.md) — the linter owns the [M] ones.
3. **Report** findings by location → criterion → fix; lead with FAIL findings.
```

### Well-formed mode definition (EDUCATE)

EDUCATE is one of the universal four. It teaches or creates the governed artifact from the standard; it does not restore a per-skill runner. A skill-specific mode (e.g. an operational note-op, or OPTIMISE) follows the same definition shape, sitting alongside the four, named and alphabetical in the body. A mode definition states what kind of artifact it produces, the inputs it needs, what it reads before writing, and the output format. Do not name a skill-specific mode AUDIT, CONFORM, EDUCATE, or REFRESH — those are reserved for the universal four.

```markdown
### Mode EDUCATE — write a new agent definition

Create a well-formed agent definition from a plain-English description of the agent's role.

1. **Gather inputs.** If the description is missing a lane boundary (what it defers), ask for it — the own-vs-defer line is the most important judgment call and cannot be inferred from a role alone.
2. **Read [the Agent Skills standard](standards-agent-skills.md)** before writing — do not generate frontmatter from memory.
3. **Draft the frontmatter** (`name`, `description`, optional `model` / `tools`) then the system prompt (role declaration, grounding statement, own-vs-defer boundary, operating notes).
4. **Run the host** from the repository root: `ki repo audit --skill ki-subagents`. Fix any FAIL findings before delivering.
5. Return the complete `.md` file content, annotated with the reasoning for any non-obvious choices.
```

### Correct cross-skill composition declaration

When selecting one skill necessarily selects and executes another first, the dependent declares that prerequisite in `ki-depends-on`. The host resolves the graph and runs prerequisites before dependents. Array order has no semantic meaning. The skill body explains the prerequisite's contribution and the dependent's delta without importing the sibling's source.

Coverage-selected governance is different: if two independently declared standards merely apply to the same repository, neither declares the other as a dependency. Off-ramps and shared-module dependencies are also separate contracts.

```yaml
---
name: ki-repo-website-cloudflare
ki-depends-on: [ki-repo-website]
---
```

Here `ki-repo-website` is a prerequisite because the hosting capability consumes the neutral site's built output. The independently selected content or app implementation produces that output; Cloudflare does not depend on either implementation. `ki-engineering` may also govern the repository, but coverage selects it separately.
