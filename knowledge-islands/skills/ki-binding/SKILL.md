---
name: ki-binding
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Codify and audit the portable Knowledge Islands MCP binding: the canonical XDG `mcp-servers.yaml` source, its server schema and `clients:` targeting, and drift at the vendor-neutral mcporter target. Use when defining a shared MCP inventory, validating client targeting, or finding mcporter drift. Runtime-native surfaces belong to `ki-binding-claude` and `ki-binding-codex`; chezmoi rendering belongs to `ki-binding-chezmoi`.
argument-hint: 'audit [project] | conform [project] | help | educate [project] | refresh'
---

# Knowledge Islands MCP binding

`ki-binding` owns the portable canonical MCP declaration, not any vendor's configuration files. The one source is `$XDG_CONFIG_HOME/ki/mcp-servers.yaml` (default `~/.config/ki/mcp-servers.yaml`), with `$KI_MCP_SOURCE` as an explicit override. Each `mcpServers` entry has a unique `name`, a non-empty `clients:` list, and either a command or URL definition.

The source has client tokens because it serves several clients, but a client adapter owns that client's native configuration and safe writer. This root itself audits only the vendor-neutral mcporter projection. Read [the standard](references/standards-cross-surface-binding.md), [generated rubric](references/rubric.md), and [sources](references/sources.md) for the contract.

## Operating modes

### Mode AUDIT

Run `ki repo audit --skill ki-binding --repo <project>`. It checks source validity (`BIND-2`) and compares only mcporter with entries targeting `mcporter` (`BIND-1`). Judge whether each target set is intentional (`BIND-J1`).

### Mode CONFORM

Run AUDIT first. Edit the canonical source, then use the renderer or client adapter that owns the target. This root never hand-edits a rendered target and proposes no writes.

### Mode EDUCATE

Explain the canonical source and target separation with `ki repo educate --skill ki-binding --repo <project>`; it scaffolds no duplicate source.

### Mode REFRESH

Refresh this root only in `ki-agentic-harness` when the portable source/schema or mcporter contract changes. From an installed copy, stop and redirect to the canonical harness. Runtime-specific configuration changes are refreshed by their adapter.

### Mode HELP

Explain this portable boundary and stop without changing anything.

## Runtime bindings and renderer composition

- `ki-binding-claude` owns Claude Code, Desktop, Cowork, web convention, and the plugin builder.
- `ki-binding-codex` owns Codex TOML comparison and the merge-safe native renderer.
- `ki-binding-chezmoi` composes this root with `ki-repo-dotfiles-chezmoi` for a renderer-specific source-repository path.
