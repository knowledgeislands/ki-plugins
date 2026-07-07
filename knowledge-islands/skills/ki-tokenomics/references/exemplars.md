# Tokenomics Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Concrete patterns showing what good context hygiene looks like in practice: how to declare the tokenomics config table, how to set up Headroom as the compression layer, what good compaction and PreCompact hook wiring looks like, and how the context budget shapes what is loaded vs deferred. The exemplars draw from the standard's normative guidance and from the `ki-arcadia-principal` live config — the reference environment this skill tracks and re-anchors against.

## Collections

| Source | URL | What it covers |
| --- | --- | --- |
| Effective context engineering for AI agents | [anthropic.com][ctx-eng] | The finite-resource framing and high-signal-token principle† |
| Claude Code context window | [code.claude.com][cc-ctxwin] | Startup composition, what survives compaction, tool search |
| Claude Code settings | [code.claude.com][cc-settings] | `autoCompactEnabled`, `DISABLE_AUTO_COMPACT`, compaction config |
| Headroom (chopratejas/headroom) | [github.com][hr] | MCP install, detection signals, `headroom wrap` agent mode |
| Headroom app | [extraheadroom.com][hra] | Menu-bar proxy variant, detection |

† The finite-resource framing and the "smallest set of high-signal tokens" principle.

## Selected patterns

### The `[ki-tokenomics]` config table

A repo opts into tokenomics governance with a `[ki-tokenomics]` table in its `.ki-config.toml`. All keys are optional; `headroom` and `preferred_model` are the most impactful defaults to set. From `ki-arcadia-principal/.ki-config.toml`:

```toml
[ki-tokenomics]
headroom = "recommended"
preferred_model = "sonnet"

[ki-tokenomics.budgets]
mcp_servers = 20   # 19 user-scoped at time of first audit (2026-06-22); revisit when scoped
```

`headroom = "recommended"` sets the expectation that a compression layer is present but does not hard-fail if absent. Use `"required"` in environments where tool-result bloat is a known problem and the absence of Headroom is a genuine defect. `preferred_model = "sonnet"` sets the ambient default tier; individual steps that need more reasoning override it explicitly. The `mcp_servers` budget override here documents an acknowledged overage with a comment explaining why — a budget override without a comment is a WARN.

### Headroom proxy configuration pattern

Headroom is detected by any of three signals. The MCP install (`headroom mcp install`) is the most explicit and is what the checker looks for first:

```json
{
  "mcpServers": {
    "headroom": {
      "command": "headroom",
      "args": ["mcp", "serve"],
      "env": {
        "HEADROOM_OUTPUT_SHAPER": "auto",
        "HEADROOM_OUTPUT_HOLDOUT": "4096"
      }
    }
  }
}
```

Placed in `settings.json` (user-scoped) or `.mcp.json` (project-scoped). The `HEADROOM_OUTPUT_SHAPER` and `HEADROOM_OUTPUT_HOLDOUT` env keys are the documented shaping controls; set them deliberately rather than leaving them at an unexamined default. The checker confirms the server is wired; the correctness of the shaper and holdout values is a judgment item (the upstream config surface is not yet fully documented — see `sources.md` watch-items).

### Compaction and what survives it

Claude Code auto-compacts as the window nears its limit (`autoCompactEnabled` defaults on). What matters for tokenomics: the project-root `CLAUDE.md` is re-read from disk after a compaction, but the skill-description listing is **not** re-injected — only skills already invoked survive. Configure compaction intentionally:

```json
{
  "autoCompactEnabled": true
}
```

To prevent compaction entirely (e.g. during a bounded, audit-only session where full history matters):

```json
{
  "autoCompactEnabled": false
}
```

A PreCompact hook can run a summarisation step before Claude compacts the conversation, preserving useful working state. Wire it in `settings.json`:

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Compacting — summarise key decisions before context rolls'"
          }
        ]
      }
    ]
  }
}
```

The hook runs before the compaction boundary; use it to write a digest to the session or to flag that a manual summary step is needed before the window clears.

### Good context hygiene — load vs defer

The standing surface is paid on every turn. The principle: load the minimum fully-supported set; defer the rest. Applied to each layer:

```text
Always load (universal, small, re-read after compaction):
  - CLAUDE.md + @imports                    ~target ≤ 2,500 tokens
  - MEMORY.md index (first 200 lines / 25KB)  ~target ≤ 1,000 tokens

Always load (auto-loaded by Claude Code):
  - Skill descriptions (names + descriptions, NOT bodies)  ~target ≤ 4,000 tokens total

Load on demand only:
  - Skill bodies (loaded when a skill is invoked, not before)
  - MCP tool schemas (tool search on by default: names load at startup, schemas deferred)
  - KB notes (read when the task needs them, not at session start)

Defer or prune aggressively:
  - Raw tool output / JSON dumps (compress via Headroom or summarise)
  - Large file reads that are not directly in scope for the current step
  - Completed sub-agent outputs that are no longer needed
```

The key signal that hygiene has slipped: a session that starts slow because the standing surface has accreted — `CLAUDE.md` imports that were "just in case", MCP servers wired globally but rarely used in this repo, skill descriptions for skills the project never invokes. The tokenomics audit surfaces these by layer so each one is fixed where it actually lives.

[ctx-eng]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[cc-ctxwin]: https://code.claude.com/docs/en/context-window
[cc-settings]: https://code.claude.com/docs/en/settings
[hr]: https://github.com/chopratejas/headroom
[hra]: https://extraheadroom.com/
