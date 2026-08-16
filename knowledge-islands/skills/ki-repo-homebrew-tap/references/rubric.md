<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Homebrew tap structure

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-homebrew-tap --write`.

Line-by-line criteria for auditing ki-repo-homebrew-tap. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [TAP — tap structure](#tap--tap-structure)
- [CONFIG — configuration](#config--configuration)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## TAP — tap structure

→ [standard](standards-homebrew-tap.md)

Formula layout, static source evidence, and judgment review of tap correctness.

- **TAP-1 [M] — formula directory** — `Formula/` exists and contains at least one Ruby formula. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Correct the tap formula or release evidence through the responsible maintainer; hosted conform does not infer release or package semantics.
- **TAP-2 [M] — formula class** — Each formula has a `class <Camel> < Formula` declaration. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Correct the tap formula or release evidence through the responsible maintainer; hosted conform does not infer release or package semantics.
- **TAP-3 [M] — formula fields** — Each formula has the required metadata, install method, and test block. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Correct the tap formula or release evidence through the responsible maintainer; hosted conform does not infer release or package semantics.
- **TAP-4 [M] — formula description style** — Formula descriptions are no more than 80 characters and do not start with an article. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Correct the tap formula or release evidence through the responsible maintainer; hosted conform does not infer release or package semantics.
- **TAP-5 [M] — versioned source URLs** — Formula URLs use a tagged-release tarball rather than a branch or HEAD. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Correct the tap formula or release evidence through the responsible maintainer; hosted conform does not infer release or package semantics.
- **TAP-6 [M] — formula discoverability** — README.md lists every formula by name. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Correct the tap formula or release evidence through the responsible maintainer; hosted conform does not infer release or package semantics.
- **TAP-7 [M] — Homebrew audit** — Homebrew style and strict audit are explicit external diagnostics; this static audit never executes Homebrew. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Correct the tap formula or release evidence through the responsible maintainer; hosted conform does not infer release or package semantics.
- **TAP-J1 [J] — tap naming** — The repository name follows Homebrew tap naming conventions. (standards-homebrew-tap.md)
  - _Evidence scope:_ The Homebrew tap, its formulae, release evidence, and CI configuration.
  - _Review prompt:_ Does the repository name follow the `homebrew-<name>` convention without an unsafe rename?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tap through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TAP-J2 [J] — meaningful formula test** — Each `test do` block exercises an installed binary rather than a placeholder. (standards-homebrew-tap.md)
  - _Evidence scope:_ The Homebrew tap, its formulae, release evidence, and CI configuration.
  - _Review prompt:_ Does each formula test exercise its installed binary with a meaningful assertion?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tap through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TAP-J3 [J] — install correctness** — Each install block installs the artefact the tool actually ships. (standards-homebrew-tap.md)
  - _Evidence scope:_ The Homebrew tap, its formulae, release evidence, and CI configuration.
  - _Review prompt:_ Does each `def install` block install the artefact the tool actually ships?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tap through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TAP-J4 [J] — source integrity** — Checksums and release tags correspond to the declared source archive. (standards-homebrew-tap.md)
  - _Evidence scope:_ The Homebrew tap, its formulae, release evidence, and CI configuration.
  - _Review prompt:_ Do each source URL, version, and checksum correspond to the intended release archive?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tap through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TAP-J5 [J] — fresh README entries** — README formula rows have accurate descriptions and source links. (standards-homebrew-tap.md)
  - _Evidence scope:_ The Homebrew tap, its formulae, release evidence, and CI configuration.
  - _Review prompt:_ Are README formula rows complete, current, and accurate?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tap through its responsible maintainer, record a named gap, or record an explicit justified exclusion.
- **TAP-J6 [J] — CI Homebrew coverage** — Tap CI runs `brew test-bot` when local Homebrew is unavailable. (standards-homebrew-tap.md)
  - _Evidence scope:_ The Homebrew tap, its formulae, release evidence, and CI configuration.
  - _Review prompt:_ When local Homebrew is unavailable, does CI run the appropriate Homebrew test-bot checks?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the tap through its responsible maintainer, record a named gap, or record an explicit justified exclusion.

## CONFIG — configuration

→ [standard](standards-homebrew-tap.md)

The repository declares the keyless Homebrew-tap governance marker.

- **CONFIG-1 [M] — identity marker** — `.ki-config.toml` contains a keyless `[skills.ki-repo-homebrew-tap]` marker with no unknown keys. (standards-homebrew-tap.md)
  - _Remediation:_ diagnostic — Declare the selected standard through the repository configuration owner.
