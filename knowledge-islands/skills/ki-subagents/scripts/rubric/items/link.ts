import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'
const REVIEW = {
  scope: 'The target agent links and named skill or agent references.',
  outcomes: ['conforming', 'gap', 'exclusion'] as const,
  guidance: 'Correct the reference through the responsible author, record a gap, or record an explicit exclusion.'
}
const stripCode = (markdown: string): string => markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
const relativeLinkTargets = (markdown: string): string[] => {
  const targets: string[] = []
  const expression = /\[[^\]]*\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec loop
  while ((match = expression.exec(markdown)) !== null) {
    let target = (match[1] as string).trim()
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1).trim()
    if (/^[a-z]+:\/\//i.test(target) || target.startsWith('mailto:') || target.startsWith('#')) continue
    const hash = target.indexOf('#')
    if (hash !== -1) target = target.slice(0, hash)
    if (target) targets.push(target)
  }
  return targets
}

const LINK_ITEMS = [
  {
    code: 'LINK-1',
    title: 'Resolvable relative links',
    description: 'Relative Markdown links to bundled files resolve on disk.',
    sources: [`${STANDARD}#10-linking`, 'HOUSE'],
    mechanical: {
      level: 'FAIL',
      remediation: { class: 'diagnostic', guidance: 'Correct broken references through the responsible agent author.' },
      audit: {
        phase: 'INSPECT',
        run: (context: AgentFileContext) => {
          const agent = context.agent
          if (!agent)
            return [{ status: 'NOT_APPLICABLE' as const, message: 'No physical agent definition is available.' }]
          const broken = relativeLinkTargets(stripCode(agent.body)).filter(
            (target) => !existsSync(resolve(dirname(agent.file), target))
          )
          return broken.length > 0
            ? broken.map((target) => ({
                status: 'VIOLATION',
                message: `Broken relative link → "${target}".`,
                subject: agent.file
              }))
            : [{ status: 'PASS', message: 'Relative links resolve.', subject: agent.file }]
        }
      }
    }
  },
  {
    code: 'LINK-2',
    title: 'Allowed knowledge-base wikilinks',
    description: 'Wikilinks to knowledge-base notes are allowed in grounded agent prompts.',
    sources: [`${STANDARD}#10-linking`, 'HOUSE'],
    judgment: {
      ...REVIEW,
      prompt:
        '`[[wikilinks]]` to KB notes are allowed here (a grounded agent cites its notes) and are not a defect, unlike in a `SKILL.md`.'
    }
  },
  {
    code: 'LINK-3',
    title: 'Name-based composition references',
    description: 'Other agents and skills are referred to by name, never by file path.',
    sources: [`${STANDARD}#10-linking`, 'HOUSE'],
    judgment: { ...REVIEW, prompt: 'Other agents/skills are referred to by name, never by file path.' }
  }
] as const

export const LINK: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'LINK',
  title: 'Linking',
  description: 'Resolvable files and name-based composition.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [...LINK_ITEMS] as readonly RubricItem<AgentFileContext>[]
}
