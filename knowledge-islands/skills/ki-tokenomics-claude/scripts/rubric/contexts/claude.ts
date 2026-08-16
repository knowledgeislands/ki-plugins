import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import type {
  AuditOutcome,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const physical = (path: string): boolean => existsSync(path) && !lstatSync(path).isSymbolicLink()
const text = (path: string): string | undefined =>
  physical(path) && lstatSync(path).isFile() ? readFileSync(path, 'utf8') : undefined
const result = (status: AuditOutcome['status'], message: string, subject?: string): AuditOutcome => ({
  status,
  message,
  ...(subject ? { subject } : {})
})
const contained = (root: string, path: string): boolean => {
  const tail = relative(root, resolve(path))
  return tail === '' || (!tail.startsWith('..') && tail !== '..')
}
const scrubFences = (source: string): string => source.replace(/```[\s\S]*?```/g, '')
const instruction = (root: string, path: string, seen = new Set<string>(), depth = 0): readonly AuditOutcome[] => {
  const absolute = resolve(path)
  if (!contained(root, absolute) || !physical(absolute))
    return [
      result(
        'NOT_APPLICABLE',
        'Instruction source is absent, outside the selected repository, or symlinked.',
        relative(root, absolute)
      )
    ]
  if (seen.has(absolute))
    return [result('VIOLATION', 'Instruction import cycle is not counted twice.', relative(root, absolute))]
  if (depth > 12)
    return [
      result('VIOLATION', 'Instruction import depth exceeds the bounded resolver limit.', relative(root, absolute))
    ]
  seen.add(absolute)
  const source = text(absolute) ?? ''
  const values: AuditOutcome[] = [
    result('PASS', `Observed instruction source (~${Math.ceil(source.length / 4)} tok).`, relative(root, absolute))
  ]
  for (const found of scrubFences(source).matchAll(/(?:^|\s)@([./][^\s)`]+)/g)) {
    const imported = resolve(dirname(absolute), found[1] as string)
    if (!contained(root, imported) || !physical(imported))
      values.push(result('VIOLATION', `Unresolved or out-of-scope @import ${found[1]}.`, relative(root, absolute)))
    else values.push(...instruction(root, imported, seen, depth + 1))
  }
  return values
}
const json = (root: string, path: string, label: string): AuditOutcome => {
  const source = text(path)
  if (source === undefined) return result('NOT_APPLICABLE', `${label} is absent or non-physical.`, relative(root, path))
  try {
    JSON.parse(source)
    return result(
      'PASS',
      `${label} is a directly observed parseable source; values are not reported.`,
      relative(root, path)
    )
  } catch {
    return result('VIOLATION', `${label} is malformed.`, relative(root, path))
  }
}
const ruleFiles = (root: string): AuditOutcome => {
  const rules = join(root, '.claude', 'rules')
  if (!physical(rules) || !lstatSync(rules).isDirectory())
    return result('NOT_APPLICABLE', 'Project Claude rules directory is absent or non-physical.', '.claude/rules')
  const count = readdirSync(rules, { withFileTypes: true }).filter(
    (entry) => entry.isFile() && !entry.isSymbolicLink() && entry.name.endsWith('.md')
  ).length
  return result('PASS', `Observed ${count} physical project Claude rule file(s).`, '.claude/rules')
}
export type ClaudeContext = { readonly surface: readonly AuditOutcome[]; readonly unavailable: readonly AuditOutcome[] }
export type ClaudeRubricContext = { readonly rubric: RubricPublicationContext; readonly claude: ClaudeContext }
export const createClaudeSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<ClaudeRubricContext> => {
  const repo = resolve(repository)
  const context: ClaudeRubricContext = {
    rubric: { publication },
    claude: {
      surface: [
        ...instruction(repo, join(repo, 'CLAUDE.md')),
        ...instruction(repo, join(repo, '.claude', 'CLAUDE.md')),
        ruleFiles(repo),
        json(repo, join(repo, '.claude', 'settings.json'), 'Project Claude settings'),
        json(repo, join(repo, '.mcp.json'), 'Project MCP declaration')
      ],
      unavailable: [
        'Effective model and profile',
        'Loaded instruction hierarchy and imported user state',
        'Active MCP tools and approvals',
        'Memory use',
        'Trust and permission state',
        'Transcript, compaction, billing, and tool-schema token metrics'
      ].map((fact) =>
        result('NOT_APPLICABLE', `${fact} are unavailable without separately authorised session evidence.`)
      )
    }
  }
  return {
    subjects: [
      { families: ['SURF', 'RUN'], subject: repo, context: () => context },
      { families: ['RUBRIC'], subject: repo, context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
