# Claude binding standard

`ki-binding-claude` owns only Claude-native surfaces after `ki-binding` has established the canonical MCP source.

- Claude Code and Claude Desktop are JSON MCP surfaces; full non-secret definitions are compared only when their physical files are readable. URL entries require the explicit Claude `http` or `sse` transport declared by the portable source.
- Cowork registration, installation, enablement, and loaded capability are separate states. This adapter does not alter Cowork settings until product-specific external-edit and next-launch authority is evidenced.
- claude.ai web has no local file contract. Treat it as an explicit convention, never a claimed render target.
- The Cowork plugin is generated from this harness into a separate marketplace checkout. It projects portable and Claude-compatible skills plus governance agents; it excludes skills whose `ki-supported-runtimes` omit `claude-code`. Host-local MCP servers do not run in Cowork's sandbox.
