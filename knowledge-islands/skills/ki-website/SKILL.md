---
name: ki-website
implies: [ki-website-cloudflare]
vendors: [educate, audit, conform, help]
description: >-
  Codifies, audits, and enforces the Knowledge Islands static-site standard: Eleventy 3 with Nunjucks and Markdown, TypeScript run natively on Bun, Tailwind 4 in config-less mode with semantic design tokens, and a portable `dist/` output. Use when building a new KI static site, auditing an existing site against the standard, conforming one to the standard, or scaffolding the initial `eleventy.config.ts`, Tailwind token pair, `src/` layout, and SEO wiring. Triggers: "audit my 11ty site", "does this site follow our standard", "scaffold a new 11ty site", "conform this site to KI standard", "build a static site with Eleventy", "my Tailwind build isn't generating any output", "add a page layout". Builds on ki-engineering (the aggregate/scoped Bun code-toolchain gate) and ki-authoring (Markdown style); for deploying the built `dist/` to Cloudflare use ki-website-cloudflare. Not for Astro, Next, or other frameworks.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands 11ty website standard

You are applying the **Knowledge Islands 11ty website standard** — the shared way every static website in this work is built: **Eleventy 3, Nunjucks and Markdown; TypeScript run natively on Bun; Tailwind 4 config-less with design tokens**, compiling to a **portable `dist/`**. A new site is scaffolded to it; an existing one is audited and conformed against it. This skill carries that standard and the procedure.

This is a **standard, base-agnostic Process skill**. It hard-codes no single repo; it applies to any repo carrying a `[ki-website]` table in its `.ki-config.toml`. How it sits beside the other skills, and where it must not overlap them, is documented once in the ki-agentic-harness `README.md`.

This skill owns the **site-build delta** only. The generic toolchain (Bun mandate, aggregate/scoped audit wiring, and direct `tsconfig`/Biome/TypeScript checks) is `ki-engineering`'s; Markdown/TOML style is `ki-authoring`'s; **serving the built `dist/`** on Cloudflare is `ki-website-cloudflare`'s. It **composes** on top of those rather than restating them.

The full, quotable standard is [the Eleventy site standard](references/eleventy-site-standard.md); the line-by-line pass/fail items are in [the audit rubric](references/audit-rubric.md); the tracked provenance is [the source list](references/sources.md). A mechanical checker is [`scripts/audit.ts`](scripts/audit.ts). Read those for detail; this file is the operating procedure.

## The stack at a glance

```text
<repo>/                         # monorepo — root package.json workspaces: ["site"] from day one
├── package.json                # workspaces: ["site"] — the site is always its own workspace package
└── site/                       # the site workspace (never a flat repo-root layout)
    ├── eleventy.config.ts      # export default (eleventyConfig) ⇒ { dir, htmlTemplateEngine: 'njk', … }
    ├── src/
    │   ├── _data/              # global data: *.ts (default export, called if a function) + *.json5
    │   ├── _includes/
    │   │   ├── layouts/        # base.njk (the <html> shell) + page layouts
    │   │   └── partials/       # nav, footer, seo-meta — reusable fragments
    │   ├── assets/css/         # main.css → @import "tailwindcss" + tokens.css (@theme inline) + page partials
    │   ├── assets/{js,images,fonts}/
    │   └── <content>/          # Markdown pages + *.11tydata.json cascade (layout, section)
    └── dist/                   # BUILD OUTPUT — portable (relative URLs), gitignored. The seam to hosting.
```

A companion deployable (a bot, an ingress Worker — out of this skill's scope) is a pure **addition** to the workspaces list (`["site", "ingress"]`), not the reason workspaces appear. Each workspace owns its own `dist/`; `site/` always emits to `./dist` (`site/dist/`).

Four invariants define the standard — most findings are a breach of one:

1. **Config-less Tailwind 4.** No `tailwind.config.*`; `main.css` is `@import "tailwindcss"` then `tokens.css`, whose semantic CSS vars are exposed to utilities via `@theme inline`.
2. **The build emits a portable `dist/`.** An `addTransform` rewrites absolute internal URLs to relative ones, so `dist/` serves from any root. This is the contract `ki-website-cloudflare` consumes.
3. **TypeScript runs natively — no transpile.** `eleventy.config.ts` and `_data/*.ts` run under Bun; `.ts` + `.json5` data extensions are registered in the config. `tsc` is type-check only (engineering's layer).
4. **Tailwind compiles inside the Eleventy lifecycle.** An `eleventy.before` hook runs the Tailwind CLI in build mode; dev runs a parallel `--watch` and an `addWatchTarget` on the compiled CSS.

## Composition — how a site repo gets fully audited

The checker is the **site-build layer**; the toolchain and hosting layers each audit their own. They compose by being **run in sequence**, never by importing each other (each skill is symlinked standalone):

```text
ki:engineering:audit <repo>                          →  common toolchain (aggregate/scoped wiring + direct code tools)
  then audit.ts <repo>                   →  site-build delta (THIS skill)
  then audit.ts <repo>         →  serving the dist/ (if the site is deployed to Cloudflare)
```

A repo is "clean" only when **every applicable** skill's audit passes. The `.ki-config.toml` tables are the selector: `[ki-engineering]` marks the common layer; `[ki-website]` marks this one; `[ki-website-cloudflare]` marks the hosting layer.

## The `dist/` contract (the seam to hosting)

This skill's output, and the only thing the hosting skill needs: a `dist/` of static files with **relative** internal links (the URL transform), Tailwind compiled to `dist/assets/css/main.css`, passthrough assets, and — for a public site — `sitemap.xml` + `robots.txt`. `dist/` is gitignored and regenerated by the build. `dist/` lives inside the `site/` workspace (`site/dist/`) — the path `ki-website-cloudflare` points `assets.directory` at.

## Operating modes

Carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** — EDUCATE scaffolds a new site. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows. The mode shape itself is defined in `ki-engineering`'s enforcement framework.

### Mode AUDIT — check a site against the standard

1. **Run the common layer first.** `bun ki-engineering/scripts/audit.ts <repo>` covers the shared toolchain. Don't re-derive it here.
2. **Run the mechanical checker.** `bun <skill>/scripts/audit.ts <repo>`. It locates the site root (the `site/` workspace), then reports: the `@11ty/eleventy` dep, **no `tailwind.config.*`**, `eleventy.config.ts` present, the relative-URL transform, the `.ts` + `.json5` data extensions, the Tailwind `eleventy.before` hook, `main.css` importing `tailwindcss`, the `src/` layout dirs, the build/dev script family, the `seo-meta` partial, and `dist/` gitignored. It grades findings on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / NA / PASS — see `ki-engineering`'s [checker-contract.md](../../foundations/ki-engineering/references/checker-contract.md)) and exits non-zero on any FAIL; with `--json` / `--report` it emits machine-readable findings and writes the latest report to the site's `.ki-meta/audits/websites.{md,json}`. Capture its output verbatim.
3. **Apply the judgment items** in [the rubric](references/audit-rubric.md): `tokens.css` actually drives the palette (not hard-coded hexes in templates), `_data` is the single source of structure, content is Markdown with cascade data files, SEO meta is wired into `base.njk`, and a public site ships a sitemap/robots. Name the hosting audit that must also run if the site is deployed.
4. **Report** by location → criterion → fix, grouped by severity (FAIL / WARN / POLISH). Cite `file:line`.

### Mode CONFORM — bring a site up to standard

1. Run **AUDIT** first, so you change against a known gap list.
2. Fix the gaps in place — use the canonical shape from [the standard](references/eleventy-site-standard.md): the lean layout (§2–§5) and the fuller patterns (tokens, layouts, SEO — §5–§7) as needed. Add the `[ki-website]` table if missing (`bun scripts/audit.ts --educate >> .ki-config.toml`).
3. Re-run the checker and the relevant skill-scoped audits. For the toolchain block, run `ki-engineering`'s CONFORM; for Markdown run `ki-authoring`'s audit/conform; for the deploy block, `ki-website-cloudflare`'s.

### Mode EDUCATE — scaffold a new site

Use the canonical shape from **[the standard](references/eleventy-site-standard.md)** over inventing: the `eleventy.config.ts` patterns (§4), the `main.css`/`tokens.css` pair (§5), the `_includes/{layouts,partials}/` shells (§3), and the build/dev script family (§8). Adapt names, palette, and content; keep the four invariants from day one. Add the `[ki-website]` table (`bun scripts/audit.ts --educate >> .ki-config.toml`). Then run the checker. For the toolchain scaffold defer to `ki-engineering` EDUCATE; for hosting, `ki-website-cloudflare` EDUCATE.

### Mode REFRESH — re-anchor the standard to its sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

The standard pins volatile versions (Eleventy, Tailwind, Lucide) and Tailwind-4 idioms that move. Run on its declared cadence (see `references/sources.md`), or when asked "is the website standard current".

1. **Read [the source list](references/sources.md)** — each source with its `last reviewed` date.
2. **Re-fetch each** (WebFetch / WebSearch) and diff against the standard + rubric + [`scripts/audit.ts`](scripts/audit.ts): an Eleventy 3.x API change, a Tailwind-4 `@theme`/`@import` change, a data-extension or transform-API shift.
3. **Scan conformant site repos** for emergent patterns not yet codified; promote the good ones, flag drift.
4. **Propose a diff**; confirm before writing. Then **update [the source list](references/sources.md)** — bump each `last reviewed` date and the `## Last review` block. What changed goes in the commit.

## Boundaries (out of scope, with their homes)

Reciprocal off-ramps — each names this skill back for the site-build layer:

- **The Bun mandate, aggregate/scoped audit wiring, direct code-tool execution, `tsconfig`/`biome`, and type-check** → `ki-engineering`. This skill owns the _site-build_ delta on top of that common layer; it references it, never restates it.
- **Markdown / TOML formatting style** (including content prose) → `ki-authoring`.
- **Serving the built `dist/`** — the `wrangler.jsonc`, Workers + Static Assets, custom domains, deploy scripts → `ki-website-cloudflare`. The `dist/` is the seam between the two.
- **Any Worker that is not a static site** (bots, ingress receivers, APIs, Durable Objects), and general Cloudflare/Workers usage → the generic `cloudflare` / `wrangler` skills.
- **A repo's GitHub settings, security, and the universal local files** → `ki-repo`.
