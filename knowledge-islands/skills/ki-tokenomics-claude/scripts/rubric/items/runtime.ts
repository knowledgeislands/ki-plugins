import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ClaudeContext, ClaudeRubricContext } from '../contexts/claude.ts'

const SOURCE = 'standards-claude-tokenomics.md'
const RUN_1: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-RUN-1',
  title: 'Effective session state is unavailable',
  description:
    'Effective model, loaded context, active tools, approvals, trust, memory use, and metrics are unavailable without authorised session evidence.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Use an explicitly authorised session-evidence owner; do not infer session state from filesystem sources.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.unavailable }
  }
}
export const RUN: RubricFamily<ClaudeRubricContext, ClaudeContext> = {
  code: 'RUN',
  title: 'Claude unavailable runtime state',
  description: 'Session facts not inferred from local filesystem observations.',
  standard: SOURCE,
  selectContext: (context) => context.claude,
  items: [RUN_1]
}
