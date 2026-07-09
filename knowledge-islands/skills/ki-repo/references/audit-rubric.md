# Repo-config audit rubric

The line-by-line checkable criteria behind [the standard](repo-standard.md). Each is tagged **[M] mechanical** (the bundled [`../scripts/audit-repo.ts`](../scripts/audit-repo.ts) enforces it and prints the **id** in brackets) or **[J] judgment** (a reader assesses it). Codes are the check ids the script emits. Each cites the standard layer it verifies.

A criterion's tag is a contract with the script: if you find yourself eyeballing an **[M]** check, run the auditor instead; a **[J]** check that becomes deterministic should move into the script and flip to **[M]**.

Every **[M]** finding here is also auto-fixable: [`../scripts/conform-repo.ts`](../scripts/conform-repo.ts) applies the matching `gh` call or local scaffold directly (`--dry-run` to preview). The **[J]** findings (README content, description text/visibility, whether a `[ki-repo.checks]` override is warranted) are printed as manual TODOs, never guessed.

## Layer 1 — repo files (presence on the default branch, via the GitHub git-tree API)

- **readme [M]** `README.md` present. (standard: Layer 1)
- **license-file [M]** `LICENSE` (or `LICENSE.md`) present. FAIL for all repos — its text is the declared license (default MIT), or proprietary copyright text if `license` is `UNLICENSED`. (Layer 1)
- **gitignore [M]** `.gitignore` present. (Layer 1)
- **editorconfig [M]** `.editorconfig` present. (Layer 1)
- **claude-md [M]** `CLAUDE.md` present — the always-loaded anchor for any repo-specific gate or convention (skills rubric SHAPE-7). (Layer 1)
- **ki-config [M]** `.ki-config.toml` present (and read for `visibility` + the `[…checks]` override table). (Layer 1)
- **ki-meta [M, warn]** the derived `.ki-meta/` subdirs are **gitignored, not committed** — warn if any `.ki-meta/audits/` or `.ki-meta/conform/` path appears in the tree. Presence of `.ki-meta/` is not required; the namespace itself is left un-ignored. (standard: Layer 1 — `.ki-meta/`)

## Layer 2 — core GitHub settings (repos on github.com)

- **default-branch [M]** default branch is `main`. (Layer 2)
- **license [M]** live GitHub license matches the declared `[ki-repo]` `license` SPDX id (default MIT); a proprietary declaration expects no recognised OSI license. Decoupled from visibility. (Layer 2)
- **package-license [M]** _(when package.json exists)_ `package.json` `"license"` matches the declared `license` id (`"UNLICENSED"` for a proprietary declaration). FAIL on any mismatch. (Layer 2)
- **description [M]** description is non-empty. (Layer 2)
- **description-sync [M]** the GitHub description equals the repo's `package.json` `description` (its in-repo source of truth), where a package.json description exists. (Layer 2)
- **merge [M]** squash only — merge-commit off, rebase off. (Layer 2)
- **delete-branch [M]** auto-delete head branch on merge is on. (Layer 2)
- **issues [M, override↓ on]** Issues enabled. (Layer 2)
- **wiki [M, override↓ on]** Wiki disabled. (Layer 2)
- **projects [M, override↓ on]** Projects disabled. (Layer 2)
- **visibility [M]** live GitHub visibility matches the value **declared** in `.ki-config.toml` (`visibility = "public" | "private"`); missing/invalid declaration → fail. (standard: Visibility)
- **topics [M, override↓ on]** _(public)_ carries the standard topic set. (Layer 2)
- **branch-protection [M, override↓ off]** `main` requires a PR, the `build` check, and linear history. **Off by default** (`main` open) — runs only when a repo sets `branch-protection = true`. (standard: Per-repo overrides)

## Layer 3 — deeper GitHub

- **dependabot-alerts [M]** Dependabot alerts on. (Layer 3)
- **dependabot-updates [M]** Dependabot security updates on. (Layer 3)
- **update-branch [M]** `allow_update_branch` on ("Always suggest updating pull request branches") — keeps a PR, Dependabot's included, current with the base before merge. (Layer 3)
- **secret-scanning [M, override↓ on]** _(public)_ secret scanning on. (Layer 3; private out of scope — plan-limited)
- **push-protection [M, override↓ on]** _(public)_ secret-scanning push protection on. (Layer 3)
- **actions [M, WARN]** `allowed_actions` is `all`; anything else WARNs rather than fails (tightening is a deliberate per-repo choice). (Layer 3)

**override↓** marks an **overridable** check: its org default (`on`/`off`) lives in the script's `CHECK_DEFAULTS`, and a repo flips it for itself with a boolean under `[ki-repo.checks]` (`true` = enforce, `false` = don't). Every other check is bedrock — not overridable. An active override prints as a `note`, never a failure; a redundant override (one that just restates the org default) prints a `note` advising it be dropped; a `[…checks]` key that names no overridable check (nor a `coverage-<skill>`, below) **WARNs** (`checks` id). (standard: Per-repo overrides)

## Coverage cascade (gated on the `.ki-config.toml` marker)

- **coverage [M, gated]** Once `.ki-config.toml` confirms the repo is a ki-repo, every governance skill whose applicability is **detected** in the repo must declare its opt-in `[ki-<skill>]` table; a detected artifact with no table WARNs, and a declared table with no matching artifact WARNs as possibly stale. Signals → tables: `package.json` → engineering, `Pillars/`+`Resources/` → kb, `Streams/` → streams, `eleventy.config.*` → website, `wrangler.*` → website-cloudflare, `@modelcontextprotocol/sdk` dep → mcp, `.claude-plugin/marketplace.json` → plugins, `skills/*/SKILL.md` → skills, `agents/**/*.md` → agents. **Gated**: a repo with no `.ki-config.toml` is never coverage-checked (it takes the `ki-config` FAIL), so a lookalike is not falsely flagged. This is `repo`'s one cross-table read — **presence only**, never another skill's keys. Silence one signal with `coverage-<skill> = false` under `[ki-repo.checks]` (e.g. `coverage-website = false`). (standard: Coverage cascade)

## Judgment (not deterministic — apply by reading)

- **description-fit [J]** the description actually _describes the repo's purpose_ — readable, accurate, one sentence. The script checks non-emptiness (`description`) and that it is synced with `package.json` (`description-sync`); whether it _fits the purpose_ is the irreducible judgment left here. (Layer 2)
- **overrides** each boolean under `[ki-repo.checks]` flips an overridable check for that repo (the script prints it as a `note`). **[J]** part: confirm each override is a genuine, warranted per-repo decision (e.g. a public repo that deliberately keeps a Wiki, or one that protects `main`), not a way to wave off real drift. (standard: Per-repo overrides)
- **sync [J]** this rubric, [the standard](repo-standard.md), and the script's constants agree. When the standard moves, all three move together (REFRESH).
