# Mode CONFORM — bring an existing MCP repository up to standard

**Precondition:** Run [Mode AUDIT](mode-audit.md) first so every change starts from a known gap list.

_On-demand procedure for ki-repo-mcp's CONFORM mode. Hosted conform is intentionally limited to bounded edits of existing regular configuration files; generated clients and repository commands remain explicit._

1. **Repair semantic gaps deliberately.** Restore the `src/` layer boundaries (schema and envelope in `tools/`, config-first logic in `main/`, printing in `cli/`, wiring in `mcp-server/`), shared `utils/`, and MCP scripts by copying from the closest healthy sibling rather than inventing.
2. **Conform the common engineering layer separately.** Run `ki repo conform --skill ki-engineering --repo <repo-path>` for `tsconfig*`, Biome, package baseline, aggregate entrypoints, and the selected Vitest profile.
3. **Apply bounded MCP repairs.** Run `ki repo conform --skill ki-repo-mcp --repo <repo-path>`. The session may append `[skills.ki-repo-mcp]` to an existing valid regular `.ki-config.toml` and normalise MCP `main`, `bin`, and required `exports` in an existing valid regular `package.json`. Missing, malformed, symlinked, or otherwise unsafe targets remain report-only.
4. **Regenerate clients explicitly.** When the typed client is stale, run `bun run ki:generate:client` yourself. This repository-defined script can execute arbitrary application code and is never a hosted conform action.
5. **Verify external behaviour explicitly.** Run `bun run test` and, when defined, `bun run ki:test:smoke`; then re-run AUDIT. When the repository carries `vitest.config.*`, its configured coverage gate must pass.
