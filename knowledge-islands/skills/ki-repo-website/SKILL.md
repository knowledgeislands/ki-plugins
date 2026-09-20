---
name: ki-repo-website
ki-kind: governance
ki-applicability: detected
ki-shared-modules: [site-selection]
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: []
owns: []
contributes: ['.ki.toml', '.gitignore', package.json]
requires: []
description: >
  Govern the generator-neutral KI website seam: source root, reproducible `dist/`, and `ki:site:build`,
  `ki:site:dev`, and `ki:site:clean`. Use before choosing `ki-repo-website-content` or `ki-repo-website-app`;
  hosting is independent.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands website core

The core supports either the existing single-site `site-root` contract or an explicit named registry using `primary-site` and `[skills.ki-repo-website.sites]`. Overlays may select a named subset; the unqualified `ki:site:*` commands remain the primary public seam and may resolve through one exact `self:site:<primary>:<verb>` hop.

Apply the generator- and provider-neutral website contract. A website declares `[skills.ki-repo-website]`, selects exactly one of `ki-repo-website-content` or `ki-repo-website-app`, and may independently select a hosting adapter such as `ki-repo-website-cloudflare`.

The shared seam is a generated `dist/` beside the selected site root and three public aliases in the repository root `package.json`: `ki:site:build`, `ki:site:dev`, and `ki:site:clean`. Build and clean delegate to ordinary lifecycle scripts in the selected site package; development delegates to the package-local capability key `ki:site:dev`. The default site root is `apps/site`; `[skills.ki-repo-website] site-root = "."` retains a flat repository, and another safe relative path is an explicit override. This core skill alone owns that path. The implementation skill owns what the local commands run. The hosting adapter owns how `dist/` is published.

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

Configuration writers leave `[skills.ki-repo-website]` keyless for the implicit `apps/site` default and add `site-root` only for an explicit override. Audit diagnoses `site-root = "apps/site"` as redundant configuration whose removal preserves the selected root.

- Content collections, Eleventy, templates, and design tokens → `ki-repo-website-content`.
- Interactive React/Vite application structure → `ki-repo-website-app`.
- Cloudflare Workers Static Assets, domains, and deploy commands → `ki-repo-website-cloudflare`.
- TypeScript/Bun toolchain → `ki-engineering`.
