# Knowledge Islands repo standard

The canonical configuration a Knowledge Islands repo should carry, so repos present and behave consistently and that consistency is _checkable_ rather than folklore. A Knowledge Islands repo is a git repo that carries a `.ki-config.toml` (its presence is the compliance marker); the standard applies to any such repo — the [`knowledgeislands`](https://github.com/knowledgeislands) org is the reference set it was derived from, not its boundary. Three layers — local files, core GitHub settings, deeper GitHub (security & Actions). Derived and applied 2026-05-31 from an audit of all 10 `knowledgeislands` repos. The structured catalogue under `../scripts/rubric/` is the executable source hosted by native `ki repo` operations.

## Contents

- [Layer 1 — repo files](#layer-1--repo-files)
- [Layer 2 — core GitHub settings](#layer-2--core-github-settings)
- [Layer 3 — deeper GitHub](#layer-3--deeper-github)
- [Working areas](#working-areas)
- [Repository kind and Knowledge Base stores](#repository-kind-and-knowledge-base-stores)
- [Repository write authority](#repository-write-authority)
- [Visibility](#visibility)
- [Per-repo overrides](#per-repo-overrides)
- [Coverage cascade](#coverage-cascade)
- [Applying it](#applying-it)
- [Verifying it](#verifying-it)
- [Conformance](#conformance)

## Layer 1 — repo files

Every repo carries these at the root. A local audit reads the selected checkout's repository tree, configuration, and package metadata first. A remote-only or scheduled audit with no filesystem reads the GitHub default branch through its API instead. Neither mode silently substitutes the other source; findings identify the source used.

| File | Why |
| --- | --- |
| `README.md` | The repo's entry point. |
| `LICENSE` | The declared license's text (default MIT); proprietary copyright text if `license` is `UNLICENSED`. |
| `.gitignore` | Keeps build/dep noise out of history and excludes generated runtime skill links. |
| `.editorconfig` | Shared editor defaults across the workspace toolchain. |
| `CLAUDE.md` | Agent instructions — the always-loaded anchor for any repo-specific gate or convention (skills rubric SHAPE-7). |
| `.ki-config.toml` | Declares this repo's expected config under `[skills.ki-repo]`. † |

† The values it carries: mandatory `title` and `description`, `visibility`, the declared `license` (SPDX id, default MIT), and any per-repo check overrides. A repository that declares `ki-change-management-roadmap` also carries its stable `repo_code` here.

**Baseline governance is declared, not assumed.** Every Knowledge Islands repo is governed by `ki-repo` **and** `ki-authoring`; both are required declarations — a `.ki-config.toml` missing `[skills.ki-authoring]` is a FAIL (`authoring-baseline`). Authoring is no longer an implicit universal hidden in the tooling ([ADR-KI-HARNESS-005](../../../../docs/decisions/ADR-KI-HARNESS-005-validate-down-ki-config-toml-contract.md)); the config shows the full governance set. Portable tokenomics and the real environment capabilities mapped from `[skills.ki-repo].supported_runtimes` are likewise explicit required tables; `ki-repo` checks their presence without reading their contents.

**Foundation scaffolding is owner-controlled and append-only.** `ki-repo` owns the file-level contract and writes its `[skills.ki-repo]` block plus the required bare `[skills.ki-authoring]` foundation marker. Its native CONFORM session creates a missing file with both, or appends only a missing exact root marker to a partial file; a dotted `[skills.ki-repo.checks]` sub-table alone does not satisfy `[skills.ki-repo]`. It preserves all existing bytes, is idempotent, and makes no write in dry-run. Sibling skills may conform their own tables under the validate-down/conform-down boundary. CONFORM completes this local repair before any separately confirmed live GitHub work and carries no TOML template for another skill.

**Native self-check capability is required.** A confirmed ki-repo must be auditable by resolving its declared governance roots to compatible registered operations in the verified active installed collection. It is not self-sufficient by carrying a vendored `.ki/bin` runner: package-local runners, manifests, and a nearby harness checkout are not execution fallbacks.

`ROADMAP.md` is **expected but not required** — a warn, not a fail: most repos carry one, but a base that keeps its forward view elsewhere (a KB base's `Streams/Future`) may omit it.

**Root orientation for a multi-runtime repo.** When a repo's declared [`supported_runtimes`](standards-configuration.md#harnesses-and-the-skills-namespace) includes a runtime other than `claude-code` (e.g. `chatgpt-codex`), the repo's orientation should live in a literal root `AGENTS.md` — not an `@`-import index, since a non-Claude-Code runtime can't resolve that syntax — with `CLAUDE.md` `@AGENTS.md`-importing it and staying a thin, Claude-only appendix. A repo whose `supported_runtimes` is `["claude-code"]` only has no reason to split: `CLAUDE.md` alone, with its own topic-file imports, is sufficient.

**Repository-local ki-self projection.** A repository may author a local `ki-self` at `.agents/skills/ki-self/`; this is its one canonical committed source and Codex reads it directly. It is repository-specific governance, not a bootstrap payload or installed-harness capability. If `claude-code` is declared in `supported_runtimes`, `.claude/skills/ki-self` must be a non-broken relative symbolic link resolving to that canonical source. If Claude Code is not declared, that projection must be absent. Do not maintain a copied Claude skill directory. This check is conditional because `ki-self` itself remains optional; once present, its runtime projection must match the declared support surface.

**Runtime skill ignore contract.** `.gitignore` follows the declared `supported_runtimes`: `claude-code` requires `.claude/skills/*`; `chatgpt-codex` requires `.agents/skills/*`. Every repository re-includes the reserved canonical `.agents/skills/ki-self/` source with `!.agents/skills/ki-self/` and `!.agents/skills/ki-self/**`, regardless of the declared runtime set, so it remains trackable whenever a repository elects to author it. These rules keep bootstrap-created links out of history without excluding the canonical local source.

### `.ki/` — legacy migration state, not an executor

Under ADR-KI-HARNESS-012, `.ki/` is not a governance working-artifacts area or an execution surface. The former vendored checker tree, aggregate runner, wrapper, and manifest are retired without a compatibility path; `ki repo` must never invoke `.ki/bin`, a manifest payload, or a nearby checkout. Existing `.ki` runner and manifest material is examined only by an explicit, fail-closed migration operation and is never removed without complete ownership proof.

No document may represent a legacy `.ki/bin` runner as the current self-check contract or as a fallback. Repository activation belongs to `ki repo skill add`, which creates only managed runtime discovery links after containment, ownership, idempotence, and dry-run checks.

## Repository kind and Knowledge Base stores

`ki-repo` owns the portable operating-model declaration. An omitted `repo_type` is an ordinary `repository`; `repo_type = "kb"` is the only specialised kind. The older `repo_type` declarations under other skill tables are invalid and must be migrated here. There is no alias or second location.

A Knowledge Base declares its roles with `store_roles`. `notes` is required and names the selected repository itself; `sources` and `legacy` are optional external roles. Roles are stable identities only, never filesystem paths, URLs, or local bindings. User-local tooling chooses and validates physical bindings separately, so an external store is not silently made a KI repository.

```toml
[skills.ki-repo]
repo_type = "kb"
store_roles = ["notes", "sources", "legacy"]
```

A KB must declare `ki-repo-kb` and must not declare `ki-change-management-roadmap`: its planning model is `ki-repo-kb-streams`. Conversely, the `ki-repo-kb` structure declaration requires `repo_type = "kb"`. This validates operating model separately from the structural skill that implements its layout.

## Repository write authority

The selected repository is the sole default write target for a task. Its task-scoped files may be edited and committed under the repository’s normal workflow. A sibling repository is read-only by default, including when a trade, route, workspace, or local checkout makes it visible.

A caller must explicitly authorise a bounded sibling write before it is made. That approval names the target repository and intended change; after the target and staged scope are known, every sibling commit needs its own explicit approval. A trade records a handoff and observation, never write authority. `ki-git` governs how an already authorised commit is prepared; `ki-repo` owns whether that repository may be changed.

## Working areas

Every KI repository carries this fixed working-area scaffold:

```text
+/
└── README.md
-/
└── README.md
```

`+/` is inbound: temporary material received from another repository or external source that needs local triage. `-/` is outbound: temporary material prepared here for another repository or external recipient. Neither is a canonical roadmap, plan, decision-record collection, archive, or automatic transfer channel. The two generic README files are canonical direction and boundary orientation owned by `ki-repo`; AUDIT checks them and CONFORM creates or restores their exact text. The generic directories and README files remain present whether or not another capability defines a subarea.

`ki-trades` owns the optional `_TRADES` subdirectories, their README files, cross-repository records, reciprocal routes, and submission lifecycle only in a repository that declares that skill. `ki-repo` neither creates nor interprets those subdirectories. Knowledge Bases retain their own fixed `+/` and `-/` staging model under `ki-repo-kb`; a declared `ki-trades` capability remains the separate owner of repository-level cross-repository submissions.

## Layer 2 — core GitHub settings

For every repo on github.com:

| Setting | Value | Why |
| --- | --- | --- |
| Default branch | `main` | Uniform; what tooling and docs assume. |
| License | Live GitHub license matches the declared `license` SPDX id (default MIT) | Decoupled from visibility. |
| Package license | `package.json` `"license"` matches the declared id (`UNLICENSED` if proprietary) | Matches the declared license. |
| Description | Equals declared `ki-repo` `description`; synced with `package.json` where present | One-line identity on GitHub. |
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

`.ki-config.toml` is a shared per-repo file; each skill reads and may conform the schema of its own `[table]`, while `ki-repo` owns the file-level contract and required foundation markers. The full cross-skill contract — its presence as the compliance marker, the table-per-skill model, and the validate-your-own-table protocol — is in [the `.ki-config.toml` standard](standards-configuration.md). The native configuration operation establishes the canonical foundations only; native self-check resolves the verified installed collection rather than writing a repository-local executor. Then edit the values:

```toml
# .ki-config.toml — one [table] per skill that needs per-repo options
[skills.ki-repo]
title = "Example repository" # exact README.md H1
description = "One sentence describing the repository." # exact GitHub and package.json description where present
visibility = "public"   # "public" | "private"
license = "MIT"         # SPDX id; use "UNLICENSED" for proprietary

# Optional. One boolean per overridable check; omit any to take the org default.
# A repo that fully conforms needs nothing here.
[skills.ki-repo.checks]
branch-protection = true   # default off — protect `main` on this repo

# Required foundation marker — declared, never injected.
[skills.ki-authoring]
```

`title` and `description` are mandatory repository identity. The title is exactly the README H1. The description is exactly the GitHub description and, where present, package.json `description`. A repository that declares `ki-change-management-roadmap` also declares its stable uppercase `repo_code` in this same table; `ki-change-management-roadmap` consumes that code and owns only its theme mapping.

## Per-repo overrides

The rubric carries the **org default** for every check. Most are bedrock — file presence, default branch, description, merge policy, auto-delete-branch, visibility, Dependabot — and aren't negotiable. License is bedrock and **declared, not inferred from visibility**: a repo names its license as an SPDX id in `[skills.ki-repo]` `license` (default MIT), and the auditor checks that the live GitHub license (`license`), a present LICENSE file (`license-file`), and `package.json` `"license"` (`package-license`) all match it. A proprietary declaration (`UNLICENSED`/`proprietary`) expects no recognised OSI license on GitHub and `"UNLICENSED"` in `package.json`. Visibility is a separate, independent check — a private repo may be MIT, a public repo proprietary. The rest are **overridable**: a repo flips one for itself with a single boolean in its `[skills.ki-repo.checks]` table, where `true` = enforce this check and `false` = don't. A check you omit takes the org default, so **a fully-conforming repo writes no overrides at all**. The auditor reports every active override as a `note` (never a failure), so a deliberate departure stays visible without reading as drift.

| Check               | Org default | When enforced, the auditor requires…                |
| ------------------- | ----------- | --------------------------------------------------- |
| `branch-protection` | **off**     | `main`: enforces the protection set ‡               |
| `wiki`              | on          | Wiki disabled.                                      |
| `projects`          | on          | Projects disabled.                                  |
| `issues`            | on          | Issues enabled.                                     |
| `topics`            | on          | _(public)_ carries the standard topic set.          |
| `secret-scanning`   | on          | _(public)_ secret scanning enabled.                 |
| `push-protection`   | on          | _(public)_ secret-scanning push protection enabled. |
| `structure`         | on          | Declares at least one repo-structure table §.       |

‡ When enforced, `branch-protection` requires: a PR (0 approvals), the `build` status check, linear history; no force-push/deletion; admins not enforced.

§ `structure` WARNs (never FAILs) — see the cardinality rule below. Set `structure = false` for a repo that genuinely carries no repo-structure table (e.g. a dotfiles/config repo).

- "Org default **on**" means the check fails unless satisfied — the standard's normal behaviour — and a repo sets the key `false` to step out of it (e.g. `wiki = false` to keep a Wiki). `branch-protection` is the one check that's **off** by default; a repo sets it `true` to protect `main`.
- The required status check for `branch-protection` is **`build`** — the single job in each repo's `.github/workflows/ci.yml` (workflow "CI"). A repo that turns it on but lacks that job can't satisfy the check; add the CI job first.
- `topics` / `secret-scanning` / `push-protection` are **public-only** — they don't apply to a private repo regardless of the override, so the private `arcadia-*` repos need say nothing about them.
- A key under `[…checks]` that names no overridable check (a typo, or a bedrock check) **WARNs** — it would otherwise silently do nothing. The auditor's `CHECK_DEFAULTS` registry is the source of truth for what's overridable.
- A **redundant** override — one whose value just restates the org default (e.g. `wiki = true`) — does nothing, so the auditor flags it with a `note` advising it be dropped. The aim is that a `.ki-config.toml` carries only genuine divergences, and a conforming repo's `[…checks]` is empty or absent.
- `coverage-<skill>` (e.g. `coverage-website = false`) is also accepted here — it opts the repo out of **one** coverage signal of the cascade below (the default is enforced: a detected artifact with no opt-in table WARNs). A `coverage-<skill>` naming no coverage skill WARNs, like any unknown check.

## Coverage cascade

`.ki-config.toml`'s presence is the **gate** (Layer 1): once it confirms the repo is a ki-repo, the auditor checks the repo **declares an opt-in `[ki-<skill>]` table for every governance skill whose applicability it can detect** — a `Streams/` zone ⇒ `[skills.ki-repo-kb-streams]`, an `eleventy.config` ⇒ `[skills.ki-repo-website]`, an `@modelcontextprotocol/sdk` dependency ⇒ `[skills.ki-repo-mcp]`, a `.claude-plugin/marketplace.json` ⇒ `[skills.ki-repo-plugins]`, `proposals/` + `specifications/` + `schemas/` ⇒ `[skills.ki-repo-specifications]`, an `install.sh` + a `bin/<exe>` ⇒ `[skills.ki-repo-tools]`, a `Formula/*.rb` ⇒ `[skills.ki-repo-homebrew-tap]`, `skills/*/SKILL.md` ⇒ `[skills.ki-skills]`, and so on. Detected-but-undeclared WARNs; a declared table with no matching artifact WARNs as possibly stale.

A repo that is **not** a ki-repo (no `.ki-config.toml`) is never coverage-checked — it just takes the `ki-config` FAIL, so a lookalike repo (an `eleventy.config` but no marker) is not falsely told to opt in. This is `ki-repo`'s single cross-table read, and it reads only table **presence**, never another skill's keys. The full signal list and the marker-vs-config model live in [the `.ki-config.toml` standard](standards-configuration.md#coverage-enforcement). Silence one signal with `coverage-<skill> = false` under `[skills.ki-repo.checks]`.

The cascade's companion is a **primary-structure** rule: a repo declares at most one of `[skills.ki-repo-project]` and `[skills.ki-repo-kb]`. Project is the explicit default for non-KB repositories; KB is the mutually exclusive Knowledge Base primary. Declaring both FAILs (`repo-structure`, bedrock — not overridable). The remaining `ki-repo-*` standards are composable specialisations and do not count. Declaring neither WARNs (`structure`) so every governed repository makes its primary model visible.

## Applying it

`gh` CLI, authenticated with repo-admin scope. The commands below are a reference plan, not an unattended conformer: inspect the live state and exact target set, show the proposed diff, and obtain explicit confirmation before each mutation batch. (zsh: use an array, not a bare string — unquoted `$var` does not word-split.)

```zsh
all=(ki-arcadia-principal ki-agentic-harness ki-repo-website mcp-claude-housekeeping mcp-git-audit mcp-gsuite mcp-kb-fs mcp-ki-repo-kb-notion-mirror mcp-m365)
public=(mcp-claude-housekeeping mcp-git-audit mcp-gsuite mcp-kb-fs mcp-ki-repo-kb-notion-mirror mcp-m365)

# Layer 1 — each repo declares its config in .ki-config.toml (committed via PR like any file).
#   Native conform scaffolds/repairs [skills.ki-repo] + [skills.ki-authoring] only.
#   It resolves the verified installed collection; it never vendors self-checks.
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
# Requires the verified active installed collection.
ki repo audit --repo ~/kis/knowledgeislands/example
```

The native command resolves declared operations and checks every applicable layer.

### What is read locally and what is read from GitHub

Evidence comes from two distinct sources, and every finding identifies which one supplied it. A local checkout is primary for Layer 1 file presence, `.ki-config.toml`, tree-based coverage, and `package.json`; it includes tracked, staged, and unignored working-tree content. A local unpushed change therefore appears in a local audit. If a caller explicitly selects a local target and it cannot be read, the audit fails that local evidence collection rather than falling back to GitHub.

An organisation or other filesystem-free remote run reads that same file and configuration evidence from the repository's GitHub default branch. This lets a scheduled or sandboxed judgmental run assess a repository without granting it filesystem access. It sees published state, not a developer's checkout.

Live GitHub settings — visibility, default branch, merge and toggle configuration, topics, branch protection, required checks, security, and Actions policy — exist only on the remote and are always read through GitHub. A finding that compares a local manifest or declaration with a live setting identifies both sources.

## Conformance

Conformance means the native command resolves every declared operation, the local proposal is bounded and reviewable, and every live GitHub change is shown and explicitly confirmed before execution. Legacy vendored-runner status is not conformance to ADR-KI-HARNESS-012.
