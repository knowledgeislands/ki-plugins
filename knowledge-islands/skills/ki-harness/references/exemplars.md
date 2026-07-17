# Harness Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns from the KI agentic harness that show what a well-structured five-part bundle looks like. Use these as reference when standing up a new harness, auditing an existing one, or checking that a shelf is correctly declared. The `ki-agentic-harness` is the canonical reference implementation; it demonstrates every structural requirement: five directories each with a `README.md`, the required `package.json` script families, and a `.ki-config.toml` that opts into all four governing skills. Its `skills/`, `agents/`, `evals/`, and `hooks/` shelves are populated while `mcp/` demonstrates a valid empty shelf. Populated contents are examples, not a requirement: any shelf may start empty when its `README.md` declares that state. For the full source list and last-review dates, see [sources.md](sources.md).

## Collections

| Source                     | URL                                    | What it covers                                                        |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| ki-agentic-harness         | [canonical harness repo][harness-repo] | The KI canonical reference; four populated parts and an empty MCP     |
| Agent Skills specification | [Agent Skills spec][as-spec]           | The `SKILL.md` format and `references/`, `scripts/`, `assets/` layout |
| Claude Code subagent docs  | [CC subagent docs][cc-subagents]       | The subagent definition format the `agents/` part serves              |

## Selected patterns

### Five-part directory layout

Every harness must have these five directories at the repo root, each containing a `README.md`. The `README.md` distinguishes an intentional empty shelf from an accidentally missing directory — a navigator (human or agent) can confirm at a glance that the harness is complete even before all shelves are populated. The populated contents below show this repository's current state; other harnesses need not ship the same agents, evals, or hooks. The harness root also carries `CLAUDE.md`, `ROADMAP.md`, `package.json`, and `.ki-config.toml`.

```text
skills/
  README.md
  ki-kb/
    SKILL.md
    references/
    scripts/
  ki-engineering/
    SKILL.md
    references/
    scripts/
  …
agents/
  README.md
  governance/
    ki-skills-lead.md
mcp/
  README.md          ← intentional empty shelf: points to external mcp-* repos
evals/
  README.md
  guide-suite.ts
  scenarios/
hooks/
  README.md
  plan-stamp.sh
  plan-sync.sh
```

### Shelf status convention

Every part's `README.md` declares its current state and routes contributors to the relevant format or governing skill. A populated shelf indexes what it ships; an empty shelf explains what would live there without apologising for its state. The pattern below is suitable when a harness has not yet added any agent definitions:

```markdown
# Agents

Claude Code subagent definitions — one `.md` file per agent.

Each file is a subagent definition: YAML frontmatter (`name`, `description`, `tools`, `model`) followed by the system-prompt body. See the [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents) and the `ki-agents` skill for KI conventions (grounding, own-vs-defer, KB wikilinks).

_No agent definitions yet — this is an empty shelf. Add a `.md` per agent when the first agent is ready._
```

### Required `package.json` scripts for a harness

The two harness-specific scripts (`ki:skills:link:project` and `ki:skills:audit`) are the delivery and quality mechanisms the harness concept depends on — absence of either is a FAIL. `ki:skills:link:global` installs the one globally-kept keystone (`ki-bootstrap`); skills themselves are wired project-local, not global. The `--all` flag on `ki:skills:link:project` tells the bootstrap linker to wire every skill declared in `.ki-config.toml` rather than a named subset. The aggregate read/write entrypoints and their code/Markdown toolchains are composed from `ki-engineering` and `ki-authoring`, so this harness-specific exemplar does not restate them.

```jsonc
{
  "scripts": {
    "ki:skills:link:project": "bun skills/keystone/ki-bootstrap/scripts/link-skills.ts",
    "ki:skills:link:global": "bun skills/keystone/ki-bootstrap/scripts/sync-skills.ts link --only ki-bootstrap",
    "ki:skills:audit": "bun .ki-meta/skills/ki-skills/audit.ts ."
  }
}
```

### `.ki-config.toml` bundle declaration

A harness must declare `[ki-harness]` — this is the compliance marker the `ki-repo` coverage cascade uses to confirm the five-part layout is intentional. Without it, detecting `skills/*/SKILL.md` without a `[ki-skills]` table, or detecting the harness layout without `[ki-harness]`, would WARN as a detected-but-undeclared artifact. The canonical `ki-agentic-harness` pattern: all four tables present, no per-harness config keys (table presence alone is the declaration).

```toml
[ki-repo]
visibility = "private"

[ki-engineering]
# Fully conforms; no overrides.

[ki-harness]
# Declares this repo as a KI agentic harness.
# No per-harness config keys defined — table presence is the compliance marker.

[ki-skills]
# skills/ is populated; the skills linter runs over it.
```

[harness-repo]: https://github.com/knowledgeislands/ki-agentic-harness
[as-spec]: https://agentskills.io/specification
[cc-subagents]: https://code.claude.com/docs/en/sub-agents
