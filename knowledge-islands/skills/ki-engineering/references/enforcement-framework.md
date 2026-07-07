# The enforcement framework — how any Knowledge Islands standard is defined and checked

The shared **mechanism** every governance skill in this repository uses, so a standard is defined, audited, conformed, and refreshed the same way no matter what it governs. This is the formal home of what ki-agentic-harness `docs/skills.md` calls "the governance-skill shape"; that doc points here for the detail rather than restating it.

A **governance skill** holds a house standard and ships the universal modes over it, backed by a tracked source list. `ki-engineering` owns this framework because it is the cross-cutting "how we engineer" layer; every other governance skill in the set conforms to it.

## Contents

- [1. The layout](#1-the-layout)
- [2. The mechanical-checker contract](#2-the-mechanical-checker-contract)
- [3. The rubric format](#3-the-rubric-format)
- [4. The source list (`sources.md`)](#4-the-source-list-sourcesmd)
- [5. The modes](#5-the-modes)
- [6. The principles every governance skill inherits](#6-the-principles-every-governance-skill-inherits)

## 1. The layout

Each governance skill is a directory of this shape (loaded on demand — keep `SKILL.md` under ~500 lines / ~5,000 tokens):

- **`SKILL.md`** — frontmatter (`name` = directory name; trigger-rich `description` that names its off-ramps; `argument-hint` listing the modes) + a body that states what it governs, the model "at a glance", and the modes. Per-skill _usage_ is not repeated here — `description` + `argument-hint` are machine-read at selection time.
- **`references/<domain>-standard.md`** (or the contract / conventions reference it holds) — the normative, quotable reference: what good looks like, and why.
- **`references/audit-rubric.md`** — the line-by-line checkable criteria (§3).
- **`references/sources.md`** — the tracked provenance (§4).
- **a mechanical checker** in `scripts/` (→ `checker-contract.md`) — or, where the toolchain already enforces the mechanical half (authoring's `bun run ki:lint:md`), a pointer to it.

## 2. The mechanical-checker contract

→ Full protocol: [references/checker-contract.md](checker-contract.md) — the severity ladder, flag definitions (`--json`, `--report`), exit-code rule, self-containment and composition constraints, and the relationship between checker output levels and `[M]`/`[J]` rubric tags all live there.

Summary of constraints for quick reference: a checker takes a target path, emits findings on the severity ladder, exits non-zero iff any FAIL, supports `--json` and `--report`, uses no npm dependencies, and is self-contained (no cross-skill imports). Checkers compose by being run in sequence (§5).

## 3. The rubric format

`audit-rubric.md` lists every criterion with a stable id, tagged by who enforces it:

- **[M] mechanical** — a checker enforces it; in AUDIT you capture the checker's output verbatim and never re-derive it by hand.
- **[J] judgment** — a reader/agent assesses it; the checker cannot decide it deterministically.

Each criterion cites the standard section it verifies, and carries a **severity from the checker-contract ladder** (FAIL / WARN / POLISH; → `checker-contract.md`) where the standard grades findings — the same vocabulary the checker emits, so the rubric and the output read alike.

**Default a check into the checker — mechanical work belongs there, not in tokens.** A criterion a script can decide deterministically — no judgment, no AI benefit — is tagged **[M]** and implemented in the checker; the **[J]** tag is earned by the judgment a criterion genuinely needs, never by "no checker written yet". The reader's context is spent only on the **[J]** criteria; deterministic work the model would otherwise re-derive each run is the cost this avoids. So a mechanical criterion left to prose, or a **[J]** criterion that becomes scriptable with no AI benefit, **moves into the checker and flips to [M]** — the rubric and checker stay in lockstep. A judgment criterion the checker can usefully point at surfaces in its output as **ADVISORY**. (This is the SHAPE-9 principle in the `ki-skills` rubric.)

## 4. The source list (`sources.md`)

Provenance only — the record of _what changed_ lives in the REFRESH commit, not a changelog in the file. It tracks each source behind the standard with a `last reviewed` date. A skill that tracks a **moving external** target (a spec, an upstream tool, a community best-practice) also keeps a current-state **`## Last review`** block — pinned revision, what's confirmed, open watch-items — overwritten each REFRESH. A skill that hard-codes no volatile external fact may instead resolve it at runtime; the point is durability (LONG-1/LONG-2 below).

Each `sources.md` declares its **refresh class and cadence** on a single machine-readable line directly under the H1, before the intro: `**Refresh:** <class> · <cadence>`. The two classes name the long-implicit distinction: an **`external-spec`** skill pins a moving outside source (a spec, an upstream tool, vendor docs) and refreshes on a **clock**; a **`canonical`** skill defines its model in-house (e.g. a zone model, a process) and refreshes **`on-change`**, not on a calendar. Cadence is `weekly` | `monthly` | `quarterly` | `on-change` | `<N>d` (window-days `7` / `30` / `90` / N; `on-change` = no clock). The class is **independent of `## Last review`-block presence** — a `canonical` skill may still keep a block as a hand-curated practice-review note. This marker is the single source of truth that the checker's cadence enforcement (the overdue WARN) and the REFRESH too-soon gate (§5) both read.

## 5. The modes

ADR: [ADR-KI-HARNESS-SKILLS-001](../../../docs/decisions/ADR-KI-HARNESS-SKILLS-001.md)

Every governance skill exposes the universal three, plus skill-specific ones where they fit. Modes are named and alphabetical.

- **AUDIT** — run the checker, capture its output, then apply the judgment criteria; report by location → criterion → fix. **Audits compose**: auditing a target runs every _applicable_ skill's audit and names the siblings it composes with (e.g. an MCP repo = `ki:engineering:audit` for the common layer + `audit-mcp.ts` for the MCP delta + the repo and skills audits where they apply). A target is "clean" only when each applicable audit passes. Run each checker with **`--report`** so its latest report lands under the target's **`.ki-meta/audits/<concern>.{md,json}`** — the working-artifacts convention `ki-repo` owns; the `.json` is the machine-readable substrate a composed audit merges, the `.md` the human report. Reports are **latest-only** (overwritten, no history). **Auditing a set** — many targets at once (a repo of skills, a directory of agents, a tree or org of repos, the `mcp-*` servers) — **bounds its own context** so a large sweep doesn't force a mid-audit compaction: do the cross-cutting pass once over the whole set (the checker's set-level run — collisions, name-uniqueness — plus any judgment needing only frontmatter / `description`s), then walk the targets **one at a time**, loading each target's files and releasing them before the next, so peak context is one target, not the set. Where the targets have a composition order, walk it in that order (foundations / contract-owners first) so a target's base is already judged when you reach it; otherwise the order is free.
- **CONFORM** — bring an existing artifact into line in place; re-run the checker (and any judgment pass) until clean. Copy from the closest healthy sibling rather than invent. Record what changed under the target's **`.ki-meta/conform/<concern>.md`** (latest-only) — so conformance leaves a durable trace now that not every change is a git-committed write.
- **REFRESH** — re-anchor the standard to its sources on its declared cadence (§4). **First read the skill's refresh status** (the checker's `--refresh-status`, or parse the `**Refresh:**` marker against the latest `last reviewed` date). If the skill is still **within its cadence window** (refreshed recently), the refresh is premature: **interactively, pause and confirm with the operator before forcing it; on a non-interactive / scheduled / sub-agent run, skip it** — absent a human to confirm with, within-window means skip (don't force, don't ask). For a `due` / `overdue` / `on-change` / unmarked skill, proceed: read `sources.md`, re-fetch each source, diff against the standard + rubric + checker, propose a diff (confirm before writing), then bump the `last reviewed` dates and the `## Last review` block.
- **INIT** (optional) — scaffold a new artifact to the standard.
- **OPTIMISE** (optional) — once an artifact is clean, push it from the rubric floor toward excellent (value-per-token and discoverability) without touching the caps. Distinct from CONFORM (which moves a non-compliant artifact onto the floor); runs only on one that already passes. Realised as `ki-skills`' OPTIMISE over a compliant `SKILL.md`.
- **operational** (optional) — domain actions that are not audit/conform (e.g. kb's note-ops, streams' enactment lifecycle).

## 6. The principles every governance skill inherits

These hold for every skill, current and future:

- **A refresh path, and a cadence (LONG-1 / LONG-2 / LONG-3 / LONG-4).** A skill that tracks a moving target ships a REFRESH mode and a dated `sources.md`, and **declares its refresh class and cadence** in a `**Refresh:**` marker (§4); one that hard-codes no volatile fact resolves it at runtime. A skill in a shared catalogue is long-lived and far from its author and must not rot silently. The declared cadence is enforced in **both directions** off that one marker: the checker WARNs when a skill is **overdue** (past its cadence + grace — LONG-3, with `canonical · on-change` exempt), and the REFRESH mode (§5) **gates a too-soon** refresh — within-window it confirms before forcing (interactive) or skips (scheduled). Marker presence and coherence are LONG-4.
- **No silent collisions (COLL-1 / COLL-2).** Where two skills could fire on one request, each `description` names the other as the off-ramp; a new skill is audited against the existing set before it ships.
- **One governance-mode model (SHAPE-5).** The universal AUDIT/CONFORM/REFRESH plus skill-specific modes, so a new skill inherits the shape.
- **A behaviour-changing skill anchors its gate, and checks the anchor (SHAPE-7).** A skill that changes a default cannot rely on its own `description` firing; it anchors the behaviour in always-loaded context (a repo/base `CLAUDE.md`/`AGENTS.md`) and its checker verifies the anchor.
- **Audits compose.** No single skill's pass means a target is clean; the applicable skills compose (§5).
- **Standard, not base-coupled extension (SHAPE-2).** A standard skill stays base-agnostic and resolves bindings at runtime; what a base needs differently is **declared, not forked** — data in its `.ki-config` table, prose in its `CLAUDE.md` — never a `<base>-*` skill that takes the shared modes. Composition is the only inter-skill relationship (§5).
- **Mechanical work belongs in the checker, not in tokens (SHAPE-9).** A criterion a script can decide with no AI benefit is tagged **[M]** and implemented in the checker; the reader's context is spent only on the **[J]** criteria that genuinely need judgment. A mechanical criterion left to prose is a finding, and the checker flags a rubric carrying **[M]** criteria but shipping no checker (§3).

(The criterion ids — LONG-1/2, COLL-1/2, SHAPE-2/5/7/9 — are owned and enforced by the `ki-skills` rubric; named here so this framework and that rubric stay in lockstep.)
