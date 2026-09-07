# Eleventy site standard

The normative, quotable reference for the Knowledge Islands content website standard — what a good site looks like, and why. The audit rubric ([rubric.md](rubric.md)) turns each section into checkable items; the procedure is in the [SKILL.md](../SKILL.md). See [the source list](sources.md) for provenance.

This skill owns the **site-build delta**. The toolchain it sits on (Bun mandate, aggregate/scoped audit wiring, direct code-tool execution, `tsconfig`/`biome`, and TypeScript checking) is `ki-engineering`'s and is referenced here, not restated.

Use this implementation when the website is a collection of pages generated from Markdown or structured data. A single interactive SPA is a legitimate non-adoption: select `ki-repo-website-app` instead. Eleventy does not bundle React application JavaScript, so combining both implementations would introduce two build systems and is outside the current standard.

The standard applies only when a repository declares a keyless `[skills.ki-repo-website-content]` table in `.ki.toml`. The content skill consumes the site root selected by `[skills.ki-repo-website].site-root`; it does not declare a second path key. An `eleventy.config.{ts,js,mjs,cjs}` file is coverage evidence for `ki-repo`, not local selection authority; an undeclared site receives one `NOT_APPLICABLE` result here.

## Contents

- [1. Stack](#1-stack)
- [2. Repo layout — the selected site application](#2-repo-layout--the-selected-site-application)
- [3. The `src/` shape](#3-the-src-shape)
- [4. `eleventy.config.ts` patterns](#4-eleventyconfigts-patterns)
- [5. Tailwind 4, config-less](#5-tailwind-4-config-less)
- [6. Content model](#6-content-model)
- [7. SEO](#7-seo)
- [8. Dev-workflow delta](#8-dev-workflow-delta)
- [9. The `dist/` contract](#9-the-dist-contract)

## 1. Stack

- **Eleventy 3** (`@11ty/eleventy` `^3.x`) is the generator — a static-site generator, **not** a JS application framework. **Not** Astro, Next, React/Vite, or a SPA. The output is HTML + CSS + a little progressive-enhancement JS.
- **Nunjucks** (`.njk`) is the template engine for both HTML templates and Markdown (`htmlTemplateEngine: 'njk'`, `markdownTemplateEngine: 'njk'`). **Markdown** (`.md`) carries prose content; `.njk` carries logic/layout.
- **TypeScript runner is declared, not proven.** Package scripts select Bun or modern Node and reject `tsx`; actual config or data execution is explicit runtime evidence. `tsc` is used only for `--noEmit` type-checking, which is the `ki-engineering` layer.
- **Bun is mandated** as the package manager and runtime. The Bun-install / Node-run split, the `packageManager: bun@…` pin, `engines`, aggregate/scoped audit wiring, and internal code-tool checks are `ki-engineering`'s — this standard assumes them.
- **Lucide** provides icons, copied from `node_modules` as a passthrough and initialised client-side (no build-time icon framework).

## 2. Repo layout — the selected site application

Every house 11ty/Cloudflare site repo is a **monorepo** in the `ki-engineering` sense (§0 there): the root `package.json` declares a `workspaces` array, and the site is its own application workspace. The conventional site root is **`apps/site/`**, covered by `"workspaces": ["apps/*"]` from day one. A repository may explicitly select another safe repository-relative root through `[skills.ki-repo-website].site-root`; `site-root = "."` is the flat-layout override. Adding a companion deployable later (a bot or ingress Worker — **out of this skill's scope**, see [SKILL.md](../SKILL.md) boundaries) is then a pure addition rather than a migration of reusable packages.

- The site lives at `<site-root>/` (conventionally `apps/site/`) with its own `eleventy.config.ts`, `src/`, `package.json`, and `tsconfig.json`.
- The build emits **`./dist`** inside the selected site root (`<site-root>/dist/`; conventionally `apps/site/dist/`). Each application workspace owns its output directory, with no cross-workspace output coupling. A hosting adapter consumes that exact path.
- The selected site package owns ordinary local scripts: `build`, `dev`, `dev:css`, `dev:serve`, and `clean`. The repository root owns the public `ki:site:*` lifecycle aliases through `ki-repo-website`; the content package does not duplicate them.

The site root is the directory selected by the website core and containing `eleventy.config.ts`. The `workspaces` declaration is governed by `ki-engineering`; this skill verifies its content-specific consequences.

## 3. The `src/` shape

Under the site root, `src/` is Eleventy's input directory and follows a fixed shape:

```text
src/
├── _data/                      # global data, available in every template
│   ├── site.ts                 # the SiteConfig (title, description, url, …) — typed, default-exported
│   └── *.ts | *.json5          # structure, nav, collections config — the single source of truth
├── _includes/
│   ├── layouts/
│   │   ├── base.njk            # the <html> shell: <head> meta, fonts, main.css, nav, footer, scripts
│   │   └── *.njk               # page/section layouts that extend or wrap base
│   └── partials/
│       ├── seo-meta.njk        # canonical + OG + Twitter tags, included from base
│       ├── nav.njk · footer.njk
│       └── *.njk               # reusable fragments
├── assets/
│   ├── css/                    # main.css + tokens.css + page partials (§5)
│   ├── js/                     # progressive-enhancement scripts, kept small
│   ├── images/ · fonts/        # passthrough-copied verbatim
└── <content>/                  # Markdown pages, grouped in folders, each with a *.11tydata.json cascade
```

- **Structure lives in `_data/`, not in templates.** A single typed `_data/*.ts` object (e.g. a reading-order / nav definition) drives nav, ordering, and prev/next, so the shape has one source of truth.
- **`_includes/layouts/` vs `partials/`**: a layout is a whole-page frame (`base.njk` and its extensions); a partial is an `{% include %}`-d fragment.

## 4. `eleventy.config.ts` patterns

The config is `export default function (eleventyConfig) { … return { dir, … } }`. These patterns are expected:

- **Portable-`dist/` transform.** An `addTransform` rewrites absolute internal `href`/`src` URLs to paths relative to the current output file (skipping `http(s):`/`mailto:`/`tel:`/`data:`/`#`), so `dist/` serves from any root. The canonical shape is a `toRelativeOutputUrl` helper inside a transform named `explicit-index-links`. **This is invariant 2** — the seam to hosting (§9).
- **`.ts` data extension.** `addDataExtension('ts', { read: false, parser })` dynamically imports the file and, mirroring Eleventy's JS handling, **calls the default export if it is a function** (sync or async), else uses it directly.
- **`.json5` data extension.** `addDataExtension('json5', { read: false, parser: JSON5.parse(readFileSync(...)) })` — JSON5 for human-edited data (comments, trailing commas).
- **Tailwind in the lifecycle.** `eleventyConfig.on('eleventy.before', ({ runMode }) => …)` runs the Tailwind CLI with `--minify` when `runMode` is **not** `serve`/`watch` (i.e. a one-shot build), and `addWatchTarget('…/dist/assets/css/main.css')` reloads the dev server when the parallel `--watch` process rewrites the CSS. **This is invariant 4.**
- **Lucide passthrough** + an `external-link-icons` transform that appends an external-link glyph to `https?://` anchors.
- **Filters**, where used: `jsonDump` (debug), `unique`, `groupBy`. **Collections** sorted by front-matter order keys where a content section needs ordering.
- **`return { dir: { input: 'src', output: './dist', includes: '_includes', data: '_data' }, htmlTemplateEngine: 'njk', markdownTemplateEngine: 'njk', templateFormats: ['njk','md','html'] }`** — output resolves to `dist/` inside the selected site root, per §2.

## 5. Tailwind 4, config-less

- **No `tailwind.config.*` file** anywhere. Tailwind 4 is configured in CSS. **This is invariant 1.**
- **`main.css` is the entry point** and an import chain: `@import "tailwindcss"` first, then `tokens.css`, then page/section partials (`base.css`, `home.css`, `nav.css`, …). A lean site imports only `tokens.css` + a couple of partials; a full site imports several.
- **`tokens.css` defines semantic design tokens** as CSS custom properties in `@layer base :root { … }` — a shadcn/ui-style palette (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--radius`, …) plus brand and layout vars, **sampled from the site's brand/hero imagery**. `@font-face` for any self-hosted font sits here too (`font-display: swap`).
- **`@theme inline { … }`** then exposes those vars to Tailwind utilities (`--color-background: var(--background)`, `--font-sans: …`, the `--radius-*` scale), so utilities and raw CSS share one palette. Templates use the tokens; they do **not** hard-code hex values.
- **Declare `tailwindcss` directly, not just `@tailwindcss/cli`.** Tailwind 4 resolves `@import "tailwindcss"` from the CSS file's directory upward, needing a top-level `node_modules/tailwindcss`. In the monorepo shape (§2), bun's workspace hoisting does **not** give a _transitive_ dep (tailwindcss arrives via `@tailwindcss/cli`) a top-level symlink, so the import fails with `Can't resolve 'tailwindcss'` on a clean install. Listing `tailwindcss` as its own dependency (matching the CLI's major) restores the entry. A flat repo happens to hoist it top-level anyway, which is why this only bites after the monorepo migration.

## 6. Content model

- **Pages are Markdown** (`.md`) with YAML front matter (`title`, `description`, and page-specific keys), grouped into content folders.
- **Cascade data files** (`<folder>.11tydata.json` or `.js`) set shared front matter for a whole folder — typically `layout` and a section/tag — so individual pages stay prose-only.
- **Structured data lives in `_data/`** as typed `.ts` (or `.json5`) — the single source of truth for nav and ordering (§3).
- **Optional: build-time validation.** A site with structured JSON5 data may validate it with **Zod** at build time and abort on a bad record (the `5g-emerge` pattern) — promoted here as an _optional capability_, not a requirement.

## 7. SEO

- **`seo-meta.njk`** partial emits the canonical link, Open Graph, and Twitter-card tags from `site` data + page front matter, and is **included from `base.njk`** so every page carries it.
- **`noindex`** front matter (e.g. on `404.njk`) emits `<meta name="robots" content="noindex, nofollow">` and nothing else.
- **A public site ships `sitemap.xml` and `robots.txt`** (generated from a `.njk` template over the page collection; exclude any admin-only section). **A webmanifest + favicons** complete the head. (An internal/unlisted site may skip sitemap/robots — a judgment call, not a blocker.)

## 8. Dev-workflow delta

The selected site package owns the content-specific local scripts; the root-owned public lifecycle aliases belong to `ki-repo-website`:

- **`dev`** — `concurrently` runs Tailwind `--watch` through `dev:css` and Eleventy `--serve --port 3000` through `dev:serve`, named `css`,`11ty`.
- **`build`** — invokes `bun …/@11ty/eleventy/cmd.cjs --config=eleventy.config.ts`; the `eleventy.before` hook compiles Tailwind with `--minify`.
- **`clean`** — removes `dist/` and `.wrangler/` where present.

TypeScript checking runs inside the registered `ki-engineering` rubric; do not add parallel `types` or `verify` scripts. These ordinary scripts execute within the selected site package. Root `ki:site:build`, `ki:site:dev`, and `ki:site:clean` aliases delegate to them; that public seam belongs to `ki-repo-website`.

## 9. The `dist/` contract

The build's output, and the **only** thing `ki-repo-website-cloudflare` needs:

- a tree of static files with **relative** internal links (the §4 transform), so it serves from any root;
- `dist/assets/css/main.css` (Tailwind, minified in build mode), plus passthrough `assets/{js,images,fonts}/`;
- for a public site, `sitemap.xml` + `robots.txt`;
- `dist/` is **gitignored** and fully regenerated by the build — never hand-edited. When a source route is removed or renamed, run `ki:site:clean` immediately before the validation build and confirm its former output path is absent: Eleventy does not prune obsolete output itself.

`dist/` sits inside the selected site root (`<site-root>/dist/`; conventionally `apps/site/dist/`), per §2. A selected hosting adapter points at that exact output. **Building `dist/` is this skill; serving it belongs to the hosting adapter.**
