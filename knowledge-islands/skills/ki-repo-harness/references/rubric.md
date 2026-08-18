<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands compatible harnesses

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-harness --write`.

Line-by-line criteria for auditing ki-repo-harness. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [CAP — Capability publication](#cap--capability-publication)
- [PAYLOAD — Payload and runtime evidence boundary](#payload--payload-and-runtime-evidence-boundary)
- [LAY — Source-harness layout and files](#lay--source-harness-layout-and-files)
- [CLAUDE — Root orientation](#claude--root-orientation)
- [CONFIG — Harness declaration](#config--harness-declaration)
- [SKILLS — Skill capability identity](#skills--skill-capability-identity)
- [LONG — Longevity](#long--longevity)
- [COLL — Capability boundary](#coll--capability-boundary)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## CAP — Capability publication

→ [standard](standards-compatible-harness.md)

Typed compatible-harness capability inventory and kind-specific boundaries.

- **CAP-1 [J] — Capability inventory and boundaries** — Each populated harness shelf makes its typed capabilities discoverable and routes their content and runtime semantics to the owning kind standard. (standards-compatible-harness.md#capability-publication)
  - _Evidence scope:_ Every populated source shelf, its compatible payload representation, and the owning kind standards.
  - _Review prompt:_ Review each populated shelf: are its capabilities discoverable through the compatible payload, and are kind-specific semantics delegated to the appropriate standard?
  - _Outcomes:_ conforming; inventory revision; route to owning standard
  - _Conforming guidance:_ Revise the inventory or route the concern to its owning standard; do not alter a capability’s runtime semantics from this container-level review.
- **CAP-2 [M] — Generated capability catalogue is exact** — A populated skills shelf publishes one marker-bounded catalogue in `skills/README.md`, derived exactly from canonical skill frontmatter and safely replaceable without changing authored surrounding guidance. (standards-compatible-harness.md#capability-publication)
  - _Remediation:_ automatic

## PAYLOAD — Payload and runtime evidence boundary

→ [standard](standards-compatible-harness.md)

Host-owned provenance and activation evidence not derived from source layout.

- **PAYLOAD-1 [M] — Installed and runtime evidence remains separate** — A source-harness audit records that verified payload, local-development source, activation, capability resolution, and execution need host evidence. (standards-compatible-harness.md#source-and-installed-boundaries)
  - _Remediation:_ diagnostic — Obtain the required provenance or runtime evidence from tools-ki; do not infer it from a source checkout.

## LAY — Source-harness layout and files

→ [standard](standards-compatible-harness.md)

The five-part source container and its required physical root files.

- **LAY-1 [M] — Five-part directory layout** — skills/, subagents/, mcp/, evals/, and hooks/ all exist as physical directories at the source-harness root. (standards-compatible-harness.md#source-harness-layout)
  - _Remediation:_ diagnostic — Create or repair the missing physical source-harness shelf, then rerun the audit.
- **LAY-2 [M] — Shelf descriptions** — Each five-part source directory contains a physical README.md declaring its purpose and status. (standards-compatible-harness.md#source-harness-layout)
  - _Remediation:_ diagnostic — Add the missing physical shelf README with its purpose and status, then rerun the audit.
- **LAY-3 [M] — Root Claude orientation** — CLAUDE.md exists as a physical file at the source-harness root. (standards-compatible-harness.md#root-orientation)
  - _Remediation:_ diagnostic — Create or repair the required physical root file with owner-approved content, then rerun the audit.
- **LAY-4 [M] — Root roadmap** — ROADMAP.md exists as a physical file at the source-harness root. (standards-compatible-harness.md#root-roadmap)
  - _Remediation:_ diagnostic — Create or repair the required physical root file with owner-approved content, then rerun the audit.
- **LAY-5 [M] — Root Knowledge Islands configuration** — .ki-config.toml exists as a physical file at the source-harness root. (standards-compatible-harness.md#harness-declaration)
  - _Remediation:_ diagnostic — Create or repair the required physical root file with owner-approved content, then rerun the audit.

## CLAUDE — Root orientation

→ [standard](standards-compatible-harness.md)

Coverage and freshness of the effective source-harness orientation.

- **CLAUDE-1 [J] — Harness introduction** — The root orientation opens by explaining the source harness and naming all five parts. (standards-compatible-harness.md#root-orientation)
  - _Evidence scope:_ The effective root orientation and all five source-harness shelves.
  - _Review prompt:_ Does the effective root orientation explain the source harness and name all five parts?
  - _Outcomes:_ conforming; orientation revision; not applicable
  - _Conforming guidance:_ Revise the orientation with owner-approved current source facts; do not infer shelf status from an unverified payload.
- **CLAUDE-2 [J] — Five-part status** — The root orientation gives a current status for every source-harness part. (standards-compatible-harness.md#root-orientation)
  - _Evidence scope:_ The orientation status table or equivalent and the five physical source shelves.
  - _Review prompt:_ Does the orientation status table or equivalent agree with the five actual source shelves?
  - _Outcomes:_ conforming; orientation revision; source evidence required
  - _Conforming guidance:_ Update the orientation only from current source evidence and preserve the distinction between source shelves and installed payload.
- **CLAUDE-3 [J] — Working conventions** — The root orientation routes working conventions for every source-harness part. (standards-compatible-harness.md#root-orientation)
  - _Evidence scope:_ The root orientation and the working guidance or owning-skill route for every source-harness part.
  - _Review prompt:_ Does each source-harness part have concise working guidance or a route to its governing skill?
  - _Outcomes:_ conforming; orientation revision; route to owner
  - _Conforming guidance:_ Add concise routing guidance without duplicating the owning standard or claiming another skill’s authority.
- **CLAUDE-4 [J] — Native toolchain commands** — The root orientation lists the direct ki commands and repository gates contributors need. (standards-compatible-harness.md#root-orientation)
  - _Evidence scope:_ The root orientation, documented commands, and the repository’s current direct host and verification interfaces.
  - _Review prompt:_ Are direct ki audit, conform, rubric-publication, test, and TypeScript gates documented without retired package aliases?
  - _Outcomes:_ conforming; orientation revision; tooling clarification required
  - _Conforming guidance:_ Document only verified current commands; route a toolchain or host change to its owning capability rather than inventing an alias.
- **CLAUDE-5 [J] — Orientation freshness** — Counts, shelf statuses, capability boundaries, and command names in the orientation match the repository. (standards-compatible-harness.md#root-orientation)
  - _Evidence scope:_ All factual orientation claims, current source shelves, compatible payload evidence, and direct host commands.
  - _Review prompt:_ Do orientation claims agree with the current source shelves, compatible payload, and direct host commands?
  - _Outcomes:_ conforming; orientation revision; evidence required
  - _Conforming guidance:_ Correct only evidence-backed claims and leave unresolved host or payload facts for their owning authority.

## CONFIG — Harness declaration

→ [standard](standards-compatible-harness.md)

Knowledge Islands source-harness governance declarations.

- **CONFIG-1 [M] — Harness declaration** — A physical .ki-config.toml contains the keyless ki-repo-harness root table. (standards-compatible-harness.md#harness-declaration)
  - _Remediation:_ automatic
- **CONFIG-2 [M] — Repository governance declaration** — A physical .ki-config.toml contains the ki-repo root table. (standards-compatible-harness.md#harness-declaration)
  - _Remediation:_ diagnostic — Declare the ki-repo governance root in the physical configuration, then rerun the audit.
- **CONFIG-3 [J] — Skill governance declaration** — A source harness with populated skills declares ki-skills. (standards-compatible-harness.md#harness-declaration)
  - _Evidence scope:_ The physical .ki-config.toml and the source harness skills shelf.
  - _Review prompt:_ When skills/ is populated, does .ki-config.toml declare the ki-skills governance root?
  - _Outcomes:_ conforming; configuration revision; not applicable
  - _Conforming guidance:_ Add or correct the declaration only through the repository owner’s configuration decision; do not infer activation scope from shelf contents alone.
- **CONFIG-4 [M] — Capability prefix declaration** — The ki-repo-harness table declares one valid capability prefix. (standards-compatible-harness.md#harness-declaration)
  - _Remediation:_ diagnostic — Declare the owner-approved prefix in [skills.ki-repo-harness], then rerun the audit.

## SKILLS — Skill capability identity

→ [standard](standards-compatible-harness.md)

Recursive physical skill discovery and identity integrity within the compatible payload.

- **SKILLS-1 [M] — Skill directory and name alignment** — Each discovered physical skill root matches its SKILL.md name frontmatter. (standards-compatible-harness.md#skill-capability-identity)
  - _Remediation:_ diagnostic — Correct the affected skill directory or frontmatter identity, then rerun the audit.
- **SKILLS-2 [M] — Unique skill names** — No two discovered skill roots share a frontmatter name. (standards-compatible-harness.md#skill-capability-identity)
  - _Remediation:_ diagnostic — Resolve the duplicate published name within the source Harness, then rerun the audit.
- **SKILLS-3 [M] — Prefix-owned skill names** — Every published skill name begins with the Harness capability prefix. (standards-compatible-harness.md#skill-capability-identity)
  - _Remediation:_ diagnostic — Align the published skill identity with the owner-approved Harness prefix.

## LONG — Longevity

→ [standard](standards-compatible-harness.md)

Refresh discipline for the compatible-harness standard.

- **LONG-1 [J] — Refresh path** — The ki-repo-harness skill carries REFRESH and a dated source review record. (standards-compatible-harness.md)
  - _Evidence scope:_ The ki-repo-harness REFRESH procedure, source list, cadence, and current compatible-harness standard.
  - _Review prompt:_ Do the ki-repo-harness REFRESH procedure and sources.md cadence provide a usable current refresh path?
  - _Outcomes:_ conforming; refresh-path revision; source review required
  - _Conforming guidance:_ Update the documented refresh path or complete its source review through the canonical harness; do not invent a review result without source evidence.

## COLL — Capability boundary

→ [standard](standards-compatible-harness.md)

Container ownership, host ownership, and sibling off-ramps.

- **COLL-1 [J] — Capability boundary** — Declared prerequisites, coverage-selected siblings, and contents-governing off-ramps are complete and distinct. (standards-compatible-harness.md#ownership-boundaries)
  - _Evidence scope:_ The harness skill frontmatter, description, dependency declarations, and adjacent owning skills.
  - _Review prompt:_ Are prerequisite dependencies, coverage-selected siblings, and description off-ramps complete and non-overlapping?
  - _Outcomes:_ conforming; boundary revision; route to owner
  - _Conforming guidance:_ Clarify the boundary or route the concern to its owner; do not claim another capability’s execution or content semantics.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
