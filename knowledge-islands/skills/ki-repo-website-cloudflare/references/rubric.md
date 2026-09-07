<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Cloudflare static-site hosting

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-website-cloudflare --write`.

Line-by-line criteria for auditing ki-repo-website-cloudflare. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [WCF — Cloudflare hosting](#wcf--cloudflare-hosting)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## WCF — Cloudflare hosting

→ [standard](standards-cloudflare-hosting.md)

Workers Static Assets hosting standard.

- **WCF-1 [M] — site Worker config** — A site Worker configuration with static assets exists. (standards-cloudflare-hosting.md#1-model--workers-static-assets-not-pages)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-2 [M] — Workers deploy** — Deployment uses Workers Static Assets and contains no legacy Pages marker or Pages deploy command. (standards-cloudflare-hosting.md#1-model--workers-static-assets-not-pages)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-3 [M] — single site Worker** — Exactly one site Worker carries an assets block. (standards-cloudflare-hosting.md#1-model--workers-static-assets-not-pages)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-4 [M + J] — assets directory** — Parsed assets.directory is the exact contained dist output adjacent to its Wrangler config. (standards-cloudflare-hosting.md#2-the-dist-seam)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ Confirm the declared dist path is the exact output directory produced by the separately audited generator-neutral website build.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-6 [M] — generated directories ignored** — dist and .wrangler are gitignored. (standards-cloudflare-hosting.md#2-the-dist-seam, standards-cloudflare-hosting.md#4-the-script-family)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-8 [M] — Worker identity** — name and compatibility date are present. (standards-cloudflare-hosting.md#3-the-site-wranglerjsonc-shape)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-9 [M] — observability** — observability.enabled is true. (standards-cloudflare-hosting.md#3-the-site-wranglerjsonc-shape)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-10 [M-heuristic + J] — optional custom-domain routes** — When a custom domain is declared, at least one route uses custom_domain. (standards-cloudflare-hosting.md#3-the-site-wranglerjsonc-shape)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ When custom-domain routes are declared, verify they name the intended apex and any www host; workers.dev-only hosting needs no exception.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-13 [M + J] — deploy script** — The selected site package deploys with Wrangler and the repository root delegates the public alias. (standards-cloudflare-hosting.md#4-the-script-family)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ Confirm the real deployment path builds a current dist before invoking wrangler deploy; do not execute deployment during audit or conform.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-14 [M + J] — preview script** — The selected site package previews with Wrangler and the repository root delegates the public alias. (standards-cloudflare-hosting.md#4-the-script-family)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ Verify the preview script builds the site before wrangler dev and serves the same dist seam as production.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-25 [M + J] — version-upload authority** — An optional local upload script and its public alias create an undeployed Worker version only through explicit remote-effect authority. (standards-cloudflare-hosting.md#4-the-script-family)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ Confirm audits, conformance, local builds, tests, and dry evaluation inspect ki:site:upload without executing Wrangler; only an explicitly authorised operator or Workers Builds service may supply Cloudflare credentials and create the remote version.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-26 [M + J] — the Cloudflare guide** — A tracked guide at docs/guides/cloudflare.md records the dashboard-owned settings — Workers Builds commands, domains, redirects — that wrangler.jsonc cannot express. (standards-cloudflare-hosting.md#6-the-cloudflare-guide--dashboard-owned-settings)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ Confirm the guide records the exact dashboard-owned values — Workers Builds build/deploy commands and root directory, domain and redirect choices, workers.dev — matching the live dashboard, and duplicates nothing wrangler.jsonc already declares.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-19 [M + J] — companion Worker boundary** — Companion Workers remain out of scope. (standards-cloudflare-hosting.md#7-boundaries--what-is-not-in-scope)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ Confirm configs classified as companions have main without assets and route their bindings, secrets, and runtime concerns to cloudflare/wrangler.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-20 [M] — hosting opt-in** — The Cloudflare opt-in table is present. (standards-cloudflare-hosting.md#1-model--workers-static-assets-not-pages)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-21 [M] — opt-in validation** — The hosting table is keyless and consumes the valid website-core site root. (standards-cloudflare-hosting.md#1-model--workers-static-assets-not-pages)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-22 [M + J] — hosting delta** — This remains the hosting delta only. (standards-cloudflare-hosting.md#7-boundaries--what-is-not-in-scope)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
  - _Evidence scope:_ The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.
  - _Review prompt:_ Confirm Workers Builds, account/domain binding, and deployed behavior separately without expanding this rubric into the site build or general Worker concerns.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.
- **WCF-23 [M] — assets-only Worker** — A static website Worker has no main field and therefore executes no server-side code. (standards-cloudflare-hosting.md#1-model--workers-static-assets-not-pages)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
- **WCF-24 [M] — SPA fallback** — An interactive app uses Workers Static Assets single-page-application fallback. (standards-cloudflare-hosting.md#3-the-site-wranglerjsonc-shape)
  - _Remediation:_ diagnostic — Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.
