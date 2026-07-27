<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Homebrew tap structure

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-homebrew-tap --write`.

Line-by-line criteria for auditing ki-homebrew-tap. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [TAP — tap structure](#tap--tap-structure)
- [CONFIG — configuration](#config--configuration)

## TAP — tap structure

→ [standard](standards-homebrew-tap.md)

Formula layout, explicit Homebrew validation, and judgment review of tap correctness.

- **TAP-1 [M] — formula directory** — `Formula/` exists and contains at least one Ruby formula. (standards-homebrew-tap.md)
- **TAP-2 [M] — formula class** — Each formula has a `class <Camel> < Formula` declaration. (standards-homebrew-tap.md)
- **TAP-3 [M] — formula fields** — Each formula has the required metadata, install method, and test block. (standards-homebrew-tap.md)
- **TAP-4 [M] — formula description style** — Formula descriptions are no more than 80 characters and do not start with an article. (standards-homebrew-tap.md)
- **TAP-5 [M] — versioned source URLs** — Formula URLs use a tagged-release tarball rather than a branch or HEAD. (standards-homebrew-tap.md)
- **TAP-6 [M] — formula discoverability** — README.md lists every formula by name. (standards-homebrew-tap.md)
- **TAP-7 [M] — Homebrew audit** — Homebrew style and strict audit are run explicitly for every formula. (standards-homebrew-tap.md)
- **TAP-J1 [J] — tap naming** — The repository name follows Homebrew tap naming conventions. (standards-homebrew-tap.md)
  - _Review prompt:_ Does the repository name follow the `homebrew-<name>` convention without an unsafe rename?
- **TAP-J2 [J] — meaningful formula test** — Each `test do` block exercises an installed binary rather than a placeholder. (standards-homebrew-tap.md)
  - _Review prompt:_ Does each formula test exercise its installed binary with a meaningful assertion?
- **TAP-J3 [J] — install correctness** — Each install block installs the artefact the tool actually ships. (standards-homebrew-tap.md)
  - _Review prompt:_ Does each `def install` block install the artefact the tool actually ships?
- **TAP-J4 [J] — source integrity** — Checksums and release tags correspond to the declared source archive. (standards-homebrew-tap.md)
  - _Review prompt:_ Do each source URL, version, and checksum correspond to the intended release archive?
- **TAP-J5 [J] — fresh README entries** — README formula rows have accurate descriptions and source links. (standards-homebrew-tap.md)
  - _Review prompt:_ Are README formula rows complete, current, and accurate?
- **TAP-J6 [J] — CI Homebrew coverage** — Tap CI runs `brew test-bot` when local Homebrew is unavailable. (standards-homebrew-tap.md)
  - _Review prompt:_ When local Homebrew is unavailable, does CI run the appropriate Homebrew test-bot checks?

## CONFIG — configuration

→ [standard](standards-homebrew-tap.md)

The repository declares the keyless Homebrew-tap governance marker.

- **CONFIG-1 [M] — identity marker** — `.ki-config.toml` contains a keyless `[ki-homebrew-tap]` marker with no unknown keys. (standards-homebrew-tap.md)
