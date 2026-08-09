import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'
const REVIEW = {
  scope: 'The target agent prompt and any volatile facts it contains.',
  outcomes: ['conforming', 'gap', 'exclusion'] as const,
  guidance: 'Replace volatile facts with runtime grounding or record a named gap or explicit exclusion.'
}

const LONGEVITY_ITEMS = [
  {
    code: 'LONG-1',
    title: 'Volatile fact handling',
    description: 'Volatile facts are resolved at runtime or covered by a refresh path.',
    sources: [`${STANDARD}#12-longevity`, 'BP', 'HOUSE'],
    judgment: {
      ...REVIEW,
      prompt:
        'Volatile facts (model IDs, tool names, note paths, dated specifics) are resolved at runtime (read the live KB, prefer `model: inherit`) or covered by a refresh path — prefer grounding-at-runtime over baked-in facts.'
    }
  }
] as const

export const LONG: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'LONG',
  title: 'Longevity',
  description: 'Runtime grounding and refresh discipline.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [...LONGEVITY_ITEMS] as readonly RubricItem<AgentFileContext>[]
}
