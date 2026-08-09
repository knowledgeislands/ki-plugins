import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createProjectSession } from '../contexts/change-management.ts'
import type { ProjectRubricContext } from '../types.ts'
import { PRIMARY } from './selection.ts'

export default {
  contract: 1,
  name: 'ki-repo-project',
  concern: 'Project primary repository structure',
  createSession: createProjectSession,
  families: [PRIMARY]
} satisfies SkillRubricDefinition<ProjectRubricContext>
