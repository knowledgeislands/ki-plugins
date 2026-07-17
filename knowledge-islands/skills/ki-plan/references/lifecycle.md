# Lifecycle procedure

_On-demand procedure for `ki-plan`'s sub-commands. The preflight, invocation, and composition-on-`ki-project-roadmap` model live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the sub-command procedure only._

Split the argument on the first space to get **sub-command** and **rest**. The lifecycle verbs are `done`, `execute`, `new`, `promote`, and `status`, in that order.

## `done <theme>/<id>`

1. Require the thematic profile. Parse the qualified plan reference as a safe kebab-case `<theme>` plus a zero-padded numeric `<id>` of at least three digits. Locate the one `<NNN>-*.md` under `docs/roadmap/<theme>/plans/` whose numeric prefix matches `<id>`; stop on zero or multiple matches.
2. Run the read-only `ki-project-roadmap` audit and continue only with zero FAIL and zero WARN. Read the plan and resolve its qualified `roadmap: <theme>/<item-slug>` locator to exactly one `Blocking` or `Next` item in `docs/roadmap/<theme>/ROADMAP.md`; stop on any mismatch or ambiguity.
3. Prepare, without writing, the canonical theme roadmap with that item removed, every affected plan with `<theme>/<id>` removed from `blocks` / `blocked-by`, the regenerated root `ROADMAP.md` projection, and `docs/roadmap/README.md` with the plan row and every dependency edge referencing `<theme>/<id>` removed. Treat the closing plan's deletion as part of the same transaction; `status: done` is transient and need not be published separately.
4. Snapshot the exact bytes of the closing plan, every affected plan, the canonical theme roadmap, root projection, and global index. Immediately before committing, re-resolve every path component, rerun the clean read-only audit, and require every snapshot to remain byte-for-byte unchanged.
5. Materialise all replacement files as regular same-directory temporary files. Replace the affected plans, theme roadmap, root projection, and global index only while their current bytes still match their snapshots, then remove the closing plan only while its bytes still match its snapshot. Run the read-only audit again; success requires zero FAIL and zero WARN, no remaining canonical item or plan/index/dependency reference, and an exact generated root projection.
6. If any publication or the post-write audit fails, restore only transaction-owned changes and only when each current artifact still equals the bytes written by this transaction. Restore the closing plan with an exclusive create and restore each replaced file from its exact snapshot. If concurrent change prevents safe rollback, stop and report the exact conflict instead of overwriting it.
7. Report: "Plan `<theme>/<id>` closed."

## `execute <theme>/<id>`

1. Require the thematic profile. Parse the qualified plan reference as a safe kebab-case `<theme>` plus a zero-padded numeric `<id>` of at least three digits. Locate the one `<NNN>-*.md` under `docs/roadmap/<theme>/plans/` whose numeric prefix matches `<id>`.
2. Run the read-only `ki-project-roadmap` audit and continue only with zero FAIL and zero WARN. Read the plan and verify that every qualified `blocked-by` plan reference has cleared the active repository-wide index.
3. For each plan edit — the initial `status: in-progress`, every completed Step marker, and the final transient `status: done` — snapshot the exact plan and `docs/roadmap/README.md` bytes, prepare both replacements, then revalidate the clean audit and snapshots immediately before writing. Publish the plan and regenerated index through same-directory temporary files; run the audit again. On failure, restore only transaction-owned bytes and only while the current files still equal the bytes this transaction wrote. Stop rather than overwrite a concurrent change.
4. Work `## Steps` sequentially; after each completes, prefix that line with `✓` (or check its `- [x]` box). Commit progress as you go — the plan file and regenerated index travel with the code they describe.
5. When all steps are done, make the final transient `status: done` plus index update through the same transaction, then run `done <theme>/<id>` to close the plan and its canonical roadmap item only after the implementation and verification have landed.

## `new <theme> <title>`

Enter the host runtime's non-writing planning/review surface if it has one; otherwise review the proposed artifact in conversation before writing. Then:

1. Parse `<theme>` as the first token of `rest`; require it to match `^[a-z0-9]+(-[a-z0-9]+)*$`. If the repository is in the simple profile, stop without writing and tell the user to run `/ki-project-roadmap expand <theme>` first.
2. Require an existing canonical `docs/roadmap/<theme>/ROADMAP.md` in the thematic profile. Confirm the exact qualified `roadmap: <theme>/<item-slug>` locator this plan executes; it must resolve to one `Blocking` or `Next` item in that theme roadmap. Confirm `blocks` / `blocked-by` (qualified `<theme>/<NNN>` plan references or `—`). Infer from context and confirm; do not ask for a phase.
3. Run the read-only `ki-project-roadmap` audit and continue only with zero FAIL and zero WARN. Read `docs/roadmap/README.md` and every plan under every theme to validate the index and dependency graph. Next id = highest validated numeric id in the selected theme + 1, zero-padded to at least three digits; use `001` if that theme has no plans. Stop on index/disk disagreement, malformed ids, duplicates within a theme, broken links, or dependency drift.
4. Derive the lowercase hyphenated `<slug>` from the remaining title, no longer than 50 characters. If the theme's `plans/` directory is absent, create it only after revalidating the canonical theme directory, then validate the new directory immediately. Prepare `docs/roadmap/<theme>/plans/<NNN>-<slug>.md` using `ki-project-roadmap`'s plan format. Fill Steps with concrete, checkable actions; fill the rest from context, marking genuine gaps `<!-- TODO -->`.
5. Add the plan to the flat global index in `docs/roadmap/README.md` and rebuild the dependency graph. Immediately recheck the audit baseline and id allocation, publish the absent destination with an exclusive create, and update the byte-unchanged index without clobbering concurrent changes. Run the read-only audit again; on failure, roll back only transaction-owned bytes and a transaction-created empty `plans/` directory.
6. Tell the user the plan is written; exit the host planning surface. Do **not** begin implementation — that is `execute`.

## `promote`

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

1. Reject a KB repository. Ask for or infer the intended safe kebab-case theme. If `ki-project-roadmap` identifies the simple profile, stop without a repository write and give the concrete route `/ki-project-roadmap expand <theme>`.
2. Require the physical git root to be a real, non-symlink directory. Walk `ROADMAP.md`, `docs`, `roadmap`, `docs/roadmap/README.md`, the selected theme, its `ROADMAP.md`, and any existing `plans` component one at a time. Every existing component must have the expected regular-file or directory type, must not be a symlink, and must resolve inside the physical git root. The selected theme and eventual filename components must match their safe grammars and contain no separator.
3. Run the repository's read-only `ki-project-roadmap` audit against the git root. Use its declared package script or vendored checker; if neither is available, stop. Continue only with zero FAIL and zero WARN. Do not run CONFORM or repair unrelated roadmap state.
4. Parse `docs/roadmap/README.md` and every on-disk plan under `docs/roadmap/*/plans/`. Require every numeric id to match `^[0-9]{3,}$`, every filename id to equal its frontmatter id, every qualified `<theme>/<id>` reference to be unique, every index link to resolve to that same plan, and the index and disk sets to agree. The same numeric id may appear in different themes. Stop on malformed ids, duplicate rows, duplicate ids within one theme, broken links, or any index/on-disk drift.
5. Parse every canonical theme roadmap. Require every qualified `<theme>/<item-slug>` locator to be unique, and require the selected theme's canonical roadmap and the root projection to agree exactly under the `ki-project-roadmap` projection contract.
6. Form the selected theme's numeric-id union from its validated index rows and on-disk filename/frontmatter ids. The candidate id is that theme's maximum plus one, padded to at least three digits; use `001` when both selected-theme sources are empty. Do not allocate from only one source.

### 3. Confirm the promoted artifact

1. Use the authenticated scratch bytes without changing the file. Confirm with the user a title, the safe kebab-case theme, an exact qualified `roadmap: <theme>/<item-slug>` locator, and a lowercase hyphenated slug no longer than 50 characters. Verify that the locator resolves to exactly one canonical item in that theme roadmap's `Blocking` or `Next` horizon. Theme, item slug, and plan slug must each match `^[a-z0-9]+(-[a-z0-9]+)*$` and contain no path separator.
2. Map the scratch material into the canonical Context, Current state, Steps, Files touched, Verify, and Dependencies / blocks sections. Preserve its substantive content losslessly: reorganise and clarify, but do not silently discard unmatched constraints, decisions, or checks.
3. Set `status: open`, `blocks: —`, and `blocked-by: —`. Promotion creates an independent plan and does not edit another plan to add reciprocal dependencies.
4. Prepare the corresponding flat global-index row and rebuild the dependency graph from the validated plans plus this independent plan. Do not write yet.

### 4. Recheck and commit one no-clobber transaction

1. Snapshot the exact bytes of root `ROADMAP.md`, selected `docs/roadmap/<theme>/ROADMAP.md`, and `docs/roadmap/README.md`. Immediately before writing, securely re-read and revalidate the exact current-session state record, scratch path, scratch file, stored physical `cwd`, and repository identity; require the state and scratch bytes to equal the authenticated bytes. Rerun the clean read-only roadmap audit; re-resolve every existing destination component; reparse the index, canonical theme roadmaps, and on-disk plans; and recompute the selected theme's id union. Abort if any path, byte snapshot, parsed value, projection, or candidate id differs from the validated baseline.
2. Recheck the destination `<git-root>/docs/roadmap/<theme>/plans/<NNN>-<slug>.md` with `lstat` semantics. It must be absent, including no regular file, symlink, or dangling symlink. Create only a missing `plans` directory inside the already validated theme, then validate it immediately. The thematic profile, global index, and canonical theme roadmap must already exist.
3. Record whether the `plans` directory was created. Materialise the complete plan in a temporary regular file inside the safe plans directory, then publish it with an exclusive-create operation (`O_CREAT|O_EXCL`, or an atomic same-directory hard link that fails when the destination exists). Never use an overwrite-capable move or copy for the destination.
4. Before replacing `docs/roadmap/README.md`, require it, the selected theme roadmap, and the root projection to remain byte-for-byte equal to their snapshots. Write the prepared index and graph through a same-directory temporary file and atomic replacement. Record the exact bytes or digest written by this transaction. Do not rewrite either roadmap during promotion.
5. Run the read-only roadmap audit again. Success requires zero FAIL and zero WARN, the destination and global-index row to match, the selected canonical item and generated root projection to remain exact, and the scratch, state, theme-roadmap, and root-roadmap bytes to remain untouched.
6. If publication, index replacement, or the post-write audit fails, roll back only transaction-owned changes: remove the new plan only after proving it is the file this transaction created; restore the prior index only if its current bytes still equal the transaction-written bytes; and prune only an empty `plans` directory created by this transaction. Never restore, replace, or remove the scratch, state, canonical theme roadmap, or root projection because promotion does not own them. If concurrent change prevents a safe rollback, stop and report the exact conflict instead of overwriting it.

Report the new plan path and leave implementation to `execute`.

## `status [theme]`

In the simple profile, print the root `ROADMAP.md` and report that the repository has no governed plan collection. In the thematic profile:

- With no theme, print `docs/roadmap/README.md` as-is — the flat active index and dependency graph. If it has no plan rows, report "No active plans."
- With a safe kebab-case theme, print that theme's canonical `docs/roadmap/<theme>/ROADMAP.md` followed by only the global-index rows and dependency edges involving plans in that theme. Stop if the theme does not exist; do not silently fall back to the global view.

## Mandate

For any multi-file or multi-step change in a non-KB repository, create a governed repository plan before touching code. If the repository uses the simple profile, first expand the relevant theme with `/ki-project-roadmap expand <theme>`. The plan is committed with the work — a recoverable, dependency-ordered record that survives context resets. Plans exist only for canonical thematic-roadmap `Blocking` or `Next` items under the near-horizon principle owned by `ki-project-roadmap`.
