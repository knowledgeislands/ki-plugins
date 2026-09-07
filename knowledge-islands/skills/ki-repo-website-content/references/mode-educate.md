# Mode EDUCATE — scaffold a content site

Use keyless `[skills.ki-repo-website]` for the implicit `apps/site` default. Add `site-root` only for an explicit override; do not materialise defaults.

_On-demand procedure for `ki-repo-website-content`'s EDUCATE mode. It scaffolds the application source deliberately; hosted conform does not._

1. **Establish the repository shell.** Apply `ki-repo` and `ki-engineering` first so the repository has its governed root package, Bun workspace support, TypeScript checking, and canonical configuration.
2. **Select and create the site application workspace.** Use the implicit `apps/site` default, then start with `apps/site/eleventy.config.ts`, `apps/site/package.json`, `apps/site/tsconfig.json`, and the `apps/site/src/` layout from [the standard](standards-eleventy-site.md). Keep output at `apps/site/dist/`. Write `site-root` only when the repository has an explicit reason to select another safe repository-relative root; subsequent steps resolve `<site-root>` from the core table.
3. **Apply the content stack.** Add config-less Tailwind 4, the TypeScript and JSON5 data extensions, the portable URL transform, the Nunjucks layout/partial structure, and the script family illustrated by [the exemplars](exemplars.md). Adapt tokens, content, navigation, and metadata to the site's purpose.
4. **Declare governance.** Add keyless `[skills.ki-repo-website]` and `[skills.ki-repo-website-content]` tables to `.ki.toml` for the default layout; add `site-root` to the core table only for an override. Ignore `<site-root>/dist/`.
5. **Verify before handoff.** Run the `ki-engineering`, website-core, and website-content audits, then run the site's build. If Cloudflare will serve the output, apply `ki-repo-website-cloudflare` as a separate layer.
