import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createPluginsSession, type PluginsContext } from '../contexts/plugins.ts'
import { PLUG } from './plugins.ts'
import { RUBRIC } from './publication.ts'

export default {
  contract: 1,
  name: 'ki-repo-plugins',
  concern: 'generated Claude plugin marketplace projection',
  createSession: createPluginsSession,
  families: [PLUG, RUBRIC]
} satisfies SkillRubricDefinition<PluginsContext>
