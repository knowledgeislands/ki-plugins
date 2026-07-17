# Cross-surface binding standard

The quotable invariant for `ki-binding`: what the single source is, how a server declares which surfaces it targets, and what each surface's config must contain to agree with the source. The **operating rationale** — per-surface controllability, the home decision, the build sequence — is the design record [cross-surface-enablement.md](../../../repo-structure/ki-mcp/references/cross-surface-enablement.md); this file is the mechanical contract the checker enforces against.

## The single source

A plain `mcpServers:` YAML, owned by no one dotfiles manager. Its canonical, tool-neutral home is `$XDG_CONFIG_HOME/ki/mcp-servers.yaml`, defaulting to `~/.config/ki/mcp-servers.yaml` per the [XDG Base Directory spec](https://specifications.freedesktop.org/basedir/latest/). The checker resolves it in order: `--source <path>` → `$KI_MCP_SOURCE` → the canonical path → a legacy chezmoi data path (`$XDG_DATA_HOME/chezmoi/.chezmoidata/mcps.yaml`, defaulting to `~/.local/share/chezmoi/.chezmoidata/mcps.yaml`, kept as a transitional fallback) → project-local `.ki/mcps.yaml` — first that exists wins. `ki-binding` reads this source **directly** and is renderer-neutral: it never requires a particular renderer to be installed. Applying the source to the surfaces is a **renderer's** job — the composition skill `ki-binding-chezmoi` renders it through chezmoi templates + `chezmoi apply`, but any tool that reads the canonical file qualifies. One `mcpServers:` list; each entry is one MCP server:

```yaml
mcpServers:
  - name: kit-mcp-gsuite # unique key; the server's key in every rendered mcpServers map
    clients: [claude-desktop, mcporter] # the surfaces this server targets — the binding field
    command: node
    args: [/abs/path/to/dist/mcp-server/index.js]
    env:
      MCP_GSUITE_ACCESS_LEVEL: read
      SECRET: { op: op://vault/item/field } # 1Password ref, resolved at render time (e.g. chezmoi apply)
```

Two shapes: a **command server** (`command` + `args` + `env`, as above) or a **url server** (`url:` only — an already-running endpoint such as the mcporter proxy). The `clients` field is the one this skill governs; the rest is the server's own definition (owned by `ki-mcp`).

## Recognised surfaces

The recognised `clients` tokens are an explicit, literal set — each named by vendor-type (`<vendor>-<surface>`), except `mcporter`, which is provider-agnostic (the HTTP bridge is reachable from any client) and so carries no vendor prefix: `mcporter`, `claude-code`, `claude-desktop`, `chatgpt-codex`. `desktop`/`code` are client-specific config surfaces and are only recognised with the `claude-` prefix; a bare `desktop`/`code` is not recognised. `chatgpt-codex` is the OpenAI Codex CLI runtime — a distinct vendor, not a Claude surface. Cowork is **not** its own `clients` token — Cowork is a mode of the Claude Desktop app, not a fourth independent surface, so its enablement rides on `claude-desktop` rather than needing a `claude-cowork` token of its own; see below for how Cowork is actually checked.

| Surface | `clients` token | Rendered config (the write target) | Controllability |
| --- | --- | --- | --- |
| Claude Code | `claude-code` | `~/.claude.json` `mcpServers` (in practice: the one `ki-mcporter` url proxy) | file-editable · renderer-written § |
| Desktop | `claude-desktop` | `~/Library/Application Support/Claude/claude_desktop_config.json` | file-editable · renderer-written § |
| mcporter | `mcporter` | `~/.mcporter/mcporter.json` `mcpServers` (proxied daemon) | file-editable · renderer-written § |
| Codex CLI | `chatgpt-codex` | `~/.codex/config.toml` `[mcp_servers.<name>]` (TOML) | file-editable · this skill renders it via `codex mcp` ¶ |
| Cowork | _(none — rides on `claude-desktop`, see above)_ † | `local-agent-mode-sessions/<account>/<workspace>/cowork_settings.json` (`enabledPlugins`) | file-editable · this skill writes it ‡ |
| claude.ai | _(none)_ | no local file — Admin Console allowlist | manual-only · documented convention |

† The Cowork surface is the KI plugin `knowledge-islands@ki-plugins`, carrying **skills + agents** only. MCP servers are deferred: they are host-local and do not port into Cowork's gVisor sandbox — there is deliberately no `cowork` `clients` token for a server to declare. ‡ Gate **PASSED 2026-07-06** (design record Verification log): an external edit to `cowork_settings.json` is honoured on next Cowork launch. The plugin + marketplace repo is **built** (`knowledgeislands/ki-plugins`); this skill registers it under `extraKnownMarketplaces` and toggles `enabledPlugins` via [`conform.ts`](../scripts/conform.ts). A full Cowork relaunch applies the change. § "Renderer-written" = generated from the single source by a renderer (e.g. `ki-binding-chezmoi` via chezmoi templates + `chezmoi apply`), never hand-authored per surface. `ki-binding` audits agreement; it does not itself render these surfaces. ¶ Codex is the exception to "renderer-written": `~/.codex/config.toml` is a live user file (it also carries the ChatGPT app's own `[mcp_servers.*]` and other tables), so a chezmoi whole-file render would clobber it. Instead `ki-binding` renders it directly via Codex's native merge-safe writers (`codex mcp add|remove`, binary-verified against codex-cli 0.144.4) in [`render-codex.ts`](../scripts/render-codex.ts) — touching only KI-governed server names, never the ChatGPT-app servers.

## The Cowork enablement schema (characterized 2026-07-06)

The real `cowork_settings.json` (path `local-agent-mode-sessions/<account>/<workspace>/cowork_settings.json`) is a small JSON file with two keys — so the Cowork **write target** is now concrete, independent of the still-open runtime gate:

```jsonc
{
  "enabledPlugins": {
    "<plugin>@<marketplace>": true, // one boolean per plugin, keyed "<plugin>@<marketplace>"
    "operations@knowledge-work-plugins": false
  },
  "extraKnownMarketplaces": {
    "<marketplace>": { "source": { "source": "github", "repo": "anthropics/knowledge-work-plugins" } }
  }
}
```

So a Cowork surface for KI is: **a KI plugin published in a GitHub marketplace repo**, registered under `extraKnownMarketplaces` (a `github` `repo` source), then toggled `true` under `enabledPlugins` as `<ki-plugin>@<ki-marketplace>`. This confirms the design record's home decision — the **marketplace is the packaging** (a github repo, like Anthropic's `knowledge-work-plugins`), and **this skill is the actor** that registers and toggles it. The KI plugin bundles the servers + skills + agents; building it is step 6, gated on ‡.

## The read model — how the skill computes "on for this surface"

1. **Parse the source** (`Bun.YAML.parse`). Validate: `mcpServers` is a list; every entry has a `name`; every entry has a non-empty `clients` naming only recognised tokens — the explicit set `mcporter`, `claude-code`, `claude-desktop`, `chatgpt-codex` (see "Recognised surfaces" above).
2. **For each surface `S`**, the expected server set is `{ e.name for e in mcpServers if S in { baseSurface(c) for c in e.clients } }` — a provider-prefixed token counts toward its bare surface.
3. **Compare** that expected set against the surface's rendered config `mcpServers` keys (or `enabledPlugins` for Cowork). Missing (in source, not in surface) and stray (in surface, not in source) are both drift.
4. **The skill half** — project-local skills for the surface — is not in `mcps.yaml`; it is `.ki-config.toml` coverage, checked by composing `ki-bootstrap --check`. Servers and skills are audited by their own sources; this skill only asserts the two agree with their declarations.

## Invariants

- **One source.** No surface config is authored by hand; each is rendered from `mcps.yaml` by a renderer (the file-editable surfaces — `ki-binding-chezmoi` on the maintainer's machine, or any tool reading the canonical source) or written by this skill from the same source (Cowork, once wired). A hand-edit that diverges from the source is drift, reported by BIND-1.
- **Renderer-neutral.** `ki-binding` reads the source and audits agreement; it does not depend on any one renderer being installed. The chezmoi render path lives in the composition skill `ki-binding-chezmoi` (which depends on `ki-binding` + `ki-dotfiles-chezmoi`), not here.
- **`clients` is the only binding lever.** Turning a server on for a surface is a one-line `clients` edit, never a per-surface script.
- **Cowork rides on Desktop, not its own token.** Cowork is a mode of the Claude Desktop app rather than a fourth independent surface, so there is no `cowork`/`claude-cowork` token; its enablement is checked independently (BIND-4), against the plugin registration, not per-server `clients`.

## The Cowork plugin & marketplace format (characterized 2026-07-06)

A Cowork marketplace is a **GitHub repo** laid out as (from Anthropic's `knowledge-work-plugins`):

```text
<marketplace-repo>/
  .claude-plugin/marketplace.json   # { name, owner: {name}, plugins: [{ name, source: "./<dir>", description }] }
  <plugin>/                         # one directory per plugin
    .claude-plugin/plugin.json      # { name, version, description, author: {name} }
    .mcp.json                       # { mcpServers: { <name>: {type:"http", url} | {command, args, env} } }
    skills/  commands/              # optional bundled skills / slash commands (agents likewise)
    README.md  CONNECTORS.md        # optional
```

The skill's **CONFORM** for Cowork then: registers the marketplace under `extraKnownMarketplaces` (`{source: {source: "github", repo: "<org>/<repo>"}}`) and toggles `"<plugin>@<marketplace>": true` under `enabledPlugins` in `cowork_settings.json`.

**Server-portability finding (verified 2026-07-06).** Cowork runs plugins in a **gVisor sandbox** (`vm_bundles/claudevm.bundle`, `gvisorMacAddress`) with its own network stack, and a plugin's stdio server runs **inside** that sandbox via `${CLAUDE_PLUGIN_ROOT}` (per Anthropic's `create-cowork-plugin` schema: `stdio` | `sse` | `http`). Consequences:

- The host **mcporter http-bridge** (`127.0.0.1:3333`, confirmed serving) is **not** reachable from the sandbox — host localhost ≠ sandbox localhost.
- The KI MCP servers are **host-local** — KB-filesystem servers read host paths (`~/kis/…`), secrets resolve via 1Password `op://`, node runs on the host. They **do not port into the sandbox** as-is, and KI publishes no remote (`http`/`sse`) endpoints the sandbox could reach.
- **Skills and agents are portable** — plain files bundled into the plugin under `skills/` and `agents/`, no runtime dependency.

**Therefore:** a KI Cowork plugin can ship the **skills + agents** immediately; the **MCP-server half needs sandbox-portability work first** (bundle a self-contained server via `${CLAUDE_PLUGIN_ROOT}`, mount the KB into the sandbox, or expose authenticated remote endpoints) — tracked as an open decision, not built blind.

## claude.ai web — documented convention, no build

The web surface has no local config file, so there is nothing to render or audit: enablement is the account/org **connector allowlist** in the Admin Console, manual-only. The convention is to **keep account/org connectors minimal** and rely on the locally-reachable surfaces (Code / Desktop / Cowork) for per-project enablement. This skill does not automate web; governance of the connector allowlist and Claude Code's `managed-mcp.json` allow/deny layer lives in [claude-ai-connector-control.md](../../../repo-structure/ki-mcp/references/claude-ai-connector-control.md).

## Known limits

- **Per-machine, not per-project, for servers.** Code reaches every server through the single `ki-mcporter` proxy, so server enablement is per-machine. The `[project]` argument scopes the **skill** half (via `ki-bootstrap`) and the Cowork plugin set — not the server set. Per-project server scoping would need mcporter-side routing and is out of scope until the design record adopts it.
