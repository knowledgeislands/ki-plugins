# Knowledge Islands skill standard

The Knowledge Islands conventions added to the portable [Agent Skills standard](standards-agent-skills.md). The [rubric](rubric.md) derives its KI-LINK, PORT, KI-SHAPE, KI-INVOKE, and COLL families from this standard and the decision records they cite.

## Contents

1. [Linking and portability](#1-linking-and-portability)
2. [Skill shape](#2-skill-shape)
3. [Cross-skill collision](#3-cross-skill-collision)
4. [Runtime portability](#4-runtime-portability)

## 1. Linking and portability

Knowledge Islands skills survive relocation and symlinking. Internal links are **standard relative markdown links, not Obsidian wikilinks**, and every relative target resolves on disk (use the CommonMark angle-bracket form for paths with spaces). Reference **another skill by its `name`** ("the `ki-kb` skill"), never by file path — a skill's on-disk location is not stable. The house toolchain passes: Biome (TS/JSON), Prettier + markdownlint-cli2 (markdown). (ki-agentic-harness README)

## 2. Skill shape

A **standard** Knowledge Islands skill carries reusable mode logic and resolves base-level bindings (store aliases, scope, writing standards) at runtime — base-specific **data** from the host repo's `.ki-config.toml` table, base-specific **prose** from its `CLAUDE.md` and memory index — so it hard-codes **no single base**. The skill declares its **kind** (Knowledge Islands / process / scoped) clearly enough that a reader can place it. (ki-agentic-harness README, `ki-kb`)

**Inter-skill relationships are composition, only.** A skill builds on another by **running that skill's checker/mode in sequence and adding its own delta** — never by importing it, so each stays valid installed standalone (`ki-mcp` runs `ki-engineering`'s toolchain audit, then audits the MCP delta). The composing skill **declares the edge**: it names the sibling and the run order in its AUDIT mode, and the relationship is drawn once in the ki-agentic-harness README map. **Delegation between two standards** — `ki-kb` handing the `Streams` zone to `ki-kb-streams` — is the same mechanism at sub-scope, not a separate kind. There is **no base-coupled extension skill**: a base never ships a `<base>-kb`-style skill that takes the shared modes by name. What a base needs differently is **declared, not forked** — data in its own `.ki-config.toml` table (read validate-down by the standard), prose guidance in its `CLAUDE.md` — so base-specificity stays auditable rather than hidden in a drift-prone coupled skill. A genuinely base-specific _behaviour_ that no declaration can express is a signal to **generalise it into the standard** (a REFRESH candidate), not to fork a skill. (ki-agentic-harness README, `ki-kb`)

**Shared modules are the narrow implementation exception.** A provider exposes modules with `ki-shared-modules:`; a dependent names each exact `provider:module` reference with `ki-shared-dependencies:`. The extension-free module name resolves to one safe provider file at `scripts/shared/<module>.ts`, and the dependency materialiser places a regular-file copy at the same `scripts/shared/<module>.ts` path in the consumer. A skill imports only that local module, never a sibling skill source path or a checkout-relative path. Published and materialised module names share one namespace and must not collide. The declaration creates no governance coverage or composition edge. `ki-skills` provides the canonical compile-time `rubric` contract; generic execution, validation, progress, transactions, and reporting belong to `ki`. (ADR-KI-HARNESS-SKILLS-012, [compatible harness contract](../../../../docs/decisions/references/compatible-harness-contract.md))

A skill that reads declared repo config does so through the shared **`.ki-config.toml`** — the file whose presence marks a Knowledge Islands–compliant repo, whose contract is defined by `ki-repo` — and only through **its own `[<skill-name>]` table**. It **validates that table**: it warns on a key it doesn't recognise (a typo or stale option should surface, not silently do nothing) and advises dropping one that merely restates a default, while leaving every other skill's table untouched, even keys it can't interpret. Validate down, ignore across. (`ki-repo` is the reference implementation.)

A Knowledge Islands skill is installed by any contributor, not only its author. It must not assume the user carries any particular personal runtime configuration or imported conventions — plan-mode rules, house footnote style, workflow preferences — that the open spec does not guarantee. Any convention the skill relies on must be anchored in always-loaded repo context (a `CLAUDE.md` or `AGENTS.md` alongside the skill, or a KI-SHAPE-7 companion) so it applies for every user. Degrading gracefully when personal config is absent is the minimum; anchoring the requirement explicitly is the standard. (rubric **KI-SHAPE-10**)

A **governance skill** — one that holds a house standard — exposes a common mode set so a reader moves between skills without relearning: the universal four are **AUDIT** (check an artifact against the standard), **CONFORM** (bring an existing artifact into line), **EDUCATE** (render the catalogue's guidance), and **REFRESH** (re-anchor the standard to its sources). Modes beyond the four are fixed in meaning where they appear: **NEW** authors one new instance into a collection the skill governs (present only in collection skills, presupposing EDUCATE, never a substitute for it), **OPTIMISE** pushes a compliant artifact toward excellent, and operational modes serve a skill's own domain (the `ki-kb` note-ops — DIGEST / EXTRACT / QUERY / SAVE / UPDATE). The modes live under a single `## Operating modes` H2, each as a `### Mode <NAME>` H3 or — for router skills — rows of a `| Mode | … |` dispatch table, with every `argument-hint` verb present in that section (rubric **KI-SHAPE-12**, **KI-SHAPE-13**). A governance skill publishes its complete rubric from `scripts/rubric/items/index.ts`; `ki` resolves and hosts it from a verified installed compatible harness, and REFRESH remains harness-only. Legacy `scripts/govern.ts`, `scripts/educate.ts`, `scripts/audit.ts`, and `scripts/conform.ts` runners are retired. Process and scoped skills use only the modes appropriate to their own contract. (ki-agentic-harness README, ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-007, [compatible harness contract](../../../../docs/decisions/references/compatible-harness-contract.md))

Every top-level Markdown file in a Knowledge Islands skill's `references/` directory belongs to this closed vocabulary:

- `standards-<topic>.md` holds a normative standard, process doctrine, artifact format, or shared mode contract.
- `rubric.md` is the generated readable publication of executable pass/fail criteria.
- `sources.md` tracks provenance and refresh state.
- `exemplars.md` holds optional worked examples.
- `mode-<verb>.md` holds exactly one independently invoked procedure; combined names such as `mode-audit-conform.md` are split, and each procedure states its own preconditions.

A skill includes only the classes it needs. A bare `standards.md`, `<topic>-standards.md`, nested `references/` content, and ad hoc `guide`, `contract`, or `format` filenames are not alternate classes. Templates and other reusable output material live under `assets/`. The executable catalogue remains `scripts/rubric/items/index.ts`; domain-specific executable helpers remain under `scripts/`. This is a convention of the `ki-*` set rather than a requirement on every Agent Skill, so a skill outside a Knowledge Islands repo is exempt for now (rubric **KI-SHAPE-6**). (ki-agentic-harness README)

When a KI-governed skill needs durable, generated local state that is neither a source script nor a reference, it stores it in a root `.ki-meta/` directory. This is the one KI-specific addition to the portable `references/` / `scripts/` / `assets/` support-directory vocabulary; it remains local implementation state, not a second skill root. (rubric **LAY-3**)

## 3. Cross-skill collision

Most conventions audit one `SKILL.md` in isolation; these check it against its **siblings** (so an audit runs the linter over the whole set, not one skill). No two descriptions in a set should declare the **same quoted trigger phrase** — two skills firing on the identical phrase compete at selection time. Beyond exact strings, where two skills could plausibly fire on one request, **each** description names the other as the off-ramp — the reciprocal `ki-mcp` ↔ `ki-skills` pattern; a one-directional guard is a half-fix. This promotes the per-skill _option_ of naming non-triggers into a **set-level requirement** wherever real overlap exists. (COMMUNITY, ki-agentic-harness README)

## 4. Runtime portability

A portable contract describes behaviour without assuming one vendor, agent runtime, runtime-specific home, or interaction model. Name a runtime only when the text makes its boundary explicit: a skill whose entire purpose is runtime binding declares `ki-runtime-binding: true` in its frontmatter; a mixed contract puts the bounded material beneath a `##`–`###### Runtime binding` heading; tracked `references/sources.md` material is attribution rather than instruction; and a same-line comparison may name two or more runtimes to describe their difference. Do not use these boundaries to preserve incidental historical wording: move or rewrite a genuine portable rule until it has no vendor-specific premise. (KI)
