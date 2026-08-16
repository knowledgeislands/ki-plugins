# Sources — where the engineering standard comes from

**Refresh:** external-spec · monthly

The toolchain pins and conventions behind [the engineering standard](standards-engineering.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard, rubric, and [canonical item catalogue](../scripts/rubric/items/index.ts), then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below. Provenance only — what changed goes in the REFRESH commit, not a changelog here.

Two layers feed the standard: the **upstream tools** (what they require / their current versions) and the **in-house convention** (the opinionated shape the sibling repos share on top). A pin is only "upstream-driven" if it traces to a tool's release; everything else is house style.

## Upstream tools (the pins the standard hard-codes)

The standard pins versions in `packageManager`, `engines`, `biome.json`'s `$schema`, and the devDependency ranges. Track the current line of each so a REFRESH knows when a pin has aged.

| Tag | Source | Governs | Pinned at | Last reviewed |
| --- | --- | --- | --- | --- |
| BUN | [Bun releases][bun] | `packageManager` and `mise` runtime line; Bun-install / Node-run split | declared and resolved `1.3.14` | 2026-08-12 |
| NODE | [Node release schedule][node] | `engines.node >= 22` for `dist/` | declared floor `>=22` | 2026-08-12 |
| BIOME | [Biome releases][biome] | `biome.json` schema + formatter/linter config | declared and resolved `2.5.7` | 2026-08-12 |
| TS | [TypeScript releases][ts] | `tsconfig` / `tsconfig.build` compiler options | declared range and resolved `7.0.2` | 2026-08-12 |
| VITEST | [Vitest guide][vitest] | config-gated test profile + 100% coverage (`vitest run`, v8) | capability-selected | 2026-08-12 |
| SYNCPACK | [syncpack releases][syncpack] | package ordering inside engineering audit/conform | declared range and resolved `15.3.3` | 2026-08-12 |
| MDLINT | [rumdl releases][rumdl] | Markdown audit/conform inside `ki-authoring` ❡ | declared `^0.2.54`, resolved `0.2.54` | 2026-08-12 |
| KNIP | [knip releases][knip] | dependency + dead-code checks inside engineering audit/conform | declared range and resolved `6.32.0` | 2026-08-12 |

❡ The Markdown mechanical pass.

## In-house (the workspace convention)

The standard is a **deliberately selected house shape**, not a vote count. Current configured repositories and this harness's committed tool files are supporting implementation evidence; the normative rules live in the standard and its registered rubric.

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| HARNESS | `package.json` + `bun.lock` † | declared ranges and exact resolved versions for the canonical harness | 2026-08-12 |
| COLLECTION | current configured collection ※ | house-shape comparison during a deliberate refresh, not a normative repository count | 2026-08-12 |
| FRAMEWORK | harness rubric sources ‡ | mode, checker, judgment-status, and generated-publication contracts | 2026-08-12 |

† `package.json` expresses the compatible range where one is selected; `bun.lock` is the resolved evidence for this harness. They are distinct.

※ derive this during the current refresh from `.ki-config.toml` selectors; do not hard-code an inventory in this skill.

‡ `ki-skills` rubric-authoring standard and this skill's canonical item catalogue.

## Last review

REFRESH last run **2026-08-12**. Cadence: monthly, alongside the other governance skills.

- **Reconciled declared and resolved evidence:** the canonical harness declares Bun `1.3.14`, Biome `2.5.7`, TypeScript `^7.0.2`, syncpack `^15.3.3`, knip `^6.32.0`, and rumdl `^0.2.54`; its committed lock resolves `1.3.14`, `2.5.7`, `7.0.2`, `15.3.3`, `6.32.0`, and `0.2.54` respectively.
- **Current upstream comparison:** Bun `1.3.14`, Biome `2.5.7`, TypeScript `7.0.2`, syncpack `15.3.3`, and rumdl `0.2.54` match the reviewed releases. Knip has a newer `6.32.2` release, but the selected `^6.32.0` range already admits that compatible update; this review does not force a lockfile refresh unrelated to the confirmed rumdl fixes.
- **Authority correction:** upstream release pages establish availability, `package.json` establishes the selected compatible range, and `bun.lock` establishes this harness's resolved evidence. Sibling inventory is supporting observation only; the prior hard-coded repository count is removed from this skill.
- **Toolchain contract correction:** the current ADR, standard, catalogue, and source record agree that registered native operations own governance and code-tool execution; retired package aliases are not restored.

[bun]: https://bun.sh/blog
[node]: https://nodejs.org/en/about/previous-releases
[biome]: https://github.com/biomejs/biome/releases
[ts]: https://github.com/microsoft/typescript-go/releases
[vitest]: https://vitest.dev/
[syncpack]: https://github.com/JamieMason/syncpack/releases
[rumdl]: https://github.com/rvben/rumdl/releases
[knip]: https://github.com/webpro-nl/knip/releases
