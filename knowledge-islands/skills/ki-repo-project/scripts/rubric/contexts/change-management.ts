import type { RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { ProjectRubricContext } from '../types.ts'

export const createProjectSession = (_options: RubricContextOptions): RubricSession<ProjectRubricContext> => {
  const context: ProjectRubricContext = {}
  return {
    subjects: [{ families: ['PROJECT'], context: () => context }],
    proposal: () => ({ writes: [] })
  }
}
