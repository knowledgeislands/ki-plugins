# Knowledge Islands repo standard

The canonical configuration a Knowledge Islands repo should carry, so repos present and behave consistently and that consistency is _checkable_ rather than folklore. A Knowledge Islands repo is a git repo that carries a `.ki-config.toml` (its presence is the compliance marker); the standard applies to any such repo — the [`knowledgeislands`](https://github.com/knowledgeislands) org is the reference set it was derived from, not its boundary. Three layers — local files, core GitHub settings, deeper GitHub (security & Actions). Derived and applied 2026-05-31 from an audit of all 10 `knowledgeislands` repos. The mechanical checker is [`../scripts/audit-repo.ts`](../scripts/audit-repo.ts); keep this doc and the script's constants in sync.

## Contents

- [Layer 1 — repo files](#layer-1--repo-files)
- [Layer 2 — core GitHub settings](#layer-2--core-github-settings)
- [Layer 3 — deeper GitHub](#layer-3--deeper-github)
- [Visibility](#visibility)
- [Per-repo overrides](#per-repo-overrides)
- [Coverage cascade](#coverage-cascade)
- [Applying it](#applying-it)
- [Verifying it](#verifying-it)
- [Conformance](#conformance)

## Layer 1 — repo files

Every repo carries these at the root. Presence is checked **on the default branch via the GitHub API** (the git-tree endpoint), not from a working checkout — so what's actually committed is what's audited, and `--org` mode covers uncloned repos.

| File              | Why                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `README.md`       | The repo's entry point.                                                                                         |
| `LICENSE`         | The declared license's text (default MIT); proprietary copyright text if `license` is `UNLICENSED`.             |
| `.gitignore`      | Keeps build/dep noise out of history.                                                                           |
| `.editorconfig`   | Shared editor defaults across the workspace toolchain.                                                          |
| `CLAUDE.md`       | Agent instructions — the always-loaded anchor for any repo-specific gate or convention (skills rubric SHAPE-7). |
| `.ki-config.toml` | Declares this repo's expected config under `[ki-repo]`. †                                                       |

† The values it carries: `visibility`, the declared `license` (SPDX id, default MIT), and any per-repo check overrides.

`ROADMAP.md` is **expected but not required** — a warn, not a fail: most repos carry one, but a base that keeps its forward view elsewhere (a KB base's `Streams/Future`) may omit it.

### `.ki-meta/` — the working-artifacts area

`.ki-meta/` is the working area for Knowledge Islands governance tooling — the artifacts-_out_ counterpart to `.ki-config.toml`'s config-_in_. It is an **extensible namespace**: subdirs are added as tooling grows, each declaring whether it is **derived** (regenerated, gitignored) or **durable** (kept, tracked). Defined subdirs today:

- `.ki-meta/audits/<concern>.{md,json}` — the latest audit report per concern (`engineering`, `skills`, `repo`, …), written by a checker run with `--report` and overwritten each run (latest-only, no history). The `.json` is the machine-readable substrate a composed audit merges; the `.md` is the human report.
- `.ki-meta/conform/<concern>.md` — the latest record of what a CONFORM changed.

Presence is **not required** — the directory appears the first time a checker is run with `--report`. What the audit checks (the `ki-meta` criterion) is that the derived subdirs are **gitignored, not committed**: `.gitignore` carries `.ki-meta/audits/` and `.ki-meta/conform/`, while the `.ki-meta/` namespace itself is left un-ignored so a future _durable_ subdir can be tracked. The convention is owned here; the `enforcement-framework` (engineering) references it and writes `.ki-meta/audits/` as the AUDIT consumer.

## Layer 2 — core GitHub settings

For every repo on github.com:

| Setting | Value | Why |
| --- | --- | --- |
| Default branch | `main` | Uniform; what tooling and docs assume. |
| License | Live GitHub license matches the declared `license` SPDX id (default MIT) | Decoupled from visibility. |
| Package license | `package.json` `"license"` matches the declared id (`UNLICENSED` if proprietary) | Matches the declared license. |
| Description | Present, one sentence; synced with `package.json` where one exists | One-line identity on GitHub. |
| Merge methods | **Squash only** — merge-commit off, rebase off | One commit per PR; clean, linear `main`. |
| Auto-delete branch | On | No stale merged branches. |
| Issues | On | The tracker. |
| Wiki | Off | Docs live in-repo. |
| Projects | Off | Unused. |
| Discussions | Off | Unused. |

Public repos (`mcp-*`) additionally:

| Setting | Value                                                          |
| ------- | -------------------------------------------------------------- |
| Topics  | `mcp`, `model-context-protocol`, `claude`, `typescript`, `bun` |

**`main` is open by default** — no branch protection, so direct pushes are allowed and no PR, status check, or linear-history rule gates it. Squash-only merge (above) keeps history tidy for PRs that do happen, but nothing forces work through a PR. A repo that _wants_ a protected `main` overrides the `branch-protection` check on (see [Per-repo overrides](#per-repo-overrides)) — protection is then `main`: require a PR (0 approvals), the `build` status check, linear history, no force-push, no deletion, admins **not** enforced.

### Package.json identity & metadata

The engineering coverage manifest assigns the `package.json` **identity & metadata** keys to this skill (engineering owns the closed key set; this skill owns their content). Where the repo has a `package.json`, these are checked:

| Field         | Rule                                                                    | Severity  |
| ------------- | ----------------------------------------------------------------------- | --------- |
| `name`        | present, non-empty                                                      | FAIL      |
| `version`     | semver (`x.y.z`)                                                        | FAIL      |
| `description` | present; **synced** with the GitHub description                         | FAIL      |
| `author`      | present (string or object)                                              | FAIL      |
| `license`     | matches the declared `license` id (`UNLICENSED` if proprietary) — above | FAIL      |
| `private`     | `true` iff the repo is private                                          | FAIL      |
| `repository`  | carries a `url`; should reference the repo's `owner/name`               | FAIL/WARN |
| `bugs`        | carries a `url`                                                         | WARN      |
| `homepage`    | present                                                                 | WARN      |
| `keywords`    | non-empty array                                                         | WARN      |

## Layer 3 — deeper GitHub

| Setting                             | Value | Scope                                                          |
| ----------------------------------- | ----- | -------------------------------------------------------------- |
| Dependabot alerts                   | On    | All repos                                                      |
| Dependabot security updates         | On    | All repos (each ships a `dependabot-auto-merge.yml`)           |
| Always suggest updating PR branches | On    | All repos (`allow_update_branch`; keeps PRs current with base) |
| Secret scanning                     | On    | Public repos (plan-limited on private — out of scope)          |
| Secret-scanning push protection     | On    | Public repos                                                   |
| Actions `allowed_actions`           | `all` | All repos (CI pulls marketplace actions like setup-bun)        |

## Visibility

Each repo **declares** its expected visibility in `.ki-config.toml` (`visibility = "public"` or `"private"`); the auditor checks that declaration against the live GitHub visibility. It is a deliberate per-repo choice, **not inferred from the name**. (In practice the `arcadia-*` repos are private bases / internal skills and the `mcp-*` repos are public servers — a pattern, not the rule.)

`.ki-config.toml` is a shared per-repo file; each skill reads its own `[table]`, and a skill with only implicit/default behaviour needs no table. The full cross-skill contract — its presence as the compliance marker, the table-per-skill model, and the validate-your-own-table protocol — is in [the `.ki-config.toml` contract](ki-config-standard.md). This skill owns `[ki-repo]`. Scaffold the default keys with `bun scripts/audit-repo.ts --init >> .ki-config.toml`, then edit the values:

```toml
# .ki-config.toml — one [table] per skill that needs per-repo options
[ki-repo]
visibility = "public"   # "public" | "private"

# Optional. One boolean per overridable check; omit any to take the org default.
# A repo that fully conforms needs nothing here.
[ki-repo.checks]
branch-protection = true   # default off — protect `main` on this repo
```

## Per-repo overrides

The rubric carries the **org default** for every check. Most are bedrock — file presence, default branch, description, merge policy, auto-delete-branch, visibility, Dependabot — and aren't negotiable. License is bedrock and **declared, not inferred from visibility**: a repo names its license as an SPDX id in `[ki-repo]` `license` (default MIT), and the auditor checks that the live GitHub license (`license`), a present LICENSE file (`license-file`), and `package.json` `"license"` (`package-license`) all match it. A proprietary declaration (`UNLICENSED`/`proprietary`) expects no recognised OSI license on GitHub and `"UNLICENSED"` in `package.json`. Visibility is a separate, independent check — a private repo may be MIT, a public repo proprietary. The rest are **overridable**: a repo flips one for itself with a single boolean in its `[ki-repo.checks]` table, where `true` = enforce this check and `false` = don't. A check you omit takes the org default, so **a fully-conforming repo writes no overrides at all**. The auditor reports every active override as a `note` (never a failure), so a deliberate departure stays visible without reading as drift.

| Check               | Org default | When enforced, the auditor requires…                |
| ------------------- | ----------- | --------------------------------------------------- |
| `branch-protection` | **off**     | `main`: enforces the protection set ‡               |
| `wiki`              | on          | Wiki disabled.                                      |
| `projects`          | on          | Projects disabled.                                  |
| `issues`            | on          | Issues enabled.                                     |
| `topics`            | on          | _(public)_ carries the standard topic set.          |
| `secret-scanning`   | on          | _(public)_ secret scanning enabled.                 |
| `push-protection`   | on          | _(public)_ secret-scanning push protection enabled. |

‡ When enforced, `branch-protection` requires: a PR (0 approvals), the `build` status check, linear history; no force-push/deletion; admins not enforced.

- "Org default **on**" means the check fails unless satisfied — the standard's normal behaviour — and a repo sets the key `false` to step out of it (e.g. `wiki = false` to keep a Wiki). `branch-protection` is the one check that's **off** by default; a repo sets it `true` to protect `main`.
- The required status check for `branch-protection` is **`build`** — the single job in each repo's `.github/workflows/ci.yml` (workflow "CI"). A repo that turns it on but lacks that job can't satisfy the check; add the CI job first.
- `topics` / `secret-scanning` / `push-protection` are **public-only** — they don't apply to a private repo regardless of the override, so the private `arcadia-*` repos need say nothing about them.
- A key under `[…checks]` that names no overridable check (a typo, or a bedrock check) **WARNs** — it would otherwise silently do nothing. The auditor's `CHECK_DEFAULTS` registry is the source of truth for what's overridable.
- A **redundant** override — one whose value just restates the org default (e.g. `wiki = true`) — does nothing, so the auditor flags it with a `note` advising it be dropped. The aim is that a `.ki-config.toml` carries only genuine divergences, and a conforming repo's `[…checks]` is empty or absent.
- `coverage-<skill>` (e.g. `coverage-website = false`) is also accepted here — it opts the repo out of **one** coverage signal of the cascade below (the default is enforced: a detected artifact with no opt-in table WARNs). A `coverage-<skill>` naming no coverage skill WARNs, like any unknown check.

## Coverage cascade

`.ki-config.toml`'s presence is the **gate** (Layer 1): once it confirms the repo is a ki-repo, the auditor checks the repo **declares an opt-in `[ki-<skill>]` table for every governance skill whose applicability it can detect** — a `Streams/` zone ⇒ `[ki-kb-streams]`, an `eleventy.config` ⇒ `[ki-website]`, an `@modelcontextprotocol/sdk` dependency ⇒ `[ki-mcp]`, a `.claude-plugin/marketplace.json` ⇒ `[ki-plugins]`, `skills/*/SKILL.md` ⇒ `[ki-skills]`, and so on. Detected-but-undeclared WARNs; a declared table with no matching artifact WARNs as possibly stale.

A repo that is **not** a ki-repo (no `.ki-config.toml`) is never coverage-checked — it just takes the `ki-config` FAIL, so a lookalike repo (an `eleventy.config` but no marker) is not falsely told to opt in. This is `ki-repo`'s single cross-table read, and it reads only table **presence**, never another skill's keys. The full signal list and the marker-vs-config model live in [the `.ki-config.toml` contract](ki-config-standard.md#coverage-enforcement). Silence one signal with `coverage-<skill> = false` under `[ki-repo.checks]`.

## Applying it

`gh` CLI, authenticated with repo-admin scope. (zsh: use an array, not a bare string — unquoted `$var` does not word-split.)

```zsh
all=(ki-arcadia-principal ki-agentic-harness ki-website mcp-claude-housekeeping mcp-git-audit mcp-gsuite mcp-kb-fs mcp-kb-notion-mirror mcp-m365)
public=(mcp-claude-housekeeping mcp-git-audit mcp-gsuite mcp-kb-fs mcp-kb-notion-mirror mcp-m365)

# Layer 1 — each repo declares its config in .ki-config.toml (committed via PR like any file).
#   Scaffold the [ki-repo] defaults, then edit:
#     bun scripts/audit-repo.ts --init >> .ki-config.toml
# Visibility is verified (declared vs live), not set here; change actual visibility deliberately:
#   gh repo edit knowledgeislands/<name> --visibility public|private --accept-visibility-change-consequences

# Layer 2 — every repo: squash-only + auto-delete branch + Wiki/Projects off
for r in $all; do
  gh repo edit "knowledgeislands/$r" \
    --enable-merge-commit=false --enable-rebase-merge=false --enable-squash-merge=true \
    --delete-branch-on-merge=true --enable-wiki=false --enable-projects=false
done

# Layer 2 — descriptions (per repo) and topics (public)
gh repo edit knowledgeislands/<name> --description "…"
for r in $public; do
  gh repo edit "knowledgeislands/$r" --add-topic mcp --add-topic model-context-protocol --add-topic claude --add-topic typescript --add-topic bun
done

# Layer 2 — branch protection is overridable, default OFF. Default: `main` open — strip any leftover protection:
for r in $all; do gh api -X DELETE "repos/knowledgeislands/$r/branches/main/protection" 2>/dev/null || true; done
# Only for a repo that overrides it on (branch-protection = true under [..checks] in its .ki-config.toml):
read -r -d '' body <<'JSON'
{ "required_status_checks": {"strict": true, "checks": [{"context": "build"}]}, "enforce_admins": false,
  "required_pull_request_reviews": {"required_approving_review_count": 0}, "restrictions": null,
  "required_linear_history": true, "allow_force_pushes": false, "allow_deletions": false }
JSON
printf '%s' "$body" | gh api -X PUT "repos/knowledgeislands/<opted-in-repo>/branches/main/protection" --input -

# Layer 3 — Dependabot (all) + always-suggest-updating-PR-branches (all) + secret scanning (public)
for r in $all; do gh api -X PUT "repos/knowledgeislands/$r/vulnerability-alerts"; gh api -X PUT "repos/knowledgeislands/$r/automated-security-fixes"; done
for r in $all; do gh api -X PATCH "repos/knowledgeislands/$r" -F allow_update_branch=true >/dev/null; done
for r in $public; do
  printf '%s' '{"security_and_analysis":{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}}' \
    | gh api -X PATCH "repos/knowledgeislands/$r" --input -
done
```

Layer 1 files are added with a normal commit, pushed straight to `main` (it is unprotected) or via a PR if you prefer.

## Verifying it

```zsh
bun ../scripts/audit-repo.ts ~/kis/knowledgeislands      # enumerate from a local tree (origins)
bun ../scripts/audit-repo.ts --org knowledgeislands      # enumerate the whole org
```

Both check every layer against GitHub; the path / `--org` only decides which repos.

## Conformance

As of **2026-05-31**, all 9 `knowledgeislands` repos conform on layers 2–3. Outstanding layer-1 work: every repo still needs a `.ki-config.toml` (declaring its visibility + any check overrides), and `mcp-kb-notion-mirror` needs `.editorconfig` — each a direct commit to `main`.
