---
name: ki-repo
ki-kind: governance
ki-runtime-binding: true
ki-depends-on: [ki-authoring, ki-git]
ki-shared-dependencies: [ki-skills:rubric]
owns: ['.gitignore']
contributes: ['.ki-config.toml']
description: >
  Audits, conforms, and reviews the Knowledge Islands standard for any Git repo with `.ki-config.toml`. Use for "audit this repo", "apply the repo standard", or "review this repository". Covers repository setup, GitHub settings, and `+` / `-` areas; use `ki-engineering`, `ki-repo-harness`, or `ki-change-management-roadmap` for toolchain, bundle, or delivery work.
argument-hint: 'audit | conform <repo> | educate <repo> | help | refresh | review [scope] | review close <REV-NNN>'
---

# Knowledge Islands repo

You are helping hold git repos to one **Knowledge Islands repo standard** — how a repo is _set up_, not what its code does. A **Knowledge Islands repo is a git repo that carries a `.ki-config.toml`** — that file's presence is the compliance marker; the standard applies to any such repo, and the [`knowledgeislands`](https://github.com/knowledgeislands) org is its reference set, not its boundary. The standard has three layers (local files, GitHub settings, deeper GitHub). Its full, quotable form with rationale and the per-repo override model lives in [the repository standard](references/standards-repository.md); the generated [rubric](references/rubric.md) publishes the canonical structured items under `scripts/rubric/`. The cross-cutting **`.ki-config.toml` contract** — what its presence means and how every skill reads its own table — lives in [the configuration standard](references/standards-configuration.md).

Load [the exemplars](references/exemplars.md) when onboarding a repo or when a standard rule needs a worked example.

This skill governs a repo's **configuration and Knowledge Islands compliance** — how a repo is set up, not its source code. REVIEW is the deliberate exception: it may inspect architecture and implementation as evidence, but it creates no compliance criterion or automatic verdict. The skill owns the shared shape and direction of optional repository `+` / `-` working areas; `ki-trades` owns any declared cross-repository `_TRADES` subdirectories and lifecycle, while `ki-repo-kb` applies the same generic directionality within its fixed base staging model. It is a **standard, base-agnostic governance skill**: it hard-codes no single repo or org and discovers its targets at runtime (a local tree, or a whole org via `gh`). How it sits alongside the other skills in this repo (where they complement and where they must not overlap) is documented once in the ki-agentic-harness `README.md`, not repeated here.

## The standard at a glance

1. **Files** — every repo carries `README.md`, `LICENSE`, `.gitignore`, and `.ki-config.toml` (its declared config). A local target reads its checkout first; an `--org` or other filesystem-free run reads the GitHub default branch. (`.editorconfig` is owned by `ki-authoring`, not this skill.)
2. **GitHub** (repos on github.com): default branch `main`, MIT _(public)_ / proprietary + `UNLICENSED` _(private)_, **squash-only merge + linear history**, auto-delete branch on merge, Issues **on**, Wiki & Projects **off**, and the configured description synced with GitHub and `package.json` where one exists; public repos also carry the standard topic set. **`main` is open by default** — branch protection is an _optional_ check a repo opts into (below).
3. **Deeper GitHub**: Dependabot alerts + security updates **on** everywhere; secret scanning + push protection **on** for public repos; Actions `allowed-actions = all`.

**Repository identity and visibility** are **declared** per repo in `.ki-config.toml` under `[skills.ki-repo]`: mandatory `repository` is the canonical HTTPS GitHub home and must match the live GitHub repository; mandatory `title` exactly matches the README H1; mandatory `description` exactly matches GitHub and `package.json` where present; `visibility = "public" | "private"` is checked against live GitHub. A repository declaring `ki-change-management-roadmap` also declares its stable uppercase `repo_code` here; `ki-change-management-roadmap` owns only the theme mapping that consumes it. `.ki-config.toml` is a shared file whose file-level contract and foundation scaffold this skill owns; each skill defines and may conform the schema of its own `[table]`. EDUCATE scaffolds the canonical `[skills.ki-repo]` defaults plus the required bare `[skills.ki-authoring]` marker, preserving any config already present. Per-repo overrides live in a `[skills.ki-repo.checks]` sub-table — one boolean per overridable check (`true` = enforce, `false` = don't); omit any to take the org default, so a fully-conforming repo writes none. `branch-protection` defaults **off** (set `true` to protect `main`); the GitHub-feature and security checks default **on** (set `false` to step out). The auditor prints each active override as a `note`, never a failure. See [the repository standard](references/standards-repository.md).

**Coverage** is enforced on top of that marker — a gated cascade. Once `.ki-config.toml` confirms the repo _is_ a Knowledge Islands repo, the auditor checks that every governance standard whose applicability is _detectable_ in the repo declares its opt-in table: an `eleventy.config` expects `[skills.ki-repo-website]`, a `Streams/` zone expects `[skills.ki-repo-kb-streams]`, the MCP SDK expects `[skills.ki-repo-mcp]`, and so on across `engineering`, `kb`, `website-cloudflare`, `skills`, and `subagents`. A detected-but-undeclared standard is a **WARN** (never a FAIL); a declared table with no matching artifact is a softer "stale?" WARN. The **gate** is what stops a false positive — a plain git repo with an 11ty config but no `.ki-config.toml` is not a Knowledge Islands repo, so coverage is skipped entirely and it simply takes the `ki-config` FAIL. Silence a deliberate non-coverage with `[skills.ki-repo.checks]` `coverage-<skill> = false`. The cascade reads only table _presence_ across the set (presence is a compliance fact `repo` is entitled to check); it never interprets another skill's keys. See [the configuration standard](references/standards-configuration.md).

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH**; EDUCATE here onboards a repo. **REVIEW** is the additional human-led repository-review mode. Invoked as `help` / `-h` / `?`, the skill explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT — check a repo against the standard

Auditing a whole tree or org is a set audit — **bound the context** (the set-audit discipline in `ki-skills`' enforcement framework §5): take the checker's one set-level run over every repo, then do the per-repo judgment pass **one repo at a time**, fully (including every coverage-selected engineering and artifact standard) before moving to the next; repos are independent, so the order is free.

1. Confirm `gh` is authenticated against the org (`gh auth status`).
2. **Run the native audit:** `ki repo audit --repo <repo>` resolves the selected repo's declared roots, validates their explicit dependencies, resolves only compatible registered operations from the verified active installed collection, and runs them in dependency order through the shared finding model. The declared `ki-authoring` prerequisite governs authored repository surfaces, while `ki-git` supplies portable working and commit policy before this skill adds repository shape and GitHub settings. Missing, incompatible, undeclared, or untrusted skills fail before an operation runs.
3. **Do the judgment pass the mechanical layer cannot** — the `[J]` items in [the rubric](references/rubric.md): does each description actually _match the repo's purpose_ (the mechanical layer checks non-emptiness and `package.json` sync, but not fit); is each per-repo override (a `note` in the output) a warranted decision rather than waved-off drift; and, where `+/` or `-/` exists, whether its generic contents remain temporary directional material rather than becoming a shadow roadmap or uncontrolled archive.

When the command runs in a local KI installation, AUDIT also checks that the resolved physical repository root is present in the user's XDG `ki` configuration registry. It never searches for or infers other repositories. Cloud-account registry and reconciliation are deliberately outside this local contract. 4. **Report** by `repo · check · fix`, lead with FAILs, surface any **coverage** WARNs (a detected standard with no opt-in table), and call out the overrides (`note`s) you judged warranted.

### Mode CONFORM — bring a repo (or the org) into line

Outward-facing: it changes live GitHub settings and may open PRs. Show the diff and confirm before mutating.

`ki repo conform --repo <repo>` records the selected physical local KI root in the user's registry, then resolves the declared, verified installed collection and proposes the local `.gitignore` and required config root-marker repairs. A missing config receives the canonical `[skills.ki-repo]` defaults plus bare `[skills.ki-authoring]`; a partial config receives only its missing exact root marker; existing bytes remain an exact prefix; repeat runs are byte-identical; and `--dry-run` writes nothing. Missing, incompatible, undeclared, or untrusted skills fail before any repository write.

1. Run **AUDIT** first, so you change against a known gap list.
2. Run `ki repo conform --repo <repo>` for the bounded local mechanical layer. Live GitHub settings remain outside the session proposal: inspect the commands in [the repository standard](references/standards-repository.md#applying-it), show the exact diff, and obtain explicit confirmation before applying them.
3. Resolve the judgment items yourself — document content, description fit, runtime orientation, override rationale, and standard synchronisation.
4. **Re-audit** to confirm convergence.

For a bootstrapped local KI installation, `ki repo register` records selected physical repository roots in the user's XDG registry without resolving declarations or applying repairs. The local lifecycle is convergent: `ki repo init`, direct-CWD `ki repair`, and CONFORM each attempt the same registration before their later work, so a malformed or failing repository remains discoverable. The registry is inventory, not a compliance verdict: registration adds only explicitly selected roots, preserves other user configuration, and never removes or scans registry entries. Without a local user configuration, CONFORM remains portable and does not create one. Cloud-account registration is outside this mode.

### Mode EDUCATE — make a repo Knowledge Islands–compliant

Onboard a repo by adding the marker file (and the other root files) so it joins the standard. Local only — no live GitHub change; hand the live settings to **CONFORM**.

1. Add any missing root files: `README.md` / `LICENSE` / `.gitignore` (`.editorconfig` is `ki-authoring`'s).
2. Establish the declarative foundations only: a missing config gets one canonical `[skills.ki-repo]` default block plus one bare `[skills.ki-authoring]`; a partial file gets only whichever exact root marker is absent. A dotted sub-table such as `[skills.ki-repo.checks]` does not satisfy the root marker. Existing values, comments, order, and all other bytes are preserved; repeat runs are idempotent. Native activation resolves the declared skills from the verified installed collection rather than vendoring checkers or runners into the repository.
3. Activation is deliberately separate from configuration: `ki repo skill add <skill>` and `ki skill add <skill>` create only managed runtime discovery links after ownership and containment checks. They do not change a declaration into an execution payload.
4. Set `visibility` and any `[…checks]` overrides (see [the configuration standard](references/standards-configuration.md)), commit (a direct push to `main` is fine — it's open), then run **CONFORM** for the GitHub settings.

### Mode REFRESH — re-anchor the standard to GitHub's surface

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-repo-kb`'s IMPROVE mode instead.

GitHub's settings surface moves (rulesets vs classic protection, new security toggles, Actions policy). Run on its declared cadence (see `references/sources.md`), or when asked "is the repo standard current".

1. **Read [the source list](references/sources.md)** — the tracked GitHub REST API / `gh` / rulesets / security-features sources, each with a `last reviewed` date.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if a host is blocked or returns non-200) and **diff** against [the repository standard](references/standards-repository.md), [the configuration standard](references/standards-configuration.md), and the structured catalogue under `scripts/rubric/`: new or renamed settings, changed defaults, protection moving to rulesets, new security toggles.
3. **Scan the org** for emergent patterns the standard hasn't captured.
4. **Propose a diff** to the applicable standard, the structured family module, and this file; confirm before writing.
5. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block (what's confirmed, open watch-items). What changed goes in the commit, not a changelog. Mandatory: the source list is the skill's memory of where the standard comes from.

### Mode REVIEW — examine repository architecture and implementation

Run a bounded, human-led repository review: agree the frame, gather inspectable evidence, interview material uncertainty, identify findings, and route each outcome to `ki-change-management-roadmap` / `ki-plan`, `ki-decision-records`, `ki-specs`, a guide, or no action.

Read and follow [the REVIEW procedure](references/mode-review.md). Mechanical `ki repo audit` output may be evidence, but REVIEW does not turn architecture or implementation observations into repository-compliance rules, create an automatic score, or publish a durable route without explicit confirmation. Use `review close <REV-NNN>` to assess whether an optional review record can be pruned.

## Notes

- Requires the `gh` CLI authenticated with **repo-admin** scope to apply settings.
- `main` is **open by default** — direct pushes are allowed, so local-file fixes (EDUCATE / CONFORM step 2) can land as a direct commit. A repo overrides the `branch-protection` check on (`[…checks]` `branch-protection = true`); only then does CONFORM protect that repo's `main`.
- **Private repos**: secret scanning is plan-limited; the standard exempts it (public-only check). Revisit via **GHAS** if the org upgrades — a REFRESH follow-up.
- The auditor is **read-only**; EDUCATE and CONFORM are the write modes. CONFORM limits local mutation to mechanically confirmed gaps before it considers live GitHub changes.
- REVIEW is human-led and judgmental. It may inspect source code, but it does not broaden the AUDIT rubric or CONFORM mutation boundary.
- This skill owns the `.ki-config.toml` **file-level contract and foundation scaffold** (including the coverage cascade — which `[ki-*]` tables a repo declares). Other skills own and may conform their own table schemas; they must preserve unrelated tables. ADR-KI-HARNESS-012 assigns runtime activation to native `ki repo skill add`, which creates only managed runtime discovery links after ownership and containment checks; it does not vendor an executor into `.ki/` or change the configuration contract.
- The structured catalogue owns criterion policy; `ki` owns validation, execution, findings, progress, and reporting.
