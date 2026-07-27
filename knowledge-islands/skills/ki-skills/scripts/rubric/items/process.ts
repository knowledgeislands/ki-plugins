import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KiSkillsRubricContext } from '../contexts/contexts.ts'

const PROC_1: RubricItem<unknown> = {
  code: 'PROC-1',
  title: 'the skill was built evaluation-first',
  description: 'Built evaluation-first — ≥ 3 evaluation scenarios against a no-skill baseline before extensive docs.',
  sources: ['BP', 'ENG'],
  judgment: { prompt: 'Was this skill built evaluation-first with meaningful scenarios against a no-skill baseline?' }
}

const PROC_2: RubricItem<unknown> = {
  code: 'PROC-2',
  title: 'the skill has been tested across intended models and real use',
  description: 'Tested across the models it will run on (Haiku/Sonnet/Opus) and with real usage.',
  sources: ['BP'],
  judgment: { prompt: 'Has the skill been tested across its intended models and through real usage?' }
}

export const PROCESS: RubricFamily<KiSkillsRubricContext, KiSkillsRubricContext> = {
  code: 'PROC',
  title: 'Process / meta',
  description: 'Evaluation and real-usage evidence for the skill.',
  standard: 'standards-agent-skills.md#11-process--evaluation',
  selectContext: (context: KiSkillsRubricContext) => context,
  items: [PROC_1, PROC_2]
}
