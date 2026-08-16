# Knowledge Islands website core standard

## 1. Selection

Every governed website declares `[skills.ki-repo-website]` and exactly one purpose-specific implementation:

- `[skills.ki-repo-website-content]` for a page collection generated from Markdown or data.
- `[skills.ki-repo-website-app]` for one interactive browser application.

The two implementations are mutually exclusive. Hosting is independent and composes with either.

## 2. Build seam

The selected implementation generates `dist/` at its site root. A canonical monorepo uses `site/dist/`; a flat repository uses `dist/`. Generated output is ignored by Git and recreated by the build.

The root `package.json` exposes:

- `ki:site:build` — generate production `dist/`.
- `ki:site:dev` — run the implementation's development loop.
- `ki:site:clean` — remove generated site output.

The implementation skill verifies command semantics. A hosting adapter consumes `dist/` and must not infer the generator.

## 3. Ownership

This core owns selection and the build-output/lifecycle seam only. It does not choose Eleventy, React, a CSS stack, a host, a DNS provider, or server-side code.
