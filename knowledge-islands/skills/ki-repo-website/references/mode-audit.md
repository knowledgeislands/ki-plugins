# AUDIT

1. Run `ki repo audit --skill ki-repo-website --repo <repo>`; confirm `site-root` is safe, the root `ki:site:*` aliases are present, and the selected site's manifest and `dist/` ignore seam agree.
2. Run the declared `ki-repo-website-content` or `ki-repo-website-app` audit.
3. Run any independently declared hosting adapter.
4. Build the site explicitly when execution is authorised; the hosted rubric remains read-only.
