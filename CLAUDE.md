# CLAUDE.md — ki-plugins

**This repo is generated. Do not hand-edit `.claude-plugin/` or `knowledge-islands/`.**

`ki-plugins` is the Knowledge Islands Claude plugin marketplace — the Cowork-surface projection of the [ki-agentic-harness](https://github.com/knowledgeislands/ki-agentic-harness). The harness is the single source of truth; this marketplace is a lossy, per-surface projection (`ADR-KI-HARNESS-005`). Its `skills/` and `agents/` are produced by the harness's generator.

## To change plugin content

Edit the source in the harness (`skills/`, `agents/governance/`), then regenerate:

```bash
# from a ki-agentic-harness checkout
bun run ki:binding:build-plugin /path/to/ki-plugins
git -C /path/to/ki-plugins add -A && git -C /path/to/ki-plugins commit -m "regen: <what changed in the harness>"
```

## Scope

Skills + agents only (v1). MCP servers are deferred — host-local, they don't run in Cowork's gVisor sandbox. Enablement (registering this marketplace, toggling the plugin) is done by the harness's `ki-binding` skill, not by hand.
