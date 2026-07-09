# Cloudflare Hosting Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns worth reading when authoring or auditing a Knowledge Islands Cloudflare hosting configuration. Use these as concrete references — what a correct `wrangler.jsonc` looks like for a Workers + Static Assets deployment, what the script family looks like in the monorepo shape, and how the build and deploy steps chain in CI. Do not copy them wholesale; adapt to the specific site's `name`, `compatibility_date`, and domain. For the full standard, see [cloudflare-hosting-standard.md](cloudflare-hosting-standard.md); for source provenance, see [sources.md](sources.md).

## Collections

| Source | URL | What it covers |
| --- | --- | --- |
| Workers — Static Assets | [Static Assets docs][assets] | `assets` block: `directory`, `binding`, `html_handling`, `not_found_handling` |
| wrangler configuration | [wrangler config docs][wrangler] | `name`, `compatibility_date`, `routes`/`custom_domain`, `observability` |
| Pages → Workers migration | [migrate-from-pages guide][pages] | Why new static sites use Workers + Static Assets † |
| ki-website (in-house) | [ki-website repo][arcadia] | Reference implementation ‡ |

† Not `wrangler pages deploy`.

‡ `wrangler.jsonc`, monorepo script family, Cloudflare Builds.

## Selected patterns

### `wrangler.jsonc` — the conformant site Worker config

The site Worker config lives at `site/wrangler.jsonc` in the monorepo layout (the `site/` workspace of `ki-website`). Four fields are always present: `name` (kebab-case, matches the Worker name in the Cloudflare dashboard), `compatibility_date` (pinned `YYYY-MM-DD`), `assets.directory` pointing at the `dist/` seam, and `observability.enabled: true` so `console.*` / request logs are queryable in the dashboard. `routes` with `custom_domain: true` is expected for a site with a domain. The `assets.directory` value is **relative to the `wrangler.jsonc` file** — `"../dist"` from `site/wrangler.jsonc` because `dist/` lives at the repo root (one level up from `site/`).

```jsonc
{
  // ki-website — Cloudflare Workers deployment.
  // Model: Workers + Static Assets (not Pages — migrated off Pages; never use `wrangler pages deploy`).
  "name": "ki-website",
  "compatibility_date": "2026-06-19",

  // Eleventy builds dist/ at the repo root; path is relative to THIS file.
  // "../dist" because wrangler.jsonc lives under site/.
  "assets": { "directory": "../dist" },

  // Custom domains — canonical apex + www (www → apex via a Cloudflare redirect rule).
  "routes": [
    { "pattern": "knowledgeislands.info", "custom_domain": true },
    { "pattern": "www.knowledgeislands.info", "custom_domain": true }
  ],

  // Persist Workers logs in the dashboard (Workers & Pages → ki-website → Logs).
  "observability": { "enabled": true }
}
```

Optional per-site `assets` keys (`html_handling`, `not_found_handling`, `binding`, `run_worker_first`) are omitted when the defaults are acceptable. A site not yet on a custom domain may omit `routes` and deploy to the `*.workers.dev` subdomain — a judgment call, not a blocker.

### `package.json` — the hosting script family

The hosting scripts in the root `package.json` of the monorepo. They take the `site:` prefix (matching the rest of the site script family from `ki-website`). `ki:site:deploy` changes into the site workspace where `wrangler.jsonc` lives and runs `bunx wrangler deploy` — never `wrangler pages deploy`. `ki:site:preview` chains a full build then `wrangler dev` so the site runs through the real Worker runtime locally before deploying. `.wrangler/` is added to `ki:site:clean`.

```json
{
  "scripts": {
    "ki:site:deploy": "cd site && bunx wrangler deploy",
    "ki:site:preview": "bun run ki:site:build && cd site && bunx wrangler dev",
    "ki:site:clean": "rm -rf dist site/.wrangler"
  }
}
```

`ki:site:build` and `ki:site:dev` belong to `ki-website` — they build the `dist/` that these scripts serve. Both sets of scripts live in the same root `package.json`; only the responsibility boundary differs.

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

Place `_redirects` and `_headers` in `site/src/` (or wherever Eleventy's passthrough copies them to `dist/`) when you need redirect rules or custom response headers. Cloudflare Workers Static Assets reads these files from the `assets.directory` root.

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
[pages]: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
[arcadia]: https://github.com/knowledgeislands/ki-website
