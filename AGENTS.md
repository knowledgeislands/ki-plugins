# AGENTS.md — ki-plugins

This repository is the generated Claude plugin marketplace projection of `knowledgeislands/ki-agentic-harness`. The harness is the source of truth for generated content under `.claude-plugin/` and `knowledge-islands/`; do not hand-edit those paths.

## Current posture

This projection is paused. Preserve it in place, but do not refresh its generated payload or develop it as an active distribution surface unless the pause is explicitly lifted.

## Working here

- Change skills, agents, and plugin-generation logic in `ki-agentic-harness`, then regenerate this projection.
- Keep repository governance, marketplace identity, and working-area changes outside the generated payload narrowly scoped.
- Preserve the skills-and-agents-only v1 boundary; MCP servers remain outside the Cowork sandbox projection.
- Use `ki-authoring` for Markdown and TOML conventions, `ki-git` for shared-tree commits, and `ki-repo-plugins` for marketplace structure.

## Verification

```sh
ki repo audit --repo .
jq . .claude-plugin/marketplace.json
jq . knowledge-islands/.claude-plugin/plugin.json
```

For generated payload changes, run the harness generator and verify the resulting diff rather than editing the projection directly.
