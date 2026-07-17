---
name: ki-skills
implies: []
vendors: [educate, audit, conform, help]
description: >
  Audit, review, and write Agent Skills against current best practice. Use when creating a new skill, reviewing or critiquing an existing SKILL.md, checking a skill before it ships, asking "is this skill any good / well-written / discoverable", or refreshing the house rubric against new community guidance. Carries a checkable rubric (split into mechanical checks a bundled linter runs, and judgment checks you apply), the Knowledge Islands skill conventions, and a tracked source list it revisits. Triggers: "audit this skill", "review my skill", "is this SKILL.md good", "write a new skill", "scaffold a skill", "lint the skills", "check skills against best practice", "refresh the skills rubric", "what do we expect from a skill". Judges a `SKILL.md` itself (frontmatter + body prose), not a repo's code or config. Off-ramps: `ki-agents` (subagent defs), `ki-mcp` (server code), `ki-authoring` (Markdown/TOML style), `ki-harness` (bundle layout).
argument-hint: 'audit <skill-or-repo> | conform <skill> | help | educate <description> | optimise <skill> | refresh'
---

# Knowledge Islands Skills

You are helping author or audit **Agent Skills** — directories with a `SKILL.md` (frontmatter + body), per the [Agent Skills open standard](https://agentskills.io/). This skill is the house rubric for what a _good_ skill looks like, plus the three modes you run over it.

The canonical home for these skills is the **ki-agentic-harness** repository; its `README.md` covers install, the symlink workflow, and the Knowledge Islands structure. This skill governs skill _quality_, not installation.

## The two-layer model

Every criterion is one of two kinds — never conflate them:

- **Mechanical** — deterministically checkable. A bundled linter ([`scripts/audit.ts`](scripts/audit.ts)) runs these: file exists, frontmatter parses, `name` matches the directory and the charset rules, length caps, link resolution, no wikilinks. **Always run the linter first** — do not eyeball what a script checks better.
- **Judgment** — needs a model. You assess these by reading: is the `description` trigger-rich and third-person, is the body at the right altitude, is detail correctly pushed into `references/`, does a standard skill avoid hard-coding one base. The linter cannot judge these.

The conventions a good skill follows — what each is and why — live in [the Agent Skills standard](references/agent-skills-standard.md); the line-by-line checkable criteria (with `[M]`/`[J]` tags and codes) live in [the rubric](references/audit-rubric.md), each citing its standard section. Load both before an AUDIT, CONFORM, or EDUCATE; this body is the routing overview.

## Operating modes

Like every governance skill it carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** — EDUCATE here writes a new skill; **OPTIMISE** — pushing a compliant skill from the floor toward excellent — is its skill-specific mode. Modes are named and alphabetical. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT — review an existing skill

Review a skill (or every skill in a repo) against the rubric and report.

**Auditing a whole repo? Keep mechanics central; isolate only judgment** ([ADR-KI-HARNESS-AGENTS-001](../../../docs/decisions/ADR-KI-HARNESS-AGENTS-001-subagent-isolation.md)): run the linter's whole-repo pass (COLL-1) and the description-reciprocity review (COLL-2) in the main context. For a large review, use `ki-delegate` to fan out only independent [J] review after capturing the mechanical output; each reviewer receives one bounded concern and returns findings for the orchestrator to synthesise. Rank findings by dependency order (foundations first) per [ADR-KI-HARNESS-SKILLS-003](../../../docs/decisions/ADR-KI-HARNESS-SKILLS-003-dependency-order-composition.md) — that order is synthesis priority, not execution order. Do not maintain a runtime-specific workflow to re-run the checker fleet.

1. **Run the linter.** `bun scripts/audit.ts <path-to-skill-or-repo>` from this skill's directory (or `bun run ki:skills:audit` at the ki-agentic-harness repo root). It reports the mechanical criteria on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / NA / PASS — see `ki-engineering`'s [checker-contract.md](../../foundations/ki-engineering/references/checker-contract.md)) and exits non-zero on any FAIL; with `--json` / `--report` it emits machine-readable findings and writes the latest report to the target's `.ki-meta/audits/skills.{md,json}`. Capture its output verbatim — do not re-derive what it found. Point it at the **repo**, not a lone skill, so the cross-skill collision pass (COLL-1) has the siblings to compare.
2. **Read the `SKILL.md`** (and any `references/`, `scripts/`, `assets/`) and apply the **judgment** ([J]-tagged) criteria from [the rubric](references/audit-rubric.md) — the linter owns the [M] ones. Focus on:
   - **Description** — does it state both _what it does_ and _when to use it_, in the third person, with concrete trigger phrases a user would actually say? This is the only signal at selection time.
   - **Altitude & conciseness** — is anything in the body something a competent Claude already knows? Is detail that's read rarely pushed into `references/` rather than inlined?
   - **Progressive disclosure** — is every bundled file referenced from `SKILL.md` with a note on when to load it? Any orphan files?
   - **Knowledge Islands fit** — is it correctly a _standard_ skill (resolves base bindings at runtime, hard-codes no base), and are its inter-skill relationships **composition** (running a sibling's checker/mode in sequence and adding a delta, the edge declared) rather than a retired base-coupled extension? See [the rubric](references/audit-rubric.md) area SHAPE.
   - **Collision & longevity** — for any trigger the linter flags as shared (or that you judge semantically overlapping), does **each** description name the other as an off-ramp, or is the guard one-directional? And does the skill hard-code volatile facts (model IDs, API / tool names, URLs, dated specs) without resolving them at runtime or carrying a refresh path — the staleness that bites hardest once a skill ships to a cloud catalogue it can't be eyeballed in? See [the rubric](references/audit-rubric.md) areas COLL and LONG.
3. **Report** as a table: criterion → verdict (✅ pass / ⚠️ warn / ❌ fail) → the specific fix. Lead with FAILs, then WARNs, then a one-line overall verdict. Cite the rubric criterion number. Offer to apply the fixes.

### Mode CONFORM — bring an existing skill into line

1. Run **AUDIT** first to get the fix list.
2. **Apply the fixes in place** — `description`, body altitude, progressive disclosure, links, frontmatter — per [the rubric](references/audit-rubric.md), touching only what a criterion calls for and leaving the skill's voice intact.
3. **Re-run AUDIT** (and the linter) until it is clean.

### Mode EDUCATE — write a new skill

1. **Clarify scope first**: what should fire the skill (the triggers), what kind it is (Knowledge Islands / process / scoped — see ki-agentic-harness `README.md`), and how it relates to sibling skills — always **composition** (run a sibling's checker/mode in sequence and add a delta; declare the edge), never a base-coupled extension that takes another skill's modes.
2. **Scaffold** `<name>/SKILL.md` with `references/`, `scripts/`, `assets/` only as needed. The directory name **is** the `name:` frontmatter (lowercase, hyphenated, in sync).
3. **Write to the rubric, not from memory** — open [the rubric](references/audit-rubric.md) and satisfy each criterion as you draft. In particular: trigger-rich third-person `description`; body under 500 lines / ~5,000 tokens; one default approach with an escape hatch, not a menu; detail in `references/`; relative markdown links (angle-bracket form for paths with spaces), never wikilinks; refer to other skills by `name`, never path.
4. **Self-audit before finishing** — run Mode AUDIT on the new skill. EDUCATE and AUDIT share one rubric on purpose.
5. **Add it to the set's scheduled refresh** — if the host registers a scheduled run that sweeps the set's REFRESH (LONG-2), add the new skill to that routine so it doesn't silently fall out of the sweep. The routine is host infra, not a repo file, so this is a manual follow-up the audit can't verify.

### Mode OPTIMISE — push a compliant skill toward excellent

**Precondition: the skill is already clean.** OPTIMISE assumes AUDIT (and CONFORM where needed) pass with zero FAIL — it improves a skill that has no violations, it does not fix one that does. If AUDIT is not clean, run CONFORM first. This mode works _above_ the caps, not at them; the target is **discoverability-per-token**, not the shortest possible skill — rich enough to fire, lean enough not to tax every turn. Optimising one lever blindly hurts the other; holding both is the work.

1. **Measure the footprint.** Run `bun scripts/audit.ts <skill> --footprint`. It reports, as INFO (never a verdict — **SIZE-5**), the estimated tokens of each component: the `description` (standing cost — paid every turn in the selection surface), the `SKILL.md` body (loaded when the skill fires), and each `references/` file (loaded on demand). This is the per-skill, artifact-level view. The **environment-level** aggregate — every installed skill's description summed against a per-layer budget — belongs to `ki-tokenomics` (`skills_surface`); go there for "is the whole skills surface too heavy", come here for "is _this_ skill earning its tokens".
2. **Lever one — token-efficiency (operationalises SIZE-3 / SIZE-4).** Cut what a competent Claude already knows, restated context, and ceremony (SIZE-3). Lift rarely-read detail out of `SKILL.md` into a `references/` file so the body stays an overview that routes (SIZE-4) — this _moves_ tokens off the every-fire path, it does not delete function. Re-run `--footprint` to confirm the body shrank without the total ballooning. When the body is dominated by many independently-invoked modes, the heavy-skill move is **mode-routing** (REF-5 / §7): keep the shared model + a dispatch table in the body and lift each mode's procedure to a flat `references/mode-<name>.md`, so only the fired mode loads — footprint-gated, for a body the modes dominate, not one that already routes.
3. **Lever two — discoverability (operationalises DESC-7 / DESC-9 / COLL-2).** Tune the `description` to win its own trigger phrases: front-load the single most important trigger (DESC-7); where a sibling is genuinely adjacent, add explicit non-triggers / reciprocal off-ramps (DESC-9, COLL-2). Use the linter's whole-repo **COLL-1** pass as evidence of which phrases collide — run it over the repo, not one skill.
4. **Hold the tension.** A cut that costs a trigger, or an off-ramp that bloats the `description` past where it earns its standing cost, is a regression even when each looks like a local win. The tie-breaker is value-per-token of the **standing** surface — the `description`, paid every turn — over the on-demand body and references.
5. **Re-audit.** Run Mode AUDIT (and the linter). OPTIMISE must leave the skill clean: nothing here may introduce a FAIL or WARN.

### Mode REFRESH — re-anchor best practice

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

Keep the rubric current — the standard and the community move, and this is why the skill tracks its own sources. Run on its declared cadence (see `references/sources.md`), or when asked "is the skills rubric current".

1. **Read [the source list](references/sources.md)** — the tracked authoritative + community sources, each with a `last reviewed` date and what it governs.
2. **Re-fetch each source** (WebFetch/WebSearch) and **diff against the current [standard](references/agent-skills-standard.md) + [rubric](references/audit-rubric.md)**: new required/optional frontmatter fields, changed caps (length, line, token budgets), new anti-patterns, deprecations. Note where sources disagree.
3. **Scan our own skills** in the ki-agentic-harness repo for emergent patterns that work but aren't yet codified — promote the good ones into the standard + rubric; flag drift that contradicts them.
4. **Propose a diff** to [the standard](references/agent-skills-standard.md) and [rubric](references/audit-rubric.md) and, where relevant, [the linter](scripts/audit.ts) (a newly-mechanical check should move from judgment into the script). Confirm before writing.
5. **Update [the source list](references/sources.md)** — bump each `last reviewed` date, add any new source, retire any dead one, and refresh the `## Last review` block (what's confirmed, open watch-items). The record of _what changed_ is the commit itself — history lives in git, not a changelog. This step is mandatory: the source list is the skill's memory of where best practice comes from.

## Notes

- **Run the linter, then judge.** The linter owns the mechanical layer; you own the judgment layer. Reporting a mechanical failure the linter already catches, or hand-waving a judgment call the linter can't make, are both misses.
- A WARN is not a FAIL. Line/token budgets and the third-person description heuristic are _recommendations_ — report them, but a skill can ship over a soft cap with a reason.
- This skill audits skills, including itself. When you change the rubric, re-run Mode AUDIT on `ki-skills`.
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../../foundations/ki-engineering/references/checker-contract.md).
