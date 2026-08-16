# Mode EDUCATE — scaffold Cloudflare hosting

Scaffold Cloudflare Workers Static Assets hosting for a new Knowledge Islands site. Follow this once per site; subsequent changes are handled by CONFORM or AUDIT. The full contract is in [the Cloudflare hosting standard](standards-cloudflare-hosting.md).

## Contents

- [1. Before you start — prerequisites](#1-before-you-start--prerequisites)
- [2. Create the site `wrangler.jsonc`](#2-create-the-site-wranglerjsonc)
- [3. Add the script family to `package.json`](#3-add-the-script-family-to-packagejson)
- [4. Update `.gitignore`](#4-update-gitignore)
- [5. Mark the repo with `.ki-config.toml`](#5-mark-the-repo-with-ki-configtoml)
- [6. First deploy — workers.dev subdomain](#6-first-deploy--workersdev-subdomain)
- [7. Wire the custom domain](#7-wire-the-custom-domain)
- [8. Add the `www` redirect rule](#8-add-the-www-redirect-rule)
- [9. Set up Cloudflare Workers Builds (CI/CD)](#9-set-up-cloudflare-workers-builds-cicd)
- [10. Verify](#10-verify)

---

## 1. Before you start — prerequisites

| What                                                    | Where                                       |
| ------------------------------------------------------- | ------------------------------------------- |
| Cloudflare account with Workers access                  | dash.cloudflare.com                         |
| Domain added to Cloudflare (nameservers pointing to CF) | Cloudflare DNS dashboard for the zone       |
| `wrangler` CLI in `devDependencies`                     | `bun add -D wrangler`                       |
| A built `dist/` produced by `ki-repo-website`                | run `bun run ki:site:build` once to confirm |

Wrangler authentication and every Cloudflare control-plane operation below are explicit operator steps; the hosted rubric never launches them. Log in to Wrangler before doing anything else:

```bash
bunx wrangler login
```

This opens a browser OAuth flow and stores user-scoped credentials outside the repository. Re-run only if they expire or you switch accounts.

---

## 2. Create the site `wrangler.jsonc`

The config lives at the **site root** — the repo root for a flat layout, the `site/` subfolder when the repo also has companion Workers. Use the canonical shape from the standard and adapt three fields: `name`, `compatibility_date`, and the `assets.directory` path.

```jsonc
{
  // <site-name> — Cloudflare Workers deployment (Workers Static Assets, not Pages).
  "name": "<site-name>",
  "compatibility_date": "<YYYY-MM-DD>",
  // The selected website implementation builds dist/ beside this file.
  // Path is relative to THIS file.
  "assets": { "directory": "./dist" },
  // Custom domains — apex plus www (www → apex via a Cloudflare redirect rule, see §8).
  // Omit routes for the initial deploy if the domain is not yet in Cloudflare; add them in §7.
  "routes": [
    { "pattern": "example.com", "custom_domain": true },
    { "pattern": "www.example.com", "custom_domain": true }
  ],
  // Persist Workers logs in the dashboard (Workers & Pages → <name> → Logs).
  "observability": { "enabled": true }
}
```

`assets.directory` notes:

- **`"./dist"`** — `wrangler.jsonc` is at the repo root (`dist/` is a sibling).
- **`"dist"`** — `wrangler.jsonc` and the build output both live in the canonical `site/` workspace.

Set `compatibility_date` to today's date (`YYYY-MM-DD`). For a pure-assets Worker there is no runtime code, but the field is required.

---

## 3. Add the script family to `package.json`

Add these three scripts to the root `package.json`. Use the `site:` prefix for the `site/`-subfolder layout; drop it for a flat layout (rare):

```jsonc
{
  "scripts": {
    "ki:site:deploy": "cd site && bunx wrangler deploy",
    "ki:site:preview": "bun run ki:site:build && cd site && bunx wrangler dev",
    "ki:site:clean": "rm -rf site/dist site/.wrangler"
  }
}
```

For a **flat** layout (no `site/` subfolder, `wrangler.jsonc` at repo root):

```jsonc
{
  "scripts": {
    "ki:site:deploy": "bunx wrangler deploy",
    "ki:site:preview": "bun run ki:site:build && bunx wrangler dev",
    "ki:site:clean": "rm -rf dist .wrangler"
  }
}
```

`ki:site:build` and `ki:site:dev` are owned by `ki-repo-website` — do not redefine them here.

---

## 4. Update `.gitignore`

For a flat layout, add these entries to the repository `.gitignore`:

```gitignore
dist/
.wrangler/
```

`dist/` is regenerated on every build; committing it causes conflicts and bloats history. `.wrangler/` holds wrangler's local cache and upload state.

For the canonical `site/` workspace, use the workspace-relative entries instead:

```gitignore
site/dist/
site/.wrangler/
```

---

## 5. Mark the repo with `.ki-config.toml`

Add the `[skills.ki-repo-website-cloudflare]` table so the mechanical checker can find the repo:

```toml
[skills.ki-repo-website-cloudflare]
# site-root is the path (relative to the repo root) where wrangler.jsonc lives.
# "site" for the subfolder layout; "." for flat.
site-root = "site"
```

If `.ki-config.toml` does not yet exist, create it at the repo root. Other skills may already have their own tables in it — just append.

---

## 6. First deploy — workers.dev subdomain

Build the site and deploy. On first deploy, Cloudflare creates the Worker and assigns a `<name>.<account-subdomain>.workers.dev` URL — no custom domain is needed yet.

```bash
bun run ki:site:build   # produce dist/
bun run ki:site:deploy  # upload to Cloudflare
```

Expected output includes `Published <name> (Uploaded …)` and a `*.workers.dev` URL. Open it in a browser to confirm the site loads. If the deploy fails:

- `No such file or directory: dist` → the build did not run, or `assets.directory` is wrong. Re-check the relative path.
- `Authentication error` → run `bunx wrangler login` again.
- `workers.dev is disabled` → Workers is disabled on the account subdomain; enable it at **Workers & Pages → Settings** in the dashboard, or skip to §7 (custom-domain routes work independently of `workers.dev`).

---

## 7. Wire the custom domain

This happens in the **Cloudflare dashboard**, not via `wrangler`. The `routes` block in `wrangler.jsonc` with `custom_domain: true` tells Cloudflare to serve the Worker at that domain, but Cloudflare only honours it if the domain's DNS is already managed in the same account.

1. Go to **Workers & Pages → Overview → `<name>` → Settings → Domains & Routes → Add → Custom Domain**.
2. Enter the apex domain (`example.com`) and select **Add Custom Domain**. Alternatively, declare `custom_domain: true` under `routes` and redeploy.
3. Cloudflare automatically creates a CNAME/A record pointing the apex at the Worker. No manual DNS entry needed when using `custom_domain: true`.
4. Repeat for `www.example.com`.

After a redeploy (`bun run ki:site:deploy`) the domain should resolve. DNS propagation may take a few minutes.

---

## 8. Add the `www` redirect rule

The `www` route is declared in `wrangler.jsonc` so Cloudflare serves the Worker at `www.example.com`, but `www` should redirect to the apex rather than serve a duplicate. Create this redirect rule in the dashboard, not in wrangler:

1. Go to the zone for `example.com` → **Rules → Redirect Rules → Create rule**.
2. **Custom filter expression**: `(http.host eq "www.example.com")`.
3. **Then**: redirect to `https://example.com${http.request.uri.path}`, type **301 (permanent)**, preserve path.
4. Save and deploy the rule.

Test with `curl -I https://www.example.com` — the response should be `301` with `Location: https://example.com/`.

---

## 9. Set up Cloudflare Workers Builds (CI/CD)

Cloudflare Workers Builds replaces manual `bun run ki:site:deploy` calls: a push to `main` triggers Cloudflare to build and redeploy automatically. No GitHub Actions workflow needed for the deploy itself.

1. Go to **Workers & Pages → `<name>` → Settings → Build**.
2. Connect the GitHub repository (authorize the Cloudflare GitHub App if prompted).
3. Set the **build command** to `bun run ki:site:build`.
4. Set the **deploy command** to `bun run ki:site:deploy` (or `bunx wrangler deploy` when no package script exists).
5. For a monorepo, set the optional **root directory** to the directory from which those commands resolve. Do not configure a deploy directory; `assets.directory` in `wrangler.jsonc` owns the build-output path.
6. Confirm the branch is `main`, save, then watch **Workers & Pages → `<name>` → Deployments** after the next push.

If the repo runs a GitHub Action that commits to `main` before deploy (e.g. a content-apply or image-optimization step), that Action commits to `main`, which triggers Workers Builds — the two work together without conflict.

---

## 10. Verify

Run the mechanical checker to confirm the hosting config is conformant:

```bash
ki repo audit --repo <repo-root> --skill ki-repo-website-cloudflare
```

All items should be `PASS`. The two most common first-run findings:

- **`assets.directory` path wrong** — confirm it resolves relative to where `wrangler.jsonc` lives, not the repo root.
- **`dist/` not gitignored** — add `dist/` to `.gitignore`.

Also confirm end-to-end manually:

1. `bun run ki:site:preview` — builds locally and serves through the real Worker runtime at `http://localhost:8787`. Check that the site loads and internal links work.
2. `bun run ki:site:deploy` — deploys to production. Confirm the custom domain resolves and the `www` redirect returns 301.
