import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createPluginsSession, type PluginsContext } from '../contexts/plugins.ts'
import { PLUG } from './plugins.ts'

export default {
  contract: 1,
  name: 'ki-plugins',
  concern: 'generated Claude plugin marketplace projection',
  createSession: createPluginsSession,
  families: [PLUG]
} satisfies SkillRubricDefinition<PluginsContext>
