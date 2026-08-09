# Mode CONFORM — repair bounded Claude state

_On-demand procedure for `ki-housekeeping-claude` CONFORM. The domain and auto-memory model live in [`SKILL.md`](../SKILL.md) and its standards._

1. Run [AUDIT](mode-audit.md).
2. Run `ki repo conform --skill ki-housekeeping-claude` to propose only the two safe repairs in the selected repository's physical memory directory: aligning a frontmatter name with its contained physical filename and appending an unindexed contained memory file to an existing physical MEMORY.md. The host validates and publishes the shared-session proposal.
3. Fix other memory findings deliberately. Dangling-entry removal, incomplete frontmatter, duplicate names, malformed generated markers, promotion and deletion, and Headroom database deletion remain manual because they require content or destructive judgment.
4. Use the paired server's access-gated cleanup tools for non-memory areas. Confirm destructive targets immediately before acting.
5. Re-run [AUDIT](mode-audit.md) until clean.
