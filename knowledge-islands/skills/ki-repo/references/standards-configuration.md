# The `.ki-config.toml` contract

The cross-cutting contract for the shared **`.ki-config.toml`** file every Knowledge Islands repo carries. It is owned by `ki-repo` because **a Knowledge Islands repo is defined by carrying this file** — its presence is the compliance marker, and `ki-repo` governs the repo's compliance. Every other standard-holding skill reads its own table within it. (The TOML _formatting_ style — key case, quoting, comments — is the `ki-authoring` skill's; see its `standards-toml.md` reference. This document governs the _contract_: the file's meaning and the cross-skill protocol.)

## Contents

- [The shared file & the compliance marker](#the-shared-file--the-compliance-marker)
- [Harnesses and the skills namespace](#harnesses-and-the-skills-namespace)
- [Marker vs config tables](#marker-vs-config-tables)
- [Validate your own table](#validate-your-own-table)
- [Declared divergences](#declared-divergences)
- [Overridable vs fixed](#overridable-vs-fixed)
- [Coverage enforcement](#coverage-enforcement)
- [Scaffolding & ownership](#scaffolding--ownership)
- [Local registry](#local-registry)

## The shared file & the compliance marker

A repo declares its configuration in **one** `.ki-config.toml` at its root — not one file per concern. It is shared: several skills may read it, each from its own section. This keeps a repo's declared config in a single reviewable place and lets a skill discover what it needs without a bespoke file.

Its **presence is the marker of a Knowledge Islands–compliant repo**, and the **gate of the coverage cascade** (below): a repo that carries `.ki-config.toml` has opted into the house standards, and the standard-holding skills are what hold it to them, each reading its own table where it needs declared config. Onboarding a repo (adding the file) is the act of making it compliant; `ki-repo` requires it as a Layer-1 root file, is the skill that audits it, and — because it is the gate — is also the skill that checks the repo declares the other standards that govern it (_Coverage enforcement_, below).

## Harnesses and the skills namespace

A repository names the harnesses that provide its skills once, in `[repo]`, and declares each governing skill by its **bare name** under the `[skills]` namespace. A skill that needs declared config owns **exactly one** table there, named for the skill, and may nest sub-tables under it (e.g. `[skills.<name>.checks]`):

```toml
[repo]
harnesses = ["knowledgeislands/ki-agentic-harness"]

[skills.ki-repo]
repository = "https://github.com/owner/repository" # canonical GitHub home
title = "Example repository" # exact README.md H1
description = "One sentence describing the repository." # exact GitHub and package.json description where present
visibility = "public"
license = "MIT"          # SPDX id; default MIT when unset. "UNLICENSED" for proprietary.
supported_runtimes = ["claude-code", "chatgpt-codex"] # required agent-runtime support surface

[skills.ki-repo.checks]
branch-protection = true
```

`[skills]` is a namespace, not a skill: it makes "this key is a declaration" structural rather than a guess about how the key is spelled. A repository-level setting that belongs to no skill lives in `[repo]` and is never mistaken for one.

`[skills.ki-repo]` carries repository identity and declared facts the auditor checks. `repository` is mandatory and is the canonical HTTPS GitHub home (`https://github.com/<owner>/<repository>`), checked against GitHub's repository identity. `title` and `description` are mandatory: title exactly matches the README H1, while description exactly matches GitHub and package.json where those surfaces exist. `visibility` (`"public"` | `"private"`, matched against GitHub) and `license` (an [SPDX License List](https://spdx.org/licenses/) identifier — default MIT when unset — matched against the live GitHub license, the `LICENSE` file, and `package.json` `"license"`) are independent: a private repo may be MIT, a public repo proprietary. Use [Choose a License](https://choosealicense.com/) as selection guidance; use `"UNLICENSED"` for all-rights-reserved proprietary.

The third, `supported_runtimes`, is a **repo-wide** fact — the agent runtimes this repo supports. It lives on `[skills.ki-repo]` rather than `[skills.ki-repo-harness]` because it drives orientation, skills, subagents, and MCP across the whole repo, not just the five-part harness bundle; a non-harness KI repo can support runtimes too. Native activation resolves it to each runtime's discovery path (Claude Code → `.claude/`, ChatGPT Codex → `.agents/`; see the runtime feature-coverage matrix in `SDR-KI-HARNESS-002`). The key is required: support is a stable repository capability, never inferred from the directories present at a moment in time. Values must name a recognised runtime (`claude-code`, `claude-desktop`, or `chatgpt-codex`), must be non-empty, and must not repeat — the auditor's `RUNTIMES-1` FAILs otherwise. The retired `codex` identifier is rejected with recovery guidance; it is not a compatibility alias.

Runtime environment coverage follows that declaration rather than being opt-in. Every repository declares portable `[skills.ki-tokenomics]`. A repository supporting `claude-code` also declares `[skills.ki-housekeeping-claude]` and `[skills.ki-tokenomics-claude]`; one supporting `chatgpt-codex` declares `[skills.ki-tokenomics-codex]`. The runtime-bound `ki-housekeeping-codex` capability is available for explicit opt-in but is not yet mandatory runtime coverage: its repository identity and permanent-deletion controls are documented, while its machine-readable app-server and complete descendant filter remain experimental. `RUNTIMES-2` derives the mandatory set and checks both local declarations and host-resolved repository activation. Its CONFORM action requests one native host proposal for missing capabilities; it never writes a sibling-owned table, creates a runtime link, selects a provider, or changes user configuration itself. Missing, ambiguous, incompatible, unavailable, untrusted, or altered activation evidence fails closed under the host's ownership.

- The table name **matches the skill's `name`** exactly, so the owner is unambiguous and the file reads as a map of skill → its settings.
- A skill reads **only its own table** and never reaches into another skill's — the table boundary is the schema ownership boundary. If two skills need the same fact, it still lives under whichever skill owns it, and the other resolves it from there. `ki-repo` owns the shared file-level contract and required foundation scaffold; each skill may conform its own table while preserving every other table.

### Resolution

A bare name binds to exactly one provider, resolved against the declared `harnesses` list rather than against whichever harnesses happen to be installed — so a version-controlled file means the same thing on every machine.

- Exactly one declared harness provides the skill → it binds, and its qualified identity is derived rather than written.
- No declared harness provides it → an error naming the skill and the declared list.
- More than one provides it → an error requiring explicit qualification.

Declaring a skill is separate from configuring it. `[skills.ki-trades]` with no keys is a marker; a skill is never declared as a side effect of one of its sub-tables. State the root table explicitly even where TOML would create it implicitly, so a declaration never depends on whether the skill happens to carry configuration.

### The out-of-list exception

A skill drawn from a harness outside the declared list keeps a quoted, fully-qualified key, so the exception stays visibly exceptional:

```toml
[skills."otherowner/other-harness:ki-example"]
```

This is the only place a qualified key appears in the file, and it is the same exception shape trade routes use for a partner off the default host.

## Marker vs config tables

A `[skills.<name>]` table plays one or both of two roles:

- **Marker (opt-in)** — its _presence_ declares "this skill governs this repo." The bare header is enough; it needs no keys.
- **Config** — it carries per-repo declarations the skill reads (data the standard fits to, or `[…checks]` divergences).

The two are separable: a base on the canonical zone names declares a bare `[skills.ki-repo-kb]` (marker only, no keys); a base that renames a zone adds a `[skills.ki-repo-kb.zones]` alias (config). The marker/opt-in skills are `ki-engineering`, `-kb`, `-streams`, `-website`, `-website-cloudflare`, `-mcp`, `-skills`, and `-subagents`. `ki-repo` is the **bedrock marker** — the file's very presence is what makes the repo a ki-repo. `ki-authoring` governs every markdown repo, but it is **declared, not assumed**: every repo carries a bare `[skills.ki-authoring]` table like any other coverage (a missing one is a FAIL — `authoring-baseline`, [ADR-KI-HARNESS-005](../../../../docs/decisions/ADR-KI-HARNESS-005-validate-down-ki-config-toml-contract.md)). There is no injected/cascade-exempt baseline: coverage is purely what the config declares (ADR-KI-HARNESS-007).

So **what an absent table means is per-skill**, and that is exactly what _Coverage enforcement_ (below) checks:

| Table absent | Means |
| --- | --- |
| `[skills.ki-repo]` (the file) | not a ki-repo — the marker itself (bedrock; missing file is a FAIL) |
| any other marker skill's table | not opted into that standard — a coverage WARN _if_ the repo shows that skill's artifacts |
| `ki-authoring` | a bare `[skills.ki-authoring]` marker — declared like any coverage, not assumed (FAIL if missing) |

Every declared governance root also commits the repository to a complete **resolvable native capability**: `ki repo audit` and `ki repo conform` must resolve its compatible registered operations only from the verified active installed collection before any operation runs. A declaration is not a request to vendor a manifest or payload into the repository. Process skills (`ki-next`, `ki-plan`, `ki-implement`, `ki-accept`, `ki-batch`, and `ki-recap`) remain global process tooling, not target-local governance contracts, and must not be declared in `.ki-config.toml`. Human-led repository review is a mode of the declared `ki-repo` capability, not a separate configuration table.

## Validate your own table

A skill **validates its own table and only its own**: it warns on a key (or sub-table entry) under its table that it doesn't recognise — a typo or a stale option should surface, not silently do nothing — and advises dropping one that merely restates a default. It leaves every other skill's table untouched, even keys it can't interpret. **Validate down, ignore across.** (`ki-repo` is the reference: it warns on an unknown `[…checks]` entry, notes a redundant one, and never inspects another skill's table.) The same boundary governs conformers: a skill may change its own table, never another's.

## Declared divergences

Where a skill's standard allows a repo to diverge from a default, record that **in the skill's own table** so it reads as a declared choice, not drift. The _shape_ is the owning skill's business — `ki-repo`, for instance, carries a `[…checks]` sub-table of booleans where any check set against its org default is the divergence:

```toml
[skills.ki-repo.checks]
wiki = false   # this repo keeps a Wiki — deliberate, not drift
```

The owning skill's auditor then reports the divergence as an acknowledged note rather than a failure. Adopt the same principle for any skill that needs declared, reviewable per-repo overrides: the divergence lives under that skill's table, is commented with its _why_, and is validated by that skill (an unrecognised key warns).

For a wholly owned file that needs a safety exception, the owning skill may use a nested map of exact filenames to non-empty reasons. The declaration protects only the named destructive conform write; it remains a warning and never supplies a second local template or arbitrary configuration delta.

## Overridable vs fixed

A skill's standard fixes its model; a base or repo may declare **only** the keys that skill documents as overridable, and nothing else is a config knob. Two kinds of declaration are overridable: **data** the standard reads to fit a target (e.g. `ki-repo-kb`'s zone aliases, `required_frontmatter`, and `preflight`), and **divergences** from a default (the `[…checks]` booleans above). Everything not so documented is **fixed** by the standard — a target does not redefine it in config. This split is what keeps target-specificity declared-and-auditable rather than forked into a coupled skill: where a target differs, it differs through a documented key, not a bespoke `<target>-*` extension skill.

So the option set is **authored, not implicit**: each skill with declarable keys defines and can emit or conform its commented schema/default fragment, so an author sees exactly what may be set and an undocumented key warns (validate-down). `ki-repo` separately owns the file-level contract and required foundation markers. A target-specific need that no documented key can express is a signal to **generalise it into the standard** (a REFRESH candidate), not to invent an ad-hoc key or fork a skill.

## Coverage enforcement

The file's presence is the **gate of an audit cascade**. Once a repo is confirmed a ki-repo (it carries `.ki-config.toml`), `ki-repo`'s auditor checks that the repo **declares an opt-in table for every governance skill whose applicability is detectable in it**. A detected-but-undeclared signal WARNs ("looks governed by `ki-<skill>` but declares no `[skills.ki-<skill>]`"); a declared-but-undetected table WARNs as a possibly stale opt-in.

The gate is what prevents a **false positive**: a plain git repo that has, say, an `eleventy.config` but **no `.ki-config.toml`** is not a ki-repo, so it is never told to declare a website table. It simply takes the `ki-config` required-file FAIL. Coverage is only ever considered _after_ the marker confirms a ki-repo.

The detection signals `ki-repo` uses (one recursive tree read + `package.json`):

| Skill | Detection signal | Opt-in table |
| --- | --- | --- |
| `ki-engineering` | `package.json` present | `[skills.ki-engineering]` |
| `ki-repo-kb` | canonical zones (`Pillars/` + `Resources/`) | `[skills.ki-repo-kb]` |
| `ki-repo-kb-streams` | `Streams/` zone | `[skills.ki-repo-kb-streams]` |
| `ki-repo-website` | either website implementation signal below | `[skills.ki-repo-website]` |
| `ki-repo-website-content` | `eleventy.config.*` | `[skills.ki-repo-website-content]` |
| `ki-repo-website-app` | Vite config plus React and Vite dependencies | `[skills.ki-repo-website-app]` |
| `ki-repo-website-cloudflare` | a `wrangler.*` config | `[skills.ki-repo-website-cloudflare]` |
| `ki-repo-mcp` | `@modelcontextprotocol/sdk` dependency | `[skills.ki-repo-mcp]` |
| `ki-repo-plugins` | `.claude-plugin/marketplace.json` | `[skills.ki-repo-plugins]` |
| `ki-repo-specifications` | `proposals/` + `specifications/` + `schemas/` | `[skills.ki-repo-specifications]` |
| `ki-repo-tools` | `install.sh` + a `bin/<exe>` | `[skills.ki-repo-tools]` |
| `ki-repo-homebrew-tap` | `Formula/*.rb` | `[skills.ki-repo-homebrew-tap]` |
| `ki-skills` | `skills/*/SKILL.md` | `[skills.ki-skills]` |
| `ki-subagents` | Claude Markdown or Codex TOML projection | `[skills.ki-subagents]` |
| `ki-subagents-claude` | `subagents/**/*.md` | `[skills.ki-subagents-claude]` |
| `ki-subagents-codex` | `.codex/agents/**/*.toml` | `[skills.ki-subagents-codex]` |
| `ki-checkpoint` | `+/_CHECKPOINTS/` subarea | `[skills.ki-checkpoint]` |

This is the **one place** `ki-repo` reads across skill tables — and it reads only table **presence**, never another skill's keys (_validate down, ignore across_ still governs table _contents_). It is an **audit-time enforcement** run by `repo`'s auditor, not behaviour baked into the regular use of each skill. A repo opts out of a single signal with a `coverage-<skill> = false` entry under `[skills.ki-repo.checks]`. Website keys are independent: `coverage-website`, `coverage-website-content`, `coverage-website-app`, and `coverage-website-cloudflare` do not disable one another.

No marker table is decorative — each is read by code. Most are read by their **owning** skill's auditor too (`-engineering`/`-kb`/`-streams`/`-website`/`-website-cloudflare`/`-mcp`/`-plugins` each read their own table when run). `ki-skills`, `ki-subagents`, and its runtime adapters are the documented exception: their checkers lint artifact sets (`SKILL.md` files or native agent projections), not a repo's config, so their opt-in tables are read only by `ki-repo`'s coverage check.

## Repository kind

`[skills.ki-repo]` owns `repo_type` and, for a Knowledge Base, `store_roles`. The ordinary repository model is implicit when `repo_type` is omitted. A Knowledge Base writes `repo_type = "kb"` and a duplicate-free `store_roles` array containing `notes`; it may additionally declare `sources` and `legacy`. These are role names, not paths or local-machine bindings. No other skill table owns or accepts a repository kind declaration.

## Scaffolding & ownership

The **schema and conformer** inside a table belong to the skill that owns it: that skill documents the allowed keys and may emit or update its canonical fragment while preserving unrelated content. `ki-repo` owns the shared file-level contract and the two required foundation markers. No operation embeds another skill's TOML template or edits that skill's table directly. This retains one shared `.ki-config.toml`, one table per skill, read-only access across table boundaries, and validate-down/conform-down ownership.

`ki-repo`'s own foundation action establishes the required markers. For a missing file it writes one canonical `[skills.ki-repo]` default block followed by one bare `[skills.ki-authoring]`. For a partial file it appends only whichever exact root marker is absent; `[skills.ki-repo.checks]` alone is not an exact `[skills.ki-repo]` marker. Existing content remains an exact byte-for-byte prefix — including values, comments, ordering, and existing newline bytes — repeat runs are idempotent, and dry-run writes nothing. CONFORM applies the local repair while live GitHub changes remain separately confirmed work.

The native configuration and activation flow runs this owner leg without embedding a TOML template or writing another skill's table. It re-reads the result before resolving the declared operations from the verified installed collection; it does not vendor an executor. No-seed/no-config activation remains an empty-set operation, so this flow does not recreate an injected baseline.

The native resolver validates declaration names. Exact and dotted `[skills.ki-*]` headers both resolve to their root owner; bare and simply quoted TOML keys are equivalent, header-looking text inside multiline strings is ignored, and noncanonical ki-like roots remain visible so they fail rather than disappear. Repeated roots collapse. If any declared root is unresolvable, native audit, activation, dry-run, and the repository-mutating portion of CONFORM fail and report each name once in sorted order. Rename reconciliation stays human because no mechanical mapping can establish intent.

## Local registry

The local user configuration separately records physical roots that have been addressed as KI repositories. It is an inventory for audit, repair, and future bulk operations — not a record of successful conformance. `ki repo register` adds explicitly selected physical roots without resolving declarations or applying repository repairs. `ki repo init`, direct-CWD `ki repair`, and a local non-dry-run `ki repo conform` each attempt the same registration before their later work, so a malformed or failing `.ki-config.toml` remains discoverable. Registration preserves existing entries, never removes an entry, and does not search the filesystem beyond the caller's explicit target selection. Without a bootstrapped local user configuration, CONFORM remains portable and does not create one; the standalone registration command requires it. Cloud-account registry and reconciliation are outside this local contract.
