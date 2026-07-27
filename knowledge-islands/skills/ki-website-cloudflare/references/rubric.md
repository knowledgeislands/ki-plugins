<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Cloudflare static-site hosting

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-website-cloudflare --write`.

Line-by-line criteria for auditing ki-website-cloudflare. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [WCF — Cloudflare hosting](#wcf--cloudflare-hosting)

## WCF — Cloudflare hosting

→ [standard](standards-cloudflare-hosting.md)

Workers + Static Assets hosting standard.

- **WCF-1 [M] — site Worker config** — A site Worker configuration with static assets exists. (standards-cloudflare-hosting.md#1-model--workers--static-assets-not-pages)
- **WCF-2 [M] — Workers deploy** — Deployment uses Workers + Static Assets, not Pages. (standards-cloudflare-hosting.md#1-model--workers--static-assets-not-pages)
- **WCF-3 [M] — single site Worker** — Exactly one site Worker carries an assets block. (standards-cloudflare-hosting.md#1-model--workers--static-assets-not-pages)
- **WCF-4 [M + J] — assets directory** — Assets point at the build dist directory. (standards-cloudflare-hosting.md#2-the-dist-seam)
  - _Review prompt:_ Confirm the declared dist path is the exact output directory produced by the separately audited ki-website build.
- **WCF-6 [M] — generated directories ignored** — dist and .wrangler are gitignored. (standards-cloudflare-hosting.md#2-the-dist-seam, standards-cloudflare-hosting.md#4-the-script-family)
- **WCF-8 [M] — Worker identity** — name and compatibility date are present. (standards-cloudflare-hosting.md#3-the-site-wranglerjsonc-shape)
- **WCF-9 [M] — observability** — observability.enabled is true. (standards-cloudflare-hosting.md#3-the-site-wranglerjsonc-shape)
- **WCF-10 [M-heuristic + J] — custom-domain routes** — Routes use custom_domain where appropriate. (standards-cloudflare-hosting.md#3-the-site-wranglerjsonc-shape)
  - _Review prompt:_ Verify the custom-domain routes name the correct apex and www host, or document the intentional workers.dev-only exception.
- **WCF-13 [M + J] — deploy script** — A deploy script runs wrangler deploy. (standards-cloudflare-hosting.md#4-the-script-family)
  - _Review prompt:_ Confirm the real deployment path builds a current dist before invoking wrangler deploy; do not execute deployment during audit or conform.
- **WCF-14 [M + J] — preview script** — A preview script runs wrangler dev. (standards-cloudflare-hosting.md#4-the-script-family)
  - _Review prompt:_ Verify the preview script builds the site before wrangler dev and serves the same dist seam as production.
- **WCF-19 [M + J] — companion Worker boundary** — Companion Workers remain out of scope. (standards-cloudflare-hosting.md#6-boundaries--what-is-not-in-scope)
  - _Review prompt:_ Confirm configs classified as companions have main without assets and route their bindings, secrets, and runtime concerns to cloudflare/wrangler.
- **WCF-20 [M] — hosting opt-in** — The Cloudflare opt-in table is present. (standards-cloudflare-hosting.md#1-model--workers--static-assets-not-pages)
- **WCF-21 [M] — opt-in validation** — The opt-in site root is valid. (standards-cloudflare-hosting.md#1-model--workers--static-assets-not-pages)
- **WCF-22 [M + J] — hosting delta** — This remains the hosting delta only. (standards-cloudflare-hosting.md#6-boundaries--what-is-not-in-scope)
  - _Review prompt:_ Confirm Workers Builds, account/domain binding, and deployed behavior separately without expanding this rubric into the site build or general Worker concerns.
