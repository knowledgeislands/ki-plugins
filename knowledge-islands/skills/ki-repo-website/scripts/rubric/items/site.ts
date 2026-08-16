import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { WebsiteCoreContext } from '../contexts/website.ts'

const SOURCE = 'standards-website.md'
const remediation = {
  class: 'diagnostic' as const,
  guidance: 'Align the shared website declaration and lifecycle seam, then rerun the audit.'
}
const skip = (context: WebsiteCoreContext): readonly AuditOutcome[] | null => (context.applicable ? null : [])
const item = (
  code: string,
  title: string,
  description: string,
  level: 'FAIL' | 'WARN',
  run: (context: WebsiteCoreContext) => readonly AuditOutcome[]
): RubricItem<WebsiteCoreContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: { level, remediation, audit: { phase: 'INSPECT', run } }
})

const SITE_1 = item('SITE-1', 'Website opt-in', 'The neutral website table is present.', 'WARN', (context) => {
  if (!context.available) return [{ status: 'VIOLATION', message: 'Target directory is unavailable.' }]
  if (context.malformedConfiguration)
    return [{ status: 'VIOLATION', message: '.ki-config.toml is malformed or unsafe.', subject: '.ki-config.toml' }]
  return context.applicable
    ? [{ status: 'PASS', message: 'The [skills.ki-repo-website] table is present.', subject: '.ki-config.toml' }]
    : [{ status: 'NOT_APPLICABLE', message: 'The website core is not declared.' }]
})

const SITE_2 = item(
  'SITE-2',
  'Website opt-in validation',
  'The neutral marker table is keyless.',
  'WARN',
  (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    return context.configurationKeys.length === 0
      ? [{ status: 'PASS', message: 'The website core table is keyless.', subject: '.ki-config.toml' }]
      : context.configurationKeys.map((key) => ({
          status: 'VIOLATION' as const,
          message: `Unknown key under [skills.ki-repo-website]: ${key}.`,
          subject: '.ki-config.toml'
        }))
  }
)

const SITE_3 = item(
  'SITE-3',
  'Package manifest',
  'The root package manifest is safely parseable.',
  'FAIL',
  (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    return context.packageState === 'present'
      ? [{ status: 'PASS', message: 'package.json is safely parseable.', subject: 'package.json' }]
      : [{ status: 'VIOLATION', message: `package.json is ${context.packageState}.`, subject: 'package.json' }]
  }
)

const requiredScript = (code: string, key: string, purpose: string) =>
  item(code, key, `The root package exposes ${key}.`, 'WARN', (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    return context.scripts[key]?.trim()
      ? [{ status: 'PASS', message: `${key} is present for ${purpose}.`, subject: 'package.json' }]
      : [{ status: 'VIOLATION', message: `${key} is absent.`, subject: 'package.json' }]
  })

const SITE_7 = item(
  'SITE-7',
  'Generated output ignored',
  'The local dist output is ignored by Git.',
  'WARN',
  (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    const ignored = context.gitignore !== null && /^\s*\/?(?:site\/)?dist\/?\s*$/m.test(context.gitignore)
    return ignored
      ? [{ status: 'PASS', message: 'A local dist output is gitignored.', subject: '.gitignore' }]
      : [{ status: 'VIOLATION', message: 'Neither dist/ nor site/dist/ is gitignored.', subject: '.gitignore' }]
  }
)

export const SITE: RubricFamily<WebsiteCoreContext, WebsiteCoreContext> = {
  code: 'SITE',
  title: 'Website core',
  description: 'Generator-neutral selection, lifecycle, and dist seam.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [
    SITE_1,
    SITE_2,
    SITE_3,
    requiredScript('SITE-4', 'ki:site:build', 'production output'),
    requiredScript('SITE-5', 'ki:site:dev', 'local development'),
    requiredScript('SITE-6', 'ki:site:clean', 'generated-output cleanup'),
    SITE_7
  ]
}
