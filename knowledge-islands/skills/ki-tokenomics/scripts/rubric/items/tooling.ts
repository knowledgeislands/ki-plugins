import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsRubricContext, TokenomicsToolingContext } from '../contexts/user.ts'

const SOURCE = 'standards-tokenomics.md'

const TOOL_1: RubricItem<TokenomicsToolingContext> = {
  code: 'TOOL-1',
  title: 'Compression tooling is detected',
  description: 'Configured user-wide context-compression tooling is detected without changing its configuration.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.detected }
  }
}

const TOOL_2: RubricItem<TokenomicsToolingContext> = {
  code: 'TOOL-2',
  title: 'Compression expectation is honoured',
  description:
    'The default recommended compression expectation is reported as WARN when absent; a repository-selected required expectation remains a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    audit: { phase: 'INSPECT', run: (context) => context.expectation }
  }
}

const TOOL_3: RubricItem<TokenomicsToolingContext> = {
  code: 'TOOL-3',
  title: 'Compression setup is optimal',
  description: 'Where present, compression uses a sound reversible store, cache alignment, and deliberate shaping.',
  sources: [SOURCE],
  judgment: { prompt: 'Where present, is the compression setup optimal?' }
}

const TOOL_4: RubricItem<TokenomicsToolingContext> = {
  code: 'TOOL-4',
  title: 'Learned captures are local',
  description: 'The Headroom learned block contains no cross-repository captures when repository evidence is available.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.learnedCaptures }
  }
}

const TOOL_5: RubricItem<TokenomicsToolingContext> = {
  code: 'TOOL-5',
  title: 'Proxy traffic is attributed',
  description: 'Local Headroom proxy traffic is attributed to the selected repository when repository evidence is available.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.proxyAttribution }
  }
}

export const TOOL: RubricFamily<TokenomicsRubricContext, TokenomicsToolingContext> = {
  code: 'TOOL',
  title: 'Compression tooling',
  description: 'Context-compression tooling.',
  standard: SOURCE,
  selectContext: (context) => context.tooling,
  items: [TOOL_1, TOOL_2, TOOL_3, TOOL_4, TOOL_5]
}
