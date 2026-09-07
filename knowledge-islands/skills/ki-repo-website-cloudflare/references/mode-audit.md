# Mode AUDIT — inspect Cloudflare hosting

Check one repository's static-site hosting without launching Wrangler or changing Cloudflare.

1. Run the upstream layers:

   ```bash
   ki repo audit --skill ki-engineering --repo <repo>
   ki repo audit --skill ki-repo-website --repo <repo>
   ki repo audit --skill ki-repo-website-content --repo <repo> # or ki-repo-website-app
   ```

2. Run the hosted mechanical catalogue:

   ```bash
   ki repo audit --skill ki-repo-website-cloudflare --repo <repo>
   ```

   It consumes the site root selected by `[skills.ki-repo-website]` (default `apps/site`), discovers its nested `wrangler` configuration plus root and one-level companion configs, rejects the legacy Pages marker and `main`, validates the `dist/` seam and SPA fallback where applicable, then checks scripts, ignores, identity, observability, routes, and the keyless `[skills.ki-repo-website-cloudflare]` opt-in. It never follows symlinked governed files.

3. Apply the judgment aspects in the [generated rubric](rubric.md): confirm the `dist/` matches the separately audited build, routes name the intended apex and `www`, preview and deployment build first, companion classification is correct, and Workers Builds/account/domain state agrees with the repository.

   A `wrangler` OAuth session (`wrangler login`) typically cannot read the Workers Builds or zone-ruleset APIs — `GET /accounts/{id}/builds/triggers` and `GET /zones/{id}/rulesets` both return an authentication error even though `wrangler whoami` succeeds; check the token's printed scope list first rather than assuming account access. Verify whether Workers Builds is connected **indirectly** instead: list recent Worker versions (`wrangler deployments list --name <worker>`) and check whether each carries `"workers/triggered_by": "version_upload"` (a manual `wrangler deploy`, meaning Builds is not connected or did not fire) versus a build-originated annotation; cross-check against `gh api repos/<owner>/<repo>/commits/<sha>/check-runs` for a check run from the `cloudflare-workers-and-pages` GitHub App on recent pushes — its presence confirms a live Builds connection even when the account API itself is unreachable.

4. Report remaining `FAIL` findings, then `WARN` findings, followed by judgment conclusions and intentional exceptions. Name the two upstream audits in the verdict.

Cloudflare account, domain, dashboard, Wrangler, preview, and deployment operations remain explicit follow-up; AUDIT does not execute them.
