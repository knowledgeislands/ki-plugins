---
name: ki-repo-checkpoints
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
owns: ['+/_CHECKPOINTS/']
description: >
  Governs concise, repository-owned checkpoints for resuming one human-named active thread in a fresh agent context without a transcript or vendor session. Use when asked to checkpoint current work, update or retire a checkpoint, resume a named thread, audit `+/_CHECKPOINTS/`, or explain portable reconstruction state. It keeps one active snapshot per thread, retains explicit retired evidence, and leaves decisions, roadmap state, knowledge, recap, runtime hooks, and session continuity to their proper owners.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh | resume <thread> | retire <thread> | update <thread>'
---

# Knowledge Islands portable checkpoints

This governance skill owns the portable checkpoint contract: one concise repository record lets a fresh agent reconstruct an active human-named thread without claiming access to the original conversation. Read [the checkpoint standard](references/standards-checkpoints.md) before reading, creating, updating, or retiring a record; [the generated rubric](references/rubric.md) publishes its mechanical and judgment criteria, and [the sources](references/sources.md) record the contract's provenance.

## Shared model

- **Active record** — one regular Markdown file at `+/_CHECKPOINTS/<thread>.md`, where `<thread>` is the user-selected portable name. Updating replaces this snapshot in place; Git supplies history.
- **Retired record** — an explicitly moved record at `+/_CHECKPOINTS/_RETIRED/<thread>.md`. It remains recovery evidence but is never selected for resume.
- **Reconstruction, not continuity** — a checkpoint carries only enough state for a fresh agent to continue. It is never a transcript, vendor-session identifier, conversation locator, completion signal, roadmap, decision log, or memory system.
- **Explicit write authority** — create or update only at the user's request or a documented repository-local trigger. Retire only on explicit user direction after durable facts have reached their canonical owners. When the selected thread or content is uncertain, do not write.

`ki-recap` remains the user-facing judgment-led session summary. Runtime-specific discovery and Stop-hook adapters are optional consumers of this contract and cannot invent, select, update, or retire a record outside these rules.

## Operating modes

The skill carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes and the operational **RESUME · RETIRE · UPDATE** modes. Invoked as `help` / `-h` / `?`, it emits generated HELP and stops. With no recognised mode, it emits the same HELP and, only in an interactive session, offers the mode choice and prompts for any target shown in `argument-hint`.

### Mode AUDIT

Run `ki repo audit --skill ki-repo-checkpoints --repo <repo>`. The structured catalogue treats an absent `_CHECKPOINTS` subarea as not applicable; otherwise it checks the flat active and retired layouts, filenames, closed metadata, timestamp chronology, exact heading set, non-empty sections, single-record lifecycle, and mechanically recognisable transcript or session dependencies. Then review the judgment aspects: whether each snapshot is concise and current, its thread name is human-selected rather than runtime-derived, its durable facts already live with their proper owners, and it would reconstruct the work for a fresh agent.

### Mode CONFORM

Run AUDIT first, then `ki repo conform --skill ki-repo-checkpoints --repo <repo> --dry-run`. CONFORM may publish the generated rubric but never creates a checkpoint or directory, chooses a thread, edits authored checkpoint content, moves a record, infers completion, or writes a runtime-session identifier. Correct records only through an explicit UPDATE or RETIRE request, then re-run AUDIT.

### Mode EDUCATE

Run `ki repo educate --skill ki-repo-checkpoints --repo <repo>` to render the concern and rubric. Explain the exact record form and lifecycle from [the checkpoint standard](references/standards-checkpoints.md); do not create a declaration, directory, or checkpoint merely to demonstrate it.

### Mode HELP

Explain the active/retired layout, manual resume flow, explicit write boundary, and off-ramps to `ki-recap`, roadmap or knowledge owners, and optional runtime adapters, then stop without reading or changing repository state.

### Mode REFRESH

REFRESH writes only this skill's canonical files in `ki-agentic-harness`. When invoked from an installed copy, stop and redirect to the harness. Read [the sources](references/sources.md), reconcile real portable use and companion contracts against the standard and structured catalogue, and confirm before changing the record schema, authority boundary, or lifecycle.

### Mode RESUME

Require the user-selected `<thread>`, resolve only `+/_CHECKPOINTS/<thread>.md`, and read it in full. Verify that the filename, `thread`, H1, and `state: active` agree before using `Next step` to continue in the fresh context. Never fall back to `_RETIRED`, search by a vendor identifier, or claim to reopen the original session. If the named active record is absent or invalid, stop and report the exact problem.

### Mode RETIRE

Require explicit user direction and one valid active `<thread>` record. Confirm that durable decisions, work status, and knowledge have reached their canonical owners; then move the record to `_RETIRED/<thread>.md`, set `state: retired`, and add `retired_at` without rewriting its reconstruction content. Stop on uncertainty or a conflicting destination. Retirement preserves evidence but does not infer completion or impose deletion.

### Mode UPDATE

Require the user-selected `<thread>` plus an explicit request or documented local trigger. Write the exact active record structure from [the checkpoint standard](references/standards-checkpoints.md), preserving `created_at` on an existing record and advancing `updated_at`; replace the snapshot in place rather than appending history. Record only current reconstruction state and references to durable owners. Never manufacture decisions, copy a transcript, add a runtime-session identifier, or create a checkpoint from an unqualified Stop event.

## Verification boundary

The checker is read-only over checkpoint content. A runtime adapter may discover a user-selected active record, but it remains a consumer: it cannot weaken the state, selection, write-authority, or no-session-continuity contract.
