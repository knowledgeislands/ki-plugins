import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RepoRubricContext } from '../contexts/repository.ts'

type OverrideRubricContext = Record<string, never>

const OVR_J1: RubricItem<OverrideRubricContext> = {
  code: 'OVR-J1',
  title: 'Override rationale',
  description: 'Every checks override represents a warranted repository-specific decision.',
  sources: ['standards-configuration.md'],
  judgment: { prompt: 'Review each configured override and confirm that it records a real exception rather than hiding drift.' }
}

export const OVR: RubricFamily<RepoRubricContext, OverrideRubricContext> = {
  code: 'OVR',
  title: 'Override rationale',
  description: 'Human assessment of exceptions.',
  standard: 'standards-configuration.md',
  selectContext: (context) => context.overrides,
  items: [OVR_J1]
}
