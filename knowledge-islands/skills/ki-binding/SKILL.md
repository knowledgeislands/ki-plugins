---
name: ki-binding
implies: []
vendors: [educate, audit, conform, help]
description: >
  Codify, audit, and apply the Knowledge Islands cross-surface binding — enabling the KI MCP servers, skills, and agents consistently across the surfaces that run them (Claude Code, Claude Desktop, Claude Cowork, claude.ai web) from the single renderer-neutral `mcp-servers.yaml` source. Governs the per-server `clients:` targeting field, the per-surface config each client wants, and the Cowork plugin the skill toggles in `enabledPlugins`. Use when a project's tools are enabled on one surface but not another, wiring a new surface, auditing that every surface agrees with the single source, or adding a server to the inventory. Triggers: "why is this MCP in Code but not Cowork", "enable these tools everywhere", "audit the cross-surface binding", "the surfaces disagree", "wire Cowork". Composes on `ki-bootstrap` (Claude Code skill links) and `ki-mcp` (server-code standard + the cross-surface-enablement.md design record). Not for one server's code (`ki-mcp`) or a repo's skill links alone (`ki-bootstrap`).
argument-hint: 'audit [project] | conform [project] | help | educate [project] | refresh'
---

# Knowledge Islands Cross-surface Binding

You are governing **one control surface for many run surfaces**: a single declaration of which MCP servers, skills, and agents are on, fanned out to every surface that can run them — Claude Code, Claude Desktop, Claude Cowork, and (by convention only) claude.ai web. The problem this solves is **drift**: a tool reachable in Code but silent in Cowork, a server in the inventory that never reached Desktop, a surface configured by hand and now out of step with the source.

**The single source is [`mcp-servers.yaml`](references/binding-standard.md)** — a plain `mcpServers:` inventory, canonically at `~/.config/ki/mcp-servers.yaml` (owned by no one dotfiles manager; resolution order in the standard). Each server entry carries a **`clients:` list** naming the surfaces it targets; a **renderer** turns that into Claude Code, Claude Desktop, and the mcporter proxy configs. This skill is **renderer-neutral**: it reads the source directly and is the **actor and auditor** over the binding — it checks every surface agrees with the source, extends the `clients` targeting to the surfaces a renderer does not yet reach (Cowork), and composes `ki-bootstrap` for the project-local skill half. It requires no particular renderer installed and never invents a second source — `mcp-servers.yaml` stays canonical. The chezmoi render path lives in the composition skill `ki-binding-chezmoi`, not here.

**The model — at a glance:**

- **One source, a `clients` field per server.** `mcps.yaml` lists every server; each declares `clients: [code, desktop, mcporter, cowork]`. Adding a surface to a server is a one-line edit there, never a per-surface script. The recognised surfaces and the config each writes are [the standard](references/binding-standard.md).
- **Surfaces sit on a controllability ladder** (design record, most-controllable first): **Claude Code** and **Claude Desktop** are file-editable and renderer-written (e.g. by `ki-binding-chezmoi` via chezmoi) — this skill audits them. **Claude Cowork** is file-editable (`cowork_settings.json`, `enabledPlugins`) — its external-edit gate passed (2026-07-06), so this skill both audits and writes it. **claude.ai web** has no local file — documented convention only, no build.
- **The Cowork artifact is a KI plugin** in the `knowledgeislands/ki-plugins` marketplace repo — a lossy projection of this harness (ADR-KI-HARNESS-002) carrying **skills + agents** (MCP servers are deferred: host-local, they do not port into Cowork's gVisor sandbox). The plugin is generated from source by [`build-plugin.ts`](scripts/build-plugin.ts); the plugin is the packaging and **this skill is the actor** that registers + toggles it. Design: [cross-surface-enablement.md](../../repo-structure/ki-mcp/references/cross-surface-enablement.md). The marketplace repo's **on-disk shape** — the manifest shapes, the verbatim `skills/` copy and flattened `agents/`, the MCP-deferred rule — is governed by the `ki-plugins` repo-structure skill; this skill owns only generation (`build-plugin`) and the cross-surface enablement below (BIND-4), never re-checking the projection shape.

The checker is [`scripts/audit.ts`](scripts/audit.ts); the quotable invariant is [the standard](references/binding-standard.md); the checkable criteria are [the rubric](references/audit-rubric.md).

## Operating modes

Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT — check the surfaces agree with the source

1. **Run the checker.** `bun skills/environment/ki-binding/scripts/audit.ts [project] --check` (or `bun run ki:binding:audit`). It reports on the unified severity ladder (`ki-engineering` enforcement-framework §2): **BIND-1** every rendered surface (Code, Desktop, mcporter, Codex CLI) contains exactly the servers whose `clients` names it — no missing, no stray (the Codex TOML surface's own ChatGPT-app servers are excluded, not compared); **BIND-2** the single source parses and every entry has a non-empty `clients` naming only recognised surfaces; **BIND-3** the project-local skill half is wired (delegates to `ki-bootstrap --check`); **BIND-4** Cowork agreement — the KI plugin (`knowledge-islands@ki-plugins`) is registered under `extraKnownMarketplaces` and toggled on in every workspace's `cowork_settings.json` (WARN if a workspace is unconformed; any server still declaring `cowork` is surfaced separately, since MCP servers are deferred as host-local).
2. **Judge the [J] criteria by reading** — is the `clients` set per server _right_ for how the project is used (does a server a project needs actually target that project's surfaces)? That is intent, not mechanics; name it, do not guess it.
3. **Report** by criterion. A surface out of step with the source, or a declared-but-unwired Cowork, is a WARN — conformable, not blocking.

### Mode CONFORM — bring the surfaces into step

1. Run **AUDIT** first.
2. **Reconcile the file-editable surfaces.** For Code / Desktop / mcporter the write path is a renderer: edit the source (`clients` field / new entry), then re-render. The chezmoi render path (`chezmoi apply`, preview with `chezmoi diff`) lives in `ki-binding-chezmoi`; a non-chezmoi setup re-runs whatever tool reads the canonical source. This skill never hand-edits a rendered config — that would drift from the source.
3. **Codex CLI.** The one file-editable surface this skill renders itself, since `~/.codex/config.toml` is a live user file no chezmoi template should own whole-file: `bun skills/environment/ki-binding/scripts/render-codex.ts [--check] [--source <path>]` shells Codex's own merge-safe `codex mcp add|remove` per KI-governed server name, leaving the ChatGPT app's own servers untouched.
4. **Compose the skill half.** Run `ki-bootstrap` CONFORM for the project's project-local skills (`bun run ki:skills:link:project`) — sequence it, never fork it.
5. **Cowork** (gate passed 2026-07-06 — now built). The surface is a KI plugin published in the `knowledgeislands/ki-plugins` marketplace repo. Two moves:
   - **Regenerate the plugin from source** (skills + agents are a projection of this harness, never hand-maintained): `bun run ki:binding:build-plugin <ki-plugins-checkout>`, then commit + push the plugin repo. MCP servers are deferred — host-local, they do not port into Cowork's gVisor sandbox.
   - **Register + toggle it:** `bun skills/environment/ki-binding/scripts/conform.ts` writes `extraKnownMarketplaces["ki-plugins"]` and `enabledPlugins["knowledge-islands@ki-plugins"] = true` into every workspace's `cowork_settings.json` (merge, never clobber). **A full Cowork relaunch is required** for the change to take effect.
6. **Re-run AUDIT** until clean.

### Mode EDUCATE — vendor the binding checks

EDUCATE scaffolds no standalone artifact — the single source (`mcp-servers.yaml`) lives at the canonical source path, never in a target repo. It vendors this skill's declared mechanical unit (the frontmatter `vendors:` declaration — the checker and the Cowork conformer) into the target's `.ki-meta/` via the central bootstrap chain: [`scripts/educate.ts`](scripts/educate.ts) is a thin delegator that execs the `ki-bootstrap` engine with this skill as an explicit seed.

### Mode REFRESH — re-anchor

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

Re-anchor when a surface's config contract changes, a surface is added or removed, or the Cowork gate is resolved. The **first open gate** is the Cowork external-edit check: verify an external edit to `local-agent-mode-sessions/<account>/<workspace>/cowork_settings.json` is honoured on next Cowork launch; record the outcome in [cross-surface-enablement.md](../../repo-structure/ki-mcp/references/cross-surface-enablement.md). Read [the source list](references/sources.md), confirm the standard still matches each surface's real config (the chezmoi render contract itself is re-anchored in `ki-binding-chezmoi`), propose a diff, bump the dates.

## Composition

- `ki-bootstrap` — owns the Claude Code project-local **skill** links. This skill composes its `--check` / CONFORM for the skill half of a surface; it never re-implements linking.
- `ki-mcp` — owns the MCP **server code** standard and hosts the [cross-surface-enablement.md](../../repo-structure/ki-mcp/references/cross-surface-enablement.md) design record this skill implements. For a single server's layout / tool surface, route there.
- `ki-tokenomics` — owns the standing-cost rationale for which surfaces carry which tools. For token-budget questions, route there.

## Notes

- **Why one canonical source, not a new file per surface:** a renderer projects it to Code, Desktop, and mcporter. A second source would be the drift this skill exists to prevent. The skill's genuine additions are the **audit** across surfaces and the **Cowork** surface no renderer yet reaches.
- **Why the chezmoi render is a separate skill:** keeping `ki-binding` renderer-neutral is the point — the chezmoi-specific render (templates + `chezmoi apply`) lives in the composition skill `ki-binding-chezmoi` (which implies `ki-binding` + `ki-dotfiles-chezmoi`), so a non-chezmoi user installs only `ki-binding` (see ADR-KI-HARNESS-SKILLS-004).
- **Per-project granularity:** Code reaches every server through the one mcporter proxy, so Code/Desktop enablement is currently per-machine, not per-project; the project argument scopes the **skill** half (via `ki-bootstrap`) and, once wired, the Cowork plugin set. Per-project server scoping is a known limit, recorded in the standard.
