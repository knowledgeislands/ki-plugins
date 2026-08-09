import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RepoRubricContext, WorkingAreasRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'

const WORK_1: RubricItem<WorkingAreasRubricContext> = {
  code: 'WORK-1',
  title: 'Working-area scaffold',
  description:
    'Every KI repository has the canonical generic inbound and outbound working areas and README orientation.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => context.workingAreas1 },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.ensureWorkingAreaScaffold?.()
      }
    }
  }
}

const WORK_J1: RubricItem<WorkingAreasRubricContext> = {
  code: 'WORK-J1',
  title: 'working-area direction and lifecycle',
  description:
    'The required +/ and -/ working areas distinguish temporary inbound from outbound material without becoming a shadow canonical store.',
  sources: [SOURCE],
  judgment: {
    scope: 'The repository +/ and -/ working areas and their README orientation.',
    prompt:
      'Review that +/ and -/ remain temporary directional material rather than a shadow canonical store or archive.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Move material to its canonical store, record a named gap, or record an explicit repository-level exclusion.'
  }
}

export const WORK: RubricFamily<RepoRubricContext, WorkingAreasRubricContext> = {
  code: 'WORK',
  title: 'Working areas',
  description: 'Required generic inbound and outbound working-area scaffold and direction.',
  standard: SOURCE,
  selectContext: (context) => context.workingAreas,
  items: [WORK_1, WORK_J1]
}
