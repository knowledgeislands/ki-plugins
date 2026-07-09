# Cross-surface enablement of KI MCP servers and skills

The design record for how a single source of truth enables the Knowledge Islands MCP servers, skills, and agents across the surfaces that run them — Claude Code, Claude Desktop, Claude Cowork, and claude.ai web. This is **operating** guidance (which surface receives what, and how each is controlled), a sibling to [claude-ai-connector-control.md](claude-ai-connector-control.md); it is out of the skill's server-code-audit scope but the natural home for the reference. Ratified 2026-07-05 (harness plan 002, design-only).

## The problem

The workspace controls MCP servers and skills for **Claude Code only**: mcporter proxies the KI servers ([ADR-KI-HARNESS-TOOLCHAIN-003](../../../docs/decisions/ADR-KI-HARNESS-TOOLCHAIN-003-mcporter-mcp-proxy.md)) and `ki-bootstrap` links project-local skills — both write Claude-Code-only locations. The other surfaces drift: Cowork has no per-workspace enablement wired up, Desktop is fed only incidentally by the shared chezmoi template, and claude.ai web has no local config at all. The goal is one place to declare "these tools are on for this project/workspace" that fans out to every surface that can be controlled.

## Per-surface targeting

| Surface        | Config location                | Controllability              | Enabled via                       |
| -------------- | ------------------------------ | ---------------------------- | --------------------------------- |
| Claude Code    | mcporter + project `.mcp.json` | File-editable                | mcporter proxy + `ki-bootstrap` † |
| Claude Desktop | chezmoi `mcp-servers-json`     | File-editable                | same chezmoi source ‡             |
| Claude Cowork  | `cowork_settings.json`         | File-editable in principle § | `enabledPlugins` + a KI plugin ¶  |
| claude.ai web  | none (web UI / admin console)  | Manual-only                  | admin allowlist ‖                 |

† Per-project on/off. mcporter (`~/.mcporter/mcporter.json`, under chezmoi) proxies the 19 KI servers; `ki-bootstrap` links project-local skills into `.claude/skills/` from `.ki-config.toml`. ‡ All-or-nothing per app. Desktop reads the same chezmoi `mcp-servers-json` template that already feeds Claude Code. § In `local-agent-mode-sessions/<account>/<workspace>/`; carries `enabledPlugins` and `extraKnownMarketplaces`. **Unverified:** whether an external edit is honoured on the next Cowork launch — the first build-time check before anything depends on it. ¶ A KI plugin (Claude plugin-marketplace format) bundles MCP servers + skills + agents; the binding skill toggles it in `enabledPlugins`. ‖ Account/org connectors are manual-only, governed via the Admin Console allowlist and Claude Code's `managed-mcp.json` allow/deny layer — see [claude-ai-connector-control.md](claude-ai-connector-control.md). No local file, so no automation; the fallback is documented convention (below).

## Home decision — a per-project binding skill

The fan-out is realised as a **per-project binding skill**, not a standalone CLI, a bespoke `mcp-*` server, or an adopted third-party tool (`house-mcp-manager`, which is Claude-Code-only and was rejected in the spike). The skill is the control surface: invoked for a project or workspace, it writes each controllable surface's config from the single source, extending the pattern `ki-bootstrap` already uses for Claude Code skill links.

Why this shape:

- **Composition-only, KI-authored.** It reuses the existing skill machinery rather than standing up a new tool, honouring the harness's composition-only and KI-authored-only principles.
- **Native to Cowork.** Cowork's `enabledPlugins` is Claude's plugin-marketplace mechanism, which Claude Code also reads. The skill toggles a KI plugin there — it does not reinvent packaging; the plugin is the artifact, the skill is the actor.
- **One reasoning home.** Surface knowledge (what each config wants, what is controllable) lives in the skill and this reference, not scattered across per-surface scripts.

This supersedes plan 002's spike wording, which framed the _plugin marketplace itself_ as the primary artifact. The plugin remains the Cowork packaging; the **entry point and fan-out home is a skill**.

## Fan-out and sequencing

Single source: the chezmoi `mcp-servers-json` template already feeding Code and Desktop is the tool declaration the binding skill reads. Sequence the build by controllability, most-controllable first:

1. **Claude Code** — already controllable (mcporter / project `.mcp.json`); the reference implementation.
2. **Claude Desktop** — same chezmoi source; near-free once Code is done.
3. **Claude Cowork** — gated on verifying external-edit-honoured (§); then write `enabledPlugins`.
4. **claude.ai web** — no build. Documented-convention fallback only: keep account/org connectors minimal, and rely on the locally-reachable surfaces for per-project enablement. Governance in [claude-ai-connector-control.md](claude-ai-connector-control.md).

The build of the binding skill is tracked on the harness ROADMAP; this record is the design it implements.

## Verification log

- **2026-07-06 — `ki-binding` scaffolded; Code / Desktop / mcporter audited (plan 007 steps 1–4).** The single source is confirmed to be `.chezmoidata/mcps.yaml` (the `mcp-servers-json` template is only its renderer), and each server entry already carries a `clients:` field (`code` / `desktop` / `mcporter`) — the existing surface-targeting lever. `ki-binding`'s `audit-binding.ts` verifies each rendered surface agrees with the source; on the live machine all agree (Code = the 1 `ki-mcporter` proxy, Desktop 18, mcporter 18). Correction to step 1/2's wording: the file-editable surfaces are conformed via chezmoi (edit `clients` + `chezmoi apply`), **not** a hand-written per-surface `.mcp.json`, which would drift from the single source.
- **2026-07-06 — Cowork write-target schema characterized.** The real `cowork_settings.json` at `local-agent-mode-sessions/<account>/<workspace>/` carries `enabledPlugins` (`"<plugin>@<marketplace>": bool`) and `extraKnownMarketplaces` (a `{source: {source: "github", repo: "…"}}` per marketplace — e.g. Anthropic's `knowledge-work-plugins`). So a KI Cowork surface is a **KI plugin in a GitHub marketplace repo**, registered + toggled by the skill — confirming the home decision (marketplace = packaging, skill = actor).
- **2026-07-06 — Cowork server-portability verified (bridge spike).** Cowork runs plugins in a **gVisor sandbox** where a plugin's stdio server runs inside the sandbox via `${CLAUDE_PLUGIN_ROOT}` (`create-cowork-plugin` schema: stdio | sse | http). The host mcporter http-bridge (`127.0.0.1:3333`, confirmed serving) is unreachable from the sandbox, and the KI servers are host-local (KB paths, `op://` secrets, host node) with no remote endpoints — so **the KI MCP-server half does not port to Cowork as-is**. Skills + agents (plain files) do port. **Reshapes step 6:** a KI plugin can ship skills + agents now; the server half needs sandbox-portability work (bundle self-contained, mount the KB, or expose authenticated remote endpoints) as a separate decision.
- **2026-07-06 — Cowork external-edit gate ‡ PASSED.** Probe: with Cowork quit, an existing plugin was flipped `false → true` externally in `cowork_settings.json`; on relaunch Cowork showed the plugin **enabled** (edit honoured, not clobbered). The probe was then reverted. **Conclusion:** external edits to `cowork_settings.json` are honoured on next launch, so the binding skill can write `enabledPlugins` / `extraKnownMarketplaces` — Cowork is no longer gated. Step 6 (build the KI plugin + marketplace repo, then register + toggle it) is unblocked.
- **2026-07-07 — Cowork leg BUILT (plan 007 step 6).** The KI plugin marketplace repo `knowledgeislands/ki-plugins` (public) is created, its `skills/` + `agents/` **generated** from this harness by `ki-binding`'s `build-plugin.ts` (`ki:binding:build-plugin`) — 20 skills + 5 governance agents, no `.mcp.json` (servers deferred, per the portability finding above). `ki-binding` gained the Cowork write path (`conform-cowork.ts` — merges `extraKnownMarketplaces["ki-plugins"]` + `enabledPlugins["knowledge-islands@ki-plugins"]=true`, preserving other keys) and a BIND-4 Cowork-agreement audit. The live `cowork_settings.json` was conformed (BIND-4 PASS). **Open (deliberate):** `knowledgeislands/ki-plugins` keeps the harness's proprietary LICENSE while public, so `ki-repo`'s public-repo MIT check reports one non-overridable FAIL — left for a licensing/visibility decision, not silently flipped to MIT. **Deferred:** exposing the KI MCP servers to Cowork (sandbox-portable servers or authenticated remote endpoints) — a separate ROADMAP item. **Manual confirmation pending:** a fresh Cowork relaunch to observe the KI skills/agents loading.
