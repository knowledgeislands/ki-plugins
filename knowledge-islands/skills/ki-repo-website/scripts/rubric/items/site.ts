import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { WebsiteCoreContext } from '../contexts/website.ts'

const SOURCE = 'standards-website.md'
const remediation = {
  class: 'diagnostic' as const,
  guidance: 'Align the shared website declaration and lifecycle seam, then rerun the audit.'
}
const skip = (context: WebsiteCoreContext): readonly AuditOutcome[] | null => (context.applicable ? null : [])
const skipInvalidRoot = (context: WebsiteCoreContext): readonly AuditOutcome[] | null =>
  context.siteRootValid ? null : []
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
    return [{ status: 'VIOLATION', message: '.ki.toml is malformed or unsafe.', subject: '.ki.toml' }]
  return context.applicable
    ? [{ status: 'PASS', message: 'The [skills.ki-repo-website] table is present.', subject: '.ki.toml' }]
    : [{ status: 'NOT_APPLICABLE', message: 'The website core is not declared.' }]
})

const SITE_2 = item(
  'SITE-2',
  'Website configuration',
  'The website table relies on the implicit apps/site default or contains only a safe site-root override.',
  'WARN',
  (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    const unknown = context.configurationKeys.filter((key) => key !== 'site-root')
    const redundantDefault = context.siteRootValid && context.siteRootConfigured && context.siteRoot === 'apps/site'
    return unknown.length === 0 && context.siteRootValid && !redundantDefault
      ? [
          {
            status: 'PASS',
            message: `The website site root resolves to ${context.siteRoot}.`,
            subject: '.ki.toml'
          }
        ]
      : [
          ...(context.siteRootValid
            ? []
            : [
                {
                  status: 'VIOLATION' as const,
                  message: 'site-root must be "." or a canonical safe relative path.',
                  subject: '.ki.toml'
                }
              ]),
          ...(redundantDefault
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: 'site-root = "apps/site" restates the implicit default; remove the key.',
                  subject: '.ki.toml'
                }
              ]
            : []),
          ...unknown.map((key) => ({
            status: 'VIOLATION' as const,
            message: `Unknown key under [skills.ki-repo-website]: ${key}.`,
            subject: '.ki.toml'
          }))
        ]
  }
)

const SITE_3 = item(
  'SITE-3',
  'Package manifests',
  'The root and selected site package manifests are safely parseable.',
  'FAIL',
  (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    const invalid = skipInvalidRoot(context)
    if (invalid) return invalid
    const manifests = [
      { path: 'package.json', state: context.packageState },
      ...(context.sitePackagePath === 'package.json'
        ? []
        : [{ path: context.sitePackagePath, state: context.sitePackageState }])
    ]
    return manifests.map(({ path, state }) =>
      state === 'present'
        ? { status: 'PASS' as const, message: `${path} is safely parseable.`, subject: path }
        : { status: 'VIOLATION' as const, message: `${path} is ${state}.`, subject: path }
    )
  }
)

const requiredScript = (code: string, key: string, purpose: string) =>
  item(code, key, `The root package exposes ${key}.`, 'WARN', (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    const invalid = skipInvalidRoot(context)
    if (invalid) return invalid
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
    const invalid = skipInvalidRoot(context)
    if (invalid) return invalid
    const ignored =
      context.gitignore?.split(/\r?\n/).some((line) => {
        const rule = line.trim().replace(/^\//, '')
        return (
          rule === 'dist/' || rule === 'dist' || rule === context.distPath || rule === context.distPath.slice(0, -1)
        )
      }) ?? false
    return ignored
      ? [{ status: 'PASS', message: `${context.distPath} is gitignored.`, subject: '.gitignore' }]
      : [{ status: 'VIOLATION', message: `${context.distPath} is not gitignored.`, subject: '.gitignore' }]
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
