import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbMemoryContext, KbRubricContext } from '../contexts/kb.ts'

const SOURCE = 'standards-knowledge-base.md'

const MEM_1: RubricItem<KbMemoryContext> = {
  code: 'MEM-1',
  title: 'active-Pillar memory accuracy',
  description: 'Admin/MEMORY.md lists the Pillars actually active in the base.',
  sources: [SOURCE],
  judgment: {
    scope: 'The memory index and active Pillars in the base.',
    prompt: 'Does the memory index accurately list active Pillars?',
    outcomes: ['conforming', 'memory revision', 'not applicable'],
    guidance: 'Update the owned memory index from current base evidence; do not infer active status.'
  }
}

const MEM_2: RubricItem<KbMemoryContext> = {
  code: 'MEM-2',
  title: 'always-loaded memory cascade anchor',
  description: 'Root CLAUDE.md or AGENTS.md anchors the memory cascade before substantive work.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or correct the root memory cascade anchor, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.anchor }
  }
}

export const MEM: RubricFamily<KbRubricContext, KbMemoryContext> = {
  code: 'MEM',
  title: 'memory cascade',
  description: 'Memory-index accuracy and its always-loaded anchor.',
  standard: SOURCE,
  selectContext: (context) => context.memory,
  items: [MEM_1, MEM_2]
}
