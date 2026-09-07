import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createWebsiteCloudflareSession, type WebsiteCloudflareRubricContext } from '../contexts/website-cloudflare.ts'
import { RUBRIC } from './publication.ts'
import { WCF } from './wcf.ts'

export default {
  contract: 1,
  name: 'ki-repo-website-cloudflare',
  concern: 'Cloudflare static-site hosting',
  packageScripts: ['ki:site:deploy', 'ki:site:preview', 'ki:site:upload'],
  createSession: createWebsiteCloudflareSession,
  families: [RUBRIC, WCF]
} satisfies SkillRubricDefinition<WebsiteCloudflareRubricContext>
