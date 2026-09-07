import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

export type GranolaRubricContext = { readonly rubric: RubricPublicationContext }

export const createGranolaSession = ({ publication }: RubricContextOptions): RubricSession<GranolaRubricContext> => {
  const context: GranolaRubricContext = { rubric: { publication } }
  return {
    subjects: [
      { families: ['ACQUIRE'], context: () => context },
      { families: ['ROUTING'], context: () => context },
      { families: ['RETIRE'], context: () => context },
      { families: ['RUBRIC'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
