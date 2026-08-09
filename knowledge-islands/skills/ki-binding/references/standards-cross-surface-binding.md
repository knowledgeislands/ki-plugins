# Canonical MCP binding standard

The portable contract is one `mcpServers:` YAML inventory at `$XDG_CONFIG_HOME/ki/mcp-servers.yaml` (default `~/.config/ki/mcp-servers.yaml`). `$KI_MCP_SOURCE` may explicitly override that path.

Every entry has a unique `name`, a non-empty `clients:` list, and either a `command` or `url` server definition. Recognised client tokens are `mcporter`, `claude-code`, `claude-desktop`, and `chatgpt-codex`. Tokens let one portable source declare intent; they do not make this root owner of each vendor's file format.

`ki-binding` compares the vendor-neutral mcporter projection against entries targeting `mcporter`. `ki-binding-claude` owns Claude Code, Desktop, Cowork, and web convention. `ki-binding-codex` owns native Codex TOML. A renderer such as `ki-binding-chezmoi` owns its own source-repository/template evidence but neither multiplies into vendor-specific renderer skills nor replaces a client adapter's native merge boundary.

Edits flow through the canonical source and its selected renderer or adapter. Never hand-edit a rendered target as a substitute for changing its source.
