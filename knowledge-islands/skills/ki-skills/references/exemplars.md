# Skill Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated illustrations of well-formed `SKILL.md` files. Use these when writing a new skill, checking an existing one against the rubric, or explaining what a good skill looks like. The exemplars are drawn from the `ki-*` governance skills in this repo — the reference implementation set for the Agent Skills standard — and annotated to surface the conventions rather than the subject matter. Each pattern isolates one concern so it can be studied on its own.

## Collections

| Source                               | Covers                                                                   | Last reviewed |
| ------------------------------------ | ------------------------------------------------------------------------ | ------------- |
| [Agent Skills specification][spec]   | Frontmatter fields, hard caps, layout                                    | 2026-06-21    |
| [Agent Skills best practices][bp]    | Description writing, progressive disclosure, scripts, authoring rubric   | 2026-06-21    |
| [Claude Code — skills docs][cc]      | CC-only frontmatter fields including `argument-hint`, `allowed-tools`    | 2026-06-21    |
| [Skill Authoring Patterns][patterns] | Terminology discipline, feedback loops, gotchas sections                 | 2026-06-21    |
| `ki-agents` SKILL.md †               | Reference implementation: full frontmatter + skill-specific EDUCATE mode | 2026-06-21    |
| `ki-repo` SKILL.md ‡                 | Reference implementation: argument-hint, standard-skill mode structure   | 2026-06-21    |

† Located at `skills/general-governance/ki-agents/SKILL.md` in the harness.

‡ Located at `skills/keystone/ki-repo/SKILL.md` in the harness.

[spec]: https://agentskills.io/specification
[bp]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
[cc]: https://code.claude.com/docs/en/skills
[patterns]: https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics

## Selected patterns

### Well-formed frontmatter block

The frontmatter of `ki-agents` shows all required fields plus the two most important CC-only extensions. `name` is all-lowercase with hyphens, matches the directory name exactly, and carries no generic words like `helper` or `utils`. `description` is written in the third person ("Audit, review, and write…" — never "Can audit…"), names concrete trigger phrases, and ends with off-ramp declarations so the skill does not silently absorb adjacent work. `argument-hint` lists the discrete modes a user can pass at the `/` prompt; the standard-skill modes (`audit`, `conform`, `refresh`) come last after any skill-specific modes, in alphabetical order.

```yaml
---
name: ki-agents
description: >
  Audit, review, and write Claude Code subagent definitions against current best practice. Use when creating a new agent (subagent), reviewing or critiquing an agent's definition, checking an agent before it ships, asking "is this agent any good / well-scoped", or refreshing the agents rubric. Carries a checkable rubric — mechanical checks a bundled linter runs, judgment checks applied by reading — covering the name and description (the delegation signal), the system-prompt shape (role/lane, grounding, when-invoked, own-vs-defer), least-privilege tools and model choice, and cross-agent lane collisions. Triggers: "audit this agent", "review my subagent", "write a new agent", "is this agent definition good", "scaffold an agent", "refresh the agents rubric", "check the agents". Judges a subagent definition (frontmatter + system prompt) — for authoring a SKILL.md use the `ki-skills` skill instead; for harness-level layout (five-part bundle, `.ki-config.toml` compliance) use `ki-harness`.
argument-hint: 'audit <agent-or-dir> | conform <agent> | educate <description> | refresh'
---
```

### Well-formed standard mode definition (AUDIT)

Every governance skill carries the universal four — AUDIT, CONFORM, EDUCATE, REFRESH. The mode definition opens with a one-sentence statement of what the mode does, then lists numbered concrete steps. Steps name the mechanical tool first (`bun scripts/…`) so the model runs the linter before reading — never re-derive what the script checks. Judgment criteria are applied only after the linter output is captured. The rubric file is referenced by relative link from the step that applies it, not re-stated in-line.

```markdown
## Mode AUDIT — review an existing agent

Review an agent (or every agent in a directory) against the rubric and report.

1. **Run the linter.** `bun scripts/audit.ts <path-to-agent-or-dir>` from this skill's directory. It reports the mechanical criteria on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / NA / PASS) and exits non-zero on any FAIL. Capture its output verbatim — do not re-derive what it found.
2. **Read the agent definition** and apply the **judgment** ([J]-tagged) criteria from [the rubric](references/audit-rubric.md) — the linter owns the [M] ones.
3. **Report** findings by location → criterion → fix; lead with FAIL findings.
```

### Well-formed mode definition (EDUCATE)

EDUCATE is one of the universal four (its mechanical half a per-skill `scripts/educate.ts` that scaffolds a new artifact — or brings an off-standard one onto the floor from scratch); a skill-specific mode (e.g. an operational note-op, or OPTIMISE) follows the same definition shape, sitting alongside the four, named and alphabetical in the body. A mode definition states what kind of artifact it produces, the inputs it needs, what it reads before writing, and the output format. Do not name a skill-specific mode AUDIT, CONFORM, EDUCATE, or REFRESH — those are reserved for the universal four.

```markdown
## Mode EDUCATE — write a new agent definition

Create a well-formed agent definition from a plain-English description of the agent's role.

1. **Gather inputs.** If the description is missing a lane boundary (what it defers), ask for it — the own-vs-defer line is the most important judgment call and cannot be inferred from a role alone.
2. **Read [the standard](references/agent-definitions-standard.md)** before writing — do not generate frontmatter from memory.
3. **Draft the frontmatter** (`name`, `description`, optional `model` / `tools`) then the system prompt (role declaration, grounding statement, own-vs-defer boundary, operating notes).
4. **Run the linter** on the draft: `bun scripts/audit.ts <draft-path>`. Fix any FAIL findings before delivering.
5. Return the complete `.md` file content, annotated with the reasoning for any non-obvious choices.
```

### Correct cross-skill composition declaration

When a skill runs a sibling's checker in sequence, it declares the edge explicitly rather than inheriting by coupling. The declaration appears in the mode step that calls the sibling, names the sibling by its `name` (never a file path), and explains what the sibling contributes and what this skill adds on top. This is the **composition-only** principle: each skill is valid standalone; the composition is in the calling skill's prose, not a shared base.

```markdown
## Mode AUDIT — audit the harness bundle

1. **Run the engineering checker first.** Invoke the `ki-engineering` skill in AUDIT mode against this repo — it checks the toolchain, `tsconfig`, and Biome config. Capture its findings; do not re-derive them here.
2. **Run the skills linter.** `bun run ki:skills:audit` from the harness root — it audits every SKILL.md in `skills/` against the mechanical criteria. Capture its output verbatim.
3. **Apply harness-specific judgment** — five-part bundle completeness, `.ki-config.toml` table presence for each populated part, and cross-skill consistency (no two skills claiming the same domain). The engineering and skills passes are the delta this skill adds over the siblings it called.
```
