---
name: ki-repo
implies: [ki-authoring, ki-engineering]
description: >
  Codify, audit, and apply the Knowledge Islands repo standard to any Knowledge Islands–compliant git repo — one that carries a `.ki-config.toml` — not only the `knowledgeislands` org, which is its reference set. Covers the local files (README, LICENSE, .gitignore, .editorconfig), GitHub settings (merge policy, branch, features, topics, visibility, description), and security (secret scanning, Dependabot, Actions). Use when checking whether repos match the standard, bringing one into line, onboarding a new repo, or refreshing the standard against GitHub's surface. Triggers: "audit the repos", "do our repos follow the standard", "apply the repo standard", "enable secret scanning / Dependabot", "refresh the repo standard". Discovers repos from a local tree (github.com-gated) or a whole org via `gh`. Governs repo configuration, not source code. Off-ramps: `ki-authoring` (Markdown/TOML style), `ki-engineering` (toolchain), `ki-harness` (bundle layout).
argument-hint: 'audit | conform <repo> | init <repo> | refresh'
---

# Knowledge Islands repo

You are helping hold git repos to one **Knowledge Islands repo standard** — how a repo is _set up_, not what its code does. A **Knowledge Islands repo is a git repo that carries a `.ki-config.toml`** — that file's presence is the compliance marker; the standard applies to any such repo, and the [`knowledgeislands`](https://github.com/knowledgeislands) org is its reference set, not its boundary. The standard has three layers (local files, GitHub settings, deeper GitHub). Its full, quotable form with rationale and the per-repo override model lives in [the standard](references/repo-standard.md); the line-by-line checkable items (each tagged mechanical/judgment) live in [the rubric](references/audit-rubric.md); the mechanical checker is [`scripts/audit-repo.ts`](scripts/audit-repo.ts). The cross-cutting **`.ki-config.toml` contract** — what its presence means and how every skill reads its own table — lives in [the contract](references/ki-config-standard.md).

This skill governs a repo's **configuration and Knowledge Islands compliance** — how a repo is set up, not its source code. It is a **standard, base-agnostic Process skill**: it hard-codes no single repo or org and discovers its targets at runtime (a local tree, or a whole org via `gh`). How it sits alongside the other skills in this repo (where they complement and where they must not overlap) is documented once in the ki-agentic-harness `README.md`, not repeated here.

## The standard at a glance

1. **Files** — every repo carries `README.md`, `LICENSE`, `.gitignore`, `.editorconfig`, and `.ki-config.toml` (its declared config). Presence is checked on the default branch **via the GitHub API**, not a checkout.
2. **GitHub** (repos on github.com): default branch `main`, MIT _(public)_ / proprietary + `UNLICENSED` _(private)_, **squash-only merge + linear history**, auto-delete branch on merge, Issues **on**, Wiki & Projects **off**, a non-empty description synced with `package.json` where one exists; public repos also carry the standard topic set. **`main` is open by default** — branch protection is an _optional_ check a repo opts into (below).
3. **Deeper GitHub**: Dependabot alerts + security updates **on** everywhere; secret scanning + push protection **on** for public repos; Actions `allowed-actions = all`.

**Visibility** is **declared** per repo in `.ki-config.toml` under `[ki-repo]` (`visibility = "public" | "private"`) and checked against live GitHub — not inferred from the name. `.ki-config.toml` is a shared file: each skill reads its own `[table]`, and `--init` scaffolds this skill's default keys. Per-repo overrides live in a `[ki-repo.checks]` sub-table — one boolean per overridable check (`true` = enforce, `false` = don't); omit any to take the org default, so a fully-conforming repo writes none. `branch-protection` defaults **off** (set `true` to protect `main`); the GitHub-feature and security checks default **on** (set `false` to step out). The auditor prints each active override as a `note`, never a failure. See [the standard](references/repo-standard.md).

**Coverage** is enforced on top of that marker — a gated cascade. Once `.ki-config.toml` confirms the repo _is_ a Knowledge Islands repo, the auditor checks that every governance standard whose applicability is _detectable_ in the repo declares its opt-in table: an `eleventy.config` expects `[ki-website]`, a `Streams/` zone expects `[ki-kb-streams]`, the MCP SDK expects `[ki-mcp]`, and so on across `engineering`, `kb`, `website-cloudflare`, `skills`, and `agents`. A detected-but-undeclared standard is a **WARN** (never a FAIL); a declared table with no matching artifact is a softer "stale?" WARN. The **gate** is what stops a false positive — a plain git repo with an 11ty config but no `.ki-config.toml` is not a Knowledge Islands repo, so coverage is skipped entirely and it simply takes the `ki-config` FAIL. Silence a deliberate non-coverage with `[ki-repo.checks]` `coverage-<skill> = false`. The cascade reads only table _presence_ across the set (presence is a compliance fact `repo` is entitled to check); it never interprets another skill's keys. See [the contract](references/ki-config-standard.md).

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · INIT · REFRESH**; INIT here onboards a repo. If invoked without a mode, use `AskUserQuestion` to list each mode with a one-line description; if the chosen mode shows a target in the `argument-hint`, prompt for that too.

### Mode AUDIT — check a repo against the standard

Auditing a whole tree or org is a set audit — **bound the context** (the set-audit discipline in `ki-engineering`'s enforcement-framework §5): take the checker's one set-level run over every repo, then do the per-repo judgment pass **one repo at a time**, fully (its composed `engineering` / artifact-skill audits included) before moving to the next; repos are independent, so the order is free.

1. Confirm `gh` is authenticated against the org (`gh auth status`).
2. **Run the mechanical checker**: `bun scripts/audit-repo.ts <tree-path>` (local repos, github.com-gated) or `--org <org>` (the whole org, including repos not cloned locally). It grades findings on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / SKIP / PASS — see `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md)) and exits non-zero on any FAIL; with `--json` / `--report` it emits machine-readable findings and writes the latest report to the repo's `.ki-meta/audits/repo.{md,json}`. Capture its output verbatim.
3. **Do the judgment pass the script can't** — the `[J]` items in [the rubric](references/audit-rubric.md): does each description actually _match the repo's purpose_ (the script now checks non-emptiness and `package.json` sync mechanically — `description` / `description-sync` — but not fit); is each per-repo override (a `note` in the output) a warranted decision rather than waved-off drift.
4. **Report** by `repo · check · fix`, lead with FAILs, surface any **coverage** WARNs (a detected standard with no opt-in table), and call out the overrides (`note`s) you judged warranted.

### Mode CONFORM — bring a repo (or the org) into line

Outward-facing: it changes live GitHub settings and may open PRs. Show the diff and confirm before mutating.

The audit-rubric's `[M]` findings are scripted: `bun scripts/conform-repo.ts [path]` (`--dry-run` to preview) applies every mechanical `gh` call in [the standard](references/repo-standard.md#applying-it) directly — merge methods, auto-delete-branch, Wiki/Projects/Issues, topics, branch protection (only when `[ki-repo.checks]` opts it in), Dependabot alerts/updates, `allow_update_branch`, secret scanning + push protection (public), Actions permissions — and scaffolds `.gitignore` / `.editorconfig` / a `.ki-config.toml` `[ki-repo]` block when absent. It prints the 3 `[J]` findings (README content, description text/visibility, whether a `[ki-repo.checks]` override is warranted) as manual TODOs rather than guessing — those still need a human read.

1. Run **AUDIT** first, so you change against a known gap list.
2. Run `conform-repo.ts` for the mechanical layer (or apply the `gh` commands in [the standard](references/repo-standard.md) by hand).
3. Resolve the 3 printed `[J]` TODOs yourself — README content, description/visibility, per-repo check overrides.
4. **Re-audit** to confirm convergence.

### Mode INIT — make a repo Knowledge Islands–compliant

Onboard a repo by adding the marker file (and the other root files) so it joins the standard. Local only — no live GitHub change; hand the live settings to **CONFORM**.

1. Add any missing root files: `README.md` / `LICENSE` / `.gitignore` / `.editorconfig`.
2. Scaffold the marker: `bun scripts/audit-repo.ts --init >> .ki-config.toml`, then set `visibility` and any `[…checks]` overrides (see [the `.ki-config.toml` contract](references/ki-config-standard.md)). Its presence is what makes the repo compliant.
3. Commit (a direct push to `main` is fine — it's open), then run **CONFORM** for the GitHub settings.

### Mode REFRESH — re-anchor the standard to GitHub's surface

GitHub's settings surface moves (rulesets vs classic protection, new security toggles, Actions policy). Run on its declared cadence (see `references/sources.md`), or when asked "is the repo standard current".

1. **Read [the source list](references/sources.md)** — the tracked GitHub REST API / `gh` / rulesets / security-features sources, each with a `last reviewed` date.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if a host is blocked or returns non-200) and **diff** against [the standard](references/repo-standard.md) and [`scripts/audit-repo.ts`](scripts/audit-repo.ts): new or renamed settings, changed defaults, protection moving to rulesets, new security toggles.
3. **Scan the org** for emergent patterns the standard hasn't captured.
4. **Propose a diff** to the standard, the script, and this file; confirm before writing.
5. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block (what's confirmed, open watch-items). What changed goes in the commit, not a changelog. Mandatory: the source list is the skill's memory of where the standard comes from.

## Notes

- Requires the `gh` CLI authenticated with **repo-admin** scope to apply settings.
- `main` is **open by default** — direct pushes are allowed, so local-file fixes (INIT / CONFORM step 2) can land as a direct commit. A repo overrides the `branch-protection` check on (`[…checks]` `branch-protection = true`); only then does CONFORM protect that repo's `main`.
- **Private repos**: secret scanning is plan-limited; the standard exempts it (public-only check). Revisit via **GHAS** if the org upgrades — a REFRESH follow-up.
- The auditor is **read-only**; only CONFORM mutates, and only against confirmed gaps.
- This skill owns the `.ki-config.toml` **content** (the coverage cascade — which `[ki-*]` tables a repo declares). Wiring those declared skills into the repo's `.claude/skills/` (the project-local install) is `ki-bootstrap`'s job — the off-ramp for "set up this repo's skills". This skill decides _which_ skills apply; bootstrap _links_ them.
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).
