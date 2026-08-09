# Mode AUDIT — inspect Cloudflare hosting

Check one repository's static-site hosting without launching Wrangler or changing Cloudflare.

1. Run the upstream layers:

   ```bash
   ki repo audit --skill ki-engineering --repo <repo>
   ki repo audit --skill ki-repo-website --repo <repo>
   ```

2. Run the hosted mechanical catalogue:

   ```bash
   ki repo audit --skill ki-repo-website-cloudflare --repo <repo>
   ```

   It discovers a root or one-level `wrangler` configuration, distinguishes the site Worker from companions, validates the `dist/` seam, scripts, ignores, identity, observability, routes, and `[skills.ki-repo-website-cloudflare]` table, and never follows symlinked governed files.

3. Apply the judgment aspects in the [generated rubric](rubric.md): confirm the `dist/` matches the separately audited build, routes name the intended apex and `www`, preview and deployment build first, companion classification is correct, and Workers Builds/account/domain state agrees with the repository.

4. Report remaining `FAIL` findings, then `WARN` findings, followed by judgment conclusions and intentional exceptions. Name the two upstream audits in the verdict.

Cloudflare account, domain, dashboard, Wrangler, preview, and deployment operations remain explicit follow-up; AUDIT does not execute them.
