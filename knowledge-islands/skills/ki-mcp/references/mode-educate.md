# Mode EDUCATE — scaffold a new MCP server

_On-demand procedure for mcp's EDUCATE mode. The canonical shape, surface-area model, tool naming, access-level gate, and layer boundaries live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. **Copy from the closest healthy sibling** over inventing: take the shared `utils/` helpers, `tsconfig*.json`, `biome.json`, and aggregate/scoped package.json entrypoints, then adapt the `<app>` prefix, env-var prefix (`MCP_<APP>_*`), `SERVER_NAME`, and `exports` map. Copy `vitest.config.ts` and its scripts only when the new repo selects the Vitest profile.
2. Keep the layer boundaries from day one: schema+envelope in `tools/`, logic in `main/` (config slice first), printing only in `cli/`, wiring only in `mcp-server/`. Add tools with explicit `annotations` presets.
3. **Wire the typed client.** Set the `<server-name>` in the repo's `ki:generate:client` script to a registered mcporter instance (`mcporter list`), then run `bun run ki:generate:client` to emit the initial `src/generated/client.ts`. Commit the generated file.
4. Run the checker and `bun run test` (NOT `bun test`). When the repo carries `vitest.config.*`, its configured 100% coverage gate must also pass.
