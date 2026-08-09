# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and community sources behind the [Workspace MCP Standard](standards-mcp-servers.md) and [Audit Rubric](rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard, rubric, and [`scripts/rubric/items/index.ts`](../scripts/rubric/items/index.ts), then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from—keep it current.

Two layers feed the standard: the **official MCP specification** (what every conformant server must do) and the **in-house workspace convention** (the opinionated shape the six sibling repos share on top of the spec). A finding is only "spec-driven" if it traces to the Authoritative table; everything else is house style and should be labelled as such so it is not mistaken for a protocol requirement.

## Authoritative (official MCP spec)

The spec is versioned by date. Track the **latest released** version and note the current one here.

| Tag       | Source                                 | Governs | Last reviewed |
| --------- | -------------------------------------- | ------- | ------------- |
| SPEC      | [MCP spec — versioning / latest][spec] | ※       | 2026-07-29    |
| CHANGELOG | [2026-07-28 changelog][changelog]      | †       | 2026-07-29    |
| SDK       | [TypeScript SDK releases][sdk]         | ※       | 2026-07-30    |
| TOOLS     | [Server → Tools][tools]                | ‡       | 2026-06-21    |
| SEC       | [Security Best Practices][sec]         | §       | 2026-06-21    |
| AUTH      | [Authorization][auth]                  | ¶       | 2026-06-21    |

† What changed since 2025-11-25 (stateless core, `server/discover`, required `resultType`, Multi Round-Trip Requests, tasks moved to an extension, transport-session and SSE-resumability removals).

‡ Tool shape, `inputSchema`/`outputSchema`, `structuredContent`, annotations, `isError` vs protocol errors, tool-name charset/length, `icons`, `execution.taskSupport`.

§ Confused deputy, token passthrough, SSRF, session hijacking, scope minimization, local-server compromise.

¶ OAuth 2.1 framework, token audience, PKCE, dynamic client registration — relevant to the gmail / m365 auth-servers.

※ Which dated revision is current and whether a released SDK supports it. The six sibling repositories remain on the 1.x package and therefore still deliver 2025-11-25 while their v2 migration is planned.

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

† `mcp-git-audit`, `mcp-ki-repo-kb-fs`, `mcp-gsuite`, `mcp-m365`, `mcp-claude-housekeeping`, `mcp-ki-repo-kb-notion-mirror`.

‡ Layout, config injection, tool naming, the shared `utils/` helpers, the package/tsconfig/vitest/biome toolchain.

※ The per-repo statement of its own invariants — the standard tracks these and flags drift.

## Last review

REFRESH last ran **2026-07-29**. SDK availability was rechecked on **2026-07-30**. Latest released spec revision: **2026-07-28** (published 2026-07-28, confirmed live). The TypeScript SDK's released v2 package family supports that revision; the six sibling repositories remain on the 1.x package and therefore still deliver 2025-11-25 pending a governed migration decision.

**The staged re-anchor fired.** The live spec index (SPEC) now names **2026-07-28** as `(latest)`, so the watch-item carried since 2026-07-04 is resolved and retired. The RC shipped on its target date.

**Confirmed changed** — the 2026-07-28 changelog (CHANGELOG) lands the staged set and more: MCP becomes stateless (the `initialize` / `notifications/initialized` handshake removed, SEP-2575); protocol sessions and `Mcp-Session-Id` removed from Streamable HTTP (SEP-2567); a new `server/discover` RPC that servers **MUST** implement to advertise protocol versions, capabilities, and identity; **every result now carries a required `resultType`** (`"complete"`, or `"input_required"` for Multi Round-Trip interim results, SEP-2322), which replaces server-initiated `roots/list` / `sampling/createMessage` / `elicitation/create`; `ping`, `logging/setLevel`, and `notifications/roots/list_changed` removed; Tasks moved out of core into an official extension (SEP-2663); SSE resumability and message redelivery removed; an `extensions` field on client and server capabilities; and cacheable list/read results.

**Why the standard does not re-anchor §12–13 to it yet** — the TypeScript SDK now ships v2 packages with 2026-07-28 support, including explicit migration guidance from `@modelcontextprotocol/sdk` v1.x. The six sibling repositories still declare `@modelcontextprotocol/sdk` 1.x and serve stdio through the legacy entry point. The new standard is therefore available but not yet selected: re-anchoring before a pilot proves the v2 migration would make the existing fleet fail without a delivery path. The active GOV-006 item owns that rollout decision; the source list records the evidence, not a false upstream block.

TOOLS/SEC/AUTH and the Community/In-house rows were not re-fetched this pass (fixed dated artifacts, verbatim-confirmed 2026-06-21); their `last reviewed` cells are unchanged. SPEC and CHANGELOG remain current from 2026-07-29; the SDK release surface was verified on 2026-07-30.

**Open watch-items:**

- **Re-anchor §12–13 + §4 to 2026-07-28 through a v2 migration pilot.** SDK support is available; select the rollout profile before making the new protocol requirements universal. The required `resultType` touches each repo's shared `jsonResult` / `errorResult` envelope helpers, and `server/discover` changes the stdio entry point. For the auth repos, assess RFC 9207 `iss` + DCR `application_type` under the selected profile.
- Rate-limiting is a spec MUST kept lower-priority for local stdio servers (revisit if one goes remote).
- **Structured output is now partly adopted, unevenly.** `mcp-git-audit`, `mcp-gsuite`, `mcp-m365`, `mcp-ki-repo-kb-notion-mirror`, and `mcp-claude-housekeeping` declare `outputSchema`; **`mcp-ki-repo-kb-fs` declares none while its shared `jsonResult` emits `structuredContent` for every tool**, which is the WARN condition in §12. (Supersedes the retired "no repo yet declares `outputSchema`" item.)
- Five proposed annotation SEPs (`unsafeOutputHint`, `secretHint`, `trustedHint`, trust/sensitivity, governance/UX) still Draft — gate's four-hint vocabulary stable, no action; watch for any landing in a released spec.

(What past reviews changed in the standard / checklist / native rubric — structured output, the OAuth security invariants, tool-name charset bounds, output sanitization, the relaxed tool-name regex — is in git.)

[spec]: https://modelcontextprotocol.io/specification
[changelog]: https://modelcontextprotocol.io/specification/2026-07-28/changelog
[sdk]: https://github.com/modelcontextprotocol/typescript-sdk/releases
[tools]: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
[sec]: https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
[auth]: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
[annotations]: https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/
[csi]: https://www.nsa.gov/Portals/75/documents/Cybersecurity/CSI_MCP_SECURITY.pdf
