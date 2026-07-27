import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsRubricContext, TokenomicsRuntimeContext } from '../contexts/user.ts'

const SOURCE = 'standards-tokenomics.md'

const RUN_1: RubricItem<TokenomicsRuntimeContext> = {
  code: 'RUN-1',
  title: 'Prompt caching is effective',
  description: 'The stable prefix is cacheable and being hit.',
  sources: [SOURCE],
  judgment: { prompt: 'Is the stable prefix cacheable and being hit?' }
}

const RUN_2: RubricItem<TokenomicsRuntimeContext> = {
  code: 'RUN-2',
  title: 'Model type matches work value',
  description: 'The declared model type matches the value and difficulty of the work.',
  sources: [SOURCE],
  judgment: { prompt: 'Does the declared model type match the work value?' }
}

const RUN_3: RubricItem<TokenomicsRuntimeContext> = {
  code: 'RUN-3',
  title: 'Conversation growth is controlled',
  description: 'Compaction and sub-agent fan-out remain proportionate.',
  sources: [SOURCE],
  judgment: { prompt: 'Are compaction and sub-agent fan-out proportionate?' }
}

const RUN_4: RubricItem<TokenomicsRuntimeContext> = {
  code: 'RUN-4',
  title: 'Tool verbosity is controlled',
  description: 'Raw tool results are prevented from bloating context.',
  sources: [SOURCE],
  judgment: { prompt: 'Are raw tool results prevented from bloating context?' }
}

const RUN_5: RubricItem<TokenomicsRuntimeContext> = {
  code: 'RUN-5',
  title: 'Pinned model is reported',
  description: 'A default model pinned in user-wide settings is reported as information.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.pinnedModel }
  }
}

export const RUN: RubricFamily<TokenomicsRubricContext, TokenomicsRuntimeContext> = {
  code: 'RUN',
  title: 'Runtime levers',
  description: 'Runtime token-cost levers.',
  standard: SOURCE,
  selectContext: (context) => context.runtime,
  items: [RUN_1, RUN_2, RUN_3, RUN_4, RUN_5]
}
