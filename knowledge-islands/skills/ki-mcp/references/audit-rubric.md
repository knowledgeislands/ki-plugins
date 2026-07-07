# Audit Rubric

Line-by-line pass/fail items for auditing a workspace MCP against the [Workspace MCP Standard](workspace-mcp-standard.md). Run [`../scripts/audit-mcp.ts`](../scripts/audit-mcp.ts) for the mechanical items (marked **[M]**), then judge the rest by reading the code.

Severity: **FAIL** (security invariant breach or gate bypass — ship-stopper), **WARN** (layout / naming / tooling divergence), **POLISH** (docs / consistency) — the shared ladder, defined in `ki-engineering`'s [`enforcement-framework.md`](../../ki-engineering/references/enforcement-framework.md) §2.

## Contents

- [Layout & layers](#layout--layers)
- [Config injection](#config-injection)
- [Tool naming & surface](#tool-naming--surface)
- [Access-level gate](#access-level-gate)
- [Audit logging](#audit-logging)
- [Security invariants](#security-invariants)
- [Spec conformance — tool results & metadata](#spec-conformance--tool-results--metadata-standard-12)
- [OAuth security — auth-server repos only](#oauth-security--auth-server-repos-only-mcp-gmail-mcp-m365-standard-13)
- [Bun vs Node](#bun-vs-node)
- [package.json](#packagejson)
- [tsconfig / vitest / biome](#tsconfig--vitest--biome)
- [.env.example & env](#envexample--env)
- [Docs](#docs)
- [Longevity & staleness](#longevity--staleness-mirrors-ki-skills-rubric-long-1)
- [Reporting](#reporting)

## Layout & layers

- [ ] [M] WARN — `src/` has `config/`, `mcp-server/`, `tools/`, `main/`, `utils/`.
- [ ] [M] WARN — `cli/` present ⇒ has both `cli.ts` and `index.ts`.
- [ ] [J] WARN — `tools/<group>/index.ts` is thin: zod-validate → call `main/` → envelope. No FS/network/git/logic in a tool handler.
- [ ] [J] WARN — all real logic lives in `main/`, grouped by concern, each with `index.ts`.
- [ ] [J] FAIL — `main/`/`utils/` have **no `console.*`** (return data; printing is CLI/stderr only). `api`-style layers assert no `console.log` in tests.
- [ ] [J] WARN — `cli.ts` holds only arg-parsing + printing; the library it calls (`main/`) is the single source of truth, shared with `tools/`.
- [ ] [J] WARN — no logic that exists _only_ in a tool handler or _only_ in `cli.ts`.

## Config injection

- [ ] [J] FAIL — `loadConfig(env?)` is the only reader of env; **no module-level config singleton**; no top-level `process.env` access outside `config/index.ts`. (`grep -rn "process.env" src --include=*.ts | grep -v config/`)
- [ ] [J] FAIL — every `main/`/`utils/` entry point takes config (or its slice) as the **first argument**; nothing reaches for ambient state.
- [ ] [M] WARN — `config/index.ts` exports `AccessLevel`, `ACCESS_LEVELS`, `ACCESS_LEVEL_RANK`, `AuditLogMode`, `loadConfig`.
- [ ] [J] WARN — `Config` has `accessLevel`, `auditLogMode`, `auditLogPath`, `auditLogMaxBytes`, `auditLogKeep` + domain fields.
- [ ] [J] WARN — tests build a literal `Config`; none call `loadConfig()` or mutate env.

## Tool naming & surface

- [ ] [M] WARN — every registered tool matches `<app>_<resource>_<action>` with the repo's `<app>` prefix. (`grep -rn registerTool src/tools`)
- [ ] [J] WARN — plural resource for collection ops, singular for single-item ops.
- [ ] [J] POLISH — CLI verbs mirror the tool names/resources.
- [ ] [J] POLISH — README tool catalog lists every registered tool with I/O shape.

## Access-level gate

- [ ] [J] FAIL — `mcp-server` sets `server.registerTool = makeAccessGatedRegister(...)`; nothing registers a tool bypassing the proxy.
- [ ] [J] FAIL — every tool sets `annotations` to a preset from `utils/annotations.ts` (no unannotated/partially-annotated tools).
- [ ] [J] FAIL — destructive & non-idempotent tools default `dry_run: true`, mutate only when explicitly `false`.
- [ ] [J] WARN — default `MCP_<APP>_ACCESS_LEVEL` is `read` (allowed exception: `kb-notion-mirror` defaults to `write` — do not flag).

## Audit logging

- [ ] [M] WARN — `utils/audit-log.ts` exports `AuditConfig`, `appendAuditEvent`, `withAuditLog`.
- [ ] [J] FAIL — no secret (token/PAT/Bearer) is ever written to the audit log or surfaced in an error; only ids/arg-shapes/status.
- [ ] [J] FAIL — tool boundary returns errors via `errorResult` (not `throw`) so the audit wrapper sees the `isError` envelope.

## Security invariants

- [ ] [J] FAIL — every user path runs through the two-layer guard (lexical + realpath) before any `fs.*`/`execFile`/URL call, against the **full** root set.
- [ ] [J] FAIL — cached/prior-result paths are re-validated against live config.
- [ ] [J] FAIL — subprocess via `execFile`(argv), never a shell string; git carries `--no-optional-locks`.
- [ ] [J] FAIL — subprocess calls are timeout- and `maxBuffer`-bounded; network git sets `GIT_TERMINAL_PROMPT=0`. No unbounded spawn.
- [ ] [J] FAIL — directory walks are depth-limited and prune hidden dirs/`node_modules`.
- [ ] [J] FAIL — identifier inputs (names, urls, ids, path segments) use tightened regex schemas rejecting leading `-`, `..`, separators — not bare `z.string()`.
- [ ] [J] FAIL — risky multi-state options are enums, not booleans.
- [ ] [J] WARN — all zod schemas `.strict()` with bounded numerics / length caps.
- [ ] [J] WARN — batch tools aggregate per-item failures into `errors[]` (no crash).
- [ ] [J] WARN — tools sanitize untrusted output before returning it (spec: "Servers MUST sanitize tool outputs"); e.g. m365's `html-sanitizer.ts`. Rate-limiting is a spec MUST but low-priority for local stdio servers — note, don't block.

## Spec conformance — tool results & metadata (standard §12)

- [ ] [J] FAIL — tool boundary returns errors as `isError: true` envelopes via `errorResult`, never `throw` (spec 2025-11-25: validation/API/logic errors are Tool Execution Errors, not protocol errors; a throw also bypasses the audit wrapper). Same item as audit-logging below — verify once.
- [ ] [M] WARN — any tool returning `structuredContent` also declares a matching `outputSchema` at registration (paired, ideally derived from one zod schema via `zod-to-json-schema`). A `jsonResult` emitting `structuredContent` with no declared schema is a WARN finding.
- [ ] [M] WARN — any repo whose tools return structured JSON (via `jsonResult` or otherwise) but has zero `outputSchema` declarations anywhere in `src/tools/` is a WARN finding — structured-output adoption is a house SHOULD (spec 2025-11-25), not optional.
- [ ] [M] WARN — tool registration order within each `tools/<group>/index.ts` is stable and deterministic (e.g. alphabetical by tool name or consistent CRUD order). Nondeterministic ordering hurts prompt-cache hit rates.
- [ ] [J] POLISH — optional spec metadata (`icons`, `title`, `execution.taskSupport`) is per-repo opt-in, not required — do **not** flag its absence.

## OAuth security — auth-server repos only: mcp-gmail, mcp-m365 (standard §13)

Skip this whole section for the filesystem/subprocess repos.

- [ ] [J] FAIL — no token passthrough: server never accepts/forwards a caller-supplied token; it uses tokens issued to itself for the downstream API.
- [ ] [J] FAIL — auth-code flow uses PKCE and a cryptographically random, server-stored, single-use `state` validated by exact match at the callback.
- [ ] [J] FAIL — `redirect_uri` validated by exact string match (loopback), not prefix/wildcard.
- [ ] [J] FAIL — tokens stored with restrictive perms outside any served root; never logged; redacted from audit log + errors.
- [ ] [J] WARN — least-privilege scopes (only what shipped tools need); SSRF discipline on fetched URLs (HTTPS, host-pinned, no redirect to internal/loopback IPs).
- [ ] [J] WARN — _Remote resource-server role only — N/A to today's stdio repos; skip unless a server is deployed as a remote HTTP resource server._ RFC 8707 `resource` parameter bound into the token `aud`, and `aud` validated against the server's canonical URI before a token is accepted. (AUTH 2025-11-25; standard §13 item 7)
- [ ] [J] WARN — _Authorization-server role only — N/A to today's stdio repos; skip unless a workspace component acts as an MCP authorization server._ Client ID Metadata Documents — AS declares `client_id_metadata_document_supported: true` and handles URL-formatted `client_id` (HTTPS fetch, exact `client_id` match, `redirect_uris` validation, SSRF mitigations). (AUTH 2025-11-25, SHOULD; standard §13 item 8)

> **Common toolchain → `ki-engineering`.** The four sections below cover only the **MCP delta**. The generic toolchain — the `ki:lint:*`/`ki:deps:*` families, the `bun test` trap, `tsconfig`/`biome`/`vitest` shape with 100% coverage, the `.env*.example` template, the build/cli-chmod rule — is the common engineering layer; **run `ki:engineering:audit` first** for it. A repo is fully clean only when both audits pass.

## Bun vs Node

- [ ] — the `bun test` trap, `process.loadEnvFile()` parity, and `NODE_ENV`-only-in-dev are the **common engineering layer** (run `ki:engineering:audit`); not re-checked here. MCP consequence: production ignores `.env.*`, so config comes from the client's `env` block.

## package.json

- [ ] [M] WARN — `main:dist/mcp-server/index.js`; `bin.mcp-<name>` → `dist/mcp-server/index.js` (+ CLI/auth bin where applicable).
- [ ] [M] WARN — `exports` has `.`, `./config`, `./package.json` + one per reusable `main/<concern>`.
- [ ] [M] WARN — `ki:server:mcp:dev` / `ki:server:mcp:inspect` / `ki:server:mcp:start` present.
- [ ] [M] FAIL — `ki:generate:client` script present (the mcporter typed-client codegen — required for every MCP).
- [ ] [M] FAIL — where `src/auth-server/` exists, the `ki:server:auth:dev` / `ki:server:auth:start` pair is present (the OAuth delta).
- [ ] [M] WARN — `ki:test:record` and `ki:test:replay` are defined together, or neither (the mcporter record/replay harness).
- [ ] [M] WARN — where the repo has a `ki:test:smoke` harness, `.github/workflows/ci.yml` runs `bun run ki:test:smoke` after the common gate. The common CI shape (mise-action + `ki:lint:check` / `ki:lint:types` / `ki:lint:md:check` / `test:coverage`) is `ki-engineering`'s (`ki:engineering:audit`); the smoke step is the MCP delta.
- [ ] [J] WARN — `src/generated/client.ts` is committed and not stale (the `ki:generate:client` presence itself is `[M]` above). If tools were added/removed/renamed, or their input schema or return shape changed, since the last commit of `src/generated/`, re-run `bun run ki:generate:client` (or `bun run ki:codegen` from the harness root) before shipping. The `<server-name>` argument in the script must match a registered mcporter instance — verify with `mcporter list`.
- [ ] — `type`/`packageManager`/`engines`/`files`, the `ki:lint:*`/`ki:deps:*`/`build`/`clean`/`test*`/`prepare` families, and the build/cli-chmod rule are the **common engineering layer** (`ki:engineering:audit`); not re-checked here.

## tsconfig / vitest / biome

- [ ] [M] WARN — vitest coverage `exclude` covers the MCP wiring layers: `mcp-server/index.ts`, `tools/**/index.ts`, `utils/annotations.ts`, and any printing/pure-data module (`cli/cli.ts`, `auth-server/**`).
- [ ] — `tsconfig.json` / `tsconfig.build.json` / `biome.json` shape and the vitest 100% thresholds are the **common engineering layer** (`ki:engineering:audit`); not re-checked here.

## .env.example & env

- [ ] [M] WARN — `.env.example` uses the `MCP_<APP>_*` prefix and carries the shared access-level + audit-log block.
- [ ] — the committed `.env*.example` template, gitignored real `.env.*`, and the `process.loadEnvFile` parity call are the **common engineering layer** (`ki:engineering:audit`).

## Docs

- [ ] [M] WARN — `ROADMAP.md` present. (roadmap-md)
- [ ] [M] WARN — `CONTRIBUTING.md` and `SECURITY.md` present; `CHANGELOG.md` present **and non-empty** (an empty stub is a finding) — the MCP-family root docs. `README`, `LICENSE`, `.gitignore`, `.editorconfig`, `.ki-config.toml`, and now `CLAUDE.md` (FAIL) are `ki-repo`'s layers, not re-checked here.
- [ ] [J] WARN — `CLAUDE.md` is **not drifted**: every layer/path/concept it names still exists in the code (catch renamed/moved layers).
- [ ] [J] POLISH — README install/config/client-setup steps are current.

## Longevity & staleness (mirrors `ki-skills` rubric LONG-1)

A server installed and left running drifts from the world around it; the audit checks it can't rot silently.

- [ ] [J] WARN — volatile external facts the code depends on (the MCP spec version/date it targets, upstream API/SDK versions, third-party URLs, model IDs) are not scattered hard-coded literals: each is either resolved at runtime or pinned in **one** refreshable place (`config/`, `CLAUDE.md`, or `package.json`) so a bump is a single known edit, not a hunt.
- [ ] [J] POLISH — the repo's `CLAUDE.md`/`README.md` names the spec version it conforms to, so a reviewer can tell at a glance whether it predates a spec move.
- [ ] [J] POLISH — this audit itself is run against a **current** standard: if a finding cites a spec MUST, the skill's Mode REFRESH + [`sources.md`](sources.md) confirm the spec hasn't moved since the standard's `last reviewed` date. Don't green-light a repo against a stale spec.

## Reporting

Produce a findings table grouped by severity, each row: `severity · file:line · what · fix`. Close with: (a) any intentional, documented divergences you chose **not** to flag, and (b) a one-line verdict (compliant / minor drift / blockers).
