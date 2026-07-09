# Workspace MCP Standard

The canonical shape shared by every stdio MCP server in the `knowledgeislands/` workspace: `mcp-git-audit`, `mcp-ki-kb-fs`, `mcp-gsuite`, `mcp-m365`, `mcp-claude-housekeeping`, `mcp-kb-notion-mirror`. This is the reference the `ki-mcp` skill codifies and audits against. Where repos disagree, the majority shape is the standard; documented per-repo exceptions are noted inline.

## Contents

1. [Project layout](#1-project-layout)
2. [Config injection](#2-config-injection)
3. [Tool naming](#3-tool-naming)
4. [Access-level gate (annotation-driven)](#4-access-level-gate-annotation-driven)
5. [Audit logging](#5-audit-logging)
6. [Security invariants](#6-security-invariants)
7. [Bun vs Node](#7-bun-vs-node)
8. [package.json](#8-packagejson)
9. [tsconfig / vitest / biome](#9-tsconfig--vitest--biome)
10. [.env.example & env vars](#10-envexample--env-vars)
11. [Docs](#11-docs)
12. [Spec conformance: tool results, errors & metadata](#12-spec-conformance-tool-results-errors--metadata)
13. [OAuth security (auth-server repos)](#13-oauth-security-auth-server-repos)

> **Spec vs house style.** Sections 1–11 are the in-house **workspace convention**; §12–13 trace directly to the official MCP specification (latest released: **2025-11-25**; draft targeting 2026-07-28 in validation) tracked in [the source list](sources.md). When citing a rule, know which layer it comes from — never present a workspace preference as a protocol "MUST". Mode REFRESH in the [SKILL](../SKILL.md) re-anchors §12–13 (and the annotation semantics in §4) to the current spec.

## 1. Project layout

```text
src/
├── config/index.ts        # loadConfig(env?) → Config; types/constants re-export
├── mcp-server/index.ts     # stdio wrapper (entry point) — coverage-excluded
├── tools/<group>/index.ts  # MCP tool definitions — coverage-excluded, no logic
├── main/<concern>/         # real implementation, library-usable; index.ts re-export per concern
├── cli/                    # OPTIONAL: cli.ts (bin, all printing) + index.ts (re-export)
└── utils/                  # cross-MCP helpers, kept in sync across siblings
```

Top-level `src/` folders are identical across all six repos: `config`, `main`, `mcp-server`, `tools`, `utils`, plus `cli` where a human-runnable command exists, and per-domain extras (`auth-server` in gmail/m365; `types.ts`).

### Layer responsibilities

- **`config/`** — the only place env is read. `loadConfig(env?) → Config`. No module-level config singleton; nothing reads env at import time.
- **`mcp-server/`** — wiring only: `loadConfig()` once, build the `AuditConfig` slice, `server.registerTool = makeAccessGatedRegister(...)`, then `registerXxxTools(server, config)` per group. Then connect a `StdioServerTransport` and log readiness on **stderr**.
- **`tools/`** — thin shells. Validate args with a `.strict()` zod schema, call a `main/` function (passing the needed config slice), map the result or thrown error to an MCP envelope via `jsonResult` / `errorResult`. `tools/**/index.ts` is coverage-excluded — **never put logic here**.
- **`main/`** — the real implementation, grouped by concern, mirroring the tool groups. Each concern dir has an `index.ts` re-export. Every entry point that touches FS/network/config takes its config (or the specific slice — `safeRoots`, `rootPath`, `NotionConfig`, …) as its **first argument**. No `console.*` here (return data; let the tool/CLI present it). Reusable concerns are surfaced via the package `exports` map.
- **`cli/`** (optional) — `cli.ts` is the `#!/usr/bin/env node` bin: it loads `.env` itself (Node parity with Bun), parses args, dispatches to the **same** `main/` functions the tools use, and does **all** human-readable printing. `cli/index.ts` re-exports the `main/` library surface. The CLI verb surface mirrors the MCP tool surface (same resource/verb structure). `cli.ts` is coverage-excluded; the `main/` functions it calls are not.
- **`utils/`** — cross-MCP helpers that take the **specific primitive** they need, not the whole `Config`. Common files kept in sync across siblings: `access-level.ts`, `annotations.ts`, `audit-log.ts`, and per-repo `paths`/ `results`/`errors`. Domain-specific utils (`git-exec.ts`, `mime.ts`, `html-sanitizer.ts`, `odata-helpers.ts`, `protected.ts`, `atomic-write.ts`) live here too but are not shared.

## 2. Config injection

- `loadConfig(env = process.env): Config` hydrates `process.env` from the package's `.env*` files via `process.loadEnvFile()` inside a try/catch (Bun has no such API and throws `TypeError`, which the catch swallows; Bun auto-loads `.env*` itself), then parses env into a plain, immutable `Config`. Resolve each file from the module's own location (`import.meta.url`), **not** `process.cwd()` — the compiled server is launched as `node /abs/path/dist/…` from an arbitrary cwd, so a `./`-relative path silently misses. Load highest precedence first — `.env.local`, then `.env.${NODE_ENV}` (when `NODE_ENV` is set), then `.env`; `loadEnvFile` never overwrites an already-set var, so the launcher's environment always wins over a file.
- **No module-level singleton.** Nothing reads `process.env` at import time outside `config/index.ts`. `main/` and `utils/` receive config as their first argument; tests build a literal `Config` and pass it (never mutate env, never call `loadConfig()` in a test — critical for repos that walk real user dirs).
- Universal exports from `config/index.ts`:
  - `type AccessLevel = 'read' | 'write' | 'destructive'`
  - `const ACCESS_LEVELS = ['read','write','destructive'] as const`
  - `const ACCESS_LEVEL_RANK = { read:1, write:2, destructive:3 }`
  - `type AuditLogMode = 'off' | 'writes' | 'all'`
  - `loadConfig`, plus parse helpers (`parseAccessLevel`, `parseAuditLogMode`, `parseNonNegativeInt`).
- `Config` always includes `accessLevel`, `auditLogMode`, `auditLogPath`, `auditLogMaxBytes` (default 10 MiB), `auditLogKeep` (default 5), plus domain fields (`safeRoots`, `rootPath`, `auth`, …).
- **Divergence:** gmail/m365 export `SERVER_NAME`/`SERVER_VERSION` from `config/index.ts`; others hard-code the name in `mcp-server` or `audit-log.ts`.

## 3. Tool naming

`<app>_<resource>_<action>`, snake_case.

| Repo                    | `<app>` prefix(es)                        |
| ----------------------- | ----------------------------------------- |
| mcp-git-audit           | `git`                                     |
| mcp-ki-kb-fs            | `kb`                                      |
| mcp-gsuite              | `gsuite`                                  |
| mcp-m365                | `m365`                                    |
| mcp-claude-housekeeping | `claude_code`, `claude_desktop`, `vscode` |
| mcp-kb-notion-mirror    | `notion_mirror`                           |

- **Plural** resource for collection ops (`git_repos_scan`, `gsuite_email_messages_search`, `kb_notes_list`).
- **Singular** for single-item ops (`kb_note_read`, `git_repo_commit`, `gsuite_email_message_get`).
- Metadata/lifecycle tools may drop the resource segment (`m365_about`, `gsuite_auth_start`).
- The CLI verb surface mirrors the tool names.

The house scheme is a deliberate **subset** of what the spec permits: per [TOOLS](sources.md), names SHOULD be 1–128 chars from `[A-Za-z0-9_.-]`. Snake*case `<app>*<resource>\_<action>` stays well inside that, so a conformant house name is always a conformant spec name — the constraint to enforce is the house scheme, not the looser spec one.

## 4. Access-level gate (annotation-driven)

`utils/access-level.ts` exports `makeAccessGatedRegister(server, accessLevel, audit)`. At registration it derives a level from each tool's `annotations` and registers the tool only if that level ≤ `config.accessLevel`:

- `readOnlyHint: true` → **read**
- `destructiveHint: true` → **destructive**
- explicit `readOnlyHint: false` AND `destructiveHint: false` → **write**
- anything else → **destructive** (fail-safe)

These four hints (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) and their semantics are defined by the spec ([TOOLS](sources.md)) and have been stable since revision 2025-03-26 (confirmed current through 2025-11-25): `destructiveHint`/`idempotentHint` are only meaningful when `readOnlyHint` is false. The gate reads them as a risk vocabulary, exactly as the spec intends — the presets in `utils/annotations.ts` set `idempotentHint` (the `_IDEMPOTENT` variants) and `openWorldHint` (the `_REMOTE` variants) too, even though the gate keys only on read/destructive. The spec also warns clients to treat a server's annotations as **untrusted** — which is why the gate is the operator-controlled `MCP_<APP>_ACCESS_LEVEL`, not anything self-asserted at call time.

Levels nest `read ⊂ write ⊂ destructive`; env `MCP_<APP>_ACCESS_LEVEL` (default `read`). Every tool sets `annotations` to a preset from `utils/annotations.ts`: `READ_ONLY`, `WRITE`, `WRITE_IDEMPOTENT`, `WRITE_IDEMPOTENT_REMOTE`, `DESTRUCTIVE`, `DESTRUCTIVE_REMOTE`, `DESTRUCTIVE_ONESHOT`, plus `_REMOTE`/read variants per repo. `DESTRUCTIVE_ONESHOT` = effect depends on current FS/index state. Never bypass the register proxy; never derive the level from the tool name.

**Divergence:** default access level is `read` everywhere except `mcp-kb-notion-mirror`, which defaults to `write` (it ships no read-only tools) — intentional, do not flag.

## 5. Audit logging

`utils/audit-log.ts` exports the `AuditConfig` slice (`{ mode, path, maxBytes, keep }`), an `AuditEvent` shape, `appendAuditEvent(audit, event)`, and `withAuditLog(audit, name, level, cb)`. `mcp-server` wires it through the gated register. Append-only JSONL with size-based rotation (`maxBytes` × `keep`). **Secrets never appear in the log** — tokens/PATs/Bearer values are redacted; only ids, arg shapes, and status/scope/expiry are recorded. The tool boundary returns errors via `errorResult` (not `throw`) so the audit wrapper sees the `isError` envelope.

## 6. Security invariants

1. **Path containment is two-layer.** Every user path goes through a lexical normalize (rejects `..`, Windows separators) **and** a realpath check of the deepest existing ancestor against the allowed root(s) (catches symlink escape), before any `fs.*` / `execFile` / URL call. Validate against the **full** set of roots, threaded in as the first arg of the `main/` function.
2. **Cached results are re-validated.** A tool that consumes a prior tool's output (e.g. a scan envelope) re-checks every path against the live config before acting — a cached result cannot widen the security boundary.
3. **Shell-out uses `execFile` with an argv array, never a shell string.** For git: `execFile('git', ['--no-optional-locks', '-C', repo, ...args], opts)` — `--no-optional-locks` is mandatory.
4. **Subprocess calls are time- and memory-bounded.** Local commands use a short timeout (~8s), network commands a longer one (~60s); both capped by `maxBuffer`. Network git sets `GIT_TERMINAL_PROMPT=0` so auth prompts fail fast instead of hanging. Never spawn an unbounded subprocess.
5. **Directory walks are depth-limited** and prune hidden dirs + `node_modules`.
6. **Identifier inputs that become argv/path tokens have tightened regex schemas** (remote/branch names, URLs, uuids, workspace/project/session ids): reject leading `-` (option injection), `..`, and path separators. Bare `z.string().min(1)` is not acceptable.
7. **Destructive / non-idempotent tools expose `dry_run`, default `true`**, and only mutate when explicitly `false`. Pass native `--dry-run` through where git offers it; approximate otherwise.
8. **Risky multi-state flags are enums, not booleans** (e.g. force-push: `force_mode: 'none' | 'with_lease' | 'force'`).
9. **All zod schemas are `.strict()` with bounded numerics** (`.int().max(N)`, array/string length caps).
10. **Per-item failures don't crash a batch** — aggregate into an `errors[]`.
11. **Errors and audit logs never leak secrets or absolute paths** — surface caller input relative to the root; 401s hint at the `*_auth_start` remedy.

## 7. Bun vs Node

The Bun-install / Node-run split, the **`bun test` trap**, the `process.loadEnvFile()` parity call, and `NODE_ENV`-only-in-dev are the **common engineering standard**, owned by `ki-engineering` (its [engineering-standard.md](../../ki-engineering/references/engineering-standard.md) §3). Run `ki:engineering:audit` for this layer — it is not re-checked here. The MCP-specific consequence: `ki:server:mcp:dev` / `:inspect` set `NODE_ENV=development`, so production ignores `.env.*` and config must come from the client's `env` block.

## 8. package.json

`type` / `packageManager` / `engines` / `files`, the `ki:lint:*` / `ki:deps:*` / `build` / `clean` / `test*` / `prepare` script families, and the `build`/cli-chmod rule are the **common engineering standard** (`ki-engineering`) — copy them from a healthy sibling and let `ki:engineering:audit` check them; not re-checked here. This section is the **MCP delta** on top:

- **`main` / `bin`** — `"main": "dist/mcp-server/index.js"`; `"bin": { "mcp-<name>": "dist/mcp-server/index.js" }`, plus a second entry for a CLI (`"mcp-<name>-<verb>": "dist/cli/cli.js"`) or auth server (`"mcp-<name>-auth"`) where present.
- **`exports`** — always `"."` (→ `dist/mcp-server`), `"./config"`, and `"./package.json"`; plus one entry per reusable `main/<concern>`.
- **`ki:server:mcp:*` scripts** — `ki:server:mcp:dev` / `ki:server:mcp:inspect` (both `NODE_ENV=development bun …`) / `ki:server:mcp:start` (`bun run build && node dist/mcp-server/index.js`); OAuth repos with an `src/auth-server/` add the `ki:server:auth:*` pair (`ki:server:auth:dev` / `ki:server:auth:start`), and a repo with a CLI/smoke harness adds `ki:test:smoke`.
- **`ki:test:record` / `ki:test:replay` (record/replay harness).** A repo with mcporter integration recordings ships the pair together — `ki:test:record` captures a live run into `fixtures/recordings/`, `ki:test:replay` runs against the committed fixture. Defining one without the other is drift (asserted by `audit-mcp.ts`).
- **CI — the smoke delta.** The common CI shape (`jdx/mise-action` + `bun run ki:lint:check` / `ki:lint:types` / `ki:lint:md:check` / `test:coverage`) is `ki-engineering`'s, asserted by `audit-engineering.ts`. An MCP repo with a smoke harness **appends `bun run ki:test:smoke`** to `.github/workflows/ci.yml` after those steps — the MCP delta on the CI shape, asserted here by `audit-mcp.ts`.
- **Typed client — `ki:generate:client` script.** Every repo ships a `ki:generate:client` script that emits a typed TypeScript client via `mcporter emit-ts <server-name> --mode client --out src/generated/client.ts --types-out src/generated/types.d.ts`. The emitted `src/generated/client.ts` is committed (it is the deliverable, not build output); it is excluded from vitest coverage. **Re-run `bun run ki:generate:client` after any tool surface change** — adding, removing, or renaming a tool, or changing its input schema or return shape — otherwise callers compile against a stale contract. The `<server-name>` must match a registered mcporter instance (`mcporter list`). When adding a new server to the workspace, also register it in `ki-agentic-harness/scripts/generate-clients.ts` so that `bun run ki:codegen` from the harness root regenerates all repos at once.

## 9. tsconfig / vitest / biome

`tsconfig.json` (the shared compiled-TS base), `tsconfig.build.json`, `biome.json`, and `vitest.config.ts` with **100% coverage on all four metrics** are the **common engineering standard** (`ki-engineering` §4–§7); not re-checked here. The **MCP delta** is only the vitest coverage `exclude` list — beyond the common `src/**/*.test.ts`, an MCP excludes its pure-wiring layers: `src/mcp-server/index.ts`, `src/tools/**/index.ts`, `src/utils/annotations.ts`, plus `src/auth-server/**`, `src/cli/cli.ts`, and pure-data modules (`src/utils/notion-args.ts`) where present.

## 10. .env.example & env vars

The committed `.env*.example` template (real `.env.*` gitignored) and the `process.loadEnvFile` parity call are the **common engineering standard** (`ki-engineering` §8). The **MCP delta** is the variable prefix + shared block:

- Prefix `MCP_<SCREAMING_SNAKE_APPNAME>_*`. Shared block across all repos: `MCP_<APP>_ACCESS_LEVEL` (default `read`), `MCP_<APP>_AUDIT_LOG` (default `writes`), `MCP_<APP>_AUDIT_LOG_PATH` (default `~/.local/state/mcp-<name>/audit.jsonl`), `MCP_<APP>_AUDIT_LOG_MAX_BYTES` (10485760), `MCP_<APP>_AUDIT_LOG_KEEP` (5), plus domain vars (`*_SAFE_ROOTS`, `*_ROOT`, OAuth client id/secret, PAT, …).

## 11. Docs

**Presence** of `README.md`, `CLAUDE.md`, and `ROADMAP.md` is `ki-repo`'s layer (the first two universal/FAIL, `ROADMAP.md` a warn); this section owns their **MCP content contract**, plus the three MCP-family root docs whose presence is the **MCP delta**:

- **`README.md`** — user-facing: tool catalog (purpose + I/O shape per tool), install/config, client setup, dev commands.
- **`CLAUDE.md`** — architecture invariants, security requirements, and what an agent needs beyond the README. Must stay in sync with the code: a `CLAUDE.md` describing a layer that has since been renamed/moved (e.g. an `orchestrator/` section after the move to `cli/` + `main/`) is a finding.
- **`ROADMAP.md`** — planned features / deprecations.
- **`CONTRIBUTING.md`** — setup, dev loop, conventions (code / commits / testing), pre-PR checklist. _(MCP delta: presence required.)_
- **`SECURITY.md`** — vulnerability reporting, scope (in / out), supported versions (OAuth repos add a token-storage note). _(MCP delta: presence required.)_
- **`CHANGELOG.md`** — release notes; present **and non-empty** (an empty stub at 1.0.0 is a finding). _(MCP delta.)_

## 12. Spec conformance: tool results, errors & metadata

These trace to the MCP spec ([TOOLS](sources.md) + [CHANGELOG](sources.md), 2025-11-25). They are how the thin `tools/` layer must shape what it returns.

- **Errors are Tool Execution Errors, not protocol errors.** The spec (clarified 2025-11-25) requires input-validation failures, API failures, and business-logic errors to be returned in the result envelope with `isError: true` so the model can self-correct — only malformed requests / unknown tools are JSON-RPC protocol errors. This is exactly why the house rule is **`errorResult` (return), never `throw`** at the tool boundary: a thrown zod/validation error would surface as a protocol error and also bypass the `withAuditLog` wrapper, which keys on the `isError` envelope. Confirm `errorResult` produces `{ content, isError: true }`.
- **Structured output is `outputSchema` + `structuredContent`, paired** (spec 2025-11-25). A tool that returns machine-shaped data **SHOULD** declare an `outputSchema` (JSON Schema 2020-12) on registration and return the matching object in `structuredContent`, **and** (for backwards-compat with older clients) the same JSON serialized in a text content block. The cleanest path is to derive both from the same zod result schema via `zod-to-json-schema` so schema and output cannot drift. A tool that returns `structuredContent` without a declared `outputSchema`, or that uses `jsonResult` (returning JSON) without having adopted `structuredContent` at all, is a **WARN** finding. Plain text-only results need neither.
- **Deterministic `tools/list` ordering.** Tools **SHOULD** be registered in a stable, predictable order within each tool-group file (e.g. alphabetical by tool name, or by natural CRUD order). Deterministic ordering improves prompt-cache hit rates for clients that hash the tool list. Randomised or nondeterministic registration order is a **WARN** finding.
- **`inputSchema` dialect.** The spec defaults schemas to JSON Schema 2020-12. zod-to-json-schema output is accepted by Claude; no action needed unless a client rejects the emitted dialect — then set an explicit `$schema`.
- **Optional metadata** (`icons`, `title`, `execution.taskSupport`) is available as of 2025-11-25 but not part of the house standard; adopt per-repo only if a client surfaces it. Async **Tasks** (`execution.taskSupport`) are experimental and irrelevant to these short-lived stdio tools — do not flag their absence.

## 13. OAuth security (auth-server repos)

Only the OAuth repos — **mcp-gsuite** and **mcp-m365** — have an `auth-server/` and a token store; these items do not apply to the filesystem/subprocess repos. They trace to the spec's [SEC](sources.md) and [AUTH](sources.md) pages. The §6 invariants still apply on top of these.

**Two roles, only one of them ours — items 1–6 apply, 7–8 don't (yet).** Items 1–6 govern these repos' actual role: an OAuth **client** of a third-party IdP (Google / Microsoft) running the loopback consent flow and holding the resulting downstream tokens. Items 7–8 come from the **MCP authorization framework**, which governs a server that is itself a **remote HTTP OAuth resource server** (and the authorization server fronting it). **No current workspace server occupies that role** — all are stdio servers that obtain their own tokens — so 7–8 are **N/A today**; they go live only if a server is deployed remotely. When citing 7–8, say which role you mean.

1. **No token passthrough.** The server uses tokens it obtained for _itself_ against the downstream API (Google / Microsoft Graph); it must never accept a caller- supplied token and forward it. (Spec: "MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server.")
2. **Authorization-code flow with PKCE and a single-use `state`.** The loopback OAuth flow generates a cryptographically random `state`, stores it server-side until the callback, validates an **exact** match, and expires/deletes it after one use. Reject a callback with missing or mismatched `state`.
3. **Exact `redirect_uri` match** — loopback redirect compared by exact string, not prefix/wildcard.
4. **Least-privilege scopes.** Request only the scopes the shipped tools need; do not pre-request a broad catalog. Scope creep is a finding.
5. **SSRF discipline on any fetched URL.** Discovery/token/Graph endpoints are HTTPS and host-pinned to the known provider; never fetch an attacker-influenceable URL, and never follow redirects to internal/loopback/link-local addresses (`169.254.169.254`, `10/172.16/192.168`, `::1`).
6. **Secure token storage & redaction.** Refresh/access tokens are stored with restrictive file permissions outside any served root, never logged, and redacted from the audit log and from error messages (already required by §6.11). A 401 hints at the `*_auth_start` remedy without echoing the token.
7. **RFC 8707 `resource` parameter + audience validation — _remote resource-server role only; N/A to current repos_.** Per the 2025-11-25 spec (AUTH): when an MCP **client** obtains a token to call a **remote** MCP server, it MUST include a `resource` parameter naming that server's canonical URI; the authorization server SHOULD bind it into the token's `aud`; and the server, **acting as an OAuth resource server**, MUST validate `aud` before accepting the token — rejecting any whose audience isn't itself (a token-passthrough defense, item #1). This governs the MCP authorization framework, not a third-party OAuth-client flow: the current stdio servers are not resource servers, and their IdPs (Google / Microsoft v2) scope tokens by **scope**, not RFC 8707 `resource` — so there is nothing to implement here today. The live protection for our servers is item #1 (no token passthrough).
8. **Client ID Metadata Documents (SHOULD) — _authorization-server role only; N/A to current repos_.** Per the 2025-11-25 spec (AUTH): an **authorization server** SHOULD declare `client_id_metadata_document_supported: true` and accept URL-formatted `client_id` values — fetch the JSON document at that URL over HTTPS, validate its `client_id` matches the URL exactly, validate the request's `redirect_uri` against its `redirect_uris`, with SSRF mitigations on the fetch (item #5). It is the preferred client-registration path, superseding Dynamic Client Registration. Our servers are OAuth **clients**, not authorization servers — the AS is Google / Microsoft — so they cannot declare CIMD and this does not apply; it goes live only for a workspace component that itself acts as an MCP authorization server.
