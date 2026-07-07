# Harness Standard

The normative, quotable reference for a **Knowledge Islands agentic harness**. Every harness must conform to this. Rationale is inline so a reader knows not just what, but why — and can judge edge cases rather than apply rules blindly.

The rubric ([`audit-rubric.md`](audit-rubric.md)) is the line-by-line checkable form of this document, with [M] / [J] tags and criterion codes. The sources behind these decisions are in [`sources.md`](sources.md).

## Contents

- [What a harness is](#what-a-harness-is)
- [§Layout — the four-part directory requirement](#layout--the-four-part-directory-requirement)
- [§Skills directory — the naming convention](#skills-directory--the-naming-convention)
- [§CLAUDE.md required sections](#claudemd-required-sections)
- [§ROADMAP.md discipline](#roadmapmd-discipline)
- [§package.json required scripts](#packagejson-required-scripts)
- [§.ki-config.toml tables](#ki-configtoml-tables)
- [§Boundary declarations](#boundary-declarations)

---

## What a harness is

An **agentic harness** is a single versioned git repository that co-locates the four parts an agent is equipped with:

| Directory | What it holds                                            | Install path                                                |
| --------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| `skills/` | [Agent Skills][as-spec] — one directory per skill        | Wired into a repo's `.claude/skills/` †                     |
| `agents/` | Claude Code subagent definitions — one `.md` per agent   | Symlinked or copied by the Claude Code agent runner         |
| `mcp/`    | Workspace MCP server packages ‡                          | Referenced by `.claude/settings.json` / `mcp_settings.json` |
| `evals/`  | Behavioural eval scenarios — advisory signal, not a gate | Run on demand, not in CI                                    |

† Via `bun run ki:skills:link:project` (`ki-bootstrap`).

‡ Or a shelf pointing to external `mcp-*` repos.

The value of co-location: the four parts are versioned together, reviewed together, and installed together — rather than scattered across the bases and projects that consume them. A change to a skill and the agent that invokes it ships as one PR, not two.

A harness does **not** have to host every part actively. Empty shelves (`agents/`, `mcp/`, `evals/` populated only by a `README.md`) are a valid, encouraged starting state — the directory structure commits to the four-part intent even before all parts are built. A shelf is not a gap.

---

## §Layout — the four-part directory requirement

Every harness MUST have these four directories at the repo root, each containing a `README.md`:

```text
skills/       README.md  (+ one directory per skill)
agents/       README.md  (+ one .md per agent, or empty shelf)
mcp/          README.md  (+ server packages, or shelf pointing to mcp-* repos)
evals/        README.md  (+ scenario files, or rough advisory shelf)
```

**Why:** discovery. Any tool or agent navigating the harness can reliably find each part without reading prose. The `README.md` in each directory distinguishes an intentional empty shelf from an accidental missing directory — and gives a human reader the context to understand it.

The root of the harness MUST also contain:

- `CLAUDE.md` — the always-loaded orientation (see §CLAUDE.md required sections)
- `ROADMAP.md` — the open work (see §ROADMAP.md discipline)
- `package.json` — with the required script families (see §package.json required scripts)
- `.ki-config.toml` — the KI compliance declaration (see §.ki-config.toml tables)

---

## §Skills directory — the naming convention

Every directory under `skills/` MUST be a valid skill: it must contain a `SKILL.md` with YAML frontmatter, and the **directory name must exactly match the `name:` frontmatter field**.

```text
skills/
  ki-kb-base/        ← directory name
    SKILL.md                  ← name: ki-kb-base  ← must match
```

**Why:** agents and the Agent Skills runtime discover a skill by its `name` — not by path. If the directory name and the frontmatter drift, the skill loads under the wrong name or fails to load at all. The `ki:skills:link:project` script (see §package.json) creates symlinks named by the directory, so the symlink target name is the one the agent actually resolves.

The quality of the skill's prose, description richness, and adherence to the Agent Skills rubric are governed by `ki-skills`, not here.

---

## §CLAUDE.md required sections

The harness `CLAUDE.md` is the **always-loaded orientation** — every agent session in the harness repo reads it. It must cover these sections (in order, though the exact headings are flexible):

1. **What this harness is** — one paragraph: what the harness holds, who it's for, why it's a single repo rather than scattered files. Name all four parts.
2. **The four parts** — a directory table (or equivalent structured block) with each of the four directories, what it holds today, and its current status (populated / empty shelf). Keep this current as shelves become populated.
3. **Working conventions per part** — how to add, change, or audit each part: which command to run, which skill governs it, any install step. Brief; route detail to `docs/` or the relevant skill.
4. **Toolchain** — the key `bun run *` commands: at minimum `ki:skills:link:project`, `ki:skills:lint`, and the common `ki:lint:*` family. Enough to orient a contributor on day one.

Optional but encouraged:

- **The skill map** — a visual or tabular overview of how the skills in `skills/` relate (which compose on which, which delegate to which). Keeps the map near the skills it describes.
- **Docs table** — pointers to any `docs/` files that elaborate the design.

**Freshness rule:** `CLAUDE.md` MUST reflect current state. A skill count that's off-by-one, a shelf marked as empty when it's now populated, or a command name that no longer exists in `package.json` are all WARN findings. Run Mode AUDIT regularly to catch drift.

---

## §ROADMAP.md discipline

The harness `ROADMAP.md` holds the **open forward work** only. Two rules:

1. **Open-only.** Items are removed when done, not ticked off. The file always shows what remains.
2. **No continuous practices.** Ongoing disciplines (running `ki:skills:lint`, monthly REFRESH runs, re-auditing repos) are not roadmap items — they are invariants. They live in `docs/design.md` or a similar always-present reference, not here. A roadmap item that would never close (because it is a standing practice) is a sign it belongs elsewhere.

**Why:** a roadmap that accumulates checked-off items loses the "what's left" signal. A roadmap that lists ongoing practices obscures the "what's new" signal. Keeping the two separate preserves both.

**Recommended structure.** Group open items under `## Next` (nearest-term, highest-impact), `## Soon` (opportunistic, can overlap with Next), and `## Future` (larger, blocked, or calendar-gated). This `Next / Soon / Future` phasing is the house vocabulary, owned here — `ki-plans` references it: a code-repo plan is written when an item enters **Next** and removed when it lands. The structure is recommended, not required — a repo with a short forward view may keep a flat list, and a KB base keeps its forward view in `Streams` (the Focus lifecycle) rather than a `ROADMAP.md`. The two discipline rules above always apply; the phasing is the shape they hang on.

---

## §package.json required scripts

Every harness `package.json` MUST declare these script families:

| Script                   | What it does                                                     | Why required                   |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------ |
| `ki:skills:link:project` | Wires this repo's `.claude/skills/` from its `.ki-config.toml` § | The primary delivery mechanism |
| `ki:skills:lint`         | Runs the `ki-skills` mechanical checker over `skills/`           | The gate for skill quality     |
| `ki:lint:check`          | Biome — TypeScript + JSON lint (no write)                        | Common engineering gate        |
| `ki:lint:types`          | `tsc --noEmit`                                                   | Type safety gate               |
| `ki:lint:md`             | Prettier + markdownlint (writes)                                 | Markdown formatting gate       |
| `ki:lint:md:check`       | Prettier + markdownlint (check-only; CI twin of `ki:lint:md`)    | CI Markdown gate               |

§ The `ki-bootstrap` linker; the harness uses `--all`.

The `ki:lint:*` family is the common engineering toolchain (`ki-engineering`'s standard). A harness that ships no TypeScript may omit `ki:lint:check` / `ki:lint:types` with a documented reason.

The harness-specific scripts are `ki:skills:link:project` and `ki:skills:lint` — these are the delivery and quality mechanisms the harness concept depends on. Absence of either is a FAIL. The harness additionally carries the rest of its skill-management / codegen / eval surface (PKG-4, WARN): `ki:skills:link:global` (`sync-skills.ts link --only ki-bootstrap`) to install the one global keystone, `ki:skills:status` / `ki:skills:unlink` (inspect / tear down the project-local links), `ki:skills:refresh-status` (refresh the skills status block), `ki:codegen` (regenerate every MCP's typed client from the harness root), and `ki:eval` (run the `evals/` suite). Skills are not installed wholesale into `~/.claude/skills/`; they are wired **project-local** per repo by `ki-bootstrap`, only the keystone is kept global.

---

## §.ki-config.toml tables

Every harness carrying a `.ki-config.toml` (which all KI-governed repos do) MUST declare:

```toml
[ki-repo]        # this is a KI-governed repo
[ki-engineering] # the common toolchain governs this repo
[ki-harness]     # this repo is a KI agentic harness
[ki-skills]      # once skills/ is populated
```

The `[ki-harness]` table is the **compliance marker** — `ki-repo`'s coverage cascade detects the four-part harness layout and WARNs if this table is absent. Declaring it is the repo's opt-in to the harness standard.

Currently no per-harness config keys are defined under `[ki-harness]` — the table presence alone is the declaration.

---

## §Boundary declarations

This standard governs the container. The parts inside it each have a governing skill:

| What                                        | Who governs it                      |
| ------------------------------------------- | ----------------------------------- |
| `skills/*/SKILL.md` prose                   | `ki-skills`                         |
| `agents/*.md` definitions                   | `ki-agents`                         |
| `mcp/*/src/` server code                    | `ki-mcp`                            |
| `evals/` test harness                       | No dedicated skill today — advisory |
| Engineering toolchain                       | `ki-engineering`                    |
| GitHub settings, `.ki-config.toml` contract | `ki-repo`                           |

An audit of a harness runs the harness delta **on top of** the applicable sibling skills — it composes, it does not replace them.

[as-spec]: https://agentskills.io/specification
