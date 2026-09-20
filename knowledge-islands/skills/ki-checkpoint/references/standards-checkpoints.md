# Portable checkpoint standard

A checkpoint is a concise repository-owned reconstruction snapshot for one active human-named thread. It lets a fresh agent continue useful work without relying on a transcript, private runtime state, or a vendor session.

## Contents

- [Activation and ownership](#activation-and-ownership)
- [Record location and identity](#record-location-and-identity)
- [Exact record form](#exact-record-form)
- [Optional runtime reminder consumers](#optional-runtime-reminder-consumers)
- [Update lifecycle](#update-lifecycle)
  - [Recap-supplied hand-off evidence](#recap-supplied-hand-off-evidence)
- [Resume lifecycle](#resume-lifecycle)
- [Removal lifecycle](#removal-lifecycle)
- [Prohibited payloads and claims](#prohibited-payloads-and-claims)
- [Audit and conform boundary](#audit-and-conform-boundary)

## Activation and ownership

The capability is optional. A repository declares `ki-checkpoint` in `.ki.toml`; declaration requires the owned physical `+/_CHECKPOINTS/` subarea and exact `README.md` scaffold, retained even when no checkpoint records exist. `ki-repo` owns the generic `+/` scaffold and detects an undeclared specialist subarea, while `ki-checkpoint` alone interprets checkpoint records.

The repository owns its active checkpoint content. Explicit removal deletes a record after durable information has been routed; Git supplies any recovery history.

## Record location and identity

An active checkpoint is one regular Markdown file at `+/_CHECKPOINTS/<thread>.md`. There is no retired-record state or `_RETIRED` directory.

`<thread>` is a non-empty, human-selected single path component. It cannot be `.` or `..`, contain a path separator, or encode an opaque runtime-session identifier. The filename stem, `thread` field, and H1 must agree exactly. There is at most one active record for a thread; nested, timestamped, symlinked, archived, and alternate layouts are invalid.

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

Timestamps use UTC RFC 3339 second precision. `created_at` is no later than `updated_at`.

After frontmatter, the record uses exactly this heading sequence, with substantive content beneath every H2:

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

## Optional runtime reminder consumers

A runtime-specific reminder consumer is separately opt-in. It may act only when its native event contract is independently evidenced and all of the following are true:

1. The repository declares `ki-checkpoint` and resolves to one physical repository root.
2. The runtime adapter is explicitly enabled in that runtime's own configuration; the portable `ki-checkpoint` declaration remains an empty capability marker.
3. The adapter receives one exact, human-selected thread name from that explicit runtime configuration. It resolves only `+/_CHECKPOINTS/<thread>.md`; directory scans, newest-record selection, runtime-derived names, and archived or nested fallback are forbidden.
4. The resolved record is a regular active checkpoint that satisfies this standard's identity and closed-schema requirements.

The only first-delivery action is a compact reminder that the already-selected record may need an explicit update. The consumer does not create, update, remove, select, or reword a checkpoint; infer work status or completion; invoke `ki-recap`; read a transcript or vendor session; or expose a session identifier. Repeated, interrupted, malformed, unknown, absent, or otherwise unsafe input is a quiet no-op. The native runtime adapter owns its event semantics, registration, timeout, exit behaviour, and any actionable failure text; the portable contract supplies no shared hook or fallback.

## Update lifecycle

Create or update a checkpoint only on explicit user request or a documented repository-local trigger, such as before context compaction, after a substantive decision, after a repository commit, or before a known pause. A generic Stop event is not authority to create or choose a checkpoint.

An update replaces the active snapshot in place, preserves `created_at`, and advances `updated_at`. It never appends timestamped copies or transcript history. Git is the history mechanism.

Write durable decisions, accepted work state, or reusable knowledge to their proper owners before referring to them from a checkpoint. The checkpoint may name those canonical artifacts; it must not become their only copy.

### Recap-supplied hand-off evidence

An explicit `ki-recap checkpoint <thread>` invocation may supply grounded evidence to this update lifecycle. The composition does not grant write authority or weaken validation: the repository must declare a valid `ki-checkpoint` capability, the user must select exactly one human-named thread and explicitly authorise its update, and the checkpoint procedure must refuse any repository mismatch, stale baseline, ambiguous thread, interrupted update, or incomplete work state.

The supplied hand-off names the physical repository identity, immutable committed baseline or one complete portable patch against that baseline, scoped authority, result destination, and expected verification. A transcript, runtime session, shared filesystem, or provider snapshot may be available to the caller but is never required evidence and cannot replace those portable inputs. The checkpoint records concise reconstruction state and references to durable owners; it does not embed the patch, become the result store, or take ownership of the delegated work.

## Resume lifecycle

The manual portable flow is deliberately small:

1. Require the user-selected thread name.
2. Resolve only the exact active path.
3. Read the whole record and validate its identity and `state: active`.
4. Reconstruct the work from the six sections and continue from `Next step`.

Do not search archived or nested paths as a fallback. Resume creates a fresh working context; it does not reopen, locate, or authenticate to the conversation that produced the checkpoint.

## Removal lifecycle

Removal requires explicit user direction; an agent must not infer completion from record content, a quiet session, or a Stop event. First confirm durable facts reached their proper owners. Then delete the exact active file. Retain the exact `+/_CHECKPOINTS/README.md` scaffold while `ki-checkpoint` remains declared.

No retired copy is kept. Git is the recovery mechanism, so `_RETIRED`, archive, timestamped-copy, and other nested checkpoint layouts are invalid.

## Prohibited payloads and claims

A checkpoint contains reconstruction state, not a transcript. It has no vendor-session field, conversation URL, runtime identifier, message log, or role-by-role dialogue. Its prose must not claim that a future agent can access or reopen the originating session.

It is also not a completion signal, roadmap, decision record, knowledge store, or session recap. `ki-recap` owns the user-facing judgment-led recap; the relevant governance skill owns each durable artifact. An optional runtime reminder consumer may use only an already-selected valid record under [its explicit contract](#optional-runtime-reminder-consumers). It does not grant write authority, choose a thread, invoke recap, read session material, or turn a portable procedure into a native host operation.

## Audit and conform boundary

AUDIT, CONFORM, and EDUCATE are currently hosted `ki repo` operations. REMOVE, RESUME, and UPDATE remain explicit agent procedures until a host operation is implemented and independently verified. AUDIT requires the declared repository's physical checkpoint subarea and exact retained README scaffold. It reports absent scope as not applicable only when `ki-checkpoint` is undeclared, and rejects symlinks, unsupported nesting, and any retired-record layout.

CONFORM never authors checkpoint-record content or lifecycle transitions. It may create or restore the retained README scaffold and publish the generated rubric, but it cannot create, update, or remove a checkpoint record because those actions need a human-selected thread and explicit write authority.
