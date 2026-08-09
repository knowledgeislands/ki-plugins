import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricPublicationContext, RubricSession } from '../types.ts'

const TEMPLATE_ID = /^[A-Z][A-Z0-9-]{1,23}-HK-\d{3,}$/
const CADENCE = /^P[1-9]\d*[DWM]$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const HORIZONS = new Set(['now', 'next', 'soon', 'future', 'waiting-for', 'parked'])
const REPO_CONFIG = 'ki-repo'
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export type HousekeepingRubricContext = {
  rubric: RubricPublicationContext
  templates: { outcomes: readonly AuditOutcome[] }
}

const file = (path: string): boolean =>
  existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink()
const directory = (path: string): boolean =>
  existsSync(path) && lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink()

const values = (content: string): Record<string, string> => {
  const block = content.match(/^---\n([\s\S]*?)\n---/)
  return Object.fromEntries(
    (block?.[1] ?? '').split('\n').flatMap((line) => {
      const match = line.match(/^([a-z-]+):\s*(.*?)\s*$/)
      return match ? [[match[1] as string, match[2] as string]] : []
    })
  )
}

const isKb = (root: string): boolean => {
  const config = join(root, '.ki-config.toml')
  if (!file(config)) return false
  try {
    const parsed = TOML.parse(readFileSync(config, 'utf8')) as Record<string, unknown>
    const skills = parsed.skills
    const table = skills && typeof skills === 'object' ? (skills as Record<string, unknown>)[REPO_CONFIG] : undefined
    return (
      typeof table === 'object' &&
      table !== null &&
      !Array.isArray(table) &&
      (table as Record<string, unknown>).repo_type === 'kb'
    )
  } catch {
    return false
  }
}

export const createHousekeepingSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<HousekeepingRubricContext> => {
  const root = resolve(repository)
  const templateRoot = isKb(root) ? join(root, 'Streams', 'Housekeeping') : join(root, 'docs', 'housekeeping')
  const relativeRoot = relative(root, templateRoot)
  const outcomes: AuditOutcome[] = []
  if (!directory(templateRoot)) {
    outcomes.push({
      status: 'NOT_APPLICABLE',
      message: 'No housekeeping template directory is present.',
      subject: relativeRoot
    })
  } else {
    const templates = readdirSync(templateRoot, { withFileTypes: true }).filter(
      (entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'Housekeeping.md'
    )
    if (!templates.length)
      outcomes.push({
        status: 'NOT_APPLICABLE',
        message: 'No housekeeping templates are present.',
        subject: relativeRoot
      })
    for (const entry of templates) {
      const path = join(templateRoot, entry.name)
      const subject = relative(root, path)
      const frontmatter = values(readFileSync(path, 'utf8'))
      const valid =
        file(path) &&
        Boolean(frontmatter.id && TEMPLATE_ID.test(frontmatter.id)) &&
        ['active', 'paused'].includes(frontmatter.status ?? '') &&
        Boolean(frontmatter.cadence && CADENCE.test(frontmatter.cadence)) &&
        Boolean(frontmatter.grace && CADENCE.test(frontmatter.grace)) &&
        (frontmatter['last-run'] === 'null' || Boolean(frontmatter['last-run'] && DATE.test(frontmatter['last-run'])))
      const spawn =
        HORIZONS.has(frontmatter['spawn-horizon'] ?? '') &&
        ['manual', 'when-due', 'when-overdue'].includes(frontmatter['spawn-policy'] ?? '')
      outcomes.push({
        status: valid && spawn ? 'PASS' : 'VIOLATION',
        message:
          valid && spawn
            ? 'Housekeeping template has valid identity and schedule fields.'
            : 'Housekeeping template has invalid identity, state, scheduling, or spawn fields.',
        subject
      })
    }
  }
  const context: HousekeepingRubricContext = { rubric: { publication }, templates: { outcomes } }
  return {
    subjects: [{ families: ['HOUSE'], context: () => context }],
    proposal: () => ({ writes: [] })
  }
}
