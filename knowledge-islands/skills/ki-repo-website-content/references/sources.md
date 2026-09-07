# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and in-house sources behind the [Eleventy site standard](standards-eleventy-site.md) and [Audit Rubric](rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + native rubric definition, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

Two layers feed the standard: the **upstream tools** (Eleventy, Tailwind, Lucide — what they support and how they're configured) and the **in-house convention** (the shape the standard defines on top of those tools). A finding is only "upstream-driven" if it traces to the Authoritative table; everything else is house style and should be labelled as such.

## Authoritative (upstream tools)

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| ELEVENTY | [Eleventy docs][11ty] | Config API: `addTransform`, `addDataExtension`, `eleventy.before`, `dir` | 2026-08-22 |
| TAILWIND | [Tailwind CSS v4 docs][tw] | Config-less `@import "tailwindcss"`, `@theme inline`, the CLI | 2026-08-22 |
| LUCIDE | [Lucide docs][lucide] | Icon delivery (UMD passthrough, client educate) | 2026-08-22 |

## In-house (the website convention)

The standard is self-contained; it is the source of truth for house style. Any conformant site repo that carries a `[skills.ki-repo-website-content]` table is an example, not a source.

| Tag | Source           | Governs                                                                 | Last reviewed |
| --- | ---------------- | ----------------------------------------------------------------------- | ------------- |
| ENG | `ki-engineering` | Separately coverage-selected toolchain layer (referenced, not restated) | 2026-08-22    |

## Last review

REFRESH last run **2026-08-22**. Re-fetched all three upstream sources and their current package metadata. The standard remains current: no source change affects its Eleventy 3, config-less Tailwind 4, or vanilla Lucide delivery contract.

- **Current packages:** Eleventy remains stable at **3.1.6** and its `4.0.0-alpha.10` canary remains pre-release. `@tailwindcss/cli` is **4.3.3**, a compatible patch update. Vanilla `lucide` is **1.33.0**.
- **Confirmed conformant upstream:** Eleventy documents `addTransform`, `addDataExtension`, and `eleventy.before`; Tailwind still documents `@import "tailwindcss"` and `@theme`; and Lucide's vanilla package still serves `dist/umd/lucide.min.js` with `createIcons()`. No source renamed or deprecated the standard's required surface.
- **Open watch-items:** re-anchor Eleventy's config API when v4 becomes stable. Continue to verify the vanilla Lucide UMD distribution and Tailwind's `@import` / `@theme` surface each refresh.

[11ty]: https://www.11ty.dev/docs/
[tw]: https://tailwindcss.com/docs
[lucide]: https://lucide.dev/guide/
