# Audit Rubric — the checkable criteria

Line-by-line pass/fail criteria for auditing an Agent Skill against the [Agent Skills Standard](agent-skills-standard.md). Each is tagged **[M] mechanical** (the bundled [linter](../scripts/lint-skills.ts) checks it) or **[J] judgment** (you assess it by reading). The **code** in bold (`NAME-1`, `DESC-2`, …) is the area's short code plus its number _within that area_ — it's what the linter prints and what an audit should cite. Numbering restarts at 1 per area, so inserting a criterion only renumbers its own area. Source abbreviations resolve in [the source list](sources.md); the **full rationale, the "Disagreements & moving targets" notes (`※1`–`※5`), and the exact-numbers table live in the [standard](agent-skills-standard.md)** — each area below maps to the like-named standard section.

A criterion's tag is a contract with the linter: if you find yourself eyeballing an **[M]** check, run the linter instead; if the linter ever starts enforcing a **[J]** check, move its tag here.

Checker output follows the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../../ki-engineering/references/checker-contract.md).

## Contents

- [LAY — File existence & layout](#lay--file-existence--layout)
- [NAME — Frontmatter: name](#name--frontmatter-name)
- [DESC — Frontmatter: description](#desc--frontmatter-description)
- [OPT — Frontmatter: optional fields](#opt--frontmatter-optional-fields)
- [SIZE — Body: size & conciseness](#size--body-size--conciseness)
- [REF — Progressive disclosure & references](#ref--progressive-disclosure--references)
- [BODY — Body content quality](#body--body-content-quality)
- [SCRIPT — Scripts & executable code](#script--scripts--executable-code)
- [LINK — Linking & portability](#link--linking--portability)
- [SHAPE — Knowledge Islands skill shape](#shape--knowledge-islands-skill-shape)
- [PROC — Process / meta](#proc--process--meta)
- [COLL — Cross-skill collision](#coll--cross-skill-collision)
- [LONG — Longevity](#long--longevity)

## LAY — File existence & layout

→ [standard §2](agent-skills-standard.md#2-layout)

- **LAY-1 [M]** `SKILL.md` exists at the skill root. (SPEC, CC)
- **LAY-2 [M]** The skill is a **directory** named after the skill, with `SKILL.md` inside — not a bare `.md`. (SPEC, CC)
- **LAY-3 [M]** Optional subdirs use the standard names `references/`, `scripts/`, `assets/`. (SPEC)
- **LAY-4 [M]** File references use forward slashes, never backslashes. (BP)
- **LAY-5 [J]** Reference files are **one level deep** from `SKILL.md` — no nested chains (SKILL → a → b → c). (BP, SPEC)
- **LAY-6 [J]** Supporting files are named by content (`form-validation-rules.md`, not `doc2.md`). (BP)

## NAME — Frontmatter: name

→ [standard §3](agent-skills-standard.md#3-frontmatter-name)

- **NAME-1 [M]** `name` present (spec requires it; CC defaults to dir name — see ※1). (SPEC, CC)
- **NAME-2 [M]** `name` ≤ 64 characters. (SPEC, BP)
- **NAME-3 [M]** `name` is lowercase letters, digits, hyphens only. (SPEC, BP)
- **NAME-4 [M]** `name` has no leading/trailing hyphen and no consecutive hyphens. (SPEC)
- **NAME-5 [M]** `name` matches the parent directory name exactly. (SPEC)
- **NAME-6 [M]** `name` contains no XML tags and no reserved words (`anthropic`, `claude`). (BP)
- **NAME-7 [J]** `name` is specific, not generic (avoid `helper`, `utils`, `tools`, `data`). (BP)

## DESC — Frontmatter: description

→ [standard §4](agent-skills-standard.md#4-frontmatter-description)

- **DESC-1 [M]** `description` present and non-empty. (SPEC, CC)
- **DESC-2 [M]** `description` ≤ 1024 characters (spec hard cap — see ※2). (SPEC, BP)
- **DESC-3 [M]** `description` contains no XML tags (placeholders inside backticks are fine). (BP)
- **DESC-4 [J]** States **both** what it does **and** when to use it. (SPEC, BP)
- **DESC-5 [J]** Written in the **third person**, never first/second person. (BP, COMMUNITY)
- **DESC-6 [J]** Includes concrete **trigger keywords/phrases** a user would say. (SPEC, BP, CC)
- **DESC-7 [J]** Leans toward firing, and front-loads the most important trigger. (ENG, COMMUNITY, CC)
- **DESC-8 [J]** Avoids vague phrasing ("helps with documents"). (SPEC, BP)
- **DESC-9 [J]** _(Advanced)_ Where collision is likely, may end with explicit non-triggers. (COMMUNITY)

## OPT — Frontmatter: optional fields

→ [standard §5](agent-skills-standard.md#5-frontmatter-optional-fields)

- **OPT-1 [M]** `compatibility`, if present, is 1–500 chars. (SPEC)
- **OPT-2 [M]** `metadata`, if present, is a string→string map. (SPEC)
- **OPT-3 [M]** `allowed-tools` / `disallowed-tools`, if present, are valid tool specs (`allowed-tools` is **experimental**). (SPEC, CC)
- **OPT-4 [M]** `license`, if present, is a short license name or bundled-file reference. (SPEC)
- **OPT-5 [J]** CC-only fields are flagged when cross-platform portability matters (see ※3). (CC)
- **OPT-6 [J]** Side-effecting / manually-timed workflows set `disable-model-invocation: true` (contrast `user-invocable: false`). (CC)
- **OPT-7 [J]** A skill with discrete modes sets `argument-hint`; modes are **named** (not lettered) and **alphabetically ordered**. (CC, COMMUNITY)

## SIZE — Body: size & conciseness

→ [standard §6](agent-skills-standard.md#6-size--conciseness)

- **SIZE-1 [M]** `SKILL.md` body is under **500 lines**. (SPEC, BP, CC)
- **SIZE-2 [M]** Body instructions stay under **~5,000 tokens**. (SPEC)
- **SIZE-3 [J]** No token spent on what a competent Claude already knows. (BP)
- **SIZE-4 [J]** `SKILL.md` reads as an **overview that routes to detail**, not all detail inlined. (BP, SPEC, CC)
- **SIZE-5 [M]** _(INFO, advisory — not a cap.)_ The linter, under `--footprint`, emits a per-skill token estimate of each component the skill adds to context — the `description` (standing cost), the `SKILL.md` body, and each `references/` file — plus a total. Neutral measurement for **Mode OPTIMISE**, never a verdict; the body/references soft limits remain SIZE-1/SIZE-2 and the environment-wide aggregate of all descriptions is `ki-tokenomics`' `skills_surface`. (BP)

## REF — Progressive disclosure & references

→ [standard §7](agent-skills-standard.md#7-progressive-disclosure)

- **REF-1 [J]** Detailed/rarely-used material is in on-demand files; mutually-exclusive domains are split. (BP, ENG, SPEC)
- **REF-2 [J]** Every supporting file is referenced from `SKILL.md` with when-to-load — no orphans. (BP, CC, SPEC)
- **REF-3 [M]** Reference files > 100 lines open with a table of contents. (BP, COMMUNITY)
- **REF-4 [J]** Execution intent is explicit per script (run vs read). (BP, ENG)
- **REF-5 [J]** _Mode-router for many-moded skills._ A skill whose body is dominated by **independently-invoked** modes keeps the shared model + a dispatch table in `SKILL.md` and moves each mode's procedure to a flat `references/mode-<name>.md` (tightly-coupled modes co-located, e.g. AUDIT+CONFORM); behaviour anchors and the shared model stay in the body. Not required when modes are few, short, or call-chained. (BP, SPEC §7)

## BODY — Body content quality

→ [standard §8](agent-skills-standard.md#8-body-content-quality)

- **BODY-1 [J]** Degrees of freedom match task fragility (prose → parameterised script → exact "do not modify"). (BP, COMMUNITY)
- **BODY-2 [J]** No time-sensitive content in the main body; legacy goes in a collapsed note. (BP)
- **BODY-3 [J]** Consistent terminology — one term per concept. (BP, COMMUNITY)
- **BODY-4 [J]** Concrete examples (2–3 I/O pairs) where output quality depends on style. (BP, COMMUNITY)
- **BODY-5 [J]** One default approach with an escape hatch, not a menu. (BP)
- **BODY-6 [J]** Template strictness matches the contract (exact vs adapt). (BP, COMMUNITY)
- **BODY-7 [J]** Copyable checklist for multi-step tasks; feedback loop for quality-critical ones. (BP, COMMUNITY)
- **BODY-8 [J]** Rules state the _why_ alongside the rule, not bare MUST/NEVER. (COMMUNITY)

## SCRIPT — Scripts & executable code

→ [standard §9](agent-skills-standard.md#9-scripts)

- **SCRIPT-1 [J]** Scripts handle expected errors (missing file, permissions) rather than punt to Claude. (BP)
- **SCRIPT-2 [J]** No unexplained magic numbers — every config value is justified. (BP)
- **SCRIPT-3 [J]** Required packages are listed/verified for the runtime; MCP tools use fully-qualified `ServerName:tool_name`. (BP)
- **SCRIPT-4 [J]** Deterministic, frequently-reused logic is pre-written, not regenerated each run. (BP)
- **SCRIPT-5 [J]** Validation scripts are verbose — errors name the problem and the valid options. (BP)
- **SCRIPT-6 [J]** Plan-validate-execute for batch/destructive ops. (BP, COMMUNITY)
- **SCRIPT-7 [J]** Scripts installed into a target repo's `scripts/` directory are **copies**, not symlinks or out-of-repo references — the target repo must be autonomous. (BP)

## LINK — Linking & portability

→ [standard §10](agent-skills-standard.md#10-linking--portability)

- **LINK-1 [M]** Internal links are **standard relative markdown links**, not wikilinks. (ki-agentic-harness README)
- **LINK-2 [M]** Links resolve — every relative target exists (angle-bracket form for paths with spaces). (ki-agentic-harness README)
- **LINK-3 [J]** Other skills are referenced by `name`, never by file path. (ki-agentic-harness README)
- **LINK-4 [J]** The house toolchain passes: Biome (TS/JSON), Prettier + markdownlint-cli2 (markdown). (ki-agentic-harness README)

## SHAPE — Knowledge Islands skill shape

→ [standard §11](agent-skills-standard.md#11-knowledge-islands-skill-shape)

- **SHAPE-1 [J]** A **standard** KI skill resolves base bindings at runtime and hard-codes **no single base**. (ki-agentic-harness README, `ki-kb-base`)
- **SHAPE-2 [M-heuristic + J]** **Composition is the only inter-skill relationship — the base-coupled extension pattern is retired.** A skill builds on another by running the sibling's checker/mode **in sequence** and adding its delta (never importing it), and **declares the edge** — naming the sibling and the run order in its AUDIT mode. What a base needs differently is **declared, not forked**: data in the repo's own `.ki-config` table (read validate-down), prose in its `CLAUDE.md` — never a `<base>-kb`-style skill that takes the shared modes by name. _Delegation between two standards (kb → streams) is composition at sub-scope._ The linter flags **endorsement of the retired pattern** (telling a base to ship/"prefer" an extension skill, or that a skill "delegates the modes back" / "extends this one") as a mechanical heuristic; the **[J]** gate is that no skill in the set models a relationship as a base-coupled extension. (ki-agentic-harness README, `ki-engineering`)
- **SHAPE-3 [J]** The skill declares its **kind** (Knowledge Islands / process / scoped) clearly. (ki-agentic-harness README)
- **SHAPE-4 [J]** A skill that reads the shared `.ki-config.toml` consumes and **validates only its own `[<skill>]` table** — warns on a key it doesn't recognise, advises dropping one that merely restates a default — and never inspects another skill's table. Validate down, ignore across. (contract defined by `ki-repo`)
- **SHAPE-5 [J]** A **governance skill** (one that holds a standard) exposes the universal modes **AUDIT** + **REFRESH** + **CONFORM**; any further modes (`INIT` to scaffold a new artifact, `OPTIMISE` to push a compliant artifact from the floor toward excellent, and operational modes like kb's note-ops) are skill-specific. Modes are named, not lettered, and ordered alphabetically in the body and `argument-hint`. (ki-agentic-harness README)
- **SHAPE-6 [J]** _Governance-skill file shape — Knowledge Islands repos only, for now._ A governance skill **shipped in a Knowledge Islands repo** (one carrying a `.ki-config.toml`) materialises its standard as the shared four-file shape, so a reader or a new such skill moves between them: a normative **`<domain>-standard.md`** (or the contract / conventions reference it holds), an **`audit-rubric.md`** of pass/fail criteria each tagged **[M]**/**[J]** and citing its standard section, a tracked **`references/sources.md`** with `last reviewed` dates (see **LONG-1**) — provenance only, its change history kept in git rather than an in-file changelog; a skill tracking a moving external spec also keeps a current-state **`## Last review`** block (pinned revision, confirmations, open watch-items), overwritten each refresh — and a **mechanical checker** (the judgment half applied by reading). A governance skill outside a Knowledge Islands repo is exempt until the convention is generalised. (ki-agentic-harness README)
- **SHAPE-7 [M-heuristic + J]** _A behaviour-changing skill defines its gate — and checks the anchor._ A skill that changes a **default behaviour** — installs a gate, a standing "always do X before Y" rule, or a routing intercept — cannot rely on its own `description` to fire it, because skills load **on demand** and the triggering request often won't mention the skill (e.g. "edit this note" never says "proposal"). Such a skill must **anchor the behaviour in always-loaded context** (the base/repo `CLAUDE.md` / `AGENTS.md`, or a companion skill that _does_ reliably load handing off to it), **and its checker must verify the anchor is present** so it can't be silently lost. The linter surfaces candidates mechanically (strong gate phrasing in the body or a reference file — body + references scanned as one unit, since mode-routing lifts procedures out of the body — without an anchor its checker reads); the **[J]** call is whether the skill genuinely changes a default and so _needs_ a gate. Realised as `ki-kb-streams`' **GATE-1** (the Enactment gate) and `ki-kb-base`'s **MEM-2** (the memory cascade); `ki-repo`'s `.ki-config.toml` marker is the same pattern (anchor + checked).
- **SHAPE-8 [J]** _Governance-skill checker contract._ A governance skill's mechanical checker exposes `--json` (emit a JSON findings array to stdout) and `--report` (write the latest report as both `.ki-meta/audits/<concern>.md` and `.ki-meta/audits/<concern>.json` in the target, overwriting on each run). Exit code is non-zero iff any FAIL; WARN / POLISH / ADVISORY / INFO / SKIP / PASS all exit 0. Findings use the unified severity ladder defined in `ki-engineering`'s `enforcement-framework.md` §2. Verify by reading the checker's `emit()` / output path logic. (enforcement-framework.md §2/§5)
- **SHAPE-9 [M-heuristic + J]** _Mechanical work belongs in the checker, not in tokens._ A criterion a script can decide deterministically — no judgment, no AI benefit — is tagged **[M]** and **implemented in the checker**; a **[J]** tag is earned by the judgment a criterion genuinely needs, never by "no checker written yet". The reader's context is spent only on the **[J]** items, so a mechanical criterion left to prose, or a **[J]** the checker already decides, is drift — it **moves into the checker and flips to [M]**. The linter surfaces the mechanical heuristic — a rubric carrying **[M]** criteria but shipping no `scripts/` checker (nor a documented toolchain delegation, e.g. `ki-authoring` → `bun run ki:lint:md`) — as a WARN; the **[J]** gate is whether each remaining **[J]** genuinely needs a reader rather than a script. (ki-agentic-harness `docs/design.md`, enforcement-framework.md §3/§6)
- **SHAPE-10 [J]** _A skill must not assume personal `CLAUDE.md` content._ A Knowledge Islands skill is installed by any contributor, not only its author. It must not assume the user has any particular content in their personal `~/.claude/CLAUDE.md` (or imported topic files) — plan-mode gates, house style rules, footnote conventions, workflow preferences. Any behaviour a skill requires beyond what the open spec guarantees must be **anchored in always-loaded repo context** (`CLAUDE.md`, `AGENTS.md`, or a SHAPE-7-style companion hook) — not in the author's private config. Where a skill cross-checks a convention that _might_ live in personal config, it must degrade gracefully rather than silently rely on that content being present. (agent-skills-standard.md §11)

## INVOKE — Invocation protocol

→ applies to skills with named modes

- **INVOKE-1 [J]** _Mode-bearing skills prompt on bare invocation._ When a skill that exposes named modes (AUDIT / CONFORM / REFRESH and any skill-specific modes) is invoked without a recognisable mode and the surrounding context gives no clear signal, it **must** issue `AskUserQuestion` immediately — listing each available mode with a one-line description of what it does. If the chosen mode's `argument-hint` shows a `<target>` argument, the skill **must** prompt for that too before starting work. Rationale: narrows scope early; avoids spending context on the wrong mode or defaulting silently. The one-liner "Infer the mode from the request; ask if unclear" is insufficient — the explicit prompt is required. (COMMUNITY)

## PROC — Process / meta

→ [standard §12](agent-skills-standard.md#12-process--evaluation) · not checkable from files alone

- **PROC-1 [J]** Built evaluation-first — ≥ 3 evaluation scenarios against a no-skill baseline before extensive docs. (BP, ENG)
- **PROC-2 [J]** Tested across the models it will run on (Haiku/Sonnet/Opus) and with real usage. (BP)

## COLL — Cross-skill collision

→ [standard §13](agent-skills-standard.md#13-cross-skill-collision) · run the linter over the **whole set**, not one skill

- **COLL-1 [M]** _Shared triggers._ Within a set of ≥ 2 skills, no two `description`s declare the **same quoted trigger phrase** (WARN — a shared trigger signals scopes that overlap and need separating). (COMMUNITY, ki-agentic-harness README)
- **COLL-2 [J]** _Non-overlapping scope by design, with a reciprocal off-ramp where adjacency remains._ The first guard is **design**: skills are scoped so they don't compete for the same request, and each `description` is primarily **self-scoped** (what it does, and briefly what it doesn't). Where two skills are nonetheless genuinely adjacent, **each** description names the other as the off-ramp — the reciprocal pattern (`ki-mcp` ↔ `ki-skills`); a one-directional guard is a half-fix — and the full boundary is documented once in ki-agentic-harness `docs/design.md` ("where the skills do not overlap"). A COLL-1 hit means the scopes overlap and the **design** needs fixing first, before any off-ramp papers over it. (standard §13, ki-agentic-harness README)

## LONG — Longevity

→ [standard §14](agent-skills-standard.md#14-longevity) · matters most once a skill ships to a shared/cloud catalogue

- **LONG-1 [J]** _Volatile facts & a refresh path._ A skill hard-coding facts that drift (model IDs, versions, tool names, dated spec numbers, URLs) must either resolve them at runtime **or** carry a tracked source list with `last reviewed` dates **and** a REFRESH mode that re-anchors them and names what to re-fetch. (BP, COMMUNITY)
- **LONG-2 [J]** _A cadence, not just a capability._ A skill that ships a refresh path also **declares a cadence** in its `sources.md` `**Refresh:**` marker (`<class> · <cadence>`) and, where supported, registers a scheduled run; a refresh capability with no declared cadence is a half-measure. The cadence has runtime teeth in both directions: overdue → LONG-3 WARN; too-soon → the REFRESH mode's confirm-before-force gate (enforcement framework §5). (COMMUNITY)
- **LONG-3 [M]** _The cadence is actually being met._ Where a skill carries `references/sources.md`, its most recent `Last reviewed` date (read from that table column, so dates quoted in prose don't count) is within the skill's **declared per-skill cadence** plus grace; an overdue source list WARNs so AUDIT and the scheduled refresh routine surface it. A `canonical · on-change` skill carries no clock and is exempt — it refreshes when the model changes, not on a calendar. Never a FAIL — staleness is elapsed time, not a defect in the change under review. (COMMUNITY)
- **LONG-4 [M]** _The refresh marker is present and coherent._ Each `sources.md` carries a parseable `**Refresh:** <class> · <cadence>` line (§4 of the enforcement framework) — a missing or malformed marker WARNs (**4a**). An `external-spec` skill must declare a clock cadence, not `on-change` (**4b**, soft WARN). Class is **not** mechanically tied to `## Last review`-block presence — a `canonical` skill may keep a block as a hand-curated practice note (`ki-kb-streams` does), so block-presence stays a `[J]` read, not a checker rule. (COMMUNITY)
