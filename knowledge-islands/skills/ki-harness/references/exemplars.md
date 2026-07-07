# Harness Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns from the KI agentic harness that show what a well-structured four-part bundle looks like. Use these as reference when standing up a new harness, auditing an existing one, or checking that a shelf is correctly declared. The `ki-agentic-harness` is the canonical reference implementation; it demonstrates every structural requirement: four directories each with a `README.md`, the required `package.json` script families, and a `.ki-config.toml` that opts into all four governing skills. Empty shelves (`agents/`, `mcp/`, `evals/`) are shown as a valid starting state — the directory and its `README.md` commit the four-part intent before all parts are built. For the full source list and last-review dates, see [sources.md](sources.md).

## Collections

| Source | URL | What it covers |
| --- | --- | --- |
| ki-agentic-harness | [canonical harness repo][harness-repo] | The KI canonical reference; all four parts; populated skills shelf |
| Agent Skills specification | [Agent Skills spec][as-spec] | The `SKILL.md` format and `references/`, `scripts/`, `assets/` layout |
| Claude Code subagent docs | [CC subagent docs][cc-subagents] | The subagent definition format the `agents/` part serves |

## Selected patterns

### Four-part directory layout

Every harness must have these four directories at the repo root, each containing a `README.md`. The `README.md` distinguishes an intentional empty shelf from an accidentally missing directory — a navigator (human or agent) can confirm at a glance that the harness is complete even before all shelves are populated. The harness root also carries `CLAUDE.md`, `ROADMAP.md`, `package.json`, and `.ki-config.toml`.

```text
skills/
  README.md
  ki-kb-base/
    SKILL.md
    references/
    scripts/
  ki-engineering/
    SKILL.md
    references/
    scripts/
  …
agents/
  README.md          ← shelf: no agent definitions yet
mcp/
  README.md          ← shelf: points to external mcp-* repos
evals/
  README.md          ← shelf: advisory, run on demand
```

### `agents/README.md` shelf convention

An empty `agents/` shelf declares the intent, explains the format for future contributors, and routes to the governing skill. It does not apologise for being empty — a shelf is a valid, encouraged starting state. The pattern below is the `ki-agentic-harness` shelf: format pointer, one-line note on current state, and a forward pointer for when the shelf becomes populated.

```markdown
# Agents

Claude Code subagent definitions — one `.md` file per agent.

Each file is a subagent definition: YAML frontmatter (`name`, `description`, `tools`, `model`) followed by the system-prompt body. See the [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents) and the `ki-agents` skill for KI conventions (grounding, own-vs-defer, KB wikilinks).

_No agent definitions yet — this is an empty shelf. Add a `.md` per agent when the first agent is ready._
```

### Required `package.json` scripts for a harness

The two harness-specific scripts (`ki:skills:link:project` and `ki:skills:lint`) are the delivery and quality mechanisms the harness concept depends on — absence of either is a FAIL. `ki:skills:link:global` installs the one globally-kept keystone (`ki-bootstrap`); skills themselves are wired project-local, not global. The `ki:lint:*` family is the common engineering toolchain. The `--all` flag on `ki:skills:link:project` tells the bootstrap linker to wire every skill declared in `.ki-config.toml` rather than a named subset.

```jsonc
{
  "scripts": {
    "ki:skills:link:project": "bun skills/ki-bootstrap/scripts/link-skills.ts --all",
    "ki:skills:link:global": "bun scripts/sync-skills.ts link --only ki-bootstrap",
    "ki:skills:lint": "bun skills/ki-skills/scripts/lint-skills.ts skills",
    "ki:lint:check": "bunx @biomejs/biome check",
    "ki:lint:types": "tsc --noEmit",
    "ki:lint:md": "bunx prettier --write \"**/*.md\" --ignore-path .gitignore && bunx markdownlint-cli2",
    "ki:lint:md:check": "bunx prettier --check \"**/*.md\" --ignore-path .gitignore && bunx markdownlint-cli2"
  }
}
```

### `.ki-config.toml` bundle declaration

A harness must declare `[ki-harness]` — this is the compliance marker the `ki-repo` coverage cascade uses to confirm the four-part layout is intentional. Without it, detecting `skills/*/SKILL.md` without a `[ki-skills]` table, or detecting the harness layout without `[ki-harness]`, would WARN as a detected-but-undeclared artifact. The canonical `ki-agentic-harness` pattern: all four tables present, no per-harness config keys (table presence alone is the declaration).

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
