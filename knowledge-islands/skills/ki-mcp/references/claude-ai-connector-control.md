# Controlling claude.ai MCP connectors

How MCP connectors added through **claude.ai** are governed — the levers, where each one persists, and how they interact with Claude Code. This is the claude.ai leg of the per-surface enablement design in [cross-surface-enablement.md](cross-surface-enablement.md); it settles that record's "manual-only" verdict for this surface.

## The one thing to know first

claude.ai connectors are **installed and managed only in the claude.ai web interface**, at the account or organization level — not from within any chat, and not from a Claude Code session. A conversation can only _enable or disable_ what the account already carries; it cannot add or remove a connector. Claude Code, likewise, cannot install a claude.ai connector — it can only _filter_ which of them it exposes (§5).

So "control" is really four layers at three different persistence scopes.

## The layers

| Layer | Where | Scope | Persists beyond one chat? |
| --- | --- | --- | --- |
| Per-conversation toggles | Composer **+** / `/` → Connectors | This chat only | No |
| Per-tool permission mode | Tool menu (Always allow / Needs approval / Blocked) | Account default | Yes |
| Account connectors | [claude.ai/settings/connectors](https://claude.ai/settings/connectors) | Whole account, all clients | Yes |
| Org admin governance | Admin Console → Policies; Organization settings → Connectors | Every member | Yes |

Only the first row is "just this session." Everything that is actual _control_ — what is installed, what is blocked, what an org may use — lives in persistent state (account UI, admin console, or on-disk config), never in a single conversation.

## 1. Per-conversation — scope the surface per task

Open the tools menu (composer **+**, or `/` → **Connectors**) to toggle which connectors and which individual tools are live for that chat. This is how a crowded connector set is kept from flooding context: enable only what the task needs. Resets each conversation.

Watch the tool-count ceiling — connecting many connectors (≈10+) on one account can make chats fail immediately by exceeding Claude's per-request tool limit.† Keep the enabled set lean at the account level rather than relying on per-chat toggles to rescue an overloaded account.

## 2. Per-tool permission mode — the fatigue-vs-safety dial

Each tool can be set to **Always allow**, **Needs approval**, or **Blocked**. Read-only tools default to auto-run; write tools prompt. This default is account-wide and persists across chats.

## 3. Account connectors — the only install point

[claude.ai/settings/connectors](https://claude.ai/settings/connectors) adds or removes prebuilt (Directory) and custom remote-MCP connectors (a remote MCP server URL, with optional OAuth client ID/secret). A connector enabled here appears across web, Desktop, and mobile for that account.

## 4. Organization / admin — governance for Team & Enterprise

The strong levers are admin-side:

- **Organization settings → Connectors** — an Owner/Primary Owner adds an org connector (Browse → **Add to your team**) or a custom remote MCP URL; members then authenticate individually.
- **Admin Console → Policies** — push MCP allowlists and tool permissions to every member with no MDM. Server-managed settings require a direct connection to `api.anthropic.com` and are **bypassed** when traffic is routed through a gateway via `ANTHROPIC_BASE_URL`.
- **Enterprise-managed auth** — provision connectors centrally through the org's IdP, so members do not authenticate each one by hand (beta, Team/Enterprise).
- **Verified-domain restriction** — Enterprise Owners/Primary Owners can prevent services on their verified domains from being connected to accounts _outside_ the organization.

## 5. How claude.ai connectors surface in Claude Code

This is the leg that matters most for the harness: Claude Code carries its own admin-controlled MCP governance, and claude.ai connectors fall under it. Everything here is written to on-disk managed settings, so it outlives any session and **cannot be overridden by user or project settings**.

### Two distinct mechanisms — provide vs filter

- **`managed-mcp.json` provides servers.** It is the admin's exclusive-control deployment: present ⇒ Claude Code loads _only_ the servers it lists, and every user-added server and claude.ai connector stops loading. `{"mcpServers": {}}` (empty map) is the "disable MCP entirely" switch. It is a standalone file at an OS path only an admin can write, delivered by MDM/Jamf/GPO/Intune:

  | Platform    | Path                                                       |
  | ----------- | ---------------------------------------------------------- |
  | macOS       | `/Library/Application Support/ClaudeCode/managed-mcp.json` |
  | Linux / WSL | `/etc/claude-code/managed-mcp.json`                        |
  | Windows     | `C:\Program Files\ClaudeCode\managed-mcp.json`             |

  Its shape is the same `mcpServers` map as a project `.mcp.json` (`http`/`sse` with `url`, or `stdio` with `command`/`args`/`env`). Any user on the machine can read it, so **never put credentials in `env`** — use `${VAR}` expansion, OAuth/per-user headers, or `headersHelper`.

- **`allowedMcpServers` / `deniedMcpServers` filter** whatever was already configured (by a user, a plugin, or `managed-mcp.json`). They are **not a registry** — a server must already exist to be evaluated.

### Evaluation order (per server, before it loads)

Merge both lists from every settings source, then: (1) **denylist wins** — a match by `serverUrl`, `serverCommand`, or `serverName` is blocked and nothing overrides it; (2) **allowlist** — if `allowedMcpServers` is unset anywhere, the server loads; if it is set, the server must match.

Three sharp edges:

- **Unset ≠ empty array.** `allowedMcpServers` unset = all allowed; `[]` = _nothing_ allowed; populated = only matches. Easy footgun.
- **`serverName` is not a security control** — it is the user-assigned label, so a user can name any server `github`. For enforcement use `serverUrl` (supports `*` wildcards; host match is case-insensitive, path case-sensitive) or `serverCommand` (every argument matched exactly, in order). In `allowedMcpServers`, `serverName` is limited to letters, numbers, hyphens, underscores; in `deniedMcpServers` (v2.1.182+) it accepts any string, so a claude.ai connector can be blocked by display name — e.g. `{ "serverName": "claude.ai Slack" }` — but a rename breaks it, so prefer `serverUrl`.
- **`allowManagedMcpServersOnly: true`** makes only the managed allowlist authoritative (user/project allowlists ignored); the **denylist still merges from all sources**, so a user can always block a server for themselves.

### The claude.ai-specific interaction

- **Suppression by default** — deploying `managed-mcp.json` _suppresses claude.ai connectors_, including ones an admin configured for the org in the claude.ai console.
- **`allowAllClaudeAiMcps: true`** (v2.1.149+, admin-controlled tiers only) reloads the claude.ai connectors alongside the managed set. Allow/deny still apply, so specific connectors can still be blocked; it affects _only_ claude.ai connectors — plugin-provided servers stay suppressed.
- **`disableClaudeAiConnectors`** turns claude.ai connectors off entirely.
- **`forceRemoteSettingsRefresh`** makes enforcement fail-closed — Claude Code refuses to start if managed settings cannot be fetched.

This managed-settings surface is precisely what makes claude.ai connectors governable _from the Claude Code side_, independent of the account/org levers in §4.

## Picking a lever

- **Individual, day to day** — per-chat tools menu (§1) + per-tool permission modes (§2).
- **Individual, durable** — prune the account connector set (§3); fewer connectors beats more toggling.
- **Org governance** — admin console allowlist and/or Enterprise-managed auth (§4).
- **Governing how they land in Claude Code** — `allowedMcpServers` / `deniedMcpServers` and the `managed-mcp.json` interaction (§5).

## Sources

- [Use connectors to extend Claude's capabilities](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)
- [Get started with custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
- [Authorize MCP connectors for your entire organization](https://support.claude.com/en/articles/15537633-authorize-mcp-connectors-for-your-entire-organization)
- [Control MCP server access for your organization (Claude Code)](https://code.claude.com/docs/en/managed-mcp)

---

† Reported behaviour, not a documented hard number — treat ≈10 as a caution threshold, not a spec.
