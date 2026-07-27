<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Agent Skills

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-skills --write`.

Line-by-line criteria for auditing ki-skills. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [LAY — File existence & layout](#lay--file-existence--layout)
- [FM — Frontmatter document](#fm--frontmatter-document)
- [NAME — Frontmatter: name](#name--frontmatter-name)
- [DESC — Frontmatter: description](#desc--frontmatter-description)
- [OPT — Frontmatter: optional fields](#opt--frontmatter-optional-fields)
- [SIZE — Body: size & conciseness](#size--body-size--conciseness)
- [REF — Progressive disclosure & references](#ref--progressive-disclosure--references)
- [BODY — Body content quality](#body--body-content-quality)
- [SCRIPT — Scripts & executable code](#script--scripts--executable-code)
- [KI-CHECKER — Knowledge Islands rubric contract](#ki-checker--knowledge-islands-rubric-contract)
- [KI-LINK — Knowledge Islands linking & portability](#ki-link--knowledge-islands-linking--portability)
- [PORT — Runtime portability](#port--runtime-portability)
- [KI-SHAPE — Knowledge Islands skill shape](#ki-shape--knowledge-islands-skill-shape)
- [KI-INVOKE — Invocation protocol](#ki-invoke--invocation-protocol)
- [PROC — Process / meta](#proc--process--meta)
- [COLL — Cross-skill collision](#coll--cross-skill-collision)
- [LONG — Longevity](#long--longevity)

## LAY — File existence & layout

→ [standard](standards-agent-skills.md#2-layout)

Portable skill layout and supporting-file structure.

- **LAY-1 [M] — SKILL.md exists at the skill root** — `SKILL.md` exists at the skill root. (SPEC, CC)
- **LAY-2 [M] — the skill is a directory named after the skill** — The skill is a **directory** named after the skill, with `SKILL.md` inside — not a bare `.md`. (SPEC, CC)
- **LAY-3 [M] — optional directories use standard names** — Optional subdirs use the standard names `references/`, `scripts/`, `assets/`; KI-governed skills may additionally use `.ki-meta/` for their local generated state. (SPEC, KI)
- **LAY-4 [M] — file references use forward slashes** — File references use forward slashes, never backslashes. (BP)
- **LAY-5 [J] — reference chains are shallow** — Reference files are **one level deep** from `SKILL.md` — no nested chains (SKILL → a → b → c). (BP, SPEC)
  - _Review prompt:_ Are supporting files one level deep from SKILL.md, without nested reference chains?
- **LAY-6 [J] — supporting files are named by their content** — Supporting files are named by content (`form-validation-rules.md`, not `doc2.md`). (BP)
  - _Review prompt:_ Do supporting file names clearly describe their contents?

## FM — Frontmatter document

→ [standard](standards-agent-skills.md#3-frontmatter-document)

The YAML frontmatter document that identifies a skill.

- **FM-1 [M] — SKILL.md begins with a valid YAML frontmatter mapping** — `SKILL.md` begins with a fenced YAML frontmatter block that parses to a mapping. Without it, dependent frontmatter checks do not run. (SPEC, CC)

## NAME — Frontmatter: name

→ [standard](standards-agent-skills.md#4-frontmatter-name)

The portable skill name contract.

- **NAME-1 [M] — name is present** — `name` present (spec requires it; CC defaults to dir name — see ※1). (SPEC, CC)
- **NAME-2 [M] — name is no longer than 64 characters** — `name` ≤ 64 characters. (SPEC, BP)
- **NAME-3 [M] — name uses lowercase letters, digits, and hyphens only** — `name` is lowercase letters, digits, hyphens only. (SPEC, BP)
- **NAME-4 [M] — name has no leading or trailing hyphen and no consecutive hyphens** — `name` has no leading/trailing hyphen and no consecutive hyphens. (SPEC)
- **NAME-5 [M] — name matches the parent directory name exactly** — `name` matches the parent directory name exactly. The committed repository-local source is `.agents/skills/ki-self/`, whose required name is `ki-self`. (SPEC)
- **NAME-6 [M] — name contains no XML tags or reserved words** — `name` contains no XML tags and no reserved words (`anthropic`, `claude`). (BP)
- **NAME-7 [J] — name is specific rather than generic** — `name` is specific, not generic (avoid `helper`, `utils`, `tools`, `data`). (BP)
  - _Review prompt:_ Is this name concrete and appropriately scoped for the capability it governs?

## DESC — Frontmatter: description

→ [standard](standards-agent-skills.md#5-frontmatter-description)

The portable skill description contract.

- **DESC-1 [M] — description is present and non-empty** — `description` present and non-empty. (SPEC, CC)
- **DESC-2 [M] — description is no longer than 1024 characters** — `description` ≤ 1024 characters (spec hard cap — see ※2). (SPEC, BP)
- **DESC-3 [M] — description contains no XML tags** — `description` contains no XML tags (placeholders inside backticks are fine). (BP)
- **DESC-4 [J] — description states what the skill does and when to use it** — States **both** what it does **and** when to use it. (SPEC, BP)
  - _Review prompt:_ Does the description state both what this skill does and when it should be used?
- **DESC-5 [J] — description is written in the third person** — Written in the **third person**, never first/second person. (BP, COMMUNITY)
  - _Review prompt:_ Is the description consistently written in the third person?
- **DESC-6 [J] — description includes concrete trigger phrases** — Includes concrete **trigger keywords/phrases** a user would say. (SPEC, BP, CC)
  - _Review prompt:_ Does the description include concrete trigger phrases a user would say?
- **DESC-7 [J] — description leans toward firing and front-loads its main trigger** — Leans toward firing, and front-loads the most important trigger. (ENG, COMMUNITY, CC)
  - _Review prompt:_ Does the description lean toward appropriate selection and front-load its most important trigger?
- **DESC-8 [J] — description avoids vague phrasing** — Avoids vague phrasing ("helps with documents"). (SPEC, BP)
  - _Review prompt:_ Does the description avoid vague phrases such as "helps with documents"?
- **DESC-9 [J] — description may state explicit non-triggers where collision is likely** — _(Advanced)_ Where collision is likely, may end with explicit non-triggers. (COMMUNITY)
  - _Review prompt:_ Where skill-selection collision is likely, would explicit non-triggers improve routing?

## OPT — Frontmatter: optional fields

→ [standard](standards-agent-skills.md#6-frontmatter-optional-fields)

Optional portable and runtime-specific frontmatter fields.

- **OPT-1 [M] — compatibility is between 1 and 500 characters when present** — `compatibility`, if present, is 1–500 chars. (SPEC)
- **OPT-2 [M] — metadata is a string-to-string map when present** — `metadata`, if present, is a string→string map. (SPEC)
- **OPT-3 [M] — tool declarations use valid tool specifications** — `allowed-tools` / `disallowed-tools`, if present, are valid tool specs (`allowed-tools` is **experimental**). (SPEC, CC)
- **OPT-4 [M] — license declarations are non-empty YAML string scalars** — `license`, if present, is a non-empty YAML string scalar. Prefer a short name or bundled-file reference. (SPEC)
- **OPT-5 [J] — runtime-specific fields are flagged where portability matters** — CC-only fields are flagged when cross-platform portability matters (see ※3). (CC)
  - _Review prompt:_ Where cross-platform portability matters, are runtime-specific fields clearly identified?
- **OPT-6 [J] — manually timed side effects disable model invocation** — Side-effecting / manually-timed workflows set `disable-model-invocation: true` (contrast `user-invocable: false`). (CC)
  - _Review prompt:_ Do side-effecting or manually timed workflows set disable-model-invocation: true where appropriate?
- **OPT-7 [J] — discrete modes have an ordered argument hint** — A skill with discrete modes sets `argument-hint`; modes are **named** (not lettered) and **alphabetically ordered**. (CC, COMMUNITY)
  - _Review prompt:_ Where the skill has discrete modes, are they named and alphabetically ordered in argument-hint?

## SIZE — Body: size & conciseness

→ [standard](standards-agent-skills.md#7-size--conciseness)

The progressive-disclosure budget for a skill body.

- **SIZE-1 [M] — body is under 500 lines** — `SKILL.md` body is under **500 lines**. (SPEC, BP, CC)
- **SIZE-2 [M] — body stays below approximately 5,000 tokens** — Body instructions stay under **~5,000 tokens**. (SPEC)
- **SIZE-3 [J] — body omits knowledge the agent already has** — No token spent on what a competent agent already knows. (BP)
  - _Review prompt:_ Does the body avoid spending tokens on knowledge a competent agent already has?
- **SIZE-4 [J] — body is an overview that routes to detail** — `SKILL.md` reads as an **overview that routes to detail**, not all detail inlined. (BP, SPEC, CC)
  - _Review prompt:_ Does the body work as an overview that routes rarely used detail into supporting files?

## REF — Progressive disclosure & references

→ [standard](standards-agent-skills.md#8-progressive-disclosure)

How a skill routes supporting detail into references.

- **REF-1 [J] — rarely used detail is separated into on-demand files** — Detailed/rarely-used material is in on-demand files; mutually-exclusive domains are split. (BP, ENG, SPEC)
  - _Review prompt:_ Is detailed or rarely used material routed to on-demand files, with mutually exclusive domains split?
- **REF-2 [J] — supporting files are referenced from SKILL.md with a loading cue** — Every supporting file is referenced from `SKILL.md` with when-to-load — no orphans. (BP, CC, SPEC)
  - _Review prompt:_ Is every supporting file referenced from SKILL.md with clear guidance on when to load it?
- **REF-3 [M] — long reference files open with a table of contents** — Reference files > 100 lines open with a table of contents. (BP, COMMUNITY)
- **REF-4 [J] — script execution intent is explicit** — Execution intent is explicit per script (run vs read). (BP, ENG)
  - _Review prompt:_ Is the execution intent for each script explicit: run it or read it?
- **REF-5 [J] — many-moded skills route independently invoked procedures** — _Mode-router for many-moded skills._ A skill whose body is dominated by **independently-invoked** modes keeps the shared model + a dispatch table in `SKILL.md` and moves each mode's procedure to its own flat `references/mode-<name>.md`; combined mode files such as `mode-audit-conform.md` are split, and each procedure states its own preconditions. Behaviour anchors and the shared model stay in the body. Not required when modes are few, short, or call-chained. (BP, SPEC §8)
  - _Review prompt:_ Where this skill has many independently invoked modes, does SKILL.md retain the shared model and dispatch while flat mode files hold their procedures?

## BODY — Body content quality

→ [standard](standards-agent-skills.md#9-body-content-quality)

The quality and usability of the skill instructions.

- **BODY-1 [J] — instruction freedom matches task fragility** — Degrees of freedom match task fragility (prose → parameterised script → exact "do not modify"). (BP, COMMUNITY)
  - _Review prompt:_ Does the level of instruction freedom match this task’s fragility?
- **BODY-2 [J] — the main body avoids time-sensitive content** — No time-sensitive content in the main body; legacy goes in a collapsed note. (BP)
  - _Review prompt:_ Does the main body avoid time-sensitive content, containing legacy detail appropriately?
- **BODY-3 [J] — terminology is consistent** — Consistent terminology — one term per concept. (BP, COMMUNITY)
  - _Review prompt:_ Does the skill use one consistent term for each concept?
- **BODY-4 [J] — style-sensitive output includes concrete examples** — Concrete examples (2–3 I/O pairs) where output quality depends on style. (BP, COMMUNITY)
  - _Review prompt:_ Where output quality depends on style, are there concrete input and output examples?
- **BODY-5 [J] — one default approach has an escape hatch** — One default approach with an escape hatch, not a menu. (BP)
  - _Review prompt:_ Does the skill give one default approach with a clear escape hatch rather than a menu?
- **BODY-6 [J] — template strictness matches its contract** — Template strictness matches the contract (exact vs adapt). (BP, COMMUNITY)
  - _Review prompt:_ Does any template make its strictness appropriate and explicit?
- **BODY-7 [J] — multi-step work has a copyable checklist and feedback loop where needed** — Copyable checklist for multi-step tasks; feedback loop for quality-critical ones. (BP, COMMUNITY)
  - _Review prompt:_ Does multi-step work provide a copyable checklist and, when quality-critical, a feedback loop?
- **BODY-8 [J] — rules state their rationale** — Rules state the _why_ alongside the rule, not bare MUST/NEVER. (COMMUNITY)
  - _Review prompt:_ Do rules explain their rationale rather than stating bare MUST or NEVER directives?

## SCRIPT — Scripts & executable code

→ [standard](standards-agent-skills.md#10-scripts)

The quality and autonomy of executable skill support.

- **SCRIPT-1 [J] — scripts handle expected errors** — Scripts handle expected errors (missing file, permissions) rather than punt to the agent. (BP)
  - _Review prompt:_ Do scripts handle expected errors rather than punting them to an agent?
- **SCRIPT-2 [J] — scripts explain configuration values** — No unexplained magic numbers — every config value is justified. (BP)
  - _Review prompt:_ Are configuration values justified rather than unexplained magic numbers?
- **SCRIPT-3 [J] — runtime dependencies and MCP tools are explicit** — Required packages are listed/verified for the runtime; MCP tools use fully-qualified `ServerName:tool_name`. (BP)
  - _Review prompt:_ Are runtime dependencies verified and MCP tools fully qualified?
- **SCRIPT-4 [J] — deterministic reusable logic is pre-written** — Deterministic, frequently-reused logic is pre-written, not regenerated each run. (BP)
  - _Review prompt:_ Is deterministic, frequently reused logic pre-written rather than regenerated each run?
- **SCRIPT-5 [J] — validation errors are actionable** — Validation scripts are verbose — errors name the problem and the valid options. (BP)
  - _Review prompt:_ Do validation errors name the problem and valid options?
- **SCRIPT-6 [J] — batch and destructive work is planned and validated first** — Plan-validate-execute for batch/destructive ops. (BP, COMMUNITY)
  - _Review prompt:_ Do batch or destructive operations plan and validate before execution?
- **SCRIPT-7 [J] — target-repository scripts are copied** — Scripts installed into a target repo's `scripts/` directory are **copies**, not symlinks or out-of-repo references — the target repo must be autonomous. (BP)
  - _Review prompt:_ Are target-repository scripts copied rather than symlinked or referenced outside the repository?
- **SCRIPT-8 [M-heuristic + J] — top-level scripts are necessary public commands** — Every supported non-test script directly under `scripts/` is a necessary public command whose capability sits outside governed rubric execution. It exits successfully for `-h` and `--help`, prints useful usage, handles expected errors, and has focused tests. Private implementation belongs under `scripts/internal/`; published or materialised compile-time modules belong under `scripts/shared/`; rubric behaviour belongs under `scripts/rubric/`; generic execution belongs to `ki`. (AS, KI)
  - _Review prompt:_ Is each top-level script still a necessary, tested public command at the correct ownership boundary, with useful help and expected-error handling?

## KI-CHECKER — Knowledge Islands rubric contract

→ [standard](standards-rubric-authoring.md)

Knowledge Islands catalogue, session, and packaging responsibilities.

- **KI-CHECKER-1 [J] — rubric sessions scope subjects beneath the repository root** — `ki repo audit` and `ki repo conform` pass the repository root to `createSession`. The skill discovers only its governed subjects beneath that root and represents an absent scope explicitly with `NOT_APPLICABLE`; it does not reinterpret the root as its content directory, scan unrelated files, or claim a vacuous pass. (standards-rubric-authoring.md#context-and-evidence, standards-rubric-authoring.md#host-and-session-boundary)
  - _Review prompt:_ Does the rubric session discover only its governed subjects and represent an absent scope explicitly?
- **KI-CHECKER-2 [M] — skill implementation imports remain inside its own payload** — A skill's `scripts/**/*.ts` files contain no static `from`, dynamic `import()`, or CommonJS `require()` relative import that resolves outside its own `scripts/` directory. A portable rubric dependency is copied into `scripts/shared/rubric.ts`, so every rubric item and context remains typecheckable inside the skill root. (KI)
- **KI-CHECKER-3 [M] — ki-skills publishes the portable rubric contract** — `ki-skills` publishes the sole portable shared dependency, `scripts/shared/rubric.ts`, declared as `ki-shared-modules: [rubric]`. It provides catalogue authoring types for independently installed skills; `ki` owns execution, reporting, and transaction handling. The provider never declares a dependency on itself. (ADR-KI-HARNESS-SKILLS-012)
- **KI-CHECKER-4 [M] — structured rubric items follow the uniform family layout** — `scripts/rubric/items/index.ts` is catalogue wiring only. Each family is imported from one semantic family module, which exports only that complete ordered `RubricFamily`; item constants and helpers remain private. Rule definitions and execution callbacks do not live in the catalogue index. (standards-rubric-authoring.md#rubric-families-and-items)
- **KI-CHECKER-5 [M] — shared and internal script packaging is explicit** — Private implementation belongs under `scripts/internal/`; cross-skill modules belong under `scripts/shared/`, whose non-test entries must exactly match the modules published through `ki-shared-modules:` or materialised through `ki-shared-dependencies:`. (KI)

## KI-LINK — Knowledge Islands linking & portability

→ [standard](standards-knowledge-islands.md#1-linking-and-portability)

Knowledge Islands link and toolchain portability.

- **KI-LINK-1 [M] — internal links use standard relative Markdown links** — Internal links are **standard relative markdown links**, not wikilinks. (ki-agentic-harness README)
- **KI-LINK-2 [M] — relative link targets resolve** — Links resolve — every relative target exists (angle-bracket form for paths with spaces). (ki-agentic-harness README)
- **KI-LINK-3 [J] — other skills are referred to by name** — Other skills are referenced by `name`, never by file path. (ki-agentic-harness README)
  - _Review prompt:_ Are other skills referred to by their public name rather than by a file path?
- **KI-LINK-4 [J] — the house toolchain passes** — The house toolchain passes: Biome (TS/JSON), Prettier + markdownlint-cli2 (markdown). (ki-agentic-harness README)
  - _Review prompt:_ Does the repository pass its configured Biome, Prettier, and markdownlint toolchain?

## PORT — Runtime portability

→ [standard](standards-knowledge-islands.md#4-runtime-portability)

Portable contracts make runtime-specific boundaries explicit.

- **PORT-1 [M] — portable contracts make runtime assumptions explicit** — Portable guidance has no unqualified vendor, runtime, or runtime-home reference. Declare a dedicated runtime-binding skill, use a `Runtime binding` section, attribute source material, or compare multiple runtimes explicitly. (KI)

## KI-SHAPE — Knowledge Islands skill shape

→ [standard](standards-knowledge-islands.md#2-skill-shape)

The common shape of a Knowledge Islands governance skill.

- **KI-SHAPE-1 [J] — standard skills resolve base bindings at runtime** — A **standard** KI skill resolves base bindings at runtime and hard-codes **no single base**. (ki-agentic-harness README, `ki-kb`)
  - _Review prompt:_ Does this standard skill resolve base bindings at runtime without hard-coding one base?
- **KI-SHAPE-2 [M-heuristic + J] — skills compose rather than extend** — **Composition is the only inter-skill relationship — the base-coupled extension pattern is retired.** A skill builds on another by running the sibling's checker/mode **in sequence** and adding its delta (never importing it), and **declares the edge** — naming the sibling and the run order in its AUDIT mode. What a base needs differently is **declared, not forked**: data in the repo's own `.ki-config` table (read validate-down), prose in its `CLAUDE.md` — never a `<base>-kb`-style skill that takes the shared modes by name. _Delegation between two standards (kb → streams) is composition at sub-scope._ The linter flags **endorsement of the retired pattern** (telling a base to ship/"prefer" an extension skill, or that a skill "delegates the modes back" / "extends this one") as a mechanical heuristic; the **[J]** gate is that no skill in the set models a relationship as a base-coupled extension. (ki-agentic-harness README, `ki-engineering`)
  - _Review prompt:_ Does every inter-skill relationship use declared composition rather than base-coupled extension?
- **KI-SHAPE-3 [J] — the skill declares its kind** — The skill declares its **kind** — **governance** or **process** — clearly (ADR-KI-HARNESS-SKILLS-006). A **governance skill** holds a house standard and exposes the universal modes (KI-SHAPE-5). A **process skill** drives an action or lifecycle rather than holding a standard: it is lightweight, may bundle a helper `scripts/` and a `references/` procedure, and is exempt from universal governance modes — its mode count follows its own lifecycle and it exposes HELP only optionally. Both kinds use the closed Knowledge Islands reference vocabulary (KI-SHAPE-6) and are dual-invocable (`/<name>` and model-triggered). (ki-agentic-harness README, ADR-KI-HARNESS-SKILLS-006)
  - _Review prompt:_ Does the skill correctly and clearly declare its governance or process kind?
- **KI-SHAPE-4 [J] — a skill validates only its own configuration table** — A skill that reads the shared `.ki-config.toml` consumes and **validates only its own `[<skill>]` table** — warns on a key it doesn't recognise, advises dropping one that merely restates a default — and never inspects another skill's table. Validate down, ignore across. (contract defined by `ki-repo`)
  - _Review prompt:_ Does this skill validate only its own configuration table and ignore unrelated tables?
- **KI-SHAPE-5 [J] — governance skills expose universal modes** — A **governance skill** (one that holds a standard) exposes the universal modes **AUDIT** + **CONFORM** + **EDUCATE** + **REFRESH**. AUDIT and CONFORM run through the skill's hosted rubric; EDUCATE teaches or creates the governed artifact from that standard; REFRESH re-anchors the standard to its sources. Further modes (`OPTIMISE` to push a compliant artifact from the floor toward excellent, and operational modes like kb's note-ops) are skill-specific. Modes are named, not lettered, and ordered alphabetically in the body and `argument-hint`. (ki-agentic-harness README)
  - _Review prompt:_ Does this governance skill expose the universal modes with appropriate additional modes only?
- **KI-SHAPE-6 [M + J] — Knowledge Islands skills use the closed reference vocabulary** — _Closed reference vocabulary — Knowledge Islands skills only._ Every top-level Markdown reference is `standards-<topic>.md`, generated `rubric.md`, `sources.md`, optional `exemplars.md`, or one-mode-only `mode-<verb>.md`; a skill includes only the classes it needs. Normative formats, process doctrine, and shared mode contracts are standards. Combined mode names, bare `standards.md`, `<topic>-standards.md`, nested references, and ad hoc guide, format, or contract filenames are retired. Templates and reusable output material live in `assets/`. A skill tracking a moving external spec keeps a current-state `## Last review` block in `sources.md`. Skills outside the Knowledge Islands set are exempt. (ki-agentic-harness README)
  - _Review prompt:_ Does each retained reference class serve a distinct reader need, with templates and executable helpers elsewhere?
- **KI-SHAPE-7 [M-heuristic + J] — behaviour-changing skills define and check their anchor** — _A behaviour-changing skill defines its gate — and checks the anchor._ A skill that changes a **default behaviour** — installs a gate, a standing "always do X before Y" rule, or a routing intercept — cannot rely on its own `description` to fire it, because skills load **on demand** and the triggering request often won't mention the skill (e.g. "edit this note" never says "proposal"). Such a skill must **anchor the behaviour in always-loaded context** (the base/repo `CLAUDE.md` / `AGENTS.md`, or a companion skill that _does_ reliably load handing off to it), **and its rubric must verify the anchor is present** so it can't be silently lost. The hosted audit surfaces candidates mechanically (strong gate phrasing in the body or a reference file — body + references scanned as one unit, since mode-routing lifts procedures out of the body — without an anchor its rubric reads); the **[J]** call is whether the skill genuinely changes a default and so _needs_ a gate. Realised as `ki-kb-streams`' **GATE-1** (the Enactment gate) and `ki-kb`'s **MEM-2** (the memory cascade); `ki-repo`'s `.ki-config.toml` marker is the same pattern (anchor + checked). (standards-knowledge-islands.md §2, standards-rubric-authoring.md#context-and-evidence)
  - _Review prompt:_ Does a behaviour-changing skill have an appropriate always-loaded anchor that its rubric verifies?
- **KI-SHAPE-9 [M-heuristic + J] — mechanical work belongs in the structured rubric** — _Mechanical work belongs in the structured rubric, not in tokens._ A criterion a script can decide deterministically — no judgment, no AI benefit — is tagged **[M]** and implemented in `scripts/rubric/items/`; a **[J]** tag is earned by the judgment a criterion genuinely needs, never by "no implementation written yet". The reader's context is spent only on the **[J]** items, so a mechanical criterion left to prose, or a **[J]** the rubric already decides, is drift — it **moves into the structured rubric and flips to [M]**. The linter surfaces the mechanical heuristic — a rubric carrying **[M]** criteria but shipping no structured rubric (nor a documented toolchain delegation to a skill-scoped audit) — as a WARN; the **[J]** gate is whether each remaining **[J]** genuinely needs a reader rather than a script. ([Rubric authoring](standards-rubric-authoring.md))
  - _Review prompt:_ Do remaining judgment criteria genuinely require review rather than deterministic checking?
- **KI-SHAPE-10 [J] — skills do not assume private user configuration** — _A skill must not assume personal runtime configuration._ A Knowledge Islands skill is installed by any contributor, not only its author. It must not assume the user has any particular private configuration or imported topic files — plan-mode gates, house style rules, footnote conventions, workflow preferences. Any behaviour a skill requires beyond what the open spec guarantees must be **anchored in always-loaded repo context** (`CLAUDE.md`, `AGENTS.md`, or a KI-SHAPE-7-style companion hook) — not in the author's private config. Where a skill cross-checks a convention that _might_ live in personal config, it must degrade gracefully rather than silently rely on that content being present. (standards-knowledge-islands.md §2)
  - _Review prompt:_ Does the skill avoid assuming private personal configuration?
- **KI-SHAPE-11 [M] — governance skills expose HELP** — _Exposes the universal HELP mode._ Every governance skill's `argument-hint` lists a `help` verb, so the no-mode default and the `help` / `-h` / `?` pure-explain form are discoverable (ADR-KI-HARNESS-SKILLS-001). A skill derives its help from its own frontmatter and operating-mode prose; it carries no generated wrapper or separate HELP payload. The linter verifies the `help` token; the prose HELP semantics are KI-INVOKE-1 **[J]**. (ADR-KI-HARNESS-SKILLS-001)
- **KI-SHAPE-12 [M] — governance mode vocabulary is canonical and complete** — _Mode vocabulary is canonical and complete._ A governance skill exposes **AUDIT**, **CONFORM**, **EDUCATE**, **REFRESH** and **HELP** spelled exactly so — a governance skill missing any universal verb from its `argument-hint` (EDUCATE is the common gap) **WARNs**; `NEW`, `OPTIMISE`, and operational verbs are additive, never substitutes for a universal mode (a collection skill exposes both EDUCATE and NEW). The current source-entrypoint migration invariant is validated by KI-SHAPE-15; direct delivery resolves registered operations from the verified collection. Process skills are exempt throughout. (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006, ADR-KI-HARNESS-007)
- **KI-SHAPE-13 [M] — mode headings have a canonical structure** — _Mode-heading structure._ A governance skill presents its modes under a **single `## Operating modes` H2** (the home for the shared no-mode/HELP intro), with each mode as a **`### Mode <NAME>` H3** or — for router skills with many operational verbs — a **`| Mode | … |` dispatch table** inside that section. The linter WARNs on a flat `## Mode X` H2, a bare `### X` heading missing the `Mode` prefix, and any `argument-hint` verb absent from the Operating-modes body (hint ⊆ body). Process skills are exempt. (ADR-KI-HARNESS-SKILLS-001)
- **KI-SHAPE-14 [M] — REFRESH states its ownership precondition** — _REFRESH states its ownership precondition._ REFRESH's write target is normally the skill's own canonical files under `skills/<name>/` in `ki-agentic-harness` — a governance skill's `### Mode REFRESH` section (or, per REF-5, its `references/mode-refresh.md`) must name `ki-agentic-harness` as the only place it writes, and instruct the agent to stop and redirect when invoked from an installed copy (to the harness, or — for a pattern recurring across bases — to `ki-kb`'s IMPROVE mode). The one committed repository-local source at `.agents/skills/ki-self/` instead names that local source and stops to promote reusable rules to their shared owner. Missing either half **WARNs**. Process skills (KI-SHAPE-3) are exempt; a skill with no REFRESH section at all is already caught by KI-SHAPE-12. (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006)
- **KI-SHAPE-15 [M] — governance skills expose no legacy runner entrypoints** — _Direct governance operation shape._ A governance skill exposes its rubric catalogue from `scripts/rubric/items/index.ts`; `ki` resolves and hosts that catalogue from the verified installed harness. `scripts/govern.ts`, `scripts/educate.ts`, `scripts/audit.ts`, and `scripts/conform.ts` are retired, with no compatibility runner or fallback. REFRESH is harness-only. Process skills and the committed repository-local `.agents/skills/ki-self/` source are exempt. (standards-knowledge-islands.md §2, ADR-KI-HARNESS-007)
- **KI-SHAPE-16 [M-heuristic + J] — target files have declared ownership** — _Declared file ownership, three tiers._ A skill whose rubric reads or changes a house-standard file in the **target repository's** working tree declares that relationship in frontmatter, alongside `ki-depends-on:`, under one of three keys: `requires:` (must exist, doesn't create/control it — any number of skills may share a `requires:` filename), `contributes:` (writes/expects only its own section of a shared file — any number of skills may share a `contributes:` filename, e.g. `.ki-config.toml`, `package.json`), or `owns:` (sole author of the whole file — **exclusive**, at most one skill per filename). The mechanical heuristic verifies that declared filenames occur in the skill's production implementation and that no filename is owned by more than one skill. Judgment confirms that every session proposal and governed read has the appropriate declaration. (KI)
  - _Review prompt:_ Do all governed target-file reads and session proposals carry the appropriate ownership declaration?
- **KI-SHAPE-17 [M] — dependencies are declared explicitly** — _Explicit dependency declaration._ Every skill declares `ki-depends-on:` as a single-line flow list. `ki-depends-on: []` is the required explicit form when a skill has no governance dependencies. The listed capability names and a governed repository's matching `.ki-config.toml` tables are validated by the dependency graph and bootstrap; the skill checker enforces the local declaration shape. (ADR-KI-HARNESS-SKILLS-006)

## KI-INVOKE — Invocation protocol

→ [standard](../../../../docs/decisions/ADR-KI-HARNESS-SKILLS-001-audit-conform-educate-refresh-canonical-modes-help.md)

Safe invocation for a skill with named modes.

- **KI-INVOKE-1 [J] — HELP is the safe bare-invocation default** — _HELP is the bare-invocation default; explicit `help` is pure explain._ Every mode-bearing skill exposes the universal **HELP** mode (ADR-KI-HARNESS-SKILLS-001). Invoked as `help` / `-h` / `?`, the skill **must** emit the generated HELP block (name, one-line purpose, invocation, mode list, off-ramps) and **stop** — no prompt, no action (the headless-safe form). Invoked with **no recognisable mode** and no clear context signal, it **must** emit the same HELP explanation, then — only in an interactive session — issue `AskUserQuestion` listing each mode with a one-line description, prompting for any `<target>` the chosen mode's `argument-hint` shows before starting work. Rationale: the caller learns what the skill _is_ before being asked which mode to run, and a cold/headless caller gets the explanation without a dead prompt. The one-liner "Infer the mode from the request; ask if unclear" is insufficient. (COMMUNITY, ADR-KI-HARNESS-SKILLS-001)
  - _Review prompt:_ Does explicit help stop after a generated HELP explanation, while an unclear interactive invocation explains the skill before asking for a mode?

## PROC — Process / meta

→ [standard](standards-agent-skills.md#11-process--evaluation)

Evaluation and real-usage evidence for the skill.

- **PROC-1 [J] — the skill was built evaluation-first** — Built evaluation-first — ≥ 3 evaluation scenarios against a no-skill baseline before extensive docs. (BP, ENG)
  - _Review prompt:_ Was this skill built evaluation-first with meaningful scenarios against a no-skill baseline?
- **PROC-2 [J] — the skill has been tested across intended models and real use** — Tested across the models it will run on (Haiku/Sonnet/Opus) and with real usage. (BP)
  - _Review prompt:_ Has the skill been tested across its intended models and through real usage?

## COLL — Cross-skill collision

→ [standard](standards-knowledge-islands.md#3-cross-skill-collision)

Selection boundaries across a set of skills.

- **COLL-1 [M] — quoted trigger phrases are not shared across skills** — _Shared triggers._ Within a set of ≥ 2 skills, no two `description`s declare the **same quoted trigger phrase** (WARN — a shared trigger signals scopes that overlap and need separating). (COMMUNITY, ki-agentic-harness README)
- **COLL-2 [J] — adjacent skills have non-overlapping scope and reciprocal off-ramps** — _Non-overlapping scope by design, with a reciprocal off-ramp where adjacency remains._ The first guard is **design**: skills are scoped so they don't compete for the same request, and each `description` is primarily **self-scoped** (what it does, and briefly what it doesn't). Where two skills are nonetheless genuinely adjacent, **each** description names the other as the off-ramp — the reciprocal pattern (`ki-mcp` ↔ `ki-skills`); a one-directional guard is a half-fix. A COLL-1 hit means the scopes overlap and the **design** needs fixing first, before any off-ramp papers over it. (standard §15, ki-agentic-harness README)
  - _Review prompt:_ Do adjacent skills have non-overlapping scopes and reciprocal off-ramps where their requests are genuinely adjacent?

## LONG — Longevity

→ [standard](standards-agent-skills.md#12-longevity)

Refresh paths and cadence for knowledge that changes over time.

- **LONG-1 [J] — volatile facts have a refresh path** — _Volatile facts & a refresh path._ A skill hard-coding facts that drift (model IDs, versions, tool names, dated spec numbers, URLs) must either resolve them at runtime **or** carry a tracked source list with `last reviewed` dates **and** a REFRESH mode that re-anchors them and names what to re-fetch. (BP, COMMUNITY)
  - _Review prompt:_ Do volatile facts resolve at runtime or have a tracked source list and refresh path?
- **LONG-2 [J] — the refresh path has a cadence** — _A cadence, not just a capability._ A skill that ships a refresh path also **declares a cadence** in its `sources.md` `**Refresh:**` marker (`<class> · <cadence>`) and, where supported, registers a scheduled run; a refresh capability with no declared cadence is a half-measure. The cadence has runtime teeth in both directions: overdue → LONG-3 WARN; too-soon → the REFRESH mode's confirm-before-force gate (enforcement framework §5). (COMMUNITY)
  - _Review prompt:_ Does the refresh path have an appropriate declared cadence and scheduled execution where supported?
- **LONG-3 [M] — the declared refresh cadence is being met** — _The cadence is actually being met._ Where a skill carries `references/sources.md`, its most recent `Last reviewed` date (read from that table column, so dates quoted in prose don't count) is within the skill's **declared per-skill cadence** plus grace; an overdue source list WARNs so AUDIT and the scheduled refresh routine surface it. A `canonical · on-change` skill carries no clock and is exempt — it refreshes when the model changes, not on a calendar. Never a FAIL — staleness is elapsed time, not a defect in the change under review. (COMMUNITY)
- **LONG-4 [M] — the refresh marker is present and coherent** — _The refresh marker is present and coherent._ Each `sources.md` carries a parseable `**Refresh:** <class> · <cadence>` line (§4 of the enforcement framework) — a missing or malformed marker WARNs (**4a**). An `external-spec` skill must declare a clock cadence, not `on-change` (**4b**, soft WARN). Class is **not** mechanically tied to `## Last review`-block presence — a `canonical` skill may keep a block as a hand-curated practice note (`ki-kb-streams` does), so block-presence stays a `[J]` read, not a checker rule. (COMMUNITY)
