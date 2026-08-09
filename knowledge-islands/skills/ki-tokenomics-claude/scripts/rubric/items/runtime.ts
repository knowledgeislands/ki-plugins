import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ClaudeContext, ClaudeRubricContext } from '../contexts/claude.ts'

const SOURCE = 'standards-claude-tokenomics.md'
const RUN_1: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-RUN-1',
  title: 'Default and effective models are distinct',
  description:
    'The configured user default and selected-repository effective model are reported separately where documented settings expose them.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the bounded Claude settings evidence or record the selected repository model explicitly; this audit does not choose or rewrite a model.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.models }
  }
}
const RUN_2: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-RUN-2',
  title: 'Compression evidence is report-only',
  description: 'Headroom wiring may be reported, but no compression configuration or operational history is changed.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the reportable headroom evidence or its scope; do not change compression configuration or operational history through this audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.headroom }
  }
}
export const RUN: RubricFamily<ClaudeRubricContext, ClaudeContext> = {
  code: 'RUN',
  title: 'Claude runtime evidence',
  description: 'Model and compression evidence.',
  standard: SOURCE,
  selectContext: (context) => context.claude,
  items: [RUN_1, RUN_2]
}
