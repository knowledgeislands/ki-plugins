# Rubric authoring standard

This is the target model for turning a governance standard into an executable rubric.

`ki-skills` proves the model as the self-governing root of the governance-skill system; later skills adopt it one at a time rather than inventing their own checker architecture, so they are focused on the what, how and why, not the how-to-build.

Use this guide when creating or refactoring a governance skill's rubric implementation.

## Contents

- [Normative language](#normative-language)
- [The knowledge chain](#the-knowledge-chain)
- [Target layout](#target-layout)
- [Rubric families and items](#rubric-families-and-items)
- [Maintaining a rubric](#maintaining-a-rubric)
- [Target type shape](#target-type-shape)
- [Rubric execution and phasing](#rubric-execution-and-phasing)
- [Generated publication and optional projections](#generated-publication-and-optional-projections)
- [Context and evidence](#context-and-evidence)
- [Host and session boundary](#host-and-session-boundary)
- [Educate boundary](#educate-boundary)
- [Host findings and reporting](#host-findings-and-reporting)
- [Generated rubric publication](#generated-rubric-publication)
- [Verification](#verification)
- [Review boundary](#review-boundary)
- [Implementation units](#implementation-units)
- [Rollout checklist](#rollout-checklist)

## Normative language

Uppercase normative terms such as `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` use the BCP 14 meanings defined by [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

Lowercase forms are ordinary prose.

## The knowledge chain

```text
sources → standard → structured rubric
                          ├──────→ generated rubric.md
                          └──────→ ki rubric host
                                     ├─ AUDIT actions by phase
                                     └─ CONFORM actions by phase
                                                ↓
                                      host-owned findings
                                                ↓
                                      terminal presentation
```

Each layer has one responsibility:

- `sources.md` records the provenance behind the standard and when moving sources were last reviewed.
- `standards-<topic>.md` files state what good looks like and why, separating portable, house, and rubric-authoring concerns.
- Structured rubric families and items make the standard assessable. They are the sole authored source for criterion identity, classification, prose, source citations, mode phasing, and executable behaviour.
- The `ki` rubric host validates the catalogue and session, plans and executes mechanical AUDIT or audit-gated CONFORM actions, derives fixed findings, and owns safe publication. It MUST NOT define criteria of its own or pretend to evaluate judgment aspects.
- Host reporting renders the resulting findings without changing what was checked.
- `rubric.md` is a deterministic human-readable publication generated from the structured rubric. It is never a second authored source of truth. It contains a statement at the start of it to make this clear to readers and agents.
- `exemplars.md` shows representative good outcomes; it does not define requirements.

## Target layout

```text
scripts/
  shared/
    rubric.ts                  # materialised compile-time rubric contract
    rubric.test.ts
  rubric/                      # private implementation for this skill
    items/
      index.ts                 # sole default-exported skill catalogue
      <family>.ts              # one complete RubricFamily
    contexts/
      <evidence>.ts            # domain evidence and safe draft capabilities
      subjects.ts              # operation-scoped RubricSession
assets/
references/
  standards-<topic>.md         # one or more normative references
  rubric.md                    # generated readable publication
  sources.md                   # provenance and refresh state
  exemplars.md                 # optional worked examples
  mode-<verb>.md               # optional independently invoked procedure
```

The host loads only `scripts/rubric/items/index.ts`; a governed skill does not ship its own AUDIT, CONFORM, checker, or reporter command surface.

Private reusable implementation lives in `scripts/internal/`. Modules published through `ki-shared-modules` and local copies materialised through `ki-shared-dependencies` live in `scripts/shared/`.

Every non-test TypeScript file directly under `scripts/` is a deliberate public skill command. Retain one only when its capability sits outside governed rubric execution and it has a clear purpose, useful `--help`, explicit error handling, and focused tests. Move private implementation to `scripts/internal/`, compile-time shared modules to `scripts/shared/`, and rubric behaviour to `scripts/rubric/`; remove wrappers, one-off migration helpers, and validators whose capability belongs to `ki` or to the rubric host.

Another skill receives a declared module at `scripts/shared/<module>.ts` and imports only that local copy. `ki-skills` uses its owned rubric module directly from the same location; it never materialises its own module back into itself.

The one target shared module is `scripts/shared/rubric.ts`. It is materialised only to let a skill's TypeScript catalogue compile and type-check without crossing the skill-root boundary. Generic execution, finding conversion, progress, ordering, transactions, rollback, and reporting belong to `tools-ki` and MUST NOT be copied into a skill.

A dependent governance skill declares `ki-shared-dependencies: [ki-skills:rubric]` and imports only its local `scripts/shared/rubric.ts` copy.

## Reviewing structural consistency

When reviewing a governed skill beyond its policy content, compare it with the strongest relevant exemplar rather than mechanically copying a directory layout.

Assess these boundaries, recording whether each difference is intentional concern-specific design, harmless variation, or a contract, safety, testability, or ownership defect:

- **Governed entrypoint** — `scripts/rubric/items/index.ts` is the sole host-loaded entrypoint and default-exports one `SkillRubricDefinition`.
- **Rubric structure and publication** — contexts, family catalogues, generated `references/rubric.md`, provenance, citations, and exact publication-parity evidence remain aligned with the structured catalogue.
- **Reference set** — every top-level Markdown reference is a justified `standards-<topic>.md`, `rubric.md`, `sources.md`, `exemplars.md`, or one-mode-only `mode-<verb>.md`; templates live in `assets/`, and nested, combined-mode, or ad hoc guide, contract, and format names are absent.
- **Public script surface** — every `scripts/*.ts` file is still a necessary public command with help, error handling, and focused tests; private, shared, rubric, and host-owned behaviour lives at its proper boundary.
- **Host boundary and shared modules** — private domain code stays local; a consumer imports only the materialised rubric type contract; generic runtime behaviour remains in `tools-ki`.
- **Safe writes and external boundaries** — mutation scope, dry-run, idempotence, symlink handling, atomicity, and subprocess boundaries have evidence proportionate to their risk.
- **Generated publication** — the source catalogue and tracked `references/rubric.md` agree exactly.
- **Documentation, ownership, and evidence** — standards, provenance, implementation location, and focused tests identify the same owner; a test proving a private implementation contract normally lives with that implementation.

Do not make test-file count, context count, renderer style, or other cosmetic similarity a requirement. Promote a recurring pattern to a rubric item only when its policy is genuinely shared and its mechanical evidence can be made trustworthy; otherwise retain it as review guidance or a focused follow-up.

## Rubric families and items

A family groups criteria that assess one coherent concern, such as `NAME`, `DESCRIPTION`, or `KI-SHAPE`.

The family catalogue owns its stable family code, readable title, standard section, explanatory introduction, ordered item list, and any presentation metadata needed to reproduce the readable rubric.

The files under `scripts/rubric/items/` MUST have one uniform responsibility:

- `index.ts` is catalogue wiring only. It imports each ordered family and default-exports the complete `SkillRubricDefinition`. It MUST NOT define rubric items, family metadata, execution callbacks, evidence builders, adapters, casts, or write capabilities.
- Each family lives in one semantic `<family>.ts` file and exports one complete `RubricFamily`, such as `NAME`. Its rubric-item constants are private implementation details unless a concrete external consumer requires a public item API.
- A family file owns that family's rule policy and pure item-level helpers. Constants, helpers, and types used only by that family remain private.
- Filesystem discovery, parsing shared by several families, target inspection, and CONFORM write capabilities belong under `scripts/rubric/contexts/`, not in an item file.
- A family collection is imported by `index.ts`; another family file MUST NOT import it as an implicit extension mechanism.

Tests select an item through the exported family by stable code or position. Exporting every item merely for tests expands the public module surface and is not required.

Each rubric item owns:

- a stable semantic `code`;
- a concise `title` suitable for `${code}: ${title}` presentation;
- the complete normative `description` needed by the generated rubric;
- its cited `sources`;
- a `MECHANICAL` aspect with its required AUDIT execution and optional safe conform action;
- a `JUDGMENT` aspect with its concrete review `prompt`; or
- both aspects when one stable rule genuinely has deterministic and judgment concerns.

A hybrid rule remains one item with one stable code rather than duplicating its shared identity and prose across separate entries.

A deterministic check is mechanical even when it has not yet been implemented; absence of implementation is work to finish, not a reason to relabel it as judgment.

A judgment aspect carries a concrete review prompt for a later agent or reviewer.

AUDIT and CONFORM MUST NOT claim to evaluate it mechanically.

The item module owns its rule policy.

Helpers, item constants, and types used only by one family remain private in that family module; the module exports only its complete family.

Helpers, constants, and types used only by one item action or session builder remain private there.

Skill-specific behaviour shared by both commands belongs in `scripts/rubric/contexts/`; only behaviour deliberately reusable across other skills belongs in `scripts/shared/`.

## Maintaining a rubric

Once a skill conforms to this structure, ordinary maintenance SHOULD be isolated to the rule being changed:

1. Update the rubric item in its semantic family file.
2. Add or refine focused context evidence only when the rule needs information or a safe write capability that the existing context does not provide.
3. Regenerate `references/rubric.md` from the canonical TypeScript catalogue.
4. Run the skill's focused tests, then exercise its catalogue through the live `ki` host.

The catalogue wiring, session construction, and generic `ki` host SHOULD remain unchanged during an ordinary rule adjustment.

A change MAY cross those boundaries only when it introduces a genuinely new rubric family, requires a reusable context capability, or deliberately changes the shared rubric or host contract.

This boundary is the payoff from codifying the rubric: most future work becomes a local policy change with local evidence and tests rather than another edit to a large audit or conform program.

## Target type shape

The shared rubric model should be small enough to understand from its public types.

The names below are illustrative TypeScript, but their responsibilities are fixed:

```ts
type RubricMode = 'audit' | 'conform'
type RubricPhase =
  | 'PREPARE' // establish prerequisites
  | 'INSPECT' // evaluate evidence
  | 'PRIMARY' // change primary governed artifacts
  | 'DERIVED' // rebuild artifacts derived from primary state
  | 'NORMALISE' // apply final formatting or canonical ordering

type ViolationLevel =
  | 'FAIL' // required criterion; blocks on failure
  | 'WARN' // recommended criterion; does not block

type RubricExecution<Context, Result> = {
  phase: RubricPhase
  run: (context: Context) => Result
}

type RubricType = 'MECHANICAL' | 'JUDGMENT'

type MechanicalRubric<Context> = {
  level: ViolationLevel // default for VIOLATION outcomes
  overrideLevels?: readonly ViolationLevel[] // exceptional alternatives this item explicitly permits
  heuristic?: boolean // presentation metadata for deterministic evidence with known limits
  audit: RubricExecution<Context, readonly AuditOutcome[]>
  conform?: RubricExecution<Context, void>
  conformOn?: readonly 'INFO'[]
}

type JudgmentRubric = {
  prompt: string
}

type RubricItemBase = {
  code: string
  title: string
  description: string
  sources: readonly string[]
}

type RubricItem<Context> = RubricItemBase &
  ({ mechanical: MechanicalRubric<Context>; judgment?: JudgmentRubric } | { mechanical?: never; judgment: JudgmentRubric })
```

Every item contains a mechanical aspect, a judgment aspect, or both; it MUST contain at least one.

Its published `RubricType` values are derived from the aspects it carries rather than repeated as authored metadata.

The type and catalogue validator rejects an item with neither aspect.

The criterion's default violation level belongs to the mechanical item; callbacks do not repeat it alongside every result.

When one stable criterion intentionally distinguishes an exceptional violation from its ordinary severity, its mechanical aspect MAY declare the alternative in `overrideLevels`, and that `VIOLATION` outcome MAY select it. An undeclared override is invalid. Use this only to preserve one rule's established meaning; it is not a substitute for splitting unrelated rules.

Both modes return one common outcome shape.

AUDIT outcomes are always read-only; the checker derives `FIXED` from a verified conform rather than accepting it from a rubric callback:

```ts
type OutcomeStatus = 'PASS' | 'VIOLATION' | 'NOT_APPLICABLE' | 'INFO' | 'FIXED'

type RubricOutcome<Status extends OutcomeStatus> = { status: Status; message: string; subject?: string } & (Status extends 'VIOLATION'
  ? { level?: ViolationLevel }
  : { level?: never })

type AuditOutcome = RubricOutcome<Exclude<OutcomeStatus, 'FIXED'>>
```

`VIOLATION` means the criterion remains unmet; the checker maps it to the outcome override or the item's default `ViolationLevel` in the canonical response.

The other mechanical outcomes map directly to `PASS`, `NOT_APPLICABLE`, or `INFO`.

`INFO` is neutral context rather than a violation, so it does not belong in `ViolationLevel`.

An AUDIT execution returns an outcome array; one subject may legitimately yield no outcomes when it contains no applicable evidence.

During CONFORM, the host first audits every applicable subject. It then runs eligible conform actions in declared phase, family, and item order against the operation-scoped session.

`VIOLATION` makes a conform eligible by default; `INFO` does so only when the item explicitly declares `conformOn: ['INFO']`.

The conform action mutates only the session's private draft and returns nothing. The session emits one final proposal after all eligible actions, while the host alone publishes it and derives `FIXED` from a clean post-audit.

An item with no conform action runs its required AUDIT execution read-only, so every mechanical item remains represented.

A judgment aspect has no executable callback.

AUDIT and CONFORM MUST NOT emit a synthetic finding for it; the checker summary reports how many selected items carry a mechanically unevaluated judgment aspect.

A hybrid item executes its mechanical aspect normally and also contributes one to that judgment count.

The family and definition layers carry metadata and connect each family to one focused context facet:

```ts
type RubricFamily<RootContext, FamilyContext> = {
  code: string
  title: string
  description: string
  standard: string
  selectContext: (root: RootContext) => FamilyContext
  items: readonly RubricItem<FamilyContext>[]
}

type RubricDefinition<RootContext> = {
  name: string
  concern: string
  families: readonly RubricFamily<RootContext, unknown>[]
}

type RubricSubject<RootContext> = {
  context: () => RootContext
  families: readonly string[]
  subject?: string
}

type RubricSession<RootContext> = {
  subjects: readonly RubricSubject<RootContext>[]
  proposal: () => ConformProposal
}

type SkillRubricDefinition<RootContext> = RubricDefinition<RootContext> & {
  contract: 1
  createSession: (options: RubricContextOptions) => RubricSession<RootContext>
}
```

The concrete implementation may use a typed family helper to preserve heterogeneous context inference; it must not replace these focused contexts with `unknown` inside item callbacks.

The definition is the one object passed to host validation, execution, and rubric-publication rendering.

## Rubric execution and phasing

A rubric execution is the executable side of a mechanical rubric aspect.

A mechanical item always declares an AUDIT execution and may add a conform action.

A judgment aspect declares its review prompt and has no execution or phase.

Each declared execution carries:

- its mode, derived from whether it is the item's `audit` or `conform` element;
- a phase from the shared ordered vocabulary;
- the callback that evaluates or changes the subject.

The shared phase order is `PREPARE → INSPECT → PRIMARY → DERIVED → NORMALISE`.

- `PREPARE` establishes prerequisites
- `INSPECT` evaluates evidence
- `PRIMARY` changes primary governed artifacts
- `DERIVED` rebuilds artifacts derived from primary state
- `NORMALISE` applies final formatting or canonical ordering.

AUDIT executions normally inspect, but the phase remains explicit so composed work has one planning model.

Conform actions declare where their safe action belongs rather than relying on wrapper order or incidental source order.

The `ki` host selects item actions for the requested mode and runs them deterministically by phase, then by stable family and item order.

Criterion codes remain finding identity; execution identity is derived from the criterion and mode rather than maintained as a second unrelated name.

The structured rubric is the authored source of phasing.

Several actions MAY touch the same file. They act in order on one session-owned draft, and the session emits one final write for that file. A skill MUST NOT dispatch or coalesce behaviour by inspecting criterion codes; any item-specific behaviour belongs on the item itself.

## Generated publication and optional projections

The structured TypeScript definition is the authored source.

The required projection is the readable `references/rubric.md` publication.

It is generated from the structured catalogue, begins with a conspicuous notice that the canonical definitions live under `scripts/rubric/`, and has an exact read-only parity check.

A versioned machine projection of rubric metadata or an execution schedule MAY be added when a concrete consumer needs to load the catalogue without importing callback code.

Such a projection is generated, never authored, and its path and responsibility-based name are decided by that integration rather than fixed prematurely here.

It MUST contain no callbacks or filesystem paths to source modules, and it MUST have an exact parity gate against the structured catalogue.

No additional machine projection is a prerequisite for proving the root `ki-skills` catalogue unless a concrete consumer cannot use the loaded definition.

## Context and evidence

Rubric items receive prepared domain evidence rather than reading files, parsing frontmatter, invoking the reporter, or knowing CLI arguments.

The skill's `createSession` implementation discovers subjects, prepares each subject's domain evidence once, and exposes a stable context function. The host selects only the subjects declaring the current family code.

Contexts are organised by audited granularity and responsibility rather than by creating one thin file for every item:

- skill-level evidence describes one skill and its parsed artifacts;
- document-level evidence describes a Markdown or frontmatter document;
- collection-level evidence describes relationships across several skills;
- conform capabilities expose the exact safe writes an item may request; and
- specialised evidence supports an active concern without inflating every item context.

The root context names the available facets, but each subject supplies only those required by its declared families. It MUST NOT construct a repository-wide object full of synthetic empty defaults merely to satisfy unrelated families.

Dispatch passes only the relevant facet to a family and fails closed when subject routing omitted it; a family does not accept a repository-wide optional mega-context.

Support modules define the neutral data types they produce and never import types back from the families that consume them.

Read and parse each immutable artifact once per session.

Audit context factories are read-only.

Conform retains one mutable working model and any raw form needed for faithful persistence.

The host may request a subject's context several times during audit and conform. The subject returns the same prepared context object and operation-scoped draft capabilities each time, so evidence is not reconstructed and ordered actions observe earlier changes. Post-publication verification creates a new session and re-reads persistent state.

Name an extracted function when it exposes a domain operation, defines a useful boundary, or removes repeated error-prone mechanics.

Keep a one-use expression inline when extracting it would only hide straightforward work.

## Host and session boundary

The skill-owned boundary should read as a short construction sequence:

```text
receive host options
  → discover domain subjects
  → prepare each subject's focused context once
  → expose a stable context function
  → retain operation-scoped drafts for conform
  → return subjects plus one final proposal function
```

`tools-ki` owns command arguments, repository resolution, catalogue loading, contract validation, planning, progress, finding conversion, dry-run, publication, rollback, and post-conform re-audit.

The skill owns subject discovery, evidence, family selection, and draft capabilities. It contains no generic reporter, transaction, or progress implementation.

A conform item receives only the domain capability it needs and changes only the session draft. It MUST NOT write to disk, launch a process, return a write proposal, or select behaviour from its own criterion code.

The session proposal returns the final changed files and bounded commands once, after all item actions. Host validation and transaction rules remain authoritative.

An audit callback returns typed outcomes.

A conform callback receives only the capabilities it needs, performs its declared safe draft action, and returns nothing; the host derives the final finding from the post-audit.

Judgment work is not emitted as synthetic findings or accumulated in a private TODO collection.

The response summary MUST report the number of selected rubric items carrying a judgment aspect that AUDIT or CONFORM did not mechanically evaluate.

## Educate boundary

EDUCATE is a sibling universal mode, not a checker mode.

AUDIT evaluates governed state and CONFORM safely remediates existing governed state; EDUCATE provisions or scaffolds the subject and its mechanical footprint so those checker modes can operate.

An EDUCATE implementation may eventually consume rubric-derived templates or invoke `ki repo conform` after establishing a minimum subject, but it does not become a second rubric host merely to reuse orchestration.

The retired `scripts/educate.ts` wrapper MUST NOT be restored as a compatibility path. The active plan decides whether each former scaffolding concern belongs in bootstrap, a separate `ki` command, or deliberate retirement.

## Host findings and reporting

Finding conversion and reporting are host infrastructure, not a policy engine.

`tools-ki` resolves criterion identity from the loaded catalogue, validates every audit outcome, converts outcomes to `FAIL`, `WARN`, `INFO`, `NOT_APPLICABLE`, or `PASS` findings, calculates summaries, derives `FIXED` findings after re-audit, and exits non-zero exactly when a `FAIL` remains.

The host does not parse `references/rubric.md`, invent criterion policy, read skill-specific evidence directly, or accept a skill-owned renderer.

Presentation may render `${code}: ${title}`, subjects, progress, totals, or another host-supported view, but display choices never change which items execute or whether a violation blocks.

A skill adopts the host contract atomically. There is no Markdown-policy fallback, legacy adapter, per-skill reporter, or dual execution path.

## Generated rubric publication

The readable `references/rubric.md` remains useful for people and agents, but it is generated rather than maintained alongside the TypeScript catalogue.

Its first content is a generated notice naming `scripts/rubric/` as the canonical definition and directing changes there.

The renderer uses family metadata and ordered item metadata to reproduce:

- family headings and introductions;
- criterion codes, titles, full descriptions, and classification;
- mechanical, judgment, hybrid, and heuristic presentation;
- source citations and standard links; and
- stable item ordering.

The generated file carries a clear generated marker.

`ki skill rubric <skill>` verifies the tracked publication against the catalogue; `ki skill rubric <skill> --write` writes it.

Runtime code never parses the generated Markdown back into policy.

An unmigrated skill remains broken against the new contract until it is cut directly to the final catalogue shape; compatibility execution is not retained.

## Verification

Tests sit beside the domain module they cover, while generic host behaviour is tested in `tools-ki`.

At minimum, a structured rubric proves:

- every code is unique and belongs to the expected family;
- every item has complete identity, source, and classification metadata;
- every mechanical execution declares a valid phase;
- execution order is deterministic by phase and catalogue order;
- family modules expose only their complete family unless a non-test consumer proves another public export is needed;
- the index has one default export and contains no adapters, item policy, casts, or write planning;
- each session subject names only declared families and supplies focused evidence;
- audit is read-only; conform actions mutate only the session draft;
- multiple actions affecting one file produce one final proposal in deterministic order;
- the host refuses malformed sessions, outcomes, proposals, escaping writes, conflicts, and publication races;
- post-conform re-audit, not an item callback, determines which findings are fixed;
- generated `rubric.md` exactly matches the structured catalogue; and
- the materialised rubric type contract behaves the same as its source module.

## Review boundary

The root exemplar refactor changes `skills/keystone/ki-skills/` and the generic contract/runtime in `tools-ki`.

It includes the shared rubric type module, the `ki-skills` domain catalogue, sessions and contexts, its generated rubric publication, and focused tests. `tools-ki` owns the corresponding host contract and generic runtime tests.

It does not migrate another skill.

Those consumers are addressed only after the root catalogue, family, session, context, and host boundaries pass review.

The target contains no legacy aliases, compatibility adapters, dual response names, or Markdown policy fallback.

## Implementation units

Complete these units in order, keeping each independently reviewable.

1. **Self-contained families.** Make every semantic family module return a complete `RubricFamily`; keep individual item constants private.
2. **Single catalogue entrypoint.** Default-export one `SkillRubricDefinition` from `items/index.ts` with ordered families and `createSession`.
3. **Item-owned behaviour.** Put every rule's audit and optional conform behaviour on that item; remove code-based dispatch and adapter mappers.
4. **Session boundary.** Build focused subjects, retain one mutable conform draft per governed artifact, and return one final proposal.
5. **Host runtime.** Keep loading, validation, ordering, progress, reporting, transactions, rollback, and re-audit in `tools-ki`.
6. **Generated publication.** Render and parity-check `references/rubric.md` from the default export.
7. **Exemplar verification.** Prove real `ki repo audit --skill ki-skills` and `ki repo conform --skill ki-skills --dry-run`, including two ordered items touching one file.

Do not migrate another skill until these seven units and the context review pass for `ki-skills`.

## Rollout checklist

Apply the model to one governance skill at a time after `ki-skills` proves it.

Use an exemplar-first rollout. Finish and review `ki-skills`, record the per-skill defect inventory in the active plan, then cut each remaining skill directly to the final shape. Do not retain a transitional adapter merely to keep an intermediate state executable.

- Confirm the standard and source list are current enough to serve as inputs.
- Classify every Markdown reference into the closed Knowledge Islands vocabulary; remove or relocate anything outside it.
- Justify every top-level `scripts/*.ts` public command and remove or relocate wrappers, validators, and private helpers.
- Codify every criterion into ordered, self-contained families without changing its meaning or stable code.
- Export each complete family, not its individual item constants.
- Declare each mechanical item's AUDIT and optional conform action with their phases in the same catalogue.
- Add the family metadata needed to render the readable rubric exactly.
- Build operation-scoped subjects and focused contexts; keep policy in item modules.
- Use `createSession`; do not retain `createContext`, family mappers, `LegacyFamily` casts, catalogue barrels, or a separate execution wrapper.
- Move generic execution and reporting to `tools-ki`; vendor only the rubric type contract required for compilation.
- Make conform actions change only session-owned drafts and return one coalesced final proposal.
- Keep item-specific behaviour on the item; never branch on criterion codes elsewhere.
- Generate `rubric.md` and add an exact parity gate before retiring Markdown as an authored input.
- Test the source catalogue through `ki repo audit`, `ki repo conform --dry-run`, and the generated-publication command.
- Migrate one skill atomically; broken intermediate states are acceptable inside the commit sequence, but the committed unit contains no compatibility path.
- Record any reusable improvement in this guide before moving to the next skill.
