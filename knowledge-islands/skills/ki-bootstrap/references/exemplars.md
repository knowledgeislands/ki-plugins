# Bootstrap Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Concrete patterns showing what a correctly bootstrapped Knowledge Islands repo looks like: the `.ki-config.toml` declaration, the `package.json` reproducibility contract, the `CLAUDE.md` import pattern, and the invocation that wires it all together. The bootstrap flow itself is the exemplar — the before/after of a repo acquiring its project-local skill set from a single command.

## Collections

| Source               | URL             | What it covers                                                                 |
| -------------------- | --------------- | ------------------------------------------------------------------------------ |
| ki-arcadia-principal | No public URL ※ | Live `.ki-config.toml`, `package.json` script, and post-link `.claude/skills/` |
| ki-agentic-harness   | No public URL ※ | Links only its own declared coverage, same as any other repo †                 |

† The harness is the authoring hub but is not a special case here: a structural skill (`ki-mcp`, `ki-website`, …) is exercised against a repo of its own type, not loaded in the harness itself, so it links what governs it, not the whole fleet.

※ KI repos are the primary exemplars; they have no public URL.

## Selected patterns

### Correct `.ki-config.toml` bootstrap declaration

A repo opts skills in by adding `[ki-<skill>]` tables. The keystone linker reads these tables and mirrors the matching skills from the harness into each declared runtime's project-local skills dir — `.claude/skills/` for Claude Code (the running example below), `.agents/skills/` for Codex, per `[ki-repo] target_runtimes`. Tables with no keys (bare `[ki-kb]`) are valid — presence alone is the opt-in signal. From `ki-arcadia-principal/.ki-config.toml`:

```toml
# Read by the ki-kb skill.
# Presence opts this base into the kb standard; canonical zone names, no aliases.
[ki-kb]

# Read by the ki-kb-streams skill.
# Presence opts the Streams zone into the Enactment Process; uses the defaults.
[ki-kb-streams]

# Tokenomics governance — audits the standing context surface.
[ki-tokenomics]
headroom = "recommended"
preferred_model = "sonnet"

[ki-tokenomics.budgets]
mcp_servers = 20   # acknowledged overage; documented here for auditability
```

Every repo declares its own foundations (`[ki-repo]` + `[ki-authoring]`) as `[ki-*]` tables like any other coverage — there is no injected baseline, so the linker resolves purely from the declared set.

### The `ki:skills:link:project` invocation

The reproducibility contract requires a `ki:skills:link:project` script in `package.json`. Running it once after a fresh clone re-wires `.claude/skills/` from `.ki-config.toml` without any hard-coded paths:

```json
{
  "scripts": {
    "ki:skills:link:project": "bun $HOME/.claude/skills/ki-bootstrap/scripts/link-skills.ts"
  }
}
```

Running it:

```bash
bun run ki:skills:link:project
```

The keystone linker self-locates the harness through its own real path — no harness location is hard-coded in the script. The harness uses the identical invocation, unmodified: it links only the skills its own `.ki-config.toml` declares, same as any other repo.

### Before and after bootstrapping

**Before** — a repo with a `.ki-config.toml` that has never been linked:

```text
.claude/
└── (no skills/ directory)
```

**After** `bun run ki:skills:link:project` — `.claude/skills/` contains relative symlinks for every declared skill plus the baseline:

```text
.claude/
└── skills/
    ├── ki-authoring  -> ../../../ki-agentic-harness/skills/foundations/ki-authoring
    ├── ki-kb         -> ../../../ki-agentic-harness/skills/repo-structure/ki-kb
    ├── ki-repo       -> ../../../ki-agentic-harness/skills/keystone/ki-repo
    ├── ki-kb-streams    -> ../../../ki-agentic-harness/skills/implied-families/ki-kb-streams
    └── ki-tokenomics -> ../../../ki-agentic-harness/skills/environment/ki-tokenomics
```

The `.claude/skills/` directory is gitignored — the committed artifact is the `ki:skills:link:project` script and a `.gitignore` line. The symlinks are regenerated, never committed.

### CLAUDE.md import pattern for skills

A repo's `CLAUDE.md` does not list available skills inline; Claude Code discovers them from `.claude/skills/` automatically. The only authoring convention needed is a one-line pointer to where the conventions live — the global `CLAUDE.md` carries this for all KI sessions:

```markdown
<!-- In ~/.claude/CLAUDE.md or a project CLAUDE.md -->

The authoring conventions for Markdown and TOML live in the `ki-authoring` skill.
```

Skills are referenced by their `name` value (the directory name under `skills/`), never by file path. A project `CLAUDE.md` that needs to invoke a skill explicitly uses the slash-command form:

```markdown
For KB operations in this session, use the `ki-kb` skill.
```
