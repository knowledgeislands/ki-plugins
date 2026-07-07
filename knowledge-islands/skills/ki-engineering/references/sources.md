# Sources — where the engineering standard comes from

**Refresh:** external-spec · monthly

The toolchain pins and conventions behind [the engineering standard](engineering-standard.md) and [the enforcement framework](enforcement-framework.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + [`../scripts/audit-engineering.ts`](../scripts/audit-engineering.ts), then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below. Provenance only — what changed goes in the REFRESH commit, not a changelog here.

Two layers feed the standard: the **upstream tools** (what they require / their current versions) and the **in-house convention** (the opinionated shape the sibling repos share on top). A pin is only "upstream-driven" if it traces to a tool's release; everything else is house style.

## Upstream tools (the pins the standard hard-codes)

The standard pins versions in `packageManager`, `engines`, `biome.json`'s `$schema`, and the devDependency ranges. Track the current line of each so a REFRESH knows when a pin has aged.

| Tag | Source | Governs | Pinned at | Last reviewed |
| --- | --- | --- | --- | --- |
| BUN | [bun.sh / releases][bun] | `packageManager: bun@1.3.x`; the Bun-install / Node-run split | bun@1.3.14 | 2026-07-04 |
| NODE | [Node release schedule][node] | `engines.node >= 22` (the runtime `dist/` targets) | >=22.0.0 | 2026-07-04 |
| BIOME | [biomejs.dev][biome] | `biome.json` schema + the formatter/linter config | 2.5.2 | 2026-07-04 |
| TS | [typescript releases][ts] | the `tsconfig` / `tsconfig.build` compiler options | ^6.0 | 2026-07-04 |
| VITEST | [vitest.dev][vitest] | the test runner + 100% coverage config (`vitest run`, v8) | current | 2026-07-04 |
| SYNCPACK | [syncpack][syncpack] | `ki:lint:package` (`syncpack format`) | ^15 | 2026-07-04 |
| MDLINT | [markdownlint-cli2][mdlint] / [prettier][prettier] | `ki:lint:md` ❡ | mdl ^0.23 / prettier ^3 | 2026-07-04 |
| KNIP | [knip][knip] | ki:knip (dead-code + deps gate) / ki:deps:check\|fix | current | 2026-07-04 |

❡ The Markdown mechanical pass.

## In-house (the workspace convention)

The standard is the **majority shape** across the TS/Bun repos under `knowledgeislands/`. They are the living source of truth for house style; when they diverge, the majority wins and the outlier is a finding unless documented.

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| REPOS | the 10 TS/Bun sibling repos † | the script families, tsconfig/biome/vitest shape, the build/chmod rule | 2026-06-21 |
| FRAMEWORK | harness docs ※ | the enforcement framework (modes, checker contract, rubric tagging, sources cadence) | 2026-06-21 |

† the 7 `mcp-*` servers + `ki-agentic-harness`, `ki-arcadia-principal`, `ki-website`.

※ `ki-agentic-harness/docs/skills.md` "governance-skill shape" + `docs/design.md` "Principles across the set".

## Last review

REFRESH last run **2026-07-04**. Cadence: monthly, alongside the other governance skills (the `ki-skills-refresh` routine). **Drift folded in this cycle:** the living-source repos have upgraded three toolchain pins ahead of this file, and the deps tool was replaced.

- **Pins bumped to match the repos:** Biome `2.5.0 → 2.5.2` (repo `biome.json` `$schema=2.5.1`, devDep `@biomejs/biome=2.5.2`; `2.5.2` is upstream latest), markdownlint-cli2 `^0.22 → ^0.23` (`0.23.0` latest, published ~2026-07-02), prettier confirmed `^3.9.4`. syncpack `^15.3.2` absorbs latest 15.x.
- **Deps tool replaced:** the `DEPCHECK` row is retired — `depcheck` is no longer a dependency. `ki:deps:*` and `ki:knip` are now **knip**-backed (`ki:deps:check` / `ki:deps:fix` / `ki:deps:update` + `ki:knip`), per `engineering-standard.md` §2/§5 and `audit-rubric.md`. Tracked as `KNIP` going forward.
- **Pins confirmed current:** `bun@1.3.14` (latest stable, 2026-05-13; no newer 1.3.x), `engines.node >=22.0.0` (22 Maintenance LTS, 24 Active LTS, 26 Current — floor valid; repo node `24.15.0`), TypeScript `^6.0.3` (6.0 still latest **stable**), vitest `4.1.9` (5.0 still beta).
- **Repo cross-check:** `ki-agentic-harness` self-audit = 0 fail. The prior proseWrap WARN is resolved this run — the standard, checker (`audit-engineering.ts`), and rubric now all specify `proseWrap: never`, matching the repo and `ki-authoring` house style.
- **Open watch-items:**
  - **TypeScript 7.0** (Go native port) reached **Release Candidate 2026-06-18**, GA estimated ~July 2026 (no longer "mid-to-late 2026"). Type-checking is structurally identical to 6.0. When 7.0 GAs, decide whether the `^6.0` pin tracks it or holds on 6.x — re-check next refresh.
  - **Node v27** schedule change (one major/year, every release LTS, odd/even dropped) still lands with v27; v26 is the last under the current model. Re-check the `>=22` floor and Node source wording at the first refresh after October 2026.
  - **Repo-set count:** the "10 TS/Bun repos / seven `mcp-*` servers" claim overcounts — 6 `mcp-*` on disk (9 total), and only 4 repos carry a `[ki-engineering]` table so far. Reconcile the count in SKILL.md, this footnote, README, and CLAUDE.md centrally.
  - Bun and Biome both move fast; re-pin on the next house upgrade.

[bun]: https://bun.sh/blog
[node]: https://nodejs.org/en/about/previous-releases
[biome]: https://biomejs.dev/
[ts]: https://www.typescriptlang.org/
[vitest]: https://vitest.dev/
[syncpack]: https://github.com/JamieMason/syncpack
[mdlint]: https://github.com/DavidAnson/markdownlint-cli2
[prettier]: https://prettier.io/
[knip]: https://github.com/webpro-nl/knip
