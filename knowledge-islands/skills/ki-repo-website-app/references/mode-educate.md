# EDUCATE

Use keyless `[skills.ki-repo-website]` for the implicit `apps/site` default. Add `site-root` only for an explicit override; do not materialise defaults.

Scaffold a TypeScript React Vite application at `apps/site` by default, expose local `build` and `ki:site:dev` scripts in its package manifest, emit `dist/`, and declare `[skills.ki-repo-website]` plus the keyless `[skills.ki-repo-website-app]`. Put an explicit safe `site-root` override only in the core table. The core website seam owns public root `ki:site:*` aliases and delegates development to the selected package's same key. Add hosting separately.
