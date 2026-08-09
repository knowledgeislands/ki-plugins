import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ClaudeContext, ClaudeRubricContext } from '../contexts/claude.ts'

const SOURCE = 'standards-claude-tokenomics.md'
const SURF_1: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-SURF-1',
  title: 'Selected Claude surfaces are bounded',
  description:
    'Instruction, skill, and MCP evidence comes only from the selected repository and bounded physical user layer; out-of-scope imports FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Remove out-of-scope imports from the selected evidence set or explicitly narrow the requested repository and physical user-layer boundary.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.surface }
  }
}
export const SURF: RubricFamily<ClaudeRubricContext, ClaudeContext> = {
  code: 'SURF',
  title: 'Claude standing surfaces',
  description: 'Bounded Claude Code context evidence.',
  standard: SOURCE,
  selectContext: (context) => context.claude,
  items: [SURF_1]
}
