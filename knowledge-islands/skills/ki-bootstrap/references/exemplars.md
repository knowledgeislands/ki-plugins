# Bootstrap Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Concrete patterns showing what a correctly bootstrapped Knowledge Islands repo looks like: the `.ki-config.toml` declaration, the `package.json` reproducibility contract, the `CLAUDE.md` import pattern, and the invocation that wires it all together. The bootstrap flow itself is the exemplar — the before/after of a repo acquiring its project-local skill set from a single command.

## Collections

| Source               | URL             | What it covers                                                                 |
| -------------------- | --------------- | ------------------------------------------------------------------------------ |
| ki-arcadia-principal | No public URL ※ | Live `.ki-config.toml`, `package.json` script, and post-link `.claude/skills/` |
| ki-agentic-harness   | No public URL ※ | The `--all` variant used by the authoring hub †                                |

† The harness links all skills (`--all`) rather than a declared subset; it is the exception, not the template. A normal KB or repo declares only the skills it uses.

※ KI repos are the primary exemplars; they have no public URL.

## Selected patterns

### Correct `.ki-config.toml` bootstrap declaration

A repo opts skills in by adding `[ki-<skill>]` tables. The keystone linker reads these tables and mirrors the matching skills from the harness into `.claude/skills/`. Tables with no keys (bare `[ki-kb]`) are valid — presence alone is the opt-in signal. From `ki-arcadia-principal/.ki-config.toml`:

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

The keystone linker also always links the baseline (`ki-repo` + `ki-authoring`) regardless of whether those tables appear — they are cascade-exempt universals.

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

The keystone linker self-locates the harness through its own real path — no harness location is hard-coded in the script. On the harness itself, the invocation adds `--all`:

```json
{
  "scripts": {
    "ki:skills:link:project": "bun $HOME/.claude/skills/ki-bootstrap/scripts/link-skills.ts --all"
  }
}
```

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
    ├── ki-authoring  -> ../../../ki-agentic-harness/skills/ki-authoring
    ├── ki-kb         -> ../../../ki-agentic-harness/skills/ki-kb
    ├── ki-repo       -> ../../../ki-agentic-harness/skills/ki-repo
    ├── ki-kb-streams    -> ../../../ki-agentic-harness/skills/ki-kb-streams
    └── ki-tokenomics -> ../../../ki-agentic-harness/skills/ki-tokenomics
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
