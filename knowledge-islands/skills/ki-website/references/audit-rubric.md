# Audit Rubric

Line-by-line pass/fail items for auditing a site against the [Eleventy site standard](eleventy-site-standard.md). Run [`../scripts/audit.ts`](../scripts/audit.ts) for the mechanical items (marked **[M]**), then judge the rest by reading. Each item cites the standard section it verifies.

Every criterion carries a stable **`WEB-N`** code — the identifier `audit.ts` / `conform.ts` emit as each finding's `area`, alongside a reference-doc pointer (the standard section) and, where file-scoped, the path. Codes are append-only: never renumber or reuse a retired one. The mechanical-only checks the linter performs but that had no prose bullet (package.json parse, the Tailwind CLI dependency, the `.ki-config.toml` opt-in table and its validate-down) carry codes **WEB-39..WEB-42**.

Severity: **FAIL** (ship-stopper — the site won't build or `dist/` isn't portable), **WARN** (layout / config / Tailwind divergence), **POLISH** (SEO / consistency) — the shared ladder, defined in `ki-engineering`'s [`enforcement-framework.md`](../../../foundations/ki-engineering/references/enforcement-framework.md) §2.

> **Common toolchain → `ki-engineering`.** This rubric is the **site-build delta** only. The Bun mandate, aggregate/scoped audit wiring, direct code-tool execution, `tsconfig`/`biome`, and TypeScript checking are the common engineering layer — **run `ki:engineering:audit` first**. Serving the built `dist/` is **`ki-website-cloudflare`** — run its audit too if the site is deployed. The repo is fully clean only when every applicable audit passes.

Applicability: `[ki-website]` or an `eleventy.config.{ts,js,mjs,cjs}` at the repository root / `site/` activates the complete audit. With neither, **WEB-41** emits exactly one `NA` and stops; a declaration or config marker retains all existing failures and warnings. (§2)

## Contents

- [Stack](#stack-1)
- [Layout](#layout-2)
- [eleventy.config.ts](#eleventyconfigts-4)
- [Tailwind](#tailwind-5)
- [Content](#content-6)
- [SEO](#seo-7)
- [Scripts](#scripts-8)
- [dist/ contract](#dist-contract-9)
- [Longevity & staleness](#longevity--staleness-1)
- [Reporting](#reporting)

## Stack (§1)

- [ ] **WEB-1** [M] FAIL — `@11ty/eleventy` `^3.x` is a dependency. (§1)
- [ ] **WEB-2** [M] WARN — **not** an `astro` / `next` / SPA project (those deps absent). (§1)
- [ ] **WEB-3** [M] WARN — TypeScript runs natively (Bun, or plain `node` on Node ≥ 24 — type stripping stable/unflagged); **no `tsx`** (the `tsx` dep / `tsx/esm` runner is mechanically flagged; the "runs natively" claim is judged). (§1, §10)
- [ ] **WEB-4** [J] WARN — Nunjucks is the template engine (`htmlTemplateEngine`/`markdownTemplateEngine` = `'njk'`); content is `.md`, logic is `.njk`. (§1)
- [ ] **WEB-5** [J] POLISH — Lucide is the icon source (passthrough from `node_modules`, initialised client-side). (§1)

## Layout (§2)

- [ ] **WEB-6** [M] FAIL — exactly one `eleventy.config.ts`, under `site/` (the workspace package — every house site is a monorepo, never flat; a flat repo-root config is WARN). (§2)
- [ ] **WEB-7** [M] WARN — `ROADMAP.md` present. (§2)
- [ ] **WEB-9** [M] FAIL — `src/` (under `site/`) has `_data/`, `_includes/layouts/`, `_includes/partials/`, `assets/css/`. (§2, §3)
- [ ] **WEB-39** [M] FAIL — `package.json` is present and parseable (foundational — the stack/scripts checks read it). (§2)
- [ ] **WEB-41** [M] WARN — on an applicable site, the `[ki-website]` opt-in table is present in `.ki-config.toml` (`audit.ts --educate` scaffolds it). (§2)
- [ ] **WEB-42** [M] WARN — no unknown keys under `[ki-website]` (validate-down — the marker table takes no keys today). (§2)
- [ ] **WEB-8** [J] WARN — the root `package.json` declares a `workspaces` array that includes `site` (the monorepo shape, engineering §0; not yet mechanically checked). (§2)
- [ ] **WEB-10** [J] WARN — every site script carries the `site:` prefix (driven by the monorepo shape, not by observing the folder). (§2, §8)
- [ ] **WEB-11** [J] WARN — structure (nav, ordering) lives in a typed `_data/*.ts` single source, not hard-coded across templates. (§3)

## eleventy.config.ts (§4)

- [ ] **WEB-12** [M] FAIL — a transform rewrites absolute internal URLs to relative (the portable-`dist/` transform; `toRelativeOutputUrl` / `explicit-index-links` per the standard). (§4, §9)
- [ ] **WEB-13** [M] WARN — `addDataExtension('ts', …)` registered, calling a function default export. (§4)
- [ ] **WEB-14** [M] WARN — `addDataExtension('json5', …)` registered. (§4)
- [ ] **WEB-15** [M] WARN — `eleventyConfig.on('eleventy.before', …)` compiles Tailwind in build mode (CLI invoked), guarded off `serve`/`watch`. (§4)
- [ ] **WEB-16** [M] WARN — `addWatchTarget` on the compiled `dist/assets/css/main.css` (mechanically checked); Lucide + `external-link-icons` transform present (judged). (§4)
- [ ] **WEB-17** [J] POLISH — filters (`jsonDump`/`unique`/`groupBy`) and ordered collections where a section needs them. (§4)

## Tailwind (§5)

- [ ] **WEB-18** [M] FAIL — **no `tailwind.config.*`** anywhere (config-less Tailwind 4). (§5)
- [ ] **WEB-40** [M] WARN — `@tailwindcss/cli` is a dependency (the config-less Tailwind 4 build tool). (§5)
- [ ] **WEB-19** [M] WARN — `main.css` begins `@import "tailwindcss"`, then imports `tokens.css` (+ page partials). (§5)
- [ ] **WEB-20** [M] WARN — `tokens.css` exposes its vars to utilities via `@theme inline`. (§5)
- [ ] **WEB-21** [J] WARN — `tokens.css` defines the semantic palette in `@layer base :root {}` (`--background`/`--foreground`/`--primary`/… + brand/layout vars), sampled from the site's imagery; self-hosted fonts use `@font-face` + `font-display: swap`. (§5)
- [ ] **WEB-22** [J] WARN — templates use the tokens; no hard-coded hex values in templates. (§5)

## Content (§6)

- [ ] **WEB-23** [J] WARN — pages are Markdown with YAML front matter, grouped into content folders. (§6)
- [ ] **WEB-24** [J] WARN — folder front matter (`layout`, section/tag) is set by a `*.11tydata.json`/`.js` cascade file, not repeated per page. (§6)
- [ ] **WEB-25** [J] POLISH — structured JSON5 data, where present, is validated at build (Zod) and aborts on a bad record. (§6, optional)

## SEO (§7)

- [ ] **WEB-26** [M] WARN — a `seo-meta` partial exists under `_includes/partials/`. (§7)
- [ ] **WEB-27** [J] WARN — `seo-meta` is **included from `base.njk`** so every page carries canonical + OG + Twitter tags. (§7)
- [ ] **WEB-28** [J] POLISH — `noindex` front matter emits the robots meta on non-indexed pages (e.g. `404`). (§7)
- [ ] **WEB-29** [J] POLISH — a **public** site ships `sitemap.xml` + `robots.txt` (admin-only sections excluded) and a webmanifest + favicons. (§7)

## Scripts (§8)

- [ ] **WEB-30** [M] WARN — a build script invokes Eleventy with `--config=eleventy.config.ts`; a dev script runs Tailwind `--watch` + Eleventy `--serve --port 3000` via `concurrently`. (`ki:site:build`, `ki:site:dev`.) (§8)
- [ ] **WEB-31** [M] WARN — the `concurrently` dev script fans out to `ki:site:dev:css` (the Tailwind watcher) and `ki:site:dev:serve` (the Eleventy server). (§8)
- [ ] **WEB-32** [M] WARN — `ki:site:clean` present. TypeScript checking belongs inside `ki:engineering:audit`; the aggregate gate is `ki:audit`, not a parallel site-specific verify script. (§8)

## dist/ contract (§9)

- [ ] **WEB-33** [M] FAIL — `site/dist/` is gitignored (entry in `site/.gitignore` or as `site/dist/` from the repo root). (§9)
- [ ] **WEB-36** [M] POLISH — `assets.directory` in `site/wrangler.jsonc` is `"dist"`/`"./dist"` (pointing at `site/dist/`) — a misplaced `"../dist"` is FAIL; verified in full by `ki-website-cloudflare`, named here as the seam. (§9)
- [ ] **WEB-34** [J] FAIL — the build emits relative internal links (the §4 transform actually fires over `.html`), so `dist/` serves from any root. (§9)
- [ ] **WEB-35** [J] WARN — `dist/` is never hand-edited; it is fully regenerated by the build. (§9)

## Longevity & staleness (§1)

Mirrors the `ki-skills` rubric's **LONG-1**.

- [ ] **WEB-37** [J] WARN — volatile facts (Eleventy/Tailwind/Lucide versions, the spec idioms the config relies on) sit in `package.json` / the standard, not scattered — a bump is one known edit.
- [ ] **WEB-38** [J] POLISH — this audit runs against a **current** standard: a cited requirement is confirmed by Mode REFRESH + [`sources.md`](sources.md) not having gone stale since its `last reviewed` date.

## Reporting

Produce a findings table grouped by severity, each row: `severity · file:line · what · fix`. Close with: (a) any intentional, documented divergences you chose **not** to flag (e.g. an internal site skipping sitemap/robots), and (b) a one-line verdict (compliant / minor drift / blockers). Name the sibling audits that must also pass — `ki:engineering:audit` (toolchain) and, if deployed, `ki-website-cloudflare` — for the repo to be fully clean.
