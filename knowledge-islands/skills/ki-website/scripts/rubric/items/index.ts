import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createWebsiteSession, type WebsiteContext } from '../contexts/website.ts'
import { WEB } from './web.ts'

export default {
  contract: 1,
  name: 'ki-website',
  concern: 'Eleventy static-site build',
  createSession: createWebsiteSession,
  families: [WEB]
} satisfies SkillRubricDefinition<WebsiteContext>
