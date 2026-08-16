---
name: ki-repo-website-content
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: [ki-repo-website]
owns: [eleventy.config.ts, eleventy.config.js, eleventy.config.mjs, eleventy.config.cjs]
contributes: ['.ki-config.toml', '.gitignore', package.json]
requires: [ROADMAP.md]
description: >-
  Governs the Knowledge Islands content-led website implementation: Eleventy 3 generates a collection of pages from Markdown and structured data, with Nunjucks, Tailwind 4 semantic tokens, and portable `dist/` output. Use for documentation, publication, and marketing sites whose primary artifact is a page collection. Do not use for a single interactive SPA; select `ki-repo-website-app` instead because Eleventy does not bundle React application JavaScript and combining them creates two build systems. Depends on the neutral `ki-repo-website` seam; Cloudflare hosting remains independent.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands content website standard

You are applying the **Knowledge Islands content website standard** — the shared way every static website in this work is built: **Eleventy 3, Nunjucks and Markdown; TypeScript run natively on Bun; Tailwind 4 config-less with design tokens**, compiling to a **portable `dist/`**. A new site is scaffolded to it; an existing one is audited and conformed against it. This skill carries that standard and the procedure.

This is a **base-agnostic governance skill**. It hard-codes no single repo; it applies to any repo carrying a `[skills.ki-repo-website-content]` table in its `.ki-config.toml`. How it sits beside the other skills, and where it must not overlap them, is documented once in the ki-agentic-harness `README.md`.

`ki-repo` owns that repository declaration. Detected Eleventy files are coverage evidence only; hosted conform never infers or adds the opt-in.

This skill owns the **content implementation delta**. The neutral lifecycle and `dist/` seam belong to `ki-repo-website`; the generic toolchain belongs to `ki-engineering`; Markdown/TOML style belongs to `ki-authoring`; and serving `dist/` belongs to the independently selected hosting adapter.

The full, quotable standard is [the Eleventy site standard](references/standards-eleventy-site.md); the line-by-line pass/fail items are in [the audit rubric](references/rubric.md); the tracked provenance is [the source list](references/sources.md). `ki repo audit --skill ki-repo-website-content` runs the mechanical checks. Read those for detail; this file is the operating procedure.

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
2. **The build emits a portable `dist/`.** An `addTransform` rewrites absolute internal URLs to relative ones, so `dist/` serves from any root. This is the contract `ki-repo-website-cloudflare` consumes.
3. **TypeScript runner is declared, not proven.** Package scripts select Bun or modern Node for TypeScript; `tsx` is not used. `.ts` + `.json5` data extensions are registered in the config. `tsc` is type-check only (engineering's layer); actual execution belongs to explicit runtime evidence.
4. **Tailwind compiles inside the Eleventy lifecycle.** An `eleventy.before` hook runs the Tailwind CLI in build mode; dev runs a parallel `--watch` and an `addWatchTarget` on the compiled CSS.

## Layering — how a site repo gets fully audited

The checker is the **site-build layer**; the independently applicable toolchain and hosting layers each audit their own concern. The unscoped host runs every declared layer:

```text
ki repo audit --repo <repo> --skill ki-engineering          → common toolchain
  then ki repo audit --repo <repo> --skill ki-repo-website-content       → site-build delta (THIS skill)
  then ki repo audit --repo <repo> --skill ki-repo-website-cloudflare → serving the dist/ (if deployed to Cloudflare)
```

A repo is "clean" only when **every applicable** skill's audit passes. The `.ki-config.toml` tables are the selector: `[skills.ki-repo-website]` marks the common website seam; `[skills.ki-repo-website-content]` marks this implementation; `[skills.ki-repo-website-cloudflare]` marks optional Cloudflare hosting.

## The `dist/` contract (the seam to hosting)

This skill's output, and the only thing the hosting skill needs: a `dist/` of static files with **relative** internal links (the URL transform), Tailwind compiled to `dist/assets/css/main.css`, passthrough assets, and — for a public site — `sitemap.xml` + `robots.txt`. `dist/` is gitignored and regenerated by the build. `dist/` lives inside the `site/` workspace (`site/dist/`) — the path `ki-repo-website-cloudflare` points `assets.directory` at.

## Operating modes

Carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** — EDUCATE scaffolds a new site. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows. The mode shape itself is defined in `ki-skills`' enforcement framework.

The four procedures remain on demand because each coordinates work outside the hosted rubric: AUDIT and CONFORM sequence adjacent skills and explicit build checks, EDUCATE scaffolds application source, and REFRESH reconciles moving external sources. Each file owns one mode so invoking one never loads an unrelated procedure.

### Mode AUDIT

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode EDUCATE

→ Read [references/mode-educate.md](references/mode-educate.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

REFRESH writes only in `ki-agentic-harness`; when invoked from an installed copy, stop and redirect the work to the harness.

## Boundaries (out of scope, with their homes)

Reciprocal off-ramps — each names this skill back for the site-build layer:

- **The Bun mandate, aggregate/scoped audit wiring, direct code-tool execution, `tsconfig`/`biome`, and type-check** → `ki-engineering`. This skill owns the _site-build_ delta on top of that common layer; it references it, never restates it.
- **Markdown / TOML formatting style** (including content prose) → `ki-authoring`.
- **A single interactive React/Vite application** → `ki-repo-website-app`; do not select both implementation skills.
- **Serving the built `dist/`** — the `wrangler.jsonc`, Workers Static Assets, custom domains, deploy scripts → `ki-repo-website-cloudflare`. The `dist/` is the seam between the two.
- **Any Worker that is not a static site** (bots, ingress receivers, APIs, Durable Objects), and general Cloudflare/Workers usage → the generic `cloudflare` / `wrangler` skills.
- **A repo's GitHub settings, security, and the universal local files** → `ki-repo`.

## Notes

- Hosted conform is intentionally narrow: only contained, physical `.ki-config.toml` and `.gitignore` files are eligible for proposals, and missing safe files may be proposed for creation. Application scaffolding, builds, deployment, and external commands remain explicit.
- [The exemplars](references/exemplars.md) remain separate because they carry complete reusable `eleventy.config.ts`, Tailwind token, package-script, and layout shapes that would make the normative standard unwieldy. They illustrate the contract but do not define it.
