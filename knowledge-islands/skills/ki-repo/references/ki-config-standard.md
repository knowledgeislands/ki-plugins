# The `.ki-config.toml` contract

The cross-cutting contract for the shared **`.ki-config.toml`** file every Knowledge Islands repo carries. It is owned by `ki-repo` because **a Knowledge Islands repo is defined by carrying this file** — its presence is the compliance marker, and `-repo` governs the repo's compliance. Every other standard-holding skill reads its own table within it. (The TOML _formatting_ style — key case, quoting, comments — is the `ki-authoring` skill's; see its [toml-config.md](../../../foundations/ki-authoring/references/toml-config.md). This doc governs the _contract_: the file's meaning and the cross-skill protocol.)

## Contents

- [The shared file & the compliance marker](#the-shared-file--the-compliance-marker)
- [Table per skill](#table-per-skill)
- [Marker vs config tables](#marker-vs-config-tables)
- [Validate your own table](#validate-your-own-table)
- [Declared divergences](#declared-divergences)
- [Overridable vs fixed](#overridable-vs-fixed)
- [Coverage enforcement](#coverage-enforcement)
- [Scaffolding & ownership](#scaffolding--ownership)

## The shared file & the compliance marker

A repo declares its configuration in **one** `.ki-config.toml` at its root — not one file per concern. It is shared: several skills may read it, each from its own section. This keeps a repo's declared config in a single reviewable place and lets a skill discover what it needs without a bespoke file.

Its **presence is the marker of a Knowledge Islands–compliant repo**, and the **gate of the coverage cascade** (below): a repo that carries `.ki-config.toml` has opted into the house standards, and the standard-holding skills are what hold it to them, each reading its own table where it needs declared config. Onboarding a repo (adding the file) is the act of making it compliant; `ki-repo` requires it as a Layer-1 root file, is the skill that audits it, and — because it is the gate — is also the skill that checks the repo declares the other standards that govern it (_Coverage enforcement_, below).

## Table per skill

Each skill that needs declared config owns **exactly one** TOML table, named for the skill (a skill may nest sub-tables under it, e.g. `[<skill>.checks]`):

```toml
[ki-repo]
visibility = "public"
license = "MIT"          # SPDX id; default MIT when unset. "UNLICENSED" for proprietary.
target_runtimes = ["claude-code"]   # agent runtimes the linkers install for; absent → ["claude-code"]

[ki-repo.checks]
branch-protection = true
```

`[ki-repo]` carries three declared facts the auditor checks. Two are matched against the live repo: `visibility` (`"public"` | `"private"`, matched against GitHub) and `license` (an SPDX id — default MIT when unset — matched against the live GitHub license, the `LICENSE` file, and `package.json` `"license"`). The two are **independent**: a private repo may be MIT, a public repo proprietary. Pick a license at [choosealicense.com](https://choosealicense.com/); use `"UNLICENSED"` for all-rights-reserved proprietary.

The third, `target_runtimes`, is a **repo-wide** fact — the agent runtimes this repo installs its skills and agents for. It lives on `[ki-repo]` rather than `[ki-harness]` because it drives orientation, skills, agents, and MCP across the whole repo, not just the five-part harness bundle; a non-harness KI repo can target runtimes too. The bootstrap linkers loop over it, each runtime resolving to its own discovery path (Claude Code → `.claude/`, Codex → `.agents/`; see the runtime feature-coverage matrix in `SDR-KI-HARNESS-002`). It is **absent-safe**: omitting the key takes the historical default `["claude-code"]`, so every repo predating multi-runtime support is unchanged. Declared values must name runtimes the linkers recognise (`claude-code`, `codex`) and the list must be non-empty — the auditor's `RUNTIMES-1` WARNs otherwise.

- The table name **matches the skill's `name`** exactly, so the owner is unambiguous and the file reads as a map of skill → its settings.
- A skill reads **only its own table** and never reaches into another skill's — the table boundary is the schema ownership boundary. If two skills need the same fact, it still lives under whichever skill owns it, and the other resolves it from there. `ki-repo` owns the shared file-level contract and required foundation scaffold; each skill may conform its own table while preserving every other table.

## Marker vs config tables

A `[ki-<skill>]` table plays one or both of two roles:

- **Marker (opt-in)** — its _presence_ declares "this skill governs this repo." The bare header is enough; it needs no keys.
- **Config** — it carries per-repo declarations the skill reads (data the standard fits to, or `[…checks]` divergences).

The two are separable: a base on the canonical zone names declares a bare `[ki-kb]` (marker only, no keys); a base that renames a zone adds a `[ki-kb.zones]` alias (config). The marker/opt-in skills are `ki-engineering`, `-kb`, `-streams`, `-website`, `-website-cloudflare`, `-mcp`, `-skills`, and `-agents`. `ki-repo` is the **bedrock marker** — the file's very presence is what makes the repo a ki-repo. `ki-authoring` governs every markdown repo, but it is **declared, not assumed**: every repo carries a bare `[ki-authoring]` table like any other coverage (a missing one is a FAIL — `authoring-baseline`, [ADR-KI-HARNESS-005](../../../../docs/decisions/ADR-KI-HARNESS-005-validate-down-ki-config-contract.md)). There is no injected/cascade-exempt baseline: coverage is purely what the config declares (ADR-KI-HARNESS-007).

So **what an absent table means is per-skill**, and that is exactly what _Coverage enforcement_ (below) checks:

| Table absent                   | Means                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `[ki-repo]` (the file)         | not a ki-repo — the marker itself (bedrock; missing file is a FAIL)                        |
| any other marker skill's table | not opted into that standard — a coverage WARN _if_ the repo shows that skill's artifacts  |
| `ki-authoring`                 | a bare `[ki-authoring]` marker — declared like any coverage, not assumed (FAIL if missing) |

## Validate your own table

A skill **validates its own table and only its own**: it warns on a key (or sub-table entry) under its table that it doesn't recognise — a typo or a stale option should surface, not silently do nothing — and advises dropping one that merely restates a default. It leaves every other skill's table untouched, even keys it can't interpret. **Validate down, ignore across.** (`ki-repo` is the reference: it warns on an unknown `[…checks]` entry, notes a redundant one, and never inspects another skill's table.) The same boundary governs conformers: a skill may change its own table, never another's.

## Declared divergences

Where a skill's standard allows a repo to diverge from a default, record that **in the skill's own table** so it reads as a declared choice, not drift. The _shape_ is the owning skill's business — `ki-repo`, for instance, carries a `[…checks]` sub-table of booleans where any check set against its org default is the divergence:

```toml
[ki-repo.checks]
wiki = false   # this repo keeps a Wiki — deliberate, not drift
```

The owning skill's auditor then reports the divergence as an acknowledged note rather than a failure. Adopt the same principle for any skill that needs declared, reviewable per-repo overrides: the divergence lives under that skill's table, is commented with its _why_, and is validated by that skill (an unrecognised key warns).

## Overridable vs fixed

A skill's standard fixes its model; a base or repo may declare **only** the keys that skill documents as overridable, and nothing else is a config knob. Two kinds of declaration are overridable: **data** the standard reads to fit a target (e.g. `ki-kb`'s zone aliases, `required_frontmatter`, and `preflight`), and **divergences** from a default (the `[…checks]` booleans above). Everything not so documented is **fixed** by the standard — a target does not redefine it in config. This split is what keeps target-specificity declared-and-auditable rather than forked into a coupled skill: where a target differs, it differs through a documented key, not a bespoke `<target>-*` extension skill.

So the option set is **authored, not implicit**: each skill with declarable keys defines and can emit or conform its commented schema/default fragment, so an author sees exactly what may be set and an undocumented key warns (validate-down). `ki-repo` separately owns the file-level contract and required foundation markers. A target-specific need that no documented key can express is a signal to **generalise it into the standard** (a REFRESH candidate), not to invent an ad-hoc key or fork a skill.

## Coverage enforcement

The file's presence is the **gate of an audit cascade**. Once a repo is confirmed a ki-repo (it carries `.ki-config.toml`), `ki-repo`'s auditor checks that the repo **declares an opt-in table for every governance skill whose applicability is detectable in it**. A detected-but-undeclared signal WARNs ("looks governed by `ki-<skill>` but declares no `[ki-<skill>]`"); a declared-but-undetected table WARNs as a possibly stale opt-in.

The gate is what prevents a **false positive**: a plain git repo that has, say, an `eleventy.config` but **no `.ki-config.toml`** is not a ki-repo, so it is never told to declare a website table. It simply takes the `ki-config` required-file FAIL. Coverage is only ever considered _after_ the marker confirms a ki-repo.

The detection signals `ki-repo` uses (one recursive tree read + `package.json`):

| Skill                   | Detection signal                            | Opt-in table              |
| ----------------------- | ------------------------------------------- | ------------------------- |
| `ki-engineering`        | `package.json` present                      | `[ki-engineering]`        |
| `ki-kb`                 | canonical zones (`Pillars/` + `Resources/`) | `[ki-kb]`                 |
| `ki-kb-streams`         | `Streams/` zone                             | `[ki-kb-streams]`         |
| `ki-website`            | `eleventy.config.*`                         | `[ki-website]`            |
| `ki-website-cloudflare` | a `wrangler.*` config                       | `[ki-website-cloudflare]` |
| `ki-mcp`                | `@modelcontextprotocol/sdk` dependency      | `[ki-mcp]`                |
| `ki-plugins`            | `.claude-plugin/marketplace.json`           | `[ki-plugins]`            |
| `ki-tools`              | `install.sh` + a `bin/<exe>`                | `[ki-tools]`              |
| `ki-homebrew-tap`       | `Formula/*.rb`                              | `[ki-homebrew-tap]`       |
| `ki-skills`             | `skills/*/SKILL.md`                         | `[ki-skills]`             |
| `ki-agents`             | `agents/**/*.md`                            | `[ki-agents]`             |

This is the **one place** `ki-repo` reads across skill tables — and it reads only table **presence**, never another skill's keys (_validate down, ignore across_ still governs table _contents_). It is an **audit-time enforcement** run by `repo`'s auditor, not behaviour baked into the regular use of each skill. A repo opts out of a single signal it doesn't want enforced with a `coverage-<skill> = false` entry in its `[ki-repo.checks]` table (e.g. a repo that vendors an `eleventy.config` it does not own) — reported as an acknowledged note.

No marker table is decorative — each is read by code. Most are read by their **owning** skill's auditor too (`-engineering`/`-kb`/`-streams`/`-website`/`-website-cloudflare`/`-mcp`/`-plugins` each read their own table when run). `ki-skills` and `ki-agents` are the documented exception: their checkers lint an artifact set (`SKILL.md` files, agent definitions), not a repo's config, so their opt-in table is read only by `ki-repo`'s coverage check.

## Scaffolding & ownership

The **schema and conformer** inside a table belong to the skill that owns it: that skill documents the allowed keys and may emit or update its canonical fragment while preserving unrelated content. `ki-repo` owns the shared file-level contract and the two required foundation markers. Bootstrap embeds no TOML template and never edits the file directly. This retains one shared `.ki-config.toml`, one table per skill, read-only access across table boundaries, and validate-down/conform-down ownership.

`ki-repo`'s own scaffold-only EDUCATE leg establishes the required foundations. For a missing file it writes one canonical `[ki-repo]` default block followed by one bare `[ki-authoring]`. For a partial file it appends only whichever exact root marker is absent; `[ki-repo.checks]` alone is not an exact `[ki-repo]` marker. Existing content remains an exact byte-for-byte prefix — including values, comments, ordering, and existing newline bytes — repeat runs are idempotent, and dry-run writes nothing. CONFORM applies the same local repair before any GitHub lookup or mutation.

`ki-bootstrap` may subprocess-compose this owner leg when `ki-repo` is initially seeded or resolved, then re-read and re-resolve before vendoring. It carries no TOML template and never writes the config itself. Bare bootstrap with no seed and no config remains an empty-set operation, so this composition does not recreate an injected baseline.

The canonical harness skill index validates declaration names. Exact and dotted `[ki-*]` headers both resolve to their root owner; bare and simply quoted TOML keys are equivalent, header-looking text inside multiline strings is ignored, and noncanonical ki-like roots remain visible so they fail rather than disappear. Repeated roots collapse. If any declared root or explicit bootstrap seed is unresolvable, EDUCATE, linking, dry-run, and the BOOT-9 audit fail before mutation and report each name once in sorted order. Rename reconciliation stays human because no mechanical mapping can establish intent.
