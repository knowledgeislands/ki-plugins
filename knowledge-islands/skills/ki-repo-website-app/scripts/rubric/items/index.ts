import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createWebsiteAppSession, type WebsiteAppContext } from '../contexts/website-app.ts'
import { APP } from './app.ts'
import { RUBRIC } from './publication.ts'
export default {
  contract: 1,
  name: 'ki-repo-website-app',
  concern: 'interactive React/Vite website',
  createSession: createWebsiteAppSession,
  families: [RUBRIC, APP]
} satisfies SkillRubricDefinition<WebsiteAppContext>
