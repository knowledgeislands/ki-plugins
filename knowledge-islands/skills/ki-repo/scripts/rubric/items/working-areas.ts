import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RepoRubricContext } from '../contexts/repository.ts'

type WorkingAreasRubricContext = Record<string, never>

const WORK_J1: RubricItem<WorkingAreasRubricContext> = {
  code: 'WORK-J1',
  title: 'working-area direction and lifecycle',
  description:
    'Optional +/ and -/ working areas distinguish inbound from outbound material, and retained handoffs have an owner, active disposition, reason or request, and named review trigger while resolved copies are removed.',
  sources: ['standards-repository.md'],
  judgment: {
    prompt:
      'Where +/ or -/ exists, review that it remains working material rather than a shadow canonical store or archive: each retained handoff has a receiving owner, active disposition, reason or request, and named review trigger; resolved inbound and outbound copies are removed.'
  }
}

export const WORK: RubricFamily<RepoRubricContext, WorkingAreasRubricContext> = {
  code: 'WORK',
  title: 'Working areas',
  description: 'Judgment-led review of optional inbound and outbound working material.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.workingAreas,
  items: [WORK_J1]
}
