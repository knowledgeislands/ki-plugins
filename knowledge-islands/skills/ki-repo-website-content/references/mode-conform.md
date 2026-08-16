# Mode CONFORM — bring a site up to standard

**Precondition:** Run [Mode AUDIT](mode-audit.md) first so every change starts from a known gap list.

_On-demand procedure for ki-repo-website-content's CONFORM mode. The host publishes only bounded `.ki-config.toml` and `.gitignore` proposals; source scaffolding, builds, deployments, and other external work remain explicit._

1. **Apply the safe hosted repair.** Run `ki repo conform --repo <repo> --skill ki-repo-website-content`. `ki-repo` owns adding the keyless `[skills.ki-repo-website-content]` declaration; this session may only correct the generated-output ignore entry to `site/dist` on physical, contained files. Malformed or symlinked configuration and unsafe paths remain report-only.
2. **Repair source and configuration gaps deliberately.** Use [the standard](standards-eleventy-site.md) and [the exemplars](exemplars.md) for the Eleventy configuration, Tailwind token pair, layouts, partials, content model, and script family. The hosted conform transaction does not scaffold or rewrite application code.
3. **Conform adjacent layers separately.** Run `ki-engineering` for toolchain findings and `ki-authoring` for Markdown or TOML style. Run `ki-repo-website-cloudflare` only when the repository owns that deployment layer.
4. **Verify explicitly.** Re-run the website audit, build the site through its declared script, inspect representative generated links, and run any applicable hosting audit. Deployment remains an operator action and is never performed by this skill's hosted conform transaction.
