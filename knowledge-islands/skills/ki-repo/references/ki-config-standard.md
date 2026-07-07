# The `.ki-config.toml` contract

The cross-cutting contract for the shared **`.ki-config.toml`** file every Knowledge Islands repo carries. It is owned by `ki-repo` because **a Knowledge Islands repo is defined by carrying this file** — its presence is the compliance marker, and `-repo` governs the repo's compliance. Every other standard-holding skill reads its own table within it. (The TOML _formatting_ style — key case, quoting, comments — is the `ki-authoring` skill's; see its [toml-config.md](../../ki-authoring/references/toml-config.md). This doc governs the _contract_: the file's meaning and the cross-skill protocol.)

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

[ki-repo.checks]
branch-protection = true
```

- The table name **matches the skill's `name`** exactly, so the owner is unambiguous and the file reads as a map of skill → its settings.
- A skill reads **only its own table** and never reaches into another skill's — the table boundary is the ownership boundary. If two skills need the same fact, it still lives under whichever skill owns it, and the other resolves it from there.

## Marker vs config tables

A `[ki-<skill>]` table plays one or both of two roles:

- **Marker (opt-in)** — its _presence_ declares "this skill governs this repo." The bare header is enough; it needs no keys.
- **Config** — it carries per-repo declarations the skill reads (data the standard fits to, or `[…checks]` divergences).

The two are separable: a base on the canonical zone names declares a bare `[ki-kb-base]` (marker only, no keys); a base that renames a zone adds a `[ki-kb-base.zones]` alias (config). The marker/opt-in skills are `ki-engineering`, `-kb`, `-streams`, `-11ty-websites`, `-cloudflare-hosting`, `-mcp`, `-skills`, and `-agents`. `ki-repo` is the **bedrock marker** — the file's very presence is what makes the repo a ki-repo — and `ki-authoring` is **universal** (it governs every markdown repo), so neither needs a separate opt-in.

So **what an absent table means is per-skill**, and that is exactly what _Coverage enforcement_ (below) checks:

| Table absent                   | Means                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `[ki-repo]` (the file)         | not a ki-repo — the marker itself (bedrock; missing file is a FAIL)                       |
| any other marker skill's table | not opted into that standard — a coverage WARN _if_ the repo shows that skill's artifacts |
| `ki-authoring`                 | nothing — universal, no opt-in table exists                                               |

## Validate your own table

A skill **validates its own table and only its own**: it warns on a key (or sub-table entry) under its table that it doesn't recognise — a typo or a stale option should surface, not silently do nothing — and advises dropping one that merely restates a default. It leaves every other skill's table untouched, even keys it can't interpret. **Validate down, ignore across.** (`ki-repo` is the reference: it warns on an unknown `[…checks]` entry, notes a redundant one, and never inspects another skill's table.)

## Declared divergences

Where a skill's standard allows a repo to diverge from a default, record that **in the skill's own table** so it reads as a declared choice, not drift. The _shape_ is the owning skill's business — `ki-repo`, for instance, carries a `[…checks]` sub-table of booleans where any check set against its org default is the divergence:

```toml
[ki-repo.checks]
wiki = false   # this repo keeps a Wiki — deliberate, not drift
```

The owning skill's auditor then reports the divergence as an acknowledged note rather than a failure. Adopt the same principle for any skill that needs declared, reviewable per-repo overrides: the divergence lives under that skill's table, is commented with its _why_, and is validated by that skill (an unrecognised key warns).

## Overridable vs fixed

A skill's standard fixes its model; a base or repo may declare **only** the keys that skill documents as overridable, and nothing else is a config knob. Two kinds of declaration are overridable: **data** the standard reads to fit a target (e.g. `ki-kb-base`'s zone aliases, `required_frontmatter`, and `preflight`), and **divergences** from a default (the `[…checks]` booleans above). Everything not so documented is **fixed** by the standard — a target does not redefine it in config. This split is what keeps target-specificity declared-and-auditable rather than forked into a coupled skill: where a target differs, it differs through a documented key, not a bespoke `<target>-*` extension skill.

So the option set is **authored, not implicit**: each skill with declarable keys emits them — commented, with defaults — via an `--init` the skill owns (`ki-repo`, `-kb`, `-streams`, `-tokenomics`, and `-cloudflare-hosting` do; `-11ty-websites`'s `--init` emits the bare marker, as it has no keys today), so an author sees exactly what may be set, and an undocumented key warns (validate-down). A target-specific need that no documented key can express is a signal to **generalise it into the standard** (a REFRESH candidate), not to invent an ad-hoc key or fork a skill.

## Coverage enforcement

The file's presence is the **gate of an audit cascade**. Once a repo is confirmed a ki-repo (it carries `.ki-config.toml`), `ki-repo`'s auditor checks that the repo **declares an opt-in table for every governance skill whose applicability is detectable in it**. A detected-but-undeclared signal WARNs ("looks governed by `ki-<skill>` but declares no `[ki-<skill>]`"); a declared-but-undetected table WARNs as a possibly stale opt-in.

The gate is what prevents a **false positive**: a plain git repo that has, say, an `eleventy.config` but **no `.ki-config.toml`** is not a ki-repo, so it is never told to declare a website table. It simply takes the `ki-config` required-file FAIL. Coverage is only ever considered _after_ the marker confirms a ki-repo.

The detection signals `ki-repo` uses (one recursive tree read + `package.json`):

| Skill                   | Detection signal                            | Opt-in table              |
| ----------------------- | ------------------------------------------- | ------------------------- |
| `ki-engineering`        | `package.json` present                      | `[ki-engineering]`        |
| `ki-kb-base`            | canonical zones (`Pillars/` + `Resources/`) | `[ki-kb-base]`            |
| `ki-kb-streams`         | `Streams/` zone                             | `[ki-kb-streams]`         |
| `ki-websites-11ty`      | `eleventy.config.*`                         | `[ki-websites-11ty]`      |
| `ki-hosting-cloudflare` | a `wrangler.*` config                       | `[ki-hosting-cloudflare]` |
| `ki-mcp`                | `@modelcontextprotocol/sdk` dependency      | `[ki-mcp]`                |
| `ki-skills`             | `skills/*/SKILL.md`                         | `[ki-skills]`             |
| `ki-agents`             | `agents/**/*.md`                            | `[ki-agents]`             |

This is the **one place** `ki-repo` reads across skill tables — and it reads only table **presence**, never another skill's keys (_validate down, ignore across_ still governs table _contents_). It is an **audit-time enforcement** run by `repo`'s auditor, not behaviour baked into the regular use of each skill. A repo opts out of a single signal it doesn't want enforced with a `coverage-<skill> = false` entry in its `[ki-repo.checks]` table (e.g. a repo that vendors an `eleventy.config` it does not own) — reported as an acknowledged note.

No marker table is decorative — each is read by code. Most are read by their **owning** skill's auditor too (`-engineering`/`-kb`/`-streams`/`-11ty-websites`/`-cloudflare-hosting`/`-mcp` each read their own table when run). `ki-skills` and `ki-agents` are the documented exception: their checkers lint an artifact set (`SKILL.md` files, agent definitions), not a repo's config, so their opt-in table is read only by `ki-repo`'s coverage check.

## Scaffolding & ownership

The **keys** inside a table belong to the skill that owns it — that skill documents and scaffolds them (e.g. via an `--init` that appends its default keys). This contract owns the **file-level shape** every table follows: one shared `.ki-config.toml`, one table per skill named for the skill, read-only across table boundaries, each skill validating its own. For a given skill's keys, see that skill.
