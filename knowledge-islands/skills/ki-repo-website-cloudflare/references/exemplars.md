# Cloudflare Hosting Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

These examples are kept separate because they combine several governed artifacts and dashboard choices rather than defining another rule. Load them when a standards clause needs a concrete `wrangler.jsonc`, script-family, or CI/CD illustration. Do not copy them wholesale; adapt the site's `name`, `compatibility_date`, and domain. For the normative contract, see [the Cloudflare hosting standard](standards-cloudflare-hosting.md); for provenance, see [the source list](sources.md).

## Collections

| Source | URL | What it covers |
| --- | --- | --- |
| Workers Static Assets | [Static Assets docs][assets] | `assets` block: `directory`, `binding`, `html_handling`, `not_found_handling` |
| wrangler configuration | [wrangler config docs][wrangler] | `name`, `compatibility_date`, `routes`/`custom_domain`, `observability` |
| ki-repo-website (in-house) | [ki-repo-website repo][arcadia] | Reference implementation ‡ |

‡ `wrangler.jsonc`, monorepo script family, Workers Builds.

## Selected patterns

### `wrangler.jsonc` — the conformant site Worker config

The site Worker config lives at the site root selected by `ki-repo-website`, canonically `apps/site/wrangler.jsonc`. Four fields are always present: `name` (kebab-case, matches the Worker name in the Cloudflare dashboard), `compatibility_date` (pinned `YYYY-MM-DD`), `assets.directory` pointing at the `dist/` seam, and `observability.enabled: true` so `console.*` / request logs are queryable in the dashboard. `routes` with `custom_domain: true` is expected for a site with a domain. The `assets.directory` value is **relative to the `wrangler.jsonc` file** — `"dist"` from `apps/site/wrangler.jsonc` because the site build emits `apps/site/dist/`.

```jsonc
{
  // ki-repo-website — Cloudflare Workers deployment.
  // Model: Workers Static Assets for new projects; never use `wrangler pages deploy`.
  "name": "ki-repo-website",
  "compatibility_date": "2026-06-19",

  // Eleventy builds dist/ in this workspace; path is relative to THIS file.
  "assets": { "directory": "dist" },

  // Custom domains — canonical apex + www (www → apex via a Cloudflare redirect rule).
  "routes": [
    { "pattern": "knowledgeislands.info", "custom_domain": true },
    { "pattern": "www.knowledgeislands.info", "custom_domain": true }
  ],

  // Persist Workers logs in the dashboard (Workers & Pages → ki-repo-website → Logs).
  "observability": { "enabled": true }
}
```

Optional per-site `assets` keys (`html_handling`, `binding`, `run_worker_first`) are omitted when the defaults are acceptable. `not_found_handling` is also optional for a content site, but an interactive app sets it to `"single-page-application"`. A site not yet on a custom domain may omit `routes` and use its `<name>.<account-subdomain>.workers.dev` URL.

### `package.json` — the hosting script family

Local hosting operations live in `apps/site/package.json`, beside the build operations governed by `ki-repo-website`. Wrangler therefore discovers the adjacent config without a scripted `cd`. The repository root exposes stable `ki:site:*` aliases that delegate into this workspace.

```json
{
  "scripts": {
    "deploy": "bunx wrangler deploy",
    "preview": "bun run build && bunx wrangler dev",
    "upload": "bunx wrangler versions upload",
    "clean": "rm -rf dist .wrangler"
  }
}
```

The root `package.json` delegates the public operations without duplicating their implementation:

```json
{
  "scripts": {
    "ki:site:deploy": "bun run --cwd apps/site deploy",
    "ki:site:preview": "bun run --cwd apps/site preview",
    "ki:site:upload": "bun run --cwd apps/site upload"
  }
}
```

The local `build` and `dev` operations plus the public `ki:site:build` and `ki:site:dev` aliases belong to `ki-repo-website` — they build the `dist/` that these scripts serve.

### Cloudflare Workers Builds — the CI/CD path

The deploy path for house sites is **Cloudflare Workers Builds** (git integration in the Cloudflare dashboard), not a GitHub Actions deploy step. A push or merge to `main` triggers Cloudflare to build and deploy. The repo needs no separate deploy workflow for this — the `wrangler.jsonc` config is sufficient. A repo may run a GitHub Action for **pre-deploy content work** (applying content, optimising images) that commits to `main` and lets Workers Builds deploy the result, but that Action is content tooling, not the hosting standard.

The minimal Cloudflare Workers Builds configuration (set in the dashboard, not in a workflow file):

```text
Build command:   bun run ki:site:build
Output directory: dist
Root directory:  (leave empty — build runs from the repo root)
```

Commit-SHA injection (`WORKERS_CI_COMMIT_SHA` surfaced into the page as a `<meta>` tag) is an optional nicety:

```jsonc
// In wrangler.jsonc, if you want the deploy SHA visible in the page:
// The env var is injected by Workers Builds automatically; expose it via a
// data file or a transform in eleventy.config.ts.
```

### `_redirects` and `_headers` — static asset rules

Place `_redirects` and `_headers` in `apps/site/src/` (or wherever Eleventy's passthrough copies them to `dist/`) when you need redirect rules or custom response headers. Cloudflare Workers Static Assets reads these files from the `assets.directory` root.

A `_redirects` file for a common `www` → apex redirect (as a belt-and-suspenders fallback alongside the Cloudflare redirect rule):

```text
https://www.knowledgeislands.info/* https://knowledgeislands.info/:splat 301
```

A `_headers` file with security and cache headers appropriate for a static site:

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

The `/assets/*` rule sets a long-lived immutable cache on built assets (CSS, JS, images). The `/*` rule applies security headers to every response. Both rules are additive — they do not override Cloudflare's default `Content-Type` or compression behaviour.

[assets]: https://developers.cloudflare.com/workers/static-assets/
[wrangler]: https://developers.cloudflare.com/workers/wrangler/configuration/
[arcadia]: https://github.com/knowledgeislands/ki-website
