import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createWebsiteCoreSession, type WebsiteCoreContext } from '../contexts/website.ts'
import { RUBRIC } from './publication.ts'
import { SITE } from './site.ts'

export default {
  contract: 1,
  name: 'ki-repo-website',
  concern: 'generator-neutral website seam',
  createSession: createWebsiteCoreSession,
  families: [RUBRIC, SITE]
} satisfies SkillRubricDefinition<WebsiteCoreContext>
