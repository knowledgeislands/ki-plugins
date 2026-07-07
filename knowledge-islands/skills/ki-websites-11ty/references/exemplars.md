# Eleventy Site Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns worth reading when authoring or auditing a Knowledge Islands Eleventy site. Use these as concrete references — what an `eleventy.config.ts` looks like with the required transforms wired, how the Tailwind entry point is structured, what the `package.json` script family looks like for a monorepo site, and how a `base.njk` layout composes its partials. Do not copy them wholesale; adapt to the specific site's content model, tokens, and nav shape. For the full standard, see [eleventy-site-standard.md](eleventy-site-standard.md); for source provenance, see [sources.md](sources.md).

## Collections

| Source                | URL                              | What it covers                                                           |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| Eleventy docs         | [11ty.dev docs][eleventy]        | Config API: `addTransform`, `addDataExtension`, `eleventy.before`, `dir` |
| Tailwind CSS v4 docs  | [tailwindcss.com docs][tailwind] | Config-less `@import "tailwindcss"`, `@theme inline`, the CLI            |
| Lucide docs           | [lucide.dev guide][lucide]       | UMD passthrough delivery, client-side `createIcons()` initialisation     |
| ki-website (in-house) | [ki-website repo][arcadia]       | Reference implementation: monorepo layout, config, Tailwind, wrangler    |

## Selected patterns

### `eleventy.config.ts` — the two required transforms and the Tailwind lifecycle hook

The config exports a default function. Two transforms are always present: `explicit-index-links` rewrites absolute internal `href`/`src` attributes to relative paths (making `dist/` portable — this is standard invariant 2), and `external-link-icons` appends a Lucide icon to prose external links. The `eleventy.before` hook compiles Tailwind with `--minify` on a one-shot build; in serve/watch mode the CLI runs in parallel and `addWatchTarget` reloads the browser when it writes a new CSS file (standard invariant 4). The `dir` block always emits to `../dist` so output lands at the repo root, not inside `site/`.

```typescript
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import type { UserConfig } from '@11ty/eleventy'
import JSON5 from 'json5'

export default function (eleventyConfig: UserConfig) {
  const outputRoot = resolve(process.cwd(), '../dist')

  const toRelativeOutputUrl = (url: string, outputPath: string): string => {
    if (!url.startsWith('/') || url.startsWith('//')) return url
    let normalized = url
    if (normalized === '/') normalized = '/index.html'
    else if (normalized.endsWith('/')) normalized = `${normalized}index.html`
    const fromDir = dirname(outputPath)
    const targetPath = resolve(outputRoot, `.${normalized}`)
    const rel = relative(fromDir, targetPath).split(sep).join('/')
    return rel || './'
  }

  eleventyConfig.addTransform('explicit-index-links', (content: string, outputPath: string | undefined) => {
    if (!outputPath?.endsWith('.html')) return content
    return content.replace(/(\s(?:href|src)=)(["'])([^"']+)(\2)/gi, (_match, prefix, quote, url) => {
      if (/^(?:https?:|mailto:|tel:|javascript:|data:|#)/i.test(url)) return `${prefix}${quote}${url}${quote}`
      return `${prefix}${quote}${toRelativeOutputUrl(url, outputPath)}${quote}`
    })
  })

  eleventyConfig.addTransform('external-link-icons', (content: string, outputPath: string | undefined) => {
    if (!outputPath?.endsWith('.html')) return content
    return content.replace(/<a\s+([^>]*href="https?:\/\/[^"]*"[^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs, inner) => {
      if (/data-lucide="external-link"/.test(inner)) return match
      return `<a ${attrs}>${inner}<i data-lucide="external-link" class="prose-ext-icon"></i></a>`
    })
  })

  eleventyConfig.addPassthroughCopy('src/assets/images')
  eleventyConfig.addPassthroughCopy('src/assets/js')
  eleventyConfig.addPassthroughCopy({
    '../node_modules/lucide/dist/umd/lucide.min.js': 'assets/js/lucide.min.js'
  })

  eleventyConfig.addDataExtension('ts', {
    read: false,
    parser: async (filePath: string) => {
      const mod = await import(filePath)
      return typeof mod.default === 'function' ? mod.default() : mod.default
    }
  })
  eleventyConfig.addDataExtension('json5', { read: false, parser: (filePath: string) => JSON5.parse(readFileSync(filePath, 'utf-8')) })

  eleventyConfig.on('eleventy.before', ({ runMode }: { runMode: string }) => {
    if (runMode !== 'serve' && runMode !== 'watch') {
      execSync('bunx tailwindcss -i src/assets/css/main.css -o ../dist/assets/css/main.css --minify', { stdio: 'inherit' })
    }
  })
  eleventyConfig.addWatchTarget('../dist/assets/css/main.css')

  return {
    dir: { input: 'src', output: '../dist', includes: '_includes', data: '_data' },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', 'html']
  }
}
```

### Tailwind v4 entry — `src/assets/css/main.css`

No `tailwind.config.*` file anywhere — Tailwind 4 is configured entirely in CSS (standard invariant 1). `main.css` is the entry point and an import chain: `@import "tailwindcss"` first, then `tokens.css`, then page/section partials. `tokens.css` defines the semantic design tokens as CSS custom properties; `@theme inline { … }` exposes them to Tailwind utilities so templates use token names, never hard-coded hex values. Note: `tailwindcss` must be listed as its own dependency (not just transitively via `@tailwindcss/cli`) so the `@import "tailwindcss"` resolves correctly from the monorepo workspace.

```css
/* main.css — Tailwind entry point.  No tailwind.config.* file. */
@import 'tailwindcss';
@import './tokens.css';

/* tokens.css defines custom properties; @theme inline exposes them as utilities. */
```

```css
/* tokens.css — semantic design tokens and @theme mapping */
@layer base {
  :root {
    --background: oklch(98% 0.01 90);
    --foreground: oklch(18% 0.02 230);
    --primary: oklch(42% 0.14 230);
    --muted: oklch(92% 0.01 90);
    --border: oklch(85% 0.02 230);
    --radius: 0.5rem;

    --font-body: 'Inter', sans-serif;
    --font-heading: 'Playfair Display', serif;
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --radius-default: var(--radius);
  --font-sans: var(--font-body);
  --font-serif: var(--font-heading);
}
```

### `package.json` — the site script family

Scripts for the `site/` workspace of a monorepo. All site scripts take the `site:` prefix. `ki:site:dev` uses `concurrently` to run the Tailwind `--watch` process (`ki:site:dev:css`) and the Eleventy dev server (`ki:site:dev:serve`) in parallel, named `css`,`11ty`. `ki:site:build` invokes the Eleventy CLI via `node --experimental-strip-types` (or plain `bun`) directly — the `eleventy.before` hook handles Tailwind minification inside the same process. `ki:site:deploy` and `ki:site:preview` are the hosting scripts (governed by `ki-hosting-cloudflare`); they appear here because they live in the same root `package.json` in the monorepo shape.

```json
{
  "scripts": {
    "ki:site:dev": "concurrently --names css,11ty --prefix-colors cyan,yellow \"bun run ki:site:dev:css\" \"bun run ki:site:dev:serve\"",
    "ki:site:dev:css": "cd site && bunx tailwindcss -i src/assets/css/main.css -o ../dist/assets/css/main.css --watch",
    "ki:site:dev:serve": "cd site && node --experimental-strip-types ../node_modules/@11ty/eleventy/cmd.cjs --config=eleventy.config.ts --serve --port 3000",
    "ki:site:build": "cd site && node --experimental-strip-types ../node_modules/@11ty/eleventy/cmd.cjs --config=eleventy.config.ts",
    "ki:site:clean": "rm -rf dist site/.wrangler",
    "ki:site:types": "bunx tsc --noEmit -p site",
    "ki:site:verify": "bun run ki:site:types && bun run ki:site:build",
    "ki:site:deploy": "cd site && bunx wrangler deploy",
    "ki:site:preview": "bun run ki:site:build && cd site && bunx wrangler dev"
  }
}
```

### Nunjucks base layout — `_includes/layouts/base.njk`

The `base.njk` layout is the `<html>` shell for every page. It includes `seo-meta.njk` (canonical + OG + Twitter tags) from `_includes/partials/`, loads the compiled `main.css`, pulls in font `<link>` tags, and initialises Lucide client-side with a `<script>` at the end of `<body>`. Page-specific layouts extend `base.njk` via `{% extends %}` or wrap it; prose pages set `layout: layouts/base.njk` in their cascade data file, never in individual front matter. The `content | safe` filter is the injection point for the page body.

```nunjucks
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {% include "partials/seo-meta.njk" %}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body style="min-height: 100vh; display: flex; flex-direction: column;">
  {% include "partials/nav.njk" %}
  <main style="flex: 1;">
    {{ content | safe }}
  </main>
  {% include "partials/footer.njk" %}
  <script src="/assets/js/lucide.min.js"></script>
  <script>lucide.createIcons()</script>
</body>
</html>
```

`seo-meta.njk` emits the canonical link plus OG and Twitter card tags from `site` global data and page front matter — included from `base.njk` so every page carries them automatically. Pages that should not be indexed set `noindex: true` in front matter; the partial emits `<meta name="robots" content="noindex, nofollow">` instead.

[eleventy]: https://www.11ty.dev/docs/
[tailwind]: https://tailwindcss.com/docs
[lucide]: https://lucide.dev/guide/
[arcadia]: https://github.com/knowledgeislands/ki-website
