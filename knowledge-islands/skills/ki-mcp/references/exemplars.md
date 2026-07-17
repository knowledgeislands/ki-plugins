# MCP Server Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns worth reading when authoring or auditing a Knowledge Islands MCP server. Use these as concrete references — what a well-formed `package.json` looks like, how the entry point wires up, how to register a server with a client, how to configure coverage. Do not copy them wholesale; adapt to the specific server's tool surface and env-var namespace. For the full standard, see [workspace-mcp-standard.md](workspace-mcp-standard.md); for source provenance, see [sources.md](sources.md).

## Collections

| Source                        | URL                                         | What it covers             |
| ----------------------------- | ------------------------------------------- | -------------------------- |
| MCP spec — Tools (2025-11-25) | [Server → Tools][spec-tools]                | Tool shape ¤               |
| MCP spec — Security           | [Security Best Practices][spec-sec]         | Security hardening ¥       |
| Tool Annotations (MCP blog)   | [Tool Annotations post][annotations]        | Annotation keys ※※         |
| mcp-git-audit (in-house)      | [knowledgeislands/mcp-git-audit][git-audit] | Reference implementation ※ |
| mcp-gsuite (in-house)         | [knowledgeislands/mcp-gsuite][gsuite]       | Auth-server variant ❡      |

※ Layout, config, access-level gate, audit logging, testing.

❡ Dual-bin, OAuth client, `auth-server/` alongside `mcp-server/`.

¤ Tool shape, `inputSchema`, `annotations`, `isError`, `structuredContent`.

¥ Confused deputy, SSRF, scope minimisation, tool annotation semantics.

※※ `*Hint` semantics and the four stable annotation keys.

## Selected patterns

### `package.json` — the MCP delta

The `name`, `bin`, `main`, `exports`, and `files` fields are the MCP-specific contract on top of the engineering baseline. `name` follows the scoped `@knowledgeislands/mcp-<name>` convention. `bin` exposes `mcp-<name>` pointing at the compiled stdio entry point. `exports` exposes the server entry, config, each `main/<concern>` surface, and `./package.json` — nothing from `tools/` (those are internal shells). `files` is `["dist"]` only; source is never published.

```json
{
  "name": "@knowledgeislands/mcp-git-audit",
  "description": "MCP server — git working-tree and upstream repository audit.",
  "version": "1.0.0",
  "bin": { "mcp-git-audit": "dist/mcp-server/index.js" },
  "main": "dist/mcp-server/index.js",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/mcp-server/index.d.ts",
      "import": "./dist/mcp-server/index.js"
    },
    "./config": {
      "types": "./dist/config/index.d.ts",
      "import": "./dist/config/index.js"
    },
    "./repo-audit": {
      "types": "./dist/main/repo-audit/index.d.ts",
      "import": "./dist/main/repo-audit/index.js"
    },
    "./package.json": "./package.json"
  },
  "engines": { "node": ">=22.0.0" }
}
```

An auth-server repo (e.g. `mcp-gsuite`) adds a second `bin` entry: `"mcp-gsuite-auth": "dist/auth-server/index.js"` and an `./auth` export pointing at `dist/main/auth/`.

### stdio entry point — `src/mcp-server/index.ts`

The entry point has one job: load config, create the server, wire the access-gated register, register tool groups, connect over stdio. All startup diagnostics go to **stderr** (stdout is the MCP wire). No logic lives here — logic lives in `main/`. This file is **coverage-excluded** (the standard requires it; coverage tracks `main/` behaviour, not the wiring lines).

```typescript
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadConfig, SERVER_VERSION } from '../config/index.js'
import { registerRepoAuditTools, registerRepoSyncTools } from '../tools/index.js'
import { makeAccessGatedRegister } from '../utils/access-level.js'

const config = loadConfig()

console.error(`mcp-git-audit starting...`)
console.error(`  MCP_GIT_AUDIT_ACCESS_LEVEL=${config.accessLevel}`)

const server = new McpServer({ name: 'mcp-git-audit', version: SERVER_VERSION })
server.registerTool = makeAccessGatedRegister(server, config.accessLevel, {
  mode: config.auditLogMode,
  path: config.auditLogPath,
  maxBytes: config.auditLogMaxBytes,
  keep: config.auditLogKeep
})

registerRepoAuditTools(server, config)
registerRepoSyncTools(server, config)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`mcp-git-audit ready`)
```

### Client registration — `.mcp.json` / `mcpServers` entry

The canonical registration block for Claude Code (`.mcp.json` at the repo root) or Claude Desktop (`mcpServers` in the JSON config). Uses `node` to run the compiled `dist/mcp-server/index.js` — the Bun-install / Node-run split means the published binary runs under the Node that ships with the OS, not a local Bun install. Env vars are the only configuration surface; no flags or subcommands.

```json
{
  "mcpServers": {
    "mcp-git-audit": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-git-audit/dist/mcp-server/index.js"],
      "env": {
        "MCP_GIT_AUDIT_SAFE_ROOTS": "~/dev:~/projects",
        "MCP_GIT_AUDIT_ACCESS_LEVEL": "read"
      }
    }
  }
}
```

The access level defaults to `read` when the env var is absent; set it explicitly so the registration is self-documenting.

### Conditional Vitest coverage config — excluding the server wiring layer

This example applies only when the repository selects the Vitest profile by carrying `vitest.config.*`. Under that profile, coverage is 100 % line/function/branch/statement — but only over `main/` and `utils/` (excluding annotation constants). The entry point, tool-registration shells, and any generated code are explicitly excluded because they contain no testable logic: they are wiring, not behaviour. The environment block neutralises git global/system config so tests are isolated from the developer's real git config.

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    fileParallelism: false,
    env: {
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
      GIT_CONFIG_COUNT: '0'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/generated/**', // typed clients from codegen
        'src/mcp-server/index.ts', // stdio wiring — coverage-excluded
        'src/tools/**/index.ts', // tool registration shells — no logic
        'src/utils/annotations.ts' // pure data constants
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }
    }
  }
})
```

[spec-tools]: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
[spec-sec]: https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
[annotations]: https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/
[git-audit]: https://github.com/knowledgeislands/mcp-git-audit
[gsuite]: https://github.com/knowledgeislands/mcp-gsuite
