import { resolve } from 'node:path'
import type { RubricContextOptions, RubricMode, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

export type GitRubricContext = {
  rubric?: RubricPublicationContext
  repository: string
  mode: RubricMode
}

export const createGitSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<GitRubricContext> => {
  const context: GitRubricContext = { rubric: { publication }, repository: resolve(repository), mode }
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      {
        families: ['COMMIT', 'BRANCH', 'HYGIENE', 'LOCK'],
        subject: context.repository,
        context: () => context
      }
    ],
    proposal: () => ({ writes: [] })
  }
}
