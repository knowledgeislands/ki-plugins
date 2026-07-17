# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and community sources behind the [Workspace MCP Standard](workspace-mcp-standard.md) and [Audit Rubric](audit-rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + [`scripts/audit.ts`](../scripts/audit.ts), then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

Two layers feed the standard: the **official MCP specification** (what every conformant server must do) and the **in-house workspace convention** (the opinionated shape the six sibling repos share on top of the spec). A finding is only "spec-driven" if it traces to the Authoritative table; everything else is house style and should be labelled as such so it is not mistaken for a protocol requirement.

## Authoritative (official MCP spec)

The spec is versioned by date. Track the **latest released** version and note the current one here.

| Tag       | Source                                 | Governs | Last reviewed |
| --------- | -------------------------------------- | ------- | ------------- |
| SPEC      | [MCP spec — versioning / latest][spec] | ※       | 2026-07-04    |
| CHANGELOG | [2025-11-25 changelog][changelog]      | †       | 2026-07-04    |
| TOOLS     | [Server → Tools][tools]                | ‡       | 2026-06-21    |
| SEC       | [Security Best Practices][sec]         | §       | 2026-06-21    |
| AUTH      | [Authorization][auth]                  | ¶       | 2026-06-21    |

† What changed since 2025-06-18 (tasks, tool-calling in sampling, OIDC discovery, icons, validation-error clarification).

‡ Tool shape, `inputSchema`/`outputSchema`, `structuredContent`, annotations, `isError` vs protocol errors, tool-name charset/length, `icons`, `execution.taskSupport`.

§ Confused deputy, token passthrough, SSRF, session hijacking, scope minimization, local-server compromise.

¶ OAuth 2.1 framework, token audience, PKCE, dynamic client registration — relevant to the gmail / m365 auth-servers.

※ Which dated revision is current (latest released: **2025-11-25**).

## Community

| Tag       | Source                                                        | Governs | Last reviewed |
| --------- | ------------------------------------------------------------- | ------- | ------------- |
| COMMUNITY | [Tool Annotations as Risk Vocabulary (MCP blog)][annotations] | †       | 2026-06-21    |
| COMMUNITY | [NSA/CISA — MCP security CSI][csi]                            | ‡       | 2026-06-21    |

† What the `*Hint` annotations can and can't do — anchors the annotation-driven gate.

‡ External restatement of MCP server hardening (least privilege, allowlists, logging).

## In-house (the workspace convention)

The standard is defined as the **majority shape** across the six sibling repos under `knowledgeislands/`. These are the living source of truth for house style; when they diverge from each other, the majority wins and the outlier is a finding unless documented.

| Tag    | Source                      | Governs                                                       | Last reviewed |
| ------ | --------------------------- | ------------------------------------------------------------- | ------------- |
| REPOS  | The six sibling repos †     | Layout, config, tool naming, shared `utils/`, the toolchain ‡ | 2026-06-21    |
| CLAUDE | Each repo's own `CLAUDE.md` | Per-repo invariants ※                                         | 2026-06-21    |

† `mcp-git-audit`, `mcp-ki-kb-fs`, `mcp-gsuite`, `mcp-m365`, `mcp-claude-housekeeping`, `mcp-ki-kb-notion-mirror`.

‡ Layout, config injection, tool naming, the shared `utils/` helpers, the package/tsconfig/vitest/biome toolchain.

※ The per-repo statement of its own invariants — the standard tracks these and flags drift.

## Last review

REFRESH last run **2026-07-04**. Pinned spec revision: **2025-11-25** (latest released); **2026-07-28** is still a Release Candidate (locked 2026-05-21, final publication targeted 2026-07-28 — not yet shipped as of this review, ~24 days out).

**Confirmed current** — the live spec index (SPEC) still names **2025-11-25** as the authoritative dated revision, and the 2026-07-28 changelog (CHANGELOG) confirms RC-not-final status. Nothing the standard depends on (annotation-driven gate hints + untrusted-hint warning; isError Tool Execution Errors vs protocol errors; tool names 1–128 chars `[A-Za-z0-9_.-]`; `outputSchema`/`structuredContent` pairing; JSON Schema 2020-12 default; `taskSupport`/`icons`/`title` metadata; §13 auth scoped to roles no stdio repo occupies) has moved. **No change to standard §1–13, the rubric, or audit.ts.** TOOLS/SEC/AUTH and the Community/In-house rows were not re-fetched this pass (fixed dated artifacts, verbatim-confirmed 2026-06-21); their `last reviewed` cells are unchanged. Only SPEC and CHANGELOG were re-verified live and bumped to 2026-07-04.

**New this pass** — beta SDKs for the 2026-07-28 RC are now published (Python v2, TypeScript, Go, C#), with Python v2 stable targeted 2026-07-27 alongside the spec. The final spec publication is imminent, so the staged §12–13 + §4 re-anchor below should be executed at the **first REFRESH after 2026-07-28**.

**Open watch-items:**

- **Re-anchor §12–13 + §4 once 2026-07-28 is RELEASED (imminent):** stateless core (initialize/initialized handshake removed per SEP-2575, `Mcp-Session-Id` removed per SEP-2567), Roots/Sampling/Logging deprecation (SEP-2577), Multi Round-Trip Requests replacing server-initiated sampling/elicitation (SEP-2322), Tasks as an official extension (SEP-2663), the 12-month deprecation-lifecycle policy (SEP-2596); for auth repos, RFC 9207 `iss` + DCR `application_type`. Nothing breaks on 2026-07-28 for current stdio servers — it is a text-publication date, not a switch-off — but the standard's spec-facing sections should be re-diffed then.
- Rate-limiting is a spec MUST kept lower-priority for local stdio servers (revisit if one goes remote).
- No repo yet declares `outputSchema` for structured output.
- Five proposed annotation SEPs (`unsafeOutputHint`, `secretHint`, `trustedHint`, trust/sensitivity, governance/UX) still Draft — gate's four-hint vocabulary stable, no action; watch for any landing in a released spec.

(What past reviews changed in the standard / checklist / `audit.ts` — structured output, the OAuth security invariants, tool-name charset bounds, output sanitization, the relaxed tool-name regex — is in git.)

[spec]: https://modelcontextprotocol.io/specification
[changelog]: https://modelcontextprotocol.io/specification/2025-11-25/changelog
[tools]: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
[sec]: https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
[auth]: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
[annotations]: https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/
[csi]: https://www.nsa.gov/Portals/75/documents/Cybersecurity/CSI_MCP_SECURITY.pdf
