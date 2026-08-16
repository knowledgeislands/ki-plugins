# Sources — where the authoring conventions come from

**Refresh:** external-spec · monthly

The sources behind [the enforcement standard](standards-authoring.md), [the Markdown standard](standards-markdown.md), and [the TOML standard](standards-toml.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the conventions, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). The house style is mostly internally owned, but it sits on top of these external tools and specs, which move — so this is the skill's memory of what it rests on.

## Authoritative

| Source                      | Governs                                                     | Last reviewed |
| --------------------------- | ----------------------------------------------------------- | ------------- |
| [CommonMark spec][cm]       | the Markdown syntax baseline                                | 2026-08-12    |
| [rumdl rules][ru]           | the `MDxxx` rules enforced, their options, and reflow modes | 2026-08-12    |
| [rumdl global settings][rgs] | configuration-file and global-setting semantics | 2026-08-12 |
| [rumdl CLI][rcli] | `check --fix` behaviour and exit semantics | 2026-08-12 |
| [rumdl releases][rr] | current upstream release | 2026-08-12 |
| [GitHub alert guidance][ga] | GitHub alert labels, purpose, and Markdown form             | 2026-08-12    |
| [TOML spec][toml]           | TOML syntax for the shared `.ki-config.toml`                | 2026-08-12    |

[cm]: https://spec.commonmark.org/
[ru]: https://rumdl.dev/rules
[rgs]: https://rumdl.dev/global-settings/
[rcli]: https://rumdl.dev/usage/cli/
[rr]: https://github.com/rvben/rumdl/releases
[ga]: https://docs.github.com/en/contributing/style-guide-and-content-model/style-guide#alerts
[toml]: https://toml.io/en/v1.1.0

## Last review

REFRESH last run **2026-08-12**. CommonMark 0.31.2, TOML 1.1.0, GitHub alerts, rumdl's rules/configuration/CLI documentation, and the rumdl release surface were rechecked.

- **CommonMark:** accessible. Version 0.31.2 (released 2024-01-28) confirmed still current; no newer version. Syntax baseline unchanged.
- **rumdl:** v0.2.54 released 2026-08-11. Direct `rumdl 0.2.54 check --fix` reproductions preserve the MD005 nested-list and MD075 table-followed-prose fixtures. The included `dda35d54d654` fix also treats an aliased wikilink as one MD056 cell under the Obsidian flavor; other flavors deliberately retain GFM pipe semantics. This repository uses the standard flavor and forbids wikilinks, so MD056 is enabled for detection and listed as unfixable to prevent a destructive standard-flavor autofix. `MD033`, `MD036`, and `MD057` remain separate house/content decisions. The global-settings and CLI references are the authority for config discovery and `check --fix`, rather than the rules page alone.
- **GitHub alerts:** added as a judgment convention. GitHub documents five labels (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `CAUTION`), advises using alerts sparingly, and reserves them for information important enough to break prose flow.
- **TOML:** v1.1.0 remains current. Its additions are additive and do not affect value quoting, short inline arrays, or explanatory comments. Key and table identity are intentionally excluded here because `ki-repo` owns that semantic contract.
- **Convention change this run:** table column alignment moves from the mechanical layer to the judgment layer, because no rumdl setting reproduces the former conditional padding. The wide-table → footnote convention is now load-bearing rather than advisory.
- **Standing check:** a rule this configuration disables is a deferral, not a verdict. Re-test each one against its recorded reproduction on every rumdl upgrade, and re-enable the ones upstream has fixed — otherwise a defensive setting outlives the defect and quietly costs the coverage it was meant to protect.
- **Open watch-items:**
  - `MD056` is fixed for aliased wikilinks under the Obsidian flavor in 0.2.54. Under the standard flavor, `[[Target|Label]]` correctly retains GFM pipe semantics and is reported as an extra table cell. The house configuration keeps that useful finding but marks MD056 unfixable, so `check --fix` preserves the source. Re-test both flavors and the no-fix guard on each upgrade.
  - Block constructs are recognised on soft-wrapped continuation lines, which is one root cause behind three separate corruptions. A line beginning `##]` is admitted as an ATX heading although CommonMark requires a space after the hash run, and `MD022`, `MD018` and `MD026` then split the paragraph and delete its full stop. An empty list item after a wrapped line is read as a setext heading, and `MD003` injects a literal `##` mid-sentence. `MD030` reads `8.Does ownership...` as a marker with no space and inserts one. To re-test each: run the construct through `rumdl check --fix` and through a reference CommonMark parser, and confirm they now agree. No rule is disabled here in the house configuration, because the harness content does not carry these constructs — `kit-legal` disables `MD030` locally and defuses the other two by rejoining the wraps at source.
  - `MD013` reflow silently skips any paragraph containing a `|`, so a wikilink-heavy base is less normalised than a clean gate implies. Non-destructive, and no rule is disabled for it. To re-test: write a wrapped paragraph containing `[[Target|Label]]` and confirm `rumdl check --fix` joins it to one line.
  - `MD060` mis-handles a placeholder table whose only body row holds `-` cells, stripping the padding and leaving it misaligned while reporting clean. Even once fixed, re-enabling needs the separate judgment above, since no style reproduces the former conditional padding: `aligned` rewrites every wide table into one long row and `any` enforces nothing.
  - `MD057` is disabled pending a decision about published skill copies, whose links into the source repository's `docs/` tree resolve there and dangle in the publication. This one waits on a decision here, not on upstream. Triaged: this repository's own findings were all genuine and are fixed, and the findings elsewhere are genuinely broken links except in `ki-repo-plugins`, where they are the publication artefact described above. Enabling the rule estate-wide would fail that repository for links correct at source.
  - rumdl is pre-1.0 and single-maintainer; confirm the house Markdown output is unaffected on each bump. The estate is a fixed point of this configuration, so any diff on upgrade is a regression to investigate rather than an improvement to accept.
  - Biome does not support Markdown at all (no `markdown` key in its schema); if that changes it would displace rumdl's formatter role but not its linter role, since the structural and link-integrity rules have no Biome counterpart.
