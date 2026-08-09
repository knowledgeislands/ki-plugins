# Sources — where the chezmoi dotfiles standard comes from

**Refresh:** external-spec · quarterly

The authoritative sources behind [the standard](standards-chezmoi-dotfiles.md), [the generated rubric](rubric.md), and its structured [rubric catalogue](../scripts/rubric/items/index.ts). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard and catalogue, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog).

Three different kinds of claim live in this standard, and they carry different confidence:

- **Tool-behavior claims** (chezmoi behavior and format-editor APIs) are grounded in the tools' own official documentation — authoritative for the documented capability, but not a guarantee that every real input round-trips byte-for-byte.
- **House-convention claims** (the shell-loader pattern, the bin/env dispatcher pattern, the Pattern A/B decision rule, the editor-selection and verification policy, the single-source multi-target templating pattern, the agent-instruction layering split, the audit-reporting etiquette) are derived from a **single anonymized case-study repo** (n=1, initially audited 2026-07-12, with the config-editing case reviewed 2026-07-14) — not a corpus the way `ki-repo`'s repo standard was derived from ten `knowledgeislands`-org repos. Treat every `[J]` criterion in the rubric as provisional until more repos have been audited against this skill and the pattern is confirmed to generalize.
- **Directly observed claims** (that `chezmoi apply` replaces a target rather than editing it in place) rest on a single measurement against one chezmoi version on one platform, because the behavior is undocumented. They are load-bearing for diagnosis, not for correctness, and REFRESH must re-measure them rather than re-fetch a page.

## Authoritative (chezmoi.io)

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [Reference: source state attributes][attributes] | the `dot_`/`executable_`/`private_`/`.tmpl` naming-prefix system and prefix stacking | 2026-07-12 |
| [Reference: `.chezmoiignore`][chezmoiignore] | ignore-file syntax, including negation-through-ignored-parents | 2026-07-12 |
| [Reference: scripts][scripts] | `run_onchange_` script semantics — when chezmoi re-runs a script | 2026-07-12 |
| [Reference: templating][templating] | `.chezmoidata`/`.chezmoitemplates`, Go-template rendering | 2026-07-12 |
| [CLI: `chezmoi doctor`][doctor] | built-in diagnostics | 2026-07-12 |
| [CLI: `chezmoi status` / `managed` / `unmanaged`][status] | drift-checking commands | 2026-07-12 |
| [CLI: `source-path` / `target-path`][source-path] | resolving between source and target paths | 2026-07-12 |

## Authoritative (format tooling)

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [TOMLKit README and limitations][tomlkit] | style-preserving TOML document model and its known ordering limitation | 2026-07-16 |
| [ruamel.yaml round-trip details][ruamel-round-trip] | comment, anchor, merge, and blank-line preservation in the round-trip API | 2026-07-16 |
| [ruamel.yaml indentation details][ruamel-indentation] | normalization limits for inconsistently indented YAML | 2026-07-16 |
| [Microsoft `jsonc-parser` utilities][jsonc-parser] | localized path edits, missing-property creation, and applying text edits | 2026-07-16 |
| [uv: running a script with dependencies][uv-script-dependencies] | `uv run --with` and `--no-project` dependency execution | 2026-07-16 |

## House convention (n=1 case study — not chezmoi.io-sourced)

| Source                                                          | Governs                   | Last reviewed |
| --------------------------------------------------------------- | ------------------------- | ------------- |
| One anonymized personal chezmoi dotfiles repo, audited directly | House patterns†           | 2026-07-12    |
| A surgical TOML patch in the same repo, reviewed directly       | Config-editing heuristic‡ | 2026-07-14    |

† Shell-loader and bin/env dispatcher patterns; Pattern A/B decision rule; single-source multi-target templating; agent-instruction layering; audit etiquette.

‡ Editor selection, missing-key handling, preservation fixtures, and idempotence.

## Direct observation (measured, not documented)

| Source                                                    | Governs                      | Last reviewed |
| --------------------------------------------------------- | ---------------------------- | ------------- |
| Inode comparison across a forced `chezmoi apply`, v2.72.0 | Apply-replaces-target claim§ | 2026-08-08    |
| `rg -a` / `nm -a` over one shipped GUI application binary | Config-surface discovery¶    | 2026-08-08    |

§ That `chezmoi apply` replaces a target rather than editing it in place, and the consequence for an application watching its own config file. Measured on one target on macOS; chezmoi.io does not document the write mechanism, so re-measure before relying on it for another platform or a materially newer chezmoi.

¶ Reading an application's own configuration surface — setting names, help text, and the defaults block — out of its shipped executable when vendor documentation does not cover it. Derived from one case (a Rust/`gpui` application on macOS, n=1); the technique's yield depends on the binary retaining readable strings and symbols, so treat a stripped or heavily optimized binary as a negative result rather than evidence the setting does not exist.

## Last review

Focused format-editor promotion, **2026-07-16** — the surgical config-editing heuristic proven in the case-study repo was generalized into the standard and bounded by the selected editors' primary documentation.

- **chezmoi.io sources**: not re-fetched in this focused review; their last-reviewed dates remain 2026-07-12.
- **Format-tooling sources**: TOMLKit, ruamel.yaml, Microsoft `jsonc-parser`, and uv documentation fetched and reviewed 2026-07-16. The standard records documented preservation behavior and explicit limits rather than promising universal byte identity.
- **House-convention source**: the same single case study, explicitly not treated as a corpus. Its TOML fixture demonstrated a byte-stable no-op round trip and missing-key creation for that file and tool version; those observations became verification requirements, not universal tool guarantees. A version-specific `dasel` limitation and the time-sensitive claim that JSON5 lacks mature tooling were deliberately not promoted. Re-confirm every `[J]` criterion once a second and third chezmoi repo have been audited against this skill; narrow or retire anything that proves case-specific.

[attributes]: https://www.chezmoi.io/reference/target-types/
[chezmoiignore]: https://www.chezmoi.io/reference/special-files-and-directories/chezmoiignore/
[scripts]: https://www.chezmoi.io/reference/scripts/
[templating]: https://www.chezmoi.io/user-guide/templating/
[doctor]: https://www.chezmoi.io/reference/commands/doctor/
[status]: https://www.chezmoi.io/reference/commands/status/
[source-path]: https://www.chezmoi.io/reference/commands/source-path/
[tomlkit]: https://github.com/python-poetry/tomlkit
[ruamel-round-trip]: https://yaml.dev/doc/ruamel.yaml/detail/#round-trip-including-comments
[ruamel-indentation]: https://yaml.dev/doc/ruamel.yaml/detail/#inconsistently-indented-yaml
[jsonc-parser]: https://github.com/microsoft/node-jsonc-parser#utilities
[uv-script-dependencies]: https://docs.astral.sh/uv/guides/scripts/#running-a-script-with-dependencies
