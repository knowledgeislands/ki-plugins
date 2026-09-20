import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricPublicationContext, RubricSession } from '../types.ts'
import { evaluateHousekeepingSchedule, FULL_COMMIT_REF, type HousekeepingSchedule } from './schedule.ts'

const TEMPLATE_ID = /^[A-Z][A-Z0-9-]{1,23}-HK-\d{3,}$/
const RUN_ID = /^[A-Z][A-Z0-9-]{1,31}-\d{3,}$/
const CADENCE = /^P[1-9]\d*[DWM]$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const HORIZONS = new Set(['now', 'next', 'soon', 'future', 'waiting-for', 'parked'])
const RUN_STATES = new Set(['draft', 'ready', 'in-progress', 'awaiting-review'])
const REPO_CONFIG = 'ki-repo'
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export type HousekeepingRubricContext = {
  rubric: RubricPublicationContext
  templates: { outcomes: readonly AuditOutcome[]; schedules: readonly AuditOutcome[] }
}

type Frontmatter = { values: Readonly<Record<string, string>>; body: string; errors: readonly string[] }
type Template = {
  id: string
  activeRun: string | null
  subject: string
  errors: string[]
  values: Readonly<Record<string, string>>
}
type Run = { id: string; status: string; housekeepingTemplate: string; scheduledFor: string }

const file = (path: string): boolean => {
  try {
    const stat = lstatSync(path)
    return stat.isFile() && !stat.isSymbolicLink()
  } catch {
    return false
  }
}

const directory = (path: string): boolean => {
  try {
    const stat = lstatSync(path)
    return stat.isDirectory() && !stat.isSymbolicLink()
  } catch {
    return false
  }
}

const frontmatter = (content: string): Frontmatter => {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(content)
  if (!match) return { values: {}, body: content, errors: ['must begin with a complete YAML frontmatter block'] }
  const values: Record<string, string> = {}
  const errors: string[] = []
  for (const line of (match[1] ?? '').split('\n')) {
    const field = /^([a-z][a-z0-9_-]*):\s*(.*?)\s*$/.exec(line)
    if (!field?.[2]) {
      errors.push(`has an invalid frontmatter line: ${line || '(blank)'}`)
      continue
    }
    const key = field[1] as string
    if (key in values) errors.push(`repeats frontmatter field '${key}'`)
    else values[key] = field[2] as string
  }
  return { values, body: match[2] ?? '', errors }
}

const validDate = (value: string): boolean => {
  if (!DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

const hasBodySection = (body: string, heading: string): boolean => {
  const section = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))`, 'm').exec(body)
  return Boolean(section?.[1].trim())
}

const isKb = (root: string): boolean => {
  const config = join(root, '.ki.toml')
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

const runIndex = (root: string, kb: boolean): ReadonlyMap<string, Run[]> => {
  const roadmap = kb ? join(root, 'Streams', 'Roadmap') : join(root, 'docs', 'roadmap')
  if (!directory(roadmap)) return new Map()
  const runs = new Map<string, Run[]>()
  for (const entry of readdirSync(roadmap, { withFileTypes: true })) {
    const path = join(roadmap, entry.name)
    if (!entry.name.endsWith('.md') || !file(path)) continue
    const parsed = frontmatter(readFileSync(path, 'utf8')).values
    const id = parsed.id
    if (!id) continue
    const run: Run = {
      id,
      status: parsed.status ?? '',
      housekeepingTemplate: parsed.housekeeping_template ?? '',
      scheduledFor: parsed.scheduled_for ?? ''
    }
    runs.set(id, [...(runs.get(id) ?? []), run])
  }
  return runs
}

const templateErrors = ({
  path,
  kb,
  parsed,
  today
}: {
  path: string
  kb: boolean
  parsed: Frontmatter
  today: string
}): string[] => {
  const errors = [...parsed.errors]
  const expected = new Set([
    'id',
    'title',
    ...(kb ? ['type'] : []),
    'status',
    'cadence',
    'last-run',
    'grace',
    'spawn-policy',
    'spawn-horizon',
    'active-run'
  ])
  for (const key of expected) if (!(key in parsed.values)) errors.push(`is missing frontmatter field '${key}'`)
  const allowed = new Set([...expected, 'commit-threshold', 'last-run-ref'])
  const unexpected = Object.keys(parsed.values).filter((key) => !allowed.has(key))
  if (unexpected.length) errors.push(`has unexpected frontmatter field(s): ${unexpected.join(', ')}`)

  const id = parsed.values.id
  if (!id || !TEMPLATE_ID.test(id)) errors.push('has an invalid housekeeping template id')
  if (!parsed.values.title?.trim()) errors.push('has an empty title')
  if (kb && parsed.values.type !== 'stream-housekeeping') errors.push("must declare type 'stream-housekeeping'")
  if (!kb && (!id || !new RegExp(`^${id}-[a-z0-9]+(?:-[a-z0-9]+)*\\.md$`).test(basename(path))))
    errors.push('filename must repeat the template id followed by a lowercase kebab-case slug')
  if (kb && !/^(?:[A-Z][A-Za-z0-9 -]* )?Housekeeping\.md$/.test(basename(path)))
    errors.push("KB template filename must follow the '<Name> Housekeeping.md' note convention")
  if (!['active', 'paused'].includes(parsed.values.status ?? '')) errors.push("status must be 'active' or 'paused'")
  if (!CADENCE.test(parsed.values.cadence ?? '')) errors.push('cadence must be a positive one-unit ISO-8601 duration')
  if (!CADENCE.test(parsed.values.grace ?? '')) errors.push('grace must be a positive one-unit ISO-8601 duration')
  if (parsed.values['last-run'] !== 'null' && !validDate(parsed.values['last-run'] ?? ''))
    errors.push("last-run must be 'null' or a valid ISO date")
  if (validDate(parsed.values['last-run'] ?? '') && (parsed.values['last-run'] as string) > today)
    errors.push('last-run cannot claim a successful review after the evaluation date')
  const threshold = parsed.values['commit-threshold']
  if (threshold !== undefined && (!/^[1-9]\d*$/.test(threshold) || !Number.isSafeInteger(Number(threshold))))
    errors.push('commit-threshold must be a positive safe integer')
  const anchor = parsed.values['last-run-ref']
  if (anchor !== undefined && anchor !== 'null' && !FULL_COMMIT_REF.test(anchor))
    errors.push("last-run-ref must be 'null' or a full lowercase commit identity")
  if (anchor !== undefined && anchor !== 'null' && parsed.values['last-run'] === 'null')
    errors.push('last-run-ref requires successful last-run date evidence')
  if (!['manual', 'when-due', 'when-overdue'].includes(parsed.values['spawn-policy'] ?? ''))
    errors.push('has an invalid spawn-policy')
  if (!HORIZONS.has(parsed.values['spawn-horizon'] ?? '')) errors.push('has an invalid spawn-horizon')
  if (parsed.values['active-run'] !== 'null' && !RUN_ID.test(parsed.values['active-run'] ?? ''))
    errors.push("active-run must be 'null' or a work-record identity")
  for (const heading of ['Goal', 'Procedure', 'Successful-run evidence', 'Obsolescence'])
    if (!hasBodySection(parsed.body, heading)) errors.push(`requires a non-empty '${heading}' body section`)
  return errors
}

export const createHousekeepingSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<HousekeepingRubricContext> => {
  const root = resolve(repository)
  const today = new Date().toISOString().slice(0, 10)
  const kb = isKb(root)
  const templateRoot = kb ? join(root, 'Streams', 'Housekeeping') : join(root, 'docs', 'housekeeping')
  const relativeRoot = relative(root, templateRoot)
  const outcomes: AuditOutcome[] = []
  const schedules: AuditOutcome[] = []
  if (!directory(templateRoot)) {
    outcomes.push({
      status: 'NOT_APPLICABLE',
      message: 'No housekeeping template directory is present.',
      subject: relativeRoot
    })
  } else {
    const templates: Template[] = []
    for (const entry of readdirSync(templateRoot, { withFileTypes: true })) {
      const path = join(templateRoot, entry.name)
      const subject = relative(root, path)
      if (kb && entry.name === 'Housekeeping.md' && file(path)) continue
      if (!entry.name.endsWith('.md') || !file(path)) {
        outcomes.push({
          status: 'VIOLATION',
          message: 'Housekeeping template root contains an unsafe or unexpected entry.',
          subject
        })
        continue
      }
      const parsed = frontmatter(readFileSync(path, 'utf8'))
      templates.push({
        id: parsed.values.id ?? '',
        activeRun: parsed.values['active-run'] === 'null' ? null : (parsed.values['active-run'] ?? null),
        subject,
        values: parsed.values,
        errors: templateErrors({ path, kb, parsed, today })
      })
    }
    if (!templates.length && !outcomes.length)
      outcomes.push({
        status: 'NOT_APPLICABLE',
        message: 'No housekeeping templates are present.',
        subject: relativeRoot
      })

    const runs = runIndex(root, kb)
    const activeOwners = new Map<string, Template[]>()
    for (const template of templates)
      if (template.activeRun)
        activeOwners.set(template.activeRun, [...(activeOwners.get(template.activeRun) ?? []), template])
    for (const template of templates) {
      if (!template.activeRun) continue
      const linked = runs.get(template.activeRun) ?? []
      if (linked.length !== 1) template.errors.push('active-run must resolve to exactly one linked roadmap record')
      else {
        const run = linked[0] as Run
        if (!RUN_STATES.has(run.status))
          template.errors.push('active-run must reference an unfinished lifecycle record')
        if (run.housekeepingTemplate !== template.id)
          template.errors.push('linked run must name this template in housekeeping_template')
        if (!validDate(run.scheduledFor)) template.errors.push('linked run must carry a valid scheduled_for date')
      }
      if ((activeOwners.get(template.activeRun)?.length ?? 0) > 1)
        template.errors.push('active-run cannot be linked by more than one housekeeping template')
    }
    for (const template of templates) {
      outcomes.push({
        status: template.errors.length ? 'VIOLATION' : 'PASS',
        message: template.errors.length
          ? `Housekeeping template is invalid: ${template.errors.join('; ')}.`
          : 'Housekeeping template has a complete lifecycle, identity, schedule, body, and linkage contract.',
        subject: template.subject
      })
      if (template.errors.length) continue
      const values = template.values
      const evaluation = evaluateHousekeepingSchedule({
        repository: root,
        today,
        schedule: {
          status: values.status as HousekeepingSchedule['status'],
          cadence: values.cadence as string,
          grace: values.grace as string,
          lastRun: values['last-run'] === 'null' ? null : (values['last-run'] as string),
          activeRun: template.activeRun,
          spawnPolicy: values['spawn-policy'] as HousekeepingSchedule['spawnPolicy'],
          ...(values['commit-threshold'] === undefined ? {} : { commitThreshold: Number(values['commit-threshold']) }),
          ...(values['last-run-ref'] === undefined
            ? {}
            : { lastRunRef: values['last-run-ref'] === 'null' ? null : values['last-run-ref'] })
        }
      })
      schedules.push({
        status: 'INFO',
        subject: template.subject,
        message: `Schedule action: ${evaluation.action}; ${evaluation.reason} Calendar due: ${evaluation.calendarDue ?? 'unknown'}; commits: ${evaluation.commits.kind === 'known' ? evaluation.commits.count : evaluation.commits.kind}. No run was created.`
      })
      if (evaluation.commits.kind === 'unknown')
        schedules.push({
          status: 'VIOLATION',
          subject: template.subject,
          message: `Change-volume evidence is unknown: ${evaluation.commits.reason} Do not infer zero commits or backfill a reviewed revision.`
        })
    }
  }
  const context: HousekeepingRubricContext = { rubric: { publication }, templates: { outcomes, schedules } }
  return { subjects: [{ families: ['HOUSE'], context: () => context }], proposal: () => ({ writes: [] }) }
}
