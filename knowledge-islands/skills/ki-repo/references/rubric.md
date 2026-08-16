<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands repositories

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo --write`.

Line-by-line criteria for auditing ki-repo. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [FILES — Repository files](#files--repository-files)
- [GH — Core GitHub settings](#gh--core-github-settings)
- [PKG — Package metadata](#pkg--package-metadata)
- [MERGE — Merge policy](#merge--merge-policy)
- [TOGGLE — Repository features](#toggle--repository-features)
- [VIS — Visibility](#vis--visibility)
- [TOPICS — Topics](#topics--topics)
- [BP — Branch protection](#bp--branch-protection)
- [DEP — Dependency security](#dep--dependency-security)
- [SEC — Secret protection](#sec--secret-protection)
- [ACT — Actions policy](#act--actions-policy)
- [CHECKS — Check overrides](#checks--check-overrides)
- [COV — Governance coverage](#cov--governance-coverage)
- [STRUCT — Repository structure](#struct--repository-structure)
- [ACCESS — Repository access](#access--repository-access)
- [KIND — Repository kind](#kind--repository-kind)
- [RUNTIMES — Runtime support](#runtimes--runtime-support)
- [DESCFIT — Description fitness](#descfit--description-fitness)
- [DOC — Documentation topology](#doc--documentation-topology)
- [OVR — Override rationale](#ovr--override-rationale)
- [SYNC — Standard synchronisation](#sync--standard-synchronisation)
- [WORK — Working areas](#work--working-areas)

## RUBRIC — Generated rubric publication

→ [standard](../../ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## FILES — Repository files

→ [standard](standards-repository.md)

Required repository files and document quality, using a local checkout when available or GitHub default-branch evidence for remote-only runs.

- **FILES-1 [M] — Required repository files** — README, license, gitignore, editor configuration, Claude orientation, and the exact ki-repo config marker are present in the selected evidence source. (standards-repository.md)
  - _Remediation:_ automatic
- **FILES-2 [M] — Declared repository identity** — The ki-repo table declares its canonical GitHub repository, title, and description; its title matches the README H1, and a roadmap repository declares repo_code there. (standards-repository.md)
  - _Remediation:_ diagnostic — Correct the declared repository identity, README H1, or roadmap code, then rerun the audit.
- **FILES-3 [M] — Authoring baseline** — A governed repository declares ki-authoring explicitly. (standards-repository.md)
  - _Remediation:_ automatic
- **FILES-4 [M] — Runtime skill ignore contract** — Generated skill links are ignored for each declared runtime, while a repository-local .agents/skills/ki-self source remains committed. (standards-repository.md)
  - _Remediation:_ automatic
- **FILES-J1 [J] — Repository document content** — README and license content is accurate and current. (standards-repository.md)
  - _Evidence scope:_ The repository README and license.
  - _Review prompt:_ Read the README and license and assess whether they accurately describe and license this repository.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Correct the document, record a named gap, or record an explicit repository-level exclusion.

## GH — Core GitHub settings

→ [standard](standards-repository.md)

Default branch, licensing, and repository description.

- **GH-1 [M] — Default branch** — The default branch is main. (standards-repository.md)
  - _Remediation:_ diagnostic — Correct the GitHub setting or aligned local declaration, then rerun the audit.
- **GH-2 [M] — Declared license alignment** — The declared license agrees with GitHub and package.json. (standards-repository.md)
  - _Remediation:_ diagnostic — Correct the GitHub setting or aligned local declaration, then rerun the audit.
- **GH-3 [M] — Description presence and synchronisation** — The declared ki-repo description is non-empty and matches GitHub and package.json when those surfaces exist. (standards-repository.md)
  - _Remediation:_ diagnostic — Correct the GitHub setting or aligned local declaration, then rerun the audit.

## PKG — Package metadata

→ [standard](standards-repository.md)

Package identity and repository metadata.

- **PKG-1 [M] — Package identity metadata** — package.json carries coherent identity and repository metadata when present. (standards-repository.md)
  - _Remediation:_ diagnostic — Correct package identity metadata or record an explicit override, then rerun the audit.

## MERGE — Merge policy

→ [standard](standards-repository.md)

GitHub merge and branch-cleanup behaviour.

- **MERGE-1 [M] — Merge policy** — The repository permits squash merges only and deletes merged head branches. (standards-repository.md)
  - _Remediation:_ diagnostic — Configure squash-only merging and merged-branch deletion, then rerun the audit.

## TOGGLE — Repository features

→ [standard](standards-repository.md)

Issues, Wiki, and Projects settings.

- **TOGGLE-1 [M] — Repository feature toggles** — Issues are enabled and Wiki and Projects are disabled unless explicitly overridden. (standards-repository.md)
  - _Remediation:_ diagnostic — Align the repository feature settings or record an explicit override, then rerun the audit.

## VIS — Visibility

→ [standard](standards-repository.md)

Declared and live repository visibility.

- **VIS-1 [M] — Declared visibility** — Live GitHub visibility matches the valid visibility declared in .ki-config.toml. (standards-repository.md)
  - _Remediation:_ diagnostic — Align the declared and live repository visibility, then rerun the audit.

## TOPICS — Topics

→ [standard](standards-repository.md)

Public repository topic conventions.

- **TOPICS-1 [M] — Public repository topics** — A public repository carries the standard topic set unless explicitly overridden. (standards-repository.md)
  - _Remediation:_ diagnostic — Set the required public topics or record an explicit override, then rerun the audit.

## BP — Branch protection

→ [standard](standards-repository.md)

Optional main-branch protection.

- **BP-1 [M] — Branch protection** — Main has the configured branch-protection posture, including required PR, build check, and linear history when enabled. (standards-repository.md)
  - _Remediation:_ diagnostic — Configure the required branch-protection posture or record an explicit override, then rerun the audit.

## DEP — Dependency security

→ [standard](standards-repository.md)

Dependabot and branch freshness.

- **DEP-1 [M] — Dependabot and branch freshness** — Dependabot alerts and updates are enabled and pull-request branches may be updated. (standards-repository.md)
  - _Remediation:_ diagnostic — Enable the required Dependabot and branch-update settings or record an explicit override, then rerun the audit.

## SEC — Secret protection

→ [standard](standards-repository.md)

Secret scanning and push protection.

- **SEC-1 [M] — Secret scanning protection** — Public repositories enable secret scanning and push protection unless explicitly overridden. (standards-repository.md)
  - _Remediation:_ diagnostic — Enable secret scanning and push protection or record an explicit override, then rerun the audit.

## ACT — Actions policy

→ [standard](standards-repository.md)

GitHub Actions permissions.

- **ACT-1 [M] — Actions policy** — GitHub Actions allowed_actions is all; tighter deliberate policies are reported as warnings. (standards-repository.md)
  - _Remediation:_ diagnostic — Set the intended GitHub Actions policy or record an explicit override, then rerun the audit.

## CHECKS — Check overrides

→ [standard](standards-configuration.md)

Per-repository override schema.

- **CHECKS-1 [M] — Override keys** — Every ki-repo checks override names a supported overridable concern. (standards-configuration.md)
  - _Remediation:_ diagnostic — Remove the unsupported override or select a supported concern, then rerun the audit.

## COV — Governance coverage

→ [standard](standards-configuration.md)

Detected and declared governance coverage.

- **COV-1 [M] — Governance coverage cascade** — Detected governance applicability and declared opt-in tables agree, subject to explicit coverage overrides. (standards-configuration.md)
  - _Remediation:_ diagnostic — Align the declared coverage table with detected applicability or record an explicit override, then rerun the audit.

## STRUCT — Repository structure

→ [standard](standards-repository.md)

Primary repository structure, with composable specialisations.

- **STRUCT-1 [M] — Single primary repository structure** — A repository declares at most one mutually exclusive Project or Knowledge Base primary. (standards-repository.md)
  - _Remediation:_ diagnostic — Align the repository structure declaration with the applicable standard or record an explicit exemption, then rerun the audit.
- **STRUCT-2 [M] — Primary repository structure presence** — A repository declares a Project or Knowledge Base primary structure. (standards-repository.md)
  - _Remediation:_ diagnostic — Align the repository structure declaration with the applicable standard or record an explicit exemption, then rerun the audit.
- **STRUCT-3 [M] — Single website implementation** — A website declares at most one mutually exclusive content or app implementation. (standards-repository.md)
  - _Remediation:_ diagnostic — Align the repository structure declaration with the applicable standard or record an explicit exemption, then rerun the audit.
- **STRUCT-4 [M] — Website implementation presence** — A declared website core selects a content or app implementation. (standards-repository.md)
  - _Remediation:_ diagnostic — Align the repository structure declaration with the applicable standard or record an explicit exemption, then rerun the audit.

## ACCESS — Repository access

→ [standard](standards-repository.md)

GitHub reachability and archive state.

- **ACCESS-1 [M] — GitHub access and archive state** — GitHub reachability is reported without manufacturing drift when offline, and archived repositories are skipped. (standards-repository.md)
  - _Remediation:_ diagnostic — Restore GitHub access or record the repository archive state, then rerun the audit.

## KIND — Repository kind

→ [standard](standards-repository.md)

The selected repository operating model and named Knowledge Base store roles.

- **KIND-1 [M] — Repository kind and store roles** — ki-repo owns the optional KB discriminator and validates its closed named-store vocabulary without accepting legacy locations. (standards-repository.md)
  - _Remediation:_ diagnostic — Declare a supported repository kind and compatible store roles, then rerun the audit.
- **KIND-2 [M] — Kind and structure compatibility** — A KB kind declares the KB structure and Streams planning model; a non-KB does not declare the KB structure. (standards-repository.md)
  - _Remediation:_ diagnostic — Align the repository kind with its declared structure and planning model, then rerun the audit.

## RUNTIMES — Runtime support

→ [standard](standards-repository.md)

Declared agent-runtime support and orientation.

- **RUNTIMES-1 [M] — Supported runtime declaration** — ki-repo declares a non-empty, duplicate-free list containing only supported runtimes. (standards-repository.md)
  - _Remediation:_ diagnostic — Declare the supported runtimes as a non-empty duplicate-free supported set, then rerun the audit.
- **RUNTIMES-2 [M] — Runtime environment coverage** — Every repository declares portable tokenomics and the real housekeeping and tokenomics capabilities required by its supported runtimes. (standards-repository.md)
  - _Remediation:_ automatic
- **RUNTIMES-3 [M] — Repository-local ki-self projection** — An optional repository-local ki-self has one canonical .agents source and a relative Claude projection exactly when Claude Code is supported. (standards-repository.md)
  - _Remediation:_ diagnostic — Restore the canonical ki-self source and applicable runtime projection, then rerun the audit.
- **RUNTIMES-J1 [J] — Runtime orientation split** — Multi-runtime repositories use a shared AGENTS.md orientation with a thin Claude import unless a justified exception applies. (standards-repository.md)
  - _Evidence scope:_ The shared AGENTS.md and runtime-specific orientation files for every declared runtime.
  - _Review prompt:_ Review whether orientation is shared cleanly across the declared runtimes without duplicated or Claude-only instructions.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Consolidate shared guidance, record a named gap, or record an explicit repository-level exception.

## DESCFIT — Description fitness

→ [standard](standards-repository.md)

Human assessment of repository purpose.

- **DESCFIT-1 [J] — Description fit** — The repository description accurately and concisely describes its purpose. (standards-repository.md)
  - _Evidence scope:_ The repository description and its current public purpose.
  - _Review prompt:_ Read the repository and judge whether its one-sentence description fits its actual purpose.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Update the description, record a named gap, or record an explicit repository-level exclusion.

## DOC — Documentation topology

→ [standard](standards-documentation-topology.md)

Repository-level ownership of durable documentation concerns.

- **DOC-1 [J] — Documentation concern ownership** — In a non-Knowledge-Base repository, durable documentation is routed to Decision Records, Specifications, Guides, or the Roadmap; specialist skills retain the content contract for their concern. (standards-documentation-topology.md)
  - _Evidence scope:_ Repository documentation topology and the durable material routed to each concern.
  - _Review prompt:_ Does each durable documentation concern have the right owner, with decisions explaining choices, Specifications defining behaviour, Guides helping people operate or contribute, and roadmap records tracking planned change?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Route the material to its owning concern, record a named gap where the required contract is absent, or record an explicit repository-level exclusion.

## OVR — Override rationale

→ [standard](standards-configuration.md)

Human assessment of exceptions.

- **OVR-J1 [J] — Override rationale** — Every checks override represents a warranted repository-specific decision. (standards-configuration.md)
  - _Evidence scope:_ Every configured ki-repo checks override and its repository context.
  - _Review prompt:_ Review each configured override and confirm that it records a real exception rather than hiding drift.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Remove or justify the override, record a named gap, or record an explicit repository-level exclusion.

## SYNC — Standard synchronisation

→ [standard](standards-repository.md)

Alignment across the knowledge chain.

- **SYNC-1 [J] — Standard synchronisation** — The standard, structured rubric, and executable behaviour remain aligned. (standards-repository.md)
  - _Evidence scope:_ The repository standard, structured rubric, generated publication, and checker behaviour.
  - _Review prompt:_ Compare the standard, generated rubric, and checker behaviour for semantic drift.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Align the affected source, record a named gap, or record an explicit repository-level exclusion.

## WORK — Working areas

→ [standard](standards-repository.md)

Required generic inbound and outbound working-area scaffold and direction.

- **WORK-1 [M] — Working-area scaffold** — Every KI repository has the canonical generic inbound and outbound working areas and README orientation. (standards-repository.md)
  - _Remediation:_ automatic
- **WORK-J1 [J] — working-area direction and lifecycle** — The required +/ and -/ working areas distinguish temporary inbound from outbound material without becoming a shadow canonical store. (standards-repository.md)
  - _Evidence scope:_ The repository +/ and -/ working areas and their README orientation.
  - _Review prompt:_ Review that +/ and -/ remain temporary directional material rather than a shadow canonical store or archive.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Move material to its canonical store, record a named gap, or record an explicit repository-level exclusion.
