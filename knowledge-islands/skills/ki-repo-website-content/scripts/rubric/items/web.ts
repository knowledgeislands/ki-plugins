import type { AuditOutcome, RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import type { WebsiteContext } from '../contexts/website.ts'

const SOURCE = 'standards-eleventy-site.md'

const inactive = (context: WebsiteContext): readonly AuditOutcome[] | null =>
  !context.available
    ? [{ status: 'VIOLATION', message: `target path is not a physical directory: ${context.target}` }]
    : !context.applicable
      ? [
          {
            status: 'NOT_APPLICABLE',
            message:
              'ki-repo-website-content is not applicable: its repository declaration is absent. Detected Eleventy shape is handled by ki-repo coverage.'
          }
        ]
      : null

type MechanicalOptions = {
  overrideLevels?: readonly ViolationLevel[]
  conform?: (context: WebsiteContext) => void
}

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  audit: (context: WebsiteContext) => readonly AuditOutcome[],
  options: MechanicalOptions = {}
): RubricItem<WebsiteContext> => {
  const base = { code, title, description, sources: [SOURCE] as const }
  const shared = {
    level,
    ...(options.overrideLevels ? { overrideLevels: options.overrideLevels } : {}),
    audit: { phase: 'INSPECT' as const, run: audit }
  }
  return options.conform
    ? {
        ...base,
        mechanical: {
          ...shared,
          remediation: { class: 'automatic' },
          conform: { phase: 'NORMALISE', run: options.conform }
        }
      }
    : {
        ...base,
        mechanical: {
          ...shared,
          remediation: {
            class: 'diagnostic',
            guidance:
              'Inspect the affected website surface and apply the standard through a reviewable, site-owned change.'
          }
        }
      }
}

const judgment = (code: string, title: string, description: string, prompt: string): RubricItem<WebsiteContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  judgment: {
    scope: description,
    prompt,
    outcomes: ['conforming', 'revision required', 'design decision required'],
    guidance:
      'Revise the affected website surface to meet the standard, or record the owning design decision before accepting a deliberate exception.'
  }
})

const one = (condition: boolean, pass: string, violation: string, subject?: string): readonly AuditOutcome[] => [
  { status: condition ? 'PASS' : 'VIOLATION', message: condition ? pass : violation, ...(subject ? { subject } : {}) }
]

const configRule = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  pass: RegExp,
  passMessage: string,
  failMessage: string
): RubricItem<WebsiteContext> =>
  mechanical(
    code,
    title,
    description,
    level,
    (context) =>
      inactive(context) ??
      one(
        pass.test(context.config),
        passMessage,
        failMessage,
        context.cfgName ? context.siteAt(context.cfgName) : undefined
      )
  )

const script = (context: WebsiteContext, base: string): string | undefined =>
  context.scripts[`ki:site:${base}`] ?? context.scripts[`ki:${base}`] ?? context.scripts[base]

const WEB_1 = mechanical(
  'WEB-1',
  'Eleventy dependency',
  '`@11ty/eleventy` `^3.x` is a dependency.',
  'FAIL',
  (context) =>
    inactive(context) ??
    one(
      /^\^3\./.test(context.deps['@11ty/eleventy'] ?? ''),
      `@11ty/eleventy ${context.deps['@11ty/eleventy']}`,
      '@11ty/eleventy not a dependency',
      'package.json'
    )
)

const WEB_2 = mechanical(
  'WEB-2',
  'Eleventy rather than SPA stack',
  'Application-framework and React/Vite dependencies are absent.',
  'FAIL',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    const found = ['astro', 'next', 'react', 'react-dom', 'vite', '@vitejs/plugin-react'].filter(
      (name) => context.deps[name]
    )
    return found.length
      ? found.map((name) => ({
          status: 'VIOLATION' as const,
          message: `${name} present — this skill governs Eleventy sites, not ${name}`,
          subject: 'package.json'
        }))
      : [{ status: 'PASS', message: 'no application-framework or React/Vite dependency', subject: 'package.json' }]
  }
)

const WEB_3 = mechanical(
  'WEB-3',
  'Native TypeScript runner',
  'TypeScript runner is declared in package scripts as modern Node or Bun; the legacy `tsx` runner is absent. Runtime execution remains separate evidence.',
  'WARN',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    const usesTsx =
      context.deps.tsx !== undefined ||
      Object.values(context.scripts).some((value) => /tsx\/esm|--import\s+tsx/.test(value))
    const nativeRunner = Object.values(context.scripts).some((value) =>
      /\b(?:bun|node(?:\s+--experimental-strip-types)?)\b/.test(value)
    )
    return one(
      !usesTsx && nativeRunner,
      'package scripts declare a modern native TypeScript runner',
      usesTsx
        ? 'tsx detected (legacy TypeScript runner)'
        : 'no modern Bun or Node runner is declared in package scripts',
      'package.json'
    )
  }
)

const WEB_4 = judgment(
  'WEB-4',
  'Nunjucks template engine',
  'Nunjucks is the HTML and Markdown template engine; content is Markdown and template logic is Nunjucks.',
  'Does the configuration use Nunjucks and keep content and template logic in their intended forms?'
)

const WEB_5 = judgment(
  'WEB-5',
  'Lucide icon source',
  'Lucide is delivered by passthrough and initialized client-side.',
  'Is Lucide the icon source and is it wired through the intended passthrough/client pattern?'
)

const WEB_6 = mechanical(
  'WEB-6',
  'Site workspace configuration',
  'One Eleventy configuration lives under the `site/` workspace; a flat configuration is WARN.',
  'FAIL',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    if (!context.cfgName)
      return [{ status: 'VIOLATION', message: 'no physical eleventy.config.{ts,js,mjs,cjs} at repo root or site/' }]
    return context.siteRoot
      ? [{ status: 'PASS', message: `site/${context.cfgName} present`, subject: context.siteAt(context.cfgName) }]
      : [
          {
            status: 'VIOLATION',
            level: 'WARN',
            message: `${context.cfgName} is flat; the standard requires the site/ workspace`,
            subject: context.cfgName
          }
        ]
  }
)

const WEB_7 = mechanical(
  'WEB-7',
  'Roadmap',
  '`ROADMAP.md` is present.',
  'WARN',
  (context) => inactive(context) ?? one(context.has('ROADMAP.md'), 'ROADMAP.md present', 'no ROADMAP.md', 'ROADMAP.md')
)

const WEB_8 = judgment(
  'WEB-8',
  'Workspace declaration',
  'The root package manifest declares a workspace containing `site`.',
  'Does the root workspace declaration include `site`?'
)

const WEB_9 = mechanical(
  'WEB-9',
  'Source layout',
  '`src/` has `_data/`, `_includes/layouts/`, `_includes/partials/`, and `assets/css/`.',
  'FAIL',
  (context) =>
    inactive(context) ??
    ['_data', '_includes/layouts', '_includes/partials', 'assets/css'].map((path) => ({
      status: context.isDir(context.siteAt('src', ...path.split('/'))) ? ('PASS' as const) : ('VIOLATION' as const),
      message: context.isDir(context.siteAt('src', ...path.split('/')))
        ? `src/${path}/ present`
        : `src/${path}/ missing`,
      subject: context.siteAt('src', ...path.split('/'))
    }))
)

const WEB_10 = judgment(
  'WEB-10',
  'Site script prefix',
  'Every site script carries the `site:` prefix.',
  'Do site scripts carry the required `site:` prefix?'
)

const WEB_11 = judgment(
  'WEB-11',
  'Typed structure data',
  'Navigation and ordering live in a typed `_data/*.ts` source.',
  'Does typed `_data` own navigation and ordering rather than repeated template literals?'
)

const WEB_12 = configRule(
  'WEB-12',
  'Portable URL transform',
  'A transform rewrites absolute internal URLs to relative URLs.',
  'FAIL',
  /toRelativeOutputUrl|explicit-index-links|addTransform[\s\S]*\brelative\(/,
  'portable dist URL transform present',
  'no absolute-to-relative URL transform'
)

const WEB_13 = configRule(
  'WEB-13',
  'TypeScript data extension',
  "`addDataExtension('ts', …)` is registered.",
  'WARN',
  /addDataExtension\(\s*["']ts["']/,
  "addDataExtension('ts') registered",
  "no addDataExtension('ts')"
)

const WEB_14 = configRule(
  'WEB-14',
  'JSON5 data extension',
  "`addDataExtension('json5', …)` is registered.",
  'WARN',
  /addDataExtension\(\s*["']json5["']/,
  "addDataExtension('json5') registered",
  "no addDataExtension('json5')"
)

const WEB_15 = configRule(
  'WEB-15',
  'Tailwind lifecycle hook',
  '`eleventy.before` compiles Tailwind in build mode.',
  'WARN',
  /on\(\s*["']eleventy\.before["'][\s\S]*tailwindcss/,
  'Tailwind compiled through eleventy.before',
  'no eleventy.before hook invoking Tailwind'
)

const WEB_16 = configRule(
  'WEB-16',
  'CSS watch target',
  '`addWatchTarget` observes the compiled CSS.',
  'WARN',
  /addWatchTarget/,
  'addWatchTarget present',
  'no addWatchTarget for compiled CSS'
)

const WEB_17 = judgment(
  'WEB-17',
  'Configuration helpers',
  'Filters and ordered collections use the documented patterns where needed.',
  'Where the content needs them, do filters and ordered collections use the documented patterns?'
)

const WEB_18 = mechanical('WEB-18', 'Config-less Tailwind', 'No `tailwind.config.*` exists.', 'FAIL', (context) => {
  const stop = inactive(context)
  if (stop) return stop
  const files = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs', 'tailwind.config.mjs'].filter(
    (file) => context.has(file) || Boolean(context.siteRoot && context.has(context.siteRoot, file))
  )
  return one(files.length === 0, 'no tailwind.config.*', `config-less Tailwind expected; found ${files.join(', ')}`)
})

const WEB_19 = mechanical(
  'WEB-19',
  'Tailwind import pair',
  '`main.css` imports `tailwindcss`, then `tokens.css`.',
  'WARN',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    const path = context.siteAt('src', 'assets', 'css', 'main.css')
    const css = context.read(path)
    if (!css) return [{ status: 'VIOLATION', level: 'FAIL', message: 'main.css missing', subject: path }]
    return [
      {
        status: /@import\s+["']tailwindcss["']/.test(css) ? 'PASS' : 'VIOLATION',
        message: /@import\s+["']tailwindcss["']/.test(css)
          ? 'main.css imports tailwindcss'
          : 'main.css does not import tailwindcss',
        subject: path
      },
      {
        status: /@import\s+["']\.\/tokens\.css["']/.test(css) ? 'PASS' : 'VIOLATION',
        message: /@import\s+["']\.\/tokens\.css["']/.test(css)
          ? 'main.css imports tokens.css'
          : 'main.css does not import tokens.css',
        subject: path
      }
    ]
  },
  { overrideLevels: ['FAIL'] }
)

const WEB_20 = mechanical(
  'WEB-20',
  'Token utility exposure',
  '`tokens.css` exposes variables through `@theme inline`.',
  'WARN',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    const path = context.siteAt('src', 'assets', 'css', 'tokens.css')
    const css = context.read(path)
    return one(
      /@theme\s+inline/.test(css),
      'tokens.css exposes variables through @theme inline',
      css ? 'tokens.css has no @theme inline' : 'tokens.css missing',
      path
    )
  }
)

const WEB_21 = judgment(
  'WEB-21',
  'Semantic design tokens',
  'Semantic palette and self-hosted fonts follow the standard.',
  'Do semantic tokens and self-hosted fonts follow the standard rather than embedding arbitrary presentation values?'
)

const WEB_22 = judgment(
  'WEB-22',
  'Template token use',
  'Templates consume semantic tokens without hard-coded hex values.',
  'Do templates consume semantic tokens without hard-coded hex colours?'
)

const WEB_23 = judgment(
  'WEB-23',
  'Markdown content',
  'Pages are Markdown with YAML front matter and sensible content folders.',
  'Are pages Markdown with YAML front matter and grouped into sensible content folders?'
)

const WEB_24 = judgment(
  'WEB-24',
  'Folder data cascade',
  'Cascade files own repeated folder-level front matter.',
  'Do cascade data files own repeated folder-level front matter?'
)

const WEB_25 = judgment(
  'WEB-25',
  'JSON5 validation',
  'Structured JSON5 is validated during the build.',
  'Where structured JSON5 exists, is it validated during the build and does invalid data stop the build?'
)

const WEB_26 = mechanical(
  'WEB-26',
  'SEO metadata partial',
  'A `seo-meta` partial exists under `_includes/partials/`.',
  'WARN',
  (context) =>
    inactive(context) ??
    one(
      context.seoMeta,
      'seo-meta partial present',
      'no seo-meta partial under _includes/partials/',
      context.siteAt('src', '_includes', 'partials')
    )
)

const WEB_27 = judgment(
  'WEB-27',
  'Site-wide SEO metadata',
  '`base.njk` includes the SEO partial.',
  'Does base.njk include seo-meta so all pages receive canonical, Open Graph, and Twitter metadata?'
)

const WEB_28 = judgment(
  'WEB-28',
  'Noindex metadata',
  '`noindex` front matter emits robots metadata.',
  'Does noindex front matter emit robots metadata on intentionally non-indexed pages?'
)

const WEB_29 = judgment(
  'WEB-29',
  'Public site discovery assets',
  'Public sites ship scoped discovery and application assets.',
  'Where the site is public, does it ship and scope the required discovery and application assets?'
)

const WEB_30 = mechanical(
  'WEB-30',
  'Site build and development scripts',
  'Build invokes Eleventy and development uses `concurrently`.',
  'WARN',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    const build = script(context, 'build')
    const development = script(context, 'dev')
    return [
      build && /eleventy/.test(build)
        ? { status: 'PASS', message: 'build script invokes Eleventy', subject: 'package.json' }
        : {
            status: 'VIOLATION',
            level: 'FAIL',
            message: 'no build script invoking Eleventy',
            subject: 'package.json'
          },
      development && /concurrently/.test(development)
        ? { status: 'PASS', message: 'development script uses concurrently', subject: 'package.json' }
        : { status: 'VIOLATION', message: 'no concurrently development script', subject: 'package.json' }
    ]
  },
  { overrideLevels: ['FAIL'] }
)

const WEB_31 = mechanical(
  'WEB-31',
  'Development script fan-out',
  'The development script fans out to CSS watch and Eleventy serve scripts.',
  'WARN',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    const development = script(context, 'dev')
    return development && /concurrently/.test(development)
      ? ['dev:css', 'dev:serve'].map((part) => ({
          status: script(context, part) ? ('PASS' as const) : ('VIOLATION' as const),
          message: script(context, part) ? `ki:site:${part} present` : `ki:site:${part} missing`,
          subject: 'package.json'
        }))
      : [{ status: 'NOT_APPLICABLE', message: 'development script has no concurrently fan-out' }]
  }
)

const WEB_32 = mechanical(
  'WEB-32',
  'Site cleanup script',
  '`ki:site:clean` is present.',
  'WARN',
  (context) =>
    inactive(context) ??
    one(Boolean(script(context, 'clean')), 'clean script present', 'no ki:site:clean script', 'package.json')
)

const WEB_33 = mechanical(
  'WEB-33',
  'Dist ignore',
  'Generated site output is gitignored at the correct workspace path.',
  'FAIL',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    const text = context.read('.gitignore')
    const correct = context.siteRoot ? /^\s*\/?site\/dist\/?\s*$/m.test(text) : /^\s*\/?dist\/?\s*$/m.test(text)
    const misplaced = context.siteRoot && /^\s*\/dist\/?\s*$/m.test(text)
    if (correct)
      return [
        {
          status: 'PASS',
          message: `${context.siteRoot ? 'site/dist/' : 'dist/'} is correctly gitignored`,
          subject: '.gitignore'
        }
      ]
    return [
      {
        status: 'VIOLATION',
        ...(misplaced ? { level: 'FAIL' as const } : {}),
        message: misplaced
          ? 'gitignore has root /dist but the site workspace emits site/dist/'
          : `${context.siteRoot ? 'site/dist/' : 'dist/'} is not gitignored`,
        subject: '.gitignore'
      }
    ]
  },
  { conform: (context) => context.addDistIgnore?.() }
)

const WEB_34 = judgment(
  'WEB-34',
  'Portable generated links',
  'Built HTML contains portable relative internal links.',
  'Does the built HTML actually contain portable relative internal links?'
)

const WEB_35 = judgment(
  'WEB-35',
  'Generated dist boundary',
  '`dist/` is fully generated and never hand-edited.',
  'Is dist treated as fully generated build output and never hand-edited?'
)

const WEB_36 = judgment(
  'WEB-36',
  'Hosting seam handoff',
  'The exact site/dist output is consumed by the separately selected Cloudflare projection without claiming deployment or runtime success.',
  'Does the selected hosting projection consume site/dist, with parsed configuration and runtime/deployment evidence kept separate?'
)

const WEB_37 = judgment(
  'WEB-37',
  'Volatile facts have one home',
  'Volatile versions and idioms have one canonical home.',
  'Do volatile facts live in package metadata or the standard rather than being scattered through implementation?'
)

const WEB_38 = judgment(
  'WEB-38',
  'Current standard',
  'Mode REFRESH has recently confirmed the cited sources.',
  'Has Mode REFRESH confirmed the cited sources and updated the review record recently enough?'
)

const WEB_39 = mechanical(
  'WEB-39',
  'Parseable package manifest',
  '`package.json` is physical and parseable.',
  'FAIL',
  (context) =>
    inactive(context) ??
    one(
      context.packageOk,
      'package.json present and parseable',
      'package.json missing, unsafe, or unparseable',
      'package.json'
    )
)

const WEB_40 = mechanical(
  'WEB-40',
  'Tailwind CLI dependency',
  '`@tailwindcss/cli` is a dependency.',
  'WARN',
  (context) =>
    inactive(context) ??
    one(
      Boolean(context.deps['@tailwindcss/cli']),
      `@tailwindcss/cli ${context.deps['@tailwindcss/cli']}`,
      '@tailwindcss/cli not a dependency',
      'package.json'
    )
)

const WEB_41 = mechanical(
  'WEB-41',
  'Website opt-in',
  'Applicable sites declare `[skills.ki-repo-website-content]`.',
  'WARN',
  (context) =>
    inactive(context) ??
    one(
      Boolean(context.kiWebsiteTable),
      '[skills.ki-repo-website-content] table present',
      'no [skills.ki-repo-website-content] table in .ki-config.toml',
      '.ki-config.toml'
    )
)

const WEB_42 = mechanical(
  'WEB-42',
  'Website opt-in validation',
  'The marker table has no unknown keys.',
  'WARN',
  (context) => {
    const stop = inactive(context)
    if (stop) return stop
    if (!context.kiWebsiteTable)
      return [{ status: 'NOT_APPLICABLE', message: '[skills.ki-repo-website-content] table is absent' }]
    const keys = Object.keys(context.kiWebsiteTable)
    return keys.length
      ? keys.map((key) => ({
          status: 'VIOLATION' as const,
          message: `unknown key under [skills.ki-repo-website-content]: ${key}`,
          subject: '.ki-config.toml'
        }))
      : [
          {
            status: 'PASS',
            message: '[skills.ki-repo-website-content] contains no unknown keys',
            subject: '.ki-config.toml'
          }
        ]
  }
)

export const WEB: RubricFamily<WebsiteContext, WebsiteContext> = {
  code: 'WEB',
  title: 'Eleventy website standard',
  description: 'The static-site stack, workspace layout, generated output, and sustainable operating boundary.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [
    WEB_1,
    WEB_2,
    WEB_3,
    WEB_4,
    WEB_5,
    WEB_6,
    WEB_7,
    WEB_8,
    WEB_9,
    WEB_10,
    WEB_11,
    WEB_12,
    WEB_13,
    WEB_14,
    WEB_15,
    WEB_16,
    WEB_17,
    WEB_18,
    WEB_19,
    WEB_20,
    WEB_21,
    WEB_22,
    WEB_23,
    WEB_24,
    WEB_25,
    WEB_26,
    WEB_27,
    WEB_28,
    WEB_29,
    WEB_30,
    WEB_31,
    WEB_32,
    WEB_33,
    WEB_34,
    WEB_35,
    WEB_36,
    WEB_37,
    WEB_38,
    WEB_39,
    WEB_40,
    WEB_41,
    WEB_42
  ]
}
