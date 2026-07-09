# The Cloudflare hosting standard

The normative, quotable reference for serving a built static site on Cloudflare — what good hosting looks like, and why. The audit rubric ([audit-rubric.md](audit-rubric.md)) turns each section into checkable items; the procedure is in the [SKILL.md](../SKILL.md). See [the source list](sources.md) for provenance.

This skill owns the **deploy/serve delta for the site Worker**. The `dist/` it serves is `ki-website`'s output (the seam); the toolchain is `ki-engineering`'s. Both are referenced here, not restated. **Companion Workers are out of scope.**

## Contents

- [1. Model — Workers + Static Assets, not Pages](#1-model--workers--static-assets-not-pages)
- [2. The `dist/` seam](#2-the-dist-seam)
- [3. The site `wrangler.jsonc` shape](#3-the-site-wranglerjsonc-shape)
- [4. The script family](#4-the-script-family)
- [5. CI/CD](#5-cicd)
- [6. Boundaries — what is not in scope](#6-boundaries--what-is-not-in-scope)

## 1. Model — Workers + Static Assets, not Pages

The site is **one Cloudflare Worker that serves static assets**. The Worker has an `assets` block naming a directory of built files; `wrangler deploy` uploads them and wires the Worker. There is no server-side code for a pure static site — the assets are served directly at the edge.

- **Workers + Static Assets**, deployed with `wrangler deploy`. **Never `wrangler pages deploy`** — Cloudflare steers new static sites to Workers + Static Assets (new features and optimizations focus on Workers; `wrangler pages` now nudges to `wrangler deploy`), and the the house sites were explicitly **migrated off Pages to Workers + Static Assets**. A `pages deploy` in any script is a finding.
- **One `wrangler.jsonc` per deployable.** The **site** Worker's config carries an `assets` block (and no `main`). This is the only config this standard governs.
- The site root — and thus where its `wrangler.jsonc` lives — follows `ki-website`'s layout, which is a **monorepo** (engineering §0): the site is the **`site/` workspace**, so `wrangler.jsonc` lives at `site/wrangler.jsonc` and `dist/` sits at the repo root (so `assets.directory` is `../dist`, §3). This skill can serve any static `dist/`, so a one-off **flat** consumer (config at the repo root, `assets.directory: "./dist"`) is still valid hosting — but every house 11ty site is a monorepo, never flat.

## 2. The `dist/` seam

The hosting layer and the build layer meet at exactly one place: the **`dist/` directory**.

- `ki-website` **emits** a portable `dist/` (relative internal links, `assets/css/main.css`, sitemap/robots for a public site). This skill **serves** it by pointing `assets.directory` at it.
- **`assets.directory` is relative to the `wrangler.jsonc` file**: `"./dist"` when the config is at the repo root (flat layout), `"../dist"` when the config is under `site/`. It must resolve to the build's actual output directory.
- **The build runs before deploy.** `dist/` is gitignored and regenerated; deploy reads whatever the last build produced. A `ki:site:preview` script chains build → `wrangler dev` for a local check against the real Worker runtime.
- Neither layer needs the other's internals — only the `dist/` path. That is what makes the split clean and the hosting skill reusable for any static `dist/`.

## 3. The site `wrangler.jsonc` shape

`wrangler.jsonc` (JSONC — comments encouraged, in the house voice explaining each block). The minimal conformant shape:

```jsonc
{
  // <site> — Cloudflare Workers deployment (migrated off Pages to Workers + Static Assets).
  "name": "<site-name>",
  "compatibility_date": "<YYYY-MM-DD>",
  // Eleventy builds to dist/ at the repo root; the Worker serves it directly.
  // Path is relative to THIS file — "./dist" flat, "../dist" from a site/ subfolder.
  "assets": { "directory": "../dist" },
  // Custom domains — canonical apex plus www (www → apex via a Cloudflare redirect rule).
  "routes": [
    { "pattern": "example.com", "custom_domain": true },
    { "pattern": "www.example.com", "custom_domain": true }
  ],
  // Persist Workers logs in the dashboard (Workers & Pages → <name> → Logs).
  "observability": { "enabled": true }
}
```

Required fields:

- **`name`** — the Worker name (kebab-case, usually the repo/site name).
- **`compatibility_date`** — a pinned `YYYY-MM-DD`. (For a pure-assets Worker there is no runtime code, but the field is set.)
- **`assets.directory`** — the `dist/` seam (§2).
- **`observability.enabled: true`** — so `console.*` / request logs are queryable in the dashboard, not just live `wrangler tail`.

Expected where the site has a domain:

- **`routes` with `custom_domain: true`** — the apex (and usually `www`, redirected to apex). A site not yet pointed at a domain may omit routes (deploys to the `*.workers.dev` subdomain) — a judgment call, not a blocker.

Other `assets` keys (`html_handling`, `not_found_handling`, `binding`, `run_worker_first`) are optional and per-site; do not require them.

## 4. The script family

The hosting scripts in `package.json`, namespaced with the `site:` prefix (the house monorepo layout, §1; a one-off flat consumer leaves them unprefixed):

- **`ki:site:deploy`** → `cd <site root> && bunx wrangler deploy`.
- **`ki:site:preview`** → `bun run ki:site:build && cd <site root> && bunx wrangler dev` — build, then serve through the real Worker runtime locally.
- **`ki:site:clean`** → removes `dist/` and `.wrangler/`.

`ki:site:build` / `ki:site:dev` (the build + dev-server scripts) belong to `ki-website`, not here. `.wrangler/` is gitignored.

## 5. CI/CD

- **Cloudflare Workers Builds (git integration)** is the deploy path: a push/merge to `main` triggers Cloudflare to build and deploy. The repo needs no deploy workflow of its own for this.
- A repo **may** run a **GitHub Action for pre-deploy content work** (e.g. applying content, optimising images) that commits to `main` and lets Workers Builds deploy the result — but that Action is content tooling, not the hosting standard.
- **Commit-SHA injection** (`WORKERS_CI_COMMIT_SHA` surfaced into the page, e.g. as a `<meta>`) is an optional nicety, not required.

## 6. Boundaries — what is not in scope

This standard governs **only the site Worker** — the one that serves `dist/`. Out of scope, with their homes:

- **Companion Workers** — a bot, an ingress/webhook receiver, an API, anything with a `main` entry and bindings (R2, Durable Objects + their `migrations`, KV, D1), `triggers.crons`, or `vars`/secrets. These are real Workers but **not** the static site; they route to the generic `cloudflare` / `wrangler` skills. The audit notes their presence and moves on.
- **General Cloudflare/Workers/wrangler usage** — `wrangler dev` mechanics, binding configuration, secret management, deploy flags, runtime APIs → the `cloudflare` / `wrangler` skills.
- **Building the `dist/`** → `ki-website`.
- **The toolchain** (Bun, lint/deps, tsconfig/biome) → `ki-engineering`.
