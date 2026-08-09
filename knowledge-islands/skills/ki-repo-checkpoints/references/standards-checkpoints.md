# Portable checkpoint standard

A checkpoint is a concise repository-owned reconstruction snapshot for one active human-named thread. It lets a fresh agent continue useful work without relying on a transcript, private runtime state, or a vendor session.

## Activation and ownership

The capability is optional. A repository declares `ki-repo-checkpoints` in `.ki-config.toml`; only then may it use the owned `+/_CHECKPOINTS/` subarea. `ki-repo` owns the generic `+/` scaffold and detects an undeclared specialist subarea, while `ki-repo-checkpoints` alone interprets checkpoint records. An absent `_CHECKPOINTS` directory is quiet and means there is no active checkpoint scope.

The repository owns its checkpoint content and retention. The portable standard neither writes a sibling repository nor imposes deletion.

## Record locations and identity

An active checkpoint is one regular Markdown file at `+/_CHECKPOINTS/<thread>.md`. A retired checkpoint is one regular Markdown file at `+/_CHECKPOINTS/_RETIRED/<thread>.md`.

`<thread>` is a non-empty, human-selected single path component. It cannot be `.` or `..`, contain a path separator, or encode an opaque runtime-session identifier. The filename stem, `thread` field, and H1 must agree exactly. There is at most one active record for a thread; nested, timestamped, symlinked, and alternate active layouts are invalid.

## Exact record form

An active record has exactly these frontmatter fields:

```yaml
---
type: ki-checkpoint
thread: portable-checkpoints
state: active
created_at: 2026-08-06T12:00:00Z
updated_at: 2026-08-06T14:30:00Z
---
```

A retired record has the same fields, changes `state` to `retired`, and adds `retired_at` as the retirement timestamp. Timestamps use UTC RFC 3339 second precision. `created_at` is no later than `updated_at`; `retired_at` is no earlier than `updated_at`.

After frontmatter, both states use exactly this heading sequence, with substantive content beneath every H2:

```markdown
# portable-checkpoints

## Objective

## Current state

## Decisions made

## Files touched

## Open questions

## Next step
```

The H1 repeats the thread name exactly. `Decisions made`, `Files touched`, and `Open questions` may say `None` when that is the truthful current state; an empty section is not a useful reconstruction snapshot.

## Update lifecycle

Create or update a checkpoint only at an explicit user request or a documented repository-local trigger, such as before context compaction, after a substantive decision, after a repository commit, or before a known pause. A generic Stop event is not authority to create or choose a checkpoint.

An update replaces the active snapshot in place, preserves `created_at`, and advances `updated_at`. It never appends timestamped copies or transcript history. Git is the history mechanism.

Write durable decisions, accepted work state, and reusable knowledge to their canonical owners first; the checkpoint records only the compact state and references needed to resume. When the thread name, current facts, or authority to write is uncertain, make no checkpoint change.

## Resume lifecycle

The manual portable flow is deliberately small:

1. Require the user-selected thread name.
2. Resolve only the exact active path.
3. Read the whole record and validate its identity and `state: active`.
4. Reconstruct the work from the six sections and continue from `Next step`.

Do not search `_RETIRED` as a fallback. Resume creates a fresh working context; it does not reopen, locate, or authenticate to the conversation that produced the checkpoint.

## Retirement lifecycle

Retirement requires explicit user direction; an agent must not infer completion from record content, a quiet session, or a Stop event. First confirm that durable facts have reached their proper owners. Then move the active file to `_RETIRED/<thread>.md`, change the state, and add `retired_at` without inventing a new summary.

A retired record is inspectable recovery evidence and never an active resume candidate. Repository policy may later retain, archive, or delete it, but this standard does not choose that policy.

## Prohibited payloads and claims

A checkpoint contains reconstruction state, not a transcript. It has no vendor-session field, conversation URL, runtime identifier, message log, or role-by-role dialogue. Its prose must not claim that a future agent can access or reopen the originating session.

It is also not a completion signal, roadmap, decision record, knowledge store, or session recap. `ki-recap` owns the user-facing judgment-led recap; the relevant governance skill owns each durable artifact. Optional runtime adapters may discover or update an already selected checkpoint only within this contract.

## Audit and conform boundary

AUDIT checks only the declared repository's physical checkpoint subarea. It reports absent scope as not applicable, rejects symlinks and unsupported nesting, and treats retired records as non-active.

CONFORM never creates content, selects a thread, repairs prose or metadata, moves or retires a record, or infers lifecycle state. Authored corrections require an explicit UPDATE or RETIRE operation because automation cannot safely supply reconstruction judgment.
