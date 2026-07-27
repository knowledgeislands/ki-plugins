import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbMemoryContext, KbRubricContext } from '../contexts/kb.ts'

const SOURCE = 'standards-knowledge-base.md'

const MEM_1: RubricItem<KbMemoryContext> = {
  code: 'MEM-1',
  title: 'active-Pillar memory accuracy',
  description: 'Admin/MEMORY.md lists the Pillars actually active in the base.',
  sources: [SOURCE],
  judgment: { prompt: 'Does the memory index accurately list active Pillars?' }
}

const MEM_2: RubricItem<KbMemoryContext> = {
  code: 'MEM-2',
  title: 'always-loaded memory cascade anchor',
  description: 'Root CLAUDE.md or AGENTS.md anchors the memory cascade before substantive work.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
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
