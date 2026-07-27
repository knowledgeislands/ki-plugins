# Mode CONFORM — align Cloudflare hosting

Bring an existing static-site hosting footprint to the [Cloudflare hosting standard](standards-cloudflare-hosting.md).

1. Run [Mode AUDIT](mode-audit.md) and use its concrete gap list.
2. Run the hosted dry-run:

   ```bash
   ki repo conform --skill ki-website-cloudflare --dry-run --repo <repo>
   ```

   The catalogue is deliberately report-only: Worker identity, domains, build topology, and deployment intent require repository-specific judgment, so it publishes no files and launches no process.

3. Apply the reviewed local edits in place: correct the site `wrangler.jsonc`, the `assets.directory` seam, package scripts, `.gitignore`, and the `[ki-website-cloudflare]` table. Never infer an account, domain, Worker name, or deploy target.
4. Re-run hosted AUDIT until its mechanical findings are clean, then re-apply the rubric's judgment aspects.
5. If deployment validation is authorised, run the appropriate Wrangler dry-run or preview explicitly from the site root. Authentication, dashboard changes, domain wiring, Workers Builds, and production deployment remain outside hosted CONFORM.
