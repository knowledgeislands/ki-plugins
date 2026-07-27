<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Eleventy static-site build

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-website --write`.

Line-by-line criteria for auditing ki-website. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [WEB — Eleventy website standard](#web--eleventy-website-standard)

## WEB — Eleventy website standard

→ [standard](standards-eleventy-site.md)

The static-site stack, workspace layout, generated output, and sustainable operating boundary.

- **WEB-1 [M] — Eleventy dependency** — `@11ty/eleventy` `^3.x` is a dependency. (standards-eleventy-site.md)
- **WEB-2 [M] — Eleventy rather than SPA stack** — Astro and Next dependencies are absent. (standards-eleventy-site.md)
- **WEB-3 [M] — Native TypeScript runner** — TypeScript runs natively on Bun or modern Node; the legacy `tsx` runner is absent. (standards-eleventy-site.md)
- **WEB-4 [J] — Nunjucks template engine** — Nunjucks is the HTML and Markdown template engine; content is Markdown and template logic is Nunjucks. (standards-eleventy-site.md)
  - _Review prompt:_ Does the configuration use Nunjucks and keep content and template logic in their intended forms?
- **WEB-5 [J] — Lucide icon source** — Lucide is delivered by passthrough and initialized client-side. (standards-eleventy-site.md)
  - _Review prompt:_ Is Lucide the icon source and is it wired through the intended passthrough/client pattern?
- **WEB-6 [M] — Site workspace configuration** — One Eleventy configuration lives under the `site/` workspace; a flat configuration is WARN. (standards-eleventy-site.md)
- **WEB-7 [M] — Roadmap** — `ROADMAP.md` is present. (standards-eleventy-site.md)
- **WEB-8 [J] — Workspace declaration** — The root package manifest declares a workspace containing `site`. (standards-eleventy-site.md)
  - _Review prompt:_ Does the root workspace declaration include `site`?
- **WEB-9 [M] — Source layout** — `src/` has `_data/`, `_includes/layouts/`, `_includes/partials/`, and `assets/css/`. (standards-eleventy-site.md)
- **WEB-10 [J] — Site script prefix** — Every site script carries the `site:` prefix. (standards-eleventy-site.md)
  - _Review prompt:_ Do site scripts carry the required `site:` prefix?
- **WEB-11 [J] — Typed structure data** — Navigation and ordering live in a typed `_data/*.ts` source. (standards-eleventy-site.md)
  - _Review prompt:_ Does typed `_data` own navigation and ordering rather than repeated template literals?
- **WEB-12 [M] — Portable URL transform** — A transform rewrites absolute internal URLs to relative URLs. (standards-eleventy-site.md)
- **WEB-13 [M] — TypeScript data extension** — `addDataExtension('ts', …)` is registered. (standards-eleventy-site.md)
- **WEB-14 [M] — JSON5 data extension** — `addDataExtension('json5', …)` is registered. (standards-eleventy-site.md)
- **WEB-15 [M] — Tailwind lifecycle hook** — `eleventy.before` compiles Tailwind in build mode. (standards-eleventy-site.md)
- **WEB-16 [M] — CSS watch target** — `addWatchTarget` observes the compiled CSS. (standards-eleventy-site.md)
- **WEB-17 [J] — Configuration helpers** — Filters and ordered collections use the documented patterns where needed. (standards-eleventy-site.md)
  - _Review prompt:_ Where the content needs them, do filters and ordered collections use the documented patterns?
- **WEB-18 [M] — Config-less Tailwind** — No `tailwind.config.*` exists. (standards-eleventy-site.md)
- **WEB-19 [M] — Tailwind import pair** — `main.css` imports `tailwindcss`, then `tokens.css`. (standards-eleventy-site.md)
- **WEB-20 [M] — Token utility exposure** — `tokens.css` exposes variables through `@theme inline`. (standards-eleventy-site.md)
- **WEB-21 [J] — Semantic design tokens** — Semantic palette and self-hosted fonts follow the standard. (standards-eleventy-site.md)
  - _Review prompt:_ Do semantic tokens and self-hosted fonts follow the standard rather than embedding arbitrary presentation values?
- **WEB-22 [J] — Template token use** — Templates consume semantic tokens without hard-coded hex values. (standards-eleventy-site.md)
  - _Review prompt:_ Do templates consume semantic tokens without hard-coded hex colours?
- **WEB-23 [J] — Markdown content** — Pages are Markdown with YAML front matter and sensible content folders. (standards-eleventy-site.md)
  - _Review prompt:_ Are pages Markdown with YAML front matter and grouped into sensible content folders?
- **WEB-24 [J] — Folder data cascade** — Cascade files own repeated folder-level front matter. (standards-eleventy-site.md)
  - _Review prompt:_ Do cascade data files own repeated folder-level front matter?
- **WEB-25 [J] — JSON5 validation** — Structured JSON5 is validated during the build. (standards-eleventy-site.md)
  - _Review prompt:_ Where structured JSON5 exists, is it validated during the build and does invalid data stop the build?
- **WEB-26 [M] — SEO metadata partial** — A `seo-meta` partial exists under `_includes/partials/`. (standards-eleventy-site.md)
- **WEB-27 [J] — Site-wide SEO metadata** — `base.njk` includes the SEO partial. (standards-eleventy-site.md)
  - _Review prompt:_ Does base.njk include seo-meta so all pages receive canonical, Open Graph, and Twitter metadata?
- **WEB-28 [J] — Noindex metadata** — `noindex` front matter emits robots metadata. (standards-eleventy-site.md)
  - _Review prompt:_ Does noindex front matter emit robots metadata on intentionally non-indexed pages?
- **WEB-29 [J] — Public site discovery assets** — Public sites ship scoped discovery and application assets. (standards-eleventy-site.md)
  - _Review prompt:_ Where the site is public, does it ship and scope the required discovery and application assets?
- **WEB-30 [M] — Site build and development scripts** — Build invokes Eleventy and development uses `concurrently`. (standards-eleventy-site.md)
- **WEB-31 [M] — Development script fan-out** — The development script fans out to CSS watch and Eleventy serve scripts. (standards-eleventy-site.md)
- **WEB-32 [M] — Site cleanup script** — `ki:site:clean` is present. (standards-eleventy-site.md)
- **WEB-33 [M] — Dist ignore** — Generated site output is gitignored at the correct workspace path. (standards-eleventy-site.md)
- **WEB-34 [J] — Portable generated links** — Built HTML contains portable relative internal links. (standards-eleventy-site.md)
  - _Review prompt:_ Does the built HTML actually contain portable relative internal links?
- **WEB-35 [J] — Generated dist boundary** — `dist/` is fully generated and never hand-edited. (standards-eleventy-site.md)
  - _Review prompt:_ Is dist treated as fully generated build output and never hand-edited?
- **WEB-36 [M] — Hosting assets directory seam** — A site workspace Wrangler assets directory points at `dist`. (standards-eleventy-site.md)
- **WEB-37 [J] — Volatile facts have one home** — Volatile versions and idioms have one canonical home. (standards-eleventy-site.md)
  - _Review prompt:_ Do volatile facts live in package metadata or the standard rather than being scattered through implementation?
- **WEB-38 [J] — Current standard** — Mode REFRESH has recently confirmed the cited sources. (standards-eleventy-site.md)
  - _Review prompt:_ Has Mode REFRESH confirmed the cited sources and updated the review record recently enough?
- **WEB-39 [M] — Parseable package manifest** — `package.json` is physical and parseable. (standards-eleventy-site.md)
- **WEB-40 [M] — Tailwind CLI dependency** — `@tailwindcss/cli` is a dependency. (standards-eleventy-site.md)
- **WEB-41 [M] — Website opt-in** — Applicable sites declare `[ki-website]`. (standards-eleventy-site.md)
- **WEB-42 [M] — Website opt-in validation** — The marker table has no unknown keys. (standards-eleventy-site.md)
