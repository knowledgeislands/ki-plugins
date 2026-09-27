# The auto-memory standard

_A bounded local-format standard for `ki-housekeeping-claude`. Native Claude settings establish the memory location; Headroom-rendered output is separate evidence and does not establish native selection or loading. Recorded source decisions and dates are tracked in [sources.md](sources.md)._

## Contents

- [Layout](#layout)
- [Repair boundary](#repair-boundary)
- [`MEMORY.md`](#memorymd)
- [Repairing a regenerated cross-repo learned pattern](#repairing-a-regenerated-cross-repo-learned-pattern)
- [`memory/*.md` frontmatter](#memorymd-frontmatter)
- [What does not belong in a memory](#what-does-not-belong-in-a-memory)

## Layout

```text
~/.claude/projects/<slug>/memory/
├── MEMORY.md          # index — always loaded into context
├── <topic-a>.md        # one memory file per topic
└── <topic-b>.md
```

`<slug>` is the repo's absolute path with every `/` replaced by `-` (the same convention Claude Code uses for its project transcript directories).

## Repair boundary

KI policy keeps agent-local auto-memory off by default. Set `autoMemoryEnabled: false` in reviewed, chezmoi-managed user settings. For a deliberate one-project opt-in, set `autoMemoryEnabled: true` in that repository's `.claude/settings.local.json`; a reviewed shared `.claude/settings.json` also scopes the opt-in to that project. Project-local settings outrank shared project settings, which outrank user settings. Managed settings and session `--settings` can outrank all three; confirm the effective setting with Claude Code `/status` when either applies. `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` disables memory even for an opted-in project, while `=0` forces it on despite `autoMemoryEnabled: false`. A shell environment override takes precedence over a settings `env` value. Do not use `=0` as a global opt-in.

The reviewed user setting is `{"autoMemoryEnabled": false}`. A deliberate per-project opt-in sets `auto_memory = "enabled"` in that repository's `.ki.toml` and `{"autoMemoryEnabled": true}` in its `.claude/settings.local.json` (or a reviewed shared `.claude/settings.json`). Keep the local file untracked and verify the effective state with `/memory` or `/status` before relying on it.

The checker resolves the readable user, shared project, and project-local settings and the visible `CLAUDE_CODE_DISABLE_AUTO_MEMORY` override. A repository declaring `[skills.ki-housekeeping-claude]` sets `auto_memory = "transition"` during reconciliation, `"disabled"` afterward, or `"enabled"` for an explicit project opt-in; absence is a FAIL even though the checker treats it as disabled for bounded inspection. This KI lifecycle value is separate from Claude's boolean `autoMemoryEnabled`. Transition temporarily permits legacy enabled memory without a project opt-in, but SELECT-2 always warns until the transition is closed. Disabled KI policy makes index/file criteria not applicable even when effective Claude memory remains enabled; that runtime mismatch fails SELECT-1. An existing selected memory directory under omitted or disabled KI policy warns at SELECT-2 even when it contains no Markdown files. Enabled memory passes SELECT-1 only with policy enabled and a project-scoped Claude opt-in, or during transition.

The selected directory is Claude's documented default `.claude/projects/<selected-repository-slug>/memory` unless a contained `autoMemoryDirectory` override selects another; Claude requires that override to be absolute or start with `~/`. Malformed settings, unsupported values, and out-of-bounds overrides fail selection. The checker cannot prove a managed or `--settings` override from repository files; verify those in the running Claude session. Once selected, it never enumerates or reports foreign project memories and never follows a symlinked Claude root, selected directory, memory file, or `MEMORY.md`.

Two repairs are safe enough to propose through one operation-scoped draft: align a frontmatter `name` to an already-safe kebab-case physical filename, and append a contained unindexed memory file to an existing physical `MEMORY.md`. The host validates and publishes the coalesced proposal.

Creating a missing index, renaming memory files, removing dangling entries, deduplicating names, changing content doctrine, editing generated Headroom data, promoting content, and deleting files or database records remain manual.

Neither disabling memory nor CONFORM creates an empty `MEMORY.md` or deletes existing memories. In transition, inspect existing notes and route durable value through reviewed repository guidance or KB intake and approval. Keep the source files until that reconciliation is approved and safely completed; only then change `auto_memory` to `"disabled"`. For omitted policy with no memory directory, explicitly declare `"disabled"` after checking the selected location. Under omitted or disabled policy, an existing selected directory warrants review even if empty: decide whether to opt in explicitly or reconcile and retire it through a separate approved action. The KB's tracked `Admin/MEMORY.md` is a repository index, not Claude auto-memory, and remains in place.

## `MEMORY.md`

An index, not a memory: one line per memory file, in this exact shape —

```markdown
- [Title](filename.md) — one-line hook
```

- The checker reports the aggregate UTF-8 bytes in the index but does not infer a native effective loading limit from an individual line or local file size.
- Organized **semantically by topic**, not chronologically.
- May carry a trailing Headroom-managed block, verbatim:

  ```markdown
  <!-- headroom:learn:start -->

  ## Headroom Learned Patterns

  _Auto-generated by `headroom learn` on YYYY-MM-DD — do not edit manually_

  <!-- headroom:learn:end -->
  ```

  If present, both markers must appear, in order, with the generated date line between them. The renderer may use either Markdown emphasis marker (`_` or `*`) for that line.

## Repairing a regenerated cross-repo learned pattern

The rendered block proves only that text exists in `MEMORY.md`; it does not prove a Headroom installation, version, database, configured sweep, or executed command. When separately authorized runtime evidence identifies a stale source record, edit or clear neither the rendered block nor an unverified database blindly: the next learn sweep can render it again. Use the recorded Headroom procedure only after independently confirming the selected database and runtime authority:

1. Choose the database explicitly. Headroom defaults to `./.headroom/memory.db` when that project store exists and otherwise falls back to `~/.headroom/memory.db`, so a command run from the wrong directory can inspect or mutate the wrong store. Check the plausible project and global paths, then use `--db-path` on every command.
2. Locate the USER-scope memory using distinctive text, then inspect the full record before deletion:

   ```bash
   headroom memory list --db-path /absolute/path/to/memory.db --scope USER --search 'distinctive text'
   headroom memory show --db-path /absolute/path/to/memory.db <id>
   ```

3. Only after the ID, content, scope, and database are confirmed, delete that record:

   ```bash
   headroom memory delete --db-path /absolute/path/to/memory.db <id> --force
   ```

Use `--force` only after the preceding `show`; omitting it keeps Headroom's interactive confirmation. Repeat `memory show` and the scoped `memory list` query against the same explicit database to confirm the ID is absent, then use `ki-housekeeping-claude` CONFORM to clear the already-rendered stale line. After the next configured learn sweep writes its output, rerun `ki-housekeeping-claude` AUDIT and require IDX-6 not to recur. If that sweep is invoked manually with `headroom learn`, include `--project <repo> --apply` and confirm its target first — `headroom learn` without `--apply` is a dry run. Re-learning in the correct repository may be appropriate when the pattern itself is useful there, but it does not substitute for deleting a globally scoped stale source that keeps leaking elsewhere.

## `memory/*.md` frontmatter

```yaml
---
name: short-kebab-case-slug
description: one-line summary
metadata:
  type: user # or feedback, project, reference
---
```

- `name` must match the filename (minus `.md`), kebab-case.
- `description` is a one-line summary used to judge relevance in a future conversation — must be specific, not generic.
- `metadata.type` is exactly one of the four documented types:
  - **user** — role, goals, responsibilities, knowledge.
  - **feedback** — corrections and confirmations about how to approach work; body structured as the rule, then **Why:** and **How to apply:** lines.
  - **project** — ongoing work, goals, decisions, incidents; body structured the same way, with relative dates converted to absolute ones at save time.
  - **reference** — pointers to where information lives in external systems.
- Body may link to other memories with `[[name]]`, where `name` is the target's `name:` slug. A `[[name]]` with no matching file is a valid forward reference, not an error — the doctrine explicitly allows marking something worth writing later.

The checker parses this frontmatter as YAML and fails malformed mappings instead of silently skipping them.

## What does not belong in a memory

Per the auto-memory doctrine: code patterns/conventions/architecture/file paths (derivable from the repo), git history, debugging recipes, anything already in a `CLAUDE.md`, and ephemeral in-progress task state. Content that turns out to belong in a `CLAUDE.md` should be **promoted there and the memory deleted** — not left to duplicate it indefinitely.
