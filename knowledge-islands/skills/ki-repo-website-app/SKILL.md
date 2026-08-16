---
name: ki-repo-website-app
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: [ki-repo-website]
owns: [vite.config.ts, vite.config.js, vite.config.mjs, vite.config.mts]
contributes: ['.ki-config.toml', package.json]
requires: []
description: >-
  Governs the Knowledge Islands interactive website implementation: one client-side React application bundled by Vite to `dist/`. Use for dashboards and single interactive SPAs whose primary artifact is an application rather than a Markdown/data page collection. This is the legitimate alternative to `ki-repo-website-content`; never select both. Cloudflare hosting remains an independent adapter.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands interactive website standard

Apply this skill to one interactive browser application. The current house implementation is React with Vite, producing static `dist/` output through the `ki-repo-website` lifecycle seam.

Do not add Eleventy around a React SPA merely to satisfy a website standard. Eleventy does not bundle the application JavaScript, so that pairing creates two build systems without a content-collection need. Select `ki-repo-website-content` instead only when Markdown/data page generation is the primary architecture.

Read [the app standard](references/standards-app-site.md), [the generated rubric](references/rubric.md), and [the sources](references/sources.md).

## Operating modes

### Mode AUDIT

Read [references/mode-audit.md](references/mode-audit.md).

### Mode CONFORM

Read [references/mode-conform.md](references/mode-conform.md).

### Mode EDUCATE

Read [references/mode-educate.md](references/mode-educate.md).

### Mode REFRESH

Read [references/mode-refresh.md](references/mode-refresh.md).

REFRESH writes only in `ki-agentic-harness`; when invoked from an installed copy, stop and redirect the work to the harness.

### Mode HELP

Explain the purpose, implementation, modes, and off-ramps, then stop without inspecting or changing a repository.

## Boundaries

- Shared lifecycle and `dist/` seam → `ki-repo-website`.
- Markdown/data page collections and Eleventy → `ki-repo-website-content`.
- Static-assets hosting and SPA fallback configuration → the selected hosting adapter.
- Server APIs or full-stack runtime code → a separate future app/runtime capability, not this client-only standard.
