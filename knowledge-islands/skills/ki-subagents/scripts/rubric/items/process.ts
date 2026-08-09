import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'

const PROCESS_ITEMS = [
  {
    code: 'PROC-1',
    title: 'Representative in-lane evaluation',
    description: 'The agent is exercised on representative in-lane tasks.',
    sources: [`${STANDARD}#11-process--evaluation`, 'BP', 'COM1'],
    judgment: {
      scope: 'Representative tasks within the agent’s declared lane, grounding sources, and hand-off boundary.',
      prompt: 'Exercised on representative in-lane tasks — does it stay in lane, ground itself, and defer correctly?',
      outcomes: ['conforming', 'evaluation gap', 'boundary revision required'],
      guidance:
        'Add representative evaluation evidence, refine the lane or grounding guidance, and record the required sibling hand-off where the agent should defer.'
    }
  },
  {
    code: 'PROC-2',
    title: 'Cross-model evaluation',
    description: 'The agent is tested across the models it will run under.',
    sources: [`${STANDARD}#11-process--evaluation`, 'BP'],
    judgment: {
      scope: 'Every model runtime selected for the agent and its representative evaluation results.',
      prompt: 'Tested across the models it will run under.',
      outcomes: ['conforming', 'cross-model evaluation required', 'runtime scope correction required'],
      guidance:
        'Run the representative evaluation on every selected model, or narrow the declared runtime scope to the models with evidence.'
    }
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
