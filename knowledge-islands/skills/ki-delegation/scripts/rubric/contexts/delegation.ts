import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { DelegationRubricContext } from '../types.ts'

const REQUIRED_SECTIONS = ['Locked decisions', 'Escalate', 'Rounds']
const REQUIRED_WORKER_FIELDS = ['Deliverable', 'Files', 'Definition of done', 'Model', 'Verify', 'Checkpoint']

const delegationSection = (content: string): string | null => {
  const match = /^## Delegation\s*$(?<section>[\s\S]*?)(?=^##\s|$(?![\s\S]))/m.exec(content)
  return match?.groups?.section ?? null
}

const sectionHasContent = (section: string, heading: string): boolean => {
  const match = new RegExp(`^### ${heading}\\s*$([\\s\\S]*?)(?=^###\\s|^##\\s|$(?![\\s\\S]))`, 'm').exec(section)
  return Boolean(match?.[1].trim())
}

const workerSections = (section: string): string[] =>
  [...section.matchAll(/^### Worker:\s+.+$([\s\S]*?)(?=^###\s|^##\s|$(?![\s\S]))/gm)].map((match) => match[1] ?? '')

const workerHasField = (worker: string, field: string): boolean =>
  new RegExp(`^- \\*\\*${field}:\\*\\*\\s*\\S`, 'm').test(worker)

const packetOutcomes = (subject: string, section: string): AuditOutcome[] => {
  if (!/^### Rounds\s*$/m.test(section))
    return [{ status: 'NOT_APPLICABLE', message: 'The delegation note is not an opted-in delegation packet.', subject }]
  const violations: AuditOutcome[] = []
  for (const heading of REQUIRED_SECTIONS)
    if (!sectionHasContent(section, heading) && !(heading === 'Escalate' && sectionHasContent(section, 'Escalation')))
      violations.push({
        status: 'VIOLATION',
        message: `Delegation packet requires a non-empty \`${heading}\` section.`,
        subject
      })
  const workers = workerSections(section)
  if (!workers.length)
    violations.push({
      status: 'VIOLATION',
      message: 'Delegation packet requires at least one `### Worker: <name>` subsection.',
      subject
    })
  for (const worker of workers)
    for (const field of REQUIRED_WORKER_FIELDS)
      if (!workerHasField(worker, field))
        violations.push({
          status: 'VIOLATION',
          message: `Delegation worker is missing a non-empty \`${field}\` field.`,
          subject
        })
  return violations.length
    ? violations
    : [{ status: 'PASS', message: 'Delegation packet has the required durable brief structure.', subject }]
}

export const createDelegationSession = ({
  repository
}: RubricContextOptions): RubricSession<DelegationRubricContext> => {
  const root = resolve(repository)
  const roadmap = join(root, 'docs', 'roadmap')
  const outcomes: AuditOutcome[] = []

  if (!existsSync(roadmap))
    outcomes.push({ status: 'NOT_APPLICABLE', message: 'No roadmap directory is present.', subject: 'docs/roadmap' })
  else
    for (const entry of readdirSync(roadmap, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const path = join(roadmap, entry.name)
      const content = readFileSync(path, 'utf8')
      const section = delegationSection(content)
      if (!section) continue
      const subject = relative(root, path)
      outcomes.push(...packetOutcomes(subject, section))
    }

  if (!outcomes.length)
    outcomes.push({ status: 'NOT_APPLICABLE', message: 'No delegation packets are present.', subject: 'docs/roadmap' })
  const context: DelegationRubricContext = {
    packets: {
      outcomes
    }
  }
  return {
    subjects: [{ families: ['PACKET'], context: () => context }],
    proposal: () => ({ writes: [] })
  }
}
