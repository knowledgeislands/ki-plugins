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
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare the supported runtimes as a non-empty duplicate-free supported set, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.runtimes1, 'FAIL') }
  }
}

const RUNTIMES_2: RubricItem<RuntimesRubricContext> = {
  code: 'RUNTIMES-2',
  title: 'Runtime environment coverage',
  description:
    'Every repository declares portable tokenomics and the real housekeeping and tokenomics capabilities required by its supported runtimes.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.runtimes2, 'FAIL') },
    conform: { phase: 'PRIMARY', run: ({ requestRuntimeSkills }) => requestRuntimeSkills?.() }
  }
}

const RUNTIMES_3: RubricItem<RuntimesRubricContext> = {
  code: 'RUNTIMES-3',
  title: 'Repository-local ki-self projection',
  description:
    'An optional repository-local ki-self has one canonical .agents source and a relative Claude projection exactly when Claude Code is supported.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Restore the canonical ki-self source and applicable runtime projection, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.runtimes3, 'FAIL') }
  }
}

const RUNTIMES_J1: RubricItem<RuntimesRubricContext> = {
  code: 'RUNTIMES-J1',
  title: 'Runtime orientation split',
  description:
    'Multi-runtime repositories use a shared AGENTS.md orientation with a thin Claude import unless a justified exception applies.',
  sources: [SOURCE],
  judgment: {
    scope: 'The shared AGENTS.md and runtime-specific orientation files for every declared runtime.',
    prompt:
      'Review whether orientation is shared cleanly across the declared runtimes without duplicated or Claude-only instructions.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Consolidate shared guidance, record a named gap, or record an explicit repository-level exception.'
  }
}

export const RUNTIMES: RubricFamily<RepoRubricContext, RuntimesRubricContext> = {
  code: 'RUNTIMES',
  title: 'Runtime support',
  description: 'Declared agent-runtime support and orientation.',
  standard: SOURCE,
  selectContext: (context) => context.runtimes,
  items: [RUNTIMES_1, RUNTIMES_2, RUNTIMES_3, RUNTIMES_J1]
}
