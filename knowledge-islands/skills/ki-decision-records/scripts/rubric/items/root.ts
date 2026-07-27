import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { DecisionRecordsRubricContext, RootRubricContext } from '../contexts/decision-records.ts'

const SOURCE = 'standards-decision-records.md'
const ADOPTION_TITLE = 'Adopting Decision Records'

const outcomes = (values: AuditOutcome[], passMessage: string): RubricOutcomes<AuditOutcome> =>
  (values.length > 0 ? values : [{ status: 'PASS', message: passMessage }]) as RubricOutcomes<AuditOutcome>

const ROOT_1: RubricItem<RootRubricContext> = {
  code: 'ROOT-1',
  title: 'Adoption root for a new collection',
  description:
    'An index marked `<!-- ki-decision-records: adoption-root -->` begins with `GDR-<SCOPE>-001: Adopting Decision Records`. Existing unmarked collections are migration cases and are not rewritten automatically.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'PREPARE',
      run: (context: RootRubricContext) => {
        if (!context.adoptionRootRequired)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'No adoption-root marker: established collections remain migration cases.',
              subject: context.indexFile
            }
          ] as const

        const firstId = context.indexIds[0]
        const first = firstId ? context.records.find((record) => record.id === firstId) : undefined
        if (!first || !/^GDR-[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-001$/.test(first.id))
          return [
            {
              status: 'VIOLATION',
              message: 'A new collection must begin its index with GDR-<SCOPE>-001: Adopting Decision Records.',
              subject: context.indexFile
            }
          ] as const
        return outcomes(
          first.headingTitle === ADOPTION_TITLE
            ? []
            : [
                {
                  status: 'VIOLATION',
                  message: `The adoption root title must be "${ADOPTION_TITLE}".`,
                  subject: first.file
                } satisfies AuditOutcome
              ],
          'The marked collection begins with its canonical Decision Records adoption root.'
        )
      }
    }
  }
}

export const ROOT: RubricFamily<DecisionRecordsRubricContext, RootRubricContext> = {
  code: 'ROOT',
  title: 'collection-root checks',
  description: 'The first Decision Record in a newly marked collection adopts the instrument itself.',
  standard: SOURCE,
  selectContext: (context) => context.root,
  items: [ROOT_1]
}
