# CONFORM

Conform never materialises the implicit `apps/site` default. It writes `site-root` only when an explicit non-default root has been selected.

Run `ki repo conform --skill ki-repo-website --dry-run --repo <repo>`. Review the `site-root` declaration and generated-output proposals. Choose or change the site root or content/app implementation deliberately; conform does not infer architecture, move files, or run builds.
