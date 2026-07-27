<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands compatible harnesses

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-harness --write`.

Line-by-line criteria for auditing ki-harness. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [CAP — Capability publication](#cap--capability-publication)
- [LAY — Source-harness layout and files](#lay--source-harness-layout-and-files)
- [CLAUDE — Root orientation](#claude--root-orientation)
- [CONFIG — Harness declaration](#config--harness-declaration)
- [SKILLS — Skill capability identity](#skills--skill-capability-identity)
- [LONG — Longevity](#long--longevity)
- [COLL — Composition boundary](#coll--composition-boundary)

## CAP — Capability publication

→ [standard](standards-compatible-harness.md)

Typed compatible-harness capability inventory and kind-specific boundaries.

- **CAP-1 [J] — Capability inventory and boundaries** — Each populated harness shelf makes its typed capabilities discoverable and routes their content and runtime semantics to the owning kind standard. (standards-compatible-harness.md#capability-publication)
  - _Review prompt:_ Review each populated shelf: are its capabilities discoverable through the compatible payload, and are kind-specific semantics delegated to the appropriate standard?

## LAY — Source-harness layout and files

→ [standard](standards-compatible-harness.md)

The five-part source container and its required physical root files.

- **LAY-1 [M] — Five-part directory layout** — skills/, subagents/, mcp/, evals/, and hooks/ all exist as physical directories at the source-harness root. (standards-compatible-harness.md#source-harness-layout)
- **LAY-2 [M] — Shelf descriptions** — Each five-part source directory contains a physical README.md declaring its purpose and status. (standards-compatible-harness.md#source-harness-layout)
- **LAY-3 [M] — Root Claude orientation** — CLAUDE.md exists as a physical file at the source-harness root. (standards-compatible-harness.md#root-orientation)
- **LAY-4 [M] — Root roadmap** — ROADMAP.md exists as a physical file at the source-harness root. (standards-compatible-harness.md#root-roadmap)
- **LAY-5 [M] — Root Knowledge Islands configuration** — .ki-config.toml exists as a physical file at the source-harness root. (standards-compatible-harness.md#harness-declaration)

## CLAUDE — Root orientation

→ [standard](standards-compatible-harness.md)

Coverage and freshness of the effective source-harness orientation.

- **CLAUDE-1 [J] — Harness introduction** — The root orientation opens by explaining the source harness and naming all five parts. (standards-compatible-harness.md#root-orientation)
  - _Review prompt:_ Does the effective root orientation explain the source harness and name all five parts?
- **CLAUDE-2 [J] — Five-part status** — The root orientation gives a current status for every source-harness part. (standards-compatible-harness.md#root-orientation)
  - _Review prompt:_ Does the orientation status table or equivalent agree with the five actual source shelves?
- **CLAUDE-3 [J] — Working conventions** — The root orientation routes working conventions for every source-harness part. (standards-compatible-harness.md#root-orientation)
  - _Review prompt:_ Does each source-harness part have concise working guidance or a route to its governing skill?
- **CLAUDE-4 [J] — Native toolchain commands** — The root orientation lists the direct ki commands and repository gates contributors need. (standards-compatible-harness.md#root-orientation)
  - _Review prompt:_ Are direct ki audit, conform, rubric-publication, test, and TypeScript gates documented without retired package aliases?
- **CLAUDE-5 [J] — Orientation freshness** — Counts, shelf statuses, capability boundaries, and command names in the orientation match the repository. (standards-compatible-harness.md#root-orientation)
  - _Review prompt:_ Do orientation claims agree with the current source shelves, compatible payload, and direct host commands?

## CONFIG — Harness declaration

→ [standard](standards-compatible-harness.md)

Knowledge Islands source-harness governance declarations.

- **CONFIG-1 [M] — Harness declaration** — A physical .ki-config.toml contains the keyless ki-harness root table. (standards-compatible-harness.md#harness-declaration)
- **CONFIG-2 [M] — Repository governance declaration** — A physical .ki-config.toml contains the ki-repo root table. (standards-compatible-harness.md#harness-declaration)
- **CONFIG-3 [J] — Skill governance declaration** — A source harness with populated skills declares ki-skills. (standards-compatible-harness.md#harness-declaration)
  - _Review prompt:_ When skills/ is populated, does .ki-config.toml declare the ki-skills governance root?

## SKILLS — Skill capability identity

→ [standard](standards-compatible-harness.md)

Recursive physical skill discovery and identity integrity within the compatible payload.

- **SKILLS-1 [M] — Skill directory and name alignment** — Each discovered physical skill root matches its SKILL.md name frontmatter. (standards-compatible-harness.md#skill-capability-identity)
- **SKILLS-2 [M + J] — Unique skill names** — No two discovered skill roots share a frontmatter name, and composed installed surfaces remain unambiguous. (standards-compatible-harness.md#skill-capability-identity)
  - _Review prompt:_ Does another installed or composed harness make an otherwise unique local skill name ambiguous?

## LONG — Longevity

→ [standard](standards-compatible-harness.md)

Refresh discipline for the compatible-harness standard.

- **LONG-1 [J] — Refresh path** — The ki-harness skill carries REFRESH and a dated source review record. (standards-compatible-harness.md)
  - _Review prompt:_ Do the ki-harness REFRESH procedure and sources.md cadence provide a usable current refresh path?

## COLL — Composition boundary

→ [standard](standards-compatible-harness.md)

Container ownership, host ownership, and sibling off-ramps.

- **COLL-1 [J] — Composition boundary** — AUDIT names its composed sibling checks and the description provides contents-governing off-ramps. (standards-compatible-harness.md#ownership-boundaries)
  - _Review prompt:_ Are the AUDIT composition list and description off-ramps complete and non-overlapping?
