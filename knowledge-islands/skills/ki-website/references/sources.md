# Sources — where the standard comes from

**Refresh:** external-spec · monthly

The authoritative and in-house sources behind the [Eleventy site standard](eleventy-site-standard.md) and [Audit Rubric](audit-rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + [`scripts/audit.ts`](../scripts/audit.ts), then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

Two layers feed the standard: the **upstream tools** (Eleventy, Tailwind, Lucide — what they support and how they're configured) and the **in-house convention** (the shape the standard defines on top of those tools). A finding is only "upstream-driven" if it traces to the Authoritative table; everything else is house style and should be labelled as such.

## Authoritative (upstream tools)

| Tag      | Source                     | Governs                                                                  | Last reviewed |
| -------- | -------------------------- | ------------------------------------------------------------------------ | ------------- |
| ELEVENTY | [Eleventy docs][11ty]      | Config API: `addTransform`, `addDataExtension`, `eleventy.before`, `dir` | 2026-07-04    |
| TAILWIND | [Tailwind CSS v4 docs][tw] | Config-less `@import "tailwindcss"`, `@theme inline`, the CLI            | 2026-07-04    |
| LUCIDE   | [Lucide docs][lucide]      | Icon delivery (UMD passthrough, client educate)                          | 2026-07-04    |

## In-house (the website convention)

The standard is self-contained; it is the source of truth for house style. Any conformant site repo that carries a `[ki-website]` table is an example, not a source.

| Tag | Source           | Governs                                                         | Last reviewed |
| --- | ---------------- | --------------------------------------------------------------- | ------------- |
| ENG | `ki-engineering` | The toolchain layer this composes on (referenced, not restated) | 2026-07-04    |

## Last review

REFRESH last run **2026-07-04**. Re-fetched all three upstream sources against the live npm registry; standard confirmed current — patch/canary bumps only, no drift to the config-less idioms the standard depends on. Date bump for ELEVENTY, TAILWIND, LUCIDE, ENG.

- **Pins:** Eleventy `^3.1.x` (stable **3.1.6**, 2026-06-02 — unchanged since last review; v4 still pre-release, canary advanced alpha-8 → **4.0.0-alpha.10**, 2026-07-01), `@tailwindcss/cli` `^4.3.x` (current **4.3.2**, 2026-06-29 — patch over 4.3.1; `^4.3.x` still valid), Lucide vanilla `lucide` **1.23.0** (2026-07-01). TypeScript runs natively on Bun (or plain `node` on Node ≥ 24 — type stripping stable/unflagged; `--experimental-strip-types` a no-op); `tsx` recorded as legacy.
- **Confirmed conformant upstream:** config-less Tailwind 4 `@import "tailwindcss"`, `@theme` / `@theme inline` unchanged; 4.3.x is additive and does not touch our config-less idioms. Eleventy `addTransform`, `addDataExtension('ts'|'json5', { read: false, parser })`, and the `eleventy.before` hook all current, no rename/deprecation. Vanilla `lucide` 1.23.0 still ships the UMD build (`unpkg: dist/umd/lucide.min.js`) + client-side `createIcons()` our standard uses — verified directly this pass.
- **Open watch-items:** **Eleventy v4** still on the horizon (canary alpha-10; v4's experimental zero-config `.ts` data/config may make our hand-rolled `addDataExtension('ts')` optional) — re-anchor the config API when it lands. **Lucide v1 UMD exception** — framework packages dropped UMD; vanilla `lucide` keeps it as the documented exception (still true at 1.23.0). Watch in case the exception is later withdrawn. **Tailwind `@theme` / `@import` surface** and **Node type-stripping** confirmed stable — routine, kept tracked.

[11ty]: https://www.11ty.dev/docs/
[tw]: https://tailwindcss.com/docs
[lucide]: https://lucide.dev/guide/
