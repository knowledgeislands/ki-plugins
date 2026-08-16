import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { WebsiteAppContext } from '../contexts/website-app.ts'

const SOURCE = 'standards-app-site.md'
const remediation = {
  class: 'diagnostic' as const,
  guidance: 'Align the interactive app with the React/Vite implementation or select the content implementation instead.'
}
const inactive = (context: WebsiteAppContext): readonly AuditOutcome[] | null => (context.applicable ? null : [])
const item = (
  code: string,
  title: string,
  description: string,
  level: 'FAIL' | 'WARN',
  run: (context: WebsiteAppContext) => readonly AuditOutcome[]
): RubricItem<WebsiteAppContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: { level, remediation, audit: { phase: 'INSPECT', run } }
})
const check = (condition: boolean, pass: string, fail: string, subject?: string): readonly AuditOutcome[] => [
  { status: condition ? 'PASS' : 'VIOLATION', message: condition ? pass : fail, ...(subject ? { subject } : {}) }
]

const APP_1 = item(
  'APP-1',
  'React runtime',
  'React and React DOM are declared dependencies.',
  'FAIL',
  (context) =>
    inactive(context) ??
    check(
      Boolean(context.dependencies.react && context.dependencies['react-dom']),
      'React and React DOM are declared.',
      'React and/or React DOM is absent.',
      'package.json'
    )
)
const APP_2 = item(
  'APP-2',
  'Vite toolchain',
  'Vite and its official React plugin are declared.',
  'FAIL',
  (context) =>
    inactive(context) ??
    check(
      Boolean(context.dependencies.vite && context.dependencies['@vitejs/plugin-react']),
      'Vite and @vitejs/plugin-react are declared.',
      'Vite and/or @vitejs/plugin-react is absent.',
      'package.json'
    )
)
const APP_3 = item(
  'APP-3',
  'Single build system',
  'The app implementation does not also carry Eleventy.',
  'FAIL',
  (context) =>
    inactive(context) ??
    check(
      !context.hasEleventyConfig && !context.dependencies['@11ty/eleventy'],
      'No Eleventy build system is present.',
      'Eleventy is present beside the React/Vite app; select one website implementation.',
      'package.json'
    )
)
const APP_4 = item(
  'APP-4',
  'Vite configuration',
  'A Vite config is present at the site root.',
  'WARN',
  (context) =>
    inactive(context) ??
    check(
      Boolean(context.viteConfig),
      `Vite config is present at ${context.siteRoot ? `${context.siteRoot}/` : ''}${context.viteConfig}.`,
      'No Vite config was found.'
    )
)
const APP_5 = item(
  'APP-5',
  'Application entry',
  'index.html and a React main module are present.',
  'FAIL',
  (context) =>
    inactive(context) ?? [
      ...check(context.hasIndex, 'index.html is present.', 'index.html is absent.'),
      ...check(
        context.hasEntry,
        'A src/main.tsx or src/main.jsx entry is present.',
        'No src/main.tsx or src/main.jsx entry was found.'
      )
    ]
)
const APP_6 = item(
  'APP-6',
  'App build command',
  'ki:site:build runs vite build.',
  'FAIL',
  (context) =>
    inactive(context) ??
    check(
      /\bvite\s+build\b/.test(context.scripts['ki:site:build'] ?? ''),
      'ki:site:build runs vite build.',
      'ki:site:build does not run vite build.',
      'package.json'
    )
)
const APP_7 = item(
  'APP-7',
  'App development command',
  'ki:site:dev runs Vite.',
  'WARN',
  (context) =>
    inactive(context) ??
    check(
      /\bvite(?:\s|$)/.test(context.scripts['ki:site:dev'] ?? ''),
      'ki:site:dev runs Vite.',
      'ki:site:dev does not run Vite.',
      'package.json'
    )
)
const APP_8 = item('APP-8', 'Dist output', 'Vite emits the shared dist seam.', 'FAIL', (context) => {
  const stopped = inactive(context)
  if (stopped) return stopped
  const declared = context.viteConfigSource.match(/outDir\s*:\s*['"]([^'"]+)['"]/)
  return check(
    !declared || declared[1]?.replace(/^\.\//, '').replace(/\/$/, '') === 'dist',
    declared ? 'Vite build.outDir is dist.' : 'Vite uses its default dist output.',
    `Vite build.outDir is ${declared?.[1]}, not dist.`,
    context.viteConfig ?? undefined
  )
})
const APP_9 = item('APP-9', 'App opt-in', 'The app implementation table is present.', 'WARN', (context) => {
  if (!context.available) return [{ status: 'VIOLATION', message: 'Target directory is unavailable.' }]
  if (context.malformedConfiguration)
    return [{ status: 'VIOLATION', message: '.ki-config.toml is malformed or unsafe.', subject: '.ki-config.toml' }]
  return context.applicable
    ? [{ status: 'PASS', message: 'The [skills.ki-repo-website-app] table is present.', subject: '.ki-config.toml' }]
    : [{ status: 'NOT_APPLICABLE', message: 'The app implementation is not declared.' }]
})
const APP_10 = item(
  'APP-10',
  'App opt-in validation',
  'The app marker table is keyless.',
  'WARN',
  (context) =>
    inactive(context) ??
    (context.configurationKeys.length === 0
      ? [{ status: 'PASS', message: 'The app table is keyless.', subject: '.ki-config.toml' }]
      : context.configurationKeys.map((key) => ({
          status: 'VIOLATION' as const,
          message: `Unknown key under [skills.ki-repo-website-app]: ${key}.`,
          subject: '.ki-config.toml'
        })))
)

export const APP: RubricFamily<WebsiteAppContext, WebsiteAppContext> = {
  code: 'APP',
  title: 'Interactive website',
  description: 'React/Vite client application implementation.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [APP_1, APP_2, APP_3, APP_4, APP_5, APP_6, APP_7, APP_8, APP_9, APP_10]
}
