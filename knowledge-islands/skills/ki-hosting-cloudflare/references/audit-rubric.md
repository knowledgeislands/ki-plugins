# Audit Rubric

Line-by-line pass/fail items for auditing a site's hosting against the [Cloudflare hosting standard](cloudflare-hosting-standard.md). Run [`../scripts/audit-cloudflare-hosting.ts`](../scripts/audit-cloudflare-hosting.ts) for the mechanical items (marked **[M]**), then judge the rest by reading. Each item cites the standard section it verifies.

Severity: **FAIL** (ship-stopper — the site can't deploy, or deploys the wrong way), **WARN** (config / script divergence), **POLISH** (domains / CI / consistency) — the shared ladder, defined in `ki-engineering`'s [`enforcement-framework.md`](../../ki-engineering/references/enforcement-framework.md) §2.

> **Compose with the siblings.** This rubric is the **hosting delta** only. The toolchain is `ki-engineering` (`ki:engineering:audit`); building the `dist/` this serves is `ki-websites-11ty` (`audit-websites.ts`). Run both first. Any Worker that is not the static-site server is out of scope — it routes to the generic `cloudflare`/`wrangler` skills. The repo is fully clean only when every applicable audit passes.

## Contents

- [Model](#model-1)
- [The dist/ seam](#the-dist-seam-2)
- [wrangler.jsonc shape](#wranglerjsonc-shape-3)
- [Scripts](#scripts-4)
- [CI/CD](#cicd-5)
- [Boundaries](#boundaries-6)
- [Longevity & staleness](#longevity--staleness)
- [Reporting](#reporting)

## Model (§1)

- [ ] [M] FAIL — a **site** `wrangler.jsonc` exists at the site root (the config carrying an `assets` block). Its absence is the classic finding — `ki:site:deploy` has nothing to deploy. (§1)
- [ ] [M] FAIL — deploy is **Workers + Static Assets** (`wrangler deploy`), **never** `wrangler pages deploy` anywhere in scripts. (§1)
- [ ] [M] WARN — exactly one site Worker (one config with `assets`), at `site/wrangler.jsonc` — the monorepo `site/` workspace (engineering §0); the root `package.json` `workspaces` includes `site`. (A one-off flat consumer with a root config is valid generic hosting.) (§1)

## The dist/ seam (§2)

- [ ] [M] FAIL — `assets.directory` is set and points at the build's `dist/` (`./dist` flat, `../dist` from `site/`). (§2)
- [ ] [J] WARN — the path resolves to the directory `ki-websites-11ty` builds to (cross-check `audit-websites.ts`). (§2)
- [ ] [M] WARN — `dist/` and `.wrangler/` are gitignored. (§2, §4)
- [ ] [J] POLISH — a `ki:site:preview` chains build → `wrangler dev` for a local check against the Worker runtime. (§2, §4)

## wrangler.jsonc shape (§3)

- [ ] [M] WARN — `name` and `compatibility_date` (a pinned `YYYY-MM-DD`) are present. (§3)
- [ ] [M] WARN — `observability.enabled` is `true`. (§3)
- [ ] [J] POLISH — `routes` carry `custom_domain: true` for the apex (and usually `www` → apex). A site on `*.workers.dev` may omit them. (§3)
- [ ] [J] POLISH — JSONC comments explain each block in the house voice. (§3)
- [ ] [J] POLISH — optional `assets` keys (`html_handling`, `not_found_handling`, `run_worker_first`) are per-site; do **not** flag their absence. (§3)

## Scripts (§4)

- [ ] [M] WARN — a deploy script runs `wrangler deploy` from the site root (`ki:site:deploy`, or `deploy` when flat). (§4)
- [ ] [M] WARN — a `ki:site:preview` script runs `wrangler dev` (local Workers preview of the built `dist/`). (§4)
- [ ] [J] WARN — `ki:site:clean` removes `dist/` + `.wrangler/`. (§4)
- [ ] — `ki:site:build` / `ki:site:dev` are **not** checked here — they belong to `ki-websites-11ty`. (§4)

## CI/CD (§5)

- [ ] [J] POLISH — deploy is via Cloudflare Workers Builds (git integration) on merge to `main`; no bespoke deploy workflow is required. (§5)
- [ ] [J] POLISH — any GitHub Action present is **content tooling** (apply/optimise then commit), not a re-implementation of deploy. (§5)
- [ ] [J] POLISH — commit-SHA injection (`WORKERS_CI_COMMIT_SHA` → page meta), if present, is an optional nicety. (§5)

## Boundaries (§6)

- [ ] — a Worker with a `main` entry and **no** `assets` block is a **companion** (bot / ingress / API); it is **noted, not flagged**, and routes to the generic `cloudflare`/`wrangler` skills. Do not audit its bindings/crons/secrets here. (§6)

## Longevity & staleness

Mirrors the `ki-skills` rubric's **LONG-1**.

- [ ] [J] WARN — volatile facts (the wrangler version, the Static-Assets config keys, the Pages-deprecation status) are pinned in `package.json` / the standard, not assumed — a bump is one known edit.
- [ ] [J] POLISH — this audit runs against a **current** standard: a cited requirement is confirmed by Mode REFRESH + [`sources.md`](sources.md) not having gone stale since its `last reviewed` date (esp. the Pages-vs-Workers guidance, which has moved before).

## Reporting

Produce a findings table grouped by severity, each row: `severity · file:line · what · fix`. Close with: (a) any intentional, documented divergences you chose **not** to flag (e.g. a site deliberately on `*.workers.dev` with no custom domain yet, or a companion Worker you correctly left alone), and (b) a one-line verdict (compliant / minor drift / blockers). Name the sibling audits that must also pass — `ki:engineering:audit` and `audit-websites.ts` — for the repo to be fully clean.
