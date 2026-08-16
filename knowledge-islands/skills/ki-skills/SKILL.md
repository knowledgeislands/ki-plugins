---
name: ki-skills
ki-kind: governance
ki-depends-on: []
ki-shared-modules: [rubric]
description: >
  Audit, review, extract, and write Agent Skills against current best practice. Use when creating a new skill, auditing or critiquing a SKILL.md, examining an existing skill for automation opportunities, analysing a project for reusable skills or scripts, or refreshing the house rubric. Carries a checkable rubric (mechanical checks plus judgment), a read-only candidate contract, the Knowledge Islands skill conventions, and a tracked source list. Triggers: "audit this skill", "review my skill architecture", "analyse my project for skills", "find steps to turn into scripts", "is this SKILL.md good", "write a new skill", "scaffold a skill", "lint the skills", "check skills against best practice", "refresh the skills rubric". Judges a `SKILL.md` itself (frontmatter + body prose), not a repo's code or config. Off-ramps: `ki-subagents` (subagent defs), `ki-repo-mcp` (server code), `ki-authoring` (Markdown/TOML style), `ki-repo-harness` (bundle layout).
argument-hint: 'audit <skill-or-repo> | conform <skill> | educate <description> | extract <repo> [--history <path>...] | help | optimise <skill> | refresh | review <skill-or-repo>'
---

# Knowledge Islands Skills

You are helping author or audit **Agent Skills** — directories with a `SKILL.md` (frontmatter + body), per the [Agent Skills open standard](https://agentskills.io/). This skill is the house rubric for what a _good_ skill looks like and the procedures that apply it.

The canonical home for these skills is the **ki-agentic-harness** repository; its `README.md` covers install, the symlink workflow, and the Knowledge Islands structure. This skill governs skill _quality_, not installation.

## The two-aspect model

Every criterion carries a mechanical aspect, a judgment aspect, or both:

- **Mechanical** — deterministically checkable. `ki repo audit --skill ki-skills` runs these through the installed rubric host: file exists, frontmatter parses, `name` matches the directory and the charset rules, length caps, link resolution, no wikilinks. **Always run the host first** — do not eyeball what deterministic code checks better.
- **Judgment** — needs a model. You assess these by reading: is the `description` trigger-rich and third-person, is the body at the right altitude, is detail correctly pushed into `references/`, does a standard skill avoid hard-coding one base. The linter cannot judge these.

A hybrid criterion retains one code and shared meaning while its deterministic evidence runs mechanically and its remaining judgment is counted for later review.

The portable and general conventions a good skill follows live in [the Agent Skills standard](references/standards-agent-skills.md); [the Knowledge Islands standard](references/standards-knowledge-islands.md) adds the house contract. Every KI skill declares `ki-kind: governance` or `ki-kind: process` in frontmatter; source directories group the concern and never determine kind. The current readable criteria live in [the generated rubric](references/rubric.md), each citing its standard section; [the exemplars](references/exemplars.md) illustrate selected authoring choices. Load the applicable standards and rubric before an AUDIT, CONFORM, or EDUCATE, and the exemplars when a rule needs a worked example.

[The rubric-authoring standard](references/standards-rubric-authoring.md) defines the code-first catalogue, session, context, and host boundary for writing or reviewing a governance rubric. Generic execution, findings, progress, transactions, and reporting belong to `ki`, not this skill. REVIEW and EXTRACT use the shared [candidate-finding standard](references/standards-candidate-findings.md) and their focused [REVIEW](references/mode-review.md) or [EXTRACT](references/mode-extract.md) procedure.

## Operating modes

Like every governance skill it carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** — EDUCATE here writes a new skill; **EXTRACT** identifies candidate reusable capabilities from an explicitly scoped repository and history; **OPTIMISE** pushes a compliant skill from the floor toward excellent; **REVIEW** assesses an existing skill's architecture and automation opportunities. Modes are named and alphabetical. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT — review an existing skill

Review a skill (or every skill in a repo) against the rubric and report.

**Auditing a whole repo? Keep mechanics central; isolate only judgment** ([ADR-KI-HARNESS-AGENTS-001](../../../docs/decisions/ADR-KI-HARNESS-AGENTS-001-subagent-isolation-for-multi-skill-invocation.md)): run the linter's whole-repo pass (COLL-1) and the description-reciprocity review (COLL-2) in the main context. For a large review, use runtime subagents to fan out only independent [J] review after capturing the mechanical output; each reviewer receives one bounded concern and returns findings for the orchestrator to synthesise. When `ki-delegation` is active in the same scope, read its standard before creating a durable delegation packet. Rank findings by the foundations-first review priority in [ADR-KI-HARNESS-SKILLS-003](../../../docs/decisions/ADR-KI-HARNESS-SKILLS-003-dependency-order-for-multi-skill-composition.md); executable order comes from `ki-depends-on:` instead. Do not maintain a runtime-specific workflow to re-run the checker fleet.

1. **Run the host.** Run `ki repo audit --skill ki-skills --repo <repo>` against the repository containing the target skill. It uses `FAIL`, `WARN`, `INFO`, `NOT_APPLICABLE`, and `PASS`, and exits non-zero on any `FAIL` finding. Judgment aspects are not emitted as synthetic findings; the summary counts them as unevaluated. Capture the findings verbatim rather than re-deriving them. Repository scope is required because the cross-skill collision pass (COLL-1) compares siblings.
2. **Read the `SKILL.md`** (and any `references/`, `scripts/`, `assets/`) and apply the **judgment** ([J]-tagged) criteria from [the rubric](references/rubric.md) — the linter owns the [M] ones. Focus on:
   - **Description** — does it state both _what it does_ and _when to use it_, in the third person, with concrete trigger phrases a user would actually say? Does it earn its standing source cost by retaining scope, its primary trigger, and only essential collision guidance? It is the primary portable signal for implicit selection.
   - **Altitude & conciseness** — is anything in the body something a competent agent already knows? Is detail that's read rarely pushed into `references/` rather than inlined?
   - **Progressive disclosure** — is every bundled file referenced from `SKILL.md` with a note on when to load it? Any orphan files?
   - **Knowledge Islands fit** — is it correctly a _standard_ skill (resolves base bindings at runtime, hard-codes no base), and is every claimed **composition** a necessary prerequisite declared in `ki-depends-on:`? Keep coverage-detected standards, off-ramps, and shared modules distinct from composition, and reject retired base-coupled extension. See [the rubric](references/rubric.md) area KI-SHAPE.
   - **Collision & longevity** — for any trigger the linter flags as shared (or that you judge semantically overlapping), does **each** description name the other as an off-ramp, or is the guard one-directional? And does the skill hard-code volatile facts (model IDs, API / tool names, URLs, dated specs) without resolving them at runtime or carrying a refresh path — the staleness that bites hardest once a skill ships to a cloud catalogue it can't be eyeballed in? See [the rubric](references/rubric.md) areas COLL and LONG.
3. **Report** as a table: criterion → verdict (✅ pass / ⚠️ warn / ❌ fail) → the specific fix. Lead with FAILs, then WARNs, then a one-line overall verdict. Cite the rubric criterion number. Offer to apply the fixes.

### Mode CONFORM — bring an existing skill into line

1. Run **AUDIT** first to get the fix list.
2. **Apply the fixes in place** — `description`, body altitude, progressive disclosure, links, frontmatter — per [the rubric](references/rubric.md), touching only what a criterion calls for and leaving the skill's voice intact.
3. **Re-run AUDIT** (and the linter) until it is clean.

### Mode EDUCATE — write a new skill

1. **Clarify scope first**: what should fire the skill (the triggers), what kind it is (Knowledge Islands / process / scoped — see ki-agentic-harness `README.md`), and how it relates to siblings. Declare **composition** only when selecting this skill necessarily selects and runs the sibling first; treat coverage-detected governance, off-ramps, and shared modules as separate relationships. Never create a base-coupled extension that takes another skill's modes.
2. **Scaffold** `<name>/SKILL.md` with `references/`, `scripts/`, `assets/` only as needed. The directory name **is** the `name:` frontmatter (lowercase, hyphenated, in sync).
3. **Write to the rubric, not from memory** — open [the rubric](references/rubric.md) and satisfy each criterion as you draft. In particular: trigger-rich third-person `description`; body under 500 lines / ~5,000 tokens; one default approach with an escape hatch, not a menu; detail in `references/`; relative markdown links (angle-bracket form for paths with spaces), never wikilinks; refer to other skills by `name`, never path.
4. **Self-audit before finishing** — run Mode AUDIT on the new skill. EDUCATE and AUDIT share one rubric on purpose.
5. **Add it to the set's scheduled refresh** — if the host registers a scheduled run that sweeps the set's REFRESH (LONG-2), add the new skill to that routine so it doesn't silently fall out of the sweep. The routine is host infra, not a repo file, so this is a manual follow-up the audit can't verify.

### Mode EXTRACT — identify reusable capabilities from a project

Inspect one explicitly named repository and, only when supplied, its explicitly selected history inputs to find candidate reusable skills, scripts, references, agents, or hooks.

Read and follow [the EXTRACT procedure](references/mode-extract.md). It produces candidate findings and reconciles them with the canonical roadmap; it never mines unselected history or writes a skill, roadmap item, plan, agent, hook, or script without a later explicit user request.

### Mode OPTIMISE — push a compliant skill toward excellent

**Precondition: the skill is already clean.** OPTIMISE assumes AUDIT (and CONFORM where needed) pass with zero FAIL — it improves a skill that has no violations, it does not fix one that does. If AUDIT is not clean, run CONFORM first. This mode works _above_ the caps, not at them; the target is **discoverability-per-token**, not the shortest possible skill — rich enough to fire, lean enough not to tax every turn. Optimising one lever blindly hurts the other; holding both is the work.

1. **Measure the footprint.** Use `ki-tokenomics` for the environment-level `skills_surface`. A future per-skill projection belongs in an explicit host capability, not a private runner or a dormant rubric mode.
2. **Lever one — token-efficiency (operationalises SIZE-3 / SIZE-4).** Cut what a competent agent already knows, restated context, and ceremony (SIZE-3). Lift rarely-read detail out of `SKILL.md` into a `references/` file so the body stays an overview that routes (SIZE-4) — this _moves_ tokens off the every-fire path, it does not delete function. When the body is dominated by many independently invoked modes, the heavy-skill move is **mode-routing** (REF-5 / §8): keep the shared model plus a dispatch table in the body and lift each mode's procedure to a flat `references/mode-<name>.md`, so only the fired mode loads.
3. **Lever two — discoverability (operationalises DESC-7 / DESC-9 / COLL-2).** Tune the `description` to win its own trigger phrases: front-load the single most important trigger (DESC-7); where a sibling is genuinely adjacent, add explicit non-triggers / reciprocal off-ramps (DESC-9, COLL-2). Use the linter's whole-repo **COLL-1** pass as evidence of which phrases collide — run it over the repo, not one skill.
4. **Hold the tension.** A cut that costs a trigger, or an off-ramp that bloats the `description` past where it earns its standing cost, is a regression even when each looks like a local win. The tie-breaker is value-per-token of the **standing** surface — the `description`, paid every turn — over the on-demand body and references.
5. **Re-audit.** Run Mode AUDIT (and the linter). OPTIMISE must leave the skill clean: nothing here may introduce a FAIL or WARN.

### Mode REFRESH — re-anchor best practice

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-repo-kb`'s IMPROVE mode instead.

Keep the rubric current — the standard and the community move, and this is why the skill tracks its own sources. Run on its declared cadence (see `references/sources.md`), or when asked "is the skills rubric current".

1. **Read [the source list](references/sources.md)** — the tracked authoritative + community sources, each with a `last reviewed` date and what it governs. For Agent Skills, fetch its [documentation index](https://agentskills.io/llms.txt) first, reconcile the listed page inventory (add new pages and retire removed ones), then review every current page individually.
2. **Re-fetch each source** (WebFetch/WebSearch) and **diff against the current [Agent Skills](references/standards-agent-skills.md) and [Knowledge Islands](references/standards-knowledge-islands.md) standards plus [rubric](references/rubric.md)**: new required/optional frontmatter fields, changed caps (length, line, token budgets), new anti-patterns, deprecations. Scan the declared discovery sources' landing pages for newly published articles materially relevant to agent skills, agentic practice, or authoring workflows; treat those articles as discovery evidence, not a normative standard. Note where sources disagree.
3. **Scan our own skills** in the ki-agentic-harness repo for emergent patterns that work but aren't yet codified — promote the good ones into the standard + rubric; flag drift that contradicts them.
4. **Propose a diff** to the applicable standard and the structured item definitions under `scripts/rubric/items/`; update a criterion's mechanical execution when new evidence can be checked deterministically. Confirm before writing, then republish [the readable rubric](references/rubric.md) with `ki dev skill rubric ki-skills --write`.
5. **Update [the source list](references/sources.md)** — bump each `last reviewed` date, add any new source, retire any dead one, and refresh the `## Last review` block (what's confirmed, open watch-items). The record of _what changed_ is the commit itself — history lives in git, not a changelog. This step is mandatory: the source list is the skill's memory of where best practice comes from.

### Mode REVIEW — assess an existing skill's evolution opportunities

Assess an existing skill or skill set beyond rubric conformance: its guidance, references, scripts, repeated procedures, and appropriate automation boundary.

Read and follow [the REVIEW procedure](references/mode-review.md). It begins with AUDIT, produces candidate findings, and reconciles them with the canonical roadmap; it does not silently alter the reviewed skill or create follow-on work.

## Notes

- **Run the linter, then judge.** The linter owns the mechanical layer; you own the judgment layer. Reporting a mechanical failure the linter already catches, or hand-waving a judgment call the linter can't make, are both misses.
- A WARN is not a FAIL. Line/token budgets and the third-person description heuristic are _recommendations_ — report them, but a skill can ship over a soft cap with a reason.
- This skill audits skills, including itself. When you change the rubric, re-run Mode AUDIT on `ki-skills`.
- The catalogue owns criterion policy and typed outcomes; the `ki` host owns finding conversion, progress, reporting, exit status, and publication.
