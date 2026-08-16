# The Claude housekeeping standard — hygiene of accumulated Claude state

What this skill governs, why, and how it splits work with the `mcp-claude-housekeeping` MCP server. The line-by-line checkable criteria are in [rubric.md](rubric.md); the memory area's file format is in [the auto-memory standard](standards-auto-memory.md).

## 1. The domain

Every Claude surface leaves state on the machine, and it accumulates: sessions pile up, artifacts and uploads are never garbage-collected, backups multiply, plugins and project caches go stale, and per-project auto-memory drifts from the code it describes. None of this is the repo's concern — it lives outside any repo tree — so no repo-structure skill governs it. This skill does: it owns the **standard** for what healthy accumulated state looks like, and the **judgment** to decide when state is obsolete, orphaned, or oversized.

The state spans three surfaces on macOS:

- **Claude Desktop / Cowork sessions** — `~/Library/Application Support/Claude/`, including `local-agent-mode-sessions/<account>/<workspace>/`.
- **Claude Code** — `~/.claude/` (projects, memory, plugins, cache, debug).
- **VSCode chat sessions** — `workspaceStorage/<id>/chatSessions/`.

## 2. The areas

| Area                    | Coverage                                                        | Mechanical arm       |
| ----------------------- | --------------------------------------------------------------- | -------------------- |
| **Sessions**            | Stored session transcripts; obsolete or superseded sessions     | Server               |
| **Artifacts / outputs** | Generated artifacts, uploads, and orphaned or oversized outputs | Server               |
| **Backups**             | Automatic backups that multiply without bound                   | Server               |
| **Plugins**             | Installed-plugin inventory and staleness                        | Server               |
| **Project cache**       | Per-project caches and debug info                               | Server               |
| **Native auto-memory**  | Selected local `memory/*.md` and `MEMORY.md` evidence           | Structured KI rubric |
| **Headroom output**     | Rendered `headroom:learn` block, when present                   | Structured KI rubric |

## 3. The skill↔server pairing

The mechanical arm is split by area, on one principle: **the skill is the standard and the judgment; the server is the tools.**

- For **native memory**, the skill governs the selected local format after readable native settings establish a contained directory. Its structured rubric never assumes a default when override evidence is missing or unsupported, does not follow symlinks, and never enumerates, reports, or writes a foreign project memory. No server tool is needed to read that bounded store.
- **Headroom output** is a separate rendered-file concern. Its markers and generation date can be checked locally, but they do not establish a Headroom version, installation, database, or executed learn operation.
- For **every other area**, the state lives in macOS application-support paths that may need dedicated, access-gated filesystem tools. The paired **`mcp-claude-housekeeping`** server is a source payload, not a claimed current runtime: source checkout, inventory declaration, client registration, access exposure, and executed audit are separate evidence. The skill reads a separately obtained audit report and applies judgment; it never re-implements the tools.

The server is governed as an MCP server by `ki-repo-mcp`; this skill is its standard-and-judgment counterpart. Neither owns the other: the server ships tools with no opinion on when to use them; the skill holds the opinion and no tools beyond the memory checker.

## 4. Boundaries

- **Not** a Knowledge Islands base's own memory cascade — a KB's root `Admin/MEMORY.md` indexing its Pillars is KB content read at session start (`ki-repo-kb`'s MEM-2), not machine state.
- **Not** the token cost of the standing-context surface — that is `ki-tokenomics`, which measures what the loaded surface costs per turn rather than the hygiene of what accumulates on disk.
- **Not** the MCP server's own code quality — that is `ki-repo-mcp`, which audits `mcp-claude-housekeeping` as server code.
