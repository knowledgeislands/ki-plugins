import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type RepoRubricContext, type RuntimesRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'

const RUNTIMES_1: RubricItem<RuntimesRubricContext> = {
  code: 'RUNTIMES-1',
  title: 'Supported runtime declaration',
  description: 'ki-repo declares a non-empty, duplicate-free list containing only supported runtimes.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.runtimes1, 'FAIL') }
  }
}

const RUNTIMES_J1: RubricItem<RuntimesRubricContext> = {
  code: 'RUNTIMES-J1',
  title: 'Runtime orientation split',
  description:
    'Multi-runtime repositories use a shared AGENTS.md orientation with a thin Claude import unless a justified exception applies.',
  sources: [SOURCE],
  judgment: {
    prompt: 'Review whether orientation is shared cleanly across the declared runtimes without duplicated or Claude-only instructions.'
  }
}

export const RUNTIMES: RubricFamily<RepoRubricContext, RuntimesRubricContext> = {
  code: 'RUNTIMES',
  title: 'Runtime support',
  description: 'Declared agent-runtime support and orientation.',
  standard: SOURCE,
  selectContext: (context) => context.runtimes,
  items: [RUNTIMES_1, RUNTIMES_J1]
}
