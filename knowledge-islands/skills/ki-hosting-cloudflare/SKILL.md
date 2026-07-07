---
name: ki-hosting-cloudflare
description: >
  Codify, audit, conform, and scaffold the Knowledge Islands house convention for serving a built static site on Cloudflare — Workers + Static Assets (not Pages), one `wrangler.jsonc` pointing `assets.directory` at the site's `dist/`, custom-domain routes, observability, and the `ki:site:deploy` script family. Use when deploying a site to Cloudflare, wiring or auditing its `wrangler.jsonc`, bringing hosting up to standard, or scaffolding it. Triggers: "deploy this site to Cloudflare", "audit the Cloudflare hosting", "set up wrangler for the site", "host the dist on Cloudflare", "configure Workers Static Assets", "why won't the site deploy", "conform the hosting". Builds on `ki-websites-11ty` (which produces the `dist/` it serves — the seam) and `ki-engineering` (the toolchain). For any Worker that is not the static-site server (bots, ingress receivers, APIs, Durable Objects) and general Cloudflare/Workers/wrangler usage, use the `cloudflare` and `wrangler` skills.
argument-hint: 'audit <repo> | conform <repo> | init <repo> | refresh'
---

# Knowledge Islands Cloudflare hosting standard

You are applying the **Knowledge Islands Cloudflare hosting standard** — the house convention for serving a built static site on **Cloudflare Workers + Static Assets**: one `wrangler.jsonc` whose `assets.directory` points at the site's `dist/`, custom-domain routes, observability on, and a `ki:site:deploy` script family. A new site's hosting is scaffolded to it; an existing one is audited and conformed.

This is a **standard, base-agnostic Process skill**. It hard-codes no single repo; it applies to any repo carrying a `[ki-hosting-cloudflare]` table in its `.ki-config.toml`. How it sits beside the other skills, and where it must not overlap them, is documented once in the ki-agentic-harness `README.md`.

This skill owns the **deploy/serve delta for the site Worker** only — the one Worker that serves `dist/`. It **builds on** two siblings and restates neither: `ki-websites-11ty` produces the `dist/` (the seam, below); `ki-engineering` owns the toolchain. **Any Worker that is not the static-site server** — bots, ingress receivers, APIs, Durable Objects, crons — is **out of scope** and routes to the generic `cloudflare` / `wrangler` skills.

The full, quotable standard is [the Cloudflare hosting standard](references/cloudflare-hosting-standard.md); the line-by-line items are in [the audit rubric](references/audit-rubric.md); the tracked provenance is [the source list](references/sources.md). A mechanical checker is [`scripts/audit-cloudflare-hosting.ts`](scripts/audit-cloudflare-hosting.ts). Read those for detail; this file is the operating procedure.

## The model at a glance

```jsonc
// <site root>/wrangler.jsonc — the site Worker. (Site root is repo root if flat, site/ if the
// repo also holds other deployables — see ki-websites-11ty.)
{
  "name": "<site-name>",
  "compatibility_date": "<YYYY-MM-DD>",
  "assets": { "directory": "./dist" }, // or "../dist" from a site/ subfolder — the SEAM
  "routes": [{ "pattern": "example.com", "custom_domain": true }],
  "observability": { "enabled": true }
}
```

Deploy: `cd <site root> && bunx wrangler deploy`. Three rules define the standard — most findings are a breach of one:

1. **Workers + Static Assets, not Pages.** The site is a Worker with an `assets` block; `wrangler deploy` ships it. **Never `wrangler pages deploy`** — Cloudflare steers new sites to Workers + Static Assets and the house sites were explicitly migrated off Pages.
2. **`assets.directory` is the seam.** It points at the `dist/` that `ki-websites-11ty` emits (`./dist` flat, `../dist` from a `site/` subfolder). The build runs before deploy; `dist/` is gitignored.
3. **The site Worker is the only thing in scope.** It carries `assets` (and no `main`). A Worker with a `main` entry and no `assets` is a companion (bot, ingress, …) and belongs to the generic `cloudflare`/`wrangler` skills, not here.

## Composition — how a site repo gets fully audited

The checker is the **hosting layer**; the toolchain and site-build layers audit their own. They compose by being **run in sequence**, never by importing each other (each skill is symlinked standalone):

```text
ki:engineering:audit <repo>                          →  common toolchain (Bun, lint/deps families, tsconfig/biome)
  then audit-websites.ts <repo>                   →  site-build delta (ki-websites-11ty) → produces dist/
  then audit-cloudflare-hosting.ts <repo>         →  serving the dist/ (THIS skill)
```

A repo is "clean" only when **every applicable** skill's audit passes. The `[ki-hosting-cloudflare]` table in `.ki-config.toml` is this layer's selector.

## The `dist/` contract (the seam from the build)

This skill consumes exactly what `ki-websites-11ty` emits: a portable `dist/` of static files with relative internal links. The hosting job is to point `assets.directory` at it and deploy. **Building `dist/` is the 11ty skill; serving it is this one.** The two meet only at the `dist/` path — neither needs the other's internals.

## Operating modes

Carries the universal **AUDIT · CONFORM · REFRESH**, plus **INIT** (scaffold a site's hosting). If invoked without a mode, use `AskUserQuestion` to list each mode with a one-line description; if the chosen mode shows a target in the `argument-hint`, prompt for that too. The mode shape itself is defined in `ki-engineering`'s enforcement framework.

### Mode AUDIT — check a site's hosting against the standard

1. **Run the upstream layers first.** `ki:engineering:audit` (toolchain) and `audit-websites.ts` (the site build that produces `dist/`). The hosting audit assumes a buildable site.
2. **Run the mechanical checker.** `bun <skill>/scripts/audit-cloudflare-hosting.ts <repo>`. It finds the **site** `wrangler.jsonc` (the one with an `assets` block), then reports: present at the site root, `assets.directory` set and pointing at `dist/`, `name` + `compatibility_date`, `observability.enabled`, a `wrangler deploy` script, **not** `wrangler pages deploy`, and `dist/` + `.wrangler/` gitignored. It also reads this skill's `[ki-hosting-cloudflare]` table: the opt-in marker, plus the one declarable key `site-root` (validate-down warns on any other key, and on a `site-root` that holds no `wrangler.jsonc`). It notes (does not flag) any companion Worker. It grades findings on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / SKIP / PASS — see `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md)) and exits non-zero on any FAIL; with `--json` / `--report` it emits machine-readable findings and writes the latest report to the site's `.ki-meta/audits/cloudflare-hosting.{md,json}`. Capture its output verbatim.
3. **Apply the judgment items** in [the rubric](references/audit-rubric.md): the custom-domain routes are correct (apex + www), the build runs before deploy, and CI (Cloudflare Workers Builds or an Action) is wired. Confirm the `dist/` path matches what `audit-websites.ts` reported.
4. **Report** by location → criterion → fix, grouped by severity (FAIL / WARN / POLISH). The classic finding: a site Worker with **no** `wrangler.jsonc` (so `ki:site:deploy` fails).

### Mode CONFORM — bring a site's hosting up to standard

1. Run **AUDIT** first, so you change against a known gap list.
2. Fix the gaps in place — use the canonical shape from [the standard](references/cloudflare-hosting-standard.md): the `wrangler.jsonc` shape (`assets.directory`, `routes`, `observability`) and the `site:{deploy,preview,clean}` scripts. Adapt name, domains, and the `dist/` relative path to the layout. Add the `[ki-hosting-cloudflare]` table if missing (`bun scripts/audit-cloudflare-hosting.ts --init >> .ki-config.toml`, then set `site-root`). If a `wrangler pages deploy` is found, migrate it to Workers + Static Assets.
3. Re-run the checker; `bunx wrangler deploy --dry-run` from the site root should read the assets directory cleanly.

### Mode INIT — scaffold a site's hosting

Follow **[the setup guide](references/setup-guide.md)** — it is the step-by-step walkthrough of every action below. Summary:

**Use the `wrangler.jsonc` shape from [the standard](references/cloudflare-hosting-standard.md)** and the `ki:site:deploy`/`ki:site:preview` scripts; adapt `name`, `compatibility_date`, the `assets.directory` relative path (`./dist` flat, `../dist` from `site/`), and the custom-domain routes. Add the `[ki-hosting-cloudflare]` table to `.ki-config.toml` (`bun scripts/audit-cloudflare-hosting.ts --init >> .ki-config.toml`, then set `site-root`). Update `.gitignore` (`dist/`, `.wrangler/`). Then run the checker and `bunx wrangler deploy --dry-run` from the site root to confirm the assets directory resolves. Wire the custom domain and `www` redirect rule in the dashboard, then set up Cloudflare Workers Builds for CI/CD (see the guide's §7–§9).

### Mode REFRESH — re-anchor the standard to its sources

The standard pins volatile facts (the wrangler version, Static-Assets config keys, the Pages-deprecation status). Run on its declared cadence (see `references/sources.md`), or when asked "is the hosting standard current".

1. **Read [the source list](references/sources.md)** — each source with its `last reviewed` date.
2. **Re-fetch each** (WebFetch / WebSearch) and diff against the standard + rubric + [`scripts/audit-cloudflare-hosting.ts`](scripts/audit-cloudflare-hosting.ts): new/changed `assets` keys (`html_handling`, `not_found_handling`, `run_worker_first`), `compatibility_date` guidance, and whether Pages' deprecation status for static sites has moved.
3. **Scan the canonical deployed site** for emergent patterns not yet codified; promote the good ones, flag drift.
4. **Propose a diff**; confirm before writing. Then **update [the source list](references/sources.md)** — bump each `last reviewed` date and the `## Last review` block. What changed goes in the commit.

## Boundaries (out of scope, with their homes)

Reciprocal off-ramps — each names this skill back for the hosting layer:

- **Building the `dist/`** — Eleventy, Nunjucks, Tailwind, the portable-URL transform, the `src/` layout → `ki-websites-11ty`. The `dist/` is the seam between the two.
- **Any Worker that is not the static-site server** — bots, ingress receivers, APIs, Durable Objects, crons, queues — and **general Cloudflare/Workers/wrangler usage** (bindings, `wrangler dev`, KV/R2/D1, deploy flags) → the generic `cloudflare` / `wrangler` skills. This skill governs only the one Worker that serves `dist/`.
- **The Bun mandate, lint/deps families, `tsconfig`/`biome`, type-check** → `ki-engineering`.
- **A repo's GitHub settings, security, and universal local files** → `ki-repo`.
