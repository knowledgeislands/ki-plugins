# Mode AUDIT — check a site against the standard

_On-demand procedure for ki-repo-website-content's AUDIT mode. The hosted rubric inspects the site-build delta; separate skills and explicit build or hosting checks remain distinct._

1. **Run the common layer first.** Run `ki repo audit --repo <repo> --skill ki-engineering` for the shared toolchain rather than re-deriving it here.
2. **Run the website core and mechanical rubric.** Run `ki repo audit --repo <repo> --skill ki-repo-website`, then `ki repo audit --repo <repo> --skill ki-repo-website-content`. The content audit inspects the Eleventy dependency and configuration, config-less Tailwind entry, site source layout, script semantics, SEO partial, portable output seam, and its opt-in.
3. **Apply the judgment items.** Read the judgment criteria in [the rubric](rubric.md): verify that semantic tokens drive the palette, `_data` is the single source of structure, content uses Markdown and cascade data appropriately, SEO metadata is wired site-wide, and public sites ship their discovery assets.
4. **Check the generated boundary explicitly.** When the audited change removes or renames a route, run `ki:site:clean` immediately before the declared build: Eleventy does not remove obsolete output itself. Inspect representative HTML in `site/dist/` for portable relative links, confirm that the former route is absent, and confirm generated output is not hand-maintained. Otherwise, build the site through its declared script and inspect representative HTML in `site/dist/` for portable relative links. The hosted audit does not run the build.
5. **Name the hosting audit when applicable.** If the site is deployed to Cloudflare, run `ki repo audit --repo <repo> --skill ki-repo-website-cloudflare` separately.
6. **Report by location, criterion, and fix.** Group findings by FAIL, WARN, and POLISH and cite `file:line` where available. Record explicit build and hosting results separately from hosted rubric findings.
