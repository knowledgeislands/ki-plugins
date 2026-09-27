# Knowledge Islands website core standard

## 1. Selection

Every governed website declares `[skills.ki-repo-website]` and exactly one purpose-specific implementation:

- `[skills.ki-repo-website-content]` for a page collection generated from Markdown and data.
- `[skills.ki-repo-website-app]` for one interactive browser application.

The two implementations are mutually exclusive. Hosting is independent and composes with either.

## 2. Site selection

The site-root rules below define single-site mode. Multi-site mode is explicit and mutually exclusive with `site-root`:

```toml
[skills.ki-repo-website]
primary-site = "apex"

[skills.ki-repo-website.sites]
apex = "apps/site-apex"
tower = "apps/site-tower"
```

Site names use lower-kebab-case. Every root is unique, safe, repository-relative, and a physical directory; `primary-site` names exactly one declared site. Implementation and hosting overlays apply to every named site by default. An overlay may select a non-empty, duplicate-free subset of known names with `sites = ["apex"]`; it never declares paths. Every selected site receives its own attributed evidence. Conform never infers or creates a named registry.

Configuration-producing modes MUST keep the `apps/site` default implicit: leave `[skills.ki-repo-website]` keyless and write `site-root` only for an override. Audit diagnoses an explicit `site-root = "apps/site"` as a redundant default and asks the owner to remove the key; omission preserves the same selected root.

`[skills.ki-repo-website]` is the single owner of `site-root`. Omission selects `apps/site`, the canonical application workspace. An explicit `site-root = "."` selects the repository root; any other override is a canonical safe relative path without empty, current-directory, parent-directory, backslash, drive, or absolute components. Implementation and hosting tables remain keyless and consume this selection rather than restating it.

The selected site root owns the implementation package manifest, implementation configuration, source entry, ordinary lifecycle scripts, generated output, and hosting configuration. The repository root package manifest owns the public `ki:site:*` aliases. The selection never permits filesystem reads outside the repository.

## 3. Build seam

The public `ki:site:*` alias has three auditable terminal forms: the exact selected-package command, one exact `self:site:<primary>:<verb>` hop to that command, or exact `turbo run <task>` delegation when root `turbo.json` declares the matching task (`build`, `ki:site:dev`, or `clean`). Turborepo adoption and task-graph quality remain owned by `ki-engineering`; this seam checks only that the named task exists and matches the public verb. Direct `--cwd` command chains, undeclared or mismatched tasks, additional shell commands, missing aliases, and cyclic forwarding remain invalid.

The selected implementation generates `dist/` at its site root: `apps/site/dist/` by default and `dist/` for an explicit flat repository. Generated output is ignored by Git and recreated by the build.

The repository root `package.json` exposes public aliases that delegate to the selected site package:

- `ki:site:build` — delegate to the selected package's `build` script and generate production `dist/`.
- `ki:site:dev` — delegate to the selected package's same `ki:site:dev` key; an explicit flat site root implements development directly because root and selected package are the same manifest.
- `ki:site:clean` — delegate to the selected package's `clean` script and remove generated output.

Those three aliases are the complete root capability-owned lifecycle seam. The selected implementation skill validates package-local `ki:site:dev`; content-specific `ki:site:dev:css` and `ki:site:dev:serve` remain inside that package and are not additional root claims.

The implementation skill verifies the selected package's command semantics. A hosting adapter consumes the selected root's `dist/` and must not infer the generator.

In multi-site mode the unqualified root `ki:site:*` aliases remain the public seam for the primary site. A public alias may contain its exact terminal command or exactly `bun run self:site:<primary>:<verb>` when that repository-owned script contains the exact terminal command. Missing, mismatched, chained, or cyclic forwarding fails. Named `self:site:<site>:<verb>` scripts for secondary sites remain optional repository-owned operations and do not expand the public seam.

## 4. Ownership

This core owns implementation selection, `site-root`, and the build-output/lifecycle seam only. It does not choose Eleventy, React, a CSS stack, a host, DNS provider, or server-side code.
