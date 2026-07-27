# Lifecycle procedure

_On-demand procedure for `ki-plan`'s sub-commands. The preflight, invocation, and composition-on-`ki-roadmap` model live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the sub-command procedure only._

Split the argument on the first space to get **sub-command** and **rest**. The lifecycle verbs are `ready`, `execute`, `accept`, `done`, `prune`, `new`, `promote`, and `status`. `ready` and `execute` parse `rest` as one or more whitespace-separated canonical plan identifiers; every other identifier-taking verb accepts exactly one.

A coherent batch of related plan edits may share one explicit-path commit, including a batch status transition, the same correction across several plans, or a selected prune batch. Keep unrelated plan work in separate commits.

## Contents

- [`accept <THEME>-<NNN>`](#accept-theme-nnn)
- [`done <THEME>-<NNN>`](#done-theme-nnn)
- [`ready <THEME>-<NNN>...`](#ready-theme-nnn)
- [`prune [theme]`](#prune-theme)
- [`execute <THEME>-<NNN>...`](#execute-theme-nnn)
- [`new <theme> <title>`](#new-theme-title)
- [`promote`](#runtime-binding-promote)
- [`status [theme]`](#status-theme)
- [Mandate](#mandate)

## `accept <THEME>-<NNN>`

1. Require the thematic profile. Parse the plan identifier as an uppercase theme code plus a zero-padded numeric serial, `<THEME>-<NNN>`. Locate the one `<THEME>-<NNN>-*.md` under the corresponding theme's `plans/` directory; stop on zero or multiple matches. Require `status: in-progress` and a canonical `Blocking` or `Next` item; a plan already in `acceptance` is shown as pending review, and an open plan must first be readied and executed.
2. Run the read-only `ki-roadmap` audit and continue only with zero FAIL and zero WARN. Require every `## Steps` item to be marked complete. Re-run the plan's `## Verify` checks now and retain each concrete command, result, and the checked commit or other evidence revision; stop if any check fails or cannot be evidenced. Confirm that every qualified `blocked-by` plan is done.
3. Append one non-empty `## Acceptance` section after an optional `## Delegation` section, or after `## Dependencies / blocks` when delegation is absent, then set `status: acceptance` in the same guarded plan transaction used for execution progress. Use H3 subsections, once and in this order: `Delivered`, `Summary of changes`, `Verification`, `Outstanding concerns`, and `Mini recap`. The summary names material changes and useful primary paths; verification records step 2's commands, outcomes, and evidence revision; concerns record open questions or `None`; the mini recap records learning plus any proposed route. The mini recap is plan-scoped review evidence, not approval to write its learning anywhere else.
4. Run the read-only roadmap audit again. Present the packet to the user, then emit this shared completion banner and stop. Do not close the plan, remove its roadmap item, infer acceptance from silence, or promote a proposed learning into a guide, rubric, agent, hook, memory, or another durable home.

   ```text
   +------------------------------+
   | COMPLETE! \o/                |
   | Ready for acceptance review. |
   +------------------------------+
   ```

If acceptance analysis later changes only the packet's prose, run the applicable documentation and roadmap checks and retain the recorded implementation evidence. Re-run the plan's full Verify checks only when the implementation, verification scope, or relevant environment has materially changed, or when the user explicitly asks for fresh full verification.

## `done <THEME>-<NNN>`

1. Require the thematic profile. Parse the plan identifier as an uppercase theme code plus a zero-padded numeric serial, `<THEME>-<NNN>`. Locate the one `<THEME>-<NNN>-*.md` under the corresponding theme's `plans/` directory; stop on zero or multiple matches. Require `status: acceptance` and a valid non-empty `## Acceptance` packet.
2. Require the user's explicit acceptance in the current conversation. Never infer it from the plan's status, verification results, elapsed time, or a missing objection. If the user asks for a change or declines acceptance, return the materially revised plan to `open` through the guarded transaction. Retain and refresh its one acceptance packet only when it next reaches acceptance.
3. Run the read-only `ki-roadmap` audit and continue only with zero FAIL and zero WARN. Read the plan and resolve its qualified `roadmap: <theme>/<item-slug>` locator to exactly one `Blocking` or `Next` item in `docs/roadmap/<theme>/ROADMAP.md`; stop on any mismatch or ambiguity.
4. Prepare, without writing, the plan with `status: done` and one non-empty terminal `## Done` H2 after its acceptance packet. The outcome says what completed, records any residual concern or `None`, and names any intended follow-up. Keep its canonical item, local reference, dependency edges, and root portfolio unchanged.
5. Snapshot the exact bytes of the plan and canonical theme roadmap. Immediately before writing, re-resolve every path component, rerun the clean read-only audit, and require every snapshot to remain byte-for-byte unchanged.
6. Materialise only the plan as a regular same-directory temporary file. Replace it only while its current bytes still match its snapshot. Run the read-only audit again; success requires zero FAIL and zero WARN, the retained canonical item and local reference, and a valid terminal done outcome.
7. If publication or the post-write audit fails, restore only transaction-owned changes and only while each current artifact still equals the bytes written by this transaction. If concurrent change prevents safe rollback, stop and report the exact conflict instead of overwriting it.
8. Commit the done record as an explicit-path commit, then report: "Plan `<THEME>-<NNN>` recorded done after manual acceptance; prune later when the work tranche is complete."

## `ready <THEME>-<NNN>...`

1. Require the thematic profile. Parse one or more distinct canonical `<THEME>-<NNN>` identifiers and locate exactly one corresponding plan per identifier; stop on zero or multiple matches, duplicates, or an empty batch. Require every selected plan to have `status: open` and resolve its canonical roadmap item. Every selected item must be in `Blocking` or `Next`; an open plan with `transferred-from` at another horizon preserves detail but is not ready, so report the required authored horizon move and stop without changing the plan or item. A `ready`, `in-progress`, `acceptance`, or `done` plan is reported at its current gate and is not silently moved.
2. Require the user's explicit current-conversation approval for the exact selected batch. Approval to create, edit, or inspect plans is not readiness approval. Run the read-only `ki-roadmap` audit and continue only with zero FAIL and zero WARN. Confirm every qualified `blocked-by` plan in the batch is done.
3. Snapshot every selected plan and its canonical theme-roadmap local reference, deduplicating shared roadmaps. Prepare only each `status: ready`; retain every plan body, canonical item, local reference, root projection, and dependency edge unchanged. Revalidate the clean audit and every snapshot immediately before writing, then publish every status replacement as one guarded transaction. If any selected plan is ineligible, changed concurrently, or cannot publish, restore only transaction-owned writes and leave the whole batch untransitioned.
4. Run the audit again, commit the full ready batch once, and report that the selected plans are eligible for `execute`. A one-plan invocation is the same operation with a batch of one.

## `prune [theme]`

1. Require the thematic profile. With a theme argument, require lowercase kebab-case and one existing canonical theme; with no argument, scope the full thematic set. Run the read-only `ki-roadmap` audit and continue only with zero FAIL and zero WARN.
2. Discover only in-scope plans with `status: done`, each with a valid terminal `## Done` outcome, a canonical local reference, and a matching `Blocking` or `Next` item. Require every candidate to be tracked, clean against `HEAD`, and have a committed history entry. Do not repair malformed state, infer a candidate, or include an open, ready, in-progress, or acceptance plan. Report every eligible `<THEME>-<NNN>` and its roadmap locator, plus every excluded plan with its exact diagnostic; stop without writing if no candidate is eligible.
3. Present the candidate list and stop for the user's explicit current-conversation confirmation of precisely that list. Never prune from a bare command, silence, or a changed candidate set. On confirmation, rerun discovery and require the same list and exact snapshots; otherwise stop and show the changed or unsafe paths.
4. Prepare one transaction: remove each selected plan and its canonical item plus local reference; remove every selected identifier from remaining `blocks` / `blocked-by`; regenerate root `ROADMAP.md`; retain non-selected plans and all authored item prose. If any selected item, dependency, path component, plan record, or snapshot is malformed or concurrently changed, leave it untouched and stop with that exact diagnostic.
5. Materialise regular same-directory temporary files. Replace only byte-unchanged affected roadmaps, plans, and root projection; remove a selected plan only while its bytes match its snapshot. Run the read-only audit again; success requires zero FAIL and zero WARN, no selected canonical item/reference/dependency edge, and an exact generated root projection.
6. On any failure, restore only transaction-owned files while their current bytes still match the bytes this transaction wrote. Restore a removed plan only with an exclusive create. If safe rollback cannot proceed, stop and report the conflict. Commit the successful prune batch separately from every done transition.

## `execute <THEME>-<NNN>...`

1. Require the thematic profile. Parse one or more distinct canonical `<THEME>-<NNN>` identifiers and locate exactly one corresponding plan per identifier; stop on zero or multiple matches, duplicates, or an empty batch. Require every selected plan to have `status: ready` and a canonical `Blocking` or `Next` item; an open plan must first receive readiness approval, which cannot happen while a transferred plan remains at another horizon.
2. Require the user's explicit current-conversation coordinated start for the exact selected batch. Run the read-only `ki-roadmap` audit and continue only with zero FAIL and zero WARN. Read every selected plan and verify that every qualified `blocked-by` reference resolves to a done plan in the canonical thematic plan files.
3. Resolve `HEAD` to its full lowercase commit object ID and retain that immutable value for the batch. Snapshot every selected plan and its canonical theme-roadmap local reference, deduplicating shared roadmaps. Require each selected plan's `baseline-ref` to be `—`, then prepare only `status: in-progress` and `baseline-ref: <HEAD-commit-id>`; retain every plan body, canonical item, local reference, root projection, and dependency edge unchanged. Revalidate the clean audit, the unchanged `HEAD`, and every snapshot immediately before writing, then publish every status-and-baseline replacement as one guarded transaction. If any selected plan is ineligible, changed concurrently, or cannot publish, restore only transaction-owned writes and leave the whole batch at `ready` with `baseline-ref: —`. Run the audit again, then commit the full start batch once.
4. Work each plan's `## Steps` sequentially after the shared start. Mark each completed instruction with `✓` (or a `- [x]` checkbox); commit independently verified progress as it occurs, so each plan remains recoverable. Where a plan carries `## Delegation`, execute its recorded rounds through `ki-delegate`: keep worker scopes exclusive, gate each round before dispatching the next, and retain orchestrator review and final verification.
5. When all steps in a plan are done and its Verify checks pass, run `accept <THEME>-<NNN>` for that plan. Stop after presenting its packet; only a later explicit user acceptance permits `done <THEME>-<NNN>` to record its retained completion outcome. A separate later `prune` removes selected done records and canonical items.

## `new <theme> <title>`

Enter the host runtime's non-writing planning/review surface if it has one; otherwise review the proposed artifact in conversation before writing. Then:

1. Parse `<theme>` as the first token of `rest`; require it to match `^[a-z0-9]+(-[a-z0-9]+)*$`. If the repository is in the simple profile, stop without writing and tell the user to run `/ki-roadmap expand <theme>` first.
2. Require an existing canonical `docs/roadmap/<theme>/ROADMAP.md` in the thematic profile and read its stable uppercase `code`. Confirm the exact qualified `roadmap: <theme>/<item-slug>` locator this plan executes. An ordinary new plan must resolve to one `Blocking` or `Next` item in that theme roadmap. When the current request is explicitly preserving already-transferred execution detail, the locator may instead resolve to an item in any honest horizon; confirm a non-empty origin string for `transferred-from`, retain `status: open`, and do not present creation as readiness approval. Confirm `blocks` / `blocked-by` (`<THEME>-<NNN>` plan identifiers or `—`). Infer from context and confirm; do not ask for a phase.
3. Run the read-only `ki-roadmap` audit and continue only with zero FAIL and zero WARN. Read every plan under every theme to validate identifiers and the dependency graph. Next id = the selected theme code plus its highest validated serial + 1, zero-padded to at least three digits; use `<THEME>-001` if that theme has no plans. Stop on malformed ids, duplicate identifiers, broken links, or dependency drift.
4. Derive the lowercase hyphenated `<slug>` from the remaining title, no longer than 50 characters. If the theme's `plans/` directory is absent, create it only after revalidating the canonical theme directory, then validate the new directory immediately. Prepare `docs/roadmap/<theme>/plans/<THEME>-<NNN>-<slug>.md` using `ki-roadmap`'s plan format with `status: open` and `baseline-ref: —`; include the confirmed `transferred-from` only when step 2 established transferred provenance. Add the canonical final `**Plan:** [<THEME>-<NNN>](plans/<THEME>-<NNN>-<slug>.md)` line on the selected roadmap item. Fill Steps with concrete, checkable actions; fill the rest from context, marking genuine gaps `<!-- TODO -->`. When planned execution needs workers, include `## Delegation` with classified rounds, bounded worker/file scopes, and gates; otherwise omit it.
5. Immediately recheck the audit baseline and id allocation, publish the absent destination with an exclusive create, and update the byte-unchanged selected theme roadmap without clobbering concurrent changes. Run the read-only audit again; on failure, roll back only transaction-owned bytes and a transaction-created empty `plans/` directory.
6. Tell the user the plan is written; exit the host planning surface. Do **not** begin implementation — that is `execute`.

## Runtime binding: `promote`

`promote` is deliberate and Claude-Code-only. It consumes the current session token already substituted into `SKILL.md` and the v1 state written by `hooks/plan-stamp.sh`; it never searches for a recent plan, trusts scratch frontmatter as provenance, or falls back to another session. The governed repository plan is the canonical result; the authenticated scratch plan remains an untouched draft source throughout.

### 1. Authenticate the current scratch plan

1. Bind the current session id supplied by the always-loaded `SKILL.md`. Stop if its Claude Code placeholder remained unresolved or the value does not match `^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$`.
2. Resolve `$HOME/.claude/plans` physically. Require it to be an existing real directory. Require its `.state` child to be an existing real, non-symlink directory whose physical parent is exactly the resolved plans root.
3. Address only `.state/<current-session-id>`. Require the state directory and record to be owned by the current user and not writable by group or other. Require the record to be a real, non-symlink regular file. Read and retain its exact bytes, then parse it as JSON; a non-JSON or malformed record is a terminal promotion error.
4. Require exactly these keys and types: `version` equal to numeric `1`; string `session_id`, `plan_file`, and `cwd`; no missing or additional keys. Require `session_id` to equal the current session id and match the same allowlist.
5. Require `plan_file` to be absolute and to name an existing real, non-symlink regular file. Resolve its parent physically, require that parent to be contained by the resolved plans root, and reconstruct the physical file path from that parent plus its basename. Require the reconstructed path to equal the stored value byte-for-byte. Recheck the file immediately before reading it and retain its exact bytes.
6. Require `cwd` to be absolute and to name an existing directory whose physical resolution is byte-for-byte the stored value. Resolve its git root and require that physical root to equal the physical git root found by the skill's current-repository preflight. Stop if either directory is not in a git worktree or if the roots differ.

Do not read any other state file, scan `$HOME/.claude/plans`, select by modification time, accept user-supplied paths, or use the scratch file's editable `cwd` frontmatter as evidence. On any rejection, make no repository write.

### 2. Require and validate the thematic baseline

1. Reject a KB repository. Ask for or infer the intended safe kebab-case theme. If `ki-roadmap` identifies the simple profile, stop without a repository write and give the concrete route `/ki-roadmap expand <theme>`.
2. Require the physical git root to be a real, non-symlink directory. Walk `ROADMAP.md`, `docs`, `roadmap`, the selected theme, its `ROADMAP.md`, and any existing `plans` component one at a time. Every existing component must have the expected regular-file or directory type, must not be a symlink, and must resolve inside the physical git root. The selected theme and eventual filename components must match their safe grammars and contain no separator.
3. Run `ki repo audit --skill ki-roadmap --repo <git-root>`. Continue only with zero FAIL and zero WARN. Do not run CONFORM or repair unrelated roadmap state.
4. Parse every on-disk plan under `docs/roadmap/*/plans/`. Require every theme roadmap to declare a unique uppercase code, every plan id to match `^[A-Z][A-Z0-9]{1,7}-[0-9]{3,}$`, every filename id to equal its frontmatter id and theme code, and every identifier reference to be unique. Stop on malformed ids, duplicate identifiers, broken links, or dependency drift.
5. Parse every canonical theme roadmap. Require every qualified `<theme>/<item-slug>` locator to be unique, and require the selected theme's canonical roadmap and the root projection to agree exactly under the `ki-roadmap` projection contract.
6. Form the selected theme's serial sequence from validated on-disk filename/frontmatter ids. The candidate id is that theme code plus the maximum serial + 1, padded to at least three digits; use `<THEME>-001` when the selected theme has no plans.

### 3. Confirm the promoted artifact

1. Use the authenticated scratch bytes without changing the file. Confirm with the user a title, the safe kebab-case theme, an exact qualified `roadmap: <theme>/<item-slug>` locator, and a lowercase hyphenated slug no longer than 50 characters. Verify that the locator resolves to exactly one canonical item in that theme roadmap's `Blocking` or `Next` horizon. Theme, item slug, and plan slug must each match `^[a-z0-9]+(-[a-z0-9]+)*$` and contain no path separator.
2. Map the scratch material into the canonical Context, Current state, Steps, Files touched, Verify, and Dependencies / blocks sections. When the promoted plan intends delegation, add `## Delegation` with classified rounds, bounded worker/file scopes, and gates. Preserve its substantive content losslessly: reorganise and clarify, but do not silently discard unmatched constraints, decisions, or checks.
3. Set `status: open`, `blocks: —`, `blocked-by: —`, and `baseline-ref: —`. Promotion creates an independent plan and does not edit another plan to add reciprocal dependencies.
4. Rebuild the dependency graph from the validated plans plus this independent plan. Do not write yet.

### 4. Recheck and commit one no-clobber transaction

1. Snapshot the exact bytes of root `ROADMAP.md` and the selected `docs/roadmap/<theme>/ROADMAP.md`. Immediately before writing, securely re-read and revalidate the exact current-session state record, scratch path, scratch file, stored physical `cwd`, and repository identity; require the state and scratch bytes to equal the authenticated bytes. Rerun the clean read-only roadmap audit; re-resolve every existing destination component; reparse canonical theme roadmaps and on-disk plans; and recompute the selected theme's id sequence. Abort if any path, byte snapshot, parsed value, projection, or candidate id differs from the validated baseline.
2. Recheck the destination `<git-root>/docs/roadmap/<theme>/plans/<THEME>-<NNN>-<slug>.md` with `lstat` semantics. It must be absent, including no regular file, symlink, or dangling symlink. Create only a missing `plans` directory inside the already validated theme, then validate it immediately. The thematic profile and canonical theme roadmap must already exist.
3. Record whether the `plans` directory was created. Materialise the complete plan in a temporary regular file inside the safe plans directory, then publish it with an exclusive-create operation (`O_CREAT|O_EXCL`, or an atomic same-directory hard link that fails when the destination exists). Never use an overwrite-capable move or copy for the destination.
4. Before replacing the selected theme roadmap, require it and the root projection to remain byte-for-byte equal to their snapshots. Write the prepared local plan reference through a same-directory temporary file and atomic replacement. Record the exact bytes or digest written by this transaction. Do not rewrite the root projection during promotion.
5. Run the read-only roadmap audit again. Success requires zero FAIL and zero WARN, the destination and selected local plan reference to match, the generated root projection to remain exact, and the scratch, state, and root-roadmap bytes to remain untouched.
6. If publication, theme-roadmap replacement, or the post-write audit fails, roll back only transaction-owned changes: remove the new plan only after proving it is the file this transaction created; restore the prior selected theme roadmap only if its current bytes still equal the transaction-written bytes; and prune only an empty `plans/` directory created by this transaction. Never restore, replace, or remove the scratch, state, or root projection because promotion does not own them. If concurrent change prevents a safe rollback, stop and report the exact conflict instead of overwriting it.

Report the new plan path and leave implementation to `execute`.

## `status [theme]`

In the simple profile, print the root `ROADMAP.md` and report that the repository has no governed plan collection. In the thematic profile:

- With no theme, scan every canonical `plans/` directory and print active plans, retained completed records, and dependency edges derived from their frontmatter. If no plans exist, report "No plans."
- With a safe kebab-case theme, print that theme's canonical `docs/roadmap/<theme>/ROADMAP.md` followed by plans and dependency edges from that theme, including retained done records. Stop if the theme does not exist; do not silently fall back to the global view.
- Identify open transferred plans by their `transferred-from` origin and current horizon. When that horizon is not `Blocking` or `Next`, report that the plan preserves detail but is not ready.

## Mandate

For any multi-file or multi-step change in a non-KB repository, create a governed repository plan before touching code. If the repository uses the simple profile, first expand the relevant theme with `/ki-roadmap expand <theme>`. The plan is committed with the work — a recoverable, dependency-ordered record that survives context resets. Ordinary plans exist only for canonical thematic-roadmap `Blocking` or `Next` items under the near-horizon principle owned by `ki-roadmap`. The sole non-near exception is an open plan with a non-empty `transferred-from` origin that preserves already-transferred detail without implying readiness; it must move to Blocking or Next before `ready`.
