---
name: ki-repo-website-cloudflare
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: [ki-repo-website]
description: >
  Governs Cloudflare hosting for either Knowledge Islands website implementation using Workers Static Assets, never Pages as the deployment target. Audits `wrangler.jsonc`, rejects the legacy `pages_build_output_dir` marker and any `main` server entry, matches `assets.directory` to `dist/`, and covers Workers Builds, workers.dev, custom domains, and deploy scripts. Use when publishing a content site or interactive app on Cloudflare or diagnosing a static deployment failure. Depends only on the neutral `ki-repo-website` seam.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# Knowledge Islands Cloudflare hosting standard

Apply the house convention for serving a built static site on **Cloudflare Workers Static Assets**: one site Worker points at the build's `dist/`, exposes the intended domains, enables observability, and is reached through the `ki:site:*` script family.

This is a base-agnostic standard skill selected by `[skills.ki-repo-website-cloudflare]` in `.ki-config.toml`. It owns only the deploy/serve delta for the static-site Worker. `ki-repo-website` owns the build that emits `dist/`; `ki-engineering` owns the toolchain. Companion Workers and general Cloudflare or Wrangler concerns route to the `cloudflare` and `wrangler` skills.

Use these references progressively:

- [Cloudflare hosting standard](references/standards-cloudflare-hosting.md) — load for the normative model, seam, configuration, scripts, CI/CD, and ownership boundaries.
- [Generated rubric](references/rubric.md) — load when applying the mechanical and judgment criteria.
- [Source list](references/sources.md) — load during REFRESH to recheck volatile Cloudflare facts and review dates.
- [Worked exemplars](references/exemplars.md) — load only when a standard clause needs a concrete multi-artifact configuration or CI/CD illustration; examples do not define policy.

## Model at a glance

```jsonc
{
  "name": "<site-name>",
  "compatibility_date": "<YYYY-MM-DD>",
  "assets": { "directory": "./dist" },
  "routes": [{ "pattern": "example.com", "custom_domain": true }],
  "observability": { "enabled": true }
}
```

Three rules define the boundary:

1. Use Workers Static Assets and `wrangler deploy`; Pages is not a deployment target for new projects.
2. Treat `assets.directory` as the seam to the `dist/` emitted by `ki-repo-website`.
3. Keep the site assets-only: no `main` means no server-side Worker code executes, making a published “no control plane” claim mechanically verifiable.

## Composition

Selecting this capability runs its declared `ki-repo-website` prerequisite first. `ki-engineering` is independently coverage-detected, and the unscoped repository audit includes it when declared:

```text
ki repo audit --skill ki-engineering --repo <repo>
ki repo audit --skill ki-repo-website --repo <repo>
ki repo audit --skill ki-repo-website-cloudflare --repo <repo>
```

The hosting catalogue reads repository evidence only. Cloudflare account and domain changes, Wrangler authentication or execution, Workers Builds configuration, preview, and deployment remain explicit report-only work outside hosted AUDIT and CONFORM.

## Operating modes

| Mode | Procedure |
| --- | --- |
| AUDIT | Read and follow [Mode AUDIT](references/mode-audit.md). |
| CONFORM | Read and follow [Mode CONFORM](references/mode-conform.md). |
| EDUCATE | Read and follow [Mode EDUCATE](references/mode-educate.md) for the one-time hosting scaffold. |
| REFRESH | Read and follow [Mode REFRESH](references/mode-refresh.md). |
| HELP | Explain the purpose, invocation, modes, and off-ramps, then stop without inspecting or changing repository. |

With no mode, show HELP and, in an interactive session only, offer the mode choice and request the target shown by `argument-hint`.

## Boundaries

- Shared `dist/` lifecycle → `ki-repo-website`; Eleventy content structure → `ki-repo-website-content`; React/Vite app structure → `ki-repo-website-app`.
- Companion Workers, APIs, Durable Objects, bindings, secrets, `wrangler dev`, deploy flags, KV/R2/D1, crons, and queues → `cloudflare` / `wrangler`.
- Bun, lint/dependency families, TypeScript, and Biome → `ki-engineering`.
- Universal repository files and repository configuration ownership → `ki-repo`.
