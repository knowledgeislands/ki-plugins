# Knowledge promotion

Useful knowledge starts as a local observation and becomes durable only when its scope and evidence warrant it.

This is a manual routing standard, not a transcript miner or a reason to create a new guide area.

## Placement ladder

Choose the narrowest durable home that reaches the people and agents who need the knowledge.

| Place | What belongs there | Promotion evidence | Durable destination | Reconciliation |
| --- | --- | --- | --- | --- |
| Session context | Tentative observations and the current work state | It remains useful after the session, or recurs in another task | Promote using the rows below; do not treat runtime memory as the canonical record | Leave transient context behind once its durable owner exists |
| Runtime memory | A stable personal fact or retrieval aid for one runtime, not a standing repository rule | It is useful beyond the session but is neither shared governance nor synchronised personal configuration | The selected runtime's memory, where that runtime supports it | Remove a repository copy unless the repository independently needs the rule |
| Repository orientation | A standing rule needed for most work in one repository | It is always-on, stable, and repository-wide | Portable guidance in `AGENTS.md`; runtime-specific guidance only in that runtime's file, such as `CLAUDE.md` | Replace lower-layer copies with a concise pointer or remove them |
| On-demand guide | A bounded procedure with a known reader that need not be loaded every session | A repeatable task needs detail but not standing context | An existing appropriate `docs/guides/` area | Keep orientation to a one-line pointer; do not create a guide area by default |
| Shared standard or reference | A rule, source, decision, or method used by more than one repository or skill | It has cross-repository reach, is normative, or needs authoritative provenance | The owning `ki-*` skill's standard/reference, a decision record, or a source list | Replace repository copies with a pointer to the shared owner |
| Reusable skill | A reusable agent operation that needs selection-time discovery, a procedure, or a checker | The same operation recurs across contexts and has a clear capability owner | The owning skill and its supporting references | Keep the standard normative; make the skill point to it rather than duplicate it |
| Personal cross-project configuration | A durable user preference or machine convention, not a repository rule | It applies across repositories for one user | The user's synchronised configuration | Remove repository copies unless the repository has an independent reason to state it |
| Roadmap or plan | Unfinished work, a dependency, or a future decision | It needs prioritisation or execution, not merely recall | The owning repository's roadmap or plan | Do not disguise open work as a convention or memory |

## Promotion loop

1. Capture the observation with enough context to judge it, but do not make a durable write by default.
2. Classify its scope: session, repository, shared governance, reusable operation, personal configuration, or unfinished work.
3. Test the evidence in the placement ladder and choose one owner.
4. Write or update that owner only with the appropriate confirmation and verification.
5. Reconcile the source layer: remove a duplicate, replace it with a pointer, or explicitly retain it only when it serves a different audience.
6. Revisit the placement when its scope changes; promotion is not a reason to preserve obsolete lower-layer copies.

## Boundaries

- `AGENTS.md` holds portable repository guidance; runtime files hold only genuinely runtime-specific detail.
- A reference holds the detailed rule or evidence; a skill owns reusable execution. Neither should restate the other wholesale.
- Existing guides are destinations when appropriate; this process does not automatically invent documentation structures.
- User confirmation governs durable learning writes. This standard decides where an approved learning goes; it does not grant permission to write it.
