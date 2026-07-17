# Chezmoi dotfiles audit rubric

The line-by-line checkable criteria behind [the standard](dotfiles-standard.md). Each is tagged **[M] mechanical** (the bundled [`../scripts/audit.ts`](../scripts/audit.ts) enforces it) or **[J] judgment** (a reader assesses it). Every **[M]** item carries a stable code that the checker emits as each finding's `area`, and [`../scripts/conform.ts`](../scripts/conform.ts) uses the same code for its twin action.

A criterion's tag is a contract with the script: if you find yourself eyeballing an **[M]** check, run the auditor instead; a **[J]** check that becomes deterministic should move into the script and flip to **[M]**.

## Mechanical criteria (shipped, real checks)

- **chezmoiignore-present [M]** `` `CHEZMOI-1` `` `.chezmoiignore` exists at the repo root. FAIL if absent — there is no legitimate reason for a chezmoi source repo to lack one. (standard: Repo-shape expectations)
- **templates-data-dir-present [M]** `` `CHEZMOI-2` `` if any `*.tmpl` file exists anywhere in the tree, at least one of `.chezmoidata/` or `.chezmoitemplates/` must also exist. WARN (not FAIL) if templating is present without either directory — it's a sign of ad hoc templating rather than the shared-data/shared-partial shape, not necessarily broken. NA if no `.tmpl` files exist at all. (standard: Repo-shape expectations)
- **bin-executable-prefix [M]** `` `BIN-1` `` every file directly under a source `bin/` directory carries _a_ recognized chezmoi source-attribute prefix (`executable_`, `symlink_`, `private_`, `dot_`, `readonly_`, `create_`, `modify_` — not exclusively `executable_`). WARN per file with no recognized prefix — not FAIL, since a stray unmanaged helper file (e.g. a README) under `bin/` isn't necessarily wrong. (standard: bin/ executable convention)
- **git-lock-hygiene [M]** `` `GIT-1` `` no `.git/*.lock` files (checked at `.git/index.lock`, `.git/HEAD.lock`, `.git/config.lock`, and recursively under `.git/refs/` and `.git/packed-refs.lock`) are present. FAIL if any stray lock file is found — it means all git operations on the repo are currently blocked. (standard: Git & audit hygiene)

## Deferred mechanical criteria (not yet implemented — stated reason, not silent omission)

These would be **[M]** in principle but are deliberately left **[J]** for now, because getting the heuristic right needs real-world tuning across more than one repo before it can fire WARN/FAIL without false positives:

- **naming-prefix conformance (tree-wide)** — checking that every file under a chezmoi-managed root actually uses a recognized prefix (`dot_`/`executable_`/`private_`/`.tmpl`, or is deliberately unmanaged via `.chezmoiignore`) risks false positives on legitimate non-chezmoi files living alongside the source tree (docs, CI config, this very skill's own draft folder).
- **rc-is-loader heuristic** — flagging a shell rc file that's grown beyond "just a loader" needs a line-count or content-shape heuristic that hasn't been validated against more than one repo's idea of "thin."
- **pattern-b-merge-pairing** — detecting that every Pattern-B `.tmpl` has a matching reverse-merge script (and vice versa) is a best-effort grep at best; a false WARN here (flagging a legitimately merge-less `.tmpl` that's actually Pattern-A-adjacent) is worse than not checking at all until the heuristic is proven.

## Judgment criteria (not deterministic — apply by reading)

- **pattern-choice [J]** `` `PATTERN-J1` `` for a given app-mutated config file, Pattern A (surgical patch) vs Pattern B (full template + reverse-merge) was the right call under the ≥90%-app-owned decision rule — not just "a" pattern was applied, but the _correct_ one for that file's actual key composition. (standard: App-mutated config handling)
- **format-preserving-editor-selection [J]** `` `CONFIG-J1` `` every Pattern A writer uses an edit API appropriate to its declared input format, defines absent-file/path behavior, fails closed rather than falling back on unsupported input, and has representative evidence that unrelated concrete syntax remains stable and a second identical run is a no-op. A query or value-model tool is not accepted as a surgical writer merely because the resulting document is semantically equivalent. (standard: Selecting a surgical config editor)
- **claude-md-layering [J]** `` `LAYER-J1` `` a given piece of CLAUDE.md-style guidance sits at the correct layer — repo-local vs user-level vs persistent memory — per the decision rule. (standard: CLAUDE.md / agent-instruction layering)
- **chezmoiignore-negation-intent [J]** `` `CHEZMOI-J1` `` a `.chezmoiignore` negation (`!pattern`) is a deliberate, documented choice to track a specific file through an otherwise-ignored parent, not an accidentally-too-broad ignore rule that happens to have a negation carving a hole in it. (standard: Repo layout & naming)
- **audit-etiquette [J]** `` `ETIQ-J1` `` when an audit surfaced a finding, it was reported as file + one-line problem + options, and no fix was applied without confirmation — a process criterion, not something `audit.ts` can observe about itself. (standard: Git & audit hygiene)
- **sync [J]** `` `SYNC-1` `` this rubric, [the standard](dotfiles-standard.md), and the script's constants agree; when the standard moves, all three move together (Mode REFRESH).
