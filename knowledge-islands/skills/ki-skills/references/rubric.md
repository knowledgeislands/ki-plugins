<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric â Agent Skills

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-skills --write`.

Line-by-line criteria for auditing ki-skills. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [LAY â File existence & layout](#lay--file-existence--layout)
- [FM â Frontmatter document](#fm--frontmatter-document)
- [NAME â Frontmatter: name](#name--frontmatter-name)
- [DESC â Frontmatter: description](#desc--frontmatter-description)
- [OPT â Frontmatter: optional fields](#opt--frontmatter-optional-fields)
- [SIZE â Body: size & conciseness](#size--body-size--conciseness)
- [REF â Progressive disclosure & references](#ref--progressive-disclosure--references)
- [BODY â Body content quality](#body--body-content-quality)
- [SCRIPT â Scripts & executable code](#script--scripts--executable-code)
- [KI-CHECKER â Knowledge Islands rubric contract](#ki-checker--knowledge-islands-rubric-contract)
- [RUBRIC â Generated rubric publication](#rubric--generated-rubric-publication)
- [KI-LINK â Knowledge Islands linking & portability](#ki-link--knowledge-islands-linking--portability)
- [PORT â Runtime portability](#port--runtime-portability)
- [KI-SHAPE â Knowledge Islands skill shape](#ki-shape--knowledge-islands-skill-shape)
- [KI-INVOKE â Invocation protocol](#ki-invoke--invocation-protocol)
- [PROC â Process / meta](#proc--process--meta)
- [COLL â Cross-skill collision](#coll--cross-skill-collision)
- [LONG â Longevity](#long--longevity)

## LAY â File existence & layout

â [standard](standards-agent-skills.md#2-layout)

Portable skill layout and supporting-file structure.

- **LAY-1 [M] â SKILL.md exists at the skill root** â `SKILL.md` exists at the skill root. (SPEC, CC)
  - _Remediation:_ diagnostic â Create the missing SKILL.md only after establishing the intended skill identity and authored instructions for that root.
- **LAY-2 [M] â the skill is a directory named after the skill** â The skill is a **directory** named after the skill, with `SKILL.md` inside — not a bare `.md`. (SPEC, CC)
  - _Remediation:_ diagnostic â Choose the intended skill name, create its directory, and move or rewrite the standalone Markdown as that directory’s SKILL.md.
- **LAY-3 [M] â optional directories use standard names** â Optional subdirs use the standard names `references/`, `scripts/`, `assets/`; KI-governed skills may additionally use `.ki-meta/` for their local generated state. (SPEC, KI)
  - _Remediation:_ diagnostic â Classify each nonstandard support directory by purpose, then rename or relocate it to references/, scripts/, assets/, or .ki-meta/ and repair affected links.
- **LAY-4 [M] â file references use forward slashes** â File references use forward slashes, never backslashes. (BP)
  - _Remediation:_ automatic
- **LAY-5 [J] â reference chains are shallow** â Reference files are **one level deep** from `SKILL.md` — no nested chains (SKILL → a → b → c). (BP, SPEC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are supporting files one level deep from SKILL.md, without nested reference chains?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **LAY-6 [J] â supporting files are named by their content** â Supporting files are named by content (`form-validation-rules.md`, not `doc2.md`). (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do supporting file names clearly describe their contents?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## FM â Frontmatter document

â [standard](standards-agent-skills.md#3-frontmatter-document)

The YAML frontmatter document that identifies a skill.

- **FM-1 [M] â SKILL.md begins with a valid YAML frontmatter mapping** â `SKILL.md` begins with a fenced YAML frontmatter block that parses to a mapping. Without it, dependent frontmatter checks do not run. (SPEC, CC)
  - _Remediation:_ diagnostic â Create or repair the opening YAML mapping without inventing the skill identity or discarding authored frontmatter values.

## NAME â Frontmatter: name

â [standard](standards-agent-skills.md#4-frontmatter-name)

The portable skill name contract.

- **NAME-1 [M] â name is present** â `name` present (spec requires it; CC defaults to dir name — see ※1). (SPEC, CC)
  - _Remediation:_ automatic
- **NAME-2 [M] â name is no longer than 64 characters** â `name` ≤ 64 characters. (SPEC, BP)
  - _Remediation:_ diagnostic â Choose a shorter canonical name that preserves the capability’s meaning, then coordinate its frontmatter, directory, dependencies, and references.
- **NAME-3 [M] â name uses lowercase letters, digits, and hyphens only** â `name` is lowercase letters, digits, hyphens only. (SPEC, BP)
  - _Remediation:_ diagnostic â Choose the intended lowercase hyphenated name rather than mechanically transliterating identity, then coordinate every name-bearing path and reference.
- **NAME-4 [M] â name has no leading or trailing hyphen and no consecutive hyphens** â `name` has no leading/trailing hyphen and no consecutive hyphens. (SPEC)
  - _Remediation:_ diagnostic â Choose a canonical name without edge or consecutive hyphens, then coordinate the frontmatter, directory, dependencies, and references.
- **NAME-5 [M] â name matches the parent directory name exactly** â `name` matches the parent directory name exactly. The committed repository-local source is `.agents/skills/ki-self/`, whose required name is `ki-self`. (SPEC)
  - _Remediation:_ automatic
- **NAME-6 [M] â name contains no XML tags or reserved words** â `name` contains no XML tags and no reserved words (`anthropic`, `claude`), except that an explicit runtime adapter may use its matching vendor word. (BP, KI)
  - _Remediation:_ diagnostic â Confirm whether the skill is an explicit matching runtime adapter; otherwise choose a non-reserved name and coordinate every identity reference.
- **NAME-7 [J] â name is specific rather than generic** â `name` is specific, not generic (avoid `helper`, `utils`, `tools`, `data`). (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Is this name concrete and appropriately scoped for the capability it governs?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## DESC â Frontmatter: description

â [standard](standards-agent-skills.md#5-frontmatter-description)

The portable skill description contract.

- **DESC-1 [M] â description is present and non-empty** â `description` present and non-empty. (SPEC, CC)
  - _Remediation:_ diagnostic â Author a truthful description that states the skill scope and when to select it; the intended capability cannot be inferred safely from an empty value.
- **DESC-2 [M] â description is no longer than 1024 characters** â `description` ≤ 1024 characters (spec hard cap — see ※2). (SPEC, BP)
  - _Remediation:_ diagnostic â Shorten the description below the hard cap while preserving its scope, primary triggers, and essential collision guidance.
- **DESC-3 [M] â description contains no XML tags** â `description` contains no XML tags (placeholders inside backticks are fine). (BP)
  - _Remediation:_ diagnostic â Rewrite or escape the XML-like text while preserving the author’s intended meaning and any literal placeholder syntax.
- **DESC-4 [J] â description states what the skill does and when to use it** â States **both** what it does **and** when to use it. (SPEC, BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the description state both what this skill does and when it should be used?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DESC-5 [J] â description is written in the third person** â Written in the **third person**, never first/second person. (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Is the description consistently written in the third person?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DESC-6 [J] â description includes concrete trigger phrases** â Includes concrete **trigger keywords/phrases** a user would say. (SPEC, BP, CC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the description include concrete trigger phrases a user would say?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DESC-7 [J] â description leans toward firing and front-loads its main trigger** â Leans toward firing, and front-loads the most important trigger. (ENG, COMMUNITY, CC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the description lean toward appropriate selection and front-load its most important trigger?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DESC-8 [J] â description avoids vague phrasing** â Avoids vague phrasing ("helps with documents"). (SPEC, BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the description avoid vague phrases such as "helps with documents"?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DESC-9 [J] â description may state explicit non-triggers where collision is likely** â _(Advanced)_ Where collision is likely, may end with explicit non-triggers. (COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Where skill-selection collision is likely, would explicit non-triggers improve routing?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **DESC-10 [J] â description earns its standing cost through routing value** â The description retains scope, its primary trigger, and essential collision guidance while routing mode and workflow detail out of the standing surface. (KI)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the description earn its standing source cost by retaining scope, its primary trigger, and only essential collision guidance while routing mode and workflow detail out?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## OPT â Frontmatter: optional fields

â [standard](standards-agent-skills.md#6-frontmatter-optional-fields)

Optional portable and runtime-specific frontmatter fields.

- **OPT-1 [M] â compatibility is between 1 and 500 characters when present** â `compatibility`, if present, is 1–500 chars. (SPEC)
  - _Remediation:_ diagnostic â Rewrite or remove compatibility after confirming the actual environment requirements; preserve useful constraints within the 1–500 character contract.
- **OPT-2 [M] â metadata is a string-to-string map when present** â `metadata`, if present, is a string→string map. (SPEC)
  - _Remediation:_ diagnostic â Choose the intended textual representation for each metadata value, or remove metadata that has no valid string meaning.
- **OPT-3 [M] â tool declarations use their portable or runtime-specific shape** â Experimental portable `allowed-tools` is a valid string; Claude-Code-only `disallowed-tools` is a valid string or YAML list. (SPEC, CC)
  - _Remediation:_ diagnostic â Confirm the intended runtime and permission boundary, then rewrite allowed-tools or disallowed-tools in that runtime’s supported scalar or sequence shape.
- **OPT-4 [M] â license declarations are non-empty YAML string scalars** â `license`, if present, is a non-empty YAML string scalar. Prefer a short name or bundled-file reference. (SPEC)
  - _Remediation:_ diagnostic â Supply the intended license name or bundled-file reference as a non-empty YAML string, or remove the optional field if no declaration is intended.
- **OPT-5 [J] â runtime-specific fields are flagged where portability matters** â CC-only fields are flagged when cross-platform portability matters (see ※3). (CC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Where cross-platform portability matters, are runtime-specific fields clearly identified?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **OPT-6 [J] â manually timed side effects disable model invocation** â Side-effecting / manually-timed workflows set `disable-model-invocation: true` (contrast `user-invocable: false`). (CC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do side-effecting or manually timed workflows set disable-model-invocation: true where appropriate?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **OPT-7 [J] â discrete modes have an ordered argument hint** â A skill with discrete modes sets `argument-hint`; modes are **named** (not lettered) and **alphabetically ordered**. (CC, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Where the skill has discrete modes, are they named and alphabetically ordered in argument-hint?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## SIZE â Body: size & conciseness

â [standard](standards-agent-skills.md#7-size--conciseness)

The progressive-disclosure budget for a skill body.

- **SIZE-1 [M] â body is under 500 lines** â `SKILL.md` body is under **500 lines**. (SPEC, BP, CC)
  - _Remediation:_ diagnostic â Reduce the body below the line budget by removing generic knowledge and routing rarely used authored detail into focused references without losing behaviour.
- **SIZE-2 [M] â body stays below approximately 5,000 tokens** â Body instructions stay under **~5,000 tokens**. (SPEC)
  - _Remediation:_ diagnostic â Reduce the body below the token guide-rail while preserving selection, shared behaviour, and links to necessary on-demand detail.
- **SIZE-3 [J] â body omits knowledge the agent already has** â No token spent on what a competent agent already knows. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the body avoid spending tokens on knowledge a competent agent already has?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SIZE-4 [J] â body is an overview that routes to detail** â `SKILL.md` reads as an **overview that routes to detail**, not all detail inlined. (BP, SPEC, CC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the body work as an overview that routes rarely used detail into supporting files?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## REF â Progressive disclosure & references

â [standard](standards-agent-skills.md#8-progressive-disclosure)

How a skill routes supporting detail into references.

- **REF-1 [J] â rarely used detail is separated into on-demand files** â Detailed/rarely-used material is in on-demand files; mutually-exclusive domains are split. (BP, ENG, SPEC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Is detailed or rarely used material routed to on-demand files, with mutually exclusive domains split?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **REF-2 [J] â supporting files are referenced from SKILL.md with a loading cue** â Every supporting file is referenced from `SKILL.md` with when-to-load — no orphans. (BP, CC, SPEC)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Is every supporting file referenced from SKILL.md with clear guidance on when to load it?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **REF-3 [M] â long reference files open with a table of contents** â Reference files > 100 lines open with a table of contents. (BP, COMMUNITY)
  - _Remediation:_ diagnostic â Author a concise table of contents near the top using the reference’s actual section structure and stable anchors.
- **REF-4 [J] â script execution intent is explicit** â Execution intent is explicit per script (run vs read). (BP, ENG)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Is the execution intent for each script explicit: run it or read it?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **REF-5 [J] â many-moded skills route independently invoked procedures** â _Mode-router for many-moded skills._ A skill whose body is dominated by **independently-invoked** modes keeps the shared model + a dispatch table in `SKILL.md` and moves each mode's procedure to its own flat `references/mode-<name>.md`; combined mode files such as `mode-audit-conform.md` are split, and each procedure states its own preconditions. Behaviour anchors and the shared model stay in the body. Not required when modes are few, short, or call-chained. (BP, SPEC §8)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Where this skill has many independently invoked modes, does SKILL.md retain the shared model and dispatch while flat mode files hold their procedures?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## BODY â Body content quality

â [standard](standards-agent-skills.md#9-body-content-quality)

The quality and usability of the skill instructions.

- **BODY-1 [J] â instruction freedom matches task fragility** â Degrees of freedom match task fragility (prose → parameterised script → exact "do not modify"). (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the level of instruction freedom match this task’s fragility?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **BODY-2 [J] â the main body avoids time-sensitive content** â No time-sensitive content in the main body; legacy goes in a collapsed note. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the main body avoid time-sensitive content, containing legacy detail appropriately?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **BODY-3 [J] â terminology is consistent** â Consistent terminology — one term per concept. (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the skill use one consistent term for each concept?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **BODY-4 [J] â style-sensitive output includes concrete examples** â Concrete examples (2–3 I/O pairs) where output quality depends on style. (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Where output quality depends on style, are there concrete input and output examples?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **BODY-5 [J] â one default approach has an escape hatch** â One default approach with an escape hatch, not a menu. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the skill give one default approach with a clear escape hatch rather than a menu?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **BODY-6 [J] â template strictness matches its contract** â Template strictness matches the contract (exact vs adapt). (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does any template make its strictness appropriate and explicit?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **BODY-7 [J] â multi-step work has a copyable checklist and feedback loop where needed** â Copyable checklist for multi-step tasks; feedback loop for quality-critical ones. (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does multi-step work provide a copyable checklist and, when quality-critical, a feedback loop?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **BODY-8 [J] â rules state their rationale** â Rules state the _why_ alongside the rule, not bare MUST/NEVER. (COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do rules explain their rationale rather than stating bare MUST or NEVER directives?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## SCRIPT â Scripts & executable code

â [standard](standards-agent-skills.md#10-scripts)

The quality and autonomy of executable skill support.

- **SCRIPT-1 [J] â scripts handle expected errors** â Scripts handle expected errors (missing file, permissions) rather than punt to the agent. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do scripts handle expected errors rather than punting them to an agent?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SCRIPT-2 [J] â scripts explain configuration values** â No unexplained magic numbers — every config value is justified. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are configuration values justified rather than unexplained magic numbers?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SCRIPT-3 [J] â runtime dependencies and MCP tools are explicit** â Required packages are listed/verified for the runtime; MCP tools use fully-qualified `ServerName:tool_name`. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are runtime dependencies verified and MCP tools fully qualified?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SCRIPT-4 [J] â deterministic reusable logic is pre-written** â Deterministic, frequently-reused logic is pre-written, not regenerated each run. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Is deterministic, frequently reused logic pre-written rather than regenerated each run?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SCRIPT-5 [J] â validation errors are actionable** â Validation scripts are verbose — errors name the problem and the valid options. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do validation errors name the problem and valid options?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SCRIPT-6 [J] â batch and destructive work is planned and validated first** â Plan-validate-execute for batch/destructive ops. (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do batch or destructive operations plan and validate before execution?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SCRIPT-7 [J] â target-repository scripts are copied** â Scripts installed into a target repo's `scripts/` directory are **copies**, not symlinks or out-of-repo references — the target repo must be autonomous. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are target-repository scripts copied rather than symlinked or referenced outside the repository?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **SCRIPT-8 [M-heuristic + J] â top-level scripts are necessary public commands** â Every supported non-test script directly under `scripts/` is a necessary public command whose leading comment states its `Purpose:`, canonical `Run: bun scripts/<name> --help`, and `Boundary:`. It exits successfully for `-h` and `--help`, prints useful usage, handles expected errors, and has focused tests. Private implementation belongs under `scripts/internal/`; published or materialised compile-time modules belong under `scripts/shared/`; rubric behaviour belongs under `scripts/rubric/`; generic execution belongs to `ki`. (AS, KI)
  - _Remediation:_ diagnostic â Decide whether each top-level script is a supported public command; add truthful command metadata, help, error handling, and tests, or relocate it to its actual ownership boundary.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Is each top-level script still a necessary, tested public command at the correct ownership boundary, with a truthful header, useful help, and expected-error handling?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## KI-CHECKER â Knowledge Islands rubric contract

â [standard](standards-rubric-authoring.md)

Knowledge Islands catalogue, session, and packaging responsibilities.

- **KI-CHECKER-1 [J] â rubric sessions scope subjects beneath the repository root** â `ki repo audit` and `ki repo conform` pass the repository root to `createSession`. The skill discovers only its governed subjects beneath that root and represents an absent scope explicitly with `NOT_APPLICABLE`; it does not reinterpret the root as its content directory, scan unrelated files, or claim a vacuous pass. (standards-rubric-authoring.md#context-and-evidence, standards-rubric-authoring.md#host-and-session-boundary)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the rubric session discover only its governed subjects and represent an absent scope explicitly?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-CHECKER-2 [M] â skill implementation imports remain inside its own payload** â A skill's `scripts/**/*.ts` files contain no static `from`, dynamic `import()`, or CommonJS `require()` relative import that resolves outside its own `scripts/` directory. A portable rubric dependency is copied into `scripts/shared/rubric.ts`, so every rubric item and context remains typecheckable inside the skill root. (KI)
  - _Remediation:_ diagnostic â Move the dependency inside the skill payload, materialise an explicitly declared shared module, or remove the import after resolving which component owns that code.
- **KI-CHECKER-3 [M] â ki-skills publishes the portable rubric contract** â `ki-skills` publishes the sole portable shared dependency, `scripts/shared/rubric.ts`, declared as `ki-shared-modules: [rubric]`. It provides catalogue authoring types for independently installed skills; `ki` owns execution, reporting, and transaction handling. The provider never declares a dependency on itself. (ADR-KI-HARNESS-SKILLS-012)
  - _Remediation:_ diagnostic â Align ki-skills frontmatter and its owned scripts/shared/rubric.ts with the sole provider contract, removing any self-dependency without overwriting authored module content.
- **KI-CHECKER-4 [M] â structured rubric items follow the uniform family layout** â `scripts/rubric/items/index.ts` is catalogue wiring only. Each family is imported from one semantic family module, which exports only that complete ordered `RubricFamily`; item constants and helpers remain private. Rule definitions and execution callbacks do not live in the catalogue index. (standards-rubric-authoring.md#rubric-families-and-items)
  - _Remediation:_ diagnostic â Refactor the catalogue index to wiring only and move each rule into the correct semantic family module while preserving criterion order and behaviour.
- **KI-CHECKER-5 [M] â shared and internal script packaging is explicit** â Private implementation belongs under `scripts/internal/`; cross-skill modules belong under `scripts/shared/`, whose non-test entries must exactly match the modules published through `ki-shared-modules:` or materialised through `ki-shared-dependencies:`. (KI)
  - _Remediation:_ diagnostic â Classify legacy scripts/lib code as private or shared, relocate it, and reconcile scripts/shared/ with the authored module and dependency declarations.

## RUBRIC â Generated rubric publication

â [standard](standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] â structured catalogue publication is exact** â A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## KI-LINK â Knowledge Islands linking & portability

â [standard](standards-knowledge-islands.md#1-linking-and-portability)

Knowledge Islands link and toolchain portability.

- **KI-LINK-1 [M] â internal links use standard relative Markdown links** â Internal links are **standard relative markdown links**, not wikilinks. (ki-agentic-harness README)
  - _Remediation:_ diagnostic â Replace each wikilink with a standard relative Markdown link after identifying the intended local target and suitable link text.
- **KI-LINK-2 [M] â relative link targets resolve** â Links resolve — every relative target exists (angle-bracket form for paths with spaces). (ki-agentic-harness README)
  - _Remediation:_ diagnostic â Correct the relative target, restore the missing file, or remove the link according to the author’s intended relationship.
- **KI-LINK-3 [J] â other skills are referred to by name** â Other skills are referenced by `name`, never by file path. (ki-agentic-harness README)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Are other skills referred to by their public name rather than by a file path?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-LINK-4 [J] â the house toolchain passes** â The house toolchain passes: Biome (TS/JSON), rumdl (markdown). (ki-agentic-harness README)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the repository pass its configured Biome and rumdl toolchain?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## PORT â Runtime portability

â [standard](standards-knowledge-islands.md#4-runtime-portability)

Portable contracts make runtime-specific boundaries explicit.

- **PORT-1 [M] â portable contracts make runtime assumptions explicit** â Portable guidance has no unqualified vendor, runtime, or runtime-home reference. Declare a dedicated runtime-binding skill, use a `Runtime binding` section, attribute source material, or compare multiple runtimes explicitly. (KI)
  - _Remediation:_ diagnostic â Decide whether each runtime reference is policy, a binding, source attribution, or comparison, then qualify or relocate it without changing the portable contract.

## KI-SHAPE â Knowledge Islands skill shape

â [standard](standards-knowledge-islands.md#2-skill-shape)

The common shape of a Knowledge Islands governance skill.

- **KI-SHAPE-1 [J] â standard skills resolve base bindings at runtime** â A **standard** KI skill resolves base bindings at runtime and hard-codes **no single base**. (ki-agentic-harness README, `ki-repo-kb`)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does this standard skill resolve base bindings at runtime without hard-coding one base?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-2 [M-heuristic + J] â skills compose or optionally augment rather than extend** â **Composition and optional augmentation are the only dependent inter-skill relationships — the base-coupled extension pattern is retired.** Formal composition means selecting one skill necessarily selects and runs another governance capability before adding its delta; declare it in `ki-depends-on:`. An optional augmentation is declared in `ki-optional-depends-on:` and applies only when the named capability is active in the same scope; it never makes that capability mandatory or claims composition. List order is not semantic. Separately coverage-detected standards are audited alongside, off-ramps are routing, and `ki-shared-dependencies:` is packaging — none is composition. What a base needs differently is **declared, not forked**: data in the repo's own `.ki-config` table (read validate-down), prose in its `CLAUDE.md` — never a `<base>-kb`-style skill that takes the shared modes by name. _Delegation between two standards (kb → streams) is composition at sub-scope and is declared by the delegating parent._ The linter flags **endorsement of the retired pattern** (telling a base to ship/"prefer" an extension skill, or that a skill "delegates the modes back" / "extends this one") as a mechanical heuristic; the **[J]** gate is that every claimed composition has the matching dependency edge and no adjacent relationship is mislabeled as composition. (ki-agentic-harness README, `ki-engineering`)
  - _Remediation:_ diagnostic â Replace the retired extension claim with the actual relationship: required composition, optional augmentation, routing, shared packaging, or repository-local configuration.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does every claimed composition have a required dependency edge, every optional augmentation the correct optional edge, and coverage-detected standards, off-ramps, and shared-module packaging remain distinct?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-3 [M + J] â the skill declares its kind** â Every KI skill declares its **kind** in exact frontmatter as `ki-kind: governance` or `ki-kind: process`; a directory and prose never establish kind (ADR-KI-HARNESS-SKILLS-006). A **governance skill** holds a house standard and exposes the universal modes (KI-SHAPE-5). A **process skill** drives an action or lifecycle rather than holding a standard: it is lightweight, may bundle a helper `scripts/` and a `references/` procedure, and is exempt from universal governance modes — its mode count follows its own lifecycle and it exposes HELP only optionally. Both kinds use the closed Knowledge Islands reference vocabulary (KI-SHAPE-6) and are dual-invocable (`/<name>` and model-triggered). (ki-agentic-harness README, ADR-KI-HARNESS-SKILLS-006)
  - _Remediation:_ diagnostic â Decide whether the skill holds a governance standard or drives a process lifecycle, then declare exactly ki-kind: governance or ki-kind: process.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the explicit kind accurately match the skill’s concern and operating contract?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-4 [J] â a skill validates only its own configuration table** â A skill that reads the shared `.ki-config.toml` consumes and **validates only its own `[<skill>]` table** — warns on a key it doesn't recognise, advises dropping one that merely restates a default — and never inspects another skill's table. Validate down, ignore across. (contract defined by `ki-repo`)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does this skill validate only its own configuration table and ignore unrelated tables?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-5 [J] â governance skills expose universal modes** â A **governance skill** (one that holds a standard) exposes the universal modes **AUDIT** + **CONFORM** + **EDUCATE** + **REFRESH**. AUDIT and CONFORM run through the skill's hosted rubric; EDUCATE teaches or creates the governed artifact from that standard; REFRESH re-anchors the standard to its sources. Further modes (`OPTIMISE` to push a compliant artifact from the floor toward excellent, and operational modes like kb's note-ops) are skill-specific. Modes are named, not lettered, and ordered alphabetically in the body and `argument-hint`. (ki-agentic-harness README)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does this governance skill expose the universal modes with appropriate additional modes only?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-6 [M + J] â Knowledge Islands skills use the closed reference vocabulary** â _Closed reference vocabulary — Knowledge Islands skills only._ Every top-level Markdown reference is `standards-<topic>.md`, generated `rubric.md`, `sources.md`, optional `exemplars.md`, or one-mode-only `mode-<verb>.md`; a skill includes only the classes it needs. Normative formats, process doctrine, and shared mode contracts are standards. Combined mode names, bare `standards.md`, `<topic>-standards.md`, nested references, and ad hoc guide, format, or contract filenames are retired. Templates and reusable output material live in `assets/`. A skill tracking a moving external spec keeps a current-state `## Last review` block in `sources.md`. Skills outside the Knowledge Islands set are exempt. (ki-agentic-harness README)
  - _Remediation:_ diagnostic â Classify each nonstandard reference by reader need, rename or relocate it into the closed vocabulary or assets/, and repair every affected link.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does each retained reference class serve a distinct reader need, with templates and executable helpers elsewhere?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-7 [M-heuristic + J] â behaviour-changing skills define and check their anchor** â _A behaviour-changing skill defines its gate — and checks the anchor._ A skill that changes a **default behaviour** — installs a gate, a standing "always do X before Y" rule, or a routing intercept — cannot rely on its own `description` to fire it, because skills load **on demand** and the triggering request often won't mention the skill (e.g. "edit this note" never says "proposal"). Such a skill must **anchor the behaviour in always-loaded context** (the base/repo `CLAUDE.md` / `AGENTS.md`, or a companion skill that _does_ reliably load handing off to it), **and its rubric must verify the anchor is present** so it can't be silently lost. The hosted audit surfaces candidates mechanically (strong gate phrasing in the body or a reference file — body + references scanned as one unit, since mode-routing lifts procedures out of the body — without an anchor its rubric reads); the **[J]** call is whether the skill genuinely changes a default and so _needs_ a gate. Realised as `ki-repo-kb-streams`' **GATE-1** (the Enactment gate) and `ki-repo-kb`'s **MEM-2** (the memory cascade); `ki-repo`'s `.ki-config.toml` marker is the same pattern (anchor + checked). (standards-knowledge-islands.md §2, standards-rubric-authoring.md#context-and-evidence)
  - _Remediation:_ diagnostic â Confirm that the skill changes default behaviour, then choose an appropriate always-loaded anchor and add rubric evidence that verifies that specific anchor.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does a behaviour-changing skill have an appropriate always-loaded anchor that its rubric verifies?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-9 [M-heuristic + J] â mechanical work belongs in the structured rubric** â _Mechanical work belongs in the structured rubric, not in tokens._ A criterion a script can decide deterministically — no judgment, no AI benefit — is tagged **[M]** and implemented in `scripts/rubric/items/`; a **[J]** tag is earned by the judgment a criterion genuinely needs, never by "no implementation written yet". The reader's context is spent only on the **[J]** items, so a mechanical criterion left to prose, or a **[J]** the rubric already decides, is drift — it **moves into the structured rubric and flips to [M]**. The linter surfaces the mechanical heuristic — a rubric carrying **[M]** criteria but shipping no structured rubric (nor a documented toolchain delegation to a skill-scoped audit) — as a WARN; the **[J]** gate is whether each remaining **[J]** genuinely needs a reader rather than a script. ([Rubric authoring](standards-rubric-authoring.md))
  - _Remediation:_ diagnostic â Implement each genuinely deterministic criterion in the structured rubric, or document the actual skill-scoped toolchain owner; retain judgment only where review is necessary.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do remaining judgment criteria genuinely require review rather than deterministic checking?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-10 [J] â skills do not assume private user configuration** â _A skill must not assume personal runtime configuration._ A Knowledge Islands skill is installed by any contributor, not only its author. It must not assume the user has any particular private configuration or imported topic files — plan-mode gates, house style rules, footnote conventions, workflow preferences. Any behaviour a skill requires beyond what the open spec guarantees must be **anchored in always-loaded repo context** (`CLAUDE.md`, `AGENTS.md`, or a KI-SHAPE-7-style companion hook) — not in the author's private config. Where a skill cross-checks a convention that _might_ live in personal config, it must degrade gracefully rather than silently rely on that content being present. (standards-knowledge-islands.md §2)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the skill avoid assuming private personal configuration?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-11 [M] â governance skills expose HELP** â _Exposes the universal HELP mode._ Every governance skill's `argument-hint` lists a `help` verb, so the no-mode default and the `help` / `-h` / `?` pure-explain form are discoverable (ADR-KI-HARNESS-SKILLS-001). A skill derives its help from its own frontmatter and operating-mode prose; it carries no generated wrapper or separate HELP payload. The linter verifies the `help` token; the prose HELP semantics are KI-INVOKE-1 **[J]**. (ADR-KI-HARNESS-SKILLS-001)
  - _Remediation:_ automatic
- **KI-SHAPE-12 [M] â governance mode vocabulary is canonical and complete** â _Mode vocabulary is canonical and complete._ A governance skill exposes **AUDIT**, **CONFORM**, **EDUCATE**, **REFRESH** and **HELP** spelled exactly so — a governance skill missing any universal verb from its `argument-hint` (EDUCATE is the common gap) **WARNs**; `NEW`, `OPTIMISE`, and operational verbs are additive, never substitutes for a universal mode (a collection skill exposes both EDUCATE and NEW). The current source-entrypoint migration invariant is validated by KI-SHAPE-15; direct delivery resolves registered operations from the verified collection. Process skills are exempt throughout. (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006, ADR-KI-HARNESS-007)
  - _Remediation:_ automatic
- **KI-SHAPE-13 [M] â mode headings have a canonical structure** â _Mode-heading structure._ A governance skill presents its modes under a **single `## Operating modes` H2** (the home for the shared no-mode/HELP intro), with each mode as a **`### Mode <NAME>` H3** or — for router skills with many operational verbs — a **`| Mode | … |` dispatch table** inside that section. The linter WARNs on a flat `## Mode X` H2, a bare `### X` heading missing the `Mode` prefix, and any `argument-hint` verb absent from the Operating-modes body (hint ⊆ body). Process skills are exempt. (ADR-KI-HARNESS-SKILLS-001)
  - _Remediation:_ diagnostic â Restructure the authored mode prose under one Operating modes section and reconcile argument-hint with the modes that remain, preserving each procedure’s meaning.
- **KI-SHAPE-14 [M] â REFRESH states its ownership precondition** â _REFRESH states its ownership precondition._ REFRESH's write target is normally the skill's own canonical files under `skills/<name>/` in `ki-agentic-harness` — a governance skill's `### Mode REFRESH` section (or, per REF-5, its `references/mode-refresh.md`) must name `ki-agentic-harness` as the only place it writes, and instruct the agent to stop and redirect when invoked from an installed copy (to the harness, or — for a pattern recurring across bases — to `ki-repo-kb`'s IMPROVE mode). The one committed repository-local source at `.agents/skills/ki-self/` instead names that local source and stops to promote reusable rules to their shared owner. Missing either half **WARNs**. Process skills (KI-SHAPE-3) are exempt; a skill with no REFRESH section at all is already caught by KI-SHAPE-12. (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006)
  - _Remediation:_ diagnostic â Author the REFRESH ownership precondition for the actual source location, including the correct stop-and-redirect or promotion boundary.
- **KI-SHAPE-15 [M] â governance skills expose no legacy runner entrypoints** â _Direct governance operation shape._ A governance skill exposes its rubric catalogue from `scripts/rubric/items/index.ts`; `ki` resolves and hosts that catalogue from the verified installed harness. `scripts/govern.ts`, `scripts/educate.ts`, `scripts/audit.ts`, and `scripts/conform.ts` are retired, with no compatibility runner or fallback. REFRESH is harness-only. Process skills and the committed repository-local `.agents/skills/ki-self/` source are exempt. (standards-knowledge-islands.md §2, ADR-KI-HARNESS-007)
  - _Remediation:_ diagnostic â Migrate any still-required behaviour to its catalogue, context, host, or EDUCATE owner before removing the retired governance runner entrypoint.
- **KI-SHAPE-16 [M-heuristic + J] â target files have declared ownership** â _Declared file ownership, three tiers._ A skill whose rubric reads or changes a house-standard file in the **target repository's** working tree declares that relationship in frontmatter, alongside `ki-depends-on:`, under one of three keys: `requires:` (must exist, doesn't create/control it — any number of skills may share a `requires:` filename), `contributes:` (writes/expects only its own section of a shared file — any number of skills may share a `contributes:` filename, e.g. `.ki-config.toml`, `package.json`), or `owns:` (sole author of the whole file — **exclusive**, at most one skill per filename). The mechanical heuristic verifies that declared filenames occur in the skill's production implementation and that no filename is owned by more than one skill. Judgment confirms that every session proposal and governed read has the appropriate declaration. (KI)
  - _Remediation:_ diagnostic â Trace the skill’s real target-file reads and writes, choose requires, contributes, or owns accordingly, and resolve exclusive ownership collisions with the affected skills.
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do all governed target-file reads and session proposals carry the appropriate ownership declaration?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **KI-SHAPE-17 [M] â dependencies are declared explicitly** â _Explicit dependency declaration._ Every skill declares `ki-depends-on:` as a single-line flow list. `ki-depends-on: []` is the required explicit form when a skill has no governance dependencies. The listed capability names and a governed repository's matching `.ki-config.toml` tables are validated by the dependency graph and bootstrap; the skill checker enforces the local declaration shape. (ADR-KI-HARNESS-SKILLS-006)
  - _Remediation:_ diagnostic â Determine the skill’s genuine governance prerequisites and author ki-depends-on as a single-line flow list, using [] only when none are required.
- **KI-SHAPE-18 [M] â runtime compatibility is explicit and bounded** â A vendor-bound skill declares `ki-supported-runtimes:` as a non-empty, duplicate-free flow list of recognised repository runtime identifiers and also declares `ki-runtime-binding: true`; an absent list means the skill is portable across supported runtimes. (standards-knowledge-islands.md §2)
  - _Remediation:_ diagnostic â Decide whether the skill is portable or vendor-bound; for a binding, declare the recognised runtime list and ki-runtime-binding: true without duplicates.

## KI-INVOKE â Invocation protocol

â [standard](../../../../docs/decisions/ADR-KI-HARNESS-SKILLS-001-audit-conform-educate-refresh-canonical-modes-help.md)

Safe invocation for a skill with named modes.

- **KI-INVOKE-1 [J] â HELP is the safe bare-invocation default** â _HELP is the bare-invocation default; explicit `help` is pure explain._ Every mode-bearing skill exposes the universal **HELP** mode (ADR-KI-HARNESS-SKILLS-001). Invoked as `help` / `-h` / `?`, the skill **must** emit the generated HELP block (name, one-line purpose, invocation, mode list, off-ramps) and **stop** — no prompt, no action (the headless-safe form). Invoked with **no recognisable mode** and no clear context signal, it **must** emit the same HELP explanation, then — only in an interactive session — issue `AskUserQuestion` listing each mode with a one-line description, prompting for any `<target>` the chosen mode's `argument-hint` shows before starting work. Rationale: the caller learns what the skill _is_ before being asked which mode to run, and a cold/headless caller gets the explanation without a dead prompt. The one-liner "Infer the mode from the request; ask if unclear" is insufficient. (COMMUNITY, ADR-KI-HARNESS-SKILLS-001)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does explicit help stop after a generated HELP explanation, while an unclear interactive invocation explains the skill before asking for a mode?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## PROC â Process / meta

â [standard](standards-agent-skills.md#11-process--evaluation)

Evaluation and real-usage evidence for the skill.

- **PROC-1 [J] â the skill was built evaluation-first** â Built evaluation-first — ≥ 3 evaluation scenarios against a no-skill baseline before extensive docs. (BP, ENG)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Was this skill built evaluation-first with meaningful scenarios against a no-skill baseline?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **PROC-2 [J] â the skill has been tested across intended models and real use** â Tested across the models it will run on (Haiku/Sonnet/Opus) and with real usage. (BP)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Has the skill been tested across its intended models and through real usage?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## COLL â Cross-skill collision

â [standard](standards-knowledge-islands.md#3-cross-skill-collision)

Selection boundaries across a set of skills.

- **COLL-1 [M] â quoted trigger phrases are not shared across skills** â _Shared triggers._ Within a set of ≥ 2 skills, no two `description`s declare the **same quoted trigger phrase** (WARN — a shared trigger signals scopes that overlap and need separating). (COMMUNITY, ki-agentic-harness README)
  - _Remediation:_ diagnostic â Decide which skill owns each shared trigger, redesign the competing scopes, and add reciprocal off-ramps only where genuine adjacency remains.
- **COLL-2 [J] â adjacent skills have non-overlapping scope and reciprocal off-ramps** â _Non-overlapping scope by design, with a reciprocal off-ramp where adjacency remains._ The first guard is **design**: skills are scoped so they don't compete for the same request, and each `description` is primarily **self-scoped** (what it does, and briefly what it doesn't). Where two skills are nonetheless genuinely adjacent, **each** description names the other as the off-ramp — the reciprocal pattern (`ki-repo-mcp` ↔ `ki-skills`); a one-directional guard is a half-fix. A COLL-1 hit means the scopes overlap and the **design** needs fixing first, before any off-ramp papers over it. (standard §15, ki-agentic-harness README)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do adjacent skills have non-overlapping scopes and reciprocal off-ramps where their requests are genuinely adjacent?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.

## LONG â Longevity

â [standard](standards-agent-skills.md#12-longevity)

Refresh paths and cadence for knowledge that changes over time.

- **LONG-1 [J] â volatile facts have a refresh path** â _Volatile facts & a refresh path._ A skill hard-coding facts that drift (model IDs, versions, tool names, dated spec numbers, URLs) must either resolve them at runtime **or** carry a tracked source list with `last reviewed` dates **and** a REFRESH mode that re-anchors them and names what to re-fetch. (BP, COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Do volatile facts resolve at runtime or have a tracked source list and refresh path?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **LONG-2 [J] â the refresh path has a cadence** â _A cadence, not just a capability._ A skill that ships a refresh path also **declares a cadence** in its `sources.md` `**Refresh:**` marker (`<class> · <cadence>`) and, where supported, registers a scheduled run; a refresh capability with no declared cadence is a half-measure. The cadence has runtime teeth in both directions: overdue → LONG-3 WARN; too-soon → the REFRESH mode's confirm-before-force gate (enforcement framework §5). (COMMUNITY)
  - _Evidence scope:_ The target skill and the evidence named by this criterion.
  - _Review prompt:_ Does the refresh path have an appropriate declared cadence and scheduled execution where supported?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.
- **LONG-3 [M] â the declared refresh cadence is being met** â _The cadence is actually being met._ Where a skill carries `references/sources.md`, its most recent `Last reviewed` date (read from that table column, so dates quoted in prose don't count) is within the skill's **declared per-skill cadence** plus grace; an overdue source list WARNs so AUDIT and the scheduled refresh routine surface it. A `canonical · on-change` skill carries no clock and is exempt — it refreshes when the model changes, not on a calendar. Never a FAIL — staleness is elapsed time, not a defect in the change under review. (COMMUNITY)
  - _Remediation:_ diagnostic â Run the skill’s authored REFRESH procedure against its declared sources, reconcile any changes, and record the actual review date.
- **LONG-4 [M] â the refresh marker is present and coherent** â _The refresh marker is present and coherent._ Each `sources.md` carries a parseable `**Refresh:** <class> · <cadence>` line (§4 of the enforcement framework) — a missing or malformed marker WARNs (**4a**). An `external-spec` skill must declare a clock cadence, not `on-change` (**4b**, soft WARN). Class is **not** mechanically tied to `## Last review`-block presence — a `canonical` skill may keep a block as a hand-curated practice note (`ki-repo-kb-streams` does), so block-presence stays a `[J]` read, not a checker rule. (COMMUNITY)
  - _Remediation:_ diagnostic â Choose the source class and cadence that match the skill’s volatility, then author a parseable **Refresh:** marker; external specifications require a clock cadence.
