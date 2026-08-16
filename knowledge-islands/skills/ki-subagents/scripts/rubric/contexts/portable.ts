import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

export type PortableContext = { rubric: RubricPublicationContext }

export const createPortableSession = ({ publication }: RubricContextOptions): RubricSession<PortableContext> => {
  const context: PortableContext = { rubric: { publication } }
  return {
    subjects: [
      { families: ['PORTABLE', 'HOST'], context: () => context, subject: 'portable role contract' },
      { families: ['RUBRIC'], context: () => context, subject: 'ki-subagents' }
    ],
    proposal: () => ({ writes: [] })
  }
}
