---
name: ki-harness
implies: [ki-skills, ki-agents, ki-decision-records, ki-project-roadmap]
vendors: [educate, audit, conform, help]
description: >
  Audit, conform, and scaffold Knowledge Islands agentic harnesses — repos that bundle skills, agents, MCP servers, evals, and hooks together for versioned, co-installed deployment. Use when creating a new harness, checking an existing harness's five-part layout (`skills/`, `agents/`, `mcp/`, `evals/`, `hooks/`), verifying its CLAUDE.md covers required orientation sections, checking its package.json script families, or auditing its `.ki-config.toml` harness table. Triggers: "audit the harness", "scaffold a new harness", "does this repo follow the harness standard", "refresh the harness standard", "is this a valid harness". Governs the **container** (directory structure, CLAUDE.md, package.json script families, installation conventions, `.ki-config.toml` table) — not the **contents**: skill quality → `ki-skills`; agent quality → `ki-agents`; project roadmap → `ki-project-roadmap`; MCP server code → `ki-mcp`; engineering toolchain → `ki-engineering`; GitHub repo settings → `ki-repo`.
argument-hint: 'audit [path] | conform [path] | help | educate <name> | refresh'
---

# Knowledge Islands Harness

You are helping audit, conform, or scaffold a **Knowledge Islands agentic harness** — a single versioned repository that co-locates the five parts an agent is equipped with: skills (`skills/`), agents (`agents/`), MCP servers (`mcp/`), evals (`evals/`), and hooks (`hooks/`). The canonical reference implementation is [ki-agentic-harness](../../../README.md).

This skill governs the **container** — the harness's directory layout, its `CLAUDE.md` orientation, its `package.json` script families, and its `.ki-config.toml` compliance table. It does not govern the _contents_: skill quality routes to `ki-skills`, agent definitions to `ki-agents`, roadmap content to `ki-project-roadmap`, MCP server code to `ki-mcp`, the engineering toolchain to `ki-engineering`, and GitHub-side settings to `ki-repo`. The harness is the bridge into those skills — it tells you _what the container must look like_ so the contents are findable, installable, and auditable; the sibling skills each tell you _what quality looks like_ inside their part.

The full canonical standard — what each part must contain and why — lives in [the harness standard](references/harness-standard.md). The line-by-line checkable criteria live in [the rubric](references/audit-rubric.md). A mechanical checker is [`scripts/audit.ts`](scripts/audit.ts). Load those when you need detail; this file is the operating procedure.

## Operating modes

Modes: **AUDIT · CONFORM · EDUCATE · REFRESH** (named, alphabetical). Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT — check a harness against the standard

1. **Run the mechanical checker.** `bun scripts/audit.ts [path]` from this skill's directory (or `bun run ki:harness:audit` at the harness root, if wired). It checks: the five-part directory presence, each directory's `README.md`, root `CLAUDE.md` / `ROADMAP.md`, `package.json` script families, `.ki-config.toml` `[ki-harness]` table presence, and each `skills/<dir>` name matching its `SKILL.md` `name:` frontmatter. Reports on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / NA / PASS — defined in `ki-engineering`'s enforcement-framework §2).
2. **Compose on sibling skills via subagent isolation** ([ADR-KI-HARNESS-AGENTS-001](../../../docs/decisions/ADR-KI-HARNESS-AGENTS-001-subagent-isolation.md)). A harness audit is layered — fan out one `agent()` per concern in `parallel()` after the COLL checks:
   - `ki-repo` — GitHub settings and the `.ki-config.toml` contract
   - `ki-engineering` — aggregate entrypoints and internal code toolchain (package.json, tsconfig, biome)
   - `ki-project-roadmap` — non-KB roadmap profile, content discipline, and thematic projections
   - `ki-skills` linter (`bun run ki:skills:audit`) — if `skills/` is populated
   - `ki-agents` linter — if `agents/` is populated
   - `ki-mcp` audit — if `mcp/` has server code. For a large judgment review, `ki-delegate` may fan out independent concerns after the aggregate mechanical result is captured; see [ADR-KI-HARNESS-AGENTS-001](../../../docs/decisions/ADR-KI-HARNESS-AGENTS-001-subagent-isolation.md).
3. **Judge the prose the script can't.** Walk the [J]-tagged criteria in [the rubric](references/audit-rubric.md):
   - **CLAUDE.md coverage** — does it open with a what-the-harness-is paragraph covering all five parts? Is the skill map present (if skills exist) and does it reflect current reality? Are working conventions documented for each part? Are the key `bun run *` commands listed?
   - **Freshness** — do the skill count, shelf statuses, and command names in `CLAUDE.md` still match the actual repo state?
   - **ROADMAP.md discipline** — does it show only open work? If the repository uses the thematic profile, is the root an exact generated portfolio rather than a second home for item prose? Are continuous practices absent (they belong in the `ki-engineering` enforcement framework, not the roadmap)?
4. **Report** on the unified severity ladder. A missing required file or table is a FAIL; stale content that is structurally present is a WARN; minor freshness drift (wrong count, outdated command names) is a POLISH.

### Mode CONFORM — bring a harness into line

1. Run **AUDIT** first to get the fix list.
2. **Apply the fixes:** create missing directories with stub `README.md`s, add or correct `CLAUDE.md` sections, update `ROADMAP.md`, add missing `.ki-config.toml` tables, fix `package.json` script families — per [the rubric](references/audit-rubric.md) and [the standard](references/harness-standard.md), touching only what a criterion calls for.
3. **Re-run AUDIT** until it is clean.

### Mode EDUCATE — scaffold a new harness

1. **Name the harness.** The repository name is the harness identity; agree on it before creating.
2. **Scaffold the five parts.** Create `skills/`, `agents/`, `mcp/`, `evals/`, `hooks/`, each with a `README.md` describing what it holds — marking any part an empty shelf if it starts unpopulated.
3. **Write `CLAUDE.md`** using [the standard](references/harness-standard.md) §CLAUDE.md required sections as the template: what-the-harness-is paragraph, five-part directory table with current status, working conventions per part, key `bun run *` commands.
4. **Add `ROADMAP.md`.** Start with the known open work; mark items open-only. Note: continuous practices are not roadmap items — they belong in the `ki-engineering` enforcement framework or `CLAUDE.md`.
5. **Scaffold `package.json`** with the harness-specific required scripts: `ki:skills:link:project` and `ki:skills:audit`. The cross-skill operational keys point at the three scripts `ki-bootstrap` vendors into `.ki-meta/bin/` for a harness-shaped target — `ki:skills:graph` (`bun .ki-meta/bin/skill-graph.ts --tree`), `ki:skills:help` (`bun .ki-meta/bin/skill-help.ts`), `ki:skills:status` / `ki:skills:unlink` (`bun .ki-meta/bin/sync-skills.ts status|unlink`), and `ki:skills:link:global` (`bun .ki-meta/bin/sync-skills.ts link --only ki-bootstrap` — the keystone is the only universally-correct global install; extend the `--only` list per harness). These resolve only once EDUCATE has bootstrapped `.ki-meta/` (step 7), so run the bootstrap before invoking them. Compose `ki-engineering` and `ki-authoring` for the aggregate entrypoints and toolchain passes; this skill does not duplicate their checks.
6. **Add `.ki-config.toml`** with at minimum `[ki-repo]`, `[ki-engineering]`, and `[ki-harness]`. Add `[ki-skills]` once `skills/` is populated.
7. **Self-audit.** Run Mode AUDIT on the new harness before handing it off.

### Mode REFRESH — re-anchor the standard

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

The harness standard is a KI architectural convention, not an external spec — it is grounded in the [ki-agentic-harness](../../../README.md) as the reference implementation. REFRESH means verifying the standard reflects current practice, and checking the external sources it builds on (Agent Skills, Claude Code subagent docs) for changes that affect the harness contract.

1. **Read [the source list](references/sources.md)** — tracked sources, each with a `last reviewed` date.
2. **Re-fetch external sources** (Agent Skills specification, Claude Code subagent docs) and diff against [the standard](references/harness-standard.md): new required SKILL.md fields, changed skill-install conventions, new subagent format requirements.
3. **Check the reference implementation** — read [ki-agentic-harness](../../../README.md) and its `CLAUDE.md`; does the standard still match current practice? Promote uncodified patterns that work well; flag any drift between the standard and the reference.
4. **Propose a diff** to [the standard](references/harness-standard.md) and [the rubric](references/audit-rubric.md). Confirm before writing.
5. **Update [the source list](references/sources.md)** — bump `last reviewed` dates and refresh the `## Last review` block (what's confirmed, open watch-items). The record of _what changed_ is the commit, not a changelog here.

Run REFRESH on this skill's declared cadence (the `**Refresh:**` marker in [`references/sources.md`](references/sources.md) — `external-spec · monthly`). If it's invoked while still within that window, confirm before forcing (interactive) or skip (scheduled), per the enforcement framework's REFRESH gate.

## Notes

- Auditing a harness runs the harness _delta_ on top of the sibling skills' checks — AUDIT step 2 lists the composition order. Don't double-report what a sibling's checker already surfaces. The root `ROADMAP.md` exists by the harness contract; its non-KB content and profile belong to `ki-project-roadmap`.
- A harness that has empty shelves (`agents/`, `mcp/`, `evals/` with no real content) is a valid harness — the shelves exist to mark intent and reserve the structure. A shelf is not a gap.
- The `ki:skills:link:project` install convention (the `ki-bootstrap` keystone) is the harness's primary delivery mechanism — verifying it is wired in `package.json` is a FAIL criterion, not advisory.
