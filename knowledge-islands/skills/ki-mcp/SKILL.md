---
name: ki-mcp
implies: []
description: >
  Codify and audit Knowledge Islands MCP servers against the canonical "workspace MCP" standard. Use when scaffolding a new MCP server, bringing an existing one up to standard, or reviewing one for compliance: project layout, config injection (no module-level singleton), the `<app>_<resource>_<action>` tool-naming scheme, the annotation-driven access-level gate, audit logging, the security invariants, the common build/lint/test toolchain (now `ki-engineering`'s, which this builds on). Also refreshes the standard itself against the latest published MCP specification. Triggers: "audit this MCP", "does this MCP follow our standards", "scaffold a new MCP", "bring this MCP up to standard", "review the MCP layout / tool surface / package.json", "refresh the MCP standard", "is our MCP standard up to date". Operates on the sibling `mcp-*` repos under `knowledgeislands/`. Audits MCP **server code** — not a repo's GitHub configuration, nor a `SKILL.md`'s prose (for that, use `ki-skills`).
argument-hint: 'audit <repo> | conform <repo> | init <repo> | refresh'
---

# Knowledge Islands MCP standards

You are helping audit, conform, or scaffold a **workspace MCP server** — one of the stdio MCP servers in the `knowledgeislands/` workspace (`mcp-git-audit`, `mcp-ki-kb-fs`, `mcp-gsuite`, `mcp-m365`, `mcp-claude-housekeeping`, `mcp-kb-notion-mirror`). They all share one canonical shape, so a new one should be scaffolded to it and an existing one should be auditable against it. This skill carries that standard and the audit procedure.

This skill audits the **server code** — `src/` layout, config injection, tool surface, security invariants, tooling. A repo's GitHub configuration and standard files, and a `SKILL.md`'s prose, are out of scope (other skills own those). How the skills divide the work is documented once in the ki-agentic-harness `README.md`.

The full, quotable standard lives in [Workspace MCP Standard](references/workspace-mcp-standard.md); the line-by-line pass/fail items live in [Audit Rubric](references/audit-rubric.md). A mechanical structural checker is [`scripts/audit-mcp.ts`](scripts/audit-mcp.ts). Read those when you need detail; this file is the operating procedure.

## The canonical shape at a glance

```text
src/
├── config/index.ts   # loadConfig(env?) → Config. NO module-level singleton; nothing reads env at import time.
├── mcp-server/index.ts# stdio entry: loadConfig() once, makeAccessGatedRegister, registerXxxTools(server, config). Coverage-excluded.
├── tools/<group>/index.ts # thin: zod-validate args → call main/, map to MCP envelope (jsonResult/errorResult). Coverage-excluded. NO logic.
├── main/<concern>/    # the real implementation, usable from a script. Each entry takes its config slice as the FIRST arg.
├── cli/               # OPTIONAL human-runnable bin: cli.ts does ALL stdout printing; index.ts re-exports main. Mirrors the tool surface. cli.ts coverage-excluded.
└── utils/             # cross-MCP helpers kept in sync across siblings: access-level.ts, annotations.ts, audit-log.ts, paths/results, …
```

Three rules define the layer boundaries — most audit findings are a violation of one:

1. **Config is injected, never ambient.** `loadConfig()` is called exactly once (in `mcp-server/index.ts`, or by a `cli.ts` / a script). No other module reads `process.env` at import time; every `main/` and `utils/` function takes the config (or the specific slice it needs) as its **first argument**.
2. **Layers have one job each.** `tools/` validates + envelopes and nothing more; `main/` holds the logic and is runnable without the MCP server; `cli/` only prints (the library it calls never writes to stdout); `mcp-server/` only wires.
3. **The access-level gate is annotation-driven, not name-driven.** A tool registers only if the level derived from its `annotations` is ≤ `config.accessLevel`. See the gate rules below.

## Surface-area model: main vs tools vs cli

Decide _where code lives_ by who needs to call it, not by what it does:

- **`main/`** — the implementation, callable from anywhere. _May contain:_ all real logic, FS / network / git, returns plain data. _Must not:_ print to stdout/stderr or read env directly.
- **`tools/`** — exposes `main/` over MCP. _May contain:_ zod schema, arg validation, `jsonResult` / `errorResult`. _Must not:_ hold logic or be the only caller of `main/`.
- **`cli/`** — exposes `main/` to a human at a terminal. _May contain:_ arg parsing and ALL human-readable printing. _Must not:_ hold logic or be the only caller of `main/`.

`main/` is the single source of truth; `tools/` and `cli/` are two thin shells over the **same** functions. If logic exists only inside a tool handler or only inside the CLI, that is a finding — push it down into `main/`. Group `main/` by **concern**, mirroring the tool groups (`main/repo-audit/`, `main/notes/`, …), each with an `index.ts` re-export, and surface the reusable ones through the package `exports` map so the code is consumable as a library.

## Tool naming

`<app>_<resource>_<action>`, snake_case. `<app>` is fixed per repo (`git`, `kb`, `gsuite`, `m365`, `claude_code`/`claude_desktop`/`vscode`, `voicenotes`, `notion_mirror`). **Plural** resource for collection ops (`git_repos_scan`, `gsuite_email_messages_search`); **singular** for single-item ops (`kb_note_read`, `git_repo_commit`). Metadata/lifecycle tools may drop the resource segment (`gsuite_auth_start`, `m365_about`). The CLI verb surface mirrors these names.

## Access-level gate

`makeAccessGatedRegister(server, accessLevel, audit)` in `utils/access-level.ts` derives a level from each tool's `annotations` and registers it only when that level ≤ `config.accessLevel` (env `MCP_<APP>_ACCESS_LEVEL`, default `read`; levels nest `read ⊂ write ⊂ destructive`):

- `readOnlyHint: true` → **read**
- `destructiveHint: true` → **destructive**
- explicit `readOnlyHint: false` AND `destructiveHint: false` → **write**
- anything else (unannotated / partial) → **destructive** (fail-safe)

Every tool MUST set `annotations` to a preset from `utils/annotations.ts` (`READ_ONLY`, `WRITE`, `WRITE_IDEMPOTENT`, `DESTRUCTIVE`, `DESTRUCTIVE_ONESHOT`, and the `_REMOTE` variants). `DESTRUCTIVE_ONESHOT` is for tools whose end state depends on current FS/index state (running twice ≠ same result). Never bypass the register proxy. The default `read` gate hides every mutation until the operator opts in.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · INIT · REFRESH**; INIT here scaffolds a new server. If invoked without a mode, use `AskUserQuestion` to list each mode with a one-line description; if the chosen mode shows a target in the `argument-hint`, prompt for that too.

### Mode AUDIT

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode CONFORM

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode INIT

→ Read [references/mode-init.md](references/mode-init.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Bun vs Node — the common layer

The Bun-install / Node-run split, the **`bun test` trap**, and the `process.loadEnvFile()` parity call are the **common engineering standard** — `ki-engineering` owns and checks them (run `ki:engineering:audit`). The one MCP-relevant consequence to keep in mind: `NODE_ENV=development` is set only by the `ki:server:mcp:dev` / `:inspect` scripts, so in production `.env.*` is ignored and config must come from the MCP client's `env` block.

## Notes

- This skill targets the standard documented in the sibling repos' own `CLAUDE.md` files; when they disagree, the **majority shape** is the standard and the outlier is a finding (unless the outlier is a deliberate, documented exception). When unsure whether a divergence is intentional, ask rather than "fix" it.
- Keep the shared `utils/` helpers (`access-level.ts`, `annotations.ts`, `audit-log.ts`) in sync across repos — a fix to one usually applies to all.
- The standard sits on top of a moving spec. When citing a requirement, know whether it is **spec-driven** (traces to the official MCP spec in [the source list](references/sources.md)) or **house style** — never present a workspace preference as a protocol "MUST". Run Mode REFRESH when in doubt.
- Full detail: [Workspace MCP Standard](references/workspace-mcp-standard.md), [Audit Rubric](references/audit-rubric.md), and the tracked [source list](references/sources.md).
- **Operating** an MCP surface (not auditing server code) — how MCP connectors added through claude.ai are governed across the web UI, org admin console, and Claude Code's `managed-mcp.json` allow/deny layer — is in [claude-ai-connector-control.md](references/claude-ai-connector-control.md). Out of this skill's code-audit scope, but the natural home for the reference. The sibling [cross-surface-enablement.md](references/cross-surface-enablement.md) records how a single source fans the KI servers, skills, and agents out across Claude Code, Desktop, Cowork, and claude.ai — the per-surface targeting and the per-project binding-skill decision.
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).
