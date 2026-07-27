# Cross-surface MCP enablement standard

This runtime-bound standard explains how one source of truth enables Knowledge Islands MCP servers, skills, and agents across Claude Code, Claude Desktop, Claude Cowork, and claude.ai web. It governs MCP surface targeting rather than server-code conformance; [the connector-control standard](standards-claude-ai-connectors.md) supplies the claude.ai policy details.

## Source and ownership

The canonical source is `~/.config/ki/mcp-servers.yaml`. It declares each server and its target clients without assuming a particular renderer. `ki-binding` audits agreement across surfaces; `ki-binding-chezmoi` owns the maintainer-specific chezmoi rendering. A surface must not become a second authored server registry.

## Per-surface targeting

| Surface        | Configuration                    | Control boundary                                 |
| -------------- | -------------------------------- | ------------------------------------------------ |
| Claude Code    | mcporter and project `.mcp.json` | File-editable, including per-project enablement  |
| Claude Desktop | rendered application config      | File-editable from the canonical source          |
| Claude Cowork  | `cowork_settings.json`           | File-editable plugin registration and enablement |
| claude.ai web  | account or organization UI       | Manual/admin control; no local file automation   |

Claude Cowork runs plugin stdio servers inside a gVisor sandbox. Host-local servers, paths, secret providers, and loopback mcporter bridges are not assumed reachable there. Skills and agents may ship in a plugin independently of servers; a server reaches Cowork only after a separate sandbox-portability or authenticated-remote design.

## Binding model

Cross-surface fan-out is a binding concern, not a new MCP server or standalone registry:

1. Resolve the canonical source.
2. Audit each controllable surface against its declared client targeting.
3. Use the surface's owning renderer or binding action for file-editable state.
4. Keep claude.ai connector installation and organization policy explicit and manual.
5. Report an unportable server rather than silently omitting, rewriting, or exposing it.

The plugin is the Cowork packaging artifact; the binding skill is the actor. This preserves one declaration while respecting each runtime's persistence and security boundary.

## Sequencing

Enable and verify the most controllable surfaces first:

1. Claude Code through mcporter or project `.mcp.json`.
2. Claude Desktop from the same canonical source.
3. Claude Cowork after verifying plugin and server sandbox portability.
4. claude.ai through the account or organization connector controls in [the connector-control standard](standards-claude-ai-connectors.md).

External UI changes, organization policy, remote deployment, and sandbox-portability work remain report-only. No ki-mcp conform action mutates these surfaces.
