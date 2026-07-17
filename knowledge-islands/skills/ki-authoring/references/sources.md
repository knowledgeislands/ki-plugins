# Sources — where the authoring conventions come from

**Refresh:** external-spec · monthly

The sources behind [markdown-authoring.md](markdown-authoring.md) and [toml-config.md](toml-config.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the conventions, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). The house style is mostly internally owned, but it sits on top of these external tools and specs, which move — so this is the skill's memory of what it rests on.

## Authoritative

| Source                   | Governs                                                            | Last reviewed |
| ------------------------ | ------------------------------------------------------------------ | ------------- |
| [CommonMark spec][cm]    | the Markdown syntax baseline                                       | 2026-07-04    |
| [Prettier options][pr]   | what the formatter normalises — `proseWrap`, `printWidth` (140)    | 2026-07-04    |
| [markdownlint rules][ml] | the `MDxxx` rules enforced (`MD013` off, `MD060`, `MD051`/`MD052`) | 2026-07-04    |
| [TOML spec][toml]        | TOML syntax for the shared `.ki-config.toml`                       | 2026-07-04    |

[cm]: https://spec.commonmark.org/
[pr]: https://prettier.io/docs/options
[ml]: https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md
[toml]: https://toml.io/en/v1.1.0

## Last review

REFRESH last run **2026-07-04** against CommonMark, Prettier, markdownlint, and the TOML spec (sources above).

- **CommonMark:** accessible. Version 0.31.2 (released 2024-01-28) confirmed still current; no newer version. Syntax baseline unchanged.
- **Prettier:** accessible. Latest release now **v3.9.4** (the 3.9 major landed 2026-06-27; up from v3.6.0 last run). `proseWrap` (default `"preserve"`, **house `"never"`**) and `printWidth` (default `80`, house `140`) unchanged. Correction: the previous run's block mis-stated the house `proseWrap` as `always`; the actual `.prettierrc.json` value is `"never"`, matching SKILL.md and markdown-authoring.md. No new options affect the judgment conventions. Note: 3.9 replaced the Markdown parser (remark-parse v8 → micromark v4) for stronger CommonMark/GFM compliance — a mechanical-layer change (Prettier's domain, not a judgment convention), but worth verifying `ki:authoring:conform` output stays stable when this repo bumps Prettier past 3.9.
- **markdownlint:** confirmed unchanged. Still lists MD013 (off in house config), MD051/MD052 (reference-link validation), MD059 (descriptive link text), MD060 (table-column-style); MD060 remains the highest-numbered rule. No new or deprecated rules.
- **TOML:** v1.1.0 spec page still shows "Published on 12/18/2025", presented as finalized; the v1.1.0 URL was already tracked. Its additions (multi-line / trailing-comma inline tables, `\e` and `\xHH` escapes, optional datetime seconds) are additive and do not touch `.ki-config.toml` formatting (lowercase `snake_case` keys, double-quoted strings, inline arrays, one-table-per-skill, `#` comments all unchanged).
- **Convention change this run:** none to the judgment layer (wide-table → footnote, link style, `.ki-config.toml` formatting remain correct). One factual correction to this block (house `proseWrap` is `"never"`, not `always`).
- **Open watch-items:**
  - Prettier v4.0 (performance-focused CLI, in progress) and the 3.9 micromark parser swap — confirm the house Markdown output is unaffected on the next Prettier bump in this repo.
  - exemplars.md line 30 corrected this run (now `proseWrap: never`); its "Collections" table still duplicates this source list — reconcile the duplication in a future CONFORM pass.
