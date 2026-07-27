import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createWebsiteCloudflareSession, type WebsiteCloudflareRubricContext } from '../contexts/website-cloudflare.ts'
import { WCF } from './wcf.ts'

export default {
  contract: 1,
  name: 'ki-website-cloudflare',
  concern: 'Cloudflare static-site hosting',
  createSession: createWebsiteCloudflareSession,
  families: [WCF]
} satisfies SkillRubricDefinition<WebsiteCloudflareRubricContext>
