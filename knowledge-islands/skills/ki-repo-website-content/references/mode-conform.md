# Mode CONFORM — bring the site up to standard

**Precondition:** Run [Mode AUDIT](mode-audit.md) first so the change starts from a concrete gap list.

_On-demand procedure for `ki-repo-website-content`'s CONFORM mode. The host publishes only bounded `.ki.toml` proposals; `ki-repo` centrally composes `.gitignore`, while source scaffolding, builds, deployments, and other external work remain explicit._

1. **Apply the safe hosted repair.** Run `ki repo conform --repo <repo> --skill ki-repo-website-content`. `ki-repo` owns adding the keyless `[skills.ki-repo-website-content]` declaration. The selected site root remains solely `[skills.ki-repo-website].site-root`; this skill consumes it and does not introduce a second path key. The repository composer contributes the corresponding `<site-root>/dist/` ignore once for the complete operation. Malformed or symlinked configuration and unsafe paths remain report-only.
2. **Repair source and configuration gaps deliberately.** Use [the standard](standards-eleventy-site.md) and [the exemplars](exemplars.md) for the Eleventy configuration, Tailwind token pair, layouts, partials, content model, and script family. The hosted conform transaction does not scaffold or rewrite application code.
3. **Conform adjacent layers separately.** Address `ki-engineering` common-toolchain findings and `ki-authoring` Markdown/TOML style. Run `ki-repo-website-cloudflare` only when the repository owns that deployment layer.
4. **Verify explicitly.** Re-run the website audits, build through the declared script, inspect representative generated links under `<site-root>/dist/`, and run any applicable hosting audit. Deployment remains an operator action and is never performed by this skill's hosted conform transaction.

Reciprocal off-ramps name where work leaves the site-build layer:

- **The Bun mandate, aggregate/scoped audit wiring, direct code-tool execution, `tsconfig`/Biome, and type-checking** → `ki-engineering`.
- **Markdown and TOML style** → `ki-authoring`.
- **A single interactive React/Vite application** → `ki-repo-website-app`.
- **`wrangler.jsonc`, Workers Static Assets, deployment, and domains** → `ki-repo-website-cloudflare`.
- **Repository APIs and GitHub configuration** → `ki-repo`.
