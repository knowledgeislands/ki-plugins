# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and in-house sources behind the [Cloudflare hosting standard](cloudflare-hosting-standard.md) and [Audit Rubric](audit-rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + [`scripts/audit-cloudflare-hosting.ts`](../scripts/audit-cloudflare-hosting.ts), then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

Two layers feed the standard: **Cloudflare's platform** (what Workers + Static Assets supports and how `wrangler` is configured) and the **in-house convention** (the shape the canonical deployed site uses on top of it). A finding is only "platform-driven" if it traces to the Authoritative table; everything else is house style and should be labelled as such.

## Authoritative (Cloudflare platform)

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| ASSETS | [Workers · Static Assets][assets] | The `assets` block and its keys † | 2026-07-04 |
| WRANGLER | [wrangler configuration][wrangler] | `name`, `compatibility_date`, `routes`/`custom_domain`, `observability` | 2026-07-04 |
| PAGES | [Pages → Workers migration / status][pages] | Whether Pages remains the recommended target for static sites ‡ | 2026-07-04 |

† `directory`, `binding`, `html_handling`, `not_found_handling`.

‡ It does not.

## In-house (the hosting convention)

The standard is self-contained; it is the source of truth for house style. Any conformant site repo that carries a `[ki-website-cloudflare]` table is an example, not a source.

| Tag   | Source       | Governs                                                 | Last reviewed |
| ----- | ------------ | ------------------------------------------------------- | ------------- |
| BUILD | `ki-website` | The `dist/` seam this serves (referenced, not restated) | 2026-06-21    |

## Last review

REFRESH last run **2026-07-04**. Re-fetched the three Cloudflare sources live; **no drift** — every config key, default, and deploy rule the standard, rubric, and checker name is current and correctly named. Date bump on the three Authoritative rows + confirmed current.

- **Pins:** `wrangler` `^4.x` — current release **4.106.0**, still major **v4** (Workers Sites/legacy-assets removed in v4; no schema-breaking v5, and v3 support only reaches EOL Q1 2027). Deploy model: Workers + Static Assets via `wrangler deploy` (never `wrangler pages deploy`).
- **Static-Assets config surface (confirmed, mature):** `assets.directory` (the seam), `binding`, and the optional per-site keys with their verbatim defaults — `html_handling` defaults to `"auto-trailing-slash"`, `not_found_handling` defaults to `"none"`, `run_worker_first` defaults to `false` (all re-confirmed this run against the wrangler config reference, `dateModified` 2026-07-03). `observability.enabled` "Defaults to true for all new Workers"; `custom_domain` "Defaults to false". The standard correctly treats the three optional keys as per-site and does not require them. **New this run (immaterial to the static-only standard):** `run_worker_first` is now typed `boolean | string[]` (route-pattern globs with `!` exceptions), and an `assets_navigation_prefers_asset_serving` compatibility flag exists for `compatibility_date >= 2025-04-01` — both are Worker-present concerns, out of scope for a pure static site.
- **Pages vs Workers:** Cloudflare still steers **new** static sites to Workers + Static Assets (new features focus on Workers; `wrangler pages` nudges to `wrangler deploy`). The migration page still does **not** call Pages "deprecated" — it frames migration as optional/low-friction (now with an AI-assisted migration prompt) and notes Workers has the "distinctly broader set of features", while the compatibility matrix retains a few Pages-only advantages (custom domains outside CF zones). The standard's "Cloudflare steers new sites to Workers + Static Assets" wording (standard §1 + SKILL.md) remains accurate; the operational rule (never `pages deploy`) is unchanged.
- **Open watch-items:** watch for a `wrangler` major bump (v5) that changes the config schema — re-confirm only on a major bump (the `assets` surface is otherwise mature). Re-confirm the Pages↔Workers guidance hasn't reversed (it has only hardened toward Workers so far). Track whether `run_worker_first`'s route-pattern form or the `assets_navigation_prefers_asset_serving` flag ever becomes relevant to the static-only seam (currently not).

[assets]: https://developers.cloudflare.com/workers/static-assets/
[wrangler]: https://developers.cloudflare.com/workers/wrangler/configuration/
[pages]: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
