---
name: ki-binding
ki-depends-on: []
ki-runtime-binding: true
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Codify, audit, and apply the Knowledge Islands cross-surface binding — enabling the KI MCP servers, skills, and agents consistently across the surfaces that run them (Claude Code, Claude Desktop, Claude Cowork, claude.ai web) from the single renderer-neutral `mcp-servers.yaml` source. Governs the per-server `clients:` targeting field, the per-surface config each client wants, and the Cowork plugin the skill toggles in `enabledPlugins`. Use when a project's tools are enabled on one surface but not another, wiring a new surface, auditing that every surface agrees with the single source, or adding a server to the inventory. Triggers: "why is this MCP in Code but not Cowork", "enable these tools everywhere", "audit the cross-surface binding", "the surfaces disagree", "wire Cowork". Composes on `ki-bootstrap` (Claude Code skill links) and `ki-mcp` (server-code standard + the cross-surface-enablement.md design record). Not for one server's code (`ki-mcp`) or a repo's skill links alone (`ki-bootstrap`).
argument-hint: 'audit [project] | conform [project] | help | educate [project] | refresh'
---

# Knowledge Islands Cross-surface Binding

You are governing **one control surface for many run surfaces**: a single declaration of which MCP servers, skills, and agents are on, fanned out to every surface that can run them — Claude Code, Claude Desktop, Claude Cowork, and (by convention only) claude.ai web. The problem this solves is **drift**: a tool reachable in Code but silent in Cowork, a server in the inventory that never reached Desktop, a surface configured by hand and now out of step with the source.

**The single source is [`mcp-servers.yaml`](references/standards-cross-surface-binding.md)** — a plain `mcpServers:` inventory, canonically at `~/.config/ki/mcp-servers.yaml` (owned by no one dotfiles manager; resolution order in the standard). Each server entry carries a **`clients:` list** naming the surfaces it targets; a **renderer** turns that into Claude Code, Claude Desktop, and the mcporter proxy configs. This skill is **renderer-neutral**: it reads the source directly and is the **actor and auditor** over the binding — it checks every surface agrees with the source, manages the separate Cowork plugin binding, and composes `ki-bootstrap` for the project-local skill half. It requires no particular renderer installed and never invents a second source — `mcp-servers.yaml` stays canonical. The chezmoi render path lives in the composition skill `ki-binding-chezmoi`, not here.

**The model — at a glance:**

- **One source, a `clients` field per server.** `mcp-servers.yaml` lists every server; each declares recognised `clients` tokens. Adding a surface to a server is a one-line edit there, never a per-surface script. The recognised surfaces and the config each writes are [the standard](references/standards-cross-surface-binding.md).
- **Surfaces sit on a controllability ladder** (design record, most-controllable first): **Claude Code** and **Claude Desktop** are file-editable and renderer-written (e.g. by `ki-binding-chezmoi` via chezmoi) — this skill audits them. **Claude Cowork** is file-editable (`cowork_settings.json`, `enabledPlugins`) — its external-edit gate passed (2026-07-06), so this skill both audits and writes it. **claude.ai web** has no local file — documented convention only, no build.
- **The Cowork artifact is a KI plugin** in the `knowledgeislands/ki-plugins` marketplace repo — a lossy projection of this harness (ADR-KI-HARNESS-002) carrying **skills + agents** (MCP servers are deferred: host-local, they do not port into Cowork's gVisor sandbox). The plugin is generated from source by [`build-plugin.ts`](scripts/build-plugin.ts); the plugin is the packaging and **this skill is the actor** that registers + toggles it. The `ki-mcp` skill owns the cross-surface design record. The marketplace repo's **on-disk shape** — the manifest shapes, the verbatim `skills/` copy and flattened `agents/`, the MCP-deferred rule — is governed by the `ki-plugins` repo-structure skill; this skill owns only generation (`build-plugin`) and the cross-surface enablement below (BIND-4), never re-checking the projection shape.

The quotable invariant is [the standard](references/standards-cross-surface-binding.md); the canonical catalogue is [`scripts/rubric/items/index.ts`](scripts/rubric/items/index.ts); the checkable criteria are [the generated rubric](references/rubric.md).

## Operating modes

### Mode HELP — orient without changing anything

Invoked as `help` / `-h` / `?`, it explains itself and stops: name, purpose, invocation, modes, and off-ramps, taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice and prompts for any target the chosen mode requires.

### Mode AUDIT — check the surfaces agree with the source

1. **Run the governed audit.** `ki repo audit --skill ki-binding --repo <project>` prepares repository declarations and user-home surface state once, then evaluates the complete rubric session: **BIND-1** every rendered surface (Code, Desktop, mcporter, Codex CLI) contains exactly the servers whose `clients` names it — no missing, no stray (the Codex TOML surface's own ChatGPT-app servers are excluded, not compared); **BIND-2** the single source parses and every entry has a non-empty `clients` naming only recognised surfaces; **BIND-3** every skill declared by the repository is present for each supported runtime; **BIND-4** Cowork agreement — the KI plugin (`knowledge-islands@ki-plugins`) is registered under `extraKnownMarketplaces` and toggled on in every workspace's `cowork_settings.json`.
2. **Judge the [J] criteria by reading** — is the `clients` set per server _right_ for how the project is used (does a server a project needs actually target that project's surfaces)? That is intent, not mechanics; name it, do not guess it.
3. **Report** by criterion. A surface out of step with the source, or a declared-but-unwired Cowork, is a WARN — conformable, not blocking.

### Mode CONFORM — bring the surfaces into step

1. Run **AUDIT** first, then use `ki repo conform --skill ki-binding --repo <project>` for the safe host-managed Cowork proposals.
2. **Reconcile the file-editable surfaces.** For Code / Desktop / mcporter the write path is a renderer: edit the source (`clients` field / new entry), then re-render. The chezmoi render path (`chezmoi apply`, preview with `chezmoi diff`) lives in `ki-binding-chezmoi`; a non-chezmoi setup re-runs whatever tool reads the canonical source. This skill never hand-edits a rendered config — that would drift from the source.
3. **Codex CLI.** The one file-editable surface this skill renders itself, since `~/.codex/config.toml` is a live user file no chezmoi template should own whole-file: `bun skills/environment/ki-binding/scripts/render-codex.ts [--check] [--source <path>]` shells Codex's own merge-safe `codex mcp add|remove` per KI-governed server name, leaving the ChatGPT app's own servers untouched.
4. **Compose the skill half.** Run `ki-bootstrap` CONFORM for the project's project-local skills — sequence it, never fork it. `ki-binding` reports missing runtime publications but leaves their creation to that owning capability.
5. **Cowork** (gate passed 2026-07-06 — now built). The surface is a KI plugin published in the `knowledgeislands/ki-plugins` marketplace repo. Two moves:
   - **Regenerate the plugin from source** (skills + agents are a projection of this harness, never hand-maintained): `bun skills/environment/ki-binding/scripts/build-plugin.ts <ki-plugins-checkout>`, then commit + push the plugin repo. MCP servers are deferred — host-local, they do not port into Cowork's gVisor sandbox.
   - **Register + toggle it:** the BIND-4 action drafts a merge of `extraKnownMarketplaces["ki-plugins"]` and `enabledPlugins["knowledge-islands@ki-plugins"] = true` into every workspace's `cowork_settings.json`. The rubric host previews and transactionally applies those user-home writes; it never clobbers unrelated settings. **A full Cowork relaunch is required** for the change to take effect.
6. **Re-run AUDIT** until clean.

### Mode EDUCATE — explain and activate

EDUCATE scaffolds no standalone artifact — the single source (`mcp-servers.yaml`) lives at the canonical source path, never in a target repo. Use `ki repo educate --skill ki-binding --repo <project>` to explain the binding contract and activation prerequisites. Repository skill publication remains owned by `ki-bootstrap`.

### Mode REFRESH — re-anchor

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

Re-anchor when a surface's config contract changes, a surface is added or removed, or the Cowork plugin contract changes. Read [the source list](references/sources.md), confirm the standard still matches each surface's real config, verify Cowork external edits against a disposable workspace, propose a diff, and update the review dates. The chezmoi render contract is refreshed by `ki-binding-chezmoi`; the cross-surface design record is refreshed by `ki-mcp`.

## Composition

- `ki-bootstrap` — owns the Claude Code project-local **skill** links. This skill composes its `--check` / CONFORM for the skill half of a surface; it never re-implements linking.
- `ki-mcp` — owns the MCP **server code** standard and the `cross-surface-enablement.md` design record this skill implements. For a single server's layout / tool surface, route there.
- `ki-tokenomics` — owns the standing-cost rationale for which surfaces carry which tools. For token-budget questions, route there.

## Notes

- **Why one canonical source, not a new file per surface:** a renderer projects it to Code, Desktop, and mcporter. A second source would be the drift this skill exists to prevent. The skill's genuine additions are the **audit** across surfaces and the **Cowork** surface no renderer yet reaches.
- **Why the chezmoi render is a separate skill:** keeping `ki-binding` renderer-neutral is the point — the chezmoi-specific render (templates + `chezmoi apply`) lives in the composition skill `ki-binding-chezmoi` (which implies `ki-binding` + `ki-dotfiles-chezmoi`), so a non-chezmoi user installs only `ki-binding` (see ADR-KI-HARNESS-SKILLS-004).
- **Per-project granularity:** Code reaches every server through the one mcporter proxy, so Code/Desktop enablement is currently per-machine, not per-project; the project argument scopes the **skill** half (via `ki-bootstrap`) and, once wired, the Cowork plugin set. Per-project server scoping is a known limit, recorded in the standard.
