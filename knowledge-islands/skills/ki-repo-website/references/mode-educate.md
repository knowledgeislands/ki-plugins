# EDUCATE

Use keyless `[skills.ki-repo-website]` for the implicit `apps/site` default. Add `site-root` only for an explicit override; do not materialise defaults.

1. Decide whether the website is content-led or one interactive application.
2. Create the website under `apps/site`, or declare `site-root = "."` or another safe relative override under `[skills.ki-repo-website]`.
3. Declare the core and exactly one keyless implementation table.
4. Establish ordinary `build`, `dev`, and `clean` scripts in the selected site's `package.json`; expose delegating `ki:site:build`, `ki:site:dev`, and `ki:site:clean` aliases in the repository root package; and ignore the selected root's local `dist/` output.
5. Add a hosting adapter independently when publication requires one.
