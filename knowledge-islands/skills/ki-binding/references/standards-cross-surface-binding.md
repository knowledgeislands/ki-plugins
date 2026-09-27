# Canonical MCP binding standard

The portable contract is one `mcpServers:` YAML inventory at `$XDG_CONFIG_HOME/ki/mcp-servers.yaml` (default `~/.config/ki/mcp-servers.yaml`). `$KI_MCP_SOURCE` may explicitly override that path.

Every entry has a unique non-empty `name`, a non-empty unique `clients:` list, and exactly one definition. A stdio definition is `command`, optional `args:` strings, and optional literal-string or 1Password-reference `env:` values. A URL definition is `url`, optional literal-string or 1Password-reference `headers:`, plus one `transports:` mapping for every targeted client: `http` or `sse` for `mcporter`, `claude-code`, and `claude-desktop`; `streamable_http` for `chatgpt-codex`. A 1Password reference is an exact `{ op: "op://..." }` mapping. Either definition may carry a `lifecycle` of `ephemeral` or `keep-alive` for renderers that manage connection retention. No other fields are portable. Recognised client tokens are `mcporter`, `claude-code`, `claude-desktop`, and `chatgpt-codex`.

`ki-binding` compares an explicitly selected, readable mcporter configuration with entries targeting `mcporter`; literal header values and lifecycle must match, while a secret-derived header value is checked only for non-empty presence and is never reported. Without that evidence, target and runtime parity are unavailable. `ki-binding-claude` owns Claude Code, Desktop, Cowork, and web convention. `ki-binding-chatgpt` owns native Codex TOML. A renderer such as `ki-binding-chezmoi` owns source-structure evidence, while render, apply, activation, and runtime health remain distinct evidence classes.

Edits flow through the canonical source and its selected renderer or adapter. Never hand-edit a rendered target as a substitute for changing its source.
