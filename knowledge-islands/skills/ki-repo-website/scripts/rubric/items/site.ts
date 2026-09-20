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

const SITE_1 = item('SITE-1', 'Website opt-in', 'A generator-neutral website table is present.', 'WARN', (context) => {
  if (!context.available) return [{ status: 'VIOLATION', message: 'Target directory is unavailable.' }]
  if (context.malformedConfiguration)
    return [{ status: 'VIOLATION', message: '.ki.toml is malformed or unsafe.', subject: '.ki.toml' }]
  return context.applicable
    ? [{ status: 'PASS', message: '[skills.ki-repo-website] table is present.', subject: '.ki.toml' }]
    : [{ status: 'NOT_APPLICABLE', message: 'Generator-neutral website core is not declared.' }]
})

const SITE_2 = item(
  'SITE-2',
  'Website configuration',
  'The website table declares one valid single-site selection or one valid named multi-site registry.',
  'WARN',
  (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    if (context.configurationViolations.length > 0)
      return context.primary
        ? context.configurationViolations.map((message) => ({
            status: 'VIOLATION' as const,
            message,
            subject: '.ki.toml'
          }))
        : []
    return [
      {
        status: 'PASS',
        message: `${context.siteName ? `Site ${context.siteName}` : 'The website'} resolves to ${context.siteRoot}.`,
        subject: '.ki.toml'
      }
    ]
  }
)

const SITE_3 = item(
  'SITE-3',
  'Package manifests',
  'The root and each selected site package manifest are safely parseable.',
  'FAIL',
  (context) => {
    const stopped = skip(context)
    if (stopped) return stopped
    const invalid = skipInvalidRoot(context)
    if (invalid) return invalid
    const manifests = [
      ...(context.primary ? [{ path: 'package.json', state: context.packageState }] : []),
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

const expectedTerminal = (context: WebsiteCoreContext, verb: 'build' | 'dev' | 'clean'): string => {
  const local = verb === 'dev' ? 'ki:site:dev' : verb
  return `bun run --cwd ${context.siteRoot} ${local}`
}

const publicCommandValid = (context: WebsiteCoreContext, verb: 'build' | 'dev' | 'clean'): boolean => {
  const publicKey = `ki:site:${verb}`
  const command = context.scripts[publicKey]?.trim()
  if (!command) return false
  if (context.siteRoot === '.') return true
  const terminal = expectedTerminal(context, verb)
  if (command === terminal) return true
  if (context.selectionMode !== 'multi' || !context.siteName) return false
  const aliasKey = `self:site:${context.siteName}:${verb}`
  return command === `bun run ${aliasKey}` && context.scripts[aliasKey]?.trim() === terminal
}

const lifecycleScript = (code: string, verb: 'build' | 'dev' | 'clean', purpose: string) =>
  item(
    code,
    `ki:site:${verb}`,
    `Each site owns its local ${verb} command and the primary site owns the public seam.`,
    'WARN',
    (context) => {
      const stopped = skip(context)
      if (stopped) return stopped
      const invalid = skipInvalidRoot(context)
      if (invalid) return invalid
      const localKey = verb === 'dev' ? 'ki:site:dev' : verb
      const local =
        context.siteRoot === '.' ? context.scripts[`ki:site:${verb}`]?.trim() : context.siteScripts[localKey]?.trim()
      const outcomes: AuditOutcome[] = [
        local
          ? {
              status: 'PASS',
              message: `${context.siteName ?? context.siteRoot} package-local ${localKey} is present for ${purpose}.`,
              subject: context.sitePackagePath
            }
          : {
              status: 'VIOLATION',
              message: `${context.siteName ?? context.siteRoot} package-local ${localKey} is absent.`,
              subject: context.sitePackagePath
            }
      ]
      if (!context.primary) return outcomes
      outcomes.push(
        publicCommandValid(context, verb)
          ? {
              status: 'PASS',
              message: `ki:site:${verb} resolves to the primary site terminal command.`,
              subject: 'package.json'
            }
          : {
              status: 'VIOLATION',
              message: `ki:site:${verb} must be the exact primary terminal command or one exact self:site alias hop.`,
              subject: 'package.json'
            }
      )
      return outcomes
    }
  )

const SITE_7 = item(
  'SITE-7',
  'Generated output ignored',
  'Every selected site dist output is ignored by Git.',
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
    lifecycleScript('SITE-4', 'build', 'production output'),
    lifecycleScript('SITE-5', 'dev', 'local development'),
    lifecycleScript('SITE-6', 'clean', 'generated-output cleanup'),
    SITE_7
  ]
}
