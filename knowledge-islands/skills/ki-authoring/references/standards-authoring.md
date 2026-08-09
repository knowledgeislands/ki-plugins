# Authoring enforcement standard

The cross-format mechanical contract for Knowledge Islands authoring. It is separate from the Markdown and TOML standards because it governs the formatter/linter boundary, wholly owned repository configuration, and safe hosted execution rather than human choices inside either document format.

## Contents

- [Owned configuration](#owned-configuration)
- [Markdown gate](#markdown-gate)
- [Hosted conform safety](#hosted-conform-safety)
- [Synchronisation](#synchronisation)

## Owned configuration

The `ki-authoring` skill wholly owns `.editorconfig` and `.rumdl.toml`. AUDIT compares each regular file with its canonical template, and CONFORM scaffolds a missing file or replaces a drifted regular file.

An evidenced exception is the narrow safety valve for a repository whose regular owned file must remain non-canonical. It belongs under the owning skill's table and maps an exact currently owned filename to a non-empty reason:

```toml
[skills.ki-authoring.owned_file_exceptions]
".rumdl.toml" = "Preserves verbatim correspondence whose list markers are source evidence."
```

AUDIT still reports the declared drift as a WARN with its reason and the recommendation to return to the house template. CONFORM skips only that named regular drifted file; it does not merge a template delta, interpret local settings, or make the exception conforming. Unknown names, blank reasons, a malformed table, and a stale declaration against a canonical file are warnings to correct. A declaration never suppresses scaffolding of a missing file or the safety refusal for an unsafe path.

`.prettierrc.json`, `.prettierignore`, and `.markdownlint-cli2.jsonc` are retired. AUDIT warns while any of them survives and CONFORM removes it, because a leftover configuration is not inert: an editor extension reads it and reformats Markdown against a standard this repository no longer holds.

A path that exists but is not a regular non-symlink file is a violation and is not proposed for replacement. This makes the ownership rule explicit without following a link or replacing a directory, device, or other unsafe target.

## Adopting a mechanical tool

A gate reporting clean is not evidence that a fix was safe. It says the result satisfies the rules, which is a different claim, and the gap between the two is where a formatter does its worst damage: an autofix that corrupts a document usually produces something the same tool then accepts, so the corruption is invisible to exactly the check meant to catch it.

Adopting or upgrading a formatter or linter therefore means reading the diff, not reading the exit code. Sample the files it rewrote, in each shape the estate actually contains — nested lists, blockquotes inside list items, tables followed by prose, and any content whose meaning depends on layout. A rule that damages one of those is disabled with its reason and its reproduction recorded, so the decision can be revisited rather than rediscovered.

The same caution applies to a rule-selection flag. Confirm the tool is running the rules being claimed, because the failure mode there is also a clean report rather than an error.

Every canonical template must be stored already formatted to the house width, so that CONFORM's output is a fixed point of the formatter that governs that file type. A template the repository's own rumdl or Biome would rewrite makes CONFORM non-idempotent: the write lands, the next formatter pass — `lint-staged` on commit is enough — reformats it, and the following AUDIT reports drift again, in every repository the template reaches. Round-trip each template when adding or editing one: write it, run the governing formatter, and confirm the diff is empty.

## Markdown gate

AUDIT runs `rumdl check` against the repository's authored Markdown. The excluded paths — generated, vendored, dependency, and runtime-projection — are declared in `.rumdl.toml` itself rather than passed as a glob list, so a bare `rumdl check` at the repository root means exactly what the gate means. Trade records are authored Markdown like any other and are formatted with the rest: their integrity is proven by the `ki-trades` `AUTH-1` comparison against the sender's copy, which is insensitive to formatting and sensitive to meaning, so an exclusion list is neither needed nor sufficient — it only avoided touching the records, never checked them, and never covered Biome. It also inspects Markdown frontmatter for safely removable scalar quotes under the [Markdown authoring standard](standards-markdown.md#frontmatter). The commands receive fixed argument arrays; no repository path or file content is interpolated into a shell program.

CONFORM requests `rumdl check --fix` in the rubric's `NORMALISE` phase — `check --fix` rather than `fmt`, because `fmt` exits zero even when unfixable violations remain and would let CONFORM report success over a file it could not settle, together with host-validated direct writes for safely canonicalized frontmatter. The formatter commands are part of the session's final proposal rather than launched by a rubric item.

The [Markdown authoring standard](standards-markdown.md) defines the judgment choices left after this mechanical gate.

## Hosted conform safety

Rubric items change only operation-scoped drafts or request a bounded command. The session emits one final proposal: owned configuration writes first, then Markdown normalisation commands. The `ki` host validates and publishes writes transactionally, executes commands without a shell, and re-audits persistent state before deriving fixed findings.

AUDIT never exposes draft capabilities, CONFORM never writes directly from the skill, and neither mode carries a skill-local reporter or transaction layer.

## Synchronisation

The authored standards, structured rubric catalogue, generated `rubric.md` publication, and `sources.md` refresh record describe the same conventions. A convention change updates the applicable standard and catalogue item, regenerates the publication, and reconciles the source record when provenance or refresh state changed.
