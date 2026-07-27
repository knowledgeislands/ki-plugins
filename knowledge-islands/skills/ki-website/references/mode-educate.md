# Mode EDUCATE — scaffold a new site

_On-demand procedure for ki-website's EDUCATE mode. Scaffolding creates application source and therefore remains deliberate authoring rather than a hosted rubric repair._

1. **Establish the repository and toolchain layers.** Use `ki-repo` for the repository shell and `ki-engineering` for the Bun workspace and TypeScript toolchain.
2. **Create the `site/` workspace.** Start with `site/eleventy.config.ts`, `site/package.json`, `site/tsconfig.json`, and the `site/src/` layout from [the standard](standards-eleventy-site.md). Keep output at `site/dist/`.
3. **Author the four invariants from day one.** Use config-less Tailwind 4, emit portable relative links, run TypeScript natively, and compile Tailwind inside the Eleventy lifecycle. Adapt the concrete shapes in [the exemplars](exemplars.md) to the site's content, palette, and navigation.
4. **Declare governance.** Add the keyless `[ki-website]` table to `.ki-config.toml` and ignore `site/dist/`.
5. **Verify before handoff.** Run `ki repo audit --repo <repo> --skill ki-engineering`, `ki repo audit --repo <repo> --skill ki-website`, and the site's build. If Cloudflare will serve the output, use `ki-website-cloudflare` separately for that layer.
