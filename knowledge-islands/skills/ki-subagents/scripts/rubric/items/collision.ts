import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentSetContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'
const REVIEW = {
  scope: 'The target agent set and overlapping delegation signals.',
  outcomes: ['conforming', 'gap', 'exclusion'] as const,
  guidance:
    'Revise reciprocal hand-offs through the responsible authors, record a gap, or record an explicit exclusion.'
}
const triggerPhrases = (description: string): string[] => {
  const phrases = new Set<string>()
  const expression = /"([^"]{2,})"/g
  let match: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec loop
  while ((match = expression.exec(description)) !== null) {
    const phrase = (match[1] as string).toLowerCase().replace(/\s+/g, ' ').trim()
    if (phrase) phrases.add(phrase)
  }
  return [...phrases]
}

const COLLISION_ITEMS = [
  {
    code: 'COLL-1',
    title: 'Distinct quoted trigger phrases',
    description: 'Within a set of at least two agents, no two descriptions declare the same quoted trigger phrase.',
    sources: [`${STANDARD}#13-cross-agent-collision`, 'HOUSE'],
    mechanical: {
      level: 'WARN',
      remediation: {
        class: 'diagnostic',
        guidance: 'Correct quoted trigger phrases or reciprocal hand-offs through the responsible agent authors.'
      },
      audit: {
        phase: 'INSPECT',
        run: (context: AgentSetContext) => {
          if (context.agents.length < 2) return result('NOT_APPLICABLE', 'Fewer than two agents are in scope.')
          const byPhrase = new Map<string, Set<string>>()
          for (const agent of context.agents)
            for (const phrase of triggerPhrases(agent.description ?? ''))
              byPhrase.set(
                phrase,
                new Set([...(byPhrase.get(phrase) ?? []), agent.name ?? agent.file.split('/').at(-1) ?? agent.file])
              )
          const shared = [...byPhrase.entries()].filter(([, agents]) => agents.size > 1)
          return shared.length > 0
            ? shared.map(
                ([phrase, agents]): AuditOutcome => ({
                  status: 'VIOLATION',
                  message: `Trigger "${phrase}" is shared by ${[...agents].sort().join(', ')} — confirm each names the other as an off-ramp (COLL-2).`
                })
              )
            : result('PASS', 'Quoted trigger phrases are distinct across the agent set.')
        }
      }
    }
  },
  {
    code: 'COLL-2',
    title: 'Reciprocal collision off-ramps',
    description: 'Agents that could take the same request name each other as off-ramps.',
    sources: [`${STANDARD}#13-cross-agent-collision`, 'HOUSE'],
    judgment: {
      ...REVIEW,
      prompt:
        'Where two agents could take one request, each names the other as the off-ramp; a one-directional guard is a half-fix.'
    }
  }
] as const

const result = (status: AuditOutcome['status'], message: string): readonly AuditOutcome[] => [{ status, message }]

export const COLL: RubricFamily<AgentsRubricContext, AgentSetContext> = {
  code: 'COLL',
  title: 'Cross-agent collision',
  description: 'Trigger collisions and reciprocal off-ramps.',
  standard: STANDARD,
  selectContext: (context) => context.set,
  items: [...COLLISION_ITEMS] as readonly RubricItem<AgentSetContext>[]
}
