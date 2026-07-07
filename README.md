# ki-plugins

The Knowledge Islands **Claude plugin marketplace** — the Cowork-surface packaging of the [ki-agentic-harness](https://github.com/knowledgeislands/ki-agentic-harness).

This repo is a **generated projection**, not a source. The harness is the single source of truth for the Knowledge Islands skills and agents; this marketplace is a lossy, per-surface projection of it (see `ADR-KI-HARNESS-005`). Its contents are produced by the harness's generator and must never be hand-edited:

```bash
# from a ki-agentic-harness checkout
bun run ki:binding:build-plugin /path/to/ki-plugins
```

## Layout

```text
.claude-plugin/marketplace.json      # marketplace manifest → one plugin: knowledge-islands
knowledge-islands/
  .claude-plugin/plugin.json         # plugin manifest (name, version, description, author)
  skills/                            # the ki-* governance skills (generated, verbatim)
  agents/                            # the governance agents (generated, flattened)
```

## Scope (v1) — skills + agents only

MCP servers are **deferred**. The Knowledge Islands MCP servers are host-local (they read host filesystem paths and resolve secrets via 1Password), and Cowork runs plugins in a gVisor sandbox that cannot reach the host. Skills and agents are plain files and port cleanly; the server half needs sandbox-portability work first (bundle a self-contained server via `${CLAUDE_PLUGIN_ROOT}`, mount the KB, or expose authenticated remote endpoints). Bundled skill `scripts/` ship as files but are not expected to run inside the sandbox.

## Enablement

Registered and toggled per surface by the harness's `ki-binding` skill — it adds this repo under `extraKnownMarketplaces` and sets `"knowledge-islands@ki-plugins": true` in Cowork's `cowork_settings.json`. Do not wire it by hand; run `ki-binding` CONFORM.

## License

Proprietary — see [LICENSE](LICENSE). Public visibility does not grant a license to use, copy, or redistribute.
