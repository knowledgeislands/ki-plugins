# Sources — where the authoring conventions come from

**Refresh:** external-spec · monthly

The sources behind [the enforcement standard](standards-authoring.md), [the Markdown standard](standards-markdown.md), and [the TOML standard](standards-toml.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the conventions, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). The house style is mostly internally owned, but it sits on top of these external tools and specs, which move — so this is the skill's memory of what it rests on.

## Authoritative

| Source                      | Governs                                                            | Last reviewed |
| --------------------------- | ------------------------------------------------------------------ | ------------- |
| [CommonMark spec][cm]       | the Markdown syntax baseline                                       | 2026-07-04    |
| [Prettier options][pr]      | what the formatter normalises — `proseWrap`, `printWidth` (160)    | 2026-07-04    |
| [markdownlint rules][ml]    | the `MDxxx` rules enforced (`MD013` off, `MD060`, `MD051`/`MD052`) | 2026-07-04    |
| [GitHub alert guidance][ga] | GitHub alert labels, purpose, and Markdown form                    | 2026-07-24    |
| [TOML spec][toml]           | TOML syntax for the shared `.ki-config.toml`                       | 2026-07-04    |

[cm]: https://spec.commonmark.org/
[pr]: https://prettier.io/docs/options
[ml]: https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md
[ga]: https://docs.github.com/en/contributing/style-guide-and-content-model/style-guide#alerts
[toml]: https://toml.io/en/v1.1.0

## Last review

REFRESH last run **2026-07-24**. CommonMark, Prettier, markdownlint, and the TOML spec were reviewed on 2026-07-04; GitHub alert guidance was reviewed on 2026-07-24.

- **CommonMark:** accessible. Version 0.31.2 (released 2024-01-28) confirmed still current; no newer version. Syntax baseline unchanged.
- **Prettier:** accessible. Latest release now **v3.9.4** (the 3.9 major landed 2026-06-27; up from v3.6.0 last run). `proseWrap` (default `"preserve"`, **house `"never"`**) and `printWidth` (default `80`, house `160`) unchanged. Correction: the previous run's block mis-stated the house `proseWrap` as `always`; the actual `.prettierrc.json` value is `"never"`, matching SKILL.md and the Markdown standard. No new options affect the judgment conventions. Note: 3.9 replaced the Markdown parser (remark-parse v8 → micromark v4) for stronger CommonMark/GFM compliance — a mechanical-layer change (Prettier's domain, not a judgment convention), but worth verifying `ki repo conform --skill ki-authoring` output stays stable when this repo bumps Prettier past 3.9.
- **markdownlint:** confirmed unchanged. Still lists MD013 (off in house config), MD051/MD052 (reference-link validation), MD059 (descriptive link text), MD060 (table-column-style); MD060 remains the highest-numbered rule. No new or deprecated rules.
- **GitHub alerts:** added as a judgment convention. GitHub documents five labels (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `CAUTION`), advises using alerts sparingly, and reserves them for information important enough to break prose flow.
- **TOML:** v1.1.0 spec page still shows "Published on 12/18/2025", presented as finalized; the v1.1.0 URL was already tracked. Its additions (multi-line / trailing-comma inline tables, `\e` and `\xHH` escapes, optional datetime seconds) are additive and do not touch `.ki-config.toml` formatting (lowercase `snake_case` keys, double-quoted strings, inline arrays, one-table-per-skill, `#` comments all unchanged).
- **Convention change this run:** none to the judgment layer (wide-table → footnote, link style, `.ki-config.toml` formatting remain correct). One factual correction to this block (house `proseWrap` is `"never"`, not `always`).
- **Open watch-items:**
  - Prettier v4.0 (performance-focused CLI, in progress) and the 3.9 micromark parser swap — confirm the house Markdown output is unaffected on the next Prettier bump in this repo.
