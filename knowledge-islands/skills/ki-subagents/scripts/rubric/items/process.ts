import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'

const PROCESS_ITEMS = [
  {
    code: 'PROC-1',
    title: 'Representative in-lane evaluation',
    description: 'The agent is exercised on representative in-lane tasks.',
    sources: [`${STANDARD}#11-process--evaluation`, 'BP', 'COM1'],
    judgment: { prompt: 'Exercised on representative in-lane tasks — does it stay in lane, ground itself, and defer correctly?' }
  },
  {
    code: 'PROC-2',
    title: 'Cross-model evaluation',
    description: 'The agent is tested across the models it will run under.',
    sources: [`${STANDARD}#11-process--evaluation`, 'BP'],
    judgment: { prompt: 'Tested across the models it will run under.' }
  }
] as const

export const PROC: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'PROC',
  title: 'Process and evaluation',
  description: 'Representative and cross-model evaluation.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [...PROCESS_ITEMS] as readonly RubricItem<AgentFileContext>[]
}
