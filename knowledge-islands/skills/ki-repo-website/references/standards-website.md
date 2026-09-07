# Knowledge Islands website core standard

## 1. Selection

Every governed website declares `[skills.ki-repo-website]` and exactly one purpose-specific implementation:

- `[skills.ki-repo-website-content]` for a page collection generated from Markdown and data.
- `[skills.ki-repo-website-app]` for one interactive browser application.

The two implementations are mutually exclusive. Hosting is independent and composes with either.

## 2. Site root

Configuration-producing modes MUST keep the `apps/site` default implicit: leave `[skills.ki-repo-website]` keyless and write `site-root` only for an override. Audit diagnoses an explicit `site-root = "apps/site"` as a redundant default and asks the owner to remove the key; omission preserves the same selected root.

`[skills.ki-repo-website]` is the single owner of `site-root`. Omission selects `apps/site`, the canonical application workspace. An explicit `site-root = "."` selects the repository root; any other override is a canonical safe relative path without empty, current-directory, parent-directory, backslash, drive, or absolute components. Implementation and hosting tables remain keyless and consume this selection rather than restating it.

The selected site root owns the implementation package manifest, implementation configuration, source entry, ordinary lifecycle scripts, generated output, and hosting configuration. The repository root package manifest owns the public `ki:site:*` aliases. The selection never permits filesystem reads outside the repository.

## 3. Build seam

The selected implementation generates `dist/` at its site root: `apps/site/dist/` by default and `dist/` for an explicit flat repository. Generated output is ignored by Git and recreated by the build.

The repository root `package.json` exposes public aliases that delegate to the selected site package:

- `ki:site:build` — delegate to the selected package's `build` script and generate production `dist/`.
- `ki:site:dev` — delegate to the selected package's `dev` script.
- `ki:site:clean` — delegate to the selected package's `clean` script and remove generated output.

The implementation skill verifies the selected package's ordinary command semantics. A hosting adapter consumes the selected root's `dist/` and must not infer the generator.

## 4. Ownership

This core owns implementation selection, `site-root`, and the build-output/lifecycle seam only. It does not choose Eleventy, React, a CSS stack, a host, DNS provider, or server-side code.
