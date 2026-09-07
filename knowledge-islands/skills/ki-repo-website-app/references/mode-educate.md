# EDUCATE

Use keyless `[skills.ki-repo-website]` for the implicit `apps/site` default. Add `site-root` only for an explicit override; do not materialise defaults.

Scaffold a TypeScript React Vite application at `apps/site` by default, expose local `build` and `dev` scripts in its package manifest, emit `dist/`, and declare `[skills.ki-repo-website]` plus the keyless `[skills.ki-repo-website-app]`. Put an explicit safe `site-root` override only in the core table. The core website seam owns the public root `ki:site:*` aliases. Add hosting separately.
