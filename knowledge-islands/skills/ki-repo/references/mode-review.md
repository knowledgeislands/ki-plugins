# Repository REVIEW procedure

_On-demand REVIEW procedure for `ki-repo`. The repository compliance standard and universal modes live in [`SKILL.md`](../SKILL.md); REVIEW inspects purpose, architecture, human comprehension, and implementation without turning judgement into compliance rules._

## Contents

- [Purpose](#purpose)
- [Reference structure](#reference-structure)
- [How to use it](#how-to-use-it)
- [Review invocation](#review-invocation)
- [Reusable assessment prompt](#reusable-assessment-prompt)
- [Review method](#review-method)
- [Finding identifiers and routes](#finding-identifiers-and-routes)
- [Assessment output](#assessment-output)
- [Assessment lenses](#assessment-lenses)
- [Review records and closure](#review-records-and-closure)
- [Checklist evolution](#checklist-evolution)

## Purpose

This procedure captures the high-level judgement a person applies to each repository: whether it meets its needs and fulfils its place in the wider ecosystem. It externalises each repository's stable baseline so its purpose, settled state, and outstanding change do not have to be held in personal memory. It moves from ecosystem fit and repository responsibility through architecture and implementation to detailed evidence and final disposition.

`Manual` means the review is deliberately invoked and interpreted, not that a person must perform every step. A person may run it directly or ask an agent to gather evidence, apply selected lenses, and draft findings for human judgement.

The procedure supplies default lenses for an ad hoc review. It is not a universal score, an automatic compliance standard, or permission to change the repository.

Each item is atomic and answerable yes or no. An item that needs a paragraph to answer is hiding a second item.

Items were derived from recurring review requests across the estate between August and September 2026.

## Reference structure

The structure of this reference is part of its usability. Preserve this progression when revising it: purpose and boundary, invocation, reusable prompt, method and routing, output contract, broad-to-narrow assessment lenses, review-record lifecycle, and checklist evolution.

Do not append a new idea wherever it is first noticed. Place it at the broadest appropriate level, keep related questions together, and preserve the movement from ecosystem responsibility towards detailed implementation evidence. Change the prompt or output contract only when the way a review is commissioned or reported has changed.

## How to use it

Complete Review invocation first. Apply Review method throughout, then start at Repository purpose and work in order through each applicable lens. Record why any section does not apply, use Assessment output to report the result, and follow Finding identifiers and routes plus Review records and closure before creating or pruning anything durable.

A failed item is a finding, not a blocker. Record it, decide whether it lands now or becomes a roadmap item, and move on.

Prefer deleting an item that never fires over keeping it out of completeness.

## Review invocation

Complete this record before inspection. Resolve any material unknown with the reviewer rather than silently assuming it.

```text
Repository: <absolute path>
Revision: <commit, tag, or explicit live working state>
Purpose: <decision this assessment should support>
Scope: <full review or named checklist sections>
Out of scope: <explicit exclusions>
Readers: <intended audience>
Time horizon: <current state, release, or longer-term direction>
Depth and budget: <broad scan, standard review, or deep assessment; any practical limit>
Comparison baseline: <declared stable state, previous assessment, release, or none>
Focus questions: <repository-specific tensions or uncertainties the review must investigate>
Required conclusions: <decisions or suitability judgements the assessment must reach>
Authority: read-only
Required evidence: <repository surfaces and external sources>
Permitted live or private evidence: <sources and access boundary>
Privacy constraints: <values or material that must not be exposed>
Verification and measurements: <exact commands or permission to discover them>
Assessment destination: <conversation or durable path>
Retain review evidence: <yes or no>
```

## Reusable assessment prompt

The invocation record defines the review, but is not a sufficient agent prompt on its own. Copy this prompt, replace its placeholders, and include the completed invocation record. Preserve repository-specific focus questions: they are what turn a generic health check into a useful assessment.

```text
Perform a detailed, read-only, judgement-led assessment of:

<absolute repository path>

Use the `ki-repo` Repository REVIEW procedure at:

<absolute checklist path>

Treat the completed Review invocation below as the assessment contract:

<completed invocation record>

This is an assessment, not an implementation task. Do not edit files, change repository or external state, create work records, commit, push, publish, deploy, or apply personal configuration.

Start by reading the repository's AGENTS.md and every applicable local skill or governance instruction. Establish the repository's delineated responsibility in the wider ecosystem, its claimed stable baseline, and the decision this assessment must support before judging details.

Build an evidence inventory proportionate to the stated scope. Inspect the relevant repository orientation, current work, Decision Records, Specifications, Guides, skills, implementation, tests, generated and public surfaces, toolchain, release state, and any permitted live or private evidence. Do not infer quality from the presence of these surfaces alone.

Use independent review tracks for:

1. ecosystem fit, product purpose, responsibility, and applicability;
2. human comprehension, documentation, knowledge consolidation, and configuration experience;
3. engineering architecture, implementation maturity, safety, verification, operations, and release readiness.

Apply only the tracks and checklist sections relevant to the invocation, and say why anything material is not applicable. Reconcile the tracks yourself against the actual evidence. Do not merely report mechanical conformance or repeat repository claims.

Investigate every focus question in the invocation. Pay particular attention to contradictions between declared intent, documentation, implementation, tests, released artefacts, and permitted live state. Distinguish defects, intentional current boundaries, and future capabilities. Preserve strong choices as explicitly as you identify weaknesses.

Run the specified read-only verification and measurements. Where the invocation permits discovery, identify and run the repository's normal verification gate plus representative measurements needed for the required conclusions. Record each command and result. Do not expose secrets or unnecessary private values.

Label material claims as observed, inferred, or user-confirmed. Ask the reviewer when unresolved intent, ownership, acceptable risk, compatibility, or operational constraints could materially change a finding; otherwise state the uncertainty and continue. Give findings stable identifiers, consequences, confidence, and evidence with clickable file links and line numbers where possible.

Produce the Assessment output sections from the checklist in their stated order. Answer every required conclusion directly, recommend a durable route for each material finding without authorising implementation, and end with a disposition stating what changed, where evidence remains, and what awaits human confirmation.
```

## Review method

- [ ] Agree the review's purpose, repository boundary, intended readers, time horizon, constraints, and the level of change it may recommend before inspection.
- [ ] State what is out of scope. A broad request such as "review the architecture" is not permission to rewrite the repository, create Decision Records, or start delivery plans.
- [ ] If the review could turn on an unspoken product, security, ownership, or compatibility choice, record that uncertainty and interview the user before drawing a conclusion.
- [ ] Read the repository's `AGENTS.md` and applicable KI skills before inspecting governed material.
- [ ] Read the repository orientation and current work first: `AGENTS.md`, `README`, `.ki.toml` where present, canonical roadmap material, Decision Records, feature definitions, Specifications, Guides, and the implementation surfaces in scope.
- [ ] Inventory legacy repository-local runtime surfaces when present, including `.claude/commands/` and `.claude/memory/`, rather than assuming the current canonical structure contains all operative guidance.
- [ ] Read every Decision Record in the agreed scope rather than inferring collection quality from its index or a sample.
- [ ] Collect inspectable evidence rather than impressions, covering architecture and dependency boundaries; data flow and extension points; source, build, test, and runtime entry points; configuration ownership, secrets, migration, and failure paths; documentation correspondence; maintainability signals; and what each relevant check does not establish.
- [ ] Inspect live configuration, runtime state, and external source material only when the invocation permits it.
- [ ] A broad review uses independent product, human-experience, and engineering lenses before reconciling findings.
- [ ] Use only the lenses that fit the agreed scope. Architecture lenses include boundaries, ownership, data flow, extension points, failure and recovery, security, operations, and governance. Implementation lenses include correctness, clarity, cohesion, dependency direction, tests, automation, and documentation.
- [ ] Record every verification or measurement command and its result.
- [ ] Reconcile documentary claims against implementation and permitted live evidence.
- [ ] Do not treat mechanical conformance as sufficient evidence of product quality or fitness.
- [ ] For each material observation, state the consequence and confidence level. Do not promote a style preference into a finding without a concrete cost, risk, or missed capability.
- [ ] Label each material claim as observed, inferred, or user-confirmed.
- [ ] Give each material finding a stable identifier.
- [ ] Cite material evidence with clickable file links and line numbers where possible.
- [ ] State each material finding's consequence and confidence.
- [ ] Pause and ask the user whenever a finding depends on uncertain intent, priority, ownership, acceptable risk, compatibility, or operational constraints.
- [ ] Present the evidence, competing interpretations, and consequence of each. Do not select an interpretation merely because it enables a clean recommendation.
- [ ] Propose a durable route for each material finding or explicitly recommend no action.
- [ ] Distinguish defects, intentional current boundaries, and future capabilities.
- [ ] Preserve privacy by reporting only the values and detail required to support a finding.
- [ ] Make no repository or external-state change unless the invocation grants separate authority.

## Finding identifiers and routes

Number findings within a review as `REV-<NNN>-F<NNN>`. Each finding contains its evidence, consequence, confidence, classification, and one explicit route:

- **Plan** - bounded delivery work that belongs to a canonical roadmap item and, when substantial, a `ki-plan` plan.
- **Decision Record** - a durable why that remains useful after the delivery work and review evidence are gone.
- **Feature definition** - a durable behavioural what.
- **Guide** - durable operational how.
- **No action** - retain the observation in the review result only, with its rationale.

Plans may cite finding identifiers; findings may cite their delivery plan. A review never opens, readies, or executes a plan without the user's separate explicit approval under `ki-plan`.

## Assessment output

Use these sections in order. Omit one only when the invocation records why it does not apply.

1. **Outcome summary** - give the decision-maker's concise overall judgement.
2. **Scope and evidence** - identify the repository revision, evidence examined, verification results, exclusions, and limitations.
3. **Maturity scorecard** - give a short judgement for every reviewed product area without manufacturing a numerical score.
4. **Current operational state** - report concrete counts, migration state, live usage, and release state when applicable.
5. **Strongest choices to retain** - identify the architecture, product, and operating decisions that should be preserved.
6. **Material uncertainties** - record questions, competing interpretations, and reviewer answers that affected findings.
7. **Prioritised findings** - present stable identifiers, classification, evidence, consequence, confidence, and proposed route.
8. **Knowledge consolidation** - recommend record-by-record Decision Record disposition and any documentation, Specification, Guide, or skill restructuring.
9. **Human use and configuration** - assess comprehension, progressive disclosure, realistic configuration, and operator feedback.
10. **Engineering maturity** - assess performance, maintainability, safety, verification, operations, and release consistency.
11. **Recommended delivery sequence** - order bounded follow-up by dependency without authorising implementation.
12. **Final suitability judgement** - state what the repository is suitable for now and what claims it is not ready to make.
13. **Disposition** - state what changed, where review evidence remains, and which durable routes await confirmation.

## Assessment lenses

Apply these lenses in order, moving from the repository's widest ecosystem responsibility towards detailed implementation and verification evidence.

### Repository purpose and stability

- [ ] The repository fulfils its delineated responsibility within the wider project ecosystem.
- [ ] The repository has a clear stable baseline against which future change can be judged.
- [ ] The repository records enough of that baseline that maintaining it does not depend on personal memory.
- [ ] Every known departure from the stable baseline is explicit and represented by active work.
- [ ] The product or operating model forms a coherent path from declared intent through execution to observable outcome.
- [ ] Claims about maturity, supported environments, and wider applicability match proven use.
- [ ] Intentional current boundaries are distinguished from defects and future capabilities.

### Repository governance

- [ ] The repository declaration reflects what the repository now contains.
- [ ] `.ki.toml` is a readable review surface that follows `ki-authoring` TOML presentation conventions.
- [ ] In a multi-runtime repository, root `AGENTS.md` is the authoritative home for shared runtime-neutral guidance.
- [ ] Where root `CLAUDE.md` accompanies `AGENTS.md`, it imports `AGENTS.md` and contains only Claude-specific additions.
- [ ] Root orientation records only repository-specific facts and points at the governing skill or Decision Record, rather than restating a rule a declared skill already owns.
- [ ] GitHub Issues and `package.json` bug-reporting metadata agree with the selected work adapter: both are absent unless `ki-work-github-issues` is declared.
- [ ] Short subordinate records, including Agora memberships, use compact dotted keys and inline tables; complex Agora homes and similar records use legible nested tables.
- [ ] The declared skill set covers every governance capability the repository uses, including capabilities without an automatic detection signal.
- [ ] Every declared runtime-bound skill is linked into the repository through a KI-managed local projection.
- [ ] Adding a runtime to `supported_runtimes` carried its knock-on surfaces: that runtime's skills directory is git-ignored, excluded from the formatter and dead-code configurations, and its tokenomics adapter is declared and activated.
- [ ] No skill remains declared after the capability it governs has left the repository.
- [ ] A substantive change to a canonical zone went through the enactment process.
- [ ] The work record exists and its status matches reality.
- [ ] Commit messages follow the conventional format and describe the change, not the session.
- [ ] Staged paths are exactly the paths this work touched.
- [ ] No other writer's uncommitted work was reverted, stashed, or discarded.
- [ ] Concurrent writers against this working tree were identified before staging, committing or reporting push state. Every session in one checkout commits under the same author, so Git metadata cannot attribute work between them, and a peer that pushes or edits between two reads makes a correct-at-the-time claim stale without warning.

### Naming and identity

- [ ] Every addressable thing has a unique identifier.
- [ ] Identifiers are stable and are never reused after retirement.
- [ ] Names follow the declared prefix or area scheme.
- [ ] A repository is named after the smallest brand that accurately covers everything it contains.
- [ ] Renames were propagated to every reference, including documentation and configuration.

### Documentation and knowledge

- [ ] Documentation presents one consolidated account of the repository's current responsibility, behaviour, and intended direction.
- [ ] A human can follow the repository's story without reconstructing it from file layout, commit history, agent-only metadata, or unstated context.
- [ ] Documentation progressively reveals purpose and concepts before procedures, implementation detail, and reference material.
- [ ] Each subject has one authoritative home; other documents link to it rather than repeating it.
- [ ] Historical change remains in version control or explicitly historical records instead of current-state guidance.
- [ ] Each legacy Claude artifact has an explicit disposition: migrate to its current canonical owner, retain it with a current reason, or retire it.
- [ ] Still-useful `.claude/commands/` behaviour is owned by a skill rather than maintained as a parallel legacy command.
- [ ] Durable content from legacy repository-local `.claude/memory/` is promoted by meaning to `AGENTS.md`, runtime-specific `CLAUDE.md`, a Decision Record, Specification, Guide, skill, synchronised user configuration, or roadmap; runtime-only retrieval aids remain in selected native memory.
- [ ] A legacy artifact is removed only after its retained content, inbound references, and live runtime dependencies have been reconciled.
- [ ] Each Decision Record can be understood as a coherent, self-contained account without following its links.
- [ ] Overlapping Decision Records are consolidated so each independent decision has one authoritative record.
- [ ] Decision records state the current decision, its rationale, and its future consequences rather than accumulating a chronological change history.
- [ ] Every `decision_depends_on` entry identifies a logical prerequisite rather than a merely related, earlier, or cited record.
- [ ] Amend an existing decision record in place rather than creating a successor that merely clarifies or expands scope.
- [ ] Supersede a decision record only when the decision is genuinely reversed.
- [ ] A shared decision record is updated coherently in every repository that projects it.
- [ ] Guide areas make their intended audience, task, and reading path obvious.
- [ ] Every guide under `docs/guides/` lives in an explicit audience subdirectory, such as `user/`, `developer/`, or `agent/`.
- [ ] Specifications state observable behaviour, constraints, and acceptance evidence precisely enough for implementation and review.
- [ ] Skill definitions make their triggers, ownership, dependencies, boundaries, and operating modes understandable to a human reviewer.
- [ ] Every cross-reference resolves, and cites the record that is actually current.
- [ ] The README positions the repository within the estate.
- [ ] Anything that could be a skill has been made one.

### Necessity and over-engineering

- [ ] Every file added is necessary.
- [ ] No abstraction exists for a single caller.
- [ ] No extension point exists without a concrete second case.
- [ ] No configuration option exists that nothing sets.
- [ ] Dead code is deleted rather than retained, commented out, or tested.
- [ ] Defensive branches that cannot be reached are removed rather than covered.
- [ ] The change removes at least as much complexity as it adds, or says why not.

### Structure and modularity

- [ ] The code is factorised into modules with a single clear responsibility.
- [ ] The structure still fits the problem after the evolution this code has been through.
- [ ] A module's name predicts its contents.
- [ ] Module boundaries are enforced mechanically, not by convention alone.
- [ ] No module imports across a declared ownership boundary.
- [ ] Configuration is separated from the model it configures.
- [ ] Instance-specific data is not sitting in a place reserved for generic behaviour.
- [ ] A new reader could locate the owner of any given behaviour in one attempt.
- [ ] Nothing was moved without its tests moving with it.

### Contracts and interfaces

- [ ] The public surface of each module is the smallest that serves its callers.
- [ ] Interface changes are compatible, or their incompatibility is recorded.
- [ ] Error paths return actionable information rather than a generic failure.
- [ ] Input from outside the process is validated at the boundary.
- [ ] The contract is stated somewhere a consumer will find it.
- [ ] Every operation makes its authority, effective scope, and material consequences clear before mutation.
- [ ] Selection, application, switching, and deselection semantics are explicit wherever managed state can persist.
- [ ] Concurrent mutations have an explicit ownership or serialisation model.

### Human use and configuration

- [ ] The primary user path reaches a recognisable end-to-end result before advanced mechanics are introduced.
- [ ] Realistic configuration remains readable, editable, and reviewable at its actual scale.
- [ ] Status and preview surfaces distinguish declared intent, observed state, and planned change.
- [ ] Examples are copyable, realistic, and show the result a reader should recognise.
- [ ] Human-facing rationales explain why a choice exists rather than merely restating that it is declared.

### Security and data

- [ ] Access gating is tested, not merely present.
- [ ] Default access level is the least privileged that works.
- [ ] Redaction lists were reviewed against what the code actually logs.
- [ ] Truncating a value is not being relied on as a confidentiality control.
- [ ] Filesystem access is confined to declared roots.
- [ ] No secret, token, or credential is committed or logged.
- [ ] Network egress is limited to what the component needs.
- [ ] Repository visibility matches the sensitivity of what it contains.
- [ ] Licence and copyright headers match the intended position.

### Dependencies and toolchain

- [ ] Every dependency added is used.
- [ ] Every dependency removed is genuinely unreferenced.
- [ ] Dependency updates within the last fortnight are informational; older ones are a finding.
- [ ] The toolchain is on the intended leading-edge version, not drifting behind.
- [ ] No dependency was added where an existing one already does the job.
- [ ] A new runtime dependency is justified against vendoring or a pinned reference.

### Performance, maintainability, and release

- [ ] Representative operations have explicit performance budgets and meet them against realistic data.
- [ ] Long-running multi-item operations distinguish queued, active, completed, and failed work at a glance.
- [ ] Each item retains a stable row or equivalent entry showing its current phase, current and total measure when available, and terminal outcome.
- [ ] Concurrent progress remains compact and readable; non-interactive output emits equivalent discrete status records.
- [ ] Progress reporting does not mask avoidable latency in ordinary queries.
- [ ] The distribution contract does not force authored source into a monolith that raises change coupling.
- [ ] Version output, changelog, installation instructions, documentation, and released artifacts describe the same release state.
- [ ] Development-only behaviour is clearly distinguished from the latest released behaviour.
- [ ] Any published or deployed surface is demonstrably derived from declared current source, or explicitly described as independent.

### Duplication and reuse

- [ ] Repeated logic is consolidated rather than copied.
- [ ] Any deliberate duplication is justified in writing and attributable to its source.
- [ ] Vendored or generated copies record the revision they came from.
- [ ] Vendored or generated copies are checked for drift by something that fails.
- [ ] Shared configuration comes from one factory rather than parallel copies.
- [ ] The change does not introduce a second source of truth for an existing fact.
- [ ] Security-relevant logic has one authoritative definition, or a conformance contract proving equivalence.

### Tests

- [ ] Tests exercise architectural boundaries rather than internal units.
- [ ] Tests work outside-in from the contract.
- [ ] The test names describe behaviour, not implementation.
- [ ] Coverage gaps were understood before they were filled.
- [ ] No test was added merely to raise a coverage number.
- [ ] An uncovered line was resolved in preference order: cover the boundary, refactor away the impossible branch, delete the dead code, annotate the reason.
- [ ] Every security control has a test that fails when the control is removed.
- [ ] A test exists for each documented failure mode, not only the happy path.
- [ ] Fixtures contain no real personal data, credentials, or customer identifiers.
- [ ] Tests do not depend on execution order or on each other's state.

### Scripts, binaries, and operations

- [ ] Scripts are written in the project's primary language rather than a convenience dialect.
- [ ] Scripts accept arguments in the same style as their siblings.
- [ ] Scripts fail loudly with a non-zero exit rather than continuing on error.
- [ ] Anything runnable is reachable from the declared task surface.
- [ ] Website servers use a deterministic port outside tests so start and stop operations can target them reliably.
- [ ] Nothing depends on a path outside the repository without declaring it.
- [ ] Build and script steps invoke an executable directly, or by resolving the owning package manifest, rather than through a package-manager runner such as `npx` or `bunx`.
- [ ] Where a build host installs with a different package manager from local development, nothing in the build depends on that difference.
- [ ] In a scheduled or unattended pipeline, unconditional work runs, and is committed, before any step that can fail — so one step's failure does not silently suppress an independent record.
- [ ] Any committer that cannot reword and retry its own message satisfies the repository's commit-message rules mechanically, rather than by a message that happens to pass.

### Language and presentation

- [ ] British English throughout.
- [ ] ASCII hyphens only, with no em dashes or en dashes.
- [ ] One paragraph per line, with no mid-sentence breaks.
- [ ] Table rows stay within the print width, with long content moved to footnotes.
- [ ] Prose is direct, with no corporate filler.

### Automated verification

- [ ] Every script or task named by the repository orientation's documented verification gate exists and resolves through the declared runner.
- [ ] The full verification task exits zero.
- [ ] `ki repo repair` completes without unresolved KI-managed projection repairs.
- [ ] `ki repo diag` reports every declared repository skill and its local projection healthy.
- [ ] `ki repo audit` reports `FAIL=0`.
- [ ] Formatter and linter report no findings.
- [ ] Type checking passes with no suppressed errors.
- [ ] Unused-code analysis reports no unused files, exports, or dependencies.
- [ ] Markdown lint passes.
- [ ] The lockfile is current and dependency versions are consistent across workspaces.
- [ ] Verification exercises representative real-scale data as well as minimal fixtures.
- [ ] Relevant live configuration and runtime state are compared with their declared sources without exposing private values.
- [ ] A change to a declaration that another tool consumes was verified by running that tool, not only the repository's own gates. A clean pass from a gate that cannot see the consumer reads exactly like verification and stops the reviewer looking.
- [ ] Where a gate's result is a count of health-check findings rather than a pass or a fail, the reviewer establishes whether each finding is pre-existing or new, and reads it. A gate satisfied by an unchanged count reads exactly like one satisfied by a clean check, so a standing finding carried forward as "the baseline" survives unread for as long as the count holds.
- [ ] No gate was made to pass by widening an ignore list rather than fixing the cause.
- [ ] Every suppression comment added in this change names a reason.

### Closing the review

- [ ] Claims about the live state were verified against the live state, not recalled.
- [ ] Every finding has one confirmed route: Plan, Decision Record, Feature definition, Guide, or No action.
- [ ] The final judgement states what the repository is suitable for now and what claims it is not yet ready to make.
- [ ] Anything learned that generalises was routed back into the relevant skill or practice note.
- [ ] Anything this review needed to ask, and this checklist did not, has been raised as a checklist candidate.

## Review records and closure

Create a review record only when the user asks to retain working evidence beyond the conversation. Place it at `docs/reviews/REV-<NNN>-<slug>.md` and give it frontmatter with immutable `id`, `status`, owning `roadmap` locator where one exists, and `retained-by` listing concrete plan or Decision Record identifiers, or `—`.

Review records are working evidence, not permanent documentation. Before closing an owning delivery item, move every independently durable conclusion to its route. When no concrete artefact remains in `retained-by`, show the exact review record and its dependent state, then require explicit confirmation before pruning it. Preserve identifiers in Git history; never reuse them.

`review close <REV-NNN>` is a review-evidence decision, not `ki-accept prune`: it must not remove a plan, roadmap item, Decision Record, or guide.

At minimum, a finished review identifies the scope and evidence examined, material uncertainties and the user's answers, findings with identifiers and routes, proposed delivery order and dependencies, and evidence retention or pruning state. Ask for confirmation before creating any durable route. A completed review with no retained record still states where its durable decisions, plans, guides, or feature definitions landed.

## Checklist evolution

This checklist is a living review contract, not an accumulation log. A new concept belongs here only when it is likely to improve future repository assessments, is not already covered by an existing question, and can be placed without breaking the broad-to-narrow progression defined in Reference structure.

When a session discovers a new reusable repository-review concept that this reference does not cover, `ki-recap` must raise it as a repository-review checklist candidate and offer to update this canonical reference. The recap does not update it automatically: the user confirms the durable route first. When accepted, place the concept in the narrowest fitting section, revise the invocation, prompt, method, or output only if their contract changes, and reconcile any lower-layer copy or pointer.
