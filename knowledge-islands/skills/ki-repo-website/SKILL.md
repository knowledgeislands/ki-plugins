---
name: ki-repo-website
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: []
owns: []
contributes: ['.ki-config.toml', '.gitignore', package.json]
requires: []
description: >-
  Governs the generator-neutral Knowledge Islands website seam: one site source root, a reproducible `dist/` output, and the `ki:site:build`, `ki:site:dev`, and `ki:site:clean` lifecycle. Use for any repository that publishes a website, before selecting exactly one purpose-specific implementation: `ki-repo-website-content` for Markdown/data page collections or `ki-repo-website-app` for a single interactive React/Vite app. Hosting is orthogonal; add `ki-repo-website-cloudflare` only when Cloudflare serves the output.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands website core

Apply the generator- and provider-neutral website contract. A website declares `[skills.ki-repo-website]`, selects exactly one of `ki-repo-website-content` or `ki-repo-website-app`, and may independently select a hosting adapter such as `ki-repo-website-cloudflare`.

The shared seam is a generated `dist/` beside the selected site root and three root package scripts: `ki:site:build`, `ki:site:dev`, and `ki:site:clean`. The implementation skill owns what those commands run. The hosting adapter owns how `dist/` is published.

Read [the website core standard](references/standards-website.md) for the contract, [the generated rubric](references/rubric.md) for exact checks, and [the source list](references/sources.md) in REFRESH mode.

## Select by purpose

- Use `ki-repo-website-content` when the primary artifact is a collection of pages generated from Markdown or structured data. Its current implementation is Eleventy.
- Use `ki-repo-website-app` when the primary artifact is one interactive browser application. Its current implementation is React with Vite.
- Do not select both. A hybrid architecture needs an explicit future standard rather than silently running two build systems.

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

Explain the purpose, composition choice, modes, and off-ramps, then stop without inspecting or changing a repository.

## Boundaries

- Content collections, Eleventy, templates, and design tokens → `ki-repo-website-content`.
- Interactive React/Vite application structure → `ki-repo-website-app`.
- Cloudflare Workers Static Assets, domains, and deploy commands → `ki-repo-website-cloudflare`.
- TypeScript/Bun toolchain → `ki-engineering`.
