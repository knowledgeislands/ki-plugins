# Authoring enforcement standard

The cross-format mechanical contract for Knowledge Islands authoring. It is separate from the Markdown and TOML standards because it governs the formatter/linter boundary, wholly owned repository configuration, and safe hosted execution rather than human choices inside either document format.

## Contents

- [Owned configuration](#owned-configuration)
- [Markdown gate](#markdown-gate)
- [Hosted conform safety](#hosted-conform-safety)
- [Synchronisation](#synchronisation)

## Owned configuration

The `ki-authoring` skill wholly owns `.prettierrc.json`, `.editorconfig`, and `.markdownlint-cli2.jsonc`. A repository has no legitimate local variation in these files: AUDIT compares each regular file with its canonical template, and CONFORM scaffolds a missing file or replaces a drifted regular file.

A path that exists but is not a regular non-symlink file is a violation and is not proposed for replacement. This makes the ownership rule explicit without following a link or replacing a directory, device, or other unsafe target.

## Markdown gate

AUDIT runs Prettier in check mode and then markdownlint-cli2 against the repository's authored Markdown, excluding generated, vendored, dependency, and runtime-projection paths. The commands receive fixed argument arrays; no repository path or file content is interpolated into a shell program.

CONFORM requests the corresponding Prettier write pass and markdownlint-cli2 fix pass in the rubric's `NORMALISE` phase. The formatter commands are part of the session's final proposal rather than launched by a rubric item.

The [Markdown authoring standard](standards-markdown.md) defines the judgment choices left after this mechanical gate.

## Hosted conform safety

Rubric items change only operation-scoped drafts or request a bounded command. The session emits one final proposal: owned configuration writes first, then Markdown normalisation commands. The `ki` host validates and publishes writes transactionally, executes commands without a shell, and re-audits persistent state before deriving fixed findings.

AUDIT never exposes draft capabilities, CONFORM never writes directly from the skill, and neither mode carries a skill-local reporter or transaction layer.

## Synchronisation

The authored standards, structured rubric catalogue, generated `rubric.md` publication, and `sources.md` refresh record describe the same conventions. A convention change updates the applicable standard and catalogue item, regenerates the publication, and reconciles the source record when provenance or refresh state changed.
