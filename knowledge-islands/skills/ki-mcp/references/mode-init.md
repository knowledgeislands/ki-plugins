# Mode INIT — scaffold a new MCP server

_On-demand procedure for mcp's INIT mode. The canonical shape, surface-area model, tool naming, access-level gate, and layer boundaries live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. **Copy from the closest healthy sibling** over inventing: take the shared `utils/` helpers, `tsconfig*.json`, `vitest.config.ts`, `biome.json`, and the package.json script block verbatim, then adapt the `<app>` prefix, env-var prefix (`MCP_<APP>_*`), `SERVER_NAME`, and `exports` map.
2. Keep the layer boundaries from day one: schema+envelope in `tools/`, logic in `main/` (config slice first), printing only in `cli/`, wiring only in `mcp-server/`. Add tools with explicit `annotations` presets.
3. **Wire the typed client.** Register the new repo in `ki-agentic-harness/scripts/generate-clients.ts`, set the `<server-name>` in the repo's `ki:generate:client` script to a registered mcporter instance (`mcporter list`), then run `bun run ki:generate:client` to emit the initial `src/generated/client.ts`. Commit the generated file.
4. Run the checker + tests; `bun run test` (NOT `bun test`), `bun run ki:lint:check`, `bun run ki:lint:types` must pass with 100% coverage.
