# The Cloudflare hosting standard

The normative, quotable reference for serving a built static site on Cloudflare — what good hosting looks like, and why. The audit rubric ([rubric.md](rubric.md)) turns each section into checkable items; the procedure is in the [SKILL.md](../SKILL.md). See [the source list](sources.md) for provenance.

This skill owns the **deploy/serve delta for the site Worker**. The `dist/` it serves is `ki-repo-website`'s output (the seam); the toolchain is `ki-engineering`'s. Both are referenced here, not restated. **Companion Workers are out of scope.**

## Contents

- [1. Model — Workers Static Assets, not Pages](#1-model--workers-static-assets-not-pages)
- [2. The `dist/` seam](#2-the-dist-seam)
- [3. The site `wrangler.jsonc` shape](#3-the-site-wranglerjsonc-shape)
- [4. The script family](#4-the-script-family)
- [5. CI/CD](#5-cicd)
- [6. The Cloudflare guide — dashboard-owned settings](#6-the-cloudflare-guide--dashboard-owned-settings)
- [7. Boundaries — what is not in scope](#7-boundaries--what-is-not-in-scope)

## 1. Model — Workers Static Assets, not Pages

The site is **one Cloudflare Worker serving Static Assets**. The Worker has an `assets` block naming a directory of built files; `wrangler deploy` uploads them and wires the Worker. There is no server-side code for this static deployment — the assets are served directly at the edge.

- **Workers Static Assets**, deployed with `wrangler deploy`. Cloudflare recommends Workers for new static sites and SPAs; Pages is not the house deployment target for new projects. A `wrangler pages deploy` command is a finding.
- **`pages_build_output_dir` is the legacy Pages marker.** Its presence is a failure even when scripts use `wrangler deploy`. Replace it with `"assets": { "directory": "./dist" }`.
- **One `wrangler.jsonc` per deployable.** The **site** Worker's config carries an `assets` block and no `main`. The absence of `main` is load-bearing: an assets-only Worker executes no server-side code, which is what allows a repository to state mechanically that its published deployment has no control plane.
- The site root — and thus where its `wrangler.jsonc` lives — is owned by `[skills.ki-repo-website].site-root`, which defaults to **`apps/site`**. The Cloudflare table is a keyless hosting opt-in: it consumes the core location rather than accepting a second site-root declaration. An explicit flat consumer (`site-root = "."`, with config at the repo root) remains valid.

## 2. The `dist/` seam

The hosting layer and the build layer meet at exactly one place: the **`dist/` directory**.

- The selected website implementation **emits** `dist/`. This skill **serves** it by pointing `assets.directory` at that exact build output.
- **`assets.directory` is relative to the `wrangler.jsonc` file**: `"./dist"` when the config is at the repo root and `"dist"` in the canonical `apps/site/` application workspace. A different core-selected layout may use another relative path, but it must resolve to the build's actual `dist/` output.
- **The build runs before deploy.** `dist/` is gitignored and regenerated; deploy reads whatever the last build produced. A `ki:site:preview` script chains build → `wrangler dev` for a local check against the real Worker runtime.
- Neither layer needs the other's internals — only the `dist/` path. That is what makes the split clean and the hosting skill reusable for any static `dist/`.

## 3. The site `wrangler.jsonc` shape

`wrangler.jsonc` (JSONC — comments encouraged, in the house voice explaining each block). The minimal conformant shape:

```jsonc
{
  // <site> — Cloudflare Workers Static Assets deployment.
  "name": "<site-name>",
  "compatibility_date": "<YYYY-MM-DD>",
  // The selected website implementation builds dist/ beside this file.
  // Path is relative to THIS file.
  "assets": { "directory": "dist" },
  // Persist Workers logs in the dashboard (Workers & Pages → <name> → Logs).
  "observability": { "enabled": true }
}
```

Required fields:

- **`name`** — the Worker name (kebab-case, usually the repo/site name).
- **`compatibility_date`** — a pinned `YYYY-MM-DD`. (For a pure-assets Worker there is no runtime code, but the field is set.)
- **`assets.directory`** — the `dist/` seam (§2).
- **`observability.enabled: true`** — so `console.*` / request logs are queryable in the dashboard, not just live `wrangler tail`.

Optional when the site has a custom domain; omission is conformant and leaves the deployment on its workers.dev URL:

- **`routes` with `custom_domain: true`** — the apex (and usually `www`, redirected to apex). Without a custom domain, the Worker URL is `<name>.<account-subdomain>.workers.dev`, not `<name>.pages.dev`. In the dashboard the operator path is **Workers & Pages → Overview → Worker → Settings → Domains & Routes → Add → Custom Domain**; “Workers & Pages” remains the correct navigation label.
- **An active zone on the same account** — a custom domain requires the hostname to belong to a zone in the Cloudflare account that owns the Worker, because Cloudflare creates the proxied DNS record and issues the certificate itself rather than reading DNS you host elsewhere. The two zone setups that keep authoritative DNS with another provider — partial (CNAME) setup and subdomain setup — are both Enterprise-only, so where a domain is hosted outside Cloudflare the only non-Enterprise route to a custom domain is delegating the whole apex zone to Cloudflare nameservers. Deleting a custom domain does not remove its certificate; retire that separately under SSL/TLS → Edge Certificates.

Other `assets` keys (`html_handling`, `not_found_handling`, `binding`, `run_worker_first`) are optional and per-site; do not require them.

For `[skills.ki-repo-website-app]`, `assets.not_found_handling` is not optional: set it to `"single-page-application"` so browser navigation to a client-side route returns `index.html`.

## 4. The script family

The selected site's `<site-root>/package.json` owns local operations:

- **`deploy`** → `bunx wrangler deploy`.
- **`preview`** → build, then `bunx wrangler dev` through the real Worker runtime.
- **`upload`** → `bunx wrangler versions upload` — optionally create an undeployed Worker version and preview endpoint for Workers Builds. This is a credentialed remote mutation: only an explicitly authorised operator or Workers Builds service may run it. Audits, conformance, local builds, tests, and dry evaluation inspect the manifest without invoking Wrangler.
- **`clean`** → removes `dist/` and `.wrangler/`; the website core owns the build-output part of that lifecycle.

The repository root owns the public aliases. For the default root these are `"ki:site:deploy": "bun run --cwd apps/site deploy"`, `"ki:site:preview": "bun run --cwd apps/site preview"`, and the optional upload equivalent. An explicitly flat site uses `bun run <operation>` instead. This keeps public orchestration stable without duplicating `ki:site:*` names inside the application package.

The root `ki:site:build` / `ki:site:dev` aliases and local build/dev operations belong to `ki-repo-website`, not here. `.wrangler/` is gitignored.

## 5. CI/CD

- **Cloudflare Workers Builds (git integration)** is the deploy path: a push/merge to `main` triggers Cloudflare to build and deploy. The repo needs no deploy workflow of its own for this.
- Workers Builds runs a **build command** followed by a **deploy command**. The house pair is `bun run ki:site:build` and `bun run ki:site:deploy` (or the equivalent `bunx wrangler deploy`). There is no Pages-style “deploy directory” setting; `assets.directory` in Wrangler owns that path. Use the optional root directory only to choose the project working directory in a monorepo.
- A repo **may** run a **GitHub Action for pre-deploy content work** (e.g. applying content, optimising images) that commits to `main` and lets Workers Builds deploy the result — but that Action is content tooling, not the hosting standard.
- **Commit-SHA injection** (`WORKERS_CI_COMMIT_SHA` surfaced into the page, e.g. as a `<meta>`) is an optional nicety, not required.

## 6. The Cloudflare guide — dashboard-owned settings

Part of a deployment's contract lives in the Cloudflare dashboard, where no versioned file can express it: the Workers Builds build command, deploy command, and root directory; custom-domain and redirect choices; whether `workers.dev` serves. A hosted repository therefore carries **`docs/guides/cloudflare.md`** — the one guide for every Cloudflare aspect of that repository.

The split rule: **`wrangler.jsonc` owns everything it can express; the guide records only what the dashboard owns**, as the exact values an operator enters — a build-command row, a redirect rule — so the dashboard can be reconstructed from the repository alone and a settings change is visible in review. The guide duplicates nothing the config already declares; it links to `wrangler.jsonc` for the versioned half. When a dashboard setting changes, the guide changes in the same breath — a guide that trails the dashboard is drift, exactly the kind this file exists to catch.

## 7. Boundaries — what is not in scope

This standard governs **only the site Worker** — the one that serves `dist/`. Out of scope, with their homes:

- **Companion Workers** — a bot, an ingress/webhook receiver, an API, anything with a `main` entry and bindings (R2, Durable Objects + their `migrations`, KV, D1), `triggers.crons`, or `vars`/secrets. These are real Workers but **not** the static site; they route to the generic `cloudflare` / `wrangler` skills. The audit notes their presence and moves on.
- **General Cloudflare/Workers/wrangler usage** — `wrangler dev` mechanics, binding configuration, secret management, deploy flags, runtime APIs → the `cloudflare` / `wrangler` skills.
- **Building the `dist/`** → `ki-repo-website` plus exactly one of `ki-repo-website-content` or `ki-repo-website-app`.
- **The toolchain** (Bun, lint/deps, tsconfig/biome) → `ki-engineering`.
