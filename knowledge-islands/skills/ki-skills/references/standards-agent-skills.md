# Agent Skills standard

The normative reference behind `ki-skills`: what a _good_ Agent Skill looks like, and why. The [Audit Rubric](rubric.md) is the line-by-line checklist derived from this — each rubric criterion (`NAME-1`, `DESC-2`, …) verifies a convention stated here. Read the standard to understand or quote a convention; run `ki repo audit --skill ki-skills` to check a repository's skills against it.

A skill is a directory with a `SKILL.md` (YAML frontmatter + markdown body) per the [Agent Skills open standard](https://agentskills.io/), optionally with `references/`, `scripts/`, `assets/`. Source abbreviations resolve in [the source list](sources.md).

## Authority order

Read this standard from the most portable authority to the most local:

1. **Portable Agent Skills contract** — `SPEC` defines the cross-runtime requirements a skill must meet.
2. **Established authoring practice** — `AS`, `BP`, `ENG`, and `COMMUNITY` explain effective patterns where the portable contract leaves room for judgment.
3. **Knowledge Islands house standard** — [the separate KI standard](standards-knowledge-islands.md) defines conventions added by this harness.

`CC` is a **runtime overlay**, not a fourth authority level. It may extend or qualify a portable or KI rule for Claude Code, but it never weakens the portable contract. Runtime-only requirements remain explicitly labelled so a skill can distinguish portability from a supported runtime feature.

## Contents

1. [Two-aspect model](#1-two-aspect-model)
2. [Layout](#2-layout)
3. [Frontmatter document](#3-frontmatter-document)
4. [Frontmatter: name](#4-frontmatter-name)
5. [Frontmatter: description](#5-frontmatter-description)
6. [Frontmatter: optional fields](#6-frontmatter-optional-fields)
7. [Size & conciseness](#7-size--conciseness)
8. [Progressive disclosure](#8-progressive-disclosure)
9. [Body content quality](#9-body-content-quality)
10. [Scripts](#10-scripts)
11. [Process / evaluation](#11-process--evaluation)
12. [Longevity](#12-longevity)
13. [Runtime binding](#runtime-binding)
14. [Exact numbers](#14-exact-numbers)

## 1. Two-aspect model

Every rubric criterion carries one or both of two aspects, and the distinction is a contract with the `ki` rubric host:

- **Mechanical** — deterministically checkable (a file exists, frontmatter parses, a length cap holds, a link resolves). The bundled linter owns these; never eyeball what it checks better.
- **Judgment** — needs a model reading the skill (is the description trigger-rich, is the body at the right altitude, is detail correctly deferred). The linter cannot assess these.

The rubric tags each criterion `[M]`, `[J]`, or `[M + J]` accordingly. If part of a judgment criterion becomes mechanically enforceable, that aspect moves into the linter; any remaining judgment stays on the same stable criterion code.

## Portable Agent Skills contract

### 2. Layout

`SKILL.md` is the required entrypoint and lives at the skill root — a directory named after the skill, not a bare `.md`. Optional subdirectories use the conventional names `references/` (docs), `scripts/` (executables), `assets/` (templates/data); other files are allowed but these names are the convention. File references use forward slashes (`scripts/helper.ts`), never backslashes, which break on Unix. Supporting files sit **one level deep** from `SKILL.md` — every file links directly from it, with no nested chains (`SKILL → a → b → c`) that cause partial reads to miss content — and are named by content (`form-validation-rules.md`, not `doc2.md`). (SPEC, CC, BP)

### 3. Frontmatter document

`SKILL.md` begins at byte zero with an opening `---` line, a closing `---` line, and YAML between them that parses to a mapping. This document establishes the metadata contract; without a valid mapping, its individual fields cannot be interpreted reliably, so field-level checks stop. (SPEC, CC)

### 4. Frontmatter: name

`name` is required by the open spec (a runtime overlay may default it to the directory name, but a portable skill states it explicitly — see ※1). It is ≤ 64 characters; lowercase letters, digits, and hyphens only (no uppercase, spaces, or underscores); no leading/trailing or consecutive hyphens; and matches the parent directory name exactly. It carries no XML tags and no reserved words (`anthropic`, `claude`). Make it **specific, not generic** — avoid `helper`, `utils`, `tools`, `data`; a gerund (`processing-pdfs`), noun phrase (`pdf-processing`), or action form (`process-pdfs`) all read well. (SPEC, BP)

### 5. Frontmatter: description

The `description` is the **only signal at selection time** among potentially 100+ skills, injected into the system prompt — so it is the highest-leverage field in the skill. It is present, non-empty, ≤ 1024 characters (spec hard cap — see ※2), and free of XML tags (angle-bracket placeholders inside backticks are fine). It must state **both what the skill does and when to use it** (capability + trigger, never one alone); be written in the **third person** ("Audits skills…", never "I/You can…"); include concrete **trigger keywords/phrases** a user would actually say (file types, verbs, nouns); and avoid vague phrasing ("helps with documents"). Lean toward firing — agents tend to _under_-trigger — and front-load the most important trigger, since the listing truncates. Where skill-collision is likely, it may end with explicit non-triggers ("Do NOT use for…"). (SPEC, BP, CC, ENG, COMMUNITY)

### 6. Frontmatter: optional fields

Open-spec optional fields are validated when present: `compatibility` (1–500 chars, only for real environment requirements), `metadata` (string→string map), `allowed-tools` / `disallowed-tools` (valid tool specs; `allowed-tools` is **experimental** in the open spec), and `license` (mechanically, a non-empty YAML string scalar; prefer a short name or bundled-file reference). A larger set of fields is **Claude-Code-only** (`disable-model-invocation`, `user-invocable`, `context`, `agent`, `paths`, `model`, `effort`, `when_to_use`, `argument-hint`, `arguments`, `hooks`, `shell`) — CC extensions, not in the open spec, to flag when cross-platform portability matters (see ※3). Three carry behavioural nuance worth stating:

- **`disable-model-invocation: true`** is for side-effecting / manually-timed workflows (deploy, commit, send) so they can't auto-fire. In the CC runtime it also removes the skill's description from the context listing entirely — contrast `user-invocable: false`, which only hides the skill from the `/` menu while keeping the description in context.
- **`disallowed-tools`** removes tools from Claude's available pool for the current turn — the restriction clears on the next user message. Use it for autonomous or background-loop skills that must never call certain tools (e.g. blocking `AskUserQuestion` in a skill meant to run without human intervention). Contrast with per-session permission settings, which persist across turns. (CC)
- **`argument-hint`** is set by a skill with **discrete operating modes** (e.g. AUDIT / CONFORM / REFRESH) so the modes surface in the `/` menu and a user can route as `/<name> <mode>` without reading the body. Prefer this over splitting one cohesive skill into a slash command per mode (each resident description costs ~100 tokens and fragments the trigger surface). **Name the modes, don't letter them** (named modes keep cross-references stable and read consistently across the skill set — a shared `REFRESH` means the same everywhere), and **order them alphabetically** in both body and `argument-hint` so a new mode has one obvious insertion point. (SPEC, CC, COMMUNITY)

## Established authoring practice

### 7. Size & conciseness

The `SKILL.md` body stays under **500 lines** and **~5,000 tokens** (the recommended progressive-disclosure budget; metadata adds ~100 tokens). Both are soft performance recommendations, not hard caps (see ※5). Beyond raw size: spend no token on what a competent agent already knows — apply the "does the agent need this?" test to every paragraph — and write `SKILL.md` as an **overview that routes to detail**, not all detail inlined, because once loaded it persists across turns as recurring context cost. (SPEC, BP, CC)

### 8. Progressive disclosure

Detailed or rarely-used material lives in separate files loaded on demand, and mutually-exclusive domains are split (`references/finance.md` vs `references/sales.md`) so irrelevant context never loads. Every supporting file is referenced from `SKILL.md` with a note on what it holds and when to load it — no orphan files. Reference files longer than 100 lines open with a table of contents, so a partial read still shows full scope. Execution intent is explicit per script: "Run `x.ts`" (execute) vs "see `x.ts` for the algorithm" (read). (BP, ENG, SPEC, COMMUNITY)

**The mode-router shape.** When a skill's body is dominated by many _independently-invoked_ modes — a governance skill with a dozen modes, where any one fire uses one mode — treat the unused modes as the mutually-exclusive domains above: keep the **shared model and a dispatch table** in `SKILL.md`, and move each mode's _procedure_ to its own flat `references/mode-<name>.md` that the table names with its when-to-load. Only the invoked mode loads, instead of every mode on every fire. One file owns one mode: `mode-audit-conform.md` is split into `mode-audit.md` and `mode-conform.md`, and each procedure states its own preconditions without requiring a reference chain. **Keep in the body** anything every mode needs (the shared model) and any _behaviour anchor_ a checker verifies (a gate, a standing cascade) — never push an always-on rule onto an on-demand path. Use it when the body would otherwise carry many independent mode procedures and the footprint's body component dominates; **not** when modes are few, short, or call-chained, or the body already routes. (BP, ENG)

### 9. Body content quality

Match **degrees of freedom to task fragility**: prose + judgment for open-ended work; parameterised scripts for preferred-but-flexible; exact commands + "do not modify" for fragile/destructive. Keep no time-sensitive content in the main body ("before August 2025…") — legacy goes in a collapsed "old patterns" note. Use **consistent terminology** (one term per concept, always "field", never field/box/element). Give **concrete examples** (2–3 input/output pairs) where output quality depends on style. Offer **one default approach with an escape hatch**, not a menu of options. Match template strictness to the contract ("use this exact structure" for data; "sensible default, adapt" for flexible documents). Provide a copyable checklist for multi-step tasks and a feedback loop (run validator → fix → repeat) for quality-critical ones. And state the **why alongside each rule**, not bare MUST/NEVER. (BP, COMMUNITY)

### 10. Scripts

Scripts solve problems rather than punt back to the agent — they handle expected errors (missing file, permissions) explicitly. Every config value is justified in a comment (no unexplained magic numbers). Required packages are listed and verified for the target runtime (a model API has no network/runtime install); when a skill invokes MCP tools, use fully-qualified `ServerName:tool_name` names so the agent can locate the tool when multiple MCP servers are loaded. Deterministic, frequently-reused logic is pre-written as a script rather than regenerated each run. Validation scripts are verbose — error messages name the problem and the valid options. For batch/destructive operations, follow plan-validate-execute: produce a verifiable intermediate artifact, validate it, then act. Every supported non-test script directly under `scripts/` is a public command entry point: it exits successfully for `-h` and `--help` and prints useful usage or help text. Private reusable modules live under `scripts/internal/`; only modules explicitly published for cross-skill use live under `scripts/shared/`. The retired `scripts/lib/` directory is a packaging error. When adding a regex- or text-based mechanical check, run it against focused adversarial fixtures before considering it complete: fixture strings often resemble real violations, so the evidence builder must scan only the production files the rule actually governs rather than matching test data as source. (AS, BP, COMMUNITY, KI)

### 11. Process / evaluation

These are not checkable from the files alone. A good skill is built **evaluation-first** — at least three evaluation scenarios against a no-skill baseline before extensive docs — and is **tested across the models it will run on** (Haiku/Sonnet/Opus) with real usage. (BP, ENG)

### 12. Longevity

These check the skill against **time** — they matter most once it ships into a shared or cloud catalogue, long-lived and far from its author.

- **Volatile facts need a refresh path.** A skill that hard-codes facts that drift — model IDs/prices, API/SDK versions, tool/MCP-server names, CLI flags, dated spec numbers, third-party URLs — rots silently. It must either **(a)** resolve the volatile fact at runtime, or **(b)** carry a tracked source list with `last reviewed` dates **and** a REFRESH mode that re-anchors it (as `ki-skills` and `ki-mcp` do). The refresh path must name what to re-fetch and how to tell it has gone stale. This extends "no time-sensitive content in the body" from prose hygiene to a durability guarantee.
- **A cadence, not just a capability.** A REFRESH mode nobody runs decays as surely as no refresh. A skill that ships a refresh path should also state a **cadence** (periodic, or a clear "run when X" trigger) and, where the host supports it, register a scheduled run. Treat the schedule as a recommendation, but a refresh capability with no stated cadence is a half-measure. (BP, COMMUNITY)

## Runtime binding

### 13. Claude Code differences and moving targets

- **※1 `name` required vs optional.** Open spec: required, must match the directory. Claude Code: optional (defaults to directory name). For portable skills, always state it and match the directory.
- **※2 Description length.** Authoring cap is **1024 chars** (spec, BP). Claude Code's _runtime_ listing truncates `description` + `when_to_use` at **1,536 chars** (configurable; budget scales ~1% of context). Author to 1024; the larger number is a display limit, not an authoring target.
- **※3 CC-only frontmatter.** Many Claude Code fields aren't in the open spec; valid in CC, may not port to Cowork/other platforms. CC also adds non-frontmatter extensions: dynamic context injection (`` !`cmd` `` or ` ```! ` fenced blocks — run shell commands whose output is inlined before Claude sees the skill) and string substitutions (`$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `$name`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}`). These are CC runtime features, not part of the open spec. (CC)
- **※4 Commands → skills.** In Claude Code, `.claude/commands/*.md` and `.claude/skills/<name>/SKILL.md` both yield `/<name>`; skills are the recommended form. Suggest migrating old command files.
- **※5 Budgets are soft.** "< 500 lines" and "< 5,000 tokens" are performance recommendations, not enforced — the linter reports them as WARN, never FAIL. The reference validator (`skills-ref validate`) checks frontmatter/naming only.

## 14. Exact numbers

| Item                               | Value               | Hard/Soft | Source     |
| ---------------------------------- | ------------------- | --------- | ---------- |
| `name` max length                  | 64 chars            | hard      | SPEC, BP   |
| `description` max length           | 1024 chars          | hard      | SPEC, BP   |
| `compatibility` length             | 1–500 chars         | hard      | SPEC       |
| `SKILL.md` body                    | < 500 lines         | soft      | SPEC,BP,CC |
| `SKILL.md` instructions            | < 5,000 tokens      | soft      | SPEC       |
| Metadata (name+desc) load cost     | ≈ 100 tokens        | info      | SPEC       |
| Reference-file ToC threshold       | > 100 lines         | soft      | BP         |
| Evaluations before sharing         | ≥ 3                 | rec.      | BP         |
| CC listing truncation (desc+when)  | 1,536 chars †       | runtime   | CC         |
| CC post-compaction per-skill keep  | first 5,000 tok     | runtime   | CC         |
| CC combined post-compaction budget | 25,000 tok combined | runtime   | CC         |

† Claude-Code-specific runtime limit, configurable; distinct from the portable 1024-char authoring cap.
