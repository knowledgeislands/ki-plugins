---
name: ki-binding
implies: []
description: >
  Codify, audit, and apply the Knowledge Islands cross-surface binding — enabling the KI MCP servers, skills, and agents consistently across the surfaces that run them (Claude Code, Claude Desktop, Claude Cowork, claude.ai web) from the single chezmoi `mcps.yaml` source. Governs the per-server `clients:` targeting field, the per-surface config each client wants, and the Cowork plugin the skill toggles in `enabledPlugins`. Use when a project's tools are enabled on one surface but not another, wiring a new surface, auditing that every surface agrees with the single source, or adding a server to the inventory. Triggers: "why is this MCP in Code but not Cowork", "enable these tools everywhere", "audit the cross-surface binding", "the surfaces disagree", "wire Cowork". Composes on `ki-bootstrap` (Claude Code skill links) and `ki-mcp` (server-code standard + the cross-surface-enablement.md design record). Not for one server's code (`ki-mcp`) or a repo's skill links alone (`ki-bootstrap`).
argument-hint: 'audit [project] | conform [project] | refresh'
---

# Knowledge Islands Cross-surface Binding

You are governing **one control surface for many run surfaces**: a single declaration of which MCP servers, skills, and agents are on, fanned out to every surface that can run them — Claude Code, Claude Desktop, Claude Cowork, and (by convention only) claude.ai web. The problem this solves is **drift**: a tool reachable in Code but silent in Cowork, a server in the inventory that never reached Desktop, a surface configured by hand and now out of step with the source.

**The single source is [`mcps.yaml`](references/binding-standard.md)** — the chezmoi `.chezmoidata/mcps.yaml` inventory. Each server entry carries a **`clients:` list** naming the surfaces it targets; chezmoi's `mcp-servers-json` template already renders that into Claude Code, Claude Desktop, and the mcporter proxy. This skill is the **actor and auditor** over that mechanism: it checks every surface agrees with the source, extends the `clients` targeting to the surfaces chezmoi does not yet reach (Cowork), and composes `ki-bootstrap` for the project-local skill half. It never invents a second source — `mcps.yaml` stays canonical.

**The model — at a glance:**

- **One source, a `clients` field per server.** `mcps.yaml` lists every server; each declares `clients: [code, desktop, mcporter, cowork]`. Adding a surface to a server is a one-line edit there, never a per-surface script. The recognised surfaces and the config each writes are [the standard](references/binding-standard.md).
- **Surfaces sit on a controllability ladder** (design record, most-controllable first): **Claude Code** and **Claude Desktop** are file-editable and already rendered by chezmoi — this skill audits them. **Claude Cowork** is file-editable (`cowork_settings.json`, `enabledPlugins`) — its external-edit gate passed (2026-07-06), so this skill both audits and writes it. **claude.ai web** has no local file — documented convention only, no build.
- **The Cowork artifact is a KI plugin** in the `knowledgeislands/ki-plugins` marketplace repo — a lossy projection of this harness (ADR-KI-HARNESS-005) carrying **skills + agents** (MCP servers are deferred: host-local, they do not port into Cowork's gVisor sandbox). The plugin is generated from source by [`build-plugin.ts`](scripts/build-plugin.ts); the plugin is the packaging and **this skill is the actor** that registers + toggles it. Design: [cross-surface-enablement.md](../ki-mcp/references/cross-surface-enablement.md). The marketplace repo's **on-disk shape** — the manifest shapes, the verbatim `skills/` copy and flattened `agents/`, the MCP-deferred rule — is governed by the `ki-plugins` repo-structure skill; this skill owns only generation (`build-plugin`) and the cross-surface enablement below (BIND-4), never re-checking the projection shape.

The checker is [`scripts/audit-binding.ts`](scripts/audit-binding.ts); the quotable invariant is [the standard](references/binding-standard.md); the checkable criteria are [the rubric](references/audit-rubric.md).

## Mode AUDIT — check the surfaces agree with the source

1. **Run the checker.** `bun skills/ki-binding/scripts/audit-binding.ts [project] --check` (or `bun run ki:binding:audit`). It reports on the unified severity ladder (`ki-engineering` enforcement-framework §2): **BIND-1** every rendered surface (Code, Desktop, mcporter) contains exactly the servers whose `clients` names it — no missing, no stray; **BIND-2** the single source parses and every entry has a non-empty `clients` naming only recognised surfaces; **BIND-3** the project-local skill half is wired (delegates to `ki-bootstrap --check`); **BIND-4** Cowork agreement — the KI plugin (`knowledge-islands@ki-plugins`) is registered under `extraKnownMarketplaces` and toggled on in every workspace's `cowork_settings.json` (WARN if a workspace is unconformed; any server still declaring `cowork` is surfaced separately, since MCP servers are deferred as host-local).
2. **Judge the [J] criteria by reading** — is the `clients` set per server _right_ for how the project is used (does a server a project needs actually target that project's surfaces)? That is intent, not mechanics; name it, do not guess it.
3. **Report** by criterion. A surface out of step with the source, or a declared-but-unwired Cowork, is a WARN — conformable, not blocking.

## Mode CONFORM — bring the surfaces into step

1. Run **AUDIT** first.
2. **Reconcile the file-editable surfaces.** For Code / Desktop / mcporter the write path is chezmoi: edit `mcps.yaml` (`clients` field / new entry), then `chezmoi apply`. This skill never hand-edits a rendered config — that would drift from the source. Preview with `chezmoi diff`.
3. **Compose the skill half.** Run `ki-bootstrap` CONFORM for the project's project-local skills (`bun run ki:skills:link:project`) — sequence it, never fork it.
4. **Cowork** (gate passed 2026-07-06 — now built). The surface is a KI plugin published in the `knowledgeislands/ki-plugins` marketplace repo. Two moves:
   - **Regenerate the plugin from source** (skills + agents are a projection of this harness, never hand-maintained): `bun run ki:binding:build-plugin <ki-plugins-checkout>`, then commit + push the plugin repo. MCP servers are deferred — host-local, they do not port into Cowork's gVisor sandbox.
   - **Register + toggle it:** `bun skills/ki-binding/scripts/conform-cowork.ts` writes `extraKnownMarketplaces["ki-plugins"]` and `enabledPlugins["knowledge-islands@ki-plugins"] = true` into every workspace's `cowork_settings.json` (merge, never clobber). **A full Cowork relaunch is required** for the change to take effect.
5. **Re-run AUDIT** until clean.

## Mode REFRESH — re-anchor

Re-anchor when a surface's config contract changes, a surface is added or removed, or the Cowork gate is resolved. The **first open gate** is the Cowork external-edit check: verify an external edit to `local-agent-mode-sessions/<account>/<workspace>/cowork_settings.json` is honoured on next Cowork launch; record the outcome in [cross-surface-enablement.md](../ki-mcp/references/cross-surface-enablement.md). Read [the source list](references/sources.md), confirm the standard still matches the chezmoi template and each surface's real config, propose a diff, bump the dates.

## Composition

- `ki-bootstrap` — owns the Claude Code project-local **skill** links. This skill composes its `--check` / CONFORM for the skill half of a surface; it never re-implements linking.
- `ki-mcp` — owns the MCP **server code** standard and hosts the [cross-surface-enablement.md](../ki-mcp/references/cross-surface-enablement.md) design record this skill implements. For a single server's layout / tool surface, route there.
- `ki-tokenomics` — owns the standing-cost rationale for which surfaces carry which tools. For token-budget questions, route there.

## Notes

- **Why the source is `mcps.yaml`, not a new file:** chezmoi already renders it to Code, Desktop, and mcporter. A second source would be the drift this skill exists to prevent. The skill's genuine additions are the **audit** across surfaces and the **Cowork** surface chezmoi does not yet reach.
- **Per-project granularity:** Code reaches every server through the one mcporter proxy, so Code/Desktop enablement is currently per-machine, not per-project; the project argument scopes the **skill** half (via `ki-bootstrap`) and, once wired, the Cowork plugin set. Per-project server scoping is a known limit, recorded in the standard.
