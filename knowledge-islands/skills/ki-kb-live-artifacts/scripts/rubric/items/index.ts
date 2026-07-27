import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createLiveArtifactsSession, type LiveArtifactsRubricContext } from '../contexts/live-artifacts.ts'
import { LA_FRONTMATTER } from './frontmatter.ts'
import { LA_STRUCTURE } from './structure.ts'

export default {
  contract: 1,
  name: 'ki-kb-live-artifacts',
  concern: 'Knowledge Islands live artifacts',
  createSession: createLiveArtifactsSession,
  families: [LA_STRUCTURE, LA_FRONTMATTER]
} satisfies SkillRubricDefinition<LiveArtifactsRubricContext>
